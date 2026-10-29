"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("esimProfiles");

    if (!table.esimUid) {
      await queryInterface.addColumn("esimProfiles", "esimUid", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.activationCode) {
      await queryInterface.addColumn("esimProfiles", "activationCode", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!table.corporateTxnId) {
      await queryInterface.addColumn("esimProfiles", "corporateTxnId", {
        type: Sequelize.BIGINT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("esimProfiles");

    if (table.esimUid) {
      await queryInterface.removeColumn("esimProfiles", "esimUid");
    }
    if (table.activationCode) {
      await queryInterface.removeColumn("esimProfiles", "activationCode");
    }
    if (table.corporateTxnId) {
      await queryInterface.removeColumn("esimProfiles", "corporateTxnId");
    }
  },
};
