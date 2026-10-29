'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../../configs/database/index");
const cloud_employees = require('./cloud_employees');
const credential = require('../credential');
const SubCorporateUser = require('../subCorporateUsers');

const cloud_fleets = sequelizeConfig.define('cloud_fleets', {
    id: {
        type: Sequelize.BIGINT(11),
        primaryKey: true,
        autoIncrement: true
    },
    vehicleName: Sequelize.STRING,
    vehicleType: Sequelize.STRING,
    vehicleNumber: Sequelize.STRING,
    purchasedDate: Sequelize.DATE,
    assetType: Sequelize.STRING,
    dateOfRenewal: Sequelize.DATE,
    amount: Sequelize.STRING,
    amountRecurring: Sequelize.STRING,
    vendor: Sequelize.STRING,
    modelYear: Sequelize.STRING,
    chassisNumber: Sequelize.STRING,
    engineTransmission: Sequelize.STRING,
    odoMeter: Sequelize.STRING,
    status: Sequelize.STRING,
})
cloud_fleets.belongsTo(cloud_employees)
cloud_fleets.belongsTo(credential)
cloud_fleets.belongsTo(SubCorporateUser)
module.exports = cloud_fleets