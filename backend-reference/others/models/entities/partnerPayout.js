"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const partnerPayouts = sequelizeConfig.define("partnerPayouts", {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    entryNumber: {
        type: Sequelize.STRING(24),
        allowNull: false,
        unique: "partnerPayouts_entryNumber_unique",
    },
    // What the ledger worked out was owed when the drawer was opened, kept beside what was
    // actually paid so a difference stays visible instead of disappearing into the balance.
    calculatedAmount: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true,
    },
    amount: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0.0,
    },
    payoutDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
    },
    // OPENING is the position carried in from before the portal started recording. It sits
    // on the opposite side from a payout, so it is its own kind rather than a payout with a
    // flag, and entryType stays free to mean only "is this the entry or its reversal".
    entryKind: {
        type: Sequelize.ENUM("PAYOUT", "OPENING"),
        allowNull: false,
        defaultValue: "PAYOUT",
    },
    reference: {
        type: Sequelize.STRING(40),
        allowNull: true,
    },
    entryType: {
        type: Sequelize.ENUM("PAYOUT", "REVERSAL"),
        allowNull: false,
        defaultValue: "PAYOUT",
    },
    reversesId: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    mode: {
        type: Sequelize.ENUM("NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"),
        allowNull: false,
        defaultValue: "NEFT",
    },
    note: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    status: {
        type: Sequelize.ENUM("ACTIVE", "VOIDED"),
        allowNull: false,
        defaultValue: "ACTIVE",
    },
    slipKey: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    slipName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    slipFormat: {
        type: Sequelize.STRING(10),
        allowNull: true,
    },
    recordedById: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    recordedByName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    ipAddress: {
        type: Sequelize.STRING(64),
        allowNull: true,
    },
    voidedById: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    voidedByName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    voidedAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    voidReason: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    booksSynced: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    booksSyncedAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    booksSyncedById: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    booksSyncedByName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    deletedById: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    deletedByName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    deleteReason: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
}, { paranoid: true });

// A partner is identified by its own credential, the same id customers carry in
// credentials.registeredBy and packages carry in partnerId.
partnerPayouts.belongsTo(credential, { foreignKey: "partnerCredentialId" });

module.exports = partnerPayouts;
