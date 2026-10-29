'use strict'

const Sequelize = require('sequelize')

const sequelizeConfig = require('../../configs/database/index')

// Minimal mirror of purchase's `govtServicesCatalogs` table — paymentGateway
// shares the DB and needs the service/variant name for the payment
// success notification, plus the price/amount and commission columns for the journal. Sync runs with { force:false }, no `alter`, so this
// partial model never creates/alters the table.
const govtServicesCatalog = sequelizeConfig.define('govtServicesCatalog', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  vendorCatalogId: {
    type: Sequelize.STRING,
    allowNull: true
  },
  serviceName: {
    type: Sequelize.STRING,
    allowNull: true
  },
  variantName: {
    type: Sequelize.STRING,
    allowNull: true
  },
  price: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  amount: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: true
  },
  commissionMode: {
    type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
    defaultValue: 'MARGIN'
  },
  commissionType: {
    type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
    defaultValue: 'PERCENTAGE'
  },
  commission: {
    type: Sequelize.DECIMAL(10, 4),
    defaultValue: 0
  },
  fixedCommissionPerTransaction: {
    type: Sequelize.DECIMAL(10, 4),
    defaultValue: 0
  },
  isCommissionInclGST: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  isCommissionConfigured: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
})

module.exports = govtServicesCatalog
