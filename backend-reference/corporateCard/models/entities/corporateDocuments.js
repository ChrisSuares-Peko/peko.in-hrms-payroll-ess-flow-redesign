'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

const corporateDocuments = sequelizeConfig.define('corporateDocuments', {
    id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    corporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: false
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
    fileName: {
        type: Sequelize.STRING,
    },
    status: {
        type: Sequelize.STRING,
        defaultValue: "PENDING"
    },
    expiryDate: {
        type: Sequelize.STRING,
    },
    sizeBytes: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
}, {
    indexes: [
        {
            unique: true,
            fields: ['documentName', 'corporateUserId'],
            name: 'corporateDocuments_docName_corp_unique',
        }
    ]
});

module.exports = corporateDocuments
