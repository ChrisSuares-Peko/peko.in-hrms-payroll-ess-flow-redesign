"use strict";

const ENTRIES = "partnerLedgerEntries";

const ENTRY_KEY = "activeEntryKey";
const ENTRY_KEY_INDEX = "partnerLedgerEntries_activeReference_unique";

const ENTRY_EXPRESSION = `IF(entryType = 'ENTRY' AND status = 'OPEN' AND partnerCredentialId IS NOT NULL AND reference IS NOT NULL,
    CONCAT(partnerCredentialId, ':', kind, ':', reference),
    NULL)`;

const ENTRY_KEY_COLUMNS = ["entryType", "status", "partnerCredentialId", "kind", "reference"];

const auditColumns = Sequelize => ({
    recordedById: { type: Sequelize.BIGINT, allowNull: true },
    recordedByName: { type: Sequelize.STRING, allowNull: true },
    voidedById: { type: Sequelize.BIGINT, allowNull: true },
    voidedByName: { type: Sequelize.STRING, allowNull: true },
    voidedAt: { type: Sequelize.DATE, allowNull: true },
    voidReason: { type: Sequelize.TEXT, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
});

const dropGenerated = async (queryInterface, table, column, index) => {
    const described = await queryInterface.describeTable(table);
    if (!described[column]) return;

    const indexes = await queryInterface.showIndex(table);
    if (indexes.some(row => row.name === index)) {
        await queryInterface.removeIndex(table, index);
    }
    await queryInterface.removeColumn(table, column);
};

// MySQL refuses a stored generated column built on a column that carries a foreign key.
const dropForeignKeys = async (queryInterface, table, columns) => {
    const references = await queryInterface.getForeignKeyReferencesForTable(table);
    const names = new Set(references.filter(row => columns.includes(row.columnName)).map(row => row.constraintName));
    for (const name of names) {
        await queryInterface.removeConstraint(table, name);
    }
};

const addGenerated = async (queryInterface, table, column, index, expression, baseColumns) => {
    const described = await queryInterface.describeTable(table);
    if (described[column]) return;

    await dropForeignKeys(queryInterface, table, baseColumns);
    await queryInterface.sequelize.query(
        `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` VARCHAR(160)
         GENERATED ALWAYS AS (${expression}) STORED`
    );
    await queryInterface.addIndex(table, [column], { unique: true, name: index });
};

module.exports = {
    async up(queryInterface, Sequelize) {
        const hasEntries = await queryInterface.tableExists(ENTRIES);
        if (!hasEntries) {
            await queryInterface.createTable(ENTRIES, {
                id: {
                    type: Sequelize.BIGINT,
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                partnerCredentialId: { type: Sequelize.BIGINT, allowNull: true },
                kind: {
                    type: Sequelize.ENUM("DEBIT_NOTE"),
                    allowNull: false,
                    defaultValue: "DEBIT_NOTE",
                },
                reference: { type: Sequelize.STRING(40), allowNull: false },
                amount: { type: Sequelize.DECIMAL(12, 4), allowNull: false, defaultValue: 0.0 },
                issueDate: { type: Sequelize.DATEONLY, allowNull: false },
                reason: { type: Sequelize.TEXT, allowNull: true },
                againstCorporateTxnId: { type: Sequelize.STRING, allowNull: true },
                status: {
                    type: Sequelize.ENUM("OPEN", "VOIDED"),
                    allowNull: false,
                    defaultValue: "OPEN",
                },
                entryType: {
                    type: Sequelize.ENUM("ENTRY", "REVERSAL"),
                    allowNull: false,
                    defaultValue: "ENTRY",
                },
                reversesId: { type: Sequelize.BIGINT, allowNull: true },
                slipKey: { type: Sequelize.TEXT, allowNull: true },
                slipName: { type: Sequelize.STRING, allowNull: true },
                slipFormat: { type: Sequelize.STRING(10), allowNull: true },
                ...auditColumns(Sequelize),
            });
            await queryInterface.addIndex(ENTRIES, ["partnerCredentialId", "kind", "issueDate"], {
                name: "partnerLedgerEntries_partner_kind_issueDate",
            });
            await queryInterface.addIndex(ENTRIES, ["reversesId"], {
                name: "partnerLedgerEntries_reversesId",
            });
        }

        // MySQL has no partial indexes, so "one live entry per reference per partner and kind"
        // is enforced through a STORED generated column that is NULL outside the live states.
        // NULLs never collide, so a reversed row stops reserving its reference.
        await addGenerated(queryInterface, ENTRIES, ENTRY_KEY, ENTRY_KEY_INDEX, ENTRY_EXPRESSION, ENTRY_KEY_COLUMNS);
    },

    async down(queryInterface) {
        const hasEntries = await queryInterface.tableExists(ENTRIES);
        if (!hasEntries) return;

        await dropGenerated(queryInterface, ENTRIES, ENTRY_KEY, ENTRY_KEY_INDEX);
        await queryInterface.dropTable(ENTRIES);
    },
};
