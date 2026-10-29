"use strict";

const TABLE_NAME = "paymentLinks";

// Adds nullable UTR columns so the transaction detail view can show payment + settlement references.
// utr           = payment UTR (from the NuPay collection webhook)
// settlementUtr = settlement UTR (from the NuPay settlement webhook)
const COLUMNS = {
  utr: "VARCHAR(255) NULL",
  settlementUtr: "VARCHAR(255) NULL",
};

const resolveTableName = async (queryInterface) => {
  const tables = (await queryInterface.showAllTables()).map((t) =>
    typeof t === "string" ? t : t.tableName
  );
  return tables.find((t) => t.toLowerCase() === TABLE_NAME.toLowerCase());
};

module.exports = {
  async up(queryInterface) {
    const tableName = await resolveTableName(queryInterface);
    if (!tableName) return;
    const table = await queryInterface.describeTable(tableName);
    for (const [name, definition] of Object.entries(COLUMNS)) {
      if (table[name]) continue; // already present — skip
      await queryInterface.sequelize.query(
        `ALTER TABLE \`${tableName}\` ADD COLUMN \`${name}\` ${definition}`
      );
    }
  },

  // No-op down: dropping the columns could destroy reconciliation data.
  async down() {},
};
