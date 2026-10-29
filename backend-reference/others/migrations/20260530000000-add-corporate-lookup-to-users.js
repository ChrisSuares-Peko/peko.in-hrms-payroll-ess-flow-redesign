'use strict';

const NEW_SERVICE = {
    view: false,
    write: true,
    update: true,
    service: 'Corporate Lookup',
    hasAccess: true,
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

const addCorporateLookup = tree => {
    if (!Array.isArray(tree)) return { changed: false, tree };

    const users = tree.find(c => c && c.serviceCategory === 'Users');
    if (!users || !Array.isArray(users.services)) return { changed: false, tree };

    const corporate = users.services.find(g => g && g.category === 'Corporate');
    if (!corporate || !Array.isArray(corporate.services)) return { changed: false, tree };

    const exists = corporate.services.find(s => s && s.service === 'Corporate Lookup');
    if (exists) return { changed: false, tree };

    corporate.services.push({ ...NEW_SERVICE });
    return { changed: true, tree };
};

const removeCorporateLookup = tree => {
    if (!Array.isArray(tree)) return { changed: false, tree };

    const users = tree.find(c => c && c.serviceCategory === 'Users');
    if (!users || !Array.isArray(users.services)) return { changed: false, tree };

    const corporate = users.services.find(g => g && g.category === 'Corporate');
    if (!corporate || !Array.isArray(corporate.services)) return { changed: false, tree };

    const idx = corporate.services.findIndex(s => s && s.service === 'Corporate Lookup');
    if (idx === -1) return { changed: false, tree };

    corporate.services.splice(idx, 1);
    return { changed: true, tree };
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
                const { changed, tree } = addCorporateLookup(details);
                if (changed) {
                    await sequelize.query(
                        'UPDATE `settings` SET details = :details WHERE id = :id',
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
                const { changed, tree } = addCorporateLookup(permissions);
                if (changed) {
                    await sequelize.query(
                        'UPDATE `roleAndPermissions` SET permissions = :permissions WHERE id = :id',
                        {
                            replacements: { permissions: JSON.stringify(tree), id: row.id },
                            transaction,
                        }
                    );
                    rolesUpdated += 1;
                }
            }

            await transaction.commit();

            console.log(
                `[add-corporate-lookup] settings rows updated: ${settingsUpdated}, role rows updated: ${rolesUpdated}`
            );
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },

    async down(queryInterface) {
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
                const { changed, tree } = removeCorporateLookup(details);
                if (changed) {
                    await sequelize.query(
                        'UPDATE `settings` SET details = :details WHERE id = :id',
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
                const { changed, tree } = removeCorporateLookup(permissions);
                if (changed) {
                    await sequelize.query(
                        'UPDATE `roleAndPermissions` SET permissions = :permissions WHERE id = :id',
                        {
                            replacements: { permissions: JSON.stringify(tree), id: row.id },
                            transaction,
                        }
                    );
                    rolesUpdated += 1;
                }
            }

            await transaction.commit();

            console.log(
                `[add-corporate-lookup] rollback — settings rows updated: ${settingsUpdated}, role rows updated: ${rolesUpdated}`
            );
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },
};
