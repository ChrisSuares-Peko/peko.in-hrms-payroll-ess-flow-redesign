'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface) {
        await queryInterface.addIndex('invoicings', {
            name: 'idx_invoicings_corp_docType_status',
            fields: ['corporateUserId', 'documentType', 'status'],
        });

        await queryInterface.addIndex('invoicings', {
            name: 'idx_invoicings_linkedInvoiceId',
            fields: ['linkedInvoiceId'],
        });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('invoicings', 'idx_invoicings_linkedInvoiceId');
        await queryInterface.removeIndex('invoicings', 'idx_invoicings_corp_docType_status');
    },
};
