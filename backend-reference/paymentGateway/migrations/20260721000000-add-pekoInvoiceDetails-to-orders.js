"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const columns = await queryInterface.describeTable("orders");

        if (!columns.pekoInvoiceDetails) {
            await queryInterface.addColumn("orders", "pekoInvoiceDetails", {
                type: Sequelize.JSON,
                allowNull: true,
            });
        }
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("orders", "pekoInvoiceDetails");
    },
};
