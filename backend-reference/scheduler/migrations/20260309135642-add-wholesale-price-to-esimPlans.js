"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("esimPlans");
    if (!tableDescription.wholesalePrice) {
      await queryInterface.addColumn("esimPlans", "wholesalePrice", {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable("esimPlans");
    if (tableDescription.wholesalePrice) {
      await queryInterface.removeColumn("esimPlans", "wholesalePrice");
    }
  }
};