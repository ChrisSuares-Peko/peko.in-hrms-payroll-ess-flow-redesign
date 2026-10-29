'use strict';

module.exports = {
    async up(queryInterface) {
        await queryInterface.removeColumn('invoiceCustomerV2s', 'shippingSameAsPrimary');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('invoiceCustomerV2s', 'shippingSameAsPrimary', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    },
};
