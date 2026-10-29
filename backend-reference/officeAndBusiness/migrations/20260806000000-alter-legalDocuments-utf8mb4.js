'use strict';

module.exports = {
    async up(queryInterface) {
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('legalDocuments')) return;
        await queryInterface.sequelize.query(
            'ALTER TABLE legalDocuments MODIFY COLUMN editorHtml LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'
        );
        await queryInterface.sequelize.query(
            'ALTER TABLE legalDocuments MODIFY COLUMN title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL;'
        );
    },

    async down(queryInterface) {
        const tables = await queryInterface.showAllTables();
        if (!tables.includes('legalDocuments')) return;
        await queryInterface.sequelize.query(
            'ALTER TABLE legalDocuments MODIFY COLUMN editorHtml LONGTEXT;'
        );
        await queryInterface.sequelize.query(
            'ALTER TABLE legalDocuments MODIFY COLUMN title VARCHAR(255) NOT NULL;'
        );
    },
};
