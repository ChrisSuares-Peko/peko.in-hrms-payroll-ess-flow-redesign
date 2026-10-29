'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('subscriptions');
    if (!tableDesc.serviceOperatorId) {
      await queryInterface.addColumn('subscriptions', 'serviceOperatorId', {
        type: Sequelize.BIGINT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('subscriptions', 'serviceOperatorId');
  },
};
