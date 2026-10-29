'use strict'
/**
 * Adds the Cashfree Easy Split outcome columns to ondcOrders — which vendor a
 * seller's share was routed to, whether the split was written, and why not when
 * it wasn't.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the table
 * is absent. Every step is guarded (describeTable) so it is idempotent and
 * co-exists with the entity's ensureOndcOrdersTable() block.
 */
const ONDC_ORDERS = 'ondcOrders'

const COLUMNS = (Sequelize) => ({
  splitVendorId: { type: Sequelize.STRING, allowNull: true },
  splitStatus: { type: Sequelize.STRING, allowNull: true },
  splitAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
  splitError: { type: Sequelize.TEXT, allowNull: true },
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
