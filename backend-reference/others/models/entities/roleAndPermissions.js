/**
 * Created by Imran Noor
 */
'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");
//const vendor = require("./vendor")

const roleAndPermissions = sequelizeConfig.define('roleAndPermissions', {
    id: {
        type: Sequelize.BIGINT(11),
        primaryKey: true,
        autoIncrement: true
    },
    roleName: Sequelize.STRING,
    permissions: Sequelize.JSON,
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
    isAdmin:{
        type:Sequelize.BOOLEAN,
        defaultValue:false
    },
    userType: {
        type: String,
        enum: ['SYSTEMUSER', 'PARTNER'],
        default: 'SYSTEMUSER'
    },
})
//serviceOperators.belongsTo(vendor)
module.exports = roleAndPermissions;