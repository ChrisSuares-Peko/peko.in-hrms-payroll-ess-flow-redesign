'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('businessRegistrationCatalogs');

    if (!columns.isCommissionConfigured) {
      await queryInterface.addColumn('businessRegistrationCatalogs', 'isCommissionConfigured', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('businessRegistrationCatalogs');

    if (columns.isCommissionConfigured) {
      await queryInterface.removeColumn('businessRegistrationCatalogs', 'isCommissionConfigured');
    }
  },
};
