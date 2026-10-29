/**
 * Created by Imran Noor
 */
'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const products = require("./products")

const subscription_plans = sequelizeConfig.define('subscription_plans', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING,
  price: Sequelize.DECIMAL(10, 4),
  validity: Sequelize.TEXT,
  description: Sequelize.TEXT,
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  includes: Sequelize.TEXT,
  subscriptionType: Sequelize.STRING,
  isUserRequired: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  features: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: [],
  },
})
subscription_plans.belongsTo(products)
module.exports = subscription_plans