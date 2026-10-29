'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'governmentservicesapplications')
    if (!tableName) return

    const columns = await queryInterface.describeTable(tableName)
    if (columns.vendorEngagementId) return

    await queryInterface.addColumn(tableName, 'vendorEngagementId', {
      type: Sequelize.STRING,
      allowNull: true,
    })
  },

  down: async (queryInterface) => {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'governmentservicesapplications')
    if (!tableName) return

    const columns = await queryInterface.describeTable(tableName)
    if (!columns.vendorEngagementId) return

    await queryInterface.removeColumn(tableName, 'vendorEngagementId')
  },
}
