'use strict'

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'governmentservicesapplications')
    if (!tableName) return

    const columns = await queryInterface.describeTable(tableName)
    if (!columns.applicationId || columns.applicationId.allowNull) return

    await queryInterface.changeColumn(tableName, 'applicationId', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    })
  },

  down: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'governmentservicesapplications')
    if (!tableName) return

    const columns = await queryInterface.describeTable(tableName)
    if (!columns.applicationId || !columns.applicationId.allowNull) return

    await queryInterface.changeColumn(tableName, 'applicationId', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    })
  },
}
