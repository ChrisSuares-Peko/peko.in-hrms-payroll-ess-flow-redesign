"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const TaxGstr3bFiling = sequelizeConfig.define("tax_gstr3b_filings", {
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
    retPeriod: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: null,
    },
    formData: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
    autoLiability: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
    status: {
        type: Sequelize.ENUM('draft', 'saved', 'validated', 'filed'),
        allowNull: false,
        defaultValue: 'draft',
    },
    ackNum: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
    },
    filedAt: {
        type: Sequelize.DATEONLY,
        allowNull: true,
        defaultValue: null,
    },
});

module.exports = TaxGstr3bFiling;
