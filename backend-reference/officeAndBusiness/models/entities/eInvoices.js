"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");
const eWaybill = require("./eWaybill");

const eInvoices = sequelizeConfig.define("eInvoices", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    // IRN result fields from Alankit
    irn: {
        type: Sequelize.STRING(64),
        allowNull: true,
        unique: true,
    },
    ackNo: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    ackDt: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    signedInvoice: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    signedQRCode: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    // Transaction details (step 1)
    supplyType: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    docType: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    prefix: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    docNo: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    docDate: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    reverseCharge: {
        type: Sequelize.STRING(1),
        allowNull: true,
    },
    igstOnIntraState: {
        type: Sequelize.STRING(1),
        allowNull: true,
    },
    // Seller details (step 2)
    sellerGstin: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    sellerDetails: {
        type: Sequelize.JSON,
        allowNull: true,
    },
    // Buyer details (step 3)
    buyerGstin: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    buyerDetails: {
        type: Sequelize.JSON,
        allowNull: true,
    },
    placeOfSupply: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    // Line items (step 4)
    lineItems: {
        type: Sequelize.JSON,
        defaultValue: [],
    },
    totalTaxableValue: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.0,
    },
    totalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.0,
    },
    status: {
        type: Sequelize.ENUM("ACTIVE", "CANCELLED"),
        defaultValue: "ACTIVE",
    },
    cancelledDate: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    cancelReason: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    cancelRemark: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    eWaybillId: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
});

eInvoices.belongsTo(corporateUser);
eInvoices.belongsTo(SubCorporateUser);
eInvoices.belongsTo(eWaybill, { foreignKey: 'eWaybillId', as: 'eWaybill' });

module.exports = eInvoices;
