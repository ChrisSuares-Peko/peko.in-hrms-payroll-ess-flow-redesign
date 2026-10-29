'use strict'

/**
 * Fixes: "Unknown column 'ondcProductId' in 'group statement'".
 *
 * The ondcProducts table was first created with an earlier column set and the
 * entity was later reshaped (itemId/providerId/... -> ondcProductId/ondcVendorId/
 * vendorName/uom/... ). sync({force:false}) never alters existing columns, so the
 * physical table is missing the reshaped core columns. This migration adds any
 * that are absent (as nullable, safe on populated tables) and ensures the
 * ondcProductId / transactionId indexes exist.
 *
 * Separate from …000001 so it runs even if that migration was already applied.
 * Idempotent: every column/index is guarded; re-running is a no-op.
 */

const ONDC_PRODUCTS = 'ondcProducts'
const USER_SEARCH = 'userSearchOndcs'

// Reshaped core columns expected by the current entity (id/transactionId/
// timestamps already exist; office-supply columns are handled in …000001).
const CORE_COLUMNS = (Sequelize) => ({
  [ONDC_PRODUCTS]: {
    ondcVendorId: Sequelize.STRING,
    vendorName: Sequelize.STRING,
    vendorSymbol: Sequelize.TEXT,
    ondcProductId: Sequelize.STRING,
    name: Sequelize.STRING,
    symbol: Sequelize.TEXT,
    shortDesc: Sequelize.TEXT,
    longDesc: Sequelize.TEXT,
    images: Sequelize.JSON,
    uom: Sequelize.STRING,
    measureValue: Sequelize.STRING,
    availableQuantity: Sequelize.INTEGER,
    maxQuantity: Sequelize.INTEGER,
    price: Sequelize.DECIMAL(12, 2),
    maxPrice: Sequelize.DECIMAL(12, 2),
    categoryId: Sequelize.STRING,
    tags: Sequelize.JSON,
  },
  [USER_SEARCH]: {
    messageId: Sequelize.STRING,
    search: Sequelize.STRING,
  },
})

const INDEXES = {
  [ONDC_PRODUCTS]: [
    { name: 'ondc_products_transaction_id', fields: ['transactionId'] },
    { name: 'ondc_products_product_id', fields: ['ondcProductId'] },
  ],
  [USER_SEARCH]: [
    { name: 'user_search_ondc_transaction_id', fields: ['transactionId'] },
  ],
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const specs = CORE_COLUMNS(Sequelize)
    for (const table of [ONDC_PRODUCTS, USER_SEARCH]) {
      const tables = await queryInterface.showAllTables()
      if (!tables.includes(table)) continue

      const desc = await queryInterface.describeTable(table)
      for (const [name, type] of Object.entries(specs[table])) {
        if (!desc[name]) {
          await queryInterface.addColumn(table, name, { type, allowNull: true })
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

  // No down: these are base/core columns; dropping them would lose data and
  // break the app. Rolling back this heal is intentionally a no-op.
  async down() {
    return Promise.resolve()
  },
}
