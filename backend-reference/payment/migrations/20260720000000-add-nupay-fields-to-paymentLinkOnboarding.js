"use strict";

const TABLE_NAME = "paymentLinkOnboardings";

const NEW_ENUM = "ENUM('pending', 'active', 'suspended', 'rejected', 'approval-pending', 'on_hold')";
const OLD_ENUM = "ENUM('pending', 'active', 'suspended', 'rejected', 'approval-pending')";

const NEW_COLUMNS = {
  vendor: { type: "VARCHAR(20)", default: "'decentro'" },
  entityType: { type: "VARCHAR(30)", default: "NULL" },
  nupayRefNo: { type: "VARCHAR(50)", default: "NULL" },
  onboardingClientReferenceId: { type: "VARCHAR(50)", default: "NULL" },
  credentialsLink: { type: "TEXT", default: null },
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

    for (const [name, def] of Object.entries(NEW_COLUMNS)) {
      if (table[name]) continue;
      const defaultClause = def.default ? `DEFAULT ${def.default}` : "";
      await queryInterface.sequelize.query(
        `ALTER TABLE \`${TABLE_NAME}\` ADD COLUMN \`${name}\` ${def.type} NULL ${defaultClause}`
      );
    }

    const statusType = String(table.status?.type || "").toLowerCase();
    if (!statusType.includes("on_hold")) {
      await queryInterface.sequelize.query(
        `ALTER TABLE \`${TABLE_NAME}\` MODIFY COLUMN \`status\` ${NEW_ENUM} NULL DEFAULT 'pending'`
      );
    }
  },

  async down(queryInterface) {
    if (!(await tableExists(queryInterface))) return;

    const table = await queryInterface.describeTable(TABLE_NAME);

    for (const name of Object.keys(NEW_COLUMNS)) {
      if (!table[name]) continue;
      await queryInterface.sequelize.query(`ALTER TABLE \`${TABLE_NAME}\` DROP COLUMN \`${name}\``);
    }

    const statusType = String(table.status?.type || "").toLowerCase();
    if (statusType.includes("on_hold")) {
      await queryInterface.sequelize.query(
        `UPDATE \`${TABLE_NAME}\` SET \`status\` = 'approval-pending' WHERE \`status\` = 'on_hold'`
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE \`${TABLE_NAME}\` MODIFY COLUMN \`status\` ${OLD_ENUM} NULL DEFAULT 'pending'`
      );
    }
  },
};
