'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('shipmentOrders', 'consentAgreed', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('shipmentOrders', 'consentAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('shipmentOrders', 'consentAgreed');
    await queryInterface.removeColumn('shipmentOrders', 'consentAt');
  },
};
