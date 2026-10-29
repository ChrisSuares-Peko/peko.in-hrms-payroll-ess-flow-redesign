'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const Package = require("./package");
const credential = require('./credential');
const corporateUser = require('./corporateUser');

const ServiceSubscription = sequelizeConfig.define('serviceSubscription', {
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
        type: Sequelize.ENUM("ACTIVE", "PENDING", "UPGRADED", "DOWNGRADED", "EXPIRED", "CANCELLED"),
        defaultValue: "PENDING",
    },
    billingType: {
        type: Sequelize.ENUM("MONTHLY", "ANNUALLY"),
    },
    billingPlan: {
        type: Sequelize.STRING,
        allowNull: false, 
    },
    paymentModeResponse: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    projectId: {
        type: Sequelize.STRING,
        allowNull: false, 
    },
    vendorResponse : {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
    },
    invoiceId: {
        type: Sequelize.STRING,
        allowNull: true, 
    },
    isCancelled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    vendorSubscriptionId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    isGracePeriod: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
});

ServiceSubscription.belongsTo(Package);
ServiceSubscription.belongsTo(credential);
ServiceSubscription.belongsTo(corporateUser)

module.exports = ServiceSubscription;
