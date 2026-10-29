const { DataTypes } = require("sequelize");
const sequelize = require("../../configs/database/index");

/**
 * SettlementRecord schema
 * Records each settlement attempt/disbursal made for payment links.
 *
 * Reference: see usage in services/paymentLinks.js
 * Fields to capture: paymentLinkId, amount, transferType, referenceId,
 * beneficiary details, decentroTxnId, txnStatus, error, settledAt, etc.
 */
const SettlementRecord = sequelize.define(
  "SettlementRecord",
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    paymentLinkId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    credentialId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    transferType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "IMPS",
    },
    referenceId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    decentroTxnId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    txnStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    beneficiaryName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    beneficiaryAccountNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    beneficiaryIfsc: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    settledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    meta: {
      type: DataTypes.JSON,
      allowNull: true,
    }
  },
  {
    tableName: "settlement_records",
    underscored: true,
    timestamps: true, // adds created_at, updated_at
    indexes: [
      { fields: ["payment_link_id"] },
      { fields: ["reference_id"], unique: true }
    ],
  }
);

module.exports = SettlementRecord;