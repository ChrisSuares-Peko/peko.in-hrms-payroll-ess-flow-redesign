'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('serviceOperators');

    if (!columns.commissionMode) {
      await queryInterface.addColumn('serviceOperators', 'commissionMode', {
        type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
        defaultValue: 'MARGIN',
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('serviceOperators');

    if (columns.commissionMode) await queryInterface.removeColumn('serviceOperators', 'commissionMode');
  },
};
