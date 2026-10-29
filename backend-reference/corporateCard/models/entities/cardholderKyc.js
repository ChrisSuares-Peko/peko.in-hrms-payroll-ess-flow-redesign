'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')

const cardholderKyc = sequelizeConfig.define(
    'cardholderKyc',
    {
        id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
        corporateId: { type: Sequelize.INTEGER, allowNull: true },
        credentialId: { type: Sequelize.INTEGER, allowNull: true },
        userId: { type: Sequelize.BIGINT, allowNull: true },
        mobileNumber: { type: Sequelize.STRING, allowNull: false },
        kycType: { type: Sequelize.INTEGER, allowNull: true },
        kycStatus: { type: Sequelize.STRING, allowNull: false, defaultValue: 'INITIATED' },
        reason: { type: Sequelize.STRING, allowNull: true },
        customerSignature: { type: Sequelize.TEXT, allowNull: true },
        kycLink: { type: Sequelize.JSON, allowNull: true },
        provider: { type: Sequelize.STRING, allowNull: true },
        lastEventAt: { type: Sequelize.STRING, allowNull: true },
        rawResponse: { type: Sequelize.JSON, allowNull: true },
        statusSnapshot: { type: Sequelize.JSON, allowNull: true },
    },
    {
        tableName: 'cardholderKyc',
        indexes: [{ fields: ['mobileNumber'], unique: true, name: 'cardholderKyc_mobileNumber_unique' }],
    }
)

module.exports = cardholderKyc
