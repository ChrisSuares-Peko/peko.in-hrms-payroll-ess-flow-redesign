'use strict'

/**
 * Adds `cancellationTerms` (JSON) to ondcOrders — the seller's declared
 * per-fulfillment-state cancellation fee schedule (order.cancellation_terms),
 * captured at /confirm and refreshed on every on_status (see
 * updateOndcOrderStatus in models/use-cases/ondc_order.js and
 * getApplicableCancellationFee in utils/ondc_helper.js).
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the
 * table is absent. Every step is guarded (describeTable) so it is idempotent
 * and co-exists with the entity ensureTable() block.
 */

const ONDC_ORDERS = 'ondcOrders'

const COLUMNS = (Sequelize) => ({
  cancellationTerms: { type: Sequelize.JSON, allowNull: true },
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
