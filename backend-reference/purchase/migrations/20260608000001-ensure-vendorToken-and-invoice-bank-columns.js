'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();

    // Add vendorToken to purchase_orders
    if (tables.includes('purchase_orders')) {
      const poDesc = await queryInterface.describeTable('purchase_orders');
      if (!poDesc.vendorToken) {
        await queryInterface.addColumn('purchase_orders', 'vendorToken', {
          type: Sequelize.STRING(128),
          allowNull: true,
          unique: true,
        });
      }

      // Remove old invoice/bank columns if they still exist
      const colsToRemove = [
        'invoiceNumber', 'invoiceAmount', 'invoiceDate', 'invoiceFileUrl', 'invoiceNotes',
        'bankAccountHolder', 'bankName', 'bankAccountNumber', 'bankIfsc',
      ];
      for (const col of colsToRemove) {
        if (poDesc[col]) await queryInterface.removeColumn('purchase_orders', col);
      }
    }

    // Add bank columns to procure_invoices
    if (tables.includes('procure_invoices')) {
      const invDesc = await queryInterface.describeTable('procure_invoices');
      if (!invDesc.bankAccountHolder) {
        await queryInterface.addColumn('procure_invoices', 'bankAccountHolder', {
          type: Sequelize.STRING(200),
          allowNull: true,
        });
      }
      if (!invDesc.bankName) {
        await queryInterface.addColumn('procure_invoices', 'bankName', {
          type: Sequelize.STRING(100),
          allowNull: true,
        });
      }
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();

    if (tables.includes('purchase_orders')) {
      const poDesc = await queryInterface.describeTable('purchase_orders');
      if (poDesc.vendorToken) await queryInterface.removeColumn('purchase_orders', 'vendorToken');
    }

    if (tables.includes('procure_invoices')) {
      const invDesc = await queryInterface.describeTable('procure_invoices');
      if (invDesc.bankAccountHolder) await queryInterface.removeColumn('procure_invoices', 'bankAccountHolder');
      if (invDesc.bankName)          await queryInterface.removeColumn('procure_invoices', 'bankName');
    }
  },
};
