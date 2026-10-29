"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const TaxGstr1Filing = sequelizeConfig.define("tax_gstr1_filings", {
    id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    corporateUserId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
    },
    gstin: {
        type: Sequelize.STRING(20),
        allowNull: false,
    },
    financialYear: {
        type: Sequelize.STRING(10),
        allowNull: false,
    },
    month: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    referenceId: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
    },
    chksum: {
        type: Sequelize.STRING(200),
        allowNull: true,
        defaultValue: null,
    },
    secSum: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
    retPeriod: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: null,
    },
    newSumFlag: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true,
    },
    ackNum: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
    },
    status: {
        type: Sequelize.ENUM('saved', 'filed'),
        allowNull: false,
        defaultValue: 'saved',
    },
    filedAt: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
    },
});

module.exports = TaxGstr1Filing;
