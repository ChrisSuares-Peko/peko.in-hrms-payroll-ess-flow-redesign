"use strict";

const SETTLEMENTS = "paymentGatewaySettlements";

const OPENING_KEY = "activeOpeningKey";
const OPENING_INDEX = "paymentGatewaySettlements_activeOpening_unique";

const dropGenerated = async (queryInterface, table, column, index) => {
    const described = await queryInterface.describeTable(table);
    if (!described[column]) return;

    const indexes = await queryInterface.showIndex(table);
    if (indexes.some(row => row.name === index)) {
        await queryInterface.removeIndex(table, index);
    }
    await queryInterface.removeColumn(table, column);
};

const addGenerated = async (queryInterface, table, column, index, expression, type) => {
    const described = await queryInterface.describeTable(table);
    if (described[column]) return;

    await queryInterface.sequelize.query(
        `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type}
         GENERATED ALWAYS AS (${expression}) STORED`
    );
    await queryInterface.addIndex(table, [column], { unique: true, name: index });
};

module.exports = {
    async up(queryInterface) {
        const hasSettlements = await queryInterface.tableExists(SETTLEMENTS);
        if (!hasSettlements) return;

        // A settlement that predates the portal has no receipt and no fee behind it, only a
        // position. Widening the kind keeps entryType meaning only entry-or-reversal, so a
        // reversed opening can never be read as a reversed receipt.
        await queryInterface.sequelize.query(
            `ALTER TABLE \`${SETTLEMENTS}\`
             MODIFY COLUMN \`entryKind\` ENUM('RECEIPT','FEE','OPENING') NOT NULL DEFAULT 'RECEIPT'`
        );

        // MySQL has no partial indexes, so "one live opening per gateway" is enforced through
        // a STORED generated column that is NULL outside the live states. NULLs never collide,
        // so reversing an opening frees the slot for a new one.
        const [duplicates] = await queryInterface.sequelize.query(
            `SELECT gatewayAccountId, COUNT(*) AS total FROM \`${SETTLEMENTS}\`
             WHERE entryKind = 'OPENING' AND entryType = 'ENTRY' AND status = 'ACTIVE'
             GROUP BY gatewayAccountId HAVING total > 1`
        );
        if (duplicates.length) {
            const named = duplicates
                .slice(0, 5)
                .map(row => String(row.gatewayAccountId))
                .join(", ");
            throw new Error(
                `Cannot add the unique opening balance index: ${duplicates.length} gateway(s) already carry more than one live opening (${named}). ` +
                    "Reverse the duplicates and run the migration again."
            );
        }

        await addGenerated(
            queryInterface,
            SETTLEMENTS,
            OPENING_KEY,
            OPENING_INDEX,
            "IF(entryKind = 'OPENING' AND entryType = 'ENTRY' AND status = 'ACTIVE', " +
                "gatewayAccountId, NULL)",
            "VARCHAR(64)"
        );
    },

    async down(queryInterface) {
        const hasSettlements = await queryInterface.tableExists(SETTLEMENTS);
        if (!hasSettlements) return;

        await dropGenerated(queryInterface, SETTLEMENTS, OPENING_KEY, OPENING_INDEX);
        await queryInterface.sequelize.query(
            `DELETE FROM \`${SETTLEMENTS}\` WHERE entryKind = 'OPENING'`
        );
        await queryInterface.sequelize.query(
            `ALTER TABLE \`${SETTLEMENTS}\`
             MODIFY COLUMN \`entryKind\` ENUM('RECEIPT','FEE') NOT NULL DEFAULT 'RECEIPT'`
        );
    },
};
