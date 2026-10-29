'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('serviceOperators');

    if (!tableDescription.paymentclientid) {
      await queryInterface.addColumn('serviceOperators', 'paymentclientid', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableDescription.paymentclientsecret) {
      await queryInterface.addColumn('serviceOperators', 'paymentclientsecret', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable('serviceOperators');

    if (tableDescription.paymentclientid) {
      await queryInterface.removeColumn('serviceOperators', 'paymentclientid');
    }

    if (tableDescription.paymentclientsecret) {
      await queryInterface.removeColumn('serviceOperators', 'paymentclientsecret');
    }
  },
};
