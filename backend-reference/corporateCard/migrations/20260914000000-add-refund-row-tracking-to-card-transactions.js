'use strict';

const TABLE = 'cardTransactions';
const OLD_UNIQUE_INDEX = 'cardTransactions_transactionUniqueId_unique';
const NEW_UNIQUE_INDEX = 'cardTransactions_transactionUniqueId_eventType_unique';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const table = await queryInterface.describeTable(TABLE);
        if (!table.parentTransactionId) {
            await queryInterface.addColumn(TABLE, 'parentTransactionId', {
                type: Sequelize.BIGINT,
                allowNull: true,
                after: 'transactionUniqueId',
            });
        }

        // A refund NOTIFY reuses the original debit's transactionUniqueId, so a refund row needs its own
        // row sharing that same id — the column can no longer be unique on its own. eventType ('AUTH' vs
        // 'REFUND') distinguishes the two rows a single transactionUniqueId can now have.
        const indexes = await queryInterface.showIndex(TABLE);
        if (indexes.some((i) => i.name === OLD_UNIQUE_INDEX)) {
            await queryInterface.removeIndex(TABLE, OLD_UNIQUE_INDEX);
        }
        if (!indexes.some((i) => i.name === NEW_UNIQUE_INDEX)) {
            await queryInterface.addIndex(TABLE, ['transactionUniqueId', 'eventType'], {
                unique: true,
                name: NEW_UNIQUE_INDEX,
            });
        }
    },

    down: async (queryInterface) => {
        const indexes = await queryInterface.showIndex(TABLE);
        if (indexes.some((i) => i.name === NEW_UNIQUE_INDEX)) {
            await queryInterface.removeIndex(TABLE, NEW_UNIQUE_INDEX);
        }
        if (!indexes.some((i) => i.name === OLD_UNIQUE_INDEX)) {
            await queryInterface.addIndex(TABLE, ['transactionUniqueId'], {
                unique: true,
                name: OLD_UNIQUE_INDEX,
            });
        }

        const table = await queryInterface.describeTable(TABLE);
        if (table.parentTransactionId) {
            await queryInterface.removeColumn(TABLE, 'parentTransactionId');
        }
    },
};
