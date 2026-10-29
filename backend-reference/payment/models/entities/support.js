'use strict'
const Sequelize = require('sequelize')
const sequelize = require('../../configs/database/index')
const systemUser = require("./systemUser")
const corporateUser = require("./corporateUser")

let support = sequelize.define('support', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },
    issueType: Sequelize.STRING,
    module: Sequelize.STRING,
    description: Sequelize.TEXT,
    screenshotImage: Sequelize.TEXT,
    bbpsSupportHistory: Sequelize.TEXT,
    status: {
        type: Sequelize.ENUM,
        values: ['PENDING', 'RESOLVED', 'REJECTED'],
        defaultValue: 'PENDING'
    },
    chats: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
    },
    isClosed:{
        type:Sequelize.BOOLEAN,
        defaultValue:false
    },
    ticketId: {
        type: Sequelize.BIGINT,
        defaultValue: null
    }
})
support.belongsTo(systemUser)
support.belongsTo(corporateUser)
module.exports = support;
