/**
 * Created by Imran Noor
 */
'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");
const serviceOperator = require("./serviceOperator")
const credential = require("./credential")

const disableServices = sequelizeConfig.define('disableServices', {
    Id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    serviceStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
})
disableServices.belongsTo(credential)
disableServices.belongsTo(serviceOperator)
module.exports = disableServices