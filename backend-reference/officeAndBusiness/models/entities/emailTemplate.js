'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

// Admin-managed email templates — table `adminEmailTemplates`. Additive: nothing
// in the existing send path reads it yet. `subject`/`draftHtmlBody` are the
// editable copy; `publishedSubject`/`publishedHtmlBody` are the only columns a
// send path may read.
const emailTemplate = sequelizeConfig.define('adminEmailTemplate', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  // Stable identifier, e.g. WELCOME_EMAIL. Unique per `service`.
  key: {
    type: Sequelize.STRING(100),
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING(150),
    allowNull: false,
  },
  // Business/service category that owns the template, e.g. AUTH — not the microservice name.
  service: {
    type: Sequelize.STRING(50),
    allowNull: false,
  },
  // NULL = shared/default template; set = per-partner override. Uniqueness of
  // (service, key, partnerId) is enforced in findTemplateByServiceAndKey, since
  // MySQL doesn't treat two NULLs as equal in a unique index.
  partnerId: {
    type: Sequelize.STRING(100),
    allowNull: true,
  },
  subject: {
    type: Sequelize.STRING(255),
    allowNull: true,
  },
  // "From" value, e.g. "Acme Corp <no-reply@acme.com>" (nodemailer accepts either form). NULL keeps the send path's default.
  sender: {
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
  // Operational kill switch, independent of the draft/publish workflow.
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
  // Maps a layout slot to an adminEmailLayout.id, e.g. { header: 3, footer: 7 }.
  // Absent slot keeps the hardcoded default. No DB foreign key — validated at the app layer.
  layout: {
    type: Sequelize.JSON,
    allowNull: true,
  },
}, {
  indexes: [
    // `key` alone isn't unique across services. MySQL treats NULL partnerId as
    // distinct each time, so this index alone can't stop duplicate defaults —
    // findTemplateByServiceAndKey enforces that at the app layer.
    { unique: true, fields: ['service', 'key', 'partnerId'], name: 'adminEmailTemplates_service_key_partnerId_unique' },
    // Supports lookups by key alone, when service isn't known.
    { fields: ['key'], name: 'adminEmailTemplates_key' },
    // Supports admin lookups/filters by partner alone.
    { fields: ['partnerId'], name: 'adminEmailTemplates_partnerId' },
  ],
});

module.exports = emailTemplate;
