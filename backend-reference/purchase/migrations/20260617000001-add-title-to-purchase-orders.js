'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('purchase_orders')) return;

    const columns = await queryInterface.describeTable('purchase_orders');
    if (columns.title) return;

    await queryInterface.addColumn('purchase_orders', 'title', {
      type: Sequelize.STRING(200),
      allowNull: true,
      after: 'refNumber',
    });
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('purchase_orders')) return;

    const columns = await queryInterface.describeTable('purchase_orders');
    if (!columns.title) return;

    await queryInterface.removeColumn('purchase_orders', 'title');
  },
};
