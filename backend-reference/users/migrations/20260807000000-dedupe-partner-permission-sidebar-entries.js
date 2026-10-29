'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    // Best-effort data cleanup: must never throw, since migrations run at
    // container startup (dockerfile: npm run migrate && npm run start:prod).
    async up(queryInterface) {
        try {
            const tables = await queryInterface.showAllTables();
            if (!tables.some(t => String(t).toLowerCase() === 'partnerpermissions')) {
                console.log('[Migration] partnerPermissions table not found — nothing to dedupe');
                return;
            }

            const [rows] = await queryInterface.sequelize.query(
                'SELECT id, permissions FROM partnerPermissions'
            );

            let updated = 0;
            let failed = 0;
            for (const row of rows) {
                let permissions = row.permissions;
                if (typeof permissions === 'string') {
                    try {
                        permissions = JSON.parse(permissions);
                    } catch (error) {
                        console.error(`[Migration] Skipping partnerPermission id=${row.id} — unparseable permissions JSON`);
                        continue;
                    }
                }
                if (!Array.isArray(permissions)) continue;

                // Dedupe top-level services by label: keep first occurrence, and if any
                // duplicate was disabled treat the service as disabled (the admin's
                // disable action landed on only one of the duplicated entries).
                const byLabel = new Map();
                const deduped = [];
                let hasDuplicates = false;
                for (const service of permissions) {
                    const label = typeof service?.label === 'string' ? service.label.trim().toLowerCase() : null;
                    if (label === null) {
                        deduped.push(service);
                        continue;
                    }
                    if (byLabel.has(label)) {
                        hasDuplicates = true;
                        const kept = byLabel.get(label);
                        kept.hasAccess = Boolean(kept.hasAccess) && Boolean(service.hasAccess);
                    } else {
                        byLabel.set(label, service);
                        deduped.push(service);
                    }
                }

                if (!hasDuplicates) continue;

                try {
                    await queryInterface.sequelize.query(
                        'UPDATE partnerPermissions SET permissions = :permissions WHERE id = :id',
                        { replacements: { permissions: JSON.stringify(deduped), id: row.id } }
                    );
                    updated += 1;
                } catch (error) {
                    failed += 1;
                    console.error(`[Migration] Failed to update partnerPermission id=${row.id}:`, error.message);
                }
            }
            console.log(`[Migration] Deduped sidebar entries in ${updated} partnerPermission row(s)${failed ? `, ${failed} failed` : ''}`);
        } catch (error) {
            console.error('[Migration] Dedupe of partnerPermission sidebar entries failed (non-fatal):', error.message);
        }
    },

    async down() {
        console.log('[Migration] No-op rollback — duplicated sidebar entries were data corruption, not a schema change.');
    },
};
