'use strict'
/**
 * Records WHO bore each ONDC refund: the seller's Easy Split allocation, Peko, or both.
 *
 * Refunds now carry Cashfree's `refund_splits`, which debits a named vendor's balance
 * instead of taking the whole amount off the merchant. These columns are what makes
 * that auditable and cappable — `vendorAmount` is summed across the ledger so a second
 * refund can never debit a vendor more than the split allocated them.
 *
 * `splitVendorId` is null when the refund was unattributed: the order had no split
 * (SKIPPED/FAILED), or the merchant account rejected `refund_splits` and the gateway
 * retried without it. In both cases Peko bore all of it, and `merchantAmount` says so.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations only
 * patch columns and return early if the table is absent. Guarded, so re-running is safe.
 */
const ONDC_ORDER_REFUNDS = 'ondcOrderRefunds'

const COLUMNS = (Sequelize) => ({
  splitVendorId: { type: Sequelize.STRING, allowNull: true },
  vendorAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  merchantAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
})

const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_ORDER_REFUNDS))) return
    const desc = await queryInterface.describeTable(ONDC_ORDER_REFUNDS)
    for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
      if (!desc[name]) await queryInterface.addColumn(ONDC_ORDER_REFUNDS, name, definition)
    }

    // Any refund written before this change was borne entirely by Peko — it was sent
    // without refund_splits. Backfill so `vendorAmount + merchantAmount = amount` holds
    // for every row and the vendor cap does not under-count.
    if (!desc.merchantAmount) {
      await queryInterface.sequelize.query(`
        UPDATE \`${ONDC_ORDER_REFUNDS}\`
           SET \`merchantAmount\` = \`amount\`, \`vendorAmount\` = 0
         WHERE \`status\` <> 'FAILED'
      `)
    }
  },

  async down(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_ORDER_REFUNDS))) return
    const desc = await queryInterface.describeTable(ONDC_ORDER_REFUNDS)
    for (const name of Object.keys(COLUMNS(Sequelize))) {
      if (desc[name]) await queryInterface.removeColumn(ONDC_ORDER_REFUNDS, name)
    }
  },
}
