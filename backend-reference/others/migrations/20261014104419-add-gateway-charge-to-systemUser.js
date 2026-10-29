'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('systemUsers');

    if (!tableDescription.gatewayCharge) {
      await queryInterface.addColumn('systemUsers', 'gatewayCharge', {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('systemUsers', 'gatewayCharge');
  },
};
