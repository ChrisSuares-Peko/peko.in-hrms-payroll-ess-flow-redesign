'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('cardIssuances', 'nameOnCard', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'cardViewLink',
      comment: 'The name printed on the card (custom name for physical cards, defaults to cardholder name)',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('cardIssuances', 'nameOnCard');
  },
};
