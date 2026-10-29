"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const TaxGstr1Document = sequelizeConfig.define("tax_gstr1_documents", {
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
    documentType: {
        type: Sequelize.STRING(100),
        allowNull: false,
    },
    serialFrom: {
        type: Sequelize.STRING(50),
        allowNull: true,
    },
    serialTo: {
        type: Sequelize.STRING(50),
        allowNull: true,
    },
    totalIssued: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    cancelled: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    netIssued: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
});

module.exports = TaxGstr1Document;
