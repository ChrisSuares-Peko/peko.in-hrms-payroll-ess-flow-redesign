'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableDesc = await queryInterface.describeTable('invoiceCustomerV2s').catch(() => null);
        if (!tableDesc) return;

        if (!tableDesc.personOfContact) {
            await queryInterface.addColumn('invoiceCustomerV2s', 'personOfContact', {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null,
                after: 'name',
            });
        }

        if (!tableDesc.notes) {
            await queryInterface.addColumn('invoiceCustomerV2s', 'notes', {
                type: Sequelize.TEXT,
                allowNull: true,
                after: 'upiId',
            });
        }
    },

    async down(queryInterface) {
        const tableDesc = await queryInterface.describeTable('invoiceCustomerV2s').catch(() => null);
        if (!tableDesc) return;

        if (tableDesc.personOfContact) {
            await queryInterface.removeColumn('invoiceCustomerV2s', 'personOfContact');
        }

        if (tableDesc.notes) {
            await queryInterface.removeColumn('invoiceCustomerV2s', 'notes');
        }
    },
};
