'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        let tableDescription;
        try {
            tableDescription = await queryInterface.describeTable('whatsAppSubscriptions');
        } catch {
            return;
        }
        if (!tableDescription.isGracePeriod) {
            await queryInterface.addColumn('whatsAppSubscriptions', 'isGracePeriod', {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            });
            await queryInterface.addIndex('whatsAppSubscriptions', ['isGracePeriod'], {
                name: 'idx_whatsAppSubs_isGracePeriod',
            });
            console.log('[Migration] Added isGracePeriod to whatsAppSubscriptions');
        }
    },

    async down(queryInterface) {
        let tableDescription;
        try {
            tableDescription = await queryInterface.describeTable('whatsAppSubscriptions');
        } catch {
            return;
        }
        if (tableDescription.isGracePeriod) {
            await queryInterface.removeColumn('whatsAppSubscriptions', 'isGracePeriod');
        }
    },
};
