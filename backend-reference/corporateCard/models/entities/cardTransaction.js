'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')
const cardIssuance = require('./cardIssuance')

const cardTransaction = sequelizeConfig.define(
    'cardTransaction',
    {
        id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
        transactionUniqueId: { type: Sequelize.BIGINT, allowNull: false },
        // Set only on a refund row — points back at the original debit row sharing this same
        // transactionUniqueId. Null on every other row (AUTH/debit rows never have a parent).
        parentTransactionId: { type: Sequelize.BIGINT, allowNull: true },
        notificationUniqueId: { type: Sequelize.BIGINT, allowNull: true },
        externalCardIdentifier: { type: Sequelize.STRING, allowNull: true },
        referenceNumber: { type: Sequelize.STRING, allowNull: true },
        cardIssuanceId: { type: Sequelize.BIGINT, allowNull: true },
        corporateId: { type: Sequelize.INTEGER, allowNull: true },
        userId: { type: Sequelize.BIGINT, allowNull: true },
        eventType: { type: Sequelize.STRING, allowNull: false },
        transactionType: { type: Sequelize.INTEGER, allowNull: true },
        transactionMode: { type: Sequelize.INTEGER, allowNull: true },
        transactionAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
        decision: { type: Sequelize.STRING, allowNull: true },
        declineReason: { type: Sequelize.STRING, allowNull: true },
        status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'AUTH_RECEIVED' },
        issuerWalletBalance: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
        rawAuthPayload: { type: Sequelize.JSON, allowNull: true },
        rawNotifyPayload: { type: Sequelize.JSON, allowNull: true },
        notifiedAt: { type: Sequelize.DATE, allowNull: true },
        merchantName: { type: Sequelize.STRING, allowNull: true },
        merchantCategoryCode: { type: Sequelize.STRING, allowNull: true },
        merchantCity: { type: Sequelize.STRING, allowNull: true },
        category: { type: Sequelize.STRING, allowNull: true },
        displayId: { type: Sequelize.STRING, allowNull: true },
        comments: { type: Sequelize.JSON, allowNull: true },
        adminApproval: { type: Sequelize.STRING, allowNull: false, defaultValue: 'PENDING' },
        adminApprovalReason: { type: Sequelize.STRING, allowNull: true },
        adminApprovalBy: { type: Sequelize.INTEGER, allowNull: true },
        adminApprovalAt: { type: Sequelize.DATE, allowNull: true },
    },
    {
        tableName: 'cardTransactions',
        indexes: [
            {
                fields: ['transactionUniqueId', 'eventType'],
                unique: true,
                name: 'cardTransactions_transactionUniqueId_eventType_unique',
            },
            { fields: ['displayId'], unique: true, name: 'cardTransactions_displayId_unique' },
        ],
    }
)

cardTransaction.belongsTo(cardIssuance, { foreignKey: 'cardIssuanceId', constraints: false })
cardTransaction.belongsTo(cardTransaction, { foreignKey: 'parentTransactionId', as: 'parentTransaction', constraints: false })

module.exports = cardTransaction
