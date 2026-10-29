'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('softwares_subscriptions_plans');

    if (!columns.commissionMode) {
      await queryInterface.addColumn('softwares_subscriptions_plans', 'commissionMode', {
        type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
        defaultValue: 'MARGIN',
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('softwares_subscriptions_plans');

    if (columns.commissionMode) await queryInterface.removeColumn('softwares_subscriptions_plans', 'commissionMode');
  },
};
