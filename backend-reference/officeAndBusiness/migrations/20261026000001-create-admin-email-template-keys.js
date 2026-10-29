'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableExists = tables.some(
      (t) => String(t).toLowerCase() === 'adminemailtemplatekeys'
    );

    if (!tableExists) {
      await queryInterface.createTable('adminEmailTemplateKeys', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        // Stable programmatic identifier, e.g. WELCOME_EMAIL - matches the `key` column
        // on adminEmailTemplates for the same service. Unique per service, not globally
        // (two services may each own a PAYMENT_SUCCESS key).
        key: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        serviceId: {
          type: Sequelize.BIGINT,
          allowNull: false,
          references: {
            model: 'adminEmailTemplateServices',
            key: 'id',
          },
          // A service with keys registered under it can't be removed out from under
          // them - deactivate it instead (never hard-deleted either way).
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        // Flat name-only registry of this key's ${variable} placeholders, e.g.
        // { employeeName: '', companyName: '' } - values are always '', only the names
        // carry meaning. Documentation/reference for the template editor's variable
        // picker, same as the pre-existing static utils/emailTemplateKeys.js registry
        // it's meant to eventually replace - substitution itself still comes entirely
        // from whatever the send site supplies, so this is never read on the send path.
        variables: {
          type: Sequelize.JSON,
          allowNull: true,
        },
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

    const indexes = await queryInterface.showIndex('adminEmailTemplateKeys');
    const indexNames = indexes.map((i) => i.name);

    if (!indexNames.includes('adminEmailTemplateKeys_serviceId_key_unique')) {
      await queryInterface.addIndex('adminEmailTemplateKeys', ['serviceId', 'key'], {
        unique: true,
        name: 'adminEmailTemplateKeys_serviceId_key_unique',
      });
    }
    if (!indexNames.includes('adminEmailTemplateKeys_key')) {
      await queryInterface.addIndex('adminEmailTemplateKeys', ['key'], {
        name: 'adminEmailTemplateKeys_key',
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('adminEmailTemplateKeys');
  }
};
