/**
 * Created by Salmaan Mushtaq
 */
'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");
const credential = require("./credential")

const bankDetails = sequelizeConfig.define('bankDetails', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    accountHolderName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    accountNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    bankName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    bankAddress: {
        type: Sequelize.STRING,
        allowNull: false
    },
    iban: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    swiftCode: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    ifscCode: {
        type: Sequelize.STRING,
        allowNull: false
    },
    accountType: {
        type: Sequelize.ENUM('Savings', 'Current', 'Time'),
        allowNull: false
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    bankBranch: {
        type: Sequelize.STRING,
        allowNull: true
    }
})
bankDetails.belongsTo(credential)
module.exports = bankDetails