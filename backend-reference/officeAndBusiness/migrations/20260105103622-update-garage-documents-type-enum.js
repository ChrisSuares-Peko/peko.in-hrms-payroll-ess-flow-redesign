'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("garage_documents", "type", {
      type: Sequelize.ENUM(
        "Aadhaar",
        "PAN",
        "DL",
        "RC",
        "Permit",
        "Insurance",
        "PUC",
        "Fitness",
        "RoadTax",
        "Other"
      ),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("garage_documents", "type", {
      type: Sequelize.ENUM(
        "Aadhaar",
        "PAN",
        "DL",
        "RC",
        "Permit",
        "Insurance",
        "PUCC",
        "Fitness",
        "RoadTax",
        "Other"
      ),
      allowNull: false,
    });
  },
};
