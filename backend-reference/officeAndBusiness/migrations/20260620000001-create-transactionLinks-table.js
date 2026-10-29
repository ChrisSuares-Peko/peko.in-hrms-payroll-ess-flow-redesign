'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tables = await queryInterface.showAllTables();
        const names = tables.map((t) => (typeof t === 'string' ? t : t.tableName));

        if (!names.includes('transactionLinks')) {
            await queryInterface.createTable('transactionLinks', {
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
                targetType: {
                    type: Sequelize.ENUM('INVOICING', 'INVOICE', 'BILL'),
                    allowNull: false,
                },
                targetId: {
                    type: Sequelize.BIGINT,
                    allowNull: false,
                },
                amountApplied: {
                    type: Sequelize.DECIMAL(14, 2),
                    allowNull: true,
                    defaultValue: null,
                },
                linkedBy: {
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

        const addIndex = async (fields, options = {}) => {
            try {
                await queryInterface.addIndex('transactionLinks', fields, options);
            } catch (err) {
                // index already exists (created by sync) — safe to ignore
            }
        };
        await addIndex(['accountingTransactionId', 'targetType', 'targetId'], {
            unique: true,
            // Must match the model index name and stay within MySQL's 64-char identifier limit;
            // the default (table + all 3 columns) is 65 chars and would fail.
            name: 'transaction_links_txn_target_unique',
        });
        await addIndex(['targetType', 'targetId']);
        await addIndex(['corporateUserId']);
    },

    async down(queryInterface) {
        await queryInterface.dropTable('transactionLinks');
    },
};
