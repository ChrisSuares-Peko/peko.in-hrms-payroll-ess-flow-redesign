'use strict';

const CI_SERVICE = 'Company Incorporation';
const CI_SEARCH_PATH_KEY = 'companyIncorporation';

const parseJsonField = value => {
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

// Removes the Company Incorporation service from every category of a system-user
// permission tree — both the flat `services[].service` shape and the grouped
// `services[].services[].service` shape.
const stripCompanyIncorporation = tree => {
    if (!Array.isArray(tree)) return { changed: false, value: tree };
    let changed = false;
    for (const category of tree) {
        if (!category || !Array.isArray(category.services)) continue;
        const before = category.services.length;
        category.services = category.services.filter(s => s?.service !== CI_SERVICE);
        if (category.services.length !== before) changed = true;
        for (const group of category.services) {
            if (!group || !Array.isArray(group.services)) continue;
            const groupBefore = group.services.length;
            group.services = group.services.filter(s => s?.service !== CI_SERVICE);
            if (group.services.length !== groupBefore) changed = true;
        }
    }
    return { changed, value: tree };
};

const stripSearchEntry = list => {
    if (!Array.isArray(list)) return { changed: false, value: list };
    const filtered = list.filter(s => s?.pathKey !== CI_SEARCH_PATH_KEY);
    return { changed: filtered.length !== list.length, value: filtered };
};

const updateRows = async (sequelize, transaction, { select, update, column, strip }) => {
    const [rows] = await sequelize.query(select, { transaction });
    let updated = 0;
    for (const row of rows) {
        const { changed, value } = strip(parseJsonField(row[column]));
        if (!changed) continue;
        await sequelize.query(update, {
            replacements: { value: JSON.stringify(value), id: row.id },
            transaction,
        });
        updated += 1;
    }
    return updated;
};

const tableName = t => String(typeof t === 'object' && t ? t.tableName || t.table_name || '' : t).toLowerCase();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    // Best-effort data cleanup: must never throw — the container runs
    // `sequelize-cli db:migrate` before start:prod (see dockerfile).
    async up(queryInterface) {
        const sequelize = queryInterface.sequelize;
        let transaction;
        try {
            const tables = (await queryInterface.showAllTables()).map(tableName);
            const hasSettings = tables.includes('settings');
            const hasRoles = tables.includes('roleandpermissions');
            if (!hasSettings && !hasRoles) {
                console.log('[Migration] settings / roleAndPermissions tables not found — nothing to clean');
                return;
            }

            transaction = await sequelize.transaction();
            let settingsUpdated = 0;
            let rolesUpdated = 0;
            let searchUpdated = 0;

            if (hasSettings) {
                settingsUpdated = await updateRows(sequelize, transaction, {
                    select: "SELECT id, details FROM `settings` WHERE name = 'initialServicePermissions'",
                    update: 'UPDATE `settings` SET details = :value WHERE id = :id',
                    column: 'details',
                    strip: stripCompanyIncorporation,
                });
                // Global search suggestions: drop the Company Incorporation entry. Business
                // Registration is added on next read from defaultSearchServices.json.
                searchUpdated = await updateRows(sequelize, transaction, {
                    select: "SELECT id, details FROM `settings` WHERE name = 'searchServices'",
                    update: 'UPDATE `settings` SET details = :value WHERE id = :id',
                    column: 'details',
                    strip: stripSearchEntry,
                });
            }

            if (hasRoles) {
                rolesUpdated = await updateRows(sequelize, transaction, {
                    select: 'SELECT id, permissions FROM `roleAndPermissions`',
                    update: 'UPDATE `roleAndPermissions` SET permissions = :value WHERE id = :id',
                    column: 'permissions',
                    strip: stripCompanyIncorporation,
                });
            }

            await transaction.commit();
            console.log(
                `[Migration] Removed Company Incorporation — settings rows: ${settingsUpdated}, role rows: ${rolesUpdated}, search rows: ${searchUpdated}`
            );
        } catch (error) {
            if (transaction) await transaction.rollback().catch(() => {});
            console.error(
                '[Migration] Removing Company Incorporation from admin permissions failed (non-fatal):',
                error.message
            );
        }
    },

    async down() {
        console.log(
            '[Migration] No-op rollback — re-add Company Incorporation from the System User Configuration admin page when the feature is wired back.'
        );
    },
};
