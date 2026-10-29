"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("esimPlans");
    if (!tableDescription.includedCountries) {
      await queryInterface.addColumn("esimPlans", "includedCountries", {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable("esimPlans");
    if (tableDescription.includedCountries) {
      await queryInterface.removeColumn("esimPlans", "includedCountries");
    }
  },
};