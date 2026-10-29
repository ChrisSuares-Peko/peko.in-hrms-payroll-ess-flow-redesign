"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("transactions");

    if (!table.refundedAmount) {
      await queryInterface.addColumn("transactions", "refundedAmount", {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("transactions");

    if (table.refundedAmount) {
      await queryInterface.removeColumn("transactions", "refundedAmount");
    }
  },
};
