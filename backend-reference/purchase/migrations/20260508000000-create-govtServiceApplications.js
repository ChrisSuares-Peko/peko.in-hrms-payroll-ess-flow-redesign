module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables()
    if (!tables.includes('govtServiceApplications')) return

    const tableDescription = await queryInterface.describeTable('govtServiceApplications')

    if (!tableDescription.currentStep) {
      await queryInterface.addColumn('govtServiceApplications', 'currentStep', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        after: 'applicationNumber'
      })
    }

    if (!tableDescription.formData) {
      await queryInterface.addColumn('govtServiceApplications', 'formData', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        after: 'currentStep'
      })
    }

    if (!tableDescription.remarks) {
      await queryInterface.addColumn('govtServiceApplications', 'remarks', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'status'
      })
    }

    if (!tableDescription.completedAt) {
      await queryInterface.addColumn('govtServiceApplications', 'completedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        after: 'submittedAt'
      })
    }

    if (!tableDescription.statusHistory) {
      await queryInterface.addColumn('govtServiceApplications', 'statusHistory', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        after: 'completedAt'
      })
    }

    if (!tableDescription.approvedDocument) {
      await queryInterface.addColumn('govtServiceApplications', 'approvedDocument', {
        type: Sequelize.STRING(1000),
        allowNull: true,
        after: 'statusHistory'
      })
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables()
    if (!tables.includes('govtServiceApplications')) return

    const tableDescription = await queryInterface.describeTable('govtServiceApplications')

    if (tableDescription.currentStep) {
      await queryInterface.removeColumn('govtServiceApplications', 'currentStep')
    }
    if (tableDescription.formData) {
      await queryInterface.removeColumn('govtServiceApplications', 'formData')
    }
    if (tableDescription.remarks) {
      await queryInterface.removeColumn('govtServiceApplications', 'remarks')
    }
    if (tableDescription.completedAt) {
      await queryInterface.removeColumn('govtServiceApplications', 'completedAt')
    }
    if (tableDescription.statusHistory) {
      await queryInterface.removeColumn('govtServiceApplications', 'statusHistory')
    }
    if (tableDescription.approvedDocument) {
      await queryInterface.removeColumn('govtServiceApplications', 'approvedDocument')
    }
  }
}
