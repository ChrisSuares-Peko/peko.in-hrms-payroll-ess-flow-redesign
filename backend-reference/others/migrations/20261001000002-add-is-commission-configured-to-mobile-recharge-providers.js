'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('mobileRechargeProviders');

    if (!columns.isCommissionConfigured) {
      await queryInterface.addColumn('mobileRechargeProviders', 'isCommissionConfigured', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('mobileRechargeProviders');

    if (columns.isCommissionConfigured) {
      await queryInterface.removeColumn('mobileRechargeProviders', 'isCommissionConfigured');
    }
  },
};
