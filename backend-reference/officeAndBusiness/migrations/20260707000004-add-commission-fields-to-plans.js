'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('plans');

    if (!columns.commissionType) {
      await queryInterface.addColumn('plans', 'commissionType', {
        type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
        defaultValue: 'PERCENTAGE',
        allowNull: true,
      });
    }
    if (!columns.commission) {
      await queryInterface.addColumn('plans', 'commission', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.fixedCommissionPerTransaction) {
      await queryInterface.addColumn('plans', 'fixedCommissionPerTransaction', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.isCommissionInclGST) {
      await queryInterface.addColumn('plans', 'isCommissionInclGST', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('plans');

    if (columns.isCommissionInclGST) {
      await queryInterface.removeColumn('plans', 'isCommissionInclGST');
    }
    if (columns.fixedCommissionPerTransaction) {
      await queryInterface.removeColumn('plans', 'fixedCommissionPerTransaction');
    }
    if (columns.commission) {
      await queryInterface.removeColumn('plans', 'commission');
    }
    if (columns.commissionType) {
      await queryInterface.removeColumn('plans', 'commissionType');
    }
  },
};
