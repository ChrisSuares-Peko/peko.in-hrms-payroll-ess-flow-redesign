'use strict';

// Some MySQL setups (e.g. Windows with lower_case_table_names=1) fold table
// names to lowercase in SHOW TABLES, so compare case-insensitively.
const hasTable = (tables, name) =>
  tables.some((t) => t.toLowerCase() === name.toLowerCase());

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!hasTable(tables, 'orders')) return;

    const tableDesc = await queryInterface.describeTable('orders');

    if (!tableDesc.couponCodeId && hasTable(tables, 'couponCodes')) {
      // No 'after' positioning: 'actualEarnings' was only ever created via sequelize.sync()
      // on some environments, never via a migration, so it doesn't reliably exist to anchor
      // to. Letting MySQL append the column at the end works everywhere.
      await queryInterface.addColumn('orders', 'couponCodeId', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'couponCodes',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!hasTable(tables, 'orders')) return;

    const tableDesc = await queryInterface.describeTable('orders');

    if (tableDesc.couponCodeId) {
      await queryInterface.removeColumn('orders', 'couponCodeId');
    }
  },
};
