'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('purchase_requests')) return;

    const tableDescription = await queryInterface.describeTable('purchase_requests');
    if (!tableDescription.lineItems) {
      await queryInterface.addColumn('purchase_requests', 'lineItems', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
        after: 'description',
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('purchase_requests')) return;

    const tableDescription = await queryInterface.describeTable('purchase_requests');
    if (tableDescription.lineItems) {
      await queryInterface.removeColumn('purchase_requests', 'lineItems');
    }
  },
};
