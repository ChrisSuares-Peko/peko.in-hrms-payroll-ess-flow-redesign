"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const paymentGatewaySettlements = sequelizeConfig.define("paymentGatewaySettlements", {
    id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
    entryNumber: {
        type: Sequelize.STRING(24),
        allowNull: false,
        unique: "paymentGatewaySettlements_entryNumber_unique",
    },
    // A gateway is its chart-of-accounts row, so the account the journal debited is the
    // identity. There is no gateway master table to point at.
    gatewayAccountId: { type: Sequelize.STRING(64), allowNull: false },
    // Both legs of one settlement carry the receipt's id, so reversing the receipt can find
    // the fee that only existed because of it.
    settlementId: { type: Sequelize.BIGINT, allowNull: true },
    // OPENING is the position carried in from before the portal started recording. It sits
    // on the opposite side from a receipt, so it is its own kind rather than a receipt with
    // a flag, and entryType stays free to mean only "is this the entry or its reversal".
    entryKind: {
        type: Sequelize.ENUM("RECEIPT", "FEE", "OPENING"),
        allowNull: false,
        defaultValue: "RECEIPT",
    },
    entryType: {
        type: Sequelize.ENUM("ENTRY", "REVERSAL"),
        allowNull: false,
        defaultValue: "ENTRY",
    },
    // What the ledger said was outstanding when the drawer was opened, kept beside what
    // actually arrived so the fee it implies stays explainable.
    expectedAmount: { type: Sequelize.DECIMAL(12, 4), allowNull: true },
    amount: { type: Sequelize.DECIMAL(12, 4), allowNull: false, defaultValue: 0.0 },
    entryDate: { type: Sequelize.DATEONLY, allowNull: false },
    reference: { type: Sequelize.STRING(40), allowNull: true },
    mode: {
        type: Sequelize.ENUM("NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"),
        allowNull: false,
        defaultValue: "NEFT",
    },
    note: { type: Sequelize.TEXT, allowNull: true },
    status: {
        type: Sequelize.ENUM("ACTIVE", "VOIDED"),
        allowNull: false,
        defaultValue: "ACTIVE",
    },
    reversesId: { type: Sequelize.BIGINT, allowNull: true },
    slipKey: { type: Sequelize.TEXT, allowNull: true },
    slipName: { type: Sequelize.STRING, allowNull: true },
    slipFormat: { type: Sequelize.STRING(10), allowNull: true },
    recordedById: { type: Sequelize.BIGINT, allowNull: true },
    recordedByName: { type: Sequelize.STRING, allowNull: true },
    ipAddress: { type: Sequelize.STRING(64), allowNull: true },
    voidedById: { type: Sequelize.BIGINT, allowNull: true },
    voidedByName: { type: Sequelize.STRING, allowNull: true },
    voidedAt: { type: Sequelize.DATE, allowNull: true },
    voidReason: { type: Sequelize.TEXT, allowNull: true },
    booksSynced: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    booksSyncedAt: { type: Sequelize.DATE, allowNull: true },
    booksSyncedById: { type: Sequelize.BIGINT, allowNull: true },
    booksSyncedByName: { type: Sequelize.STRING, allowNull: true },
    deletedAt: { type: Sequelize.DATE, allowNull: true },
    deletedById: { type: Sequelize.BIGINT, allowNull: true },
    deletedByName: { type: Sequelize.STRING, allowNull: true },
    deleteReason: { type: Sequelize.TEXT, allowNull: true },
}, { paranoid: true });

module.exports = paymentGatewaySettlements;
