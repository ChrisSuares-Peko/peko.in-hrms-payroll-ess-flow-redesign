'use strict';

const TABLE = 'cardIssuances';
const COLUMN = 'purchasePaymentRefId';
const INDEX = 'cardIssuances_purchasePaymentRef_unique';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const columns = await queryInterface.describeTable(TABLE);
        if (!columns[COLUMN]) {
            await queryInterface.addColumn(TABLE, COLUMN, { type: Sequelize.STRING(64), allowNull: true });
        }

        // The idempotency guard for the two racing payment-confirmation paths: one paid card per payment,
        // however many times the confirmation is delivered. NULL repeats freely, so unpaid cards are
        // unaffected.
        const existing = await queryInterface.showIndex(TABLE);
        if (!existing.some((index) => index.name === INDEX)) {
            await queryInterface.addIndex(TABLE, [COLUMN], { unique: true, name: INDEX });
        }
    },

    down: async (queryInterface) => {
        const existing = await queryInterface.showIndex(TABLE);
        if (existing.some((index) => index.name === INDEX)) {
            await queryInterface.removeIndex(TABLE, INDEX);
        }
        const columns = await queryInterface.describeTable(TABLE);
        if (columns[COLUMN]) {
            await queryInterface.removeColumn(TABLE, COLUMN);
        }
    },
};
