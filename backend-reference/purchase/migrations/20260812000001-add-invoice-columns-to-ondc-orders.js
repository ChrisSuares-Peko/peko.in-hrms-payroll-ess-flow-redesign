'use strict'

/**
 * Adds the invoice columns to ondcOrders: `documents` (JSON — the verbatim
 * on_status `message.order.documents` array, [{ url, label }], where the seller's
 * invoice arrives as label "Invoice") and `invoiceEmailSentAt` (DATE — the
 * send-once lock for the invoice mail, claimed with a compare-and-set from NULL).
 *
 * The lock is not optional: on_status repeats on every delivery-poll cycle carrying
 * the same documents, so without it the buyer is mailed the same invoice hourly.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations only
 * patch columns onto already-existing tables and return early if the table is
 * absent. Every step is guarded (describeTable) so it is idempotent and co-exists
 * with the entity ensureTable() block.
 */

const ONDC_ORDERS = 'ondcOrders'

const COLUMNS = (Sequelize) => ({
  documents: { type: Sequelize.JSON, allowNull: true },
  invoiceEmailSentAt: { type: Sequelize.DATE, allowNull: true },
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
