"use strict";

const TABLES = [
    "vendorDeposits",
    "vendorLedgerEntries",
    "partnerPayouts",
    "partnerLedgerEntries",
    "paymentGatewaySettlements",
    "configAuditLogs",
];

const COLUMN = "ipAddress";

const describeOrNull = async (queryInterface, table, transaction) => {
    try {
        return await queryInterface.describeTable(table, { transaction });
    } catch (error) {
        return null;
    }
};

module.exports = {
    // A table the app has not created yet is skipped: it comes up with the column from its model.
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async transaction => {
            for (const table of TABLES) {
                const existing = await describeOrNull(queryInterface, table, transaction);
                if (existing && !existing[COLUMN]) {
                    await queryInterface.addColumn(
                        table,
                        COLUMN,
                        { type: Sequelize.STRING(64), allowNull: true },
                        { transaction }
                    );
                }
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async transaction => {
            for (const table of TABLES) {
                const existing = await describeOrNull(queryInterface, table, transaction);
                if (existing && existing[COLUMN]) {
                    await queryInterface.removeColumn(table, COLUMN, { transaction });
                }
            }
        });
    },
};
