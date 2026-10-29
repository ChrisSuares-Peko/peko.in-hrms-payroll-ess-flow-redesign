'use strict'

/**
 * Adds the ONDC office-supply columns to the (sync-created) ondcProducts and
 * userSearchOndcs tables, plus the source indexes the office-supply "show" query
 * and webhook stamping rely on.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the table
 * is absent. Every step is guarded (describeTable / showIndex) so it is
 * idempotent and co-exists with the entity ensureTable() blocks.
 *
 * NOTE: the reshaped *core* columns (e.g. ondcProductId) are healed by a
 * separate later migration (…000002) so it runs even if this one already ran.
 */

const ONDC_PRODUCTS = 'ondcProducts'
const USER_SEARCH = 'userSearchOndcs'

const COLUMNS = {
  [ONDC_PRODUCTS]: ['city', 'localCategory', 'ondcCategory', 'ondcDomain', 'source'],
  [USER_SEARCH]: ['source', 'localCategory', 'ondcCategory', 'ondcDomain'],
}

const INDEXES = {
  [ONDC_PRODUCTS]: [
    { name: 'ondc_products_source', fields: ['source'] },
    { name: 'ondc_products_source_product', fields: ['source', 'ondcProductId'] },
  ],
  [USER_SEARCH]: [
    { name: 'user_search_ondc_source', fields: ['source'] },
  ],
}

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const table of [ONDC_PRODUCTS, USER_SEARCH]) {
      const tables = await queryInterface.showAllTables()
      if (!tables.includes(table)) continue
      const desc = await queryInterface.describeTable(table)
      for (const name of COLUMNS[table]) {
        if (!desc[name]) {
          await queryInterface.addColumn(table, name, { type: Sequelize.STRING, allowNull: true })
        }
      }
      const existing = await queryInterface.showIndex(table)
      const existingNames = new Set(existing.map((i) => i.name))
      const desc2 = await queryInterface.describeTable(table)
      for (const idx of INDEXES[table]) {
        if (!existingNames.has(idx.name) && idx.fields.every((f) => desc2[f])) {
          await queryInterface.addIndex(table, idx.fields, { name: idx.name })
        }
      }
    }
  },

  async down(queryInterface) {
    for (const table of [ONDC_PRODUCTS, USER_SEARCH]) {
      const tables = await queryInterface.showAllTables()
      if (!tables.includes(table)) continue
      const existing = await queryInterface.showIndex(table)
      const existingNames = new Set(existing.map((i) => i.name))
      for (const idx of INDEXES[table]) {
        if (existingNames.has(idx.name)) {
          await queryInterface.removeIndex(table, idx.name)
        }
      }
      const desc = await queryInterface.describeTable(table)
      for (const name of COLUMNS[table]) {
        if (desc[name]) {
          await queryInterface.removeColumn(table, name)
        }
      }
    }
  },
}
