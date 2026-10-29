'use strict'

/**
 * Adds the on_status/on_track columns to ondcOrders: `tracking` (JSON — the
 * verbatim on_track `message.tracking` block: id, location {gps, time,
 * updated_at}, url, status, tags) plus `statusCheckedAt` / `trackingCheckedAt`
 * (DATE — server-clock timestamp of the last persisted on_status / on_track
 * callback; lets getOndcOrderById throttle repeat outbound /status /track
 * calls and gives the Order Details page a reliable "tracking last updated"
 * time).
 *
 * orderState and fulfillments are EXISTING columns — no schema change is
 * needed to make them updatable; on_status now overwrites them (see
 * updateOndcOrderStatus in models/use-cases/ondc_order.js) instead of them
 * being write-once from /confirm.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the table
 * is absent. Every step is guarded (describeTable) so it is idempotent and
 * co-exists with the entity ensureTable() block.
 */

const ONDC_ORDERS = 'ondcOrders'

const COLUMNS = (Sequelize) => ({
  tracking: { type: Sequelize.JSON, allowNull: true },
  statusCheckedAt: { type: Sequelize.DATE, allowNull: true },
  trackingCheckedAt: { type: Sequelize.DATE, allowNull: true },
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
