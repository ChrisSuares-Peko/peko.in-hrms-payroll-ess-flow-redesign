"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const TaxImsSnapshot = sequelizeConfig.define("tax_ims_snapshots", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    corporateUserId: {
        type: Sequelize.BIGINT,
        allowNull: false,
    },
    gstin: {
        type: Sequelize.STRING(15),
        allowNull: false,
    },
    financialYear: {
        type: Sequelize.STRING(7),
        allowNull: false,
    },
    month: {
        type: Sequelize.TINYINT,
        allowNull: false,
    },
    refId: {
        type: Sequelize.STRING(20),
        allowNull: false,
    },
    totalInvoices: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    acceptedCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    pendingCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    rejectedCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    noactionCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    actionType: {
        type: Sequelize.ENUM('saved', 'reset'),
        defaultValue: 'saved',
    },
    status: {
        type: Sequelize.ENUM('Confirmed', 'Failed'),
        defaultValue: 'Confirmed',
    },
    portalResponse: {
        type: Sequelize.JSON,
        allowNull: true,
    },
});

module.exports = TaxImsSnapshot;
