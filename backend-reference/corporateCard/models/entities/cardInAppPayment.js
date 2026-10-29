'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require('../../configs/database/index')
const cardIssuance = require('./cardIssuance')

// One row per in-app purchase paid with a corporate card (Pine Labs SVA Redeem). The JIT AUTH that the
// redeem triggers still lands in cardTransactions and remains the ledger; this row is the receipt that
// paymentGateway keys on, and what Cancel Redeem needs later.
const cardInAppPayment = sequelizeConfig.define(
    'cardInAppPayment',
    {
        id: { type: Sequelize.BIGINT, primaryKey: true, autoIncrement: true },
        corporateId: { type: Sequelize.INTEGER, allowNull: false },
        cardIssuanceId: { type: Sequelize.BIGINT, allowNull: false },
        userId: { type: Sequelize.BIGINT, allowNull: true },
        credentialId: { type: Sequelize.INTEGER, allowNull: true },
        paymentRefId: { type: Sequelize.STRING(64), allowNull: false },
        accessKey: { type: Sequelize.STRING(64), allowNull: true },
        amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
        invoiceNumber: { type: Sequelize.STRING(15), allowNull: true },
        status: { type: Sequelize.STRING(24), allowNull: false, defaultValue: 'INITIATED' },
        reason: { type: Sequelize.STRING(255), allowNull: true },
        vendorTransactionId: { type: Sequelize.BIGINT, allowNull: true },
        vendorBatchNumber: { type: Sequelize.BIGINT, allowNull: true },
        approvalCode: { type: Sequelize.STRING(32), allowNull: true },
        appUtr: { type: Sequelize.STRING(64), allowNull: true },
        balanceAfter: { type: Sequelize.DECIMAL(14, 2), allowNull: true },
        vendorResponseCode: { type: Sequelize.INTEGER, allowNull: true },
        jitTransactionUniqueId: { type: Sequelize.BIGINT, allowNull: true },
        cancelTransactionId: { type: Sequelize.BIGINT, allowNull: true },
        cancelBatchNumber: { type: Sequelize.BIGINT, allowNull: true },
        cancelledAt: { type: Sequelize.DATE, allowNull: true },
        reversedAt: { type: Sequelize.DATE, allowNull: true },
        rawRedeemResponse: { type: Sequelize.JSON, allowNull: true },
        rawCancelResponse: { type: Sequelize.JSON, allowNull: true },
    },
    {
        tableName: 'cardInAppPayments',
        indexes: [
            { fields: ['paymentRefId'], unique: true, name: 'cardInAppPayments_paymentRefId_unique' },
            { fields: ['cardIssuanceId', 'createdAt'], name: 'cardInAppPayments_card_created_idx' },
            { fields: ['status', 'createdAt'], name: 'cardInAppPayments_status_created_idx' },
        ],
    }
)

cardInAppPayment.belongsTo(cardIssuance, { foreignKey: 'cardIssuanceId', constraints: false })

module.exports = cardInAppPayment
