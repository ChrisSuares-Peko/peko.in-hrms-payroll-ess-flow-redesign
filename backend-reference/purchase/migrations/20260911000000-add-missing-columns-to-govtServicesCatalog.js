'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'govtservicescatalogs')
    if (!tableName) return

    const columns = await queryInterface.describeTable(tableName)

    // Matches models/entities/govtServicesCatalog.js exactly, in the same
    // order — `after` chains each addition onto the previous one so the
    // final column order matches the entity even if several are missing.
    const expectedColumns = [
      { name: 'vendorCatalogId', after: 'id', def: { type: Sequelize.STRING, allowNull: false } },
      { name: 'bid', after: 'vendorCatalogId', def: { type: Sequelize.STRING, allowNull: true } },
      { name: 'serviceId', after: 'bid', def: { type: Sequelize.INTEGER, allowNull: true } },
      { name: 'type', after: 'serviceId', def: { type: Sequelize.INTEGER, allowNull: true } },
      { name: 'serviceName', after: 'type', def: { type: Sequelize.STRING, allowNull: true } },
      { name: 'variantName', after: 'serviceName', def: { type: Sequelize.STRING, allowNull: true } },
      { name: 'description', after: 'variantName', def: { type: Sequelize.TEXT, allowNull: true } },
      { name: 'price', after: 'description', def: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 } },
      { name: 'currency', after: 'price', def: { type: Sequelize.STRING, allowNull: true, defaultValue: 'INR' } },
      { name: 'paymentType', after: 'currency', def: { type: Sequelize.STRING, allowNull: true } },
      { name: 'about', after: 'paymentType', def: { type: Sequelize.TEXT, allowNull: true } },
      { name: 'amount', after: 'about', def: { type: Sequelize.DECIMAL(10, 2), allowNull: true } },
      { name: 'status', after: 'amount', def: { type: Sequelize.BOOLEAN, defaultValue: false } },
      { name: 'sortOrder', after: 'status', def: { type: Sequelize.INTEGER, defaultValue: 0 } },
      { name: 'createdAt', after: 'sortOrder', def: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW } },
      { name: 'updatedAt', after: 'createdAt', def: { type: Sequelize.DATE, allowNull: true } },
    ]

    for (const { name, after, def } of expectedColumns) {
      if (!columns[name]) {
        await queryInterface.addColumn(tableName, name, columns[after] ? { ...def, after } : def)
        columns[name] = true
      }
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'govtservicescatalogs')
    if (!tableName) return
    
    const addedByThisMigration = ['bid', 'type', 'paymentType']
    const columns = await queryInterface.describeTable(tableName)
    for (const name of addedByThisMigration.reverse()) {
      if (columns[name]) await queryInterface.removeColumn(tableName, name)
    }
  }
}
