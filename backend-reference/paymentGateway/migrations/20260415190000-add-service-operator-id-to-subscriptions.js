'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('subscriptions');
    if (!tableDescription.serviceOperatorId) {
      await queryInterface.addColumn('subscriptions', 'serviceOperatorId', {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('subscriptions');
    if (tableDescription.serviceOperatorId) {
      await queryInterface.removeColumn('subscriptions', 'serviceOperatorId');
    }
  },
};
