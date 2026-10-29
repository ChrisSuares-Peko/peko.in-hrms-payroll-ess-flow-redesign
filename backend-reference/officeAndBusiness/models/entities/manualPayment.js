"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const invoicingV2 = require("./invoicingV2");

const manualPayment = sequelizeConfig.define("manualPayment", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    receiptNo: {
        type: Sequelize.STRING,
        allowNull: true,
    },

    // FK to invoicings table
    invoiceId: {
        type: Sequelize.BIGINT,
        allowNull: false,
    },

    // INR-equivalent for a foreign-currency invoice; originalAmount below preserves
    // what was actually entered/paid.
    amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
    },

    originalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
    },

    // Cash | Cheque | Bank Transfer | UPI | etc.
    paymentMethod: {
        type: Sequelize.STRING,
        allowNull: false,
    },

    paymentDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
    },

    // Optional reference number (cheque no, UTR, etc.)
    referenceId: {
        type: Sequelize.STRING,
        allowNull: true,
    },

    notes: {
        type: Sequelize.TEXT,
        allowNull: true,
    },

    isDeleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
});

manualPayment.belongsTo(invoicingV2, { foreignKey: "invoiceId" });
manualPayment.belongsTo(corporateUser);

module.exports = manualPayment;
