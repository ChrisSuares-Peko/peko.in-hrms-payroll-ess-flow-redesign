'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'govtservicescatalogs')
    if (!tableName) return

    const columns = await queryInterface.describeTable(tableName)

    const expectedColumns = [
      { name: 'vendorCatalogId', after: 'id', def: { type: Sequelize.STRING, allowNull: true } },
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
      { name: 'adminLocked', after: 'status', def: { type: Sequelize.BOOLEAN, defaultValue: false } },
      { name: 'sortOrder', after: 'adminLocked', def: { type: Sequelize.INTEGER, defaultValue: 0 } },
      { name: 'createdAt', after: 'sortOrder', def: { type: Sequelize.DATE, allowNull: true, defaultValue: Sequelize.NOW } },
      { name: 'updatedAt', after: 'createdAt', def: { type: Sequelize.DATE, allowNull: true } }
    ]

    for (const { name, after, def } of expectedColumns) {
      if (!columns[name]) {
        await queryInterface.addColumn(tableName, name, columns[after] ? { ...def, after } : def)
        columns[name] = true
      }
    }
  },

  async down() {
    // Intentionally a no-op — this migration only backfills columns the table was
    // always meant to have. Reverting it would just reintroduce the incomplete
    // table state it exists to fix.
  }
}
