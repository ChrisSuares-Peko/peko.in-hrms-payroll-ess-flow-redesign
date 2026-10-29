'use strict';

module.exports = {
    async up(queryInterface) {
        await queryInterface.removeColumn('invoiceSettingsV2s', 'businessName');
        await queryInterface.removeColumn('invoiceSettingsV2s', 'address');
        await queryInterface.removeColumn('invoiceSettingsV2s', 'city');
        await queryInterface.removeColumn('invoiceSettingsV2s', 'state');
        await queryInterface.removeColumn('invoiceSettingsV2s', 'pincode');
        await queryInterface.removeColumn('invoiceSettingsV2s', 'phoneNumber');
        await queryInterface.removeColumn('invoiceSettingsV2s', 'email');
        await queryInterface.removeColumn('invoiceSettingsV2s', 'gstNo');
        await queryInterface.removeColumn('invoiceSettingsV2s', 'logoUrl');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('invoiceSettingsV2s', 'businessName', { type: Sequelize.STRING, allowNull: true, defaultValue: null });
        await queryInterface.addColumn('invoiceSettingsV2s', 'address', { type: Sequelize.TEXT, allowNull: true, defaultValue: null });
        await queryInterface.addColumn('invoiceSettingsV2s', 'city', { type: Sequelize.STRING, allowNull: true, defaultValue: null });
        await queryInterface.addColumn('invoiceSettingsV2s', 'state', { type: Sequelize.STRING, allowNull: true, defaultValue: null });
        await queryInterface.addColumn('invoiceSettingsV2s', 'pincode', { type: Sequelize.STRING, allowNull: true, defaultValue: null });
        await queryInterface.addColumn('invoiceSettingsV2s', 'phoneNumber', { type: Sequelize.STRING, allowNull: true, defaultValue: null });
        await queryInterface.addColumn('invoiceSettingsV2s', 'email', { type: Sequelize.STRING, allowNull: true, defaultValue: null });
        await queryInterface.addColumn('invoiceSettingsV2s', 'gstNo', { type: Sequelize.STRING, allowNull: true, defaultValue: null });
        await queryInterface.addColumn('invoiceSettingsV2s', 'logoUrl', { type: Sequelize.TEXT, allowNull: true, defaultValue: null });
    },
};
