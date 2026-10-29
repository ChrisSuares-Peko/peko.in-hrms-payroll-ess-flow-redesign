'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        const names = tables.map((t) => (typeof t === 'string' ? t : t.tableName));

        if (!names.includes('bankStatementImports')) {
            await queryInterface.createTable('bankStatementImports', {
                id: {
                    type: Sequelize.BIGINT,
                    primaryKey: true,
                    autoIncrement: true,
                    allowNull: false,
                },
                corporateUserId: {
                    type: Sequelize.BIGINT,
                    allowNull: true,
                },
                subCorporateUserId: {
                    type: Sequelize.BIGINT,
                    allowNull: true,
                },
                financialAccountId: {
                    type: Sequelize.BIGINT,
                    allowNull: true,
                },
                fileName: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                mimeType: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                fileHash: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                statementStartDate: {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                    defaultValue: null,
                },
                statementEndDate: {
                    type: Sequelize.DATEONLY,
                    allowNull: true,
                    defaultValue: null,
                },
                totalRows: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    defaultValue: null,
                },
                qualityScore: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    defaultValue: null,
                },
                status: {
                    type: Sequelize.ENUM('draft', 'imported', 'rejected'),
                    allowNull: false,
                    defaultValue: 'draft',
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
                deletedAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    defaultValue: null,
                },
            });
        }

        const addIndex = async (fields) => {
            try {
                await queryInterface.addIndex('bankStatementImports', fields);
            } catch (err) {
                // index already exists (created by sync) — safe to ignore
            }
        };
        await addIndex(['corporateUserId']);
        await addIndex(['financialAccountId']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('bankStatementImports');
    },
};
