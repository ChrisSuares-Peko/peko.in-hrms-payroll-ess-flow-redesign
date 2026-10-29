"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const bankAccount = sequelizeConfig.define("bankAccount", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  accountHolderName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  bankName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  accountNumber: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  ifscCode: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  currency: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: "INR",
  },
  accountType: {
    type: Sequelize.ENUM("SAVINGS", "CURRENT"),
    allowNull: false,
    defaultValue: "SAVINGS",
  },
  branchName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  isPrimary: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  status: {
    type: Sequelize.ENUM("ACTIVE", "INACTIVE"),
    defaultValue: "ACTIVE",
  },
});

bankAccount.belongsTo(credential);

module.exports = bankAccount;
