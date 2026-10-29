'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.tableExists('invoiceRecurrings');
    if (tableExists) return;

    await queryInterface.createTable('invoiceRecurrings', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      scheduleName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      frequency: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      nextRunDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      endCondition: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'PAUSED', 'ENDED'),
        defaultValue: 'ACTIVE',
      },
      autoSend: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      completedRuns: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      generatedInvoices: {
        type: Sequelize.JSON,
        defaultValue: [],
      },
      sourceInvoiceId: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      corporateUserId: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      subCorporateUserId: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('invoiceRecurrings');
  },
};
