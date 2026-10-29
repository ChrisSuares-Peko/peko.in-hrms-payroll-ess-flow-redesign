'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * One row per captured Office Supplies checkout on the confirm-after-payment path
 * (services/ondcConfirmAfterPayment.js). paymentGateway creates it from the Cashfree
 * payment callback when it sends the sellers' /confirm; purchase settles it. The
 * per-seller half is ondcConfirmAttempts. This entity owns the schema — paymentGateway
 * only declares the table (paymentGateway/models/entities/ondc_confirm_readwrite.js).
 *
 * It exists so three things happen exactly once per capture, whichever of the
 * on_confirm webhook or an overlapping checkout-result poll gets there first:
 *   - COMPLETED, once every seller attempt has settled (compare-and-set on status)
 *   - the ONE refund of the share no seller placed (compare-and-set on refundStatus)
 *   - the order-confirmation mail (its gate waits for COMPLETED)
 *
 * Deliberately not columns on ondcOrders: every consumer of that table treats a row
 * as a placed order, and a checkout that failed has no order at all.
 */
const ondcCheckoutConfirms = sequelizeConfig.define('ondcCheckoutConfirms', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },

    // Cashfree paymentRefId (= orders.corporateTxnId = ondcOrders.paymentRef).
    // UNIQUE: a repeated trigger for the same capture must find this row, not add one.
    paymentRef: {
        type: Sequelize.STRING(64),
        allowNull: false
    },
    // The buyer, resolved from paymentData exactly as loadPaymentContext does —
    // checkout-result only answers the buyer who paid.
    corporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    subCorporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    // Seller groups recorded as attempts.
    groupCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    // What Cashfree actually captured (payment_amount; pgAmount when absent) — the
    // base every refund is apportioned from.
    capturedAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
    },
    // When the capture was recorded (orders.createdAt). /confirm is not sent for a
    // capture older than the dispatch window — it is refunded instead.
    capturedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },

    // IN_PROGRESS -> COMPLETED
    status: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'IN_PROGRESS'
    },
    // CONFIRMED (every seller) | PARTIAL | FAILED (no seller) — set on COMPLETED.
    outcome: {
        type: Sequelize.STRING(16),
        allowNull: true
    },
    completedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },

    // The share of capturedAmount no seller placed; 0 when nothing is owed back.
    refundAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    // null (nothing requested) | PENDING (request in flight) | INITIATED | FAILED
    refundStatus: {
        type: Sequelize.STRING(16),
        allowNull: true
    },
    refundAttempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    refundRequestedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    refundError: {
        type: Sequelize.TEXT,
        allowNull: true
    },
}, {
    // Declared here as well as below so a freshly created table is unique from its
    // first row; WANTED_INDEXES heals a table that predates it.
    indexes: [{ name: 'ondc_checkout_confirms_payment_ref', fields: ['paymentRef'], unique: true }],
})

const WANTED_INDEXES = [
    { name: 'ondc_checkout_confirms_payment_ref', fields: ['paymentRef'], unique: true },
    { name: 'ondc_checkout_confirms_status', fields: ['status'] },
    { name: 'ondc_checkout_confirms_refund', fields: ['refundStatus', 'refundRequestedAt'] },
]

// Added-later columns, patched idempotently on boot (ondc_order.js pattern). None yet.
const WANTED_COLUMNS = {}

/**
 * sync({force:false}) creates the table if missing; columns/indexes are added
 * idempotently on every boot (safe to re-run, self-heals).
 */
const ensureOndcCheckoutConfirmsTable = async () => {
    await ondcCheckoutConfirms.sync({ force: false })
    const qi = ondcCheckoutConfirms.sequelize.getQueryInterface()
    const tableName = ondcCheckoutConfirms.getTableName()

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

ensureOndcCheckoutConfirmsTable()
    .then(() => console.log("ondcCheckoutConfirms table is ready"))
    .catch((error) => console.error("Error preparing ondcCheckoutConfirms table:", error))

module.exports = ondcCheckoutConfirms
