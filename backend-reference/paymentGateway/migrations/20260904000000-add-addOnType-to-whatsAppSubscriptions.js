'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        let tableDescription;
        try {
            tableDescription = await queryInterface.describeTable('whatsAppSubscriptions');
        } catch {
            return; // table does not exist — nothing to migrate
        }
        if (!tableDescription.addOnType) {
            await queryInterface.addColumn('whatsAppSubscriptions', 'addOnType', {
                type: Sequelize.ENUM('BOT_BUILDER', 'SHOPIFY_INTEGRATION'),
                allowNull: true,
                defaultValue: null,
            });
            await queryInterface.addIndex('whatsAppSubscriptions', ['addOnType'], {
                name: 'idx_whatsAppSubs_addOnType',
            });
            console.log('[Migration] Added addOnType to whatsAppSubscriptions');
        }

        // Backfill: every existing isCustom row predates this ticket, so it's a Bot Builder row.
        await queryInterface.sequelize.query(
            `UPDATE whatsAppSubscriptions SET addOnType = 'BOT_BUILDER' WHERE isCustom = true AND addOnType IS NULL`
        );
    },

    async down(queryInterface) {
        let tableDescription;
        try {
            tableDescription = await queryInterface.describeTable('whatsAppSubscriptions');
        } catch {
            return;
        }
        if (tableDescription.addOnType) {
            await queryInterface.removeColumn('whatsAppSubscriptions', 'addOnType');
            // Sequelize/MySQL leaves the ENUM type behind on removeColumn for some dialects;
            // no-op on MySQL (ENUM is inline on the column, not a separate type).
        }
    },
};
