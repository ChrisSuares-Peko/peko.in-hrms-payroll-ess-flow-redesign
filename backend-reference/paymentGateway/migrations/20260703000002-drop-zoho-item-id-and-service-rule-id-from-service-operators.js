"use strict";

const Sequelize = require("sequelize");

const TABLE = "serviceOperators";
const COLUMNS = ["zoho_item_id", "serviceRuleId"];

module.exports = {
    async up(queryInterface) {
        for (const col of COLUMNS) {
            const [rows] = await queryInterface.sequelize.query(
                `SHOW COLUMNS FROM \`${TABLE}\` LIKE '${col}'`
            );
            if (rows.length === 0) {
                console.log(`[drop-${col}] column already absent — skipping`);
                continue;
            }
            await queryInterface.removeColumn(TABLE, col);
            console.log(`[drop-${col}] removed from ${TABLE}`);
        }
    },

    async down(queryInterface) {
        await queryInterface.addColumn(TABLE, "zoho_item_id", {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn(TABLE, "serviceRuleId", {
            type: Sequelize.STRING,
            allowNull: true,
        });
    },
};
