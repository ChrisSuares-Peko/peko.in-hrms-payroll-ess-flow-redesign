'use strict';

// Adds adminEmailTemplates.layout — maps layout slot to adminEmailLayouts.id,
// e.g. { "header": 3, "footer": 7 }. Null keeps the current hardcoded header/footer.
// Admin CRUD only; the send-path resolver reading this column is a later rollout.
// No FK — ids are validated at the app layer, like partnerId.

async function columnExists(queryInterface, table, column) {
    const [rows] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as cnt FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column
    `, { replacements: { table, column } });
    return rows[0].cnt > 0;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        if (await columnExists(queryInterface, 'adminEmailTemplates', 'layout')) {
            console.log('[migration] adminEmailTemplates.layout already exists — skipping add.');
            return;
        }
        await queryInterface.addColumn('adminEmailTemplates', 'layout', {
            type: Sequelize.JSON,
            allowNull: true,
        });
    },

    async down(queryInterface) {
        if (!(await columnExists(queryInterface, 'adminEmailTemplates', 'layout'))) {
            console.log('[migration] adminEmailTemplates.layout already absent — skipping remove.');
            return;
        }
        await queryInterface.removeColumn('adminEmailTemplates', 'layout');
    },
};
