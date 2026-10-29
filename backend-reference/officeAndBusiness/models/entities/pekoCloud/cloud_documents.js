'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../../configs/database/index");
const cloud_assets = require('./cloud_assets');
const cloud_fleets = require('./cloud_fleets');
const credential = require('../credential');
const SubCorporateUser = require('../subCorporateUsers');

const cloud_documents = sequelizeConfig.define('cloud_documents', {
    id: {
        type: Sequelize.BIGINT(11),
        primaryKey: true,
        autoIncrement: true
    },
    documentName: Sequelize.STRING,
    documentNumber: Sequelize.TEXT,
    documentCategory: Sequelize.STRING,
    documentType: Sequelize.TEXT,
    issueDate: Sequelize.STRING,
    expireDate: Sequelize.DATE,
    document: Sequelize.STRING,
})
cloud_documents.belongsTo(cloud_assets)
cloud_documents.belongsTo(cloud_fleets)
cloud_documents.belongsTo(credential)
cloud_documents.belongsTo(SubCorporateUser)
module.exports = cloud_documents