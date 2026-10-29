"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const TaxSalesInvoice = sequelizeConfig.define("tax_sales_invoices", {
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
    invoiceType: {
        type: Sequelize.ENUM("B2B", "B2C", "EXPORT", "NIL", "CDN", "B2C_SMALL", "CDNR", "CDNUR", "ADVANCE"),
        defaultValue: "B2B",
    },
    invoiceNo: {
        type: Sequelize.STRING(50),
        allowNull: false,
    },
    invoiceDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
    },
    hsnCode: {
        type: Sequelize.STRING(8),
        allowNull: true,
    },
    placeOfSupply: {
        type: Sequelize.STRING(100),
        allowNull: true,
    },
    uqc: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: 'OTH',
    },
    qty: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: true,
        defaultValue: 0,
    },
    buyerGstin: {
        type: Sequelize.STRING(15),
        allowNull: true,
    },
    buyerName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    portCode: {
        type: Sequelize.STRING(10),
        allowNull: true,
    },
    shippingBillNo: {
        type: Sequelize.STRING(20),
        allowNull: true,
    },
    shippingBillDate: {
        type: Sequelize.DATEONLY,
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
    status: {
        type: Sequelize.ENUM("uploaded", "missing_fields", "filed"),
        defaultValue: "uploaded",
    },
    source: {
        type: Sequelize.ENUM("peko", "manual"),
        allowNull: false,
        defaultValue: "manual",
    },
});

module.exports = TaxSalesInvoice;
