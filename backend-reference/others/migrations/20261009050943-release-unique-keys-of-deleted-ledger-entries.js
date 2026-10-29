"use strict";

const KEYS = [
    {
        table: "vendorDeposits",
        column: "activeReferenceKey",
        index: "vendorDeposits_activeReference_unique",
        type: "VARCHAR(120)",
        expression:
            "IF(entryType = 'DEPOSIT' AND status = 'ACTIVE' AND vendorId IS NOT NULL AND reference IS NOT NULL, " +
            "CONCAT(vendorId, ':', reference), NULL)",
    },
    {
        table: "vendorDeposits",
        column: "activeOpeningKey",
        index: "vendorDeposits_activeOpening_unique",
        type: "BIGINT",
        expression: "IF(entryType = 'OPENING' AND status = 'ACTIVE', vendorId, NULL)",
    },
    {
        table: "vendorLedgerEntries",
        column: "activeEntryKey",
        index: "vendorLedgerEntries_activeReference_unique",
        type: "VARCHAR(160)",
        expression:
            "IF(entryType = 'ENTRY' AND status = 'OPEN' AND vendorId IS NOT NULL AND reference IS NOT NULL, " +
            "CONCAT(vendorId, ':', kind, ':', reference), NULL)",
    },
    {
        table: "partnerPayouts",
        column: "activeReferenceKey",
        index: "partnerPayouts_activeReference_unique",
        type: "VARCHAR(120)",
        expression:
            "IF(status = 'ACTIVE' AND entryType = 'PAYOUT' AND reference IS NOT NULL, " +
            "CONCAT(partnerCredentialId, ':', reference), NULL)",
    },
    {
        table: "partnerPayouts",
        column: "activeOpeningKey",
        index: "partnerPayouts_activeOpening_unique",
        type: "BIGINT",
        expression:
            "IF(entryKind = 'OPENING' AND entryType <> 'REVERSAL' AND status = 'ACTIVE', " +
            "partnerCredentialId, NULL)",
    },
    {
        table: "partnerLedgerEntries",
        column: "activeEntryKey",
        index: "partnerLedgerEntries_activeReference_unique",
        type: "VARCHAR(160)",
        expression:
            "IF(entryType = 'ENTRY' AND status = 'OPEN' AND partnerCredentialId IS NOT NULL AND reference IS NOT NULL, " +
            "CONCAT(partnerCredentialId, ':', kind, ':', reference), NULL)",
    },
    {
        table: "paymentGatewaySettlements",
        column: "activeReferenceKey",
        index: "paymentGatewaySettlements_activeReference_unique",
        type: "VARCHAR(120)",
        expression:
            "IF(status = 'ACTIVE' AND entryType = 'ENTRY' AND entryKind = 'RECEIPT' " +
            "AND reference IS NOT NULL, CONCAT(gatewayAccountId, ':', reference), NULL)",
    },
    {
        table: "paymentGatewaySettlements",
        column: "activeOpeningKey",
        index: "paymentGatewaySettlements_activeOpening_unique",
        type: "VARCHAR(64)",
        expression:
            "IF(entryKind = 'OPENING' AND entryType = 'ENTRY' AND status = 'ACTIVE', " +
            "gatewayAccountId, NULL)",
    },
];

const withoutDeleted = expression => `IF(deletedAt IS NULL, ${expression}, NULL)`;

const rebuildKey = async (queryInterface, { table, column, index, type }, expression, { needsDeletedAt }) => {
    const described = await queryInterface.describeTable(table);
    if (!described[column]) return false;
    if (needsDeletedAt && !described.deletedAt) {
        throw new Error(`${table} has no deletedAt column, so its keys cannot leave deleted entries out`);
    }

    const indexes = await queryInterface.showIndex(table);
    if (indexes.some(row => row.name === index)) {
        await queryInterface.removeIndex(table, index);
    }
    await queryInterface.removeColumn(table, column);
    await queryInterface.sequelize.query(
        `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type}
         GENERATED ALWAYS AS (${expression}) STORED`
    );
    await queryInterface.addIndex(table, [column], { unique: true, name: index });
    return true;
};

module.exports = {
    KEYS,
    withoutDeleted,

    async up(queryInterface) {
        for (const key of KEYS) {
            await rebuildKey(queryInterface, key, withoutDeleted(key.expression), { needsDeletedAt: true });
        }
    },

    async down(queryInterface) {
        for (const key of KEYS) {
            await rebuildKey(queryInterface, key, key.expression, { needsDeletedAt: false });
        }
    },
};
