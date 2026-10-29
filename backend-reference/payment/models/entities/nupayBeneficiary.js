"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const nupayBeneficiary = sequelizeConfig.define("nupayBeneficiary", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  corporateId: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  beneficiaryType: {
    type: Sequelize.ENUM("INDIVIDUAL", "BUSINESS"),
    allowNull: false,
    defaultValue: "INDIVIDUAL",
  },
  paymentCategory: {
    type: Sequelize.ENUM("RENT", "VENDOR_PAYMENT", "SALARY", "OTHER"),
    allowNull: true,
  },
  fullName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  phoneNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  accountNumber: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  ifscCode: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  bankName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  branchName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  upiId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  pan: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  address: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  verificationStatus: {
    type: Sequelize.ENUM("PENDING", "VERIFIED", "FAILED"),
    defaultValue: "PENDING",
  },
  verifiedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
});

module.exports = nupayBeneficiary;
