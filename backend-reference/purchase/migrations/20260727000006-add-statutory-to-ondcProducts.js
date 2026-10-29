'use strict'

/**
 * Adds `statutory` JSON to ondcProducts — ONDC statutory requirement blocks
 * from catalog items (manufacturer, etc.) for the admin product detail page.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the table
 * is absent. Every step is guarded (describeTable) so it is idempotent.
 */

const ONDC_PRODUCTS = 'ondcProducts'

const COLUMNS = (Sequelize) => ({
  statutory: { type: Sequelize.JSON, allowNull: true },
})

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
