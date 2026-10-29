"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableDesc = await queryInterface.describeTable("nupayMerchantOnboardings");
      if (!tableDesc.rejectionReason) {
        await queryInterface.addColumn("nupayMerchantOnboardings", "rejectionReason", {
          type: Sequelize.TEXT,
          allowNull: true,
        });
      }
    } catch (err) {
      // Table doesn't exist yet — will be created with the column by Sequelize sync
    }
  },

  async down(queryInterface) {
    try {
      const tableDesc = await queryInterface.describeTable("nupayMerchantOnboardings");
      if (tableDesc.rejectionReason) {
        await queryInterface.removeColumn("nupayMerchantOnboardings", "rejectionReason");
      }
    } catch (err) {
      // Table doesn't exist, nothing to revert
    }
  },
};
