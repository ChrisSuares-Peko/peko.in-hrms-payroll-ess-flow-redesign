'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('work_plans');

    if (!columns.isCommissionConfigured) {
      await queryInterface.addColumn('work_plans', 'isCommissionConfigured', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('work_plans');

    if (columns.isCommissionConfigured) {
      await queryInterface.removeColumn('work_plans', 'isCommissionConfigured');
    }
  },
};
