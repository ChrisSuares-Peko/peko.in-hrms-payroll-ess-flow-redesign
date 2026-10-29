'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('purchase_orders')) return;

    const tableDesc = await queryInterface.describeTable('purchase_orders');

    if (!tableDesc.vendorToken) {
      await queryInterface.addColumn('purchase_orders', 'vendorToken', {
        type: Sequelize.STRING(128),
        allowNull: true,
        unique: true,
        after: 'cancelledAt',
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('purchase_orders')) return;

    const tableDesc = await queryInterface.describeTable('purchase_orders');

    if (tableDesc.vendorToken) {
      await queryInterface.removeColumn('purchase_orders', 'vendorToken');
    }
  },
};
