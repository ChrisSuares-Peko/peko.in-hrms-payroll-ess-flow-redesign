'use strict'

/**
 * Adds `categoryMatchScore` (INTEGER) to ondcProducts — the count of
 * ondc_category.json keywords matched against the product's name by
 * classifyProductCategory (utils/ondc_helper.js), used to set
 * localCategory/ondcCategory on the on_search webhook
 * (controllers/webhook/ondc.js onSearch). Null when nothing matched (those
 * fields then came from the triggering search's registry row instead).
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the
 * table is absent. Every step is guarded (describeTable) so it is idempotent
 * and co-exists with the entity ensureTable() block.
 */

const ONDC_PRODUCTS = 'ondcProducts'

const COLUMNS = (Sequelize) => ({
  categoryMatchScore: { type: Sequelize.INTEGER, allowNull: true },
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
