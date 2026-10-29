'use strict';

// Converts the Business Registration tables to utf8mb4. Environments whose
// MySQL DEFAULT charset is a legacy one (staging = armscii8) created these
// tables via sequelize.sync unable to store utf8mb4 strings — the vendor
// catalog sync then fails with "Conversion from collation utf8mb4_unicode_ci
// into armscii8_general_ci impossible for parameter". The entities now pin
// charset for fresh creates; this migration repairs already-created tables.
//
// Guarding: NOTHING here can block a deploy —
//   - missing table            → skipped (sync creates it correctly now)
//   - already utf8mb4          → skipped (idempotent re-runs)
//   - collation unreadable     → conversion attempted anyway (no-op if already
//                                utf8mb4)
//   - conversion fails         → logged loudly and SKIPPED, never thrown (the
//                                original sync error simply remains until the
//                                table is repaired manually)

const TABLES = ['businessRegistrations', 'businessRegistrationCatalogs'];

module.exports = {
    async up(queryInterface) {
        for (const table of TABLES) {
            try {
                try {
                    await queryInterface.describeTable(table);
                } catch (err) {
                    continue; // Table doesn't exist yet.
                }

                let collation = '';
                try {
                    const [rows] = await queryInterface.sequelize.query(
                        'SELECT TABLE_COLLATION AS collation FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
                        { replacements: [table] }
                    );
                    collation = String(rows?.[0]?.collation ?? '');
                } catch (err) {
                    // Can't read information_schema — CONVERT below is a no-op
                    // when the table is already utf8mb4, so proceed regardless.
                }
                if (collation.startsWith('utf8mb4')) continue;

                await queryInterface.sequelize.query(
                    `ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
                );
                // eslint-disable-next-line no-console
                console.log(
                    `[br-utf8mb4] converted ${table} (was ${collation || 'unknown collation'})`
                );
            } catch (err) {
                // Never block the deploy: the entity-level charset pin covers
                // fresh environments; a failed in-place conversion only means
                // the existing sync error persists until repaired manually.
                // eslint-disable-next-line no-console
                console.error(`[br-utf8mb4] ${table} conversion FAILED (deploy continues): ${err.message}`);
            }
        }
    },

    // No down: converting BACK to a legacy charset could destroy data that
    // only utf8mb4 can represent.
    async down() {},
};
