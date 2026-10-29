/**
 * Created by Imran Noor
 */
'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const plans = require("./plans")

const workspaces = sequelizeConfig.define('workspaces', {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING,
  monthlyPrice: Sequelize.DECIMAL(10, 4),
  yearlyPrice: Sequelize.DECIMAL(10, 4),
  address: Sequelize.STRING,
  latLng: Sequelize.STRING,
  logo: Sequelize.TEXT,
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
})
workspaces.belongsTo(plans)
module.exports = workspaces