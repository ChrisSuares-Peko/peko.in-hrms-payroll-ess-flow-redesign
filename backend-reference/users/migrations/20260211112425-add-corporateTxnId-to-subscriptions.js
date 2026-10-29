'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('subscriptions');

    if (!table.corporateTxnId) {
      await queryInterface.addColumn('subscriptions', 'corporateTxnId', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('subscriptions');

    if (table.corporateTxnId) {
      await queryInterface.removeColumn('subscriptions', 'corporateTxnId');
    }
  },
};
