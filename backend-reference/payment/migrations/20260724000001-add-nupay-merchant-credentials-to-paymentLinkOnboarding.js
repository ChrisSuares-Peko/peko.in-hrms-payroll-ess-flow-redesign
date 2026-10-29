"use strict";

const TABLE_NAME = "paymentLinkOnboardings";

// Per-corporate NuPay merchant API credentials, fetched from the credentials_link vault
// after onboarding success and stored ENCRYPTED. Used for that merchant's collect/status calls.
const COLUMNS = {
  nupayAccessKey: "TEXT NULL",
  nupayAccessSecret: "REDACTED",
  nupayProviderId: "VARCHAR(50) NULL",
  credentialsFetchedAt: "DATETIME NULL",
};

const tableExists = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  return tables
    .map((t) => (typeof t === "string" ? t : t.tableName))
    .some((t) => t.toLowerCase() === TABLE_NAME.toLowerCase());
};

module.exports = {
  async up(queryInterface) {
    if (!(await tableExists(queryInterface))) return;
    const table = await queryInterface.describeTable(TABLE_NAME);
    for (const [name, definition] of Object.entries(COLUMNS)) {
      if (table[name]) continue;
      await queryInterface.sequelize.query(
        `ALTER TABLE \`${TABLE_NAME}\` ADD COLUMN \`${name}\` ${definition}`
      );
    }
  },

  async down(queryInterface) {
    if (!(await tableExists(queryInterface))) return;
    const table = await queryInterface.describeTable(TABLE_NAME);
    for (const name of Object.keys(COLUMNS)) {
      if (!table[name]) continue;
      await queryInterface.sequelize.query(`ALTER TABLE \`${TABLE_NAME}\` DROP COLUMN \`${name}\``);
    }
  },
};
