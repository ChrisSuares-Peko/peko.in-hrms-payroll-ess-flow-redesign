"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");
const cloud_employees = require("./cloud_employees");
const credential = require("../credential");
const SubCorporateUser = require("../subCorporateUsers");

const cloud_assets = sequelizeConfig.define("cloud_assets", {
  id: {
    type: Sequelize.BIGINT(11),
    primaryKey: true,
    autoIncrement: true,
  },
  assetName: Sequelize.STRING,
  assetCategory: Sequelize.STRING,
  serialNumber: Sequelize.STRING,
  purchasedDate: Sequelize.DATE,
  assetType: Sequelize.STRING,
  warranty: Sequelize.STRING,
  amount: Sequelize.STRING,
  amountRecurring: Sequelize.STRING,
  vendor: Sequelize.STRING,
  batchNumber: Sequelize.STRING,
  status: Sequelize.STRING,
});
cloud_assets.belongsTo(cloud_employees);
cloud_assets.belongsTo(credential);
cloud_assets.belongsTo(SubCorporateUser)

module.exports = cloud_assets;
