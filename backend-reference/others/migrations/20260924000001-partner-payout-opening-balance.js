"use strict";

const PAYOUTS = "partnerPayouts";

const ENTRY_KIND = "entryKind";

const OPENING_KEY = "activeOpeningKey";
const OPENING_INDEX = "partnerPayouts_activeOpening_unique";

const dropGenerated = async (queryInterface, table, column, index) => {
    const described = await queryInterface.describeTable(table);
    if (!described[column]) return;

    const indexes = await queryInterface.showIndex(table);
    if (indexes.some(row => row.name === index)) {
        await queryInterface.removeIndex(table, index);
    }
    await queryInterface.removeColumn(table, column);
};

const addGenerated = async (queryInterface, table, column, index, expression, type) => {
    const described = await queryInterface.describeTable(table);
    if (described[column]) return;

    await queryInterface.sequelize.query(
        `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type}
         GENERATED ALWAYS AS (${expression}) STORED`
    );
    await queryInterface.addIndex(table, [column], { unique: true, name: index });
};

module.exports = {
    async up(queryInterface, Sequelize) {
        const hasPayouts = await queryInterface.tableExists(PAYOUTS);
        if (!hasPayouts) return;

        // Every row on file today is a real payout, which the column default already makes
        // true; the update after it is what makes that certain rather than assumed.
        const described = await queryInterface.describeTable(PAYOUTS);
        if (!described[ENTRY_KIND]) {
            await queryInterface.addColumn(PAYOUTS, ENTRY_KIND, {
                type: Sequelize.ENUM("PAYOUT", "OPENING"),
                allowNull: false,
                defaultValue: "PAYOUT",
            });
            await queryInterface.sequelize.query(
                `UPDATE \`${PAYOUTS}\` SET ${ENTRY_KIND} = 'PAYOUT' WHERE ${ENTRY_KIND} IS NULL`
            );
        }

        // MySQL has no partial indexes, so "one live opening per partner" is enforced through
        // a STORED generated column that is NULL outside the live states. NULLs never collide,
        // so reversing an opening frees the slot for a new one.
        const [duplicates] = await queryInterface.sequelize.query(
            `SELECT partnerCredentialId, COUNT(*) AS total FROM \`${PAYOUTS}\`
             WHERE ${ENTRY_KIND} = 'OPENING' AND entryType <> 'REVERSAL' AND status = 'ACTIVE'
             GROUP BY partnerCredentialId HAVING total > 1`
        );
        if (duplicates.length) {
            const named = duplicates
                .slice(0, 5)
                .map(row => String(row.partnerCredentialId))
                .join(", ");
            throw new Error(
                `Cannot add the unique opening balance index: ${duplicates.length} partner(s) already carry more than one live opening (${named}). ` +
                    "Reverse the duplicates and run the migration again."
            );
        }

        await addGenerated(
            queryInterface,
            PAYOUTS,
            OPENING_KEY,
            OPENING_INDEX,
            `IF(${ENTRY_KIND} = 'OPENING' AND entryType <> 'REVERSAL' AND status = 'ACTIVE', ` +
                "partnerCredentialId, NULL)",
            "BIGINT"
        );
    },

    async down(queryInterface) {
        const hasPayouts = await queryInterface.tableExists(PAYOUTS);
        if (!hasPayouts) return;

        await dropGenerated(queryInterface, PAYOUTS, OPENING_KEY, OPENING_INDEX);

        const described = await queryInterface.describeTable(PAYOUTS);
        if (described[ENTRY_KIND]) {
            await queryInterface.sequelize.query(
                `DELETE FROM \`${PAYOUTS}\` WHERE ${ENTRY_KIND} = 'OPENING'`
            );
            await queryInterface.removeColumn(PAYOUTS, ENTRY_KIND);
        }
    },
};
