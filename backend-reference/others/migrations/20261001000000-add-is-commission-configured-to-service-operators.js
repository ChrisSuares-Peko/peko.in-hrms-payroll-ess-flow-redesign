'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('serviceOperators');

    if (!columns.isCommissionConfigured) {
      await queryInterface.addColumn('serviceOperators', 'isCommissionConfigured', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('serviceOperators');

    if (columns.isCommissionConfigured) {
      await queryInterface.removeColumn('serviceOperators', 'isCommissionConfigured');
    }
  },
};
