'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('domainHostingPlans');

    if (!columns.isCommissionConfigured) {
      await queryInterface.addColumn('domainHostingPlans', 'isCommissionConfigured', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('domainHostingPlans');

    if (columns.isCommissionConfigured) {
      await queryInterface.removeColumn('domainHostingPlans', 'isCommissionConfigured');
    }
  },
};
