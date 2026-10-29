'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('corporateUsers');
    if (!tableDesc.uuid) {
      await queryInterface.addColumn('corporateUsers', 'uuid', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDesc = await queryInterface.describeTable('corporateUsers');
    if (tableDesc.uuid) {
      await queryInterface.removeColumn('corporateUsers', 'uuid');
    }
  },
};
