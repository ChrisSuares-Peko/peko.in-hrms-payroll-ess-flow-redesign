'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('proposal_line_items')) return;

    const tableDesc = await queryInterface.describeTable('proposal_line_items');

    if (!tableDesc.taxRate) {
      await queryInterface.addColumn('proposal_line_items', 'taxRate', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        after: 'total',
      });
    }
    if (!tableDesc.gstType) {
      await queryInterface.addColumn('proposal_line_items', 'gstType', {
        type: Sequelize.ENUM('inclusive', 'exclusive'),
        allowNull: true,
        after: 'taxRate',
      });
    }
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('proposal_line_items')) return;

    const tableDesc = await queryInterface.describeTable('proposal_line_items');

    if (tableDesc.gstType) {
      await queryInterface.removeColumn('proposal_line_items', 'gstType');
    }
    if (tableDesc.taxRate) {
      await queryInterface.removeColumn('proposal_line_items', 'taxRate');
    }
  },
};
