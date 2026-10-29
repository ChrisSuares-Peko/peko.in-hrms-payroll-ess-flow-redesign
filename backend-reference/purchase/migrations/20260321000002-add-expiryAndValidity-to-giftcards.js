'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('giftCards', 'expiryAndValidity', {
      type: Sequelize.TEXT,
      defaultValue: null,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('giftCards', 'expiryAndValidity');
  }
};
