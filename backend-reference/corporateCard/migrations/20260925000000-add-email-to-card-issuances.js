'use strict';

const TABLE = 'cardIssuances';
const COLUMN = 'email';

/**
 * The cardholder's email, captured at issuance.
 *
 * It is already in hand at that moment (the admin's session resolves it from the directory and hands
 * it to Pine Labs) and was then dropped. Stored so the decline webhook — which has no session and
 * cannot reach the directory — can tell the employee their card was declined. Nullable: cards issued
 * before this column, and directory records without an email, simply carry none.
 */
module.exports = {
    up: async (queryInterface, Sequelize) => {
        const columns = await queryInterface.describeTable(TABLE);
        if (!columns[COLUMN]) {
            await queryInterface.addColumn(TABLE, COLUMN, { type: Sequelize.STRING, allowNull: true });
        }
    },

    down: async (queryInterface) => {
        const columns = await queryInterface.describeTable(TABLE);
        if (columns[COLUMN]) {
            await queryInterface.removeColumn(TABLE, COLUMN);
        }
    },
};
