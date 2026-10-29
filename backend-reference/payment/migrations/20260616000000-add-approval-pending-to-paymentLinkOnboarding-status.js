"use strict";

const TABLE_NAME = "paymentLinkOnboardings";

const NEW_ENUM = "ENUM('pending', 'active', 'suspended', 'rejected', 'approval-pending')";
const OLD_ENUM = "ENUM('pending', 'active', 'suspended', 'rejected')";

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
    const statusType = String(table.status?.type || "").toLowerCase();
    if (statusType.includes("approval-pending")) return; // already present, skip

    await queryInterface.sequelize.query(
      `ALTER TABLE \`${TABLE_NAME}\` MODIFY COLUMN \`status\` ${NEW_ENUM} NULL DEFAULT 'pending'`
    );
  },

  async down(queryInterface) {
    if (!(await tableExists(queryInterface))) return;

    const table = await queryInterface.describeTable(TABLE_NAME);
    const statusType = String(table.status?.type || "").toLowerCase();
    if (!statusType.includes("approval-pending")) return; // nothing to roll back

    // Move rows using the value being removed back to a safe default first
    await queryInterface.sequelize.query(
      `UPDATE \`${TABLE_NAME}\` SET \`status\` = 'pending' WHERE \`status\` = 'approval-pending'`
    );

    await queryInterface.sequelize.query(
      `ALTER TABLE \`${TABLE_NAME}\` MODIFY COLUMN \`status\` ${OLD_ENUM} NULL DEFAULT 'pending'`
    );
  },
};
