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
    type: Sequelize.ENUM("pending", "active", "suspended", "rejected"),
    defaultValue: "pending",
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
  panVerifiedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  bankVerifiedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },
});

paymentLinkOnboarding.belongsTo(credential, { foreignKey: "credentialId" });

module.exports = paymentLinkOnboarding;
