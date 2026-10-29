'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../../configs/database/index");
const cloud_employees = require('./cloud_employees');
const cloud_assets = require('./cloud_assets');
const cloud_fleets = require('./cloud_fleets');
const credential = require('../credential');
const SubCorporateUser = require('../subCorporateUsers');

const cloud_usageHistories = sequelizeConfig.define('cloud_usageHistories', {
    id: {
        type: Sequelize.BIGINT(11),
        primaryKey: true,
        autoIncrement: true
    },
    usageCategory: Sequelize.STRING,
    assignDate: Sequelize.DATE,
    returnDate: Sequelize.DATE,
    returnStatus: Sequelize.STRING,
    remarks: Sequelize.TEXT,
})
cloud_usageHistories.belongsTo(credential);
cloud_usageHistories.belongsTo(cloud_employees)
cloud_usageHistories.belongsTo(cloud_assets)
cloud_usageHistories.belongsTo(cloud_fleets)
cloud_usageHistories.belongsTo(SubCorporateUser)
module.exports = cloud_usageHistories