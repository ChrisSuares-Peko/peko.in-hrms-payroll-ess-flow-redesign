'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // The app's own sequelize.sync({force:false}) can auto-create this table (from the
    // adminEmailTemplate model) before this migration ever gets a chance to run and be
    // recorded — sync only creates tables for models that don't have one yet, so on any
    // environment where the app started even once after the model existed, this migration
    // would otherwise fail with "table/index already exists" and, on platforms where a
    // failed migrate step blocks container startup (e.g. Cloud Run), take the whole
    // service down in a crash loop. Guard every step so re-running this is always safe.
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.some(
      (t) => String(t).toLowerCase() === 'adminemailtemplates'
    );

    if (!tableExists) {
      await queryInterface.createTable('adminEmailTemplates', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        key: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING(150),
          allowNull: false,
        },
        service: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        subject: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        draftHtmlBody: {
          type: Sequelize.TEXT('medium'),
          allowNull: true,
        },
        publishedSubject: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        publishedHtmlBody: {
          type: Sequelize.TEXT('medium'),
          allowNull: true,
        },
        status: {
          type: Sequelize.ENUM('DRAFT', 'PUBLISHED'),
          allowNull: false,
          defaultValue: 'DRAFT',
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        version: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },
        updatedBy: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        publishedBy: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        publishedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
        },
      });
    }

    // Guarded individually (not just by tableExists above) since sequelize.sync()
    // creates indexes straight from the model definition too — a table created by
    // sync already has both of these, even on a "first" migrate run.
    const indexes = await queryInterface.showIndex('adminEmailTemplates');
    const indexNames = indexes.map((i) => i.name);

    if (!indexNames.includes('adminEmailTemplates_service_key_unique')) {
      await queryInterface.addIndex('adminEmailTemplates', ['service', 'key'], {
        unique: true,
        name: 'adminEmailTemplates_service_key_unique',
      });
    }
    if (!indexNames.includes('adminEmailTemplates_key')) {
      await queryInterface.addIndex('adminEmailTemplates', ['key'], {
        name: 'adminEmailTemplates_key',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('adminEmailTemplates');
  }
};
