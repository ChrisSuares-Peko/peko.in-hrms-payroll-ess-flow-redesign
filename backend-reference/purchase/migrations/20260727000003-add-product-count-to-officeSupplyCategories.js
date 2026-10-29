'use strict'

/**
 * Adds the denormalized product-count snapshot to officeSupplyCategories:
 * `productCount` plus `productCountUpdatedAt`.
 *
 * The admin categories endpoint used to compute these counts per request — a
 * full-table MAX(id) dedup of ondcProducts followed by one COUNT per category
 * and per subcategory, each inlining every product id as an IN list and dozens
 * of un-indexable REGEXP predicates. They are now recomputed off the request
 * path by refreshCategoryProductCounts (models/use-cases/ondc_category.js),
 * debounced after on_search ingestion, and simply read back from these columns.
 *
 * Rows start at 0 and are corrected by the first refresh after deploy.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the table
 * is absent. Every step is guarded (describeTable) so it is idempotent and
 * co-exists with the entity's ensureTable() block (WANTED_COLUMNS).
 */

const OFFICE_SUPPLY_CATEGORIES = 'officeSupplyCategories'

const COLUMNS = (Sequelize) => ({
  productCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  productCountUpdatedAt: { type: Sequelize.DATE, allowNull: true },
})

// MySQL on case-insensitive filesystems (lower_case_table_names=1, e.g. Windows)
// reports table names lowercased by showAllTables() — compare case-insensitively.
const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, OFFICE_SUPPLY_CATEGORIES))) return
    const desc = await queryInterface.describeTable(OFFICE_SUPPLY_CATEGORIES)
    for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
      if (!desc[name]) {
        await queryInterface.addColumn(OFFICE_SUPPLY_CATEGORIES, name, definition)
      }
    }
  },

  // Safe to reverse: these hold a derived snapshot, not source data. Dropping
  // them loses nothing that the next refresh cannot rebuild.
  async down(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, OFFICE_SUPPLY_CATEGORIES))) return
    const desc = await queryInterface.describeTable(OFFICE_SUPPLY_CATEGORIES)
    for (const name of Object.keys(COLUMNS(Sequelize))) {
      if (desc[name]) {
        await queryInterface.removeColumn(OFFICE_SUPPLY_CATEGORIES, name)
      }
    }
  },
}
