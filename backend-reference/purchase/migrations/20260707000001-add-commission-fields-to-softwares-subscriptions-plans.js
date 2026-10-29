'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('softwares_subscriptions_plans');

    if (!columns.commissionType) {
      await queryInterface.addColumn('softwares_subscriptions_plans', 'commissionType', {
        type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
        defaultValue: 'PERCENTAGE',
        allowNull: true,
      });
    }
    if (!columns.commission) {
      await queryInterface.addColumn('softwares_subscriptions_plans', 'commission', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.fixedCommissionPerTransaction) {
      await queryInterface.addColumn('softwares_subscriptions_plans', 'fixedCommissionPerTransaction', {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
        allowNull: true,
      });
    }
    if (!columns.isCommissionInclGST) {
      await queryInterface.addColumn('softwares_subscriptions_plans', 'isCommissionInclGST', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('softwares_subscriptions_plans');

    if (columns.isCommissionInclGST) {
      await queryInterface.removeColumn('softwares_subscriptions_plans', 'isCommissionInclGST');
    }
    if (columns.fixedCommissionPerTransaction) {
      await queryInterface.removeColumn('softwares_subscriptions_plans', 'fixedCommissionPerTransaction');
    }
    if (columns.commission) {
      await queryInterface.removeColumn('softwares_subscriptions_plans', 'commission');
    }
    if (columns.commissionType) {
      await queryInterface.removeColumn('softwares_subscriptions_plans', 'commissionType');
    }
  },
};
