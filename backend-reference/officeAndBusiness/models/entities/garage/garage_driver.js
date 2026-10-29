'use strict'
const Sequelize = require('sequelize');
const sequelizeConfig = require("../../../configs/database/index");
const credential = require('../credential');
const SubCorporateUser = require('../subCorporateUsers');

const garage_driver = sequelizeConfig.define('garage_driver', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    dlNumber: {
        type: Sequelize.STRING,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING
    },
    fatherName: {
        type: Sequelize.STRING
    },
    dob: {
        type: Sequelize.DATE
    },
    address: {
        type: Sequelize.TEXT
    },
    permanentAddress: {
        type: Sequelize.TEXT
    },
    photoUrl: {
        type: Sequelize.TEXT
    },
    nonTransportValidFrom: {
        type: Sequelize.DATE
    },
    nonTransportValidTo: {
        type: Sequelize.DATE
    },
    transportValidFrom: {
        type: Sequelize.DATE
    },
    transportValidTo: {
        type: Sequelize.DATE
    },
    hazardousValidTill: {
        type: Sequelize.DATE
    },
    hillValidTill: {
        type: Sequelize.DATE
    },
    dateOfIssue: {
        type: Sequelize.DATE
    },
    verificationStatus: {
        type: Sequelize.STRING
    },
    referenceId: {
        type: Sequelize.BIGINT
    },
    rawData: {
        type: Sequelize.JSON
    },
    status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    aadharCard: {
        type: Sequelize.STRING
    },
    drivingLicense: {
        type: Sequelize.STRING
    },
    panCard: {
        type: Sequelize.STRING
    },
    createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    }
});

garage_driver.belongsTo(credential)
garage_driver.belongsTo(SubCorporateUser)

module.exports = garage_driver;
