"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const TaxGstr1HsnManual = sequelizeConfig.define("tax_gstr1_hsn_manual", {
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
    hsnCode: {
        type: Sequelize.STRING(8),
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING(255),
        allowNull: true,
    },
    uqc: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: 'OTH',
    },
    qty: {
        type: Sequelize.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 0,
    },
    taxableAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    },
    rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    },
    igst: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    },
    cgst: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    },
    sgst: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    },
    totalTax: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    },
    source: {
        type: Sequelize.ENUM('invoice', 'manual'),
        allowNull: false,
        defaultValue: 'manual',
    },
    deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
    },
}, {
    paranoid: true,
    deletedAt: 'deletedAt',
});

module.exports = TaxGstr1HsnManual;
