"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const vendor = require("./vendor");

const vendorDeposits = sequelizeConfig.define("vendorDeposits", {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    entryNumber: {
        type: Sequelize.STRING(24),
        allowNull: false,
        unique: "vendorDeposits_entryNumber_unique",
    },
    amount: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0.0,
    },
    depositDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
    },
    reference: {
        type: Sequelize.STRING(40),
        allowNull: true,
    },
    entryType: {
        type: Sequelize.ENUM("DEPOSIT", "OPENING", "REVERSAL"),
        allowNull: false,
        defaultValue: "DEPOSIT",
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

vendorDeposits.belongsTo(vendor);

module.exports = vendorDeposits;
