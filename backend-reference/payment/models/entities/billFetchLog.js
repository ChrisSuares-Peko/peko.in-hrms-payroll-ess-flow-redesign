"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

// Audit log of BBPS vendor fetchBill calls — one row per call to reconcile vendor charges.
const billFetchLog = sequelizeConfig.define("billFetchLog", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },

  credentialId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },

  inputParams: {
    type: Sequelize.JSON,
    allowNull: true,
  },

  // null = no HTTP response received (network/timeout), so no status code.
  statusCode: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
}, {
  timestamps: true,
});

billFetchLog.belongsTo(credential, { foreignKey: "credentialId" });

module.exports = billFetchLog;
