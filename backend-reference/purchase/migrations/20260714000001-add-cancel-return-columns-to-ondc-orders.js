'use strict'

/**
 * Adds the admin-triggered cancellation/return columns to ondcOrders:
 * `cancelReason`/`cancelledAt` and `returnReason`/`returnedAt` (STRING/DATE) —
 * set once the seller's on_cancel/on_update callback confirms the request
 * (see updateOndcOrderCancellation / updateOndcOrderReturn in
 * models/use-cases/ondc_order.js). `orderState` (existing column) is set to
 * "Cancelled"/"Returned" at the same time.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the
 * table is absent. Every step is guarded (describeTable) so it is idempotent
 * and co-exists with the entity ensureTable() block.
 */

const ONDC_ORDERS = 'ondcOrders'

const COLUMNS = (Sequelize) => ({
  cancelReason: { type: Sequelize.STRING, allowNull: true },
  cancelledAt: { type: Sequelize.DATE, allowNull: true },
  returnReason: { type: Sequelize.STRING, allowNull: true },
  returnedAt: { type: Sequelize.DATE, allowNull: true },
})

// MySQL on case-insensitive filesystems (lower_case_table_names=1, e.g. Windows)
// reports table names lowercased by showAllTables() — compare case-insensitively.
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

  async down(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_ORDERS))) return
    const desc = await queryInterface.describeTable(ONDC_ORDERS)
    for (const name of Object.keys(COLUMNS(Sequelize))) {
      if (desc[name]) {
        await queryInterface.removeColumn(ONDC_ORDERS, name)
      }
    }
  },
}
