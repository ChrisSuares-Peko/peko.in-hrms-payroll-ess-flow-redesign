"use strict";

const Sequelize = require("sequelize");

const TABLE = "serviceRules";

module.exports = {
    async up(queryInterface) {
        const [rows] = await queryInterface.sequelize.query(
            `SHOW TABLES LIKE '${TABLE}'`
        );
        if (rows.length === 0) {
            console.log(`[drop-${TABLE}] table already absent — skipping`);
            return;
        }
        await queryInterface.dropTable(TABLE);
        console.log(`[drop-${TABLE}] table dropped`);
    },

    async down(queryInterface) {
        await queryInterface.createTable(TABLE, {
            id: {
                type: Sequelize.BIGINT(11),
                primaryKey: true,
                autoIncrement: true,
            },
            rule: Sequelize.STRING,
            description: Sequelize.TEXT,
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        });
    },
};
