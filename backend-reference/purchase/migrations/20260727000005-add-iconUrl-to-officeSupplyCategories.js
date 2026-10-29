'use strict'

/**
 * Adds `iconUrl` to officeSupplyCategories — a CDN URL for the parent
 * category icon shown on the corporate office-supplies category bar.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the table
 * is absent. Every step is guarded (describeTable) so it is idempotent and
 * co-exists with the entity's ensureTable() block.
 */

const OFFICE_SUPPLY_CATEGORIES = 'officeSupplyCategories'

const COLUMNS = (Sequelize) => ({
  iconUrl: { type: Sequelize.STRING, allowNull: true },
})

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
