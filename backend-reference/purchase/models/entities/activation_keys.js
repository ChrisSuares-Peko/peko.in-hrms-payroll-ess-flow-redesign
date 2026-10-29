'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const subscription_plans = require("./subscription_plans");
const corporateUser = require('./corporateUser');

const activation_keys = sequelizeConfig.define('activation_keys', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  activation_key: Sequelize.STRING,
  isAssigned: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
})
activation_keys.belongsTo(subscription_plans,{ foreignKey: 'planId' })
activation_keys.belongsTo(corporateUser)
module.exports = activation_keys