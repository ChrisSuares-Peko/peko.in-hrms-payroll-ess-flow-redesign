'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('accountingTransactions');
        const addColumn = async (name, spec) => {
            if (!table[name]) await queryInterface.addColumn('accountingTransactions', name, spec);
        };

        await addColumn('bankAccountId', {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
        });
        await addColumn('importBatchId', {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
        });
        await addColumn('rawHash', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        });

        try {
            await queryInterface.addIndex('accountingTransactions', [
                'corporateUserId',
                'bankAccountId',
            ]);
        } catch (err) {
            // index already exists (created by sync) — safe to ignore
        }
    },

    async down(queryInterface) {
        const table = await queryInterface.describeTable('accountingTransactions');
        if (table.bankAccountId) {
            await queryInterface.removeColumn('accountingTransactions', 'bankAccountId');
        }
        if (table.importBatchId) {
            await queryInterface.removeColumn('accountingTransactions', 'importBatchId');
        }
        if (table.rawHash) {
            await queryInterface.removeColumn('accountingTransactions', 'rawHash');
        }
    },
};
