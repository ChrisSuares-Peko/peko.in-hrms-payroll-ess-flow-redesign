"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const TaxAmendment = sequelizeConfig.define("tax_amendments", {
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
    amendType: {
        type: Sequelize.ENUM('B2BA', 'B2CLA', 'B2CSA', 'CDNRA', 'CDNURA', 'EXPA'),
        allowNull: false,
    },
    origInvNo: {
        type: Sequelize.STRING(50),
        allowNull: false,
    },
    origPeriod: {
        type: Sequelize.STRING(6),
        allowNull: false,
    },
    receiverGstin: {
        type: Sequelize.STRING(15),
        allowNull: true,
    },
    receiverName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    placeOfSupply: {
        type: Sequelize.STRING(50),
        allowNull: true,
    },
    noteType: {
        type: Sequelize.ENUM('C', 'D'),
        allowNull: true,
    },
    portCode: {
        type: Sequelize.STRING(10),
        allowNull: true,
    },
    shippingBillNo: {
        type: Sequelize.STRING(50),
        allowNull: true,
    },
    shippingBillDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
    },
    revisedInvNo: {
        type: Sequelize.STRING(50),
        allowNull: true,
    },
    revisedDate: {
        type: Sequelize.DATEONLY,
        allowNull: true,
    },
    taxableAmount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
    },
    igst: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
    },
    cgst: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
    },
    sgst: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
    },
    totalTax: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
    },
    status: {
        type: Sequelize.ENUM('pending', 'filed'),
        defaultValue: 'pending',
    },
});

module.exports = TaxAmendment;
