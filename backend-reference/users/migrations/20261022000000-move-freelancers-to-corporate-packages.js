'use strict';

// Freelancers now share the corporate packages. Moves anyone still on a
// freelancer package back to their partner's corporate basic GROUP package and
// deactivates the freelancer packages. packages.accountType is left in place:
// dropping it here would break other services still running the old model.

const tableName = t => String(typeof t === 'object' && t ? t.tableName || t.table_name || '' : t).toLowerCase();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    // Best-effort data cleanup: must never throw, since migrations run at
    // container startup (dockerfile: npm run migrate && npm run start:prod).
    async up(queryInterface) {
        const sequelize = queryInterface.sequelize;
        let transaction;
        try {
            const tables = (await queryInterface.showAllTables()).map(tableName);
            if (!['packages', 'corporateusers', 'credentials', 'subscriptions'].every(t => tables.includes(t))) {
                console.log('[Migration] Required tables missing, skipping freelancer package cleanup');
                return;
            }

            const packageDesc = await queryInterface.describeTable('packages');
            if (!packageDesc.accountType) {
                console.log('[Migration] packages.accountType not present, nothing to clean up');
                return;
            }

            const [freelancerPackages] = await sequelize.query(
                `SELECT id FROM packages WHERE accountType = 'freelancer'`
            );
            if (!freelancerPackages.length) {
                console.log('[Migration] No freelancer packages found, nothing to clean up');
                return;
            }
            const freelancerPackageIds = freelancerPackages.map(p => p.id);

            transaction = await sequelize.transaction();

            const [users] = await sequelize.query(
                `SELECT cu.id AS corporateUserId, c.registeredBy AS partnerId
                 FROM corporateUsers cu
                 JOIN credentials c ON cu.credentialId = c.id
                 WHERE cu.packageId IN (:freelancerPackageIds)`,
                { replacements: { freelancerPackageIds }, transaction }
            );

            const basicByPartner = new Map();
            let moved = 0;
            for (const { corporateUserId, partnerId } of users) {
                const key = partnerId ?? 'null';
                if (!basicByPartner.has(key)) {
                    const [[basic]] = await sequelize.query(
                        `SELECT id FROM packages
                         WHERE packageType = 'GROUP'
                           AND accountType = 'corporate'
                           AND status = true
                           AND (partnerId = :partnerId OR (:partnerId IS NULL AND partnerId IS NULL))
                         ORDER BY priorityLevel ASC
                         LIMIT 1`,
                        { replacements: { partnerId: partnerId ?? null }, transaction }
                    );
                    basicByPartner.set(key, basic?.id ?? null);
                }
                const basicPackageId = basicByPartner.get(key);
                if (!basicPackageId) {
                    console.log(`[Migration] No corporate basic package for partner ${key}, left corporateUser ${corporateUserId} as is`);
                    continue;
                }

                await sequelize.query(
                    'UPDATE corporateUsers SET packageId = :basicPackageId WHERE id = :corporateUserId',
                    { replacements: { basicPackageId, corporateUserId }, transaction }
                );
                // Only the free active slot; paid/historical rows keep their package.
                await sequelize.query(
                    `UPDATE subscriptions SET packageId = :basicPackageId
                     WHERE corporateUserId = :corporateUserId
                       AND packageId IN (:freelancerPackageIds)
                       AND subscriptionPaymentRefId IS NULL
                       AND status = 'ACTIVE'`,
                    { replacements: { basicPackageId, corporateUserId, freelancerPackageIds }, transaction }
                );
                moved += 1;
            }

            const [result] = await sequelize.query(
                `UPDATE packages SET status = false WHERE id IN (:freelancerPackageIds) AND status = true`,
                { replacements: { freelancerPackageIds }, transaction }
            );

            await transaction.commit();
            console.log(`[Migration] Moved ${moved} user(s) to corporate basic packages, deactivated ${result?.affectedRows ?? 0} freelancer package(s)`);
        } catch (error) {
            if (transaction) await transaction.rollback().catch(() => {});
            console.error('[Migration] Freelancer package cleanup failed:', error.message);
        }
    },

    async down() {
        // Not reversible: previous freelancer package assignments aren't stored.
        console.log('[Migration] Freelancer package cleanup has no down step');
    },
};
