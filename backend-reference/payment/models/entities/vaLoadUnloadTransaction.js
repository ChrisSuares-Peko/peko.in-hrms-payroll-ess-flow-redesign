"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const vaLoadUnloadTransaction = sequelizeConfig.define("vaLoadUnloadTransaction", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: Sequelize.ENUM("LOAD", "UNLOAD"),
    allowNull: false,
  },
  virtualAccountNumber: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  amount: {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
  },
  referenceId: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },
  decentroTxnId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.ENUM("PENDING", "COMPLETED", "FAILED"),
    defaultValue: "PENDING",
  },
  providerMessage: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  bankReferenceNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  purposeMessage: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  remarks: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  requestPayload: {
    type: Sequelize.JSON,
    allowNull: true,
  },
  responsePayload: {
    type: Sequelize.JSON,
    allowNull: true,
  },
  errorPayload: {
    type: Sequelize.JSON,
    allowNull: true,
  },
  corporateUserId: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  transactionDate: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
});

vaLoadUnloadTransaction.belongsTo(credential);

module.exports = vaLoadUnloadTransaction;
