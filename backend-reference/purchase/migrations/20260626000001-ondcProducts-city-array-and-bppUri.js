'use strict'

/**
 * Makes ondcProducts.city a JSON array and adds bppUri / bppId, so a product
 * (identity = bppUri + ondcVendorId + ondcProductId) seen in multiple cities is
 * one row whose `city` array accumulates the city codes.
 *
 * Guarded/idempotent (showAllTables / describeTable). MySQL-specific.
 */

const TABLE = 'ondcProducts'
const VENDOR_PRODUCT_INDEX = 'ondc_products_vendor_product'

module.exports = {
  async up(queryInterface, Sequelize) {
    // case-insensitive: MySQL with lower_case_table_names reports lowercase names
    const tables = await queryInterface.showAllTables()
    if (!tables.some((t) => String(t).toLowerCase() === TABLE.toLowerCase())) return

    const desc = await queryInterface.describeTable(TABLE)

    // 1) new columns
    if (!desc.bppUri) {
      await queryInterface.addColumn(TABLE, 'bppUri', { type: Sequelize.TEXT, allowNull: true })
    }
    if (!desc.bppId) {
      await queryInterface.addColumn(TABLE, 'bppId', { type: Sequelize.STRING, allowNull: true })
    }

    // 2) convert `city` (VARCHAR) -> JSON array, only if not already JSON
    const cityType = (desc.city && String(desc.city.type || '')).toUpperCase()
    if (desc.city && cityType !== 'JSON') {
      await queryInterface.sequelize.query(
        `UPDATE \`${TABLE}\` SET city = NULL WHERE city = '';`
      )
      // wrap each plain code into a one-element JSON array string: 'std:080' -> '["std:080"]'
      // (skip values already stored as JSON-array strings to avoid double-wrapping)
      await queryInterface.sequelize.query(
        `UPDATE \`${TABLE}\` SET city = JSON_ARRAY(city) WHERE city IS NOT NULL AND city NOT LIKE '[%';`
      )
      await queryInterface.sequelize.query(
        `ALTER TABLE \`${TABLE}\` MODIFY COLUMN city JSON NULL;`
      )
    }

    // 3) index to speed the upsert lookup
    const existing = await queryInterface.showIndex(TABLE)
    if (!existing.some((i) => i.name === VENDOR_PRODUCT_INDEX)) {
      await queryInterface.addIndex(TABLE, ['ondcVendorId', 'ondcProductId'], {
        name: VENDOR_PRODUCT_INDEX,
      })
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables()
    if (!tables.some((t) => String(t).toLowerCase() === TABLE.toLowerCase())) return

    const desc = await queryInterface.describeTable(TABLE)

    const existing = await queryInterface.showIndex(TABLE)
    if (existing.some((i) => i.name === VENDOR_PRODUCT_INDEX)) {
      await queryInterface.removeIndex(TABLE, VENDOR_PRODUCT_INDEX)
    }

    // best-effort: collapse the array back to its first element, then VARCHAR
    const cityType = (desc.city && String(desc.city.type || '')).toUpperCase()
    if (desc.city && cityType === 'JSON') {
      await queryInterface.sequelize.query(
        `UPDATE \`${TABLE}\` SET city = JSON_UNQUOTE(JSON_EXTRACT(city, '$[0]')) WHERE city IS NOT NULL;`
      )
      await queryInterface.sequelize.query(
        `ALTER TABLE \`${TABLE}\` MODIFY COLUMN city VARCHAR(255) NULL;`
      )
    }

    if (desc.bppUri) await queryInterface.removeColumn(TABLE, 'bppUri')
    if (desc.bppId) await queryInterface.removeColumn(TABLE, 'bppId')
  },
}
