'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require('../../configs/database/index');

// Admin-managed Car Report pricing — one row per sellable product (valuation, history,
// one per inspection package). `vendorProductCode` is Droom's SKU for the eco-order
// booking; an inspection row without one cannot be dispatched.
const carReportPlan = sequelizeConfig.define('carReportPlan', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    reportType: {
        type: Sequelize.STRING(20),
        allowNull: false,
    },
    packageId: {
        type: Sequelize.STRING(40),
        allowNull: true,
    },
    displayName: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
    },
    vendorProductCode: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    sortOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    commissionMode: {
        type: Sequelize.ENUM('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'),
        defaultValue: 'MARGIN',
    },
    commissionType: {
        type: Sequelize.ENUM('PERCENTAGE', 'FLAT'),
        defaultValue: 'PERCENTAGE',
    },
    commission: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
    },
    fixedCommissionPerTransaction: {
        type: Sequelize.DECIMAL(10, 4),
        defaultValue: 0,
    },
    isCommissionInclGST: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
    },
    isCommissionConfigured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
});

module.exports = carReportPlan;
