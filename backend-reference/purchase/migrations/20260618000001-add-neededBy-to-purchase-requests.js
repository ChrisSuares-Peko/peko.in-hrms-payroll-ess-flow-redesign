'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('purchase_requests')) return;

    const tableDescription = await queryInterface.describeTable('purchase_requests');
    if (!tableDescription.neededBy) {
      await queryInterface.addColumn('purchase_requests', 'neededBy', {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
        after: 'currency',
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('purchase_requests')) return;

    const tableDescription = await queryInterface.describeTable('purchase_requests');
    if (tableDescription.neededBy) {
      await queryInterface.removeColumn('purchase_requests', 'neededBy');
    }
  },
};
