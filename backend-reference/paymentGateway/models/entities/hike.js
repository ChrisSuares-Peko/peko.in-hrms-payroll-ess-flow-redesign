"use strict";
const Sequelize = require("sequelize");
const sequelize = require("../../configs/database/index");
const credential = require("./credential");

const hike = sequelize.define("hike", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: Sequelize.STRING,
    features: Sequelize.TEXT,
    logo: Sequelize.STRING,
    partners: Sequelize.STRING,
    planType: Sequelize.STRING, // MONTHLY, YEARLY
    amount: Sequelize.DECIMAL(10, 2),
    salaryAmount: Sequelize.DECIMAL(10, 2),
    salaryValidation: Sequelize.STRING, // LESS_THAN, GREATER_THAN
    commissionMode: {
        type: Sequelize.ENUM("MARGIN", "AGENT_MARKUP", "PRINCIPAL_MARKUP"),
        defaultValue: "MARGIN",
        allowNull: true,
    },
    commissionType: {
        type: Sequelize.ENUM("PERCENTAGE", "FLAT"),
        defaultValue: "PERCENTAGE",
        allowNull: true,
    },
    commission: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0.0,
        allowNull: true,
    },
    fixedCommissionPerTransaction: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0.0,
        allowNull: true,
    },
    isCommissionInclGST: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: true,
    },
    isCommissionConfigured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
});

hike.belongsTo(credential);

module.exports = hike;