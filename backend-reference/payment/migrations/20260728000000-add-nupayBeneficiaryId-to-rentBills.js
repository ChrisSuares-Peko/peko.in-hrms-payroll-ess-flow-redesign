"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("rentBills");

    if (!table.nupayBeneficiaryId) {
      await queryInterface.addColumn("rentBills", "nupayBeneficiaryId", {
        type: Sequelize.BIGINT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("rentBills");

    if (table.nupayBeneficiaryId) {
      await queryInterface.removeColumn("rentBills", "nupayBeneficiaryId");
    }
  },
};
