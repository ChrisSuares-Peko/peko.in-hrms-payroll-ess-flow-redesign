"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const TaxImsReconciliation = sequelizeConfig.define("tax_ims_reconciliations", {
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
    reconciliationCriteria: {
        type: Sequelize.ENUM("strict", "moderate", "flexible"),
        defaultValue: "strict",
    },
    sandboxJobId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    status: {
        type: Sequelize.ENUM("pending", "created", "queued", "in_progress", "succeeded", "failed"),
        defaultValue: "pending",
    },
    gstr2aUploadUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    purchaseLedgerUploadUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    reconciliationReportUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    validationReportUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    resultData: {
        type: Sequelize.JSON,
        allowNull: true,
    },
});

module.exports = TaxImsReconciliation;
