"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const journalAdjustments = sequelizeConfig.define(
    "journalAdjustments",
    {
        id: {
            type: Sequelize.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        corporateTxnId: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        journalKey: {
            type: Sequelize.STRING(32),
            allowNull: false,
        },
        action: {
            type: Sequelize.ENUM("RECORDED"),
            allowNull: false,
        },
        journalDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        reason: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        splitBefore: {
            type: Sequelize.JSON,
            allowNull: true,
        },
        splitAfter: {
            type: Sequelize.JSON,
            allowNull: true,
        },
        lineItemsBefore: {
            type: Sequelize.JSON,
            allowNull: true,
        },
        lineItemsAfter: {
            type: Sequelize.JSON,
            allowNull: true,
        },
        providerJournalId: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        result: {
            type: Sequelize.ENUM("POSTED", "FAILED"),
            allowNull: false,
        },
        failureReason: {
            type: Sequelize.TEXT,
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
    },
    {
        indexes: [{ fields: ["corporateTxnId", "journalKey"], name: "journalAdjustments_txn_key" }],
    }
);

module.exports = journalAdjustments;
