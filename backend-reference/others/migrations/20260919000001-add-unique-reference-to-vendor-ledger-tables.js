"use strict";

// MySQL has no partial indexes, so uniqueness that must ignore reversed rows is enforced
// through a STORED generated column that is NULL outside the live statuses — NULLs never
// collide. Same technique as cardRequests.activeDedupeKey in the corporateCard service.
const TARGETS = [
    {
        table: "vendorDeposits",
        column: "activeReferenceKey",
        index: "vendorDeposits_activeReference_unique",
        liveStatuses: "'ACTIVE'",
        reference: "reference",
        label: "deposit reference",
    },
    {
        table: "vendorCreditNotes",
        column: "activeCreditNoteKey",
        index: "vendorCreditNotes_activeNumber_unique",
        liveStatuses: "'OPEN', 'APPLIED'",
        reference: "creditNoteNumber",
        label: "credit note number",
    },
];

const duplicatesQuery = ({ table, liveStatuses, reference }) =>
    `SELECT vendorId, ${reference} AS reference, COUNT(*) AS total FROM \`${table}\`
     WHERE status IN (${liveStatuses}) AND vendorId IS NOT NULL AND ${reference} IS NOT NULL
     GROUP BY vendorId, ${reference} HAVING COUNT(*) > 1`;

module.exports = {
    async up(queryInterface) {
        for (const target of TARGETS) {
            const exists = await queryInterface.tableExists(target.table);
            if (!exists) continue;

            const described = await queryInterface.describeTable(target.table);
            if (described[target.column]) continue;

            const [duplicates] = await queryInterface.sequelize.query(duplicatesQuery(target));
            if (duplicates.length) {
                const sample = duplicates
                    .slice(0, 5)
                    .map(row => `vendor ${row.vendorId} / ${row.reference} (${row.total})`)
                    .join(", ");
                throw new Error(
                    `Cannot add the unique ${target.label} index: ${target.table} already holds ${duplicates.length} duplicate(s) — ${sample}. Reverse the duplicates, then run this migration again.`
                );
            }

            await queryInterface.sequelize.query(
                `ALTER TABLE \`${target.table}\` ADD COLUMN \`${target.column}\` VARCHAR(120)
                 GENERATED ALWAYS AS (
                     IF(status IN (${target.liveStatuses}) AND vendorId IS NOT NULL AND ${target.reference} IS NOT NULL,
                        CONCAT(vendorId, ':', ${target.reference}),
                        NULL)
                 ) STORED`
            );
            await queryInterface.addIndex(target.table, [target.column], {
                unique: true,
                name: target.index,
            });
        }
    },

    async down(queryInterface) {
        for (const target of TARGETS) {
            const exists = await queryInterface.tableExists(target.table);
            if (!exists) continue;

            const described = await queryInterface.describeTable(target.table);
            if (!described[target.column]) continue;

            await queryInterface.removeIndex(target.table, target.index);
            await queryInterface.removeColumn(target.table, target.column);
        }
    },
};
