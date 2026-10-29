'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('purchase_orders')) return;

    const tableDesc = await queryInterface.describeTable('purchase_orders');

    if (!tableDesc.rfqId) {
      await queryInterface.addColumn('purchase_orders', 'rfqId', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        after: 'proposalId',
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('purchase_orders')) return;

    const tableDesc = await queryInterface.describeTable('purchase_orders');

    if (tableDesc.rfqId) {
      await queryInterface.removeColumn('purchase_orders', 'rfqId');
    }
  },
};
