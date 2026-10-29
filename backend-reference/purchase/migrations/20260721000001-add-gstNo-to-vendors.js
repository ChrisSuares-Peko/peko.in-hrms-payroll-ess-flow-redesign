"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const columns = await queryInterface.describeTable("vendors");

        if (!columns.gstNo) {
            await queryInterface.addColumn("vendors", "gstNo", {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
    },

    async down(queryInterface) {
        await queryInterface.removeColumn("vendors", "gstNo");
    },
};
