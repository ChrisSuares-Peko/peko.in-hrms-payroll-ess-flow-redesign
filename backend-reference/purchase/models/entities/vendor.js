/**
 * Created by Imran Noor
 */

'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

const vendors = sequelizeConfig.define('vendors', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    vendorName: Sequelize.STRING,
    type: Sequelize.STRING,
    isActive: Sequelize.BOOLEAN,
    apiUrl: Sequelize.STRING,
    healthUrl: Sequelize.STRING,
    state: {
        type: Sequelize.STRING,
        allowNull: true
    },
    gstNo: {
        type: Sequelize.STRING,
        allowNull: true
    },
    address: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    optional1: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    optional2: {
        type: Sequelize.STRING,
        allowNull: true
    },
   optional3: {
    type: Sequelize.TEXT, 
    allowNull: true
},
optional4: {
    type: Sequelize.TEXT,  
    allowNull: true
},
    optional5: {
        type: Sequelize.STRING,
        allowNull: true
    },
    optional6: {
        type: Sequelize.STRING,
        allowNull: true
    },
    optionals: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
    },
    isBillPaymentAvailable: Sequelize.BOOLEAN,
    isTopUpAvailable: Sequelize.BOOLEAN,
    currency: Sequelize.STRING,
    vendorEmail: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
})

module.exports = vendors