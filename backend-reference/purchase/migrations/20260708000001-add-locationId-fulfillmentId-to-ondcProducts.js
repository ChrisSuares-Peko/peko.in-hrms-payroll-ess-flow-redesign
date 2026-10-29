'use strict'

/**
 * Adds the ONDC /select correlation columns to ondcProducts that the on_search
 * webhook now ingests: locationId (items[].location_id — same id as
 * bpp/providers[].locations[].id, needed as both the order-level provider
 * location and the item-level location_id in /select) and fulfillmentId
 * (items[].fulfillment_id, e.g. "F1"). Without these the cart cannot build a
 * /select payload.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the table
 * is absent. Every step is guarded (describeTable) so it is idempotent and
 * co-exists with the entity ensureTable() blocks.
 */

const ONDC_PRODUCTS = 'ondcProducts'

const COLUMNS = (Sequelize) => ({
  locationId: { type: Sequelize.STRING, allowNull: true },
  fulfillmentId: { type: Sequelize.STRING, allowNull: true },
})

// MySQL on case-insensitive filesystems (lower_case_table_names=1, e.g. Windows)
// reports table names lowercased by showAllTables() — compare case-insensitively.
const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_PRODUCTS))) return
    const desc = await queryInterface.describeTable(ONDC_PRODUCTS)
    for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
      if (!desc[name]) {
        await queryInterface.addColumn(ONDC_PRODUCTS, name, definition)
      }
    }
  },

  async down(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_PRODUCTS))) return
    const desc = await queryInterface.describeTable(ONDC_PRODUCTS)
    for (const name of Object.keys(COLUMNS(Sequelize))) {
      if (desc[name]) {
        await queryInterface.removeColumn(ONDC_PRODUCTS, name)
      }
    }
  },
}
