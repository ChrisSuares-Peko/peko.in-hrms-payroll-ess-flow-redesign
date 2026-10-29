"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        const [existing] = await queryInterface.sequelize.query(
            "SELECT id FROM `settings` WHERE name = 'journalRecording' LIMIT 1"
        );
        if (existing.length) return;

        await queryInterface.bulkInsert("settings", [
            {
                name: "journalRecording",
                details: JSON.stringify({ enabled: false }),
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ]);
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("settings", {
            name: "journalRecording",
        });
    },
};
