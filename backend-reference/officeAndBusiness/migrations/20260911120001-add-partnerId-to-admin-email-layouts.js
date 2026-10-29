'use strict';

// Adds adminEmailLayouts.partnerId, mirroring adminEmailTemplates.partnerId.
// NULL = shared/default layout; set = partner-specific. Layouts have no `key`
// or uniqueness constraint, so this is just a filterable metadata column —
// templates reference a layout by id directly, no partner-fallback lookup needed.

async function columnExists(queryInterface, table, column) {
    const [rows] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as cnt FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column
    `, { replacements: { table, column } });
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
        if (await columnExists(queryInterface, 'adminEmailLayouts', 'partnerId')) {
            console.log('[migration] adminEmailLayouts.partnerId already exists — skipping add.');
        } else {
            await queryInterface.addColumn('adminEmailLayouts', 'partnerId', {
                type: Sequelize.STRING(100),
                allowNull: true,
            });
        }

        if (!(await indexExists(queryInterface, 'adminEmailLayouts', 'adminEmailLayouts_partnerId'))) {
            await queryInterface.addIndex('adminEmailLayouts', ['partnerId'], {
                name: 'adminEmailLayouts_partnerId',
            });
        }
    },

    async down(queryInterface) {
        if (await indexExists(queryInterface, 'adminEmailLayouts', 'adminEmailLayouts_partnerId')) {
            await queryInterface.removeIndex('adminEmailLayouts', 'adminEmailLayouts_partnerId');
        }
        if (await columnExists(queryInterface, 'adminEmailLayouts', 'partnerId')) {
            await queryInterface.removeColumn('adminEmailLayouts', 'partnerId');
        }
    },
};
