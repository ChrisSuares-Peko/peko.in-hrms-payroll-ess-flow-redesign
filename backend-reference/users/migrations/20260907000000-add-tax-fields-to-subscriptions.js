'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('subscriptions');
    if (!tableDesc.taxableAmount) {
      await queryInterface.addColumn('subscriptions', 'taxableAmount', {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true,
      });
    }
    if (!tableDesc.taxAmount) {
      await queryInterface.addColumn('subscriptions', 'taxAmount', {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true,
      });
    }
    if (!tableDesc.taxRate) {
      await queryInterface.addColumn('subscriptions', 'taxRate', {
        type: Sequelize.DECIMAL(6, 3),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('subscriptions', 'taxableAmount');
    await queryInterface.removeColumn('subscriptions', 'taxAmount');
    await queryInterface.removeColumn('subscriptions', 'taxRate');
  },
};
