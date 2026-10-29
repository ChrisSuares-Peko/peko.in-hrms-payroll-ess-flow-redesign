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
        if (tableDescription.vendorSubscriptionId) return; // column already present
        await queryInterface.addColumn('whatsAppSubscriptions', 'vendorSubscriptionId', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        });
    },

    async down(queryInterface) {
        let tableDescription;
        try {
            tableDescription = await queryInterface.describeTable('whatsAppSubscriptions');
        } catch {
            return;
        }
        if (!tableDescription.vendorSubscriptionId) return;
        await queryInterface.removeColumn('whatsAppSubscriptions', 'vendorSubscriptionId');
    },
};
