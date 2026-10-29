'use strict'

// Fix: "Unknown column 'transactionId' in 'field list'".
// The transactionId column is missing on the ONDC tables; add it if absent
// (nullable, safe on existing rows). Guarded + idempotent.

const TABLES = ['ondcProducts', 'userSearchOndcs']

module.exports = {
  async up(queryInterface, Sequelize) {
    const all = await queryInterface.showAllTables()
    for (const table of TABLES) {
      if (!all.includes(table)) continue
      const desc = await queryInterface.describeTable(table)
      if (!desc.transactionId) {
        await queryInterface.addColumn(table, 'transactionId', {
          type: Sequelize.STRING,
          allowNull: true,
        })
      }
    }
  },

  async down() {
    return Promise.resolve()
  },
}
