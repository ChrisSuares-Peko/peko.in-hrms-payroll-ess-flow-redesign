"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const TaxImsSaveHistory = sequelizeConfig.define("tax_ims_save_history", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    corporateUserId: {
        type: Sequelize.BIGINT,
        allowNull: false,
    },
    reconciliationId: {
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
    action: {
        type: Sequelize.ENUM("save", "reset"),
        allowNull: false,
    },
    invoiceCount: {
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
    referenceId: {
        type: Sequelize.STRING(20),
        allowNull: false,
    },
    status: {
        type: Sequelize.ENUM("confirmed", "failed"),
        defaultValue: "confirmed",
    },
});

module.exports = TaxImsSaveHistory;
