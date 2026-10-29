"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");
const transactionLink = require("./transactionLink");
const transactionDocument = require("./transactionDocument");
const financialAccount = require("./financialAccount");

// The accounting transactions ledger. Rows enter three ways (the `account`
// field): 'Bank' (bank statement import), 'Upload' (other transaction report
// import) or 'Manual' (added by hand). Imported rows reference their batch via
// importId (reserved for the deferred import feature).
const accountingTransaction = sequelizeConfig.define(
    "accountingTransactions",
    {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        // Entry method / origin of the row.
        account: {
            type: Sequelize.ENUM("Bank", "Upload", "Manual"),
            allowNull: false,
            defaultValue: "Manual",
        },
        // Reserved: links an imported row to its import batch (Bank/Upload).
        importId: {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
        },
        // The bank-statement import batch this row came from (set by the importer).
        importBatchId: {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
        },
        // Hash of the source statement row — dedupe across re-imports.
        rawHash: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        txnDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
        },
        description: {
            type: Sequelize.STRING(512),
            allowNull: false,
        },
        // Magnitude only (>= 0); direction is carried by `type`.
        amount: {
            type: Sequelize.DECIMAL(14, 2),
            allowNull: false,
        },
        type: {
            type: Sequelize.ENUM("Income", "Expense"),
            allowNull: false,
        },
        currency: {
            type: Sequelize.STRING(3),
            allowNull: false,
            defaultValue: "INR",
        },
        category: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        isRecurring: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        isHidden: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        // null => "Needs Review"; set when the user reviews/accepts the row.
        reviewedAt: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null,
        },
        note: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        paranoid: true,
        indexes: [
            { fields: ["corporateUserId", "txnDate"] },
            { fields: ["corporateUserId", "type"] },
            { fields: ["corporateUserId", "account"] },
            { fields: ["corporateUserId", "category"] },
            { fields: ["corporateUserId", "isHidden"] },
            { fields: ["corporateUserId", "isRecurring"] },
            { fields: ["corporateUserId", "reviewedAt"] },
            { fields: ["corporateUserId", "bankAccountId"] },
        ],
    }
);

accountingTransaction.belongsTo(corporateUser);
accountingTransaction.belongsTo(SubCorporateUser);
// The bank/financial account this row belongs to (adds the bankAccountId column).
accountingTransaction.belongsTo(financialAccount, {
    foreignKey: "bankAccountId",
    as: "financialAccount",
});

// Associations defined here (parent requires children) to avoid circular requires.
accountingTransaction.hasMany(transactionLink, {
    foreignKey: "accountingTransactionId",
    as: "links",
});
transactionLink.belongsTo(accountingTransaction, { foreignKey: "accountingTransactionId" });

accountingTransaction.hasMany(transactionDocument, {
    foreignKey: "accountingTransactionId",
    as: "documents",
    onDelete: "CASCADE",
    hooks: true,
});
transactionDocument.belongsTo(accountingTransaction, { foreignKey: "accountingTransactionId" });

module.exports = accountingTransaction;
