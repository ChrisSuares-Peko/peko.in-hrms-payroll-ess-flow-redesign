'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const eSignDesc = await queryInterface.describeTable('eSigns');
        if (!eSignDesc.isLegalDocument) {
            await queryInterface.addColumn('eSigns', 'isLegalDocument', {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
                allowNull: false,
            });
        }
        if (!eSignDesc.legalDocumentId) {
            await queryInterface.addColumn('eSigns', 'legalDocumentId', {
                type: Sequelize.BIGINT,
                allowNull: true,
                defaultValue: null,
            });
        }

    },

    async down(queryInterface) {
        await queryInterface.removeColumn('eSigns', 'isLegalDocument');
        await queryInterface.removeColumn('eSigns', 'legalDocumentId');
    },
};
