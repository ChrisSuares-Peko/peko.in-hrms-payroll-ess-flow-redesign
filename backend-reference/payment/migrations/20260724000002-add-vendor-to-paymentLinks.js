"use strict";

const TABLE_NAME = "paymentLinks";

// Adds a nullable `vendor` column so a payment link can be attributed to its provider
// ('nupay' for NuPay Collection 360, null = legacy/Decentro). Guarded + idempotent.
const COLUMNS = {
  vendor: "VARCHAR(50) NULL",
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

  // No-op down: dropping the column could destroy provider attribution data.
  async down() {},
};
