'use strict';
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const Package = require("./package");
const credential = require('./credential');
const corporateUser = require('./corporateUser');

const WhatsAppSubscription = sequelizeConfig.define('whatsAppSubscription', {
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
        type: Sequelize.ENUM("PRO", "BASIC"),
    },
    paymentModeResponse: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    projectId: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    invoiceId: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    isCustom: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    addOnType: {
        type: Sequelize.ENUM("BOT_BUILDER", "SHOPIFY_INTEGRATION"),
        allowNull: true,
        defaultValue: null,
    },
    isCancelled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
});

WhatsAppSubscription.belongsTo(Package);
WhatsAppSubscription.belongsTo(credential);
WhatsAppSubscription.belongsTo(corporateUser)

module.exports = WhatsAppSubscription;
