"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const payoutBeneficiary = sequelizeConfig.define("payoutBeneficiary", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  accountNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  ifscCode: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  bankName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  upiId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  mobile: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  // ACCOUNT_TRANSFER | UPI
  transferMode: {
    type: Sequelize.ENUM("ACCOUNT_TRANSFER", "UPI"),
    allowNull: false,
    defaultValue: "ACCOUNT_TRANSFER",
  },
  status: {
    type: Sequelize.ENUM("ACTIVE", "INACTIVE"),
    defaultValue: "ACTIVE",
  },
  // INDIVIDUAL | BUSINESS
  type: {
    type: Sequelize.ENUM("INDIVIDUAL", "BUSINESS"),
    allowNull: false,
    defaultValue: "INDIVIDUAL",
  },
  panNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  address: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  branchName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  decentroBeneficiaryId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  paymentCategory: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

payoutBeneficiary.belongsTo(credential);

module.exports = payoutBeneficiary;
