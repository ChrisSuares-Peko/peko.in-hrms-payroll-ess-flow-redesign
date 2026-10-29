"use strict";

const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const paymentCollectionTransaction = sequelizeConfig.define(
  "paymentCollectionTransaction",
  {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    source: {
      type: Sequelize.ENUM("payment_link", "payment_qr", "enach_initiation"),
      allowNull: false,
    },
    sourceTxnId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    sourceParentId: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    },
    providerTxnId: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: Sequelize.ENUM("PENDING", "SUCCESS", "FAILED", "SETTLED", "CANCELLED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: Sequelize.STRING(3),
      allowNull: false,
      defaultValue: "INR",
    },
    customerName: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    },
    customerPhone: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    },
    linkUrl: {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    qrImageUrl: {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    reference: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    },
    purposeMessage: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
    },
    createdMilestoneAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    outcomeMilestoneAt: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    },
    settledMilestoneAt: {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    },
    timelineEvents: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    },
    rawPayload: {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    tableName: "paymentCollectionTransactions",
    timestamps: true,
  }
);

paymentCollectionTransaction.belongsTo(credential, { foreignKey: "credentialId" });

module.exports = paymentCollectionTransaction;
