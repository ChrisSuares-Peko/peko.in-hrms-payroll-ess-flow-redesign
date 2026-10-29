'use strict'

/**
 * Adds the catalog-item detail columns to ondcProducts that the on_search
 * webhook now ingests: minimum order quantity (quantity.minimum.count) and the
 * @ondc/org/* item policy fields (returnable, cancellable, return_window,
 * time_to_ship, contact_details_consumer_care). These power the PDP's real
 * (non-hardcoded) detail rows and the min/max quantity input.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the table
 * is absent. Every step is guarded (describeTable) so it is idempotent and
 * co-exists with the entity ensureTable() blocks.
 */

const ONDC_PRODUCTS = 'ondcProducts'

const COLUMNS = (Sequelize) => ({
  minQuantity: { type: Sequelize.INTEGER, allowNull: true },
  returnable: { type: Sequelize.BOOLEAN, allowNull: true },
  cancellable: { type: Sequelize.BOOLEAN, allowNull: true },
  returnWindow: { type: Sequelize.STRING, allowNull: true },
  timeToShip: { type: Sequelize.STRING, allowNull: true },
  consumerCare: { type: Sequelize.TEXT, allowNull: true },
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
