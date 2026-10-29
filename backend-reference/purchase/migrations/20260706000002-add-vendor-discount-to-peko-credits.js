'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('peko_credits');
    if (!columns.vendorDiscount) {
      await queryInterface.addColumn('peko_credits', 'vendorDiscount', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('peko_credits');
    if (columns.vendorDiscount) {
      await queryInterface.removeColumn('peko_credits', 'vendorDiscount');
    }
  },
};
