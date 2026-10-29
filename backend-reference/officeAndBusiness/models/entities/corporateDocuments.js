'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");
const corporateUser = require("./corporateUser")

const corporateDocuments = sequelizeConfig.define('corporateDocuments', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    documentName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    document: {
        type: Sequelize.STRING,
    },
    documentType: {
        type: Sequelize.STRING,
    },
    status: {
        type: Sequelize.STRING,
        defaultValue: "PENDING"
    },
    expiryDate: {
        type: Sequelize.STRING,
    },
}, {
    indexes: [
        {
            unique: true,
            fields: ['documentName', 'corporateUserId']  // Unique constraint here
        }
    ]
});

corporateDocuments.belongsTo(corporateUser)

module.exports = corporateDocuments