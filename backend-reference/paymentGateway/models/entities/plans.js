/**
 * Created by Imran Noor
 */
'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");

const plans = sequelizeConfig.define('plans', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING,
  price: Sequelize.DECIMAL(10, 4),
  billingCycle: {
    type: Sequelize.ENUM("YEARLY", "MONTHLY")
  },
  description: Sequelize.TEXT,
  highlights: Sequelize.TEXT,
  logo: Sequelize.TEXT,
  is_available:{
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
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
    allowNull: false,
  }
})
module.exports = plans