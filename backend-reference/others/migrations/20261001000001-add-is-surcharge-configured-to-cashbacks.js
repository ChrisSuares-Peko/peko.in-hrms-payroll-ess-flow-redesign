'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('cashbacks');

    if (!columns.isSurchargeConfigured) {
      await queryInterface.addColumn('cashbacks', 'isSurchargeConfigured', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('cashbacks');

    if (columns.isSurchargeConfigured) {
      await queryInterface.removeColumn('cashbacks', 'isSurchargeConfigured');
    }
  },
};
