'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('giftCards', 'quantityLimit', {
      type: Sequelize.INTEGER,
      defaultValue: null,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('giftCards', 'quantityLimit');
  }
};
