"use strict";

const OLD_TABLE = "vendorCreditNotes";
const NEW_TABLE = "vendorLedgerEntries";

const OLD_KEY = "activeCreditNoteKey";
const OLD_KEY_INDEX = "vendorCreditNotes_activeNumber_unique";
const NEW_KEY = "activeEntryKey";
const NEW_KEY_INDEX = "vendorLedgerEntries_activeReference_unique";

const OLD_REVERSES_INDEX = "vendorCreditNotes_reversesId";
const NEW_REVERSES_INDEX = "vendorLedgerEntries_reversesId";

const ENTRY_EXPRESSION = `IF(entryType = 'ENTRY' AND status = 'OPEN' AND vendorId IS NOT NULL AND reference IS NOT NULL,
    CONCAT(vendorId, ':', kind, ':', reference),
    NULL)`;

const dropGenerated = async (queryInterface, table, column, index) => {
    const described = await queryInterface.describeTable(table);
    if (!described[column]) return;

    const indexes = await queryInterface.showIndex(table);
    if (indexes.some(row => row.name === index)) {
        await queryInterface.removeIndex(table, index);
    }
    await queryInterface.removeColumn(table, column);
};

const addGenerated = async (queryInterface, table, column, index, expression) => {
    const described = await queryInterface.describeTable(table);
    if (described[column]) return;

    await queryInterface.sequelize.query(
        `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` VARCHAR(160)
         GENERATED ALWAYS AS (${expression}) STORED`
    );
    await queryInterface.addIndex(table, [column], { unique: true, name: index });
};

const renameIndex = async (queryInterface, table, from, to) => {
    const indexes = await queryInterface.showIndex(table);
    if (!indexes.some(row => row.name === from) || indexes.some(row => row.name === to)) return;

    await queryInterface.sequelize.query(
        `ALTER TABLE \`${table}\` RENAME INDEX \`${from}\` TO \`${to}\``
    );
};

module.exports = {
    async up(queryInterface, Sequelize) {
        const hasNew = await queryInterface.tableExists(NEW_TABLE);
        const hasOld = await queryInterface.tableExists(OLD_TABLE);
        if (hasNew || !hasOld) return;

        // MySQL refuses to rename a column a stored generated column reads, so the key is
        // dropped first and rebuilt at the end over the new column names.
        await dropGenerated(queryInterface, OLD_TABLE, OLD_KEY, OLD_KEY_INDEX);

        const described = await queryInterface.describeTable(OLD_TABLE);
        if (described.creditNoteNumber && !described.reference) {
            await queryInterface.renameColumn(OLD_TABLE, "creditNoteNumber", "reference");
        }

        if (!described.kind) {
            await queryInterface.addColumn(OLD_TABLE, "kind", {
                type: Sequelize.ENUM("CREDIT_NOTE", "COMMISSION"),
                allowNull: false,
                defaultValue: "CREDIT_NOTE",
            });
        }

        // entryType now says original or reversal; what the entry IS moved to kind.
        await queryInterface.sequelize.query(
            `UPDATE \`${OLD_TABLE}\` SET entryType = 'CREDIT_NOTE' WHERE entryType NOT IN ('CREDIT_NOTE', 'REVERSAL')`
        );
        await queryInterface.changeColumn(OLD_TABLE, "entryType", {
            type: Sequelize.ENUM("CREDIT_NOTE", "ENTRY", "REVERSAL"),
            allowNull: false,
            defaultValue: "ENTRY",
        });
        await queryInterface.sequelize.query(
            `UPDATE \`${OLD_TABLE}\` SET entryType = 'ENTRY' WHERE entryType = 'CREDIT_NOTE'`
        );
        await queryInterface.changeColumn(OLD_TABLE, "entryType", {
            type: Sequelize.ENUM("ENTRY", "REVERSAL"),
            allowNull: false,
            defaultValue: "ENTRY",
        });

        await queryInterface.renameTable(OLD_TABLE, NEW_TABLE);
        await renameIndex(queryInterface, NEW_TABLE, OLD_REVERSES_INDEX, NEW_REVERSES_INDEX);
        await addGenerated(queryInterface, NEW_TABLE, NEW_KEY, NEW_KEY_INDEX, ENTRY_EXPRESSION);
    },

    async down(queryInterface, Sequelize) {
        const hasNew = await queryInterface.tableExists(NEW_TABLE);
        if (!hasNew) return;

        await dropGenerated(queryInterface, NEW_TABLE, NEW_KEY, NEW_KEY_INDEX);

        await queryInterface.sequelize.query(
            `DELETE FROM \`${NEW_TABLE}\` WHERE kind = 'COMMISSION'`
        );
        await queryInterface.changeColumn(NEW_TABLE, "entryType", {
            type: Sequelize.ENUM("ENTRY", "CREDIT_NOTE", "REVERSAL"),
            allowNull: false,
            defaultValue: "CREDIT_NOTE",
        });
        await queryInterface.sequelize.query(
            `UPDATE \`${NEW_TABLE}\` SET entryType = 'CREDIT_NOTE' WHERE entryType = 'ENTRY'`
        );
        await queryInterface.changeColumn(NEW_TABLE, "entryType", {
            type: Sequelize.ENUM("CREDIT_NOTE", "REVERSAL"),
            allowNull: false,
            defaultValue: "CREDIT_NOTE",
        });

        const described = await queryInterface.describeTable(NEW_TABLE);
        if (described.kind) await queryInterface.removeColumn(NEW_TABLE, "kind");
        if (described.reference && !described.creditNoteNumber) {
            await queryInterface.renameColumn(NEW_TABLE, "reference", "creditNoteNumber");
        }

        await queryInterface.renameTable(NEW_TABLE, OLD_TABLE);
        await renameIndex(queryInterface, OLD_TABLE, NEW_REVERSES_INDEX, OLD_REVERSES_INDEX);
        await addGenerated(
            queryInterface,
            OLD_TABLE,
            OLD_KEY,
            OLD_KEY_INDEX,
            `IF(entryType = 'CREDIT_NOTE' AND status = 'OPEN' AND vendorId IS NOT NULL AND creditNoteNumber IS NOT NULL,
                CONCAT(vendorId, ':', creditNoteNumber),
                NULL)`
        );
    },
};
