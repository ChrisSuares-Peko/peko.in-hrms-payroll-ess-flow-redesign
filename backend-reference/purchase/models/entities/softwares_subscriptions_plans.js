"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const softwares_subscriptions = require("./softwares_subscriptions");

const softwares_subscriptions_plans = sequelizeConfig.define("softwares_subscriptions_plans", {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  name: Sequelize.STRING,
  monthlyPrice: Sequelize.DECIMAL(10, 2),
  yearlyPrice: Sequelize.DECIMAL(10, 2),
  features: {
    type: Sequelize.JSON,
    defaultValue: [],
  },
  image_url: Sequelize.TEXT,
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  descriptions: {
    type: Sequelize.JSON,
    defaultValue: [],
  },
  commissionMode: {
    type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
    defaultValue: 'MARGIN',
  },
  commissionType: {
    type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
    defaultValue: 'PERCENTAGE',
  },
  commission: {
    type: Sequelize.DECIMAL(10, 4),
    defaultValue: 0,
  },
  fixedCommissionPerTransaction: {
    type: Sequelize.DECIMAL(10, 4),
    defaultValue: 0,
  },
  isCommissionInclGST: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  isCommissionConfigured: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
});

softwares_subscriptions_plans.belongsTo(softwares_subscriptions);
module.exports = softwares_subscriptions_plans;
