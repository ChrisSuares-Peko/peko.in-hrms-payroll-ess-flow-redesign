"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.bulkInsert("settings", [
            {
                name: "internalAccounts",
                details: JSON.stringify([]),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("settings", {
            name: "internalAccounts",
        });
    },
};
