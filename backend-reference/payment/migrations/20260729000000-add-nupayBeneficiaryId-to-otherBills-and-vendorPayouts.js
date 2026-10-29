"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const otherBills = await queryInterface.describeTable("otherBills");
    if (!otherBills.nupayBeneficiaryId) {
      await queryInterface.addColumn("otherBills", "nupayBeneficiaryId", {
        type: Sequelize.BIGINT,
        allowNull: true,
      });
    }

    const vendorPayouts = await queryInterface.describeTable("vendorPayouts");
    if (!vendorPayouts.nupayBeneficiaryId) {
      await queryInterface.addColumn("vendorPayouts", "nupayBeneficiaryId", {
        type: Sequelize.BIGINT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const otherBills = await queryInterface.describeTable("otherBills");
    if (otherBills.nupayBeneficiaryId) {
      await queryInterface.removeColumn("otherBills", "nupayBeneficiaryId");
    }

    const vendorPayouts = await queryInterface.describeTable("vendorPayouts");
    if (vendorPayouts.nupayBeneficiaryId) {
      await queryInterface.removeColumn("vendorPayouts", "nupayBeneficiaryId");
    }
  },
};
