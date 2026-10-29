'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const works = require("./works")

const work_plans = sequelizeConfig.define('work_plans', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING,
  description: Sequelize.TEXT,
  price: Sequelize.DECIMAL(10, 2),
  billingCycle: Sequelize.TEXT,
  features: Sequelize.TEXT,
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  popular:{
    type: Sequelize.BOOLEAN,
    defaultValue: false
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

work_plans.belongsTo(works)
module.exports = work_plans