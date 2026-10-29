"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");

// One row per corporate user.
// documentNumberPrefix is an array of { type, prefix }:
// [
//   { type: "INVOICE",     prefix: "INV" },
//   { type: "SALES_ORDER", prefix: "SO"  },
//   { type: "QUOTATION",   prefix: "QUO" },
//   { type: "AGREEMENT",   prefix: "AGR" },
// ]

const invoiceSettingsV2 = sequelizeConfig.define("invoiceSettingsV2", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    corporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
    },

    // Uploaded assets stored in S3
    signatureUrl: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
    },

    // Global document settings (shared across all document types)
    autoUpdateDocumentNumber: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    termsAndConditions: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
    },

    // Per-document-type prefix: [{ type, prefix }]
    documentNumberPrefix: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
    },
    automaticReminders: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
});

invoiceSettingsV2.belongsTo(corporateUser);

module.exports = invoiceSettingsV2;
 