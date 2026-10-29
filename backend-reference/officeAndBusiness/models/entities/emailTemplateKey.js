'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');
const emailTemplateService = require('./emailTemplateService');

// Admin-managed registry of email template "keys" (e.g. WELCOME_EMAIL) and their
// ${variable} placeholder names. `variables` is a flat name-only map — values are
// always '', only the names carry meaning; nothing on the send path reads it.
const emailTemplateKey = sequelizeConfig.define('adminEmailTemplateKey', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  key: {
    type: Sequelize.STRING(100),
    allowNull: false,
  },
  serviceId: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
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
}, {
  indexes: [
    { unique: true, fields: ['serviceId', 'key'], name: 'adminEmailTemplateKeys_serviceId_key_unique' },
    { fields: ['key'], name: 'adminEmailTemplateKeys_key' },
  ],
});

emailTemplateKey.belongsTo(emailTemplateService, { foreignKey: 'serviceId', as: 'service' });

module.exports = emailTemplateKey;
