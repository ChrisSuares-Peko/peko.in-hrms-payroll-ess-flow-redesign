"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser");
const SubCorporateUser = require("./subCorporateUsers");

const invoiceCatalog = sequelizeConfig.define("invoiceCatalog", {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    name: {
        type: Sequelize.STRING(100),
        allowNull: false,
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    hsnCode: {
        type: Sequelize.STRING(8),
        allowNull: true,
    },
    unitPrice: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    gstPercent: {
        type: Sequelize.STRING(5),
        allowNull: true,
        defaultValue: '5',
    },
});

invoiceCatalog.belongsTo(corporateUser);
invoiceCatalog.belongsTo(SubCorporateUser);

module.exports = invoiceCatalog;
