'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')
const cardIssuance = require('./cardIssuance')

const cardRequest = sequelizeConfig.define(
    'cardRequest',
    {
        id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
        corporateId: { type: Sequelize.INTEGER, allowNull: true },
        userId: { type: Sequelize.BIGINT, allowNull: true },
        cardIssuanceId: { type: Sequelize.BIGINT, allowNull: true },
        requestType: { type: Sequelize.STRING, allowNull: false },
        cardType: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'PENDING' },
        reason: { type: Sequelize.TEXT, allowNull: true },
        requestedByCredentialId: { type: Sequelize.INTEGER, allowNull: true },
        payload: { type: Sequelize.JSON, allowNull: true },
        result: { type: Sequelize.JSON, allowNull: true },
        decidedByCredentialId: { type: Sequelize.INTEGER, allowNull: true },
        decidedAt: { type: Sequelize.DATE, allowNull: true },
        decisionNote: { type: Sequelize.TEXT, allowNull: true },
    },
    { tableName: 'cardRequests', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
)

cardRequest.belongsTo(cardIssuance, { foreignKey: 'cardIssuanceId', as: 'card', constraints: false })

module.exports = cardRequest
