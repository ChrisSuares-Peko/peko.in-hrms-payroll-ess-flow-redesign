'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('giftCards');

    if (!columns.commissionMode) {
      await queryInterface.addColumn('giftCards', 'commissionMode', {
        type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
        defaultValue: 'MARGIN',
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('giftCards');

    if (columns.commissionMode) await queryInterface.removeColumn('giftCards', 'commissionMode');
  },
};
