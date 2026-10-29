'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('eSigns', 'status', {
      type: Sequelize.ENUM('PENDING', 'COMPLETED', 'REJECTED', 'EXPIRED'),
      defaultValue: 'PENDING',
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('eSigns', 'status', {
      type: Sequelize.ENUM('PENDING', 'COMPLETED', 'EXPIRED'),
      defaultValue: 'PENDING',
      allowNull: true,
    });
  },
};
