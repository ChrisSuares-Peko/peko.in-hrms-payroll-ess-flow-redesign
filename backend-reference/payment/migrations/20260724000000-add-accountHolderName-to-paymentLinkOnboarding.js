"use strict";

const TABLE_NAME = "paymentLinkOnboardings";

// Sync any model columns that may be missing on older environments (add-if-missing, idempotent).
// Triggered by "Unknown column 'accountHolderName'": this env's table predates several model fields.
const COLUMNS = {
  accountHolderName: "VARCHAR(255) NULL",
  phone: "VARCHAR(255) NULL",
  virtualAccountId: "VARCHAR(255) NULL",
  virtualAccountNumber: "VARCHAR(255) NULL",
  virtualIfsc: "VARCHAR(255) NULL",
  providerResponse: "JSON NULL",
  bankVerificationResponse: "JSON NULL",
  consentAcceptedAt: "DATETIME NULL",
  activatedAt: "DATETIME NULL",
  remarks: "TEXT NULL",
  pan: "VARCHAR(10) NULL",
  email: "VARCHAR(255) NULL",
  address: "TEXT NULL",
  panVerifiedAt: "DATETIME NULL",
  bankVerifiedAt: "DATETIME NULL",
  bankName: "VARCHAR(255) NULL",
  accountNumber: "VARCHAR(255) NULL",
  ifsc: "VARCHAR(255) NULL",
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
      if (table[name]) continue; // already present — skip
      await queryInterface.sequelize.query(
        `ALTER TABLE \`${TABLE_NAME}\` ADD COLUMN \`${name}\` ${definition}`
      );
    }
  },

  // Intentionally no-op down: these are pre-existing model columns; dropping them could destroy data.
  async down() {},
};
