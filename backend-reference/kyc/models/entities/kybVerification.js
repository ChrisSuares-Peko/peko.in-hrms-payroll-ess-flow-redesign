'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require('./corporateUser');

const kybVerifications = sequelizeConfig.define('kybVerifications', 
    {
        id: {
            type: Sequelize.BIGINT,
            primaryKey: true,
            autoIncrement: true,
          },
          documentType: {
            type: Sequelize.ENUM('gst', 'pan', 'cin'),
            allowNull: false,
          },
          documentNumber: {
            type: Sequelize.STRING,
           
          },
          legalNameOfBusiness: {
            type: Sequelize.STRING,
            allowNull: true,
          },
          nameMatchingScore:{
            type: Sequelize.STRING,
          },
          verificationResponse: {
            type: Sequelize.JSON,
            
          },
}
)
kybVerifications.belongsTo(corporateUser)
module.exports = kybVerifications;