'use strict'

/**
 * Adds the buyer-finder-fee audit pair to ondcOrders.
 *
 * `splitAmount` is what Cashfree actually allocated to the seller, and once the
 * finder-fee deduction is enabled that becomes NET of the fee. Without these two
 * columns, rows written before and after the deduction are indistinguishable —
 * and `splitAmount` alone can no longer answer "what did the seller quote?".
 *
 *   splitGrossAmount - buyerFinderFeeDeducted === splitAmount
 *
 * Existing rows keep splitGrossAmount NULL (the fee did not exist when they were
 * written) and buyerFinderFeeDeducted 0.
 *
 * House pattern: tables are created by sync()/ensureTable on boot; migrations
 * only patch columns onto already-existing tables and return early if the
 * table is absent. Every step is guarded (describeTable) so it is idempotent
 * and co-exists with the entity's ensureTable() block (WANTED_COLUMNS).
 */

const ONDC_ORDERS = 'ondcOrders'

const COLUMNS = (Sequelize) => ({
  splitGrossAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
  buyerFinderFeeDeducted: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
})

const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_ORDERS))) return
    const desc = await queryInterface.describeTable(ONDC_ORDERS)
    for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
      if (!desc[name]) {
        await queryInterface.addColumn(ONDC_ORDERS, name, definition)
      }
    }
  },

  async down(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_ORDERS))) return
    const desc = await queryInterface.describeTable(ONDC_ORDERS)
    for (const name of Object.keys(COLUMNS(Sequelize))) {
      if (desc[name]) {
        await queryInterface.removeColumn(ONDC_ORDERS, name)
      }
    }
  },
}
