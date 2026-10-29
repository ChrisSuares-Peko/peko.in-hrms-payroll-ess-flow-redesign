'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const eSignDesc = await queryInterface.describeTable('eSigns');

        if (!eSignDesc.sourceType) {
            await queryInterface.addColumn('eSigns', 'sourceType', {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null,
            });
        }
        if (!eSignDesc.sourceId) {
            await queryInterface.addColumn('eSigns', 'sourceId', {
                type: Sequelize.STRING,
                allowNull: true,
                defaultValue: null,
            });
        }

        await queryInterface.sequelize.query(
            `UPDATE eSigns SET sourceType = 'AGREEMENT', sourceId = agreementId WHERE isAgreement = true AND agreementId IS NOT NULL`
        );
        await queryInterface.sequelize.query(
            `UPDATE eSigns SET sourceType = 'LEGAL_DOCUMENT', sourceId = legalDocumentId WHERE isLegalDocument = true AND legalDocumentId IS NOT NULL`
        );
        await queryInterface.sequelize.query(
            `UPDATE eSigns SET sourceType = 'OFFER_LETTER', sourceId = offerLetterEmployeeId WHERE isOfferLetter = true AND offerLetterEmployeeId IS NOT NULL`
        );

        await queryInterface.removeColumn('eSigns', 'isAgreement');
        await queryInterface.removeColumn('eSigns', 'agreementId');
        await queryInterface.removeColumn('eSigns', 'isLegalDocument');
        await queryInterface.removeColumn('eSigns', 'legalDocumentId');
        await queryInterface.removeColumn('eSigns', 'isOfferLetter');
        await queryInterface.removeColumn('eSigns', 'offerLetterEmployeeId');
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('eSigns', 'isAgreement', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
        await queryInterface.addColumn('eSigns', 'agreementId', {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
        });
        await queryInterface.addColumn('eSigns', 'isLegalDocument', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
        await queryInterface.addColumn('eSigns', 'legalDocumentId', {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
        });
        await queryInterface.addColumn('eSigns', 'isOfferLetter', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
        await queryInterface.addColumn('eSigns', 'offerLetterEmployeeId', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        });

        await queryInterface.sequelize.query(
            `UPDATE eSigns SET isAgreement = true, agreementId = sourceId WHERE sourceType = 'AGREEMENT'`
        );
        await queryInterface.sequelize.query(
            `UPDATE eSigns SET isLegalDocument = true, legalDocumentId = sourceId WHERE sourceType = 'LEGAL_DOCUMENT'`
        );
        await queryInterface.sequelize.query(
            `UPDATE eSigns SET isOfferLetter = true, offerLetterEmployeeId = sourceId WHERE sourceType = 'OFFER_LETTER'`
        );

        await queryInterface.removeColumn('eSigns', 'sourceType');
        await queryInterface.removeColumn('eSigns', 'sourceId');
    },
};
