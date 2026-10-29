"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const settlementRequest = sequelizeConfig.define(
  "settlement_request",
  {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    credentialId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
    transferType: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "IMPS",
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
      type: Sequelize.ENUM("PENDING", "SUCCESS", "FAILED"),
      defaultValue: "PENDING",
    },
    beneficiaryName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    beneficiaryAccountNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    beneficiaryIfsc: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    settledAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    metadata: {
      type: Sequelize.JSON,
      allowNull: true,
    },
  },
  {
    tableName: "settlement_requests",
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ["credential_id"] },
      { fields: ["reference_id"], unique: true },
    ],
  }
);

settlementRequest.belongsTo(credential, { foreignKey: "credentialId" });

module.exports = settlementRequest;
