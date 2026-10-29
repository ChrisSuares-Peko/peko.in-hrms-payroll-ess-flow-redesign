"use strict";

const PAYOUTS = "partnerPayouts";

const REFERENCE_KEY = "activeReferenceKey";
const REFERENCE_INDEX = "partnerPayouts_activeReference_unique";

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
        const hasPayouts = await queryInterface.tableExists(PAYOUTS);
        if (!hasPayouts) {
            await queryInterface.createTable(PAYOUTS, {
                id: {
                    type: Sequelize.BIGINT,
                    autoIncrement: true,
                    primaryKey: true,
                    allowNull: false,
                },
                partnerCredentialId: { type: Sequelize.BIGINT, allowNull: true },
                calculatedAmount: { type: Sequelize.DECIMAL(12, 4), allowNull: true },
                amount: { type: Sequelize.DECIMAL(12, 4), allowNull: false, defaultValue: 0.0 },
                payoutDate: { type: Sequelize.DATEONLY, allowNull: false },
                reference: { type: Sequelize.STRING(40), allowNull: true },
                entryType: {
                    type: Sequelize.ENUM("PAYOUT", "REVERSAL"),
                    allowNull: false,
                    defaultValue: "PAYOUT",
                },
                reversesId: { type: Sequelize.BIGINT, allowNull: true },
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
                slipKey: { type: Sequelize.TEXT, allowNull: true },
                slipName: { type: Sequelize.STRING, allowNull: true },
                slipFormat: { type: Sequelize.STRING(10), allowNull: true },
                ...auditColumns(Sequelize),
            });
            await queryInterface.addIndex(PAYOUTS, ["partnerCredentialId", "payoutDate"], {
                name: "partnerPayouts_partner_payoutDate",
            });
            await queryInterface.addIndex(PAYOUTS, ["reversesId"], {
                name: "partnerPayouts_reversesId",
            });
        }

        // MySQL has no partial indexes, so "one live payout per reference per partner" is
        // enforced through a STORED generated column that is NULL outside the live states.
        // NULLs never collide, so a reversed row stops reserving its reference.
        const [duplicates] = await queryInterface.sequelize.query(
            `SELECT partnerCredentialId, reference, COUNT(*) AS total FROM \`${PAYOUTS}\`
             WHERE status = 'ACTIVE' AND entryType = 'PAYOUT' AND reference IS NOT NULL
             GROUP BY partnerCredentialId, reference HAVING total > 1`
        );
        if (duplicates.length) {
            const named = duplicates
                .slice(0, 5)
                .map(row => `${row.partnerCredentialId}:${row.reference}`)
                .join(", ");
            throw new Error(
                `Cannot add the unique payout reference index: ${duplicates.length} live duplicate(s) exist (${named}). ` +
                    "Reverse the duplicates and run the migration again."
            );
        }

        await addGenerated(
            queryInterface,
            PAYOUTS,
            REFERENCE_KEY,
            REFERENCE_INDEX,
            "IF(status = 'ACTIVE' AND entryType = 'PAYOUT' AND reference IS NOT NULL, " +
                "CONCAT(partnerCredentialId, ':', reference), NULL)",
            "VARCHAR(120)"
        );
    },

    async down(queryInterface) {
        const hasPayouts = await queryInterface.tableExists(PAYOUTS);
        if (!hasPayouts) return;

        await dropGenerated(queryInterface, PAYOUTS, REFERENCE_KEY, REFERENCE_INDEX);
        await queryInterface.dropTable(PAYOUTS);
    },
};
