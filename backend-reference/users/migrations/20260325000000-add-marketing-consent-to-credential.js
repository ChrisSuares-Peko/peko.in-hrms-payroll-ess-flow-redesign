'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('credentials');
    if (!tableDesc.marketingConsent) {
      await queryInterface.addColumn('credentials', 'marketingConsent', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('credentials', 'marketingConsent');
  },
};
