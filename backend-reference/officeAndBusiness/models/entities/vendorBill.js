"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");

// Vendor bills (accounts payable). The ledger has no purchase/bill data
// (invoicingV2 is sales-only), so bills are stored here; the accounts-payable report
// derives outstanding, status, aging, distribution, trend and payment metrics from them.
const vendorBill = sequelizeConfig.define(
    "vendorBills",
    {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        vendor: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        billNo: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        },
        billDate: {
            type: Sequelize.DATEONLY,
            allowNull: false,
        },
        dueDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
            defaultValue: null,
        },
        amount: {
            type: Sequelize.DECIMAL(14, 2),
            allowNull: false,
            defaultValue: 0,
        },
        paid: {
            type: Sequelize.DECIMAL(14, 2),
            allowNull: false,
            defaultValue: 0,
        },
        paidDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
            defaultValue: null,
        },
        note: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        paranoid: true,
        indexes: [
            { fields: ["corporateUserId"] },
            { fields: ["corporateUserId", "billDate"] },
            { fields: ["corporateUserId", "dueDate"] },
        ],
    }
);

vendorBill.belongsTo(corporateUser);
vendorBill.belongsTo(SubCorporateUser);

module.exports = vendorBill;
