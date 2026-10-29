'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('invoiceSettingsV2s', 'autoAddToCatalog', {
            type: Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: false,
        });
        await queryInterface.addColumn('invoiceSettingsV2s', 'gstPercent', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: '5',
        });
        await queryInterface.addColumn('invoiceSettingsV2s', 'currency', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: 'INR',
        });
        await queryInterface.addColumn('invoiceSettingsV2s', 'paymentMode', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: 'CASH',
        });
        await queryInterface.addColumn('invoiceSettingsV2s', 'defaultDueDays', {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 14,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('invoiceSettingsV2s', 'autoAddToCatalog');
        await queryInterface.removeColumn('invoiceSettingsV2s', 'gstPercent');
        await queryInterface.removeColumn('invoiceSettingsV2s', 'currency');
        await queryInterface.removeColumn('invoiceSettingsV2s', 'paymentMode');
        await queryInterface.removeColumn('invoiceSettingsV2s', 'defaultDueDays');
    },
};
