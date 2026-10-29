'use strict'

/**
 * Append-only statusHistory JSON on ondcOrders — every order.state and
 * Delivery/Return fulfillment code we have seen, so Track/status UI can show
 * the full flow instead of only the latest overwritten fulfillments snapshot.
 */

const ONDC_ORDERS = 'ondcOrders'

const COLUMNS = (Sequelize) => ({
  statusHistory: { type: Sequelize.JSON, allowNull: true },
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
      if (!desc[name]) {
        await queryInterface.addColumn(ONDC_ORDERS, name, definition)
      }
    }
  },

  async down(queryInterface) {
    if (!(await hasTable(queryInterface, ONDC_ORDERS))) return
    const desc = await queryInterface.describeTable(ONDC_ORDERS)
    if (desc.statusHistory) {
      await queryInterface.removeColumn(ONDC_ORDERS, 'statusHistory')
    }
  },
}
