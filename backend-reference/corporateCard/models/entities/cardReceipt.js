'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')
const cardTransaction = require('./cardTransaction')

const cardReceipt = sequelizeConfig.define(
    'cardReceipt',
    {
        id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
        cardTransactionId: { type: Sequelize.BIGINT, allowNull: false },
        corporateId: { type: Sequelize.INTEGER, allowNull: true },
        userId: { type: Sequelize.BIGINT, allowNull: true },
        uploadedByRole: { type: Sequelize.STRING, allowNull: false },
        uploadedByUserId: { type: Sequelize.BIGINT, allowNull: false },
        fileUrl: { type: Sequelize.TEXT, allowNull: false },
        fileName: { type: Sequelize.STRING, allowNull: true },
        mimeType: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'ACTIVE' },
    },
    {
        tableName: 'cardReceipts',
        indexes: [{ fields: ['cardTransactionId'], name: 'cardReceipts_cardTransactionId_idx' }],
    }
)

cardReceipt.belongsTo(cardTransaction, { foreignKey: 'cardTransactionId', constraints: false })

module.exports = cardReceipt
