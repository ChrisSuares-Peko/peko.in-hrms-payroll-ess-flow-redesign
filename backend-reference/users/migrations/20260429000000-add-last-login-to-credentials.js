'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('credentials');
    if (!tableDesc.lastLogin) {
      await queryInterface.addColumn('credentials', 'lastLogin', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('credentials', 'lastLogin');
  },
};
