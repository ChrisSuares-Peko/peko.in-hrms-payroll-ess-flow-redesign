/**
 * Created by Imran Noor
 */
'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");
const Package = require("./package")
const serviceOperator = require("./serviceOperator")

const cashback = sequelizeConfig.define('cashback', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    serviceStatus: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
    cashbackType: Sequelize.STRING,
    cashback: Sequelize.STRING,
    packageId: Sequelize.BIGINT,
    serviceOperatorId: Sequelize.BIGINT,
    surcharge: {
        type: Sequelize.DECIMAL(10,2),
        allowNull: false
    },
    surchargeType: {
        type: Sequelize.ENUM('FLAT', 'PERCENTAGE'),
        defaultValue: 'FLAT'
    },
    unitPrice: {
        type: Sequelize.DECIMAL(10, 2)
    },
    baseLimit: {
        type: Sequelize.DECIMAL(10, 2)
    },
    isSurchargeConfigured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    }
})
cashback.belongsTo(serviceOperator)
cashback.belongsTo(Package)
module.exports = cashback