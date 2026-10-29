'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('tax_sales_invoices').catch(() => null);
    if (!tableDesc) return;
    if (tableDesc.source) return; // already exists, skip
    await queryInterface.addColumn('tax_sales_invoices', 'source', {
      type: Sequelize.ENUM('peko', 'manual'),
      allowNull: false,
      defaultValue: 'manual',
      after: 'status',
    });
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('tax_sales_invoices').catch(() => null);
    if (!tableDesc || !tableDesc.source) return;
    await queryInterface.removeColumn('tax_sales_invoices', 'source');
  },
};
