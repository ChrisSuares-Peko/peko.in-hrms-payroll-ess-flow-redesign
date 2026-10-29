'use strict';

// Same issue as invoiceSettingsV2 (see 20260825000000-create-invoiceSettingsV2.js) —
// no CREATE TABLE migration existed, only sequelize.sync() created it. Guarded so
// re-running this (or running it after sync already created the table) is safe.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.tableExists('invoiceReminderRules');
    if (tableExists) return;

    await queryInterface.createTable('invoiceReminderRules', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      corporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      ruleType: {
        type: Sequelize.ENUM('BEFORE', 'ON_DUE', 'AFTER', 'SECOND_OVERDUE'),
        allowNull: false,
      },
      days: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      sendEmail: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      sendWhatsApp: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      emailTemplate: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      },
      whatsappTemplate: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
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
    await queryInterface.dropTable('invoiceReminderRules');
  },
};
