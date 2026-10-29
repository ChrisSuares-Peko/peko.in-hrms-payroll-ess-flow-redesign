'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard every step so re-running this migration (or running it after the app's
    // own sync already applied the model change) is always safe — see
    // 20260818120000-create-admin-email-templates.js for why this matters on
    // platforms where a failed migrate step blocks container startup.
    const table = await queryInterface.describeTable('adminEmailTemplates');

    if (!table.partnerId) {
      await queryInterface.addColumn('adminEmailTemplates', 'partnerId', {
        // Partner's credential id (mirrors credential.registeredBy). NULL = a
        // shared/default template; set = overrides the default for that partner only.
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    const indexes = await queryInterface.showIndex('adminEmailTemplates');
    const indexNames = indexes.map((i) => i.name);

    // `key` alone is not unique (two services may both own e.g. PAYMENT_SUCCESS), and
    // now `service` + `key` alone is not unique either — a partner-specific override
    // and the shared default legitimately share both. Replace the old 2-column unique
    // index with the 3-column one before adding partnerId to the index set, so there's
    // never a moment where the old index would reject a row the new schema allows.
    if (indexNames.includes('adminEmailTemplates_service_key_unique')) {
      await queryInterface.removeIndex('adminEmailTemplates', 'adminEmailTemplates_service_key_unique');
    }
    if (!indexNames.includes('adminEmailTemplates_service_key_partnerId_unique')) {
      await queryInterface.addIndex('adminEmailTemplates', ['service', 'key', 'partnerId'], {
        unique: true,
        name: 'adminEmailTemplates_service_key_partnerId_unique',
      });
    }
    if (!indexNames.includes('adminEmailTemplates_partnerId')) {
      await queryInterface.addIndex('adminEmailTemplates', ['partnerId'], {
        name: 'adminEmailTemplates_partnerId',
      });
    }
  },

  async down(queryInterface) {
    const indexes = await queryInterface.showIndex('adminEmailTemplates');
    const indexNames = indexes.map((i) => i.name);

    if (indexNames.includes('adminEmailTemplates_partnerId')) {
      await queryInterface.removeIndex('adminEmailTemplates', 'adminEmailTemplates_partnerId');
    }
    if (indexNames.includes('adminEmailTemplates_service_key_partnerId_unique')) {
      await queryInterface.removeIndex('adminEmailTemplates', 'adminEmailTemplates_service_key_partnerId_unique');
    }
    if (!indexNames.includes('adminEmailTemplates_service_key_unique')) {
      await queryInterface.addIndex('adminEmailTemplates', ['service', 'key'], {
        unique: true,
        name: 'adminEmailTemplates_service_key_unique',
      });
    }

    const table = await queryInterface.describeTable('adminEmailTemplates');
    if (table.partnerId) {
      await queryInterface.removeColumn('adminEmailTemplates', 'partnerId');
    }
  },
};
