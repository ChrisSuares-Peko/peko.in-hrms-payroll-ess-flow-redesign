'use strict'

/**
 * Adds `igmMeta` (JSON) to ondcIssues — the IGM 2.0 session blob (actors,
 * actions, refs, last_action_id) so follow-up /issue calls replay the seller's
 * actor ids instead of inventing them.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the table
 * is absent. Guarded with describeTable so it is idempotent.
 */

const ONDC_ISSUES = 'ondcIssues'

const COLUMNS = (Sequelize) => ({
  igmMeta: { type: Sequelize.JSON, allowNull: true },
})

const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_ISSUES))) return
    const desc = await queryInterface.describeTable(ONDC_ISSUES)
    for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
      if (!desc[name]) {
        await queryInterface.addColumn(ONDC_ISSUES, name, definition)
      }
    }
  },

  async down(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_ISSUES))) return
    const desc = await queryInterface.describeTable(ONDC_ISSUES)
    for (const name of Object.keys(COLUMNS(Sequelize))) {
      if (desc[name]) {
        await queryInterface.removeColumn(ONDC_ISSUES, name)
      }
    }
  },
}
