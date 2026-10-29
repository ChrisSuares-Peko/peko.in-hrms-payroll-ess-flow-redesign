'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Add CREDIT_NOTE to documentType ENUM
        await queryInterface.sequelize.query(
            "ALTER TABLE `invoicings` MODIFY COLUMN `documentType` ENUM('INVOICE','SALES_ORDER','QUOTATION','CREDIT_NOTE') NOT NULL DEFAULT 'INVOICE';"
        );

        // 2. Add linkedInvoiceId
        await queryInterface.addColumn('invoicings', 'linkedInvoiceId', {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
            after: 'eInvoiceId',
        });

        // 3. Add creditNoteDetails
        await queryInterface.addColumn('invoicings', 'creditNoteDetails', {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: null,
            after: 'linkedInvoiceId',
        });

        // 4. Add isCreditNoteCreated
        await queryInterface.addColumn('invoicings', 'isCreditNoteCreated', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            after: 'creditNoteDetails',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('invoicings', 'isCreditNoteCreated');
        await queryInterface.removeColumn('invoicings', 'creditNoteDetails');
        await queryInterface.removeColumn('invoicings', 'linkedInvoiceId');
        await queryInterface.sequelize.query(
            "ALTER TABLE `invoicings` MODIFY COLUMN `documentType` ENUM('INVOICE','SALES_ORDER','QUOTATION') NOT NULL DEFAULT 'INVOICE';"
        );
    },
};
