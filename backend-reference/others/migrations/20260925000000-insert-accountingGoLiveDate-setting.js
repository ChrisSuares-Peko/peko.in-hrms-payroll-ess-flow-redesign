"use strict";

const NAME = "accountingGoLiveDate";

// Seeded unconfigured on purpose. Until the accounts team sets a date the portal counts
// nothing, which is the safe reading on a system carrying years of pre-portal history.
const DEFAULTS = { date: null };

module.exports = {
    async up(queryInterface) {
        const [rows] = await queryInterface.sequelize.query(
            "SELECT id FROM `settings` WHERE name = :name LIMIT 1",
            { replacements: { name: NAME } }
        );
        if (rows.length) return;

        await queryInterface.sequelize.query(
            "INSERT INTO `settings` (name, details, createdAt, updatedAt) VALUES (:name, :details, NOW(), NOW())",
            { replacements: { name: NAME, details: JSON.stringify(DEFAULTS) } }
        );
    },

    async down(queryInterface) {
        await queryInterface.bulkDelete("settings", { name: NAME });
    },
};
