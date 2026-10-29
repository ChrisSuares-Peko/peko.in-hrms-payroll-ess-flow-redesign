'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables()
    const tableName = tables.find(t => t.toLowerCase() === 'governmentservicesapplications')
    if (!tableName) return

    const columns = await queryInterface.describeTable(tableName)

    const expectedColumns = [
      { name: 'applicationId', after: 'id', def: { type: Sequelize.STRING, allowNull: true } },
      { name: 'vendorCatalogId', after: 'applicationId', def: { type: Sequelize.STRING, allowNull: true } },
      { name: 'serviceId', after: 'vendorCatalogId', def: { type: Sequelize.INTEGER, allowNull: true } },
      { name: 'applicationData', after: 'serviceId', def: { type: Sequelize.JSON, allowNull: true, defaultValue: {} } },
      { name: 'legalBusinessName', after: 'applicationData', def: { type: Sequelize.STRING, allowNull: true } },
      { name: 'pan', after: 'legalBusinessName', def: { type: Sequelize.STRING, allowNull: true } },
      { name: 'phoneNumber', after: 'pan', def: { type: Sequelize.STRING, allowNull: true } },
      { name: 'stateOfRegistration', after: 'phoneNumber', def: { type: Sequelize.STRING, allowNull: true } },
      { name: 'amount', after: 'stateOfRegistration', def: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 } },
      { name: 'status', after: 'amount', def: { type: Sequelize.ENUM('DRAFT', 'SUBMITTED', 'COMPLETED'), defaultValue: 'DRAFT' } },
      { name: 'submittedAt', after: 'status', def: { type: Sequelize.DATE, allowNull: true } },
      { name: 'completedAt', after: 'submittedAt', def: { type: Sequelize.DATE, allowNull: true } },
      { name: 'paymentStatus', after: 'completedAt', def: { type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED'), defaultValue: 'PENDING' } },
      { name: 'corporateTxnId', after: 'paymentStatus', def: { type: Sequelize.STRING, allowNull: true } },
      { name: 'paidAt', after: 'corporateTxnId', def: { type: Sequelize.DATE, allowNull: true } },
      { name: 'vendorGid', after: 'paidAt', def: { type: Sequelize.STRING, allowNull: true } },
      { name: 'vendorEngagementId', after: 'vendorGid', def: { type: Sequelize.STRING, allowNull: true } },
      { name: 'documents', after: 'vendorEngagementId', def: { type: Sequelize.JSON, allowNull: true } },
      { name: 'rejectionReason', after: 'documents', def: { type: Sequelize.TEXT, allowNull: true } },
      { name: 'notes', after: 'rejectionReason', def: { type: Sequelize.TEXT, allowNull: true } },
      { name: 'credentialId', after: 'notes', def: { type: Sequelize.INTEGER, allowNull: true } },
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
