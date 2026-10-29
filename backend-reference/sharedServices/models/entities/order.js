'use strict';

const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");

const orders = sequelizeConfig.define('orders', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    corporateTxnId: {
        type: Sequelize.STRING,
        unique: true
    },
    operatorId: Sequelize.STRING,
    providerId: Sequelize.STRING,
    transactionDate: Sequelize.DATE,
    accountNo: Sequelize.STRING,
    amountInINR: {
        type: Sequelize.DECIMAL(12, 4),
        defaultValue: 0.0
    },
    baseAmount: {
        type: Sequelize.DECIMAL(12, 4),
        defaultValue: 0.0
    },
    paymentMode: {
        type: Sequelize.STRING,
        allowNull: true
    },
    orderResponse: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    paymentModeResponse: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    surcharge: Sequelize.DECIMAL(12, 4),
    baseCurrency: Sequelize.STRING,
    exchangeRate: Sequelize.STRING,
    status: Sequelize.STRING,
    message: Sequelize.STRING,
    ecomOrderStatus: {
        type: Sequelize.STRING,
    },
    workspaceOrderStatus: {
        type: Sequelize.STRING,
        default: 'PENDING'
    },
    shipmentStatus: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
    },
    batchId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    invoiceId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    journalData: {
        type: Sequelize.JSON,
        defaultValue: null,
    },
    journalRecordStatus: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: null,
    },
    optional: Sequelize.STRING,
});

module.exports = orders;
