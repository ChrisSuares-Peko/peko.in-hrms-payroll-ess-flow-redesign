'use strict'

/**
 * One row per ONDC product identity so storefront listing can skip
 * GROUP BY MAX(id) on every request.
 *
 * Identity is COALESCE(bppId, left(bppUri)) + vendor + item — bppId is the
 * indexed STRING; bppUri is TEXT and must not be the unique key.
 *
 * Also adds the storefront / purge indexes (stock + visibility, source+updatedAt).
 */

const TABLE = 'ondcProducts'

const resolveTable = async (queryInterface) => {
  const tables = await queryInterface.showAllTables()
  return tables.find((t) => String(t).toLowerCase() === TABLE.toLowerCase()) || null
}

const IDENT_BPP = `IFNULL(NULLIF(bppId, ''), LEFT(IFNULL(bppUri, ''), 191))`
const IDENT_VENDOR = `IFNULL(ondcVendorId, '')`
const IDENT_PRODUCT = `IFNULL(ondcProductId, '')`

module.exports = {
  async up(queryInterface) {
    const table = await resolveTable(queryInterface)
    if (!table) return

    await queryInterface.sequelize.query(`
      DELETE p FROM \`${table}\` p
      INNER JOIN (
        SELECT MAX(id) AS keepId,
               ${IDENT_BPP} AS identBpp,
               ${IDENT_VENDOR} AS identVendor,
               ${IDENT_PRODUCT} AS identProduct
          FROM \`${table}\`
         GROUP BY identBpp, identVendor, identProduct
        HAVING COUNT(*) > 1
      ) d
         ON IFNULL(NULLIF(p.bppId, ''), LEFT(IFNULL(p.bppUri, ''), 191)) = d.identBpp
        AND IFNULL(p.ondcVendorId, '') = d.identVendor
        AND IFNULL(p.ondcProductId, '') = d.identProduct
        AND p.id <> d.keepId
    `)

    const desc = await queryInterface.describeTable(table)
    if (!desc.identBpp) {
      await queryInterface.sequelize.query(`
        ALTER TABLE \`${table}\`
          ADD COLUMN identBpp VARCHAR(191)
            GENERATED ALWAYS AS (${IDENT_BPP}) STORED,
          ADD COLUMN identVendor VARCHAR(191)
            GENERATED ALWAYS AS (${IDENT_VENDOR}) STORED,
          ADD COLUMN identProduct VARCHAR(191)
            GENERATED ALWAYS AS (${IDENT_PRODUCT}) STORED
      `)
    }

    const existing = await queryInterface.showIndex(table)
    const names = new Set(existing.map((i) => i.name))
    const addIndex = async (name, fields, unique = false) => {
      if (names.has(name)) return
      await queryInterface.addIndex(table, fields, { name, unique })
    }
    await addIndex('ondc_products_identity_unique', ['identBpp', 'identVendor', 'identProduct'], true)
    await addIndex('ondc_products_storefront', ['availableQuantity', 'visibleOnPeko', 'category'])
    await addIndex('ondc_products_source_updated', ['source', 'updatedAt'])
    await addIndex('ondc_products_local_category', ['localCategory'])
  },

  async down(queryInterface) {
    const table = await resolveTable(queryInterface)
    if (!table) return
    const existing = await queryInterface.showIndex(table)
    const names = new Set(existing.map((i) => i.name))
    for (const name of [
      'ondc_products_identity_unique',
      'ondc_products_storefront',
      'ondc_products_source_updated',
      'ondc_products_local_category',
    ]) {
      if (names.has(name)) await queryInterface.removeIndex(table, name)
    }
    const desc = await queryInterface.describeTable(table)
    if (desc.identProduct) await queryInterface.removeColumn(table, 'identProduct')
    if (desc.identVendor) await queryInterface.removeColumn(table, 'identVendor')
    if (desc.identBpp) await queryInterface.removeColumn(table, 'identBpp')
  },
}
