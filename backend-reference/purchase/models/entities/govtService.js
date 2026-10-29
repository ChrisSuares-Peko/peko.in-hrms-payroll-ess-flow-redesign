"use strict";
const Sequelize = require("sequelize");
const sequelize = require("../../configs/database/index");

const govtService = sequelize.define("govtServices", {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
    accessKey: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: true,
    },
    category: {
        type: Sequelize.ENUM(
            "Tax & Compliance",
            "Licenses & Permits",
            "Certifications",
            "Trade Enablement",
            "Pharma & Drugs",
            "Pesticides",
            "Fertilizers",
            "Hospital & Healthcare",
            "Hotels & Hospitality",
            "Data Security",
            "Financial Services",
            "Telecom & IT",
            "Education",
            "Transport & Logistics",
            "Business Recognition",
            "Intellectual Property"
        ),
        allowNull: false,
    },
    tag: {
        type: Sequelize.ENUM("Mandatory", "Regulatory Dependent", "Good-to-have"),
        allowNull: false,
    },
    authority: {
        type: Sequelize.ENUM("Central", "State"),
        allowNull: true,
    },
    processingTime: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    govtFee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
});

module.exports = govtService;
