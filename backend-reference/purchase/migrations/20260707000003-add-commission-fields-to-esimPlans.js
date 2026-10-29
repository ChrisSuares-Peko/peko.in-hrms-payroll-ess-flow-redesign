'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('esimPlans');

    if (!columns.commissionType) {
      await queryInterface.addColumn('esimPlans', 'commissionType', {
        type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
        defaultValue: 'PERCENTAGE',
        allowNull: true,
      });
    }
    if (!columns.commission) {
      await queryInterface.addColumn('esimPlans', 'commission', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.fixedCommissionPerTransaction) {
      await queryInterface.addColumn('esimPlans', 'fixedCommissionPerTransaction', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.isCommissionInclGST) {
      await queryInterface.addColumn('esimPlans', 'isCommissionInclGST', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('esimPlans');

    if (columns.isCommissionInclGST) {
      await queryInterface.removeColumn('esimPlans', 'isCommissionInclGST');
    }
    if (columns.fixedCommissionPerTransaction) {
      await queryInterface.removeColumn('esimPlans', 'fixedCommissionPerTransaction');
    }
    if (columns.commission) {
      await queryInterface.removeColumn('esimPlans', 'commission');
    }
    if (columns.commissionType) {
      await queryInterface.removeColumn('esimPlans', 'commissionType');
    }
  },
};
