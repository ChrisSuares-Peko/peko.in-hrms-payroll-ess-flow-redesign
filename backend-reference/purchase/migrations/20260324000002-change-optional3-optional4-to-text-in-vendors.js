'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('vendors', 'optional3', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.changeColumn('vendors', 'optional4', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('vendors', 'optional3', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('vendors', 'optional4', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};
