'use strict'
const Sequelize = require('sequelize')
const sequelizeConfig = require("../../configs/database/index");

/**
 * One row per CONFIRMED ONDC seller order (a confirmed group of the checkout —
 * one /confirm + on_confirm exchange). Captures the order details and the
 * seller's settlement account terms from on_confirm: the flattened settlement
 * columns are the reconciliation-queryable view of the FIRST entry of
 * payment["@ondc/org/settlement_details"], while the `payment` JSON keeps the
 * full payment block (incl. the whole settlement array) verbatim.
 */
const ondcOrders = sequelizeConfig.define('ondcOrders', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
    },

    // order identity — transactionId spans the whole search→confirm session
    transactionId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    // BPP-issued order id (some sellers omit it on on_confirm)
    orderId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // ONDC order state — set at /confirm (e.g. "Created") and kept current by
    // on_status thereafter (e.g. "Accepted"/"In-progress"/"Completed"/"Cancelled").
    // See updateOndcOrderStatus (models/use-cases/ondc_order.js) and
    // controllers/webhook/ondc.js onStatus.
    orderState: {
        type: Sequelize.STRING,
        allowNull: true
    },

    // buyer linkage — same naming as the carts table
    corporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    subCorporateUserId: {
        type: Sequelize.INTEGER,
        allowNull: true
    },

    // seller (BPP + provider)
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
        type: Sequelize.STRING,
        allowNull: true
    },
    city: {
        type: Sequelize.STRING,
        allowNull: true
    },

    // ============================================================
    // delivery estimate — derived from on_confirm fulfillments[]["@ondc/org/TAT"]
    // (an ISO-8601 duration, e.g. "P1DT1H"), resolved against the confirm
    // timestamp into an absolute date. Older rows predating this column are null.
    // ============================================================
    // raw TAT string kept for reference/debugging
    deliveryTat: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // confirmedAt + TAT
    expectedDeliveryDate: {
        type: Sequelize.DATE,
        allowNull: true
    },

    // amounts (quote total from on_confirm)
    totalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
    },
    currency: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // This order's share of the checkout platform fee (surcharge). For a
    // multi-seller checkout the full fee is split proportionally by seller
    // quote so history rows sum to what the user actually paid.
    platformFee: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
    },
    // Seller quote (totalAmount) + allocated platformFee — what the user paid
    // for this order row. Null on orders confirmed before this column existed.
    amountPaid: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
    },

    // ============================================================
    // payment + settlement terms (flattened from on_confirm payment for
    // reconciliation queries; the full block is in the `payment` JSON)
    // ============================================================
    paymentStatus: {
        type: Sequelize.STRING, // "PAID"
        allowNull: true
    },
    paymentType: {
        type: Sequelize.STRING, // "ON-ORDER"
        allowNull: true
    },
    collectedBy: {
        type: Sequelize.STRING, // "BAP"
        allowNull: true
    },
    // payment gateway reference (payment.params.transaction_id)
    paymentRef: {
        type: Sequelize.STRING,
        allowNull: true
    },
    settlementBasis: {
        type: Sequelize.STRING, // e.g. "delivery"
        allowNull: true
    },
    settlementWindow: {
        type: Sequelize.STRING, // ISO-8601 duration, e.g. "PT24H"
        allowNull: true
    },
    withholdingAmount: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // first settlement_details entry — the seller's payout account
    settlementType: {
        type: Sequelize.STRING, // "upi" | "neft" | ...
        allowNull: true
    },
    upiAddress: {
        type: Sequelize.STRING,
        allowNull: true
    },
    settlementBankAccountNo: {
        type: Sequelize.STRING,
        allowNull: true
    },
    settlementIfscCode: {
        type: Sequelize.STRING,
        allowNull: true
    },
    beneficiaryName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    bankName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    branchName: {
        type: Sequelize.STRING,
        allowNull: true
    },

    // ============================================================
    // full-fidelity JSON blobs from the confirmed order
    // ============================================================
    // the cart items this order covers ({productId, ondcProductId, productName,
    // productQuantity, returnable, cancellable, returnWindow}) plus
    // buyerFinderFeeType/buyerFinderFeeAmount — the fee declared on this order's
    // payment block, stamped onto every line so each ordered product records the
    // commercial it was sold under (see stampBuyerFinderFee in utils/ondc_helper.js)
    items: {
        type: Sequelize.JSON,
        allowNull: true
    },
    // mapped quote (total/items/deliveryCharge/otherCharges/rows/ttl)
    quote: {
        type: Sequelize.JSON,
        allowNull: true
    },
    // on_confirm order.billing (buyer name/address/contact)
    billing: {
        type: Sequelize.JSON,
        allowNull: true
    },
    // order.fulfillments — set at /confirm, OVERWRITTEN by every subsequent
    // on_status (TAT, tracking flag/tags, state, agent, start/end)
    fulfillments: {
        type: Sequelize.JSON,
        allowNull: true
    },
    // FULL on_confirm order.payment (incl. the settlement_details array)
    payment: {
        type: Sequelize.JSON,
        allowNull: true
    },
    // latest on_track message.tracking block, verbatim (id, location{gps,
    // time,updated_at}, url, status, tags) — overwritten on every on_track
    tracking: {
        type: Sequelize.JSON,
        allowNull: true
    },
    // Append-only order.state + Delivery/Return fulfillment codes. fulfillments
    // itself is the CURRENT snapshot (overwritten on every on_status); this is
    // how Track shows Order confirmed → In progress → Agent-assigned.
    statusHistory: {
        type: Sequelize.JSON,
        allowNull: true
    },
    // server-clock timestamps (NOT the BPP's own clock) of the last persisted
    // on_status / on_track callback — let getOndcOrderById throttle repeat
    // outbound /status /track calls and give the DTO a reliable tracking.updatedAt
    statusCheckedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    trackingCheckedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },

    // ============================================================
    // admin-triggered cancellation/return (see updateOndcOrderCancellation /
    // updateOndcOrderReturn in models/use-cases/ondc_order.js) — set once the
    // seller's on_cancel/on_update callback confirms the request. orderState
    // is also set to "Cancelled"/"Returned" at the same time.
    // ============================================================
    cancelReason: {
        type: Sequelize.STRING,
        allowNull: true
    },
    cancelledAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    returnReason: {
        type: Sequelize.STRING,
        allowNull: true
    },
    returnedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    // DigiDukaan return lifecycle (Return_Initiated … Liquidated / Rejected)
    returnStatus: {
        type: Sequelize.STRING(32),
        allowNull: true
    },
    returnRequestId: {
        type: Sequelize.STRING(64),
        allowNull: true
    },
    // items, reasonId, images, settlementSent, refundTriggered, etc.
    returnMeta: {
        type: Sequelize.JSON,
        allowNull: true
    },
    returnRefundedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },

    // order.cancellation_terms — per-fulfillment-state cancellation fee
    // schedule the seller declared (e.g. 0% before pickup, 100% after).
    // Captured at /confirm and REFRESHED on every on_status (unlike
    // items/quote/billing, this is genuinely time-varying — the applicable
    // fee changes as the fulfillment progresses). See
    // getApplicableCancellationFee (utils/ondc_helper.js) for resolving the
    // fee that applies to the order's CURRENT fulfillment state.
    cancellationTerms: {
        type: Sequelize.JSON,
        allowNull: true
    },

    // on_status message.order.documents, verbatim — [{ url, label }], where the
    // seller's invoice arrives as label "Invoice". Stored as sent and interpreted at
    // read time (getInvoiceDocument in utils/ondcDocuments.js), like fulfillments.
    documents: {
        type: Sequelize.JSON,
        allowNull: true
    },
    // Send-once lock for the invoice mail — claimed with a compare-and-set from NULL.
    // on_status repeats on every poll cycle carrying the same documents, so without
    // this the buyer would be mailed the same invoice every hour.
    invoiceEmailSentAt: {
        type: Sequelize.DATE,
        allowNull: true
    },

    // --- Cashfree Easy Split: how this seller's share was settled ---
    // Easy Split vendor the seller's cut was routed to (ondcSellers.cashfreeVendorId)
    splitVendorId: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // SPLIT | SKIPPED | FAILED — null when Easy Split is switched off
    splitStatus: {
        type: Sequelize.STRING,
        allowNull: true
    },
    // What Cashfree actually allocated to the seller — NET of the buyer finder
    // fee when that deduction is enabled. Doubles as the refund cap, so it must
    // always equal the amount sent in the split write.
    splitAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
    },
    // The seller's quote total before the finder fee. Null on rows written
    // before the deduction existed; equal to splitAmount when no fee was taken.
    splitGrossAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
    },
    // Buyer finder fee withheld from this seller's allocation (0 when disabled).
    // splitGrossAmount - buyerFinderFeeDeducted === splitAmount.
    buyerFinderFeeDeducted: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },
    // why it was skipped/failed, e.g. masked_settlement_details
    splitError: {
        type: Sequelize.TEXT,
        allowNull: true
    },

    // ============================================================
    // Return-window payout hold — WHEN the seller's split (splitStatus above) is
    // allowed to SETTLE, via the Easy Split defer-settlement API. The split rule
    // itself is unchanged. RELEASE is scheduler/services/ondcSellerPayout.js.
    // ============================================================
    // WRITE-ONCE server-observed delivery, from the Delivery fulfillment's
    // end.time.timestamp on the first on_status reporting "Order-delivered". A
    // later on_status must never restart the return clock.
    deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    // The ISO-8601 window applied — longest @ondc/org/return_window across the
    // returnable quote.rows[], or the platform default. Kept raw for audit:
    // payoutDueAt alone can't tell you why it landed where it did.
    // STRING(16), not the default 255: values are short ISO-8601 durations
    // ("P1D", "PT12H", "P1DT1H"). ondcOrders already carries ~28 VARCHAR(255)
    // columns and sits at InnoDB's row-size limit — a 255-wide column here costs
    // 1020 bytes of that budget (utf8mb4) and the ALTER is rejected outright.
    returnWindow: {
        type: Sequelize.STRING(16),
        allowNull: true
    },
    // deliveredAt + returnWindow + returnWindowBuffer. The sweep's trigger.
    payoutDueAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    // HELD | RELEASED | BLOCKED (return/cancel/open issue) | RELEASE_FAILED |
    // NOT_APPLICABLE (no split to hold) | RELEASING — transient claim marker so two
    // overlapping sweeps can't both release one order (claimOndcOrderPayout);
    // recovered by unstickStalePayouts if a pass dies mid-call.
    // STRING(24) for the same row-size reason as returnWindow above — the longest
    // value is "NOT_APPLICABLE" (14 chars).
    payoutStatus: {
        type: Sequelize.STRING(24),
        allowNull: true
    },
    // Last eligibility date Cashfree ACCEPTED — the real truth about whether the
    // money is still held, since it is what the gateway acts on.
    payoutEligibilityDate: {
        type: Sequelize.DATE,
        allowNull: true
    },
    payoutReleasedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
    payoutAttempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    payoutError: {
        type: Sequelize.TEXT,
        allowNull: true
    },

    // Running total of admin-issued buyer refunds on this order, denormalised from
    // the ondcOrderRefunds ledger (which stays authoritative) so the admin screen
    // and the cap check don't need a SUM on every read.
    //
    // DECIMAL, not a status STRING, on purpose: this table is at InnoDB's row-size
    // limit, where a VARCHAR(255) costs 1020 bytes and gets the ALTER rejected.
    // A DECIMAL is 6 bytes. Display state is derived from `> 0`.
    refundedAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
    },

    // When the internal team was alerted that this order blew its delivery TAT.
    // Doubles as the sweep's lock: it is claimed with a compare-and-set from NULL
    // before the mail is sent, so overlapping passes can't double-alert, and a
    // non-null value is what makes the alert once-per-order.
    //
    // A DATE (5 bytes) rather than a status STRING — see refundedAmount above on
    // this table's InnoDB row-size ceiling.
    tatBreachNotifiedAt: {
        type: Sequelize.DATE,
        allowNull: true
    },
})

const WANTED_INDEXES = [
    { name: 'ondc_orders_transaction_id', fields: ['transactionId'] },
    { name: 'ondc_orders_order_id', fields: ['orderId'] },
    { name: 'ondc_orders_corporate_user', fields: ['corporateUserId'] },
    // The sweep's two hot queries: due payouts, and undelivered orders past their ETA.
    { name: 'ondc_orders_payout_due', fields: ['payoutStatus', 'payoutDueAt'] },
    { name: 'ondc_orders_delivered_at', fields: ['deliveredAt'] },
    // The TAT-breach sweep's query: unnotified orders, oldest promise first.
    { name: 'ondc_orders_tat_breach', fields: ['tatBreachNotifiedAt', 'expectedDeliveryDate'] },
]

// Columns added after the table's initial release — sync() never alters an
// existing table, so these are added idempotently on boot (self-heals).
const WANTED_COLUMNS = {
    deliveryTat: { type: Sequelize.STRING, allowNull: true },
    expectedDeliveryDate: { type: Sequelize.DATE, allowNull: true },
    tracking: { type: Sequelize.JSON, allowNull: true },
    statusHistory: { type: Sequelize.JSON, allowNull: true },
    statusCheckedAt: { type: Sequelize.DATE, allowNull: true },
    trackingCheckedAt: { type: Sequelize.DATE, allowNull: true },
    cancelReason: { type: Sequelize.STRING, allowNull: true },
    cancelledAt: { type: Sequelize.DATE, allowNull: true },
    returnReason: { type: Sequelize.STRING, allowNull: true },
    returnedAt: { type: Sequelize.DATE, allowNull: true },
    returnStatus: { type: Sequelize.STRING(32), allowNull: true },
    returnRequestId: { type: Sequelize.STRING(64), allowNull: true },
    returnMeta: { type: Sequelize.JSON, allowNull: true },
    returnRefundedAt: { type: Sequelize.DATE, allowNull: true },
    cancellationTerms: { type: Sequelize.JSON, allowNull: true },
    platformFee: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    amountPaid: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
    splitVendorId: { type: Sequelize.STRING, allowNull: true },
    splitStatus: { type: Sequelize.STRING, allowNull: true },
    splitAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
    splitGrossAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
    buyerFinderFeeDeducted: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    splitError: { type: Sequelize.TEXT, allowNull: true },
    deliveredAt: { type: Sequelize.DATE, allowNull: true },
    returnWindow: { type: Sequelize.STRING(16), allowNull: true },
    payoutDueAt: { type: Sequelize.DATE, allowNull: true },
    payoutStatus: { type: Sequelize.STRING(24), allowNull: true },
    payoutEligibilityDate: { type: Sequelize.DATE, allowNull: true },
    payoutReleasedAt: { type: Sequelize.DATE, allowNull: true },
    payoutAttempts: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    payoutError: { type: Sequelize.TEXT, allowNull: true },
    refundedAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    tatBreachNotifiedAt: { type: Sequelize.DATE, allowNull: true },
    documents: { type: Sequelize.JSON, allowNull: true },
    invoiceEmailSentAt: { type: Sequelize.DATE, allowNull: true },
}

/**
 * sync({force:false}) creates the table if missing; columns/indexes are added
 * idempotently on every boot (safe to re-run, self-heals).
 */
const ensureOndcOrdersTable = async () => {
    await ondcOrders.sync({ force: false })
    const qi = ondcOrders.sequelize.getQueryInterface()
    const tableName = ondcOrders.getTableName()

    // Each add is guarded individually and the failure is NAMED. Previously one
    // rejected ALTER aborted the whole loop, so every later column and both
    // indexes were silently skipped too — and because the caller only
    // console.error's, the first symptom was a 500 from every ondcOrders query
    // ("Unknown column 'payoutStatus' in 'field list'"), since the model declares
    // the column and Sequelize names it in every SELECT.
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
            await qi.addIndex(tableName, idx.fields, { name: idx.name })
        } catch (error) {
            failures.push(`index ${idx.name}: ${error?.message || error}`)
        }
    }

    if (failures.length) {
        // Thrown so the caller's .catch logs it. Any column listed here is MISSING
        // from the table while still declared on the model, which breaks every
        // query against it — treat it as a release blocker, not a warning.
        throw new Error(
            `ondcOrders schema incomplete — ${failures.length} change(s) rejected: ${failures.join('; ')}`
        )
    }
}

ensureOndcOrdersTable()
    .then(() => console.log("ondcOrders table is ready"))
    .catch((error) => console.error("Error preparing ondcOrders table:", error))

module.exports = ondcOrders
