"use strict";

const TABLES = ["vendorDeposits", "vendorCreditNotes"];

const SLIP_COLUMNS = ["slipKey", "slipName", "slipFormat"];

const slipColumns = Sequelize => ({
    slipKey: { type: Sequelize.TEXT, allowNull: true },
    slipName: { type: Sequelize.STRING, allowNull: true },
    slipFormat: { type: Sequelize.STRING(10), allowNull: true },
});

module.exports = {
    async up(queryInterface, Sequelize) {
        const columns = slipColumns(Sequelize);

        for (const table of TABLES) {
            const exists = await queryInterface.tableExists(table);
            if (!exists) continue;

            const described = await queryInterface.describeTable(table);
            for (const name of SLIP_COLUMNS) {
                if (!described[name]) await queryInterface.addColumn(table, name, columns[name]);
            }
        }
    },

    async down(queryInterface) {
        for (const table of TABLES) {
            const exists = await queryInterface.tableExists(table);
            if (!exists) continue;

            const described = await queryInterface.describeTable(table);
            for (const name of SLIP_COLUMNS) {
                if (described[name]) await queryInterface.removeColumn(table, name);
            }
        }
    },
};
