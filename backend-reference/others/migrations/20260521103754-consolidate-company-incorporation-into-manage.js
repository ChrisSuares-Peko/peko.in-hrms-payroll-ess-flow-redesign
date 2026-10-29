'use strict';

const OLD_REPORTS_SERVICE = 'Company Incorporation';
const OLD_SETTINGS_SERVICE = 'Company Incorporation Config';
const NEW_MANAGE_SERVICE = 'Company Incorporation';

const NEW_MANAGE_ENTRY = {
    view: false,
    write: false,
    update: false,
    service: NEW_MANAGE_SERVICE,
    hasAccess: false,
};

const parseJsonField = value => {
    if (value == null) return null;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }
    if (typeof value === 'object') return value;
    return null;
};

const consolidateTree = tree => {
    if (!Array.isArray(tree)) return { changed: false, tree };

    let changed = false;
    let oldReportsAccess = false;
    let oldSettingsAccess = false;

    const reports = tree.find(c => c && c.serviceCategory === 'Reports');
    if (reports && Array.isArray(reports.services)) {
        for (const group of reports.services) {
            if (!group || !Array.isArray(group.services)) continue;
            const idx = group.services.findIndex(s => s && s.service === OLD_REPORTS_SERVICE);
            if (idx !== -1) {
                oldReportsAccess = oldReportsAccess || !!group.services[idx].hasAccess;
                group.services.splice(idx, 1);
                changed = true;
            }
        }
    }

    const settings = tree.find(c => c && c.serviceCategory === 'Settings');
    if (settings && Array.isArray(settings.services)) {
        for (const group of settings.services) {
            if (!group || !Array.isArray(group.services)) continue;
            const idx = group.services.findIndex(s => s && s.service === OLD_SETTINGS_SERVICE);
            if (idx !== -1) {
                oldSettingsAccess = oldSettingsAccess || !!group.services[idx].hasAccess;
                group.services.splice(idx, 1);
                changed = true;
            }
        }
    }

    const manage = tree.find(c => c && c.serviceCategory === 'Manage');
    if (manage && Array.isArray(manage.services)) {
        let general = manage.services.find(g => g && g.category === 'General');
        if (!general) {
            general = { category: 'General', services: [], hasAccess: false };
            manage.services.push(general);
            changed = true;
        }
        if (!Array.isArray(general.services)) general.services = [];
        const exists = general.services.find(s => s && s.service === NEW_MANAGE_SERVICE);
        if (!exists) {
            general.services.push({
                ...NEW_MANAGE_ENTRY,
                hasAccess: oldReportsAccess || oldSettingsAccess,
            });
            changed = true;
        }
    }

    return { changed, tree };
};

module.exports = {
    async up(queryInterface) {
        const sequelize = queryInterface.sequelize;
        const transaction = await sequelize.transaction();

        try {
            let settingsUpdated = 0;
            let rolesUpdated = 0;

            const [settingRows] = await sequelize.query(
                "SELECT id, details FROM `settings` WHERE name = 'initialServicePermissions'",
                { transaction }
            );

            for (const row of settingRows) {
                const details = parseJsonField(row.details);
                if (!details) continue;
                const { changed, tree } = consolidateTree(details);
                if (changed) {
                    await sequelize.query(
                        "UPDATE `settings` SET details = :details WHERE id = :id",
                        {
                            replacements: { details: JSON.stringify(tree), id: row.id },
                            transaction,
                        }
                    );
                    settingsUpdated += 1;
                }
            }

            const [roleRows] = await sequelize.query(
                'SELECT id, permissions FROM `roleAndPermissions`',
                { transaction }
            );

            for (const row of roleRows) {
                const permissions = parseJsonField(row.permissions);
                if (!permissions) continue;
                const { changed, tree } = consolidateTree(permissions);
                if (changed) {
                    await sequelize.query(
                        'UPDATE `roleAndPermissions` SET permissions = :permissions WHERE id = :id',
                        {
                            replacements: {
                                permissions: JSON.stringify(tree),
                                id: row.id,
                            },
                            transaction,
                        }
                    );
                    rolesUpdated += 1;
                }
            }

            await transaction.commit();

            console.log(
                `[consolidate-company-incorporation] settings rows updated: ${settingsUpdated}, role rows updated: ${rolesUpdated}`
            );
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },

    async down() {
        // No-op: this migration consolidates structure; rolling back is unsafe because
        // we cannot reliably split the merged hasAccess flag back into Reports vs Settings.
    },
};
