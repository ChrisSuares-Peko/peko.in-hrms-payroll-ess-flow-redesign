'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * One row per seller group of a captured checkout — the /confirm we owe that
 * seller and what came of it. The checkout-level half is ondcCheckoutConfirms.
 *
 *   PENDING -> DISPATCHED (/confirm sent) -> CONFIRMED | FAILED
 *
 * paymentGateway creates the row and sends /confirm (paymentGateway/services/
 * ondcConfirmDispatch.js); purchase settles it from on_confirm and on each
 * checkout-result poll. Every transition is a compare-and-set on the current
 * status, so they can race without sending /confirm twice or both deciding the
 * outcome.
 *
 * A seller whose attempt already FAILED (timeout, NACK) but who confirms anyway is
 * a LATE confirm: its share is part of the refund, so the order is cancelled with
 * the seller (lateConfirmAt / cancelStatus) and never becomes an ondcOrders row.
 */
const ondcConfirmAttempts = sequelizeConfig.define('ondcConfirmAttempts', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },

    // ondcCheckoutConfirms.paymentRef. UNIQUE with transactionId: one attempt per
    // seller group per capture, however many times the checkout is recorded.
    paymentRef: {
        type: Sequelize.STRING(64),
        allowNull: false
    },
    // The ONDC order-session id (search -> select -> init -> confirm) of this group.
    transactionId: {
        type: Sequelize.STRING,
        allowNull: false
    },

    bppId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    bppUri: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    providerId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    vendorName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    domain: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    city: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    // This seller's quote total from on_init (what the buyer paid for it before the
    // platform fee). Weights the seller's share of the capture for the refund.
    quoteAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
    },

    // The ONDC order id sent in /confirm (minted at dispatch; the seller's echo on
    // on_confirm overwrites it). A late confirm is cancelled by this id.
    ondcOrderId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // The /confirm context.message_id — on_confirm echoes it, which is how the
    // callback finds this attempt even when a transaction id is reused.
    messageId: {
        type: Sequelize.STRING(64),
        allowNull: true
    },

    // PENDING | DISPATCHED | CONFIRMED | FAILED
    status: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'PENDING'
    },
    // sync_nack | on_confirm_error | timeout | on_init_not_found |
    // on_init_order_missing | missing_bpp_uri | not_dispatched
    failureReason: {
        type: Sequelize.STRING(40),
        allowNull: true
    },
    // The seller's own words where there are any (NACK code/message, on_confirm error).
    failureDetail: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    dispatchedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    // dispatchedAt + the confirm timeout; past it with no on_confirm the next checkout-result poll fails it.
    deadlineAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    // When on_confirm settled it (success or error).
    respondedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    // ONDC order state from on_confirm, e.g. "Created"
    orderState: {
        type: Sequelize.STRING(64),
        allowNull: true
    },

    // Late confirm: the seller confirmed after this attempt had already FAILED.
    lateConfirmAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    // SENT (/cancel ACKed) | FAILED (not ACKed — retried on a later poll) | CANCELLED (on_cancel)
    cancelStatus: {
        type: Sequelize.STRING(16),
        allowNull: true
    },
    cancelAttempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    cancelError: {
        type: Sequelize.TEXT,
        allowNull: true
    },

    // The synchronous /confirm answer paymentGateway got (HTTP status, ack, error).
    confirmResponse: {
        type: Sequelize.JSON,
        allowNull: true
    },
    // The seller's on_confirm (context, order, error) as received by the webhook.
    onConfirmResponse: {
        type: Sequelize.JSON,
        allowNull: true
    },
}, {
    // Declared here as well as below so a freshly created table is unique from its
    // first row; WANTED_INDEXES heals a table that predates it.
    indexes: [{ name: 'ondc_confirm_attempts_ref_txn', fields: ['paymentRef', 'transactionId'], unique: true }],
})

const WANTED_INDEXES = [
    { name: 'ondc_confirm_attempts_ref_txn', fields: ['paymentRef', 'transactionId'], unique: true },
    { name: 'ondc_confirm_attempts_status_deadline', fields: ['status', 'deadlineAt'] },
    { name: 'ondc_confirm_attempts_message', fields: ['messageId'] },
    { name: 'ondc_confirm_attempts_transaction', fields: ['transactionId'] },
]

// Added-later columns, patched idempotently on boot (ondc_order.js pattern).
const WANTED_COLUMNS = {
    confirmResponse: { type: Sequelize.JSON, allowNull: true },
    onConfirmResponse: { type: Sequelize.JSON, allowNull: true },
}

/**
 * sync({force:false}) creates the table if missing; columns/indexes are added
 * idempotently on every boot (safe to re-run, self-heals).
 */
const ensureOndcConfirmAttemptsTable = async () => {
    await ondcConfirmAttempts.sync({ force: false })
    const qi = ondcConfirmAttempts.sequelize.getQueryInterface()
    const tableName = ondcConfirmAttempts.getTableName()

    const describe = await qi.describeTable(tableName)
    for (const [column, definition] of Object.entries(WANTED_COLUMNS)) {
        if (!describe[column]) {
            await qi.addColumn(tableName, column, definition)
        }
    }

    const existing = await qi.showIndex(tableName)
    const existingNames = new Set(existing.map((i) => i.name))
    for (const idx of WANTED_INDEXES) {
        if (!existingNames.has(idx.name)) {
            await qi.addIndex(tableName, idx.fields, { name: idx.name, unique: Boolean(idx.unique) })
        }
    }
}

ensureOndcConfirmAttemptsTable()
    .then(() => console.log("ondcConfirmAttempts table is ready"))
    .catch((error) => console.error("Error preparing ondcConfirmAttempts table:", error))

module.exports = ondcConfirmAttempts
