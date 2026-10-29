'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableDesc = await queryInterface.describeTable('visaOrders');
        if (tableDesc.documents) return;

        await queryInterface.addColumn('visaOrders', 'documents', {
            type: Sequelize.JSON,
            allowNull: true,
            defaultValue: null,
            comment: 'Map of document_code -> { key, url, uploadedAt }',
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('visaOrders', 'documents');
    },
};
