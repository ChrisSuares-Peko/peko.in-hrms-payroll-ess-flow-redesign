'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('esimPlans');

    if (!columns.commissionMode) {
      await queryInterface.addColumn('esimPlans', 'commissionMode', {
        type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
        defaultValue: 'MARGIN',
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const columns = await queryInterface.describeTable('esimPlans');

    if (columns.commissionMode) await queryInterface.removeColumn('esimPlans', 'commissionMode');
  },
};
