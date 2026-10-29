"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");
const cloud_fleets = require("./cloud_fleets");
const SubCorporateUser = require("../subCorporateUsers");

const cloud_maintenances = sequelizeConfig.define("cloud_maintenances", {
  id: {
    type: Sequelize.BIGINT(11),
    primaryKey: true,
    autoIncrement: true,
  },
  maintenanceCategory: Sequelize.STRING,
  repairCategory: Sequelize.STRING,
  serviceType: Sequelize.TEXT,
  date: Sequelize.DATE,
  receivedDate: Sequelize.DATE,
  amount: Sequelize.STRING,
  status: Sequelize.STRING,
});
cloud_maintenances.belongsTo(cloud_fleets);
cloud_maintenances.belongsTo(SubCorporateUser)
module.exports = cloud_maintenances;
