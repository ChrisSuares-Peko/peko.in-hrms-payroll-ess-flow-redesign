"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("nicCodes", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: Sequelize.TEXT,
      level: Sequelize.STRING,
      parent_code: Sequelize.STRING,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });

    // optional but recommended
    await queryInterface.addIndex("nicCodes", ["parent_code"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("nicCodes");
  },
};