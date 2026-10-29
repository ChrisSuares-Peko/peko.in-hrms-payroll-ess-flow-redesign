"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("payoutBeneficiaries");

    if (!table.paymentCategory) {
      await queryInterface.addColumn("payoutBeneficiaries", "paymentCategory", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("payoutBeneficiaries");

    if (table.paymentCategory) {
      await queryInterface.removeColumn("payoutBeneficiaries", "paymentCategory");
    }
  },
};
