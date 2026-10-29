'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../../configs/database/index");
const credential = require('../credential');
const SubCorporateUser = require('../subCorporateUsers');

const cloud_owners = sequelizeConfig.define('cloud_owners', {
    id: {
        type: Sequelize.BIGINT(11),
        primaryKey: true,
        autoIncrement: true
    },
    ownerName: Sequelize.STRING,
    profilePicture: Sequelize.STRING,
    percentageOfShare: Sequelize.DECIMAL(12, 4),
    homeAddress: Sequelize.STRING,
    nationality: Sequelize.STRING,
    passport: Sequelize.JSON,
    visa: Sequelize.JSON,
    insurance: Sequelize.JSON,
    emiratesId: Sequelize.JSON,
    ejari: Sequelize.JSON,
    bankDetails: Sequelize.JSON,
})
cloud_owners.belongsTo(credential)
cloud_owners.belongsTo(SubCorporateUser)

module.exports = cloud_owners