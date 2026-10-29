'use strict'

module.exports = {
  up: async (queryInterface) => {
    // Check if table exists (case-insensitive)
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'govtservices')
    if (!tableName) return

    // Check if column exists before removing it
    const columns = await queryInterface.describeTable(tableName)
    if (!columns.price) return

    await queryInterface.removeColumn(tableName, 'price')
  },

  down: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'govtservices')
    if (!tableName) return

    const columns = await queryInterface.describeTable(tableName)
    if (columns.price) return

    await queryInterface.addColumn(tableName, 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      after: 'processingTime',
    })
  },
}
