'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * Append-only trail of every settlement-timing call made to Cashfree for a seller's
 * Easy Split share — one row per HTTP attempt, success or failure.
 *
 * A separate table rather than more columns on ondcOrders because the order row only
 * holds the CURRENT state, overwritten on each transition. The question people
 * actually ask about a payout is "what did we send, when, and what did Cashfree say",
 * which has to survive that overwrite. Money movement gets a ledger, not a field.
 *
 * Written by setSettlementEligibility; never updated or deleted.
 */
const ondcSellerPayouts = sequelizeConfig.define('ondcSellerPayouts', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },

    // ondcOrders.id. Nullable: the PARK call comes from the Easy Split coordinator,
    // which knows the transactionId but has not necessarily re-read the order row.
    ondcOrderId: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    // ondcOrders.transactionId — the reliable join key, one per seller group.
    transactionId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // Cashfree order reference (ondcOrders.paymentRef / orders.corporateTxnId)
    paymentRef: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // Cashfree-side order id the split was written against (what the defer URL is
    // keyed on), resolved from orders.paymentModeResponse.
    gatewayOrderId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // Easy Split vendor the seller's cut routes to (ondcSellers.cashfreeVendorId)
    splitVendorId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // Snapshotted so the ledger stands alone if the order row is later corrected.
    amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
    },

    // PARK (far out, right after the split) | NARROW (to deliveredAt + return
    // window, on delivery) | RELEASE (to now; the seller gets settled)
    action: {
        type: Sequelize.STRING,
        allowNull: false
    },
    // The date sent in settlementEligibilityDateUpdate, as an absolute instant.
    requestedEligibilityDate: {
        type: Sequelize.DATE,
        allowNull: true
    },

    // OK | FAILED | SKIPPED
    status: {
        type: Sequelize.STRING,
        allowNull: false
    },
    httpStatus: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    // Cashfree's response (or error) body verbatim — the only record of what the
    // gateway actually said.
    responseBody: {
        type: Sequelize.JSON,
        allowNull: true
    },
    // MAX_ELIGIBILITY_EXCEEDED here means deferMaxDays disagrees with the account's
    // own "Defer by Days" ceiling.
    error: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    // Correlates this row with the request/cron log lines for the same operation.
    logTraceId: {
        type: Sequelize.STRING,
        allowNull: true
    },
})

const WANTED_INDEXES = [
    { name: 'ondc_seller_payouts_order', fields: ['ondcOrderId'] },
    { name: 'ondc_seller_payouts_transaction', fields: ['transactionId'] },
    { name: 'ondc_seller_payouts_vendor', fields: ['splitVendorId'] },
    { name: 'ondc_seller_payouts_action', fields: ['action', 'status'] },
]

// Added-later columns, patched idempotently on boot (ondc_order.js pattern). None yet.
const WANTED_COLUMNS = {}

/**
 * sync({force:false}) creates the table if missing; columns/indexes are added
 * idempotently on every boot (safe to re-run, self-heals).
 */
const ensureOndcSellerPayoutsTable = async () => {
    await ondcSellerPayouts.sync({ force: false })
    const qi = ondcSellerPayouts.sequelize.getQueryInterface()
    const tableName = ondcSellerPayouts.getTableName()

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
            await qi.addIndex(tableName, idx.fields, { name: idx.name })
        }
    }
}

ensureOndcSellerPayoutsTable()
    .then(() => console.log("ondcSellerPayouts table is ready"))
    .catch((error) => console.error("Error preparing ondcSellerPayouts table:", error))

module.exports = ondcSellerPayouts
