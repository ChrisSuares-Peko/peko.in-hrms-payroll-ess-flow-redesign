"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");
const credential = require("../credential");
const SubCorporateUser = require("../subCorporateUsers");

const garage_fleet = sequelizeConfig.define("garage_fleet", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  vehicleNumber: {
    type: Sequelize.STRING,
    allowNull: false
  },
  manufacturer: {
    type: Sequelize.STRING,
  },
  model: {
    type: Sequelize.STRING,
  },
  fuelType: {
    type: Sequelize.STRING,
  },
  rcStatus: {
    type: Sequelize.STRING,
  },
  insuranceValidUpto: {
    type: Sequelize.DATE,
  },
  pucValidUpto: {
    type: Sequelize.DATE,
  },
  permitValidUpto: {
    type: Sequelize.DATE,
  },
  blacklistStatus: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  engineNumber: {
    type: Sequelize.STRING,
  },
  chassisNumber: {
    type: Sequelize.STRING,
  },
  regDate: {
    type: Sequelize.DATE,
  },
  regAuthority: {
    type: Sequelize.STRING,
  },
  presentAddress: {
    type: Sequelize.TEXT,
  },
  permanentAddress: {
    type: Sequelize.TEXT,
  },
  manufacturingDate: {
    type: Sequelize.STRING,
  },
  insuranceCompany: {
    type: Sequelize.STRING,
  },
  policyNumber: {
    type: Sequelize.STRING,
  },
  ownerName: {
    type: Sequelize.STRING,
  },
  isCommercial: {
    type: Sequelize.BOOLEAN,
  },
  rawData: {
    type: Sequelize.JSON,
  },
  fasttagBalance: {
    type: Sequelize.STRING,
  },
  insuranceExpiry: {
    type: Sequelize.DATE,
  },
  lastServiceDate: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  nextServiceDue: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  fastagProvider: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  fastagBillerId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  fastagRegistration: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  fastagParamName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  // Last time the RC data was re-pulled from the vendor. Drives the once-a-week refresh cap.
  lastRefreshedAt: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null,
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  status: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
  isDeleted: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
});

garage_fleet.belongsTo(credential);
garage_fleet.belongsTo(SubCorporateUser);

module.exports = garage_fleet;
