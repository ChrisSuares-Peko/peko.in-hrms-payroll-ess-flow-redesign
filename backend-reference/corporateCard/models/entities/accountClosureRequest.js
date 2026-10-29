'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')

const accountClosureRequest = sequelizeConfig.define(
    'accountClosureRequest',
    {
        id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
        corporateId: { type: Sequelize.INTEGER, allowNull: false },
        status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'PENDING' },
        reason: { type: Sequelize.STRING, allowNull: false },
        details: { type: Sequelize.TEXT, allowNull: true },
        requestedByCredentialId: { type: Sequelize.INTEGER, allowNull: true },
        requestedByName: { type: Sequelize.STRING, allowNull: true },
        decidedByCredentialId: { type: Sequelize.INTEGER, allowNull: true },
        decidedAt: { type: Sequelize.DATE, allowNull: true },
        decisionNote: { type: Sequelize.TEXT, allowNull: true },
        appliedAt: { type: Sequelize.DATE, allowNull: true },
        appliedResult: { type: Sequelize.JSON, allowNull: true },
    },
    { tableName: 'corporateCardAccountClosureRequests', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' }
)

module.exports = accountClosureRequest
