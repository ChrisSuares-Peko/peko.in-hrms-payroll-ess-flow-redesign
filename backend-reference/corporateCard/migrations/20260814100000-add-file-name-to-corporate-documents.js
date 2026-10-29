'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('corporateDocuments', 'fileName', {
            type: Sequelize.STRING,
            allowNull: true,
            after: 'documentType',
        })
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('corporateDocuments', 'fileName')
    },
}
