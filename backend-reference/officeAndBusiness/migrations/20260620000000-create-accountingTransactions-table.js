'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        const names = tables.map((t) => (typeof t === 'string' ? t : t.tableName));

        if (!names.includes('accountingTransactions')) {
            await queryInterface.createTable('accountingTransactions', {
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
                account: {
                    type: Sequelize.ENUM('Bank', 'Upload', 'Manual'),
                    allowNull: false,
                    defaultValue: 'Manual',
                },
                importId: {
                    type: Sequelize.BIGINT,
                    allowNull: true,
                    defaultValue: null,
                },
                txnDate: {
                    type: Sequelize.DATEONLY,
                    allowNull: false,
                },
                description: {
                    type: Sequelize.STRING(512),
                    allowNull: false,
                },
                amount: {
                    type: Sequelize.DECIMAL(14, 2),
                    allowNull: false,
                },
                type: {
                    type: Sequelize.ENUM('Income', 'Expense'),
                    allowNull: false,
                },
                currency: {
                    type: Sequelize.STRING(3),
                    allowNull: false,
                    defaultValue: 'INR',
                },
                category: {
                    type: Sequelize.STRING,
                    allowNull: true,
                    defaultValue: null,
                },
                isRecurring: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                isHidden: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                reviewedAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                    defaultValue: null,
                },
                note: {
                    type: Sequelize.TEXT,
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
                await queryInterface.addIndex('accountingTransactions', fields);
            } catch (err) {
                // index already exists (created by sync) — safe to ignore
            }
        };
        await addIndex(['corporateUserId', 'txnDate']);
        await addIndex(['corporateUserId', 'type']);
        await addIndex(['corporateUserId', 'account']);
        await addIndex(['corporateUserId', 'category']);
        await addIndex(['corporateUserId', 'isHidden']);
        await addIndex(['corporateUserId', 'isRecurring']);
        await addIndex(['corporateUserId', 'reviewedAt']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('accountingTransactions');
    },
};
