'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

// Admin-managed registry of email template "services" (e.g. AUTH, PAYROLL) — replaces
// the hardcoded EMAIL_TEMPLATE_SERVICES list in utils/emailTemplateKeys.js.
const emailTemplateService = sequelizeConfig.define('adminEmailTemplateService', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  key: {
    type: Sequelize.STRING(50),
    allowNull: false,
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
    { unique: true, fields: ['key'], name: 'adminEmailTemplateServices_key_unique' },
  ],
});

module.exports = emailTemplateService;
