'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('packages');

    if (!columns.commissionType) {
      await queryInterface.addColumn('packages', 'commissionType', {
        type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
        defaultValue: 'PERCENTAGE',
        allowNull: true,
      });
    }
    if (!columns.commission) {
      await queryInterface.addColumn('packages', 'commission', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.fixedCommissionPerTransaction) {
      await queryInterface.addColumn('packages', 'fixedCommissionPerTransaction', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.isCommissionInclGST) {
      await queryInterface.addColumn('packages', 'isCommissionInclGST', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
      });
    }
    if (!columns.planCommissions) {
      await queryInterface.addColumn('packages', 'planCommissions', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('packages');

    if (columns.planCommissions) await queryInterface.removeColumn('packages', 'planCommissions');
    if (columns.isCommissionInclGST) await queryInterface.removeColumn('packages', 'isCommissionInclGST');
    if (columns.fixedCommissionPerTransaction) await queryInterface.removeColumn('packages', 'fixedCommissionPerTransaction');
    if (columns.commission) await queryInterface.removeColumn('packages', 'commission');
    if (columns.commissionType) await queryInterface.removeColumn('packages', 'commissionType');
  },
};
