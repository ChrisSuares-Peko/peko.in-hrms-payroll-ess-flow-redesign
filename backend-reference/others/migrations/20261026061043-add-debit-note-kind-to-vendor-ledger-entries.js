"use strict";

const TABLE = "vendorLedgerEntries";
const KEY = "activeEntryKey";
const KEY_INDEX = "vendorLedgerEntries_activeReference_unique";

const ENTRY_EXPRESSION = `IF(entryType = 'ENTRY' AND status = 'OPEN' AND vendorId IS NOT NULL AND reference IS NOT NULL,
    CONCAT(vendorId, ':', kind, ':', reference),
    NULL)`;

const kindColumn = (Sequelize, values) => ({
    type: Sequelize.ENUM(...values),
    allowNull: false,
    defaultValue: "CREDIT_NOTE",
});

// MySQL refuses to change a column a stored generated column reads, so the active-reference
// key is dropped before the enum changes and rebuilt over the same expression afterwards.
const dropGenerated = async queryInterface => {
    const described = await queryInterface.describeTable(TABLE);
    if (!described[KEY]) return;

    const indexes = await queryInterface.showIndex(TABLE);
    if (indexes.some(row => row.name === KEY_INDEX)) {
        await queryInterface.removeIndex(TABLE, KEY_INDEX);
    }
    await queryInterface.removeColumn(TABLE, KEY);
};

const addGenerated = async queryInterface => {
    const described = await queryInterface.describeTable(TABLE);
    if (described[KEY]) return;

    await queryInterface.sequelize.query(
        `ALTER TABLE \`${TABLE}\` ADD COLUMN \`${KEY}\` VARCHAR(160)
         GENERATED ALWAYS AS (${ENTRY_EXPRESSION}) STORED`
    );
    await queryInterface.addIndex(TABLE, [KEY], { unique: true, name: KEY_INDEX });
};

module.exports = {
    async up(queryInterface, Sequelize) {
        await dropGenerated(queryInterface);
        await queryInterface.changeColumn(
            TABLE,
            "kind",
            kindColumn(Sequelize, ["CREDIT_NOTE", "COMMISSION", "COST_OF_SALES", "DEBIT_NOTE"])
        );
        await addGenerated(queryInterface);
    },

    async down(queryInterface, Sequelize) {
        await dropGenerated(queryInterface);
        await queryInterface.sequelize.query(`DELETE FROM \`${TABLE}\` WHERE kind = 'DEBIT_NOTE'`);
        await queryInterface.changeColumn(
            TABLE,
            "kind",
            kindColumn(Sequelize, ["CREDIT_NOTE", "COMMISSION", "COST_OF_SALES"])
        );
        await addGenerated(queryInterface);
    },
};
