'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser")
const access_codes = sequelizeConfig.define('access_codes', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  access_code: Sequelize.STRING,//make unique
  partnerId: Sequelize.STRING,
  groupId: Sequelize.BIGINT,
  isAssigned: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
})
access_codes.belongsTo(corporateUser)
module.exports = access_codes