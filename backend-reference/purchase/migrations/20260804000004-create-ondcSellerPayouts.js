'use strict'
/**
 * Creates `ondcSellerPayouts` — the append-only ledger of every settlement-timing
 * call made to Cashfree for a seller's Easy Split share (PARK when the split is
 * written, NARROW on delivery, RELEASE when the buyer's return window closes).
 *
 * Column definitions mirror models/entities/ondc_seller_payout.js exactly, so this
 * and the boot-time ensureOndcSellerPayoutsTable() converge on the same schema
 * whichever runs first.
 *
 * House pattern: entity files create their own tables on boot via sync()/ensureTable
 * and migrations only patch. This one creates the table if absent AND patches any
 * missing column, so it is idempotent on a fresh database (migrated before first
 * boot) and after the entity has already created it.
 */
const ONDC_SELLER_PAYOUTS = 'ondcSellerPayouts'

const COLUMNS = (Sequelize) => ({
  ondcOrderId: { type: Sequelize.BIGINT, allowNull: true },
  transactionId: { type: Sequelize.STRING, allowNull: true },
  paymentRef: { type: Sequelize.STRING, allowNull: true },
  gatewayOrderId: { type: Sequelize.STRING, allowNull: true },
  splitVendorId: { type: Sequelize.STRING, allowNull: true },
  amount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },

  // PARK | NARROW | RELEASE
  action: { type: Sequelize.STRING, allowNull: false },
  requestedEligibilityDate: { type: Sequelize.DATE, allowNull: true },

  // OK | FAILED | SKIPPED
  status: { type: Sequelize.STRING, allowNull: false },
  httpStatus: { type: Sequelize.INTEGER, allowNull: true },
  responseBody: { type: Sequelize.JSON, allowNull: true },
  error: { type: Sequelize.TEXT, allowNull: true },
  logTraceId: { type: Sequelize.STRING, allowNull: true },
})

const INDEXES = [
  { name: 'ondc_seller_payouts_order', fields: ['ondcOrderId'] },
  { name: 'ondc_seller_payouts_transaction', fields: ['transactionId'] },
  { name: 'ondc_seller_payouts_vendor', fields: ['splitVendorId'] },
  { name: 'ondc_seller_payouts_action', fields: ['action', 'status'] },
]

const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_SELLER_PAYOUTS))) {
      await queryInterface.createTable(ONDC_SELLER_PAYOUTS, {
        id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
        ...COLUMNS(Sequelize),
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      })
    } else {
      const desc = await queryInterface.describeTable(ONDC_SELLER_PAYOUTS)
      for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
        // NOT NULL columns cannot be added to a populated table without a default,
        // so patch them as nullable — the entity is the authority on new rows.
        if (!desc[name]) {
          await queryInterface.addColumn(ONDC_SELLER_PAYOUTS, name, { ...definition, allowNull: true })
        }
      }
    }

    const existing = await queryInterface.showIndex(ONDC_SELLER_PAYOUTS)
    const existingNames = new Set(existing.map((i) => i.name))
    for (const idx of INDEXES) {
      if (!existingNames.has(idx.name)) {
        await queryInterface.addIndex(ONDC_SELLER_PAYOUTS, idx.fields, { name: idx.name })
      }
    }
  },

  async down(queryInterface) {
    if (await hasTable(queryInterface, ONDC_SELLER_PAYOUTS)) {
      await queryInterface.dropTable(ONDC_SELLER_PAYOUTS)
    }
  },
}
