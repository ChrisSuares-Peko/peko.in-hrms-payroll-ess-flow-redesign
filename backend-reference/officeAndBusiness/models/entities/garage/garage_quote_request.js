"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../../configs/database/index");
const credential = require("../credential");
const SubCorporateUser = require("../subCorporateUsers");

const garage_quote_request = sequelizeConfig.define("garage_quote_request", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  fullName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  mobileNumber: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  insuranceType: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  vehicleNumber: {
    type: Sequelize.STRING,
  },
  vehicleId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  status: {
    type: Sequelize.ENUM("NEW", "CONTACTED", "QUOTED", "CONVERTED", "CLOSED"),
    defaultValue: "NEW",
  },
  remarks: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  isDeleted: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
});

garage_quote_request.belongsTo(credential);
garage_quote_request.belongsTo(SubCorporateUser);

module.exports = garage_quote_request;
