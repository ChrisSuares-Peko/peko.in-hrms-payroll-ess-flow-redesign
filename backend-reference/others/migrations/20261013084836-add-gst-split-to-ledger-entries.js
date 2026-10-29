"use strict";

const TABLES = ["vendorLedgerEntries", "partnerLedgerEntries"];

const columnsOf = Sequelize => ({
    gstInclusive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    gstRate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
    taxableAmount: { type: Sequelize.DECIMAL(12, 4), allowNull: true },
    gstAmount: { type: Sequelize.DECIMAL(12, 4), allowNull: true },
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
