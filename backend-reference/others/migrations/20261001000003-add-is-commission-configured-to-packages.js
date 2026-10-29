'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('packages');

    if (!columns.isCommissionConfigured) {
      await queryInterface.addColumn('packages', 'isCommissionConfigured', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  down: async () => {},
};
