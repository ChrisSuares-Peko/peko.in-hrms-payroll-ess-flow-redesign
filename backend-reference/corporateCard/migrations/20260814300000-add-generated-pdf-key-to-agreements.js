'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('corporateCardAgreements')
        if (!table.generatedPdfKey) {
            await queryInterface.addColumn('corporateCardAgreements', 'generatedPdfKey', {
                type: Sequelize.STRING(500),
                allowNull: true,
                after: 'generatedDocumentKey',
            })
        }
    },

    async down(queryInterface) {
        const table = await queryInterface.describeTable('corporateCardAgreements')
        if (table.generatedPdfKey) {
            await queryInterface.removeColumn('corporateCardAgreements', 'generatedPdfKey')
        }
    },
}
