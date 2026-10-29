/**
 * Created by Imran Noor
 */

"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const airport = sequelizeConfig.define("airport", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  airportCode: Sequelize.STRING,
  airportName: Sequelize.STRING,
  cityCode: Sequelize.STRING,
  cityName: Sequelize.STRING,
  countryCode: Sequelize.STRING,
  countryName: Sequelize.STRING,
  priority: {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
});
module.exports = airport;