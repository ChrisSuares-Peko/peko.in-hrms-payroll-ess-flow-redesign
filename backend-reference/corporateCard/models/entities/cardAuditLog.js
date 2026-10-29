'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')

const cardAuditLog = sequelizeConfig.define(
    'cardAuditLog',
    {
        id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
        corporateId: { type: Sequelize.INTEGER, allowNull: true },
        userId: { type: Sequelize.BIGINT, allowNull: true },
        cardIssuanceId: { type: Sequelize.BIGINT, allowNull: true },
        action: { type: Sequelize.STRING, allowNull: false },
        category: { type: Sequelize.STRING, allowNull: true },
        actorCredentialId: { type: Sequelize.INTEGER, allowNull: true },
        actorDisplay: { type: Sequelize.STRING, allowNull: true },
        title: { type: Sequelize.STRING, allowNull: true },
        description: { type: Sequelize.TEXT, allowNull: true },
        oldValue: { type: Sequelize.JSON, allowNull: true },
        newValue: { type: Sequelize.JSON, allowNull: true },
        metadata: { type: Sequelize.JSON, allowNull: true },
    },
    { tableName: 'cardAuditLogs', updatedAt: false }
)

module.exports = cardAuditLog
