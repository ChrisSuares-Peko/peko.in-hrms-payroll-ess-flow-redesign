"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");
const payoutBeneficiary = require("./payoutBeneficiary");

const payoutTransaction = sequelizeConfig.define("payoutTransaction", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  // Category matching the UI: BILL_PAYOUT | RENT | VENDOR_PAYMENT | OTHER
  category: {
    type: Sequelize.ENUM("BILL_PAYOUT", "RENT", "VENDOR_PAYMENT", "OTHER"),
    allowNull: false,
  },
  amount: {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
  },
  payeeName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  remarks: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.ENUM("PENDING", "COMPLETED", "FAILED"),
    defaultValue: "PENDING",
  },
  referenceId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  // Decentro's transaction reference ID returned after initiating payout
  decentroTxnId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  transactionDate: {
    type: Sequelize.DATE,
    defaultValue: Sequelize.NOW,
  },
  bankReferenceNumber: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  providerMessage: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  transferType: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  transactionAmount: {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: true,
  },
  beneficiaryName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  callbackTxnId: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  callbackTimestamp: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  attempt: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
});

payoutTransaction.belongsTo(credential);
payoutTransaction.belongsTo(payoutBeneficiary);

module.exports = payoutTransaction;
