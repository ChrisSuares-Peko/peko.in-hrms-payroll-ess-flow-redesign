'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('tax_sales_invoices');
    if (!tableExists) return;

    const tableDesc = await queryInterface.describeTable('tax_sales_invoices');

    if (!tableDesc.placeOfSupply) {
      await queryInterface.addColumn('tax_sales_invoices', 'placeOfSupply', {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
        after: 'hsnCode',
      });
    }
  },

  async down(queryInterface) {
    const tableExists = await queryInterface.tableExists('tax_sales_invoices');
    if (!tableExists) return;

    const tableDesc = await queryInterface.describeTable('tax_sales_invoices');
    if (tableDesc.placeOfSupply) await queryInterface.removeColumn('tax_sales_invoices', 'placeOfSupply');
  },
};
