'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('subscriptions');

    if (!tableDescription.authPayment) {
      await queryInterface.addColumn('subscriptions', 'authPayment', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('subscriptions');

    if (tableDescription.authPayment) {
      await queryInterface.removeColumn('subscriptions', 'authPayment');
    }
  },
};
