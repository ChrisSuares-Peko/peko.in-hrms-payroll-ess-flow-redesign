'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const order = require('./order');
const paymentGatewayOrders = require('./paymentGatewayOrders');

const manualRefunds = sequelizeConfig.define('manualRefunds', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    corporateTxnId: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
    },
    orderId: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    paymentGatewayOrderId: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    pgProvider: {
        type: Sequelize.STRING(64),
        allowNull: false,
    },
    status: {
        type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED'),
        allowNull: false,
        defaultValue: 'PENDING',
    },
    refundAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
    },
    paidAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
    },
    credentialId: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    serviceName: {
        type: Sequelize.STRING(255),
        allowNull: true,
    },
    reason: {
        type: Sequelize.STRING(500),
        allowNull: true,
    },
    gatewayOrderId: {
        type: Sequelize.STRING(128),
        allowNull: true,
    },
    gatewayReference: {
        type: Sequelize.STRING(128),
        allowNull: true,
    },
    paymentDetails: {
        type: Sequelize.JSON,
        allowNull: true,
    },
    refundReference: {
        type: Sequelize.STRING(128),
        allowNull: true,
    },
    remarks: {
        type: Sequelize.STRING(500),
        allowNull: true,
    },
    updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    history: {
        type: Sequelize.JSON,
        allowNull: true,
    },
}, { tableName: 'manualRefunds' });

manualRefunds.belongsTo(order, { foreignKey: 'orderId' });
manualRefunds.belongsTo(paymentGatewayOrders, { foreignKey: 'paymentGatewayOrderId' });

module.exports = manualRefunds;
