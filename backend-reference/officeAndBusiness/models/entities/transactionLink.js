"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

// Polymorphic link between a bank transaction and an invoice/bill.
// targetType selects the table the targetId points at (INVOICING = invoicings V2).
const transactionLink = sequelizeConfig.define(
    "transactionLinks",
    {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        corporateUserId: {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
        },
        accountingTransactionId: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
        targetType: {
            type: Sequelize.ENUM("INVOICING", "INVOICE", "BILL"),
            allowNull: false,
        },
        targetId: {
            type: Sequelize.BIGINT,
            allowNull: false,
        },
        amountApplied: {
            type: Sequelize.DECIMAL(14, 2),
            allowNull: true,
            defaultValue: null,
        },
        linkedBy: {
            type: Sequelize.BIGINT,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        indexes: [
            // Explicit name: the auto-generated name (table + all 3 columns, snake-cased) is
            // 65 chars and exceeds MySQL's 64-char identifier limit, which aborts sync/addIndex.
            {
                unique: true,
                fields: ["accountingTransactionId", "targetType", "targetId"],
                name: "transaction_links_txn_target_unique",
            },
            { fields: ["targetType", "targetId"] },
            { fields: ["corporateUserId"] },
        ],
    }
);

module.exports = transactionLink;
