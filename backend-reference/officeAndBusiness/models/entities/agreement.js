"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");
const InvoiceCustomerV2 = require("./invoiceCustomerV2");
const invoicingV2 = require("./invoicingV2");
const eSign = require("./eSign");

const agreement = sequelizeConfig.define("agreements", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    // FK to invoiceCustomerV2
    customerId: {
        type: Sequelize.BIGINT,
        allowNull: false,
    },

    // FK to invoicings (QUOTATION type, APPROVED status) — optional
    quotationId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
    },

    agreementNumber: {
        type: Sequelize.STRING,
        allowNull: false,
    },

    prefix: {
        type: Sequelize.STRING,
        allowNull: false,
    },

    title: {
        type: Sequelize.STRING,
        allowNull: false,
    },

    contractType: {
        type: Sequelize.STRING,
        allowNull: true,
    },

    currency: {
        type: Sequelize.STRING,
        allowNull: true,
    },

    paymentTerms: {
        type: Sequelize.STRING,
        allowNull: true,
    },

    billingFrequency: {
        type: Sequelize.STRING,
        allowNull: true,
    },

    contractValue: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00,
    },

    startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
    },

    // Optional — used to compute EXPIRING_SOON status
    endDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
    },

    description: {
        type: Sequelize.TEXT,
        allowNull: true,
    },

    specialTerms: {
        type: Sequelize.TEXT,
        allowNull: true,
    },

    documentUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null,
    },

    eSignId: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: null,
    },

    timeline: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
    },

    // DRAFT → SENT → SIGNED → ACTIVE → EXPIRING_SOON
    status: {
        type: Sequelize.ENUM("DRAFT", "PENDING", "SENT", "SIGNED", "ACTIVE", "EXPIRING_SOON"),
        allowNull: false,
        defaultValue: "DRAFT",
    },
});

agreement.belongsTo(corporateUser);
agreement.belongsTo(SubCorporateUser);
agreement.belongsTo(InvoiceCustomerV2, { foreignKey: "customerId" });
InvoiceCustomerV2.hasMany(agreement, { foreignKey: "customerId" });
agreement.belongsTo(invoicingV2, { foreignKey: "quotationId", as: "quotation" });
agreement.belongsTo(eSign, { foreignKey: "eSignId", as: "eSign" });

module.exports = agreement;
