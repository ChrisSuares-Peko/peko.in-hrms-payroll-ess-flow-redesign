'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard every step - sequelize.sync({force:false}) can auto-create this table from
    // the model before this migration ever runs, which would otherwise fail with
    // "table/index already exists" (see 20260818120000-create-admin-email-templates.js
    // for the full reasoning).
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.some(
      (t) => String(t).toLowerCase() === 'adminemailtemplateservices'
    );

    if (!tableExists) {
      await queryInterface.createTable('adminEmailTemplateServices', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        // Stable programmatic identifier, e.g. AUTH, PAYROLL - matches the `service`
        // column on adminEmailTemplates and the EMAIL_TEMPLATE_SERVICE(S) constant every
        // microservice's send code already uses. No FK to adminEmailTemplates.service:
        // several owning services are separate codebases/databases.
        key: {
          type: Sequelize.STRING(50),
          allowNull: false,
        },
        // Operational kill switch. Services are never hard-deleted - deactivating one
        // would orphan any key/template that still references it.
        isActive: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        updatedBy: {
          type: Sequelize.STRING(100),
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

    const indexes = await queryInterface.showIndex('adminEmailTemplateServices');
    const indexNames = indexes.map((i) => i.name);

    if (!indexNames.includes('adminEmailTemplateServices_key_unique')) {
      await queryInterface.addIndex('adminEmailTemplateServices', ['key'], {
        unique: true,
        name: 'adminEmailTemplateServices_key_unique',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('adminEmailTemplateServices');
  }
};
