'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('credentials');
    if (!tableDesc.isAutoLogin) {
      await queryInterface.addColumn('credentials', 'isAutoLogin', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('credentials');
    if (tableDesc.isAutoLogin) {
      await queryInterface.removeColumn('credentials', 'isAutoLogin');
    }
  },
};
