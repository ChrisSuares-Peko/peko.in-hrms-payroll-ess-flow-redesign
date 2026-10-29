'use strict'
/**
 * Creates `ondcOrderRefunds` — the append-only ledger of admin-issued buyer refunds
 * on ONDC orders, one row per Cashfree refund attempt.
 *
 * The UNIQUE index on `refundId` is load-bearing, not decorative: the refund service
 * mints that id deterministically from (order, prior refunded total) and inserts it
 * BEFORE calling Cashfree, so a replayed request collides here and is stopped instead
 * of moving money twice. If this index is missing, the double-refund guard is gone.
 *
 * Column definitions mirror models/entities/ondc_order_refund.js exactly, so this and
 * the boot-time ensureOndcOrderRefundsTable() converge whichever runs first.
 */
const ONDC_ORDER_REFUNDS = 'ondcOrderRefunds'

const COLUMNS = (Sequelize) => ({
  ondcOrderId: { type: Sequelize.BIGINT, allowNull: false },
  transactionId: { type: Sequelize.STRING, allowNull: true },
  paymentRef: { type: Sequelize.STRING, allowNull: true },
  refundId: { type: Sequelize.STRING(120), allowNull: false },

  amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
  reason: { type: Sequelize.TEXT, allowNull: true },

  // PENDING | OK | FAILED
  status: { type: Sequelize.STRING(16), allowNull: false },
  gatewayRefundStatus: { type: Sequelize.STRING(24), allowNull: true },
  responseBody: { type: Sequelize.JSON, allowNull: true },
  error: { type: Sequelize.TEXT, allowNull: true },

  initiatedByUserId: { type: Sequelize.INTEGER, allowNull: true },
  logTraceId: { type: Sequelize.STRING, allowNull: true },
})

const INDEXES = [
  { name: 'ondc_order_refunds_refund_id', fields: ['refundId'], unique: true },
  { name: 'ondc_order_refunds_order', fields: ['ondcOrderId'] },
  { name: 'ondc_order_refunds_payment_ref', fields: ['paymentRef'] },
]

const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_ORDER_REFUNDS))) {
      await queryInterface.createTable(ONDC_ORDER_REFUNDS, {
        id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
        ...COLUMNS(Sequelize),
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      })
    } else {
      const desc = await queryInterface.describeTable(ONDC_ORDER_REFUNDS)
      for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
        // NOT NULL columns can't be added to a populated table without a default,
        // so patch them as nullable — the entity is the authority on new rows.
        if (!desc[name]) {
          await queryInterface.addColumn(ONDC_ORDER_REFUNDS, name, { ...definition, allowNull: true })
        }
      }
    }

    const existing = await queryInterface.showIndex(ONDC_ORDER_REFUNDS)
    const existingNames = new Set(existing.map((i) => i.name))
    for (const idx of INDEXES) {
      if (!existingNames.has(idx.name)) {
        await queryInterface.addIndex(ONDC_ORDER_REFUNDS, idx.fields, {
          name: idx.name,
          unique: idx.unique || false,
        })
      }
    }
  },

  async down(queryInterface) {
    if (await hasTable(queryInterface, ONDC_ORDER_REFUNDS)) {
      await queryInterface.dropTable(ONDC_ORDER_REFUNDS)
    }
  },
}
