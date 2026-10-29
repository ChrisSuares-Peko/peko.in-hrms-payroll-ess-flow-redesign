"use strict";

const TABLE_NAME = "paymentLinkOnboardings";

const tableExists = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  return tables.map((t) => (typeof t === "string" ? t : t.tableName)).includes(TABLE_NAME);
};

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await tableExists(queryInterface))) return;

    const table = await queryInterface.describeTable(TABLE_NAME);

    if (!table.email) {
      await queryInterface.addColumn(TABLE_NAME, "email", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!table.address) {
      await queryInterface.addColumn(TABLE_NAME, "address", {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    if (!(await tableExists(queryInterface))) return;

    const table = await queryInterface.describeTable(TABLE_NAME);

    if (table.email) {
      await queryInterface.removeColumn(TABLE_NAME, "email");
    }

    if (table.address) {
      await queryInterface.removeColumn(TABLE_NAME, "address");
    }
  },
};
