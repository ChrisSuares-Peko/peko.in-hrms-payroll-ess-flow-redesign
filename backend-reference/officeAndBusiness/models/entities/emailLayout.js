'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

// Admin-managed, reusable email layout blocks (header/footer/etc) — table
// `adminEmailLayouts`. Identified by `id`, not service+key. Read at send time via
// services/emailTemplateResolver.js. `draftHtml` is the editable copy;
// `publishedHtml` is the only column a send path may read.
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
  // Block category, e.g. HEADER/FOOTER. Free STRING, not a DB ENUM, so new types don't need a migration.
  type: {
    type: Sequelize.STRING(50),
    allowNull: false,
  },
  // NULL = shared/default layout; set = partner-specific. Not part of any identity constraint.
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
}, {
  indexes: [
    // Supports admin lookups/filters by type (e.g. "show me every footer").
    { fields: ['type'], name: 'adminEmailLayouts_type' },
    // Supports admin lookups/filters by partner alone.
    { fields: ['partnerId'], name: 'adminEmailLayouts_partnerId' },
  ],
});

module.exports = emailLayout;
