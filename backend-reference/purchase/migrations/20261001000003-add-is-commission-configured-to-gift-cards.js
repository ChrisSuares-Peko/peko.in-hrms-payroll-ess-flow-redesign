'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('giftCards');

    if (!columns.isCommissionConfigured) {
      await queryInterface.addColumn('giftCards', 'isCommissionConfigured', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('giftCards');

    if (columns.isCommissionConfigured) {
      await queryInterface.removeColumn('giftCards', 'isCommissionConfigured');
    }
  },
};
