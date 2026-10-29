'use strict';

module.exports = {
    async up(queryInterface) {
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('userPersonalTemplates')) return;
        await queryInterface.sequelize.query(
            'ALTER TABLE userPersonalTemplates MODIFY COLUMN html LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
        );
    },

    async down(queryInterface) {
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('userPersonalTemplates')) return;
        await queryInterface.sequelize.query(
            'ALTER TABLE userPersonalTemplates MODIFY COLUMN html LONGTEXT;'
        );
    },
};
