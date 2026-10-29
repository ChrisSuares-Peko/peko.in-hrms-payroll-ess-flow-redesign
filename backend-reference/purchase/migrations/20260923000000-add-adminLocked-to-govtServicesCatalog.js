'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'govtservicescatalogs')
    if (!tableName) return

    const columns = await queryInterface.describeTable(tableName)
    if (columns.adminLocked) return

    // Set whenever an admin explicitly disables a row (updateStatus/updateCatalogItem) — sync
    // skips forcing status back to true for a locked row, so an intentionally-disabled service
    // stays disabled even though the vendor keeps sending it. Cleared when an admin re-enables it.
   
    await queryInterface.addColumn(tableName, 'adminLocked', { type: Sequelize.BOOLEAN, defaultValue: false })
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'govtservicescatalogs')
    if (!tableName) return

    const columns = await queryInterface.describeTable(tableName)
    if (columns.adminLocked) await queryInterface.removeColumn(tableName, 'adminLocked')
  }
}
