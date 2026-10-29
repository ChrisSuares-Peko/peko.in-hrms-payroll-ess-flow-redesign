'use strict';

const CI_ACCESS_KEY = 'company_incorporation';
const CI_LABEL = 'company incorporation';

const isCompanyIncorporation = node =>
    node?.accessKey === CI_ACCESS_KEY ||
    (typeof node?.label === 'string' && node.label.trim().toLowerCase() === CI_LABEL);

const parseJson = value => {
    if (value == null) return null;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }
    return typeof value === 'object' ? value : null;
};

// Drops Company Incorporation nodes at the top level and inside any subServices.
const stripCompanyIncorporation = tree => {
    if (!Array.isArray(tree)) return { changed: false, tree };
    let changed = false;
    const walk = nodes =>
        nodes.filter(node => {
            if (isCompanyIncorporation(node)) {
                changed = true;
                return false;
            }
            if (Array.isArray(node?.subServices)) node.subServices = walk(node.subServices);
            return true;
        });
    const cleaned = walk(tree);
    return { changed, tree: cleaned };
};

const tableName = t => String(typeof t === 'object' && t ? t.tableName || t.table_name || '' : t).toLowerCase();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    // Best-effort data cleanup: must never throw, since migrations run at
    // container startup (dockerfile: npm run migrate && npm run start:prod).
    async up(queryInterface) {
        const sequelize = queryInterface.sequelize;
        try {
            const tables = (await queryInterface.showAllTables()).map(tableName);

            if (tables.includes('partnerpermissions')) {
                const [rows] = await sequelize.query('SELECT id, permissions FROM partnerPermissions');
                let updated = 0;
                for (const row of rows) {
                    const { changed, tree } = stripCompanyIncorporation(parseJson(row.permissions));
                    if (!changed) continue;
                    await sequelize.query(
                        'UPDATE partnerPermissions SET permissions = :permissions WHERE id = :id',
                        { replacements: { permissions: JSON.stringify(tree), id: row.id } }
                    );
                    updated += 1;
                }
                console.log(`[Migration] Removed Company Incorporation from ${updated} partnerPermission row(s)`);
            } else {
                console.log('[Migration] partnerPermissions table not found — skipped');
            }

            if (tables.includes('settings')) {
                const [rows] = await sequelize.query(
                    "SELECT id, details FROM settings WHERE name = 'partnerInitialAccessesibleServices'"
                );
                for (const row of rows) {
                    const { changed, tree } = stripCompanyIncorporation(parseJson(row.details));
                    if (!changed) continue;
                    await sequelize.query('UPDATE settings SET details = :details WHERE id = :id', {
                        replacements: { details: JSON.stringify(tree), id: row.id },
                    });
                    console.log('[Migration] Removed Company Incorporation from partnerInitialAccessesibleServices');
                }
            }
        } catch (error) {
            console.error(
                '[Migration] Removing Company Incorporation from partner permissions failed (non-fatal):',
                error.message
            );
        }
    },

    async down() {
        console.log(
            '[Migration] No-op rollback — re-add Company Incorporation from the Corporate User Configuration admin page when the feature is wired back.'
        );
    },
};
