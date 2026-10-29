'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Add 'invoiceTemplate' to invoiceTempletes.type ENUM
        await queryInterface.changeColumn('invoiceTempletes', 'type', {
            type: Sequelize.ENUM('email', 'sms', 'notification', 'invoiceTemplate'),
            allowNull: true,
        });

        // 2. Add imageUrl column to invoiceTempletes
        await queryInterface.addColumn('invoiceTempletes', 'imageUrl', {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
        });

        // 3. Add templateSettings column to invoiceSettingsV2s
        await queryInterface.addColumn('invoiceSettingsV2s', 'templateSettings', {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: null,
        });
    },

    async down(queryInterface, Sequelize) {
        // Reverse order

        // 3. Remove templateSettings from invoiceSettingsV2s
        await queryInterface.removeColumn('invoiceSettingsV2s', 'templateSettings');

        // 2. Remove imageUrl from invoiceTempletes
        await queryInterface.removeColumn('invoiceTempletes', 'imageUrl');

        // 1. Revert invoiceTempletes.type ENUM (remove invoiceTemplate)
        await queryInterface.changeColumn('invoiceTempletes', 'type', {
            type: Sequelize.ENUM('email', 'sms', 'notification'),
            allowNull: true,
        });
    },
};
