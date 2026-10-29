"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const transactionLedger = sequelizeConfig.define("transaction_ledger", {
  id: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },

  // Unique transaction identifier (VERY IMPORTANT for webhook safety)
  transactionId: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true,
  },

  // CREDIT = incoming money (payment links)
  // DEBIT = outgoing money (payouts)
  type: {
    type: Sequelize.ENUM("CREDIT", "DEBIT"),
    allowNull: false,
  },

  amount: {
    type: Sequelize.DECIMAL(12, 2),
    allowNull: false,
  },

  // Source of transaction
  source: {
    type: Sequelize.ENUM("PAYMENT_LINK", "PAYOUT","PAYMENT_QR","ENACH_EXEC","SETTLEMENT_PAYMENT_LINK","SETTLEMENT_PAYMENT_QR","SETTLEMENT_ENACH_EXEC","VA_LOAD","VA_UNLOAD"),
    allowNull: false,
  },

  status: {
    type: Sequelize.ENUM("PENDING", "SUCCESS", "FAILED"),
    defaultValue: "PENDING",
  },

  // External reference (Decentro txn id / internal ref)
  referenceId: {
    type: Sequelize.STRING,
    allowNull: true,
  },

  // Link to payout transaction (nullable)
  payoutTransactionId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },

  // Link to payment link (nullable for future use)
  paymentLinkId: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },

  // Balance after transaction (useful for audit/debugging)
  balanceAfter: {
    type: Sequelize.DECIMAL(12, 2),
    defaultValue: 0.0,
  },

  // Full webhook / API payload storage
  metadata: {
    type: Sequelize.JSON,
    allowNull: true,
  },

  remarks: {
    type: Sequelize.STRING,
    allowNull: true,
  },

  // Owner of this ledger entry — needed for per-user balance queries
  credentialId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },

}, {
  timestamps: true,
});

transactionLedger.belongsTo(credential, { foreignKey: "credentialId" });

module.exports = transactionLedger;