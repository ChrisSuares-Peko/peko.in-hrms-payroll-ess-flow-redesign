'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('corporateUsers');
    if (!tableDesc.essAccess) {
      await queryInterface.addColumn('corporateUsers', 'essAccess', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('corporateUsers');
    if (tableDesc.essAccess) {
      await queryInterface.removeColumn('corporateUsers', 'essAccess');
    }
  },
};
