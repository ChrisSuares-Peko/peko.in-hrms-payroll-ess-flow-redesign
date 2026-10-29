"use strict";

const SETTLEMENTS = "paymentGatewaySettlements";

const REFERENCE_KEY = "activeReferenceKey";
const REFERENCE_INDEX = "paymentGatewaySettlements_activeReference_unique";

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
    async up(queryInterface, Sequelize) {
        const hasSettlements = await queryInterface.tableExists(SETTLEMENTS);
        if (!hasSettlements) {
            await queryInterface.createTable(SETTLEMENTS, {
                id: {
                    type: Sequelize.BIGINT,
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                gatewayAccountId: { type: Sequelize.STRING(64), allowNull: false },
                settlementId: { type: Sequelize.BIGINT, allowNull: true },
                entryKind: {
                    type: Sequelize.ENUM("RECEIPT", "FEE"),
                    allowNull: false,
                    defaultValue: "RECEIPT",
                },
                entryType: {
                    type: Sequelize.ENUM("ENTRY", "REVERSAL"),
                    allowNull: false,
                    defaultValue: "ENTRY",
                },
                expectedAmount: { type: Sequelize.DECIMAL(12, 4), allowNull: true },
                amount: { type: Sequelize.DECIMAL(12, 4), allowNull: false, defaultValue: 0.0 },
                entryDate: { type: Sequelize.DATEONLY, allowNull: false },
                reference: { type: Sequelize.STRING(40), allowNull: true },
                mode: {
                    type: Sequelize.ENUM("NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"),
                    allowNull: false,
                    defaultValue: "NEFT",
                },
                note: { type: Sequelize.TEXT, allowNull: true },
                status: {
                    type: Sequelize.ENUM("ACTIVE", "VOIDED"),
                    allowNull: false,
                    defaultValue: "ACTIVE",
                },
                reversesId: { type: Sequelize.BIGINT, allowNull: true },
                slipKey: { type: Sequelize.TEXT, allowNull: true },
                slipName: { type: Sequelize.STRING, allowNull: true },
                slipFormat: { type: Sequelize.STRING(10), allowNull: true },
                ...auditColumns(Sequelize),
            });
            await queryInterface.addIndex(SETTLEMENTS, ["gatewayAccountId", "entryDate"], {
                name: "paymentGatewaySettlements_gateway_entryDate",
            });
            await queryInterface.addIndex(SETTLEMENTS, ["settlementId"], {
                name: "paymentGatewaySettlements_settlementId",
            });
            await queryInterface.addIndex(SETTLEMENTS, ["reversesId"], {
                name: "paymentGatewaySettlements_reversesId",
            });
        }

        // MySQL has no partial indexes, so "one live receipt per reference per gateway" is
        // enforced through a STORED generated column that is NULL outside the live states.
        // NULLs never collide, so a reversed row stops reserving its reference. The key is
        // scoped to RECEIPT because the fee deliberately shares its receipt's reference.
        const [duplicates] = await queryInterface.sequelize.query(
            `SELECT gatewayAccountId, reference, COUNT(*) AS total FROM \`${SETTLEMENTS}\`
             WHERE status = 'ACTIVE' AND entryType = 'ENTRY' AND entryKind = 'RECEIPT'
                AND reference IS NOT NULL
             GROUP BY gatewayAccountId, reference HAVING total > 1`
        );
        if (duplicates.length) {
            const named = duplicates
                .slice(0, 5)
                .map(row => `${row.gatewayAccountId}:${row.reference}`)
                .join(", ");
            throw new Error(
                `Cannot add the unique settlement reference index: ${duplicates.length} live duplicate(s) exist (${named}). ` +
                    "Reverse the duplicates and run the migration again."
            );
        }

        await addGenerated(
            queryInterface,
            SETTLEMENTS,
            REFERENCE_KEY,
            REFERENCE_INDEX,
            "IF(status = 'ACTIVE' AND entryType = 'ENTRY' AND entryKind = 'RECEIPT' " +
                "AND reference IS NOT NULL, CONCAT(gatewayAccountId, ':', reference), NULL)",
            "VARCHAR(120)"
        );
    },

    async down(queryInterface) {
        const hasSettlements = await queryInterface.tableExists(SETTLEMENTS);
        if (!hasSettlements) return;

        await dropGenerated(queryInterface, SETTLEMENTS, REFERENCE_KEY, REFERENCE_INDEX);
        await queryInterface.dropTable(SETTLEMENTS);
    },
};
