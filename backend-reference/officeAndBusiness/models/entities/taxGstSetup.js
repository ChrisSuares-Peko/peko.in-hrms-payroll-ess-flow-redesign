"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");

const TaxGstSetup = sequelizeConfig.define("tax_gst_setup", {
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
    legalName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    tradeName: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    financialYear: {
        type: Sequelize.STRING(7),
        allowNull: false,
    },
    isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
});

module.exports = TaxGstSetup;
