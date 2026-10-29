'use strict'

/**
 * Fixes: "Unknown column 'name' in 'field list'" from GET
 * /purchase/ecommerce/ondc/categories (admin Manage > Products > Categories).
 *
 * officeSupplyCategories is owned by this service
 * (models/entities/ondc_category.js) but shared with the scheduler, whose DB
 * config runs a global sequelize.sync({ force: false }) that creates a table for
 * every model defined in that process. A partial mirror model there won the race
 * on some environments and created the table with only id/ondcDomain/parentId/
 * enabled. sync({ force: false }) never adds columns to an existing table, so
 * this service's own boot left name, ondcMappedCategory and displayOrder absent
 * and every SELECT on the table failed.
 *
 * The scheduler no longer defines a model for this table (it reads via a raw
 * query in scheduler/models/use-cases/ondcCategory.js), so the race cannot
 * recur; this migration repairs environments already affected by it.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the table
 * is absent. Every step is guarded (describeTable) so it is idempotent and
 * co-exists with the entity's ensureTable() block (WANTED_COLUMNS).
 */

const OFFICE_SUPPLY_CATEGORIES = 'officeSupplyCategories'

// The full non-PK column set of the current entity, not just the missing ones —
// which columns survived varies per environment. NOT NULL columns carry a
// defaultValue so backfilling rows that already exist succeeds.
const COLUMNS = (Sequelize) => ({
  name: { type: Sequelize.STRING, allowNull: false, defaultValue: '' },
  ondcDomain: { type: Sequelize.STRING, allowNull: true },
  ondcMappedCategory: { type: Sequelize.STRING, allowNull: true },
  ondcCategory: { type: Sequelize.STRING, allowNull: true },
  keywords: { type: Sequelize.JSON, allowNull: true },
  // Self-FK deliberately omitted: the reference exists on freshly synced tables
  // and is not worth failing the repair of a partially created one over.
  parentId: { type: Sequelize.BIGINT, allowNull: true },
  displayOrder: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
})

const INDEXES = [
  { name: 'office_supply_categories_parent_id', fields: ['parentId'] },
  { name: 'office_supply_categories_mapped_category', fields: ['ondcMappedCategory'] },
]

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

    const existing = await queryInterface.showIndex(OFFICE_SUPPLY_CATEGORIES)
    const existingNames = new Set(existing.map((i) => i.name))
    const healed = await queryInterface.describeTable(OFFICE_SUPPLY_CATEGORIES)
    for (const idx of INDEXES) {
      if (!existingNames.has(idx.name) && idx.fields.every((f) => healed[f])) {
        await queryInterface.addIndex(OFFICE_SUPPLY_CATEGORIES, idx.fields, { name: idx.name })
      }
    }
  },

  // No down: these are the table's core columns, so dropping them would lose the
  // admin-authored category tree and re-break every query. Rolling back this
  // heal is intentionally a no-op.
  async down() {
    return Promise.resolve()
  },
}
