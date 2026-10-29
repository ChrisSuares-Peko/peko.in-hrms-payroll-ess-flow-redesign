/**
 * Created by Imran Noor
 */
'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const credential = require('./credential');

const PG_Orders = sequelizeConfig.define('paymentGatewayOrders', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    paymentRefId:Sequelize.STRING,
    referenceNo:Sequelize.STRING,
    /** Merchant subscription_id sent to Cashfree — used to match redirect + webhooks */
    vendorSubscriptionId: {
        type: Sequelize.STRING(255),
        allowNull: true,
    },
    paymentData: Sequelize.TEXT,
    /**
     * See constants/orderKind.js — default PAYMENT_GATEWAY; subscription flows set SUBSCRIPTION_*.
     */
    orderKind: {
        type: Sequelize.STRING(64),
        allowNull: false,
        defaultValue: 'PAYMENT_GATEWAY',
    },
    status: {
        type: Sequelize.ENUM('PENDING','ORDERED','IN_PROGRESS','COMPLETE','FAILED'),
        defaultValue: 'PENDING'
    },
    paymentResponse: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    pgProvider: {
        type: Sequelize.STRING(64),
        allowNull: true,
        defaultValue: null,
    }
})

PG_Orders.belongsTo(credential);

module.exports = PG_Orders