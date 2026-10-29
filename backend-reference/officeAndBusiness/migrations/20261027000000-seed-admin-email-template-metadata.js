'use strict';

const { EMAIL_TEMPLATE_KEYS_BY_SERVICE } = require('../utils/emailTemplateKeys');

// One-time import of EMAIL_TEMPLATE_KEYS_BY_SERVICE (38 services, 183 keys) into
// adminEmailTemplateServices/adminEmailTemplateKeys, so the admin panel isn't started
// from zero. Guarded per-row, so it's safe to run again after manual admin edits.
const SEEDED_BY = 'migration:seed-admin-email-template-metadata';

module.exports = {
    async up(queryInterface) {
        const now = new Date();

        for (const [serviceKey, serviceEntry] of Object.entries(EMAIL_TEMPLATE_KEYS_BY_SERVICE)) {
            const [existingService] = await queryInterface.sequelize.query(
                'SELECT id FROM adminEmailTemplateServices WHERE `key` = :key LIMIT 1',
                { replacements: { key: serviceKey }, type: queryInterface.sequelize.QueryTypes.SELECT }
            );

            let serviceId = existingService?.id;
            if (!serviceId) {
                await queryInterface.bulkInsert('adminEmailTemplateServices', [
                    { key: serviceKey, isActive: true, updatedBy: SEEDED_BY, createdAt: now, updatedAt: now },
                ]);
                const [inserted] = await queryInterface.sequelize.query(
                    'SELECT id FROM adminEmailTemplateServices WHERE `key` = :key LIMIT 1',
                    { replacements: { key: serviceKey }, type: queryInterface.sequelize.QueryTypes.SELECT }
                );
                serviceId = inserted.id;
            }

            const keys = serviceEntry.emailTemplateKeys || {};
            for (const [keyName, keyEntry] of Object.entries(keys)) {
                const [existingKey] = await queryInterface.sequelize.query(
                    'SELECT id FROM adminEmailTemplateKeys WHERE serviceId = :serviceId AND `key` = :key LIMIT 1',
                    {
                        replacements: { serviceId, key: keyName },
                        type: queryInterface.sequelize.QueryTypes.SELECT,
                    }
                );
                if (existingKey) continue;

                const variables = Object.fromEntries(
                    Object.keys(keyEntry.variables || {}).map((name) => [name, ''])
                );

                await queryInterface.bulkInsert('adminEmailTemplateKeys', [
                    {
                        key: keyName,
                        serviceId,
                        variables: JSON.stringify(variables),
                        isActive: true,
                        updatedBy: SEEDED_BY,
                        createdAt: now,
                        updatedAt: now,
                    },
                ]);
            }
        }
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            'DELETE FROM adminEmailTemplateKeys WHERE updatedBy = :seededBy',
            { replacements: { seededBy: SEEDED_BY } }
        );
        await queryInterface.sequelize.query(
            'DELETE FROM adminEmailTemplateServices WHERE updatedBy = :seededBy',
            { replacements: { seededBy: SEEDED_BY } }
        );
    },
};
