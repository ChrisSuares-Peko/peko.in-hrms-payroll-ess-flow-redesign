"use strict";

const TABLE = "vendorLedgerEntries";
const COLUMN = "documentEdits";

module.exports = {
    async up(queryInterface, Sequelize) {
        const described = await queryInterface.describeTable(TABLE);
        if (described[COLUMN]) return;

        await queryInterface.addColumn(TABLE, COLUMN, {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: null,
        });
    },

    async down(queryInterface) {
        const described = await queryInterface.describeTable(TABLE);
        if (!described[COLUMN]) return;

        await queryInterface.removeColumn(TABLE, COLUMN);
    },
};
