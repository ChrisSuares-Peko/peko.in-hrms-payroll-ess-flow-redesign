'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

// Read-only mirror of officeAndBusiness/models/entities/emailLayout.js — same
// table, same DB. All admin CRUD lives in officeAndBusiness; this only reads
// published rows via services/emailTemplateResolver.js. Keep columns in sync.
const emailLayout = sequelizeConfig.define('adminEmailLayout', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING(150),
    allowNull: false,
  },
  type: {
    type: Sequelize.STRING(50),
    allowNull: false,
  },
  partnerId: {
    type: Sequelize.STRING(100),
    allowNull: true,
  },
  draftHtml: {
    type: Sequelize.TEXT('medium'),
    allowNull: true,
  },
  publishedHtml: {
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
}, {
  indexes: [
    { fields: ['type'], name: 'adminEmailLayouts_type' },
    { fields: ['partnerId'], name: 'adminEmailLayouts_partnerId' },
  ],
});

module.exports = emailLayout;
