'use strict'

/**
 * Adds `visibleOnPeko` (BOOLEAN, default true) to ondcProducts — the admin-
 * controlled flag that decides whether a seller-published ONDC product is
 * shown to corporates. The admin Manage > Products catalog toggles it; the
 * corporate buyer listing (findAllOfficeSupplyProductsAndCount) filters
 * `visibleOnPeko != false` so hidden products disappear from what corporates
 * browse. It is NOT a volatile field, so it survives every seller re-ingest.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the
 * table is absent. Every step is guarded (describeTable) so it is idempotent
 * and co-exists with the entity ensureTable() block (WANTED_COLUMNS).
 */

const ONDC_PRODUCTS = 'ondcProducts'

const COLUMNS = (Sequelize) => ({
  visibleOnPeko: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
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
