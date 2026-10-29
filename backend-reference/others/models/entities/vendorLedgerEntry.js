"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const vendor = require("./vendor");

const vendorLedgerEntries = sequelizeConfig.define("vendorLedgerEntries", {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    entryNumber: {
        type: Sequelize.STRING(24),
        allowNull: false,
        unique: "vendorLedgerEntries_entryNumber_unique",
    },
    kind: {
        type: Sequelize.ENUM("CREDIT_NOTE", "COMMISSION", "COST_OF_SALES", "DEBIT_NOTE"),
        allowNull: false,
        defaultValue: "CREDIT_NOTE",
    },
    reference: {
        type: Sequelize.STRING(40),
        allowNull: false,
    },
    amount: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0.0,
    },
    gstInclusive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    gstRate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
    },
    taxableAmount: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true,
    },
    gstAmount: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true,
    },
    issueDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
    },
    reason: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    againstCorporateTxnId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    status: {
        type: Sequelize.ENUM("OPEN", "VOIDED"),
        allowNull: false,
        defaultValue: "OPEN",
    },
    entryType: {
        type: Sequelize.ENUM("ENTRY", "REVERSAL"),
        allowNull: false,
        defaultValue: "ENTRY",
    },
    reversesId: {
        type: Sequelize.BIGINT,
        allowNull: true,
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
    documentEdits: {
        type: Sequelize.JSON,
        defaultValue: null,
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

vendorLedgerEntries.belongsTo(vendor);

module.exports = vendorLedgerEntries;
