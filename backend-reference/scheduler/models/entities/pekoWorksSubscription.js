'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const orders = require('./order');
const credential = require('./credential');

const PekoWorksSubscription = sequelizeConfig.define('pekoWorksSubscription', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    startDate: Sequelize.DATE,
    endDate: Sequelize.DATE,
    paymentRefId: Sequelize.STRING,
    price: Sequelize.DECIMAL(10, 2),
    status: {
        type: Sequelize.ENUM("ACTIVE", "DUE", "UPGRADED", "DOWNGRADED", "EXPIRED","CANCELLED"),
        defaultValue: "ACTIVE",
    },
    billingType: {
        type: Sequelize.ENUM("MONTHLY", "YEARLY"),
    },
    vendorSubscriptionId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    corporateTxnId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    authPayment: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    isGracePeriod: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
    serviceOperatorId: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
})
PekoWorksSubscription.belongsTo(orders)
PekoWorksSubscription.belongsTo(credential)

module.exports = PekoWorksSubscription