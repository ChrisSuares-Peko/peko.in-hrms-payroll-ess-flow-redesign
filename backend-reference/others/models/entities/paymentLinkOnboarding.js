"use strict";
const Sequelize = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential");

const paymentLinkOnboarding = sequelizeConfig.define("paymentLinkOnboarding", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    credentialId: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    status: {
        type: Sequelize.STRING(30),
        allowNull: true,
    },
    vendor: {
        type: Sequelize.STRING(20),
        allowNull: true,
    },
    activatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
    },
    accountingCharge: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
});

paymentLinkOnboarding.belongsTo(credential, { foreignKey: "credentialId" });

module.exports = paymentLinkOnboarding;
