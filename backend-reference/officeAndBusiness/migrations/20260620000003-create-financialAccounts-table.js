'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        const names = tables.map((t) => (typeof t === 'string' ? t : t.tableName));

        if (!names.includes('financialAccounts')) {
            await queryInterface.createTable('financialAccounts', {
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
                accountName: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                accountNumber: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                bankName: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                ifscCode: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                accountType: {
                    type: Sequelize.ENUM('Current', 'Savings', 'Other'),
                    allowNull: false,
                    defaultValue: 'Other',
                },
                currency: {
                    type: Sequelize.STRING(3),
                    allowNull: false,
                    defaultValue: 'INR',
                },
                isActive: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
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

        try {
            await queryInterface.addIndex('financialAccounts', ['corporateUserId']);
        } catch (err) {
            // index already exists (created by sync) — safe to ignore
        }
    },

    async down(queryInterface) {
        await queryInterface.dropTable('financialAccounts');
    },
};
