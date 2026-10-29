'use strict';

// This table previously had no CREATE TABLE migration — only ALTERs — relying
// entirely on sequelize.sync() to create it. Guarded so re-running this (or
// running it after sync already created the table) is always safe.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.tableExists('invoiceSettingsV2');
    if (tableExists) return;

    await queryInterface.createTable('invoiceSettingsV2', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      corporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
      },
      signatureUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      autoUpdateDocumentNumber: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      termsAndConditions: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      documentNumberPrefix: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      automaticReminders: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      autoAddToCatalog: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      gstPercent: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: '5',
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'INR',
      },
      paymentMode: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
      },
      defaultDueDays: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 14,
      },
      templateSettings: {
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
    await queryInterface.dropTable('invoiceSettingsV2');
  },
};
