'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");

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
    billingPlan: Sequelize.STRING,
    projectId: Sequelize.STRING,
    isCancelled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
});

module.exports = ServiceSubscription;
