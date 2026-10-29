"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const TaxImsInvoice = sequelizeConfig.define("tax_ims_invoices", {
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
    supplierGstin: {
        type: Sequelize.STRING(15),
        allowNull: true,
    },
    supplierName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    invoiceNo: {
        type: Sequelize.STRING(50),
        allowNull: true,
    },
    invoiceDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
    },
    invoiceType: {
        type: Sequelize.STRING(10),
        allowNull: true,
    },
    taxableAmount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00,
    },
    igst: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00,
    },
    cgst: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00,
    },
    sgst: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00,
    },
    totalTax: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00,
    },
    imsAction: {
        type: Sequelize.ENUM("noaction", "pending", "accepted", "rejected"),
        defaultValue: "noaction",
    },
    isAutoAccepted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    rawData: {
        type: Sequelize.JSON,
        allowNull: true,
    },
});

module.exports = TaxImsInvoice;
