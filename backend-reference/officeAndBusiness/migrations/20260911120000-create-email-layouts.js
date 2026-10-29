'use strict';

// Creates adminEmailLayouts — admin-managed header/footer blocks a template can
// reference instead of embedding its own. Mirrors adminEmailTemplates' shape.

async function tableExists(queryInterface, table) {
    const [rows] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as cnt FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table
    `, { replacements: { table } });
    return rows[0].cnt > 0;
}

async function indexExists(queryInterface, table, indexName) {
    const [rows] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as cnt FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND INDEX_NAME = :indexName
    `, { replacements: { table, indexName } });
    return rows[0].cnt > 0;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // sequelize.sync() at boot may have already created this from the model.
        if (await tableExists(queryInterface, 'adminEmailLayouts')) {
            console.log('[migration] adminEmailLayouts already exists — skipping create.');
        } else {
            await queryInterface.createTable('adminEmailLayouts', {
                id: {
                    type: Sequelize.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                name: {
                    type: Sequelize.STRING(150),
                    allowNull: false,
                },
                // Free STRING not a DB ENUM, so new types don't need a migration.
                type: {
                    type: Sequelize.STRING(50),
                    allowNull: false,
                },
                draftHtml: {
                    type: Sequelize.TEXT('medium'),
                    allowNull: true,
                },
                publishedHtml: {
                    type: Sequelize.TEXT('medium'),
                    allowNull: true,
                },
                status: {
                    type: Sequelize.ENUM('DRAFT', 'PUBLISHED'),
                    allowNull: false,
                    defaultValue: 'DRAFT',
                },
                isActive: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                },
                version: {
                    type: Sequelize.INTEGER.UNSIGNED,
                    allowNull: false,
                    defaultValue: 1,
                },
                updatedBy: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },
                publishedBy: {
                    type: Sequelize.STRING(100),
                    allowNull: true,
                },
                publishedAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                createdAt: { type: Sequelize.DATE, allowNull: false },
                updatedAt: { type: Sequelize.DATE, allowNull: false },
            });
        }

        // Supports admin lookups/filters by type (e.g. "show me every footer").
        if (!(await indexExists(queryInterface, 'adminEmailLayouts', 'adminEmailLayouts_type'))) {
            await queryInterface.addIndex('adminEmailLayouts', ['type'], {
                name: 'adminEmailLayouts_type',
            });
        }
    },

    async down(queryInterface) {
        await queryInterface.dropTable('adminEmailLayouts');
    },
};
