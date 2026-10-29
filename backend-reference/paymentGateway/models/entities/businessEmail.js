const Sequelize = require('sequelize');
const sequelizeConfig = require("../../configs/database/index");
const softwares_subscriptions_plans = require("./softwares_subscriptions_plans");
const order = require("./order");
const corporateUser = require('./corporateUser');

const business_email_subscriptions = sequelizeConfig.define('business_email_subscriptions', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    subscriptionStartDate: Sequelize.DATE,
    subscriptionEndDate: Sequelize.DATE,
    status: {
        type: Sequelize.ENUM("PENDING","ACTIVE", "UPGRADED", "EXPIRED", "CANCELLED"),
        defaultValue: "PENDING",
    },
    billingType: {
        type: Sequelize.ENUM("MONTHLY", "ANNUALLY"),
    },
    noOfEmails: {
        type: Sequelize.DECIMAL(10, 2)
    },
    isCustom: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },
})

business_email_subscriptions.belongsTo(softwares_subscriptions_plans)
business_email_subscriptions.belongsTo(order)
business_email_subscriptions.belongsTo(corporateUser)

module.exports = business_email_subscriptions