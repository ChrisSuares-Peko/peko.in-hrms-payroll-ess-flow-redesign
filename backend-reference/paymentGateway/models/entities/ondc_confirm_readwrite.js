'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * The two confirm-after-payment tables, which purchase owns
 * (purchase/models/entities/ondc_checkout_confirm.js, ondc_confirm_attempt.js).
 *
 * This service WRITES to them — it is the one that sends each seller's /confirm,
 * straight from the Cashfree payment callback (services/ondcConfirmDispatch.js) —
 * but only these fields:
 *   ondcCheckoutConfirms  the row itself, created once per capture
 *   ondcConfirmAttempts   the row itself, and its dispatch fields: status
 *                         PENDING -> DISPATCHED | FAILED, messageId, ondcOrderId,
 *                         dispatchedAt, deadlineAt, failure*, confirmResponse
 * Everything after that (on_confirm, timeouts, completion, the refund, late-confirm
 * cancels) is purchase's.
 *
 * ------------------------------------------------------------------------------
 * RULES
 * ------------------------------------------------------------------------------
 * 1. NEVER call sync() / ensure*() on these models, and never add one. purchase
 *    creates and heals the tables; a second service self-healing them is how
 *    schemas drift. (The definitions mirror purchase's exactly, including the unique
 *    indexes, so the database-wide sync in configs/database cannot create a
 *    different table if this service happens to boot first.)
 * 2. Keep the columns in step with purchase's entities. A column declared here that
 *    purchase has not deployed yet fails every query with "Unknown column" — deploy
 *    purchase first.
 */

const ondcCheckoutConfirms = sequelizeConfig.define('ondcCheckoutConfirms', {
    id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
    paymentRef: { type: Sequelize.STRING(64), allowNull: false },
    corporateUserId: { type: Sequelize.INTEGER, allowNull: true },
    subCorporateUserId: { type: Sequelize.INTEGER, allowNull: true },
    groupCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    capturedAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
    capturedAt: { type: Sequelize.DATE, allowNull: true },
    // IN_PROGRESS | COMPLETED
    status: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'IN_PROGRESS' },
    outcome: { type: Sequelize.STRING(16), allowNull: true },
    completedAt: { type: Sequelize.DATE, allowNull: true },
    refundAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    refundStatus: { type: Sequelize.STRING(16), allowNull: true },
    refundAttempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    refundRequestedAt: { type: Sequelize.DATE, allowNull: true },
    refundError: { type: Sequelize.TEXT, allowNull: true },
}, {
    tableName: 'ondcCheckoutConfirms',
    indexes: [{ name: 'ondc_checkout_confirms_payment_ref', fields: ['paymentRef'], unique: true }],
});

const ondcConfirmAttempts = sequelizeConfig.define('ondcConfirmAttempts', {
    id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
    paymentRef: { type: Sequelize.STRING(64), allowNull: false },
    transactionId: { type: Sequelize.STRING, allowNull: false },
    bppId: { type: Sequelize.STRING, allowNull: true },
    bppUri: { type: Sequelize.TEXT, allowNull: true },
    providerId: { type: Sequelize.STRING, allowNull: true },
    vendorName: { type: Sequelize.STRING, allowNull: true },
    domain: { type: Sequelize.STRING(64), allowNull: true },
    city: { type: Sequelize.STRING(64), allowNull: true },
    quoteAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
    ondcOrderId: { type: Sequelize.STRING, allowNull: true },
    messageId: { type: Sequelize.STRING(64), allowNull: true },
    // PENDING | DISPATCHED | CONFIRMED | FAILED
    status: { type: Sequelize.STRING(16), allowNull: false, defaultValue: 'PENDING' },
    failureReason: { type: Sequelize.STRING(40), allowNull: true },
    failureDetail: { type: Sequelize.TEXT, allowNull: true },
    dispatchedAt: { type: Sequelize.DATE, allowNull: true },
    deadlineAt: { type: Sequelize.DATE, allowNull: true },
    respondedAt: { type: Sequelize.DATE, allowNull: true },
    orderState: { type: Sequelize.STRING(64), allowNull: true },
    lateConfirmAt: { type: Sequelize.DATE, allowNull: true },
    cancelStatus: { type: Sequelize.STRING(16), allowNull: true },
    cancelAttempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    cancelError: { type: Sequelize.TEXT, allowNull: true },
    confirmResponse: { type: Sequelize.JSON, allowNull: true },
    onConfirmResponse: { type: Sequelize.JSON, allowNull: true },
}, {
    tableName: 'ondcConfirmAttempts',
    indexes: [{ name: 'ondc_confirm_attempts_ref_txn', fields: ['paymentRef', 'transactionId'], unique: true }],
});

module.exports = { ondcCheckoutConfirms, ondcConfirmAttempts };
