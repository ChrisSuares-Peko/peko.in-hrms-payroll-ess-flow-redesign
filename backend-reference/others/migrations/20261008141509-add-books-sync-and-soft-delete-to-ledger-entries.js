"use strict";

const TABLES = [
    "vendorDeposits",
    "vendorLedgerEntries",
    "partnerPayouts",
    "partnerLedgerEntries",
    "paymentGatewaySettlements",
];

const columnsOf = Sequelize => ({
    booksSynced: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    booksSyncedAt: { type: Sequelize.DATE, allowNull: true },
    booksSyncedById: { type: Sequelize.BIGINT, allowNull: true },
    booksSyncedByName: { type: Sequelize.STRING, allowNull: true },
    deletedAt: { type: Sequelize.DATE, allowNull: true },
    deletedById: { type: Sequelize.BIGINT, allowNull: true },
    deletedByName: { type: Sequelize.STRING, allowNull: true },
    deleteReason: { type: Sequelize.TEXT, allowNull: true },
});

module.exports = {
    async up(queryInterface, Sequelize) {
        const columns = columnsOf(Sequelize);
        await queryInterface.sequelize.transaction(async transaction => {
            for (const table of TABLES) {
                const existing = await queryInterface.describeTable(table, { transaction });
                for (const [column, definition] of Object.entries(columns)) {
                    if (!existing[column]) {
                        await queryInterface.addColumn(table, column, definition, { transaction });
                    }
                }
            }
        });
    },

    async down(queryInterface, Sequelize) {
        const columns = columnsOf(Sequelize);
        await queryInterface.sequelize.transaction(async transaction => {
            for (const table of TABLES) {
                const existing = await queryInterface.describeTable(table, { transaction });
                for (const column of Object.keys(columns)) {
                    if (existing[column]) {
                        await queryInterface.removeColumn(table, column, { transaction });
                    }
                }
            }
        });
    },
};
