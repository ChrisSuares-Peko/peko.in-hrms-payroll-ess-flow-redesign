"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const nupayMerchantOnboarding = sequelizeConfig.define("nupayMerchantOnboarding", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  corporateId: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  mid: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  nupayRefNo: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.ENUM("PENDING", "SUCCESS", "FAILED", "ON_HOLD"),
    defaultValue: "PENDING",
  },
  credentialsLink: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  productType: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: "payout",
  },
  onboardedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  merchantName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  contactNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  officialEmail: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  city: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  state: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  pincode: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  encryptedAccessKey: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  encryptedAccessSecret: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  providerId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  walletAccountId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  vaNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  vaIfsc: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  rejectionReason: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
});

module.exports = nupayMerchantOnboarding;
