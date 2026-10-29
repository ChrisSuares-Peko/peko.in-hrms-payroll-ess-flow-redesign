'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");

const referral_codes = sequelizeConfig.define('referral_codes', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  referralCode: Sequelize.STRING,
  contactPersonName: Sequelize.STRING,
  contactPersonPhone: Sequelize.STRING,
  partnerId: Sequelize.STRING,
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  serviceRule: Sequelize.STRING,
  serviceOperatorIds: {
    type: Sequelize.JSON,
    defaultValue: [],
  }
})

module.exports = referral_codes