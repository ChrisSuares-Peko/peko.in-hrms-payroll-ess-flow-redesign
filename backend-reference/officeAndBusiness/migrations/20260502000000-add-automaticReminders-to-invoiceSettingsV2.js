'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('invoiceSettingsV2s', 'automaticReminders', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('invoiceSettingsV2s', 'automaticReminders');
    },
};
