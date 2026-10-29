'use strict'
/**
 * Adds `refundedAmount` to ondcOrders — the running total of admin-issued buyer
 * refunds, denormalised from the ondcOrderRefunds ledger (which stays authoritative).
 *
 * DECIMAL rather than a status VARCHAR on purpose: this table sits at InnoDB's
 * row-size limit with ~30 VARCHAR(255) columns, where one more 255-wide column costs
 * 1020 bytes and gets the ALTER rejected outright (that is what broke 20260804000001).
 * A DECIMAL is 6 bytes. Refund display state is derived from `refundedAmount > 0`.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations only
 * patch columns and return early if the table is absent. Guarded, so re-running is safe.
 */
const ONDC_ORDERS = 'ondcOrders'

const COLUMNS = (Sequelize) => ({
  refundedAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
})

const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_ORDERS))) return
    const desc = await queryInterface.describeTable(ONDC_ORDERS)
    for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
      if (!desc[name]) await queryInterface.addColumn(ONDC_ORDERS, name, definition)
    }
  },

  async down(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_ORDERS))) return
    const desc = await queryInterface.describeTable(ONDC_ORDERS)
    for (const name of Object.keys(COLUMNS(Sequelize))) {
      if (desc[name]) await queryInterface.removeColumn(ONDC_ORDERS, name)
    }
  },
}
