"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");
const financialAccount = require("./financialAccount");

// A bank-statement upload batch: groups the transactions parsed from one file,
// holds a file hash for dedupe and a parse/quality summary. Imported rows
// reference it via accountingTransactions.importBatchId.
const bankStatementImport = sequelizeConfig.define(
    "bankStatementImports",
    {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        fileName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        mimeType: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        // Hash of the file contents — detects re-uploading the same statement.
        fileHash: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        statementStartDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
            defaultValue: null,
        },
        statementEndDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
            defaultValue: null,
        },
        totalRows: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        qualityScore: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        status: {
            type: Sequelize.ENUM("draft", "imported", "rejected"),
            allowNull: false,
            defaultValue: "draft",
        },
        uploadedBy: {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        paranoid: true,
        indexes: [{ fields: ["corporateUserId"] }, { fields: ["financialAccountId"] }],
    }
);

bankStatementImport.belongsTo(corporateUser);
bankStatementImport.belongsTo(SubCorporateUser);
bankStatementImport.belongsTo(financialAccount, { foreignKey: "financialAccountId" });

module.exports = bankStatementImport;
