'use strict'

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('corporateDocuments', {
            id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
            corporateUserId: { type: Sequelize.INTEGER, allowNull: false },
            documentName: { type: Sequelize.STRING, allowNull: false },
            document: { type: Sequelize.STRING, allowNull: true },
            documentType: { type: Sequelize.STRING, allowNull: true },
            status: { type: Sequelize.STRING, allowNull: true, defaultValue: 'PENDING' },
            expiryDate: { type: Sequelize.STRING, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' })
        await queryInterface.addIndex('corporateDocuments', ['documentName', 'corporateUserId'], {
            unique: true,
            name: 'corporateDocuments_docName_corp_unique',
        })
    },

    async down(queryInterface) {
        await queryInterface.dropTable('corporateDocuments')
    },
}
