"use strict";

const TABLE_NAME = "paymentLinkOnboardings";
const COLUMN = "accountingCharge";

const tableExists = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  return tables
    .map((t) => (typeof t === "string" ? t : t.tableName))
    .some((t) => t.toLowerCase() === TABLE_NAME.toLowerCase());
};

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await tableExists(queryInterface))) return;
    const table = await queryInterface.describeTable(TABLE_NAME);
    if (table[COLUMN]) return;
    await queryInterface.addColumn(TABLE_NAME, COLUMN, {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    if (!(await tableExists(queryInterface))) return;
    const table = await queryInterface.describeTable(TABLE_NAME);
    if (!table[COLUMN]) return;
    await queryInterface.removeColumn(TABLE_NAME, COLUMN);
  },
};
