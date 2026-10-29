"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const columns = await queryInterface.describeTable("vendors");

        if (!columns.address) {
            await queryInterface.addColumn("vendors", "address", {
                type: Sequelize.TEXT,
                allowNull: true,
            });
        }
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("vendors", "address");
    },
};
