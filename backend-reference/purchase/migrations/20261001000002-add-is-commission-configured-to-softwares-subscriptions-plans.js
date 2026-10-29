'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('softwares_subscriptions_plans');

    if (!columns.isCommissionConfigured) {
      await queryInterface.addColumn('softwares_subscriptions_plans', 'isCommissionConfigured', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('softwares_subscriptions_plans');

    if (columns.isCommissionConfigured) {
      await queryInterface.removeColumn('softwares_subscriptions_plans', 'isCommissionConfigured');
    }
  },
};
