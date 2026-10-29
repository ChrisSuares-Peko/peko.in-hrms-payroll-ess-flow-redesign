'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('hikes');

    if (!columns.isCommissionConfigured) {
      await queryInterface.addColumn('hikes', 'isCommissionConfigured', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('hikes');

    if (columns.isCommissionConfigured) {
      await queryInterface.removeColumn('hikes', 'isCommissionConfigured');
    }
  },
};
