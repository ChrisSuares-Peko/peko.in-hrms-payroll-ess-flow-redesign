'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('work_plans');

    if (!columns.commissionType) {
      await queryInterface.addColumn('work_plans', 'commissionType', {
        type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
        defaultValue: 'PERCENTAGE',
        allowNull: true,
      });
    }
    if (!columns.commission) {
      await queryInterface.addColumn('work_plans', 'commission', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.fixedCommissionPerTransaction) {
      await queryInterface.addColumn('work_plans', 'fixedCommissionPerTransaction', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.isCommissionInclGST) {
      await queryInterface.addColumn('work_plans', 'isCommissionInclGST', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('work_plans');

    if (columns.isCommissionInclGST) {
      await queryInterface.removeColumn('work_plans', 'isCommissionInclGST');
    }
    if (columns.fixedCommissionPerTransaction) {
      await queryInterface.removeColumn('work_plans', 'fixedCommissionPerTransaction');
    }
    if (columns.commission) {
      await queryInterface.removeColumn('work_plans', 'commission');
    }
    if (columns.commissionType) {
      await queryInterface.removeColumn('work_plans', 'commissionType');
    }
  },
};
