/**
 * Created by Imran Noor
 */
'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

const roleAndPermissions = sequelizeConfig.define('roleAndPermissions', {
    id: {
        type: Sequelize.BIGINT(11),
        primaryKey: true,
        autoIncrement: true
    },
    roleName: Sequelize.STRING,
    permissions: Sequelize.JSON,
    isAdmin:{
        type:Sequelize.BOOLEAN,
        defaultValue:false
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
    userType: {
        type: String,
        enum: ['SYSTEMUSER', 'PARTNER'],
        default: 'SYSTEMUSER'
    },
})
module.exports = roleAndPermissions;