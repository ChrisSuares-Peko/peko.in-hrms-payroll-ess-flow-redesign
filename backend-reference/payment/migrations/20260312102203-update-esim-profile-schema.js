"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {

    const table = await queryInterface.describeTable("esimProfiles");

    // rename vendor → installationUrl only if vendor exists
    if (table.vendor) {
      await queryInterface.renameColumn(
        "esimProfiles",
        "vendor",
        "installationUrl"
      );
    }

    // Step 1: temporarily change column to STRING
    await queryInterface.changeColumn("esimProfiles", "status", {
      type: Sequelize.STRING
    });

    // Step 2: convert existing values
    await queryInterface.sequelize.query(`
      UPDATE esimProfiles
      SET status = 'RELEASED'
      WHERE status IN ('ACTIVE', 'EXPIRED', 'SUSPENDED')
    `);

    // Step 3: change to new ENUM
    await queryInterface.changeColumn("esimProfiles", "status", {
      type: Sequelize.ENUM(
        "RELEASED",
        "INSTALLED",
        "DISABLED",
        "ERROR"
      ),
      defaultValue: "RELEASED"
    });

  },

  async down(queryInterface, Sequelize) {

    const table = await queryInterface.describeTable("esimProfiles");

    await queryInterface.changeColumn("esimProfiles", "status", {
      type: Sequelize.STRING
    });

    await queryInterface.changeColumn("esimProfiles", "status", {
      type: Sequelize.ENUM(
        "ACTIVE",
        "EXPIRED",
        "SUSPENDED"
      ),
      defaultValue: "ACTIVE"
    });

    // rename back only if installationUrl exists
    if (table.installationUrl) {
      await queryInterface.renameColumn(
        "esimProfiles",
        "installationUrl",
        "vendor"
      );
    }

  }
};