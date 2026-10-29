'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('transactions');

    if (!tableDescription.refundedAmount) {
      await queryInterface.addColumn('transactions', 'refundedAmount', {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('transactions');

    if (tableDescription.refundedAmount) {
      await queryInterface.removeColumn('transactions', 'refundedAmount');
    }
  },
};
