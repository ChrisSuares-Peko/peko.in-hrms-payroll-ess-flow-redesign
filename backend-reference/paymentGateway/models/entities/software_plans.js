'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const softwares = require("./softwares")

const software_plans = sequelizeConfig.define('software_plans', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  planId: {
    type: Sequelize.STRING,
    unique: true
  },
  name: Sequelize.STRING,
  vendorPrice: Sequelize.DECIMAL(10, 4),
  price: Sequelize.DECIMAL(10, 4),
  validity: Sequelize.TEXT,
  discount: Sequelize.STRING,
  noOfUsers:  Sequelize.INTEGER,
  features: Sequelize.TEXT,
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
})

software_plans.belongsTo(softwares)
module.exports = software_plans