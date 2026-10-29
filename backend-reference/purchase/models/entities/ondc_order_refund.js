'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Append-only ledger of admin-issued buyer refunds on ONDC orders — one row per
 * Cashfree refund attempt, success or failure.
 *
 * A separate table rather than columns on ondcOrders for two reasons. It supports
 * MULTIPLE partial refunds per order (the admin enters an amount, so an order can
 * be refunded in instalments up to amountPaid). And ondcOrders sits at InnoDB's
 * row-size limit — adding VARCHAR columns there is exactly what broke the last
 * deploy, so the only thing that goes on the order row is the running
 * DECIMAL total (`refundedAmount`).
 *
 * `refundId` carries a UNIQUE index and IS the idempotency guard: the service mints
 * it deterministically from (orderId, prior refunded total), so a replayed request
 * collides here and the duplicate insert is swallowed instead of moving money twice.
 *
 * Written by services/ondcOrderRefund.js; never updated or deleted.
 */
const ondcOrderRefunds = sequelizeConfig.define('ondcOrderRefunds', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },

    ondcOrderId: {
        type: Sequelize.BIGINT,
        allowNull: false
    },
    // ondcOrders.transactionId — one per seller order, the reliable join key.
    transactionId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // ondcOrders.paymentRef (= orders.corporateTxnId). Shared across the whole
    // checkout, which is why a single seller order's refund is always partial.
    paymentRef: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // The refund_id sent to Cashfree. UNIQUE — see the file comment.
    refundId: {
        type: Sequelize.STRING(120),
        allowNull: false
    },

    amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
    },
    reason: {
        type: Sequelize.TEXT,
        allowNull: true
    },

    // ---- who bore this refund ----
    // The Easy Split vendor debited via Cashfree's refund_splits, or null when the
    // refund was unattributed (no split on the order, or the account rejected the
    // field) and Peko therefore bore all of it.
    splitVendorId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // Taken off the seller's Easy Split allocation. Summed across the ledger to cap
    // the vendor at splitAmount — Cashfree cannot debit a vendor more than it allocated.
    vendorAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    // Taken off Peko's balance: the platform-fee share, plus everything when the
    // refund could not be attributed. vendorAmount + merchantAmount === amount.
    merchantAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },

    // PENDING (id claimed, gateway call in flight) | OK | FAILED.
    // The cap sums everything except FAILED — see sumOndcOrderRefunds.
    status: {
        type: Sequelize.STRING(16),
        allowNull: false
    },
    // Cashfree's own refund_status (PENDING | SUCCESS | CANCELLED), when it answered.
    gatewayRefundStatus: {
        type: Sequelize.STRING(24),
        allowNull: true
    },
    // Cashfree's response (or error) body verbatim.
    responseBody: {
        type: Sequelize.JSON,
        allowNull: true
    },
    error: {
        type: Sequelize.TEXT,
        allowNull: true
    },

    // The admin who authorised it (req.user.id), for accountability.
    initiatedByUserId: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    logTraceId: {
        type: Sequelize.STRING,
        allowNull: true
    },
})

const WANTED_INDEXES = [
    // THE idempotency guard — a replayed refund collides here.
    { name: 'ondc_order_refunds_refund_id', fields: ['refundId'], unique: true },
    { name: 'ondc_order_refunds_order', fields: ['ondcOrderId'] },
    { name: 'ondc_order_refunds_payment_ref', fields: ['paymentRef'] },
]

// Added-later columns, patched idempotently on boot (ondc_order.js pattern).
const WANTED_COLUMNS = {
    splitVendorId: { type: Sequelize.STRING, allowNull: true },
    vendorAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    merchantAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
}

/**
 * sync({force:false}) creates the table if missing; columns/indexes are added
 * idempotently on every boot (safe to re-run, self-heals).
 */
const ensureOndcOrderRefundsTable = async () => {
    await ondcOrderRefunds.sync({ force: false })
    const qi = ondcOrderRefunds.sequelize.getQueryInterface()
    const tableName = ondcOrderRefunds.getTableName()
    const failures = []

    const describe = await qi.describeTable(tableName)
    for (const [column, definition] of Object.entries(WANTED_COLUMNS)) {
        if (describe[column]) continue
        try {
            await qi.addColumn(tableName, column, definition)
        } catch (error) {
            failures.push(`column ${column}: ${error?.message || error}`)
        }
    }

    const existing = await qi.showIndex(tableName)
    const existingNames = new Set(existing.map((i) => i.name))
    for (const idx of WANTED_INDEXES) {
        if (existingNames.has(idx.name)) continue
        try {
            await qi.addIndex(tableName, idx.fields, { name: idx.name, unique: idx.unique || false })
        } catch (error) {
            failures.push(`index ${idx.name}: ${error?.message || error}`)
        }
    }

    if (failures.length) {
        // Named and thrown rather than swallowed — a missing refundId unique index
        // silently removes the double-refund guard.
        throw new Error(
            `ondcOrderRefunds schema incomplete — ${failures.length} change(s) rejected: ${failures.join('; ')}`
        )
    }
}

ensureOndcOrderRefundsTable()
    .then(() => console.log("ondcOrderRefunds table is ready"))
    .catch((error) => console.error("Error preparing ondcOrderRefunds table:", error))

module.exports = ondcOrderRefunds
