'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

// Read-only mirror of officeAndBusiness/models/entities/emailTemplate.js — same
// table, same DB. All admin CRUD lives in officeAndBusiness; this only reads
// published rows via services/emailTemplateResolver.js. Keep columns in sync.
const emailTemplate = sequelizeConfig.define('adminEmailTemplate', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
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
  partnerId: {
    type: Sequelize.STRING(100),
    allowNull: true,
  },
  subject: {
    type: Sequelize.STRING(255),
    allowNull: true,
  },
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
  // Maps a layout slot to an adminEmailLayouts.id, e.g. { header: 3, footer: 7 }.
  // NULL keeps the hardcoded default.
  layout: {
    type: Sequelize.JSON,
    allowNull: true,
  },
}, {
  indexes: [
    { unique: true, fields: ['service', 'key', 'partnerId'], name: 'adminEmailTemplates_service_key_partnerId_unique' },
    { fields: ['key'], name: 'adminEmailTemplates_key' },
    { fields: ['partnerId'], name: 'adminEmailTemplates_partnerId' },
  ],
});

module.exports = emailTemplate;
