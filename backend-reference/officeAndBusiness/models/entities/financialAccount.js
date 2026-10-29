"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");

// A bank / financial account the corporate owns (e.g. "HDFC Current A/C").
// Transactions reference it via accountingTransactions.bankAccountId, and a
// bank-statement import is scoped to one account.
const financialAccount = sequelizeConfig.define(
    "financialAccounts",
    {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        accountName: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        accountNumber: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        bankName: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        ifscCode: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        accountType: {
            type: Sequelize.ENUM("Current", "Savings", "Other"),
            allowNull: false,
            defaultValue: "Other",
        },
        currency: {
            type: Sequelize.STRING(3),
            allowNull: false,
            defaultValue: "INR",
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        paranoid: true,
        indexes: [{ fields: ["corporateUserId"] }],
    }
);

financialAccount.belongsTo(corporateUser);
financialAccount.belongsTo(SubCorporateUser);

module.exports = financialAccount;
