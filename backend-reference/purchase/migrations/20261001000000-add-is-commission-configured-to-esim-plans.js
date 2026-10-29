'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('esimPlans');

    if (!columns.isCommissionConfigured) {
      await queryInterface.addColumn('esimPlans', 'isCommissionConfigured', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('esimPlans');

    if (columns.isCommissionConfigured) {
      await queryInterface.removeColumn('esimPlans', 'isCommissionConfigured');
    }
  },
};
