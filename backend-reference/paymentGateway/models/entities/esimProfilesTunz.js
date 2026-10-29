"use strict";
const Sequelize = require("sequelize");
const sequelize = require("../../configs/database/index");

const esimProfiles = sequelize.define("esimProfiles", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: Sequelize.INTEGER,
  corporateUserId: Sequelize.INTEGER,

  customerUid: Sequelize.STRING,
  esimUid: Sequelize.STRING,

  iccid: {
    type: Sequelize.STRING,
    unique: true
  },

  activationCode: Sequelize.TEXT,
  corporateTxnId: Sequelize.BIGINT,

  planId: Sequelize.STRING,
  country: Sequelize.STRING,

  installationUrl: Sequelize.STRING,

  status: {
    type: Sequelize.ENUM(
      "RELEASED",
      "INSTALLED",
      "DISABLED",
      "ERROR"
    ),
    defaultValue: "RELEASED"
  }
});

module.exports = esimProfiles;