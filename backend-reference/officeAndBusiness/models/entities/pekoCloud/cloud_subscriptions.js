'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../../configs/database/index");
const credential = require("../credential");
const cloud_softwares = require('./cloud_softwares');
const SubCorporateUser = require('../subCorporateUsers');

const cloud_subscriptions = sequelizeConfig.define('cloud_subscriptions', {
    id: {
        type: Sequelize.BIGINT(11),
        primaryKey: true,
        autoIncrement: true
    },
    subscriptionName: Sequelize.STRING,
    planDetails: Sequelize.STRING,
    billingCycle: Sequelize.STRING,
    billingStartDate: Sequelize.STRING,
    numberOfDevices: Sequelize.INTEGER,
    currency: Sequelize.STRING,
    amount: Sequelize.DECIMAL(12, 4),
    assignTo: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
    },
    status: Sequelize.STRING,
})
cloud_subscriptions.belongsTo(credential)
cloud_subscriptions.belongsTo(cloud_softwares)
cloud_subscriptions.belongsTo(SubCorporateUser)
module.exports = cloud_subscriptions