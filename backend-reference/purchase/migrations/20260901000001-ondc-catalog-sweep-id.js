'use strict'

/**
 * catalogSweepId ties a catalog_full search to the product rows it ingested
 * so a delayed reconcile can drop SKUs that snapshot did not send.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; this
 * migration is idempotent and co-exists with WANTED_COLUMNS.
 */

const PRODUCT_TABLE = 'ondcProducts'
const SEARCH_TABLE = 'userSearchOndc'

const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

const addStringColumn = async (queryInterface, Sequelize, table, column) => {
  const desc = await queryInterface.describeTable(table)
  if (desc[column]) return
  await queryInterface.addColumn(table, column, {
    type: Sequelize.STRING,
    allowNull: true,
  })
}

const addIndexIfMissing = async (queryInterface, table, name, fields) => {
  const existing = await queryInterface.showIndex(table)
  if (existing.some((i) => i.name === name)) return
  await queryInterface.addIndex(table, fields, { name })
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (await hasTable(queryInterface, PRODUCT_TABLE)) {
      await addStringColumn(queryInterface, Sequelize, PRODUCT_TABLE, 'catalogSweepId')
      await addIndexIfMissing(queryInterface, PRODUCT_TABLE, 'ondc_products_catalog_sweep', ['catalogSweepId'])
    }
    if (await hasTable(queryInterface, SEARCH_TABLE)) {
      await addStringColumn(queryInterface, Sequelize, SEARCH_TABLE, 'catalogSweepId')
      await addIndexIfMissing(queryInterface, SEARCH_TABLE, 'user_search_ondc_city_domain', ['city', 'ondcDomain'])
    }
  },

  async down(queryInterface) {
    if (await hasTable(queryInterface, PRODUCT_TABLE)) {
      const pIdx = await queryInterface.showIndex(PRODUCT_TABLE)
      if (pIdx.some((i) => i.name === 'ondc_products_catalog_sweep')) {
        await queryInterface.removeIndex(PRODUCT_TABLE, 'ondc_products_catalog_sweep')
      }
      const pDesc = await queryInterface.describeTable(PRODUCT_TABLE)
      if (pDesc.catalogSweepId) await queryInterface.removeColumn(PRODUCT_TABLE, 'catalogSweepId')
    }
    if (await hasTable(queryInterface, SEARCH_TABLE)) {
      const sIdx = await queryInterface.showIndex(SEARCH_TABLE)
      if (sIdx.some((i) => i.name === 'user_search_ondc_city_domain')) {
        await queryInterface.removeIndex(SEARCH_TABLE, 'user_search_ondc_city_domain')
      }
      const sDesc = await queryInterface.describeTable(SEARCH_TABLE)
      if (sDesc.catalogSweepId) await queryInterface.removeColumn(SEARCH_TABLE, 'catalogSweepId')
    }
  },
}
