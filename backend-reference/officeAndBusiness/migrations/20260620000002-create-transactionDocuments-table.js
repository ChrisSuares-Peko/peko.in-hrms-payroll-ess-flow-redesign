'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        const names = tables.map((t) => (typeof t === 'string' ? t : t.tableName));

        if (!names.includes('transactionDocuments')) {
            await queryInterface.createTable('transactionDocuments', {
                id: {
                    type: Sequelize.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                corporateUserId: {
                    type: Sequelize.BIGINT,
                    allowNull: true,
                    defaultValue: null,
                },
                accountingTransactionId: {
                    type: Sequelize.BIGINT,
                    allowNull: false,
                },
                documentName: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                documentUrl: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                mimeType: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                fileSize: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    defaultValue: null,
                },
                uploadedBy: {
                    type: Sequelize.BIGINT,
                    allowNull: true,
                    defaultValue: null,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
            });
        }

        const addIndex = async (fields) => {
            try {
                await queryInterface.addIndex('transactionDocuments', fields);
            } catch (err) {
                // index already exists (created by sync) — safe to ignore
            }
        };
        await addIndex(['accountingTransactionId']);
        await addIndex(['corporateUserId']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('transactionDocuments');
    },
};
