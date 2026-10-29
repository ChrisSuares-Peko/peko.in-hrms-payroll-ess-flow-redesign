"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const columns = await queryInterface.describeTable("orders");

        if (!columns.journalData) {
            await queryInterface.addColumn("orders", "journalData", {
                type: Sequelize.JSON,
                allowNull: true,
            });
        }

        if (!columns.journalRecordStatus) {
            await queryInterface.addColumn("orders", "journalRecordStatus", {
                type: Sequelize.JSON,
                allowNull: true,
            });
        }
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("orders", "journalData");
        await queryInterface.removeColumn("orders", "journalRecordStatus");
    },
};
