"use strict";

const NAME = "servicesTypeConfig";
const DEFAULTS = { service_with_plans: [], service_without_plans: [] };

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
