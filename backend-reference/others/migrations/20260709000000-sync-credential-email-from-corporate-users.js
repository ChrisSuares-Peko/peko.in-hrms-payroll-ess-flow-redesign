'use strict';

/**
 * Profile/admin edits updated corporateUsers.email but never credentials.email (the
 * login identity), so the two diverged. Re-sync email/name for CORPORATE accounts.
 * Rows whose target email is already taken are skipped and logged for manual review.
 */

const tableExists = async (sequelize, tableName) => {
    const [rows] = await sequelize.query(
        `SELECT COUNT(*) AS cnt FROM information_schema.tables
         WHERE table_schema = DATABASE() AND LOWER(table_name) = LOWER(:tableName)`,
        { replacements: { tableName } }
    );
    return Number(rows[0].cnt) > 0;
};

module.exports = {
    async up(queryInterface) {
        const sequelize = queryInterface.sequelize;

        // skip instead of failing the pipeline on envs where tables don't exist yet
        for (const table of ['corporateUsers', 'credentials']) {
            if (!(await tableExists(sequelize, table))) {
                console.log(`[sync-credential-email] table "${table}" not found, skipping migration`);
                return;
            }
        }
        const canCheckSubUsers = await tableExists(sequelize, 'subCorporateUsers');

        const transaction = await sequelize.transaction();

        try {
            const [diverged] = await sequelize.query(
                `SELECT cu.credentialId, cu.email AS corporateEmail, cu.name AS corporateName,
                        c.email AS credentialEmail
                 FROM corporateUsers cu
                 INNER JOIN credentials c ON c.id = cu.credentialId
                 WHERE c.role = 'CORPORATE'
                   AND cu.email IS NOT NULL AND cu.email <> ''
                   AND (c.email IS NULL OR LOWER(cu.email) <> LOWER(c.email))`,
                { transaction }
            );

            let synced = 0;
            let skipped = 0;
            const conflicts = [];

            for (const row of diverged) {
                const newEmail = (row.corporateEmail || '').trim().toLowerCase();

                if (!newEmail || (row.credentialEmail || '').trim().toLowerCase() === newEmail) {
                    skipped += 1;
                    continue;
                }

                const [taken] = await sequelize.query(
                    `SELECT id FROM credentials
                     WHERE LOWER(email) = :newEmail AND id <> :credentialId
                     LIMIT 1`,
                    {
                        replacements: { newEmail, credentialId: row.credentialId },
                        transaction,
                    }
                );

                if (taken.length) {
                    conflicts.push(
                        `credentialId ${row.credentialId}: "${row.credentialEmail}" -> "${newEmail}" blocked, email already on credentialId ${taken[0].id}`
                    );
                    continue;
                }

                if (canCheckSubUsers) {
                    const [subUserTaken] = await sequelize.query(
                        `SELECT id FROM subCorporateUsers
                         WHERE LOWER(email) = :newEmail AND isDeleted = false
                         LIMIT 1`,
                        {
                            replacements: { newEmail },
                            transaction,
                        }
                    );

                    if (subUserTaken.length) {
                        conflicts.push(
                            `credentialId ${row.credentialId}: "${row.credentialEmail}" -> "${newEmail}" blocked, email on active subCorporateUser id ${subUserTaken[0].id}`
                        );
                        continue;
                    }
                }

                await sequelize.query(
                    `UPDATE credentials
                     SET email = :newEmail,
                         name = COALESCE(NULLIF(:corporateName, ''), name)
                     WHERE id = :credentialId`,
                    {
                        replacements: {
                            newEmail,
                            corporateName: row.corporateName || '',
                            credentialId: row.credentialId,
                        },
                        transaction,
                    }
                );
                synced += 1;
            }

            await transaction.commit();

            console.log(
                `[sync-credential-email] diverged: ${diverged.length}, synced: ${synced}, skipped: ${skipped}, conflicts: ${conflicts.length}`
            );
            conflicts.forEach(c => console.log(`[sync-credential-email] CONFLICT — ${c}`));
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down() {
        // stale emails are not recoverable; nothing to restore
        console.log('[sync-credential-email] down is a no-op');
    },
};
