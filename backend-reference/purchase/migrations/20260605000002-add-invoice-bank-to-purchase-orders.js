'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // Remove invoice/bank columns from purchase_orders
    if (tables.includes('purchase_orders')) {
      const poDesc = await queryInterface.describeTable('purchase_orders');
      const colsToRemove = [
        'invoiceNumber', 'invoiceAmount', 'invoiceDate', 'invoiceFileUrl', 'invoiceNotes',
        'bankAccountHolder', 'bankName', 'bankAccountNumber', 'bankIfsc',
      ];
      for (const col of colsToRemove) {
        if (poDesc[col]) await queryInterface.removeColumn('purchase_orders', col);
      }
    }

    // Add bankAccountHolder and bankName to procure_invoices
    if (tables.includes('procure_invoices')) {
      const invDesc = await queryInterface.describeTable('procure_invoices');
      if (!invDesc['bankAccountHolder']) {
        await queryInterface.addColumn('procure_invoices', 'bankAccountHolder', {
          type: Sequelize.STRING(200),
          allowNull: true,
          after: 'amount',
        });
      }
      if (!invDesc['bankName']) {
        await queryInterface.addColumn('procure_invoices', 'bankName', {
          type: Sequelize.STRING(100),
          allowNull: true,
          after: 'bankAccountHolder',
        });
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // Remove bankAccountHolder and bankName from procure_invoices
    if (tables.includes('procure_invoices')) {
      const invDesc = await queryInterface.describeTable('procure_invoices');
      if (invDesc['bankAccountHolder']) await queryInterface.removeColumn('procure_invoices', 'bankAccountHolder');
      if (invDesc['bankName'])          await queryInterface.removeColumn('procure_invoices', 'bankName');
    }

    // Re-add invoice/bank columns to purchase_orders
    if (tables.includes('purchase_orders')) {
      const poDesc = await queryInterface.describeTable('purchase_orders');
      const columns = [
        ['invoiceNumber',     { type: Sequelize.STRING(100),    allowNull: true, after: 'vendorToken' }],
        ['invoiceAmount',     { type: Sequelize.DECIMAL(15, 2), allowNull: true, after: 'invoiceNumber' }],
        ['invoiceDate',       { type: Sequelize.DATEONLY,        allowNull: true, after: 'invoiceAmount' }],
        ['invoiceFileUrl',    { type: Sequelize.TEXT,            allowNull: true, after: 'invoiceDate' }],
        ['invoiceNotes',      { type: Sequelize.TEXT,            allowNull: true, after: 'invoiceFileUrl' }],
        ['bankAccountHolder', { type: Sequelize.STRING(200),    allowNull: true, after: 'invoiceNotes' }],
        ['bankName',          { type: Sequelize.STRING(100),    allowNull: true, after: 'bankAccountHolder' }],
        ['bankAccountNumber', { type: Sequelize.STRING(20),     allowNull: true, after: 'bankName' }],
        ['bankIfsc',          { type: Sequelize.STRING(11),     allowNull: true, after: 'bankAccountNumber' }],
      ];
      for (const [col, def] of columns) {
        if (!poDesc[col]) await queryInterface.addColumn('purchase_orders', col, def);
      }
    }
  },
};
