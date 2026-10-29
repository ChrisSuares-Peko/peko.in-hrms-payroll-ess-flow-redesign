/**
 * Created by Imran Noor
 */
'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const Package = require("./package");
const serviceOperators = require('./serviceOperator');

const Subscription = sequelizeConfig.define('subscription', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    subscriptionStartDate: Sequelize.DATE,
    subscriptionEndDate: Sequelize.DATE,
    subscriptionPaymentRefId: Sequelize.STRING,
    subscriptionPrice: Sequelize.DECIMAL(10, 4),
    subscriptionAmountPaid: Sequelize.DECIMAL(10, 4),
    discount: Sequelize.DECIMAL(10, 4),
    status: {
        type: Sequelize.ENUM("ACTIVE", "DUE", "UPGRADED", "DOWNGRADED", "EXPIRED", "CANCELLED"),//ACTIVE,DUE/UPGRADED/DOWNGRADED/EXPIRED
        defaultValue: "ACTIVE",
    },
    billingType: {
        type: Sequelize.ENUM("MONTHLY", "ANNUALLY"),
    },
    billingAddress: Sequelize.JSON,
    paymentModeResponse: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    isCustom: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    maxLimit: {
        type: Sequelize.DECIMAL(10, 2)
    },
    isCancelled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    couponCode: {
        type: Sequelize.STRING,
        allowNull: true
    },
    paymentMode: {
        type: Sequelize.ENUM("PAYMENT GATEWAY", "ACTIVATION_CODE"),
        allowNull: true,
        defaultValue: null,
    },
    invoiceId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    vendorSubscriptionId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    serviceOperatorId: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    authPayment: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    isGracePeriod: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    corporateTxnId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    taxableAmount: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true
    },
    taxAmount: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true
    },
    taxRate: {
        type: Sequelize.DECIMAL(6, 3),
        allowNull: true
    },
})

Subscription.belongsTo(Package)
Subscription.belongsTo(serviceOperators, { foreignKey: 'serviceOperatorId' })

module.exports = Subscription