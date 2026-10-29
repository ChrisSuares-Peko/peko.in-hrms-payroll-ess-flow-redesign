"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const paymentLinkOnboarding = sequelizeConfig.define("paymentLinkOnboarding", {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  credentialId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  status: {
    type: Sequelize.ENUM("pending", "active", "suspended", "rejected", "approval-pending", "on_hold"),
    defaultValue: "pending",
  },
  vendor: {
    type: Sequelize.STRING(20),
    allowNull: true,
    defaultValue: "decentro",
  },
  entityType: {
    type: Sequelize.STRING(30),
    allowNull: true,
  },
  nupayRefNo: {
    type: Sequelize.STRING(50),
    allowNull: true,
  },
  onboardingClientReferenceId: {
    type: Sequelize.STRING(50),
    allowNull: true,
  },
  credentialsLink: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  nupayAccessKey: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  nupayAccessSecret: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  nupayProviderId: {
    type: Sequelize.STRING(50),
    allowNull: true,
  },
  credentialsFetchedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  businessName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  bankName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  accountNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  ifsc: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  accountHolderName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  virtualAccountId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  virtualAccountNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  virtualIfsc: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  providerResponse: {
    type: Sequelize.JSON,
    defaultValue: {},
  },
  bankVerificationResponse: {
    type: Sequelize.JSON,
    defaultValue: {},
  },
  consentAcceptedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  activatedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  remarks: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  pan: {
    type: Sequelize.STRING(10),
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  address: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  panVerifiedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  bankVerifiedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  accountingCharge: {
    type: Sequelize.JSON,
    allowNull: true,
    defaultValue: null,
  },
});

paymentLinkOnboarding.belongsTo(credential, { foreignKey: "credentialId" });

module.exports = paymentLinkOnboarding;
