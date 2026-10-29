const { Op, fn, col, literal } = require("sequelize");
const asyncHandler = require('./../../middlewares/async');
const ondcOrders = require('./../entities/ondc_order');
const { getApplicableCancellationFee, getTrackingSummary } = require('./../../utils/ondc_helper');
const { appendStatusHistory, diffStatusHistory } = require('./../../utils/ondcStatusHistory');
const { applyCreatedAtRange } = require('./../../utils/dateRangeFilter');
const { containsLike } = require('./../../utils/escapeLike');

/**
 * Persist one confirmed ONDC seller order (order details + settlement terms).
 * The caller wraps this in its own try/catch — a failed write must not fail
 * the confirm response (the order IS already placed with the seller) but must
 * be logged loudly for manual reconciliation.
 */
exports.createOndcOrder = asyncHandler(async (data) => {
    const statusHistory = appendStatusHistory([], {
        orderState: data.orderState,
        fulfillments: data.fulfillments,
    }, "on_confirm");
    return await ondcOrders.create({ ...data, statusHistory });
})

/**
 * Orders for one Cashfree payment reference (corporateTxnId), scoped to the buyer.
 * Used by the post-payment page that polls checkout outcome after /complete.
 */
exports.findOndcOrdersByPaymentRef = asyncHandler(async ({
    paymentRef,
    corporateUserId,
    subCorporateUserId,
}) => {
    if (!paymentRef) return [];
    const where = subCorporateUserId
        ? { paymentRef: String(paymentRef), subCorporateUserId }
        : { paymentRef: String(paymentRef), corporateUserId };
    return await ondcOrders.findAll({
        where,
        order: [['id', 'ASC']],
        raw: true,
    });
});

/**
 * Orders for a paymentRef that were persisted without buyer linkage
 * (PG context miss on on_confirm). Never returns rows belonging to another buyer.
 */
exports.findOrphanOndcOrdersByPaymentRef = asyncHandler(async ({ paymentRef }) => {
    if (!paymentRef) return [];
    return await ondcOrders.findAll({
        where: {
            paymentRef: String(paymentRef),
            corporateUserId: null,
            subCorporateUserId: null,
        },
        order: [['id', 'ASC']],
        raw: true,
    });
});

/**
 * Attach the polling buyer to orphan rows so Order History can see them.
 */
exports.healOndcOrderBuyer = asyncHandler(async ({
    paymentRef,
    corporateUserId = null,
    subCorporateUserId = null,
}) => {
    if (!paymentRef) return [0];
    if (corporateUserId == null && subCorporateUserId == null) return [0];
    return await ondcOrders.update(
        {
            corporateUserId: corporateUserId || null,
            subCorporateUserId: subCorporateUserId || null,
        },
        {
            where: {
                paymentRef: String(paymentRef),
                corporateUserId: null,
                subCorporateUserId: null,
            },
        },
    );
});

/**
 * Record the Cashfree Easy Split outcome for one seller's order.
 * `splitStatus` is SPLIT | SKIPPED | FAILED; `splitError` carries the reason slug
 * (masked_settlement_details, vendor_create_failed, …) for the non-SPLIT cases.
 */
exports.updateOndcOrderSplit = asyncHandler(async ({
    transactionId,
    splitVendorId = null,
    splitStatus,
    splitAmount = null,
    splitGrossAmount = null,
    buyerFinderFeeDeducted = 0,
    splitError = null,
}) => {
    if (!transactionId) return [0]
    return await ondcOrders.update(
        // splitAmount is NET of the buyer finder fee (what Cashfree allocated and
        // therefore the refund cap); splitGrossAmount is the seller's quote total
        // before it. The pair keeps the deduction auditable.
        { splitVendorId, splitStatus, splitAmount, splitGrossAmount, buyerFinderFeeDeducted, splitError },
        { where: { transactionId } },
    )
})

/**
 * Orders of a buyer, newest first — for the future ONDC order-history wiring.
 * Pass exactly one of corporateUserId / subCorporateUserId (cart semantics).
 */
exports.findOrdersByUser = asyncHandler(async ({ corporateUserId, subCorporateUserId }) => {
    const where = subCorporateUserId ? { subCorporateUserId } : { corporateUserId }
    return await ondcOrders.findAll({
        where,
        order: [['id', 'DESC']],
        raw: true,
    })
})

/**
 * Paginated/filterable order history for the Order History page. Pass exactly
 * one of corporateUserId / subCorporateUserId (cart semantics). `search`
 * matches orderId/transactionId/vendorName; `from`/`to` bound createdAt.
 *
 * @returns {Promise<{rows:Array, count:number}>}
 */
exports.findAllOndcOrdersAndCount = asyncHandler(async ({
    corporateUserId,
    subCorporateUserId,
    search,
    from,
    to,
    offset = 0,
    limit = 10,
}) => {
    const where = subCorporateUserId ? { subCorporateUserId } : { corporateUserId }

    if (search) {
        const like = { [Op.like]: containsLike(search) }
        where[Op.or] = [{ orderId: like }, { transactionId: like }, { vendorName: like }]
    }
    applyCreatedAtRange(where, from, to)

    return await ondcOrders.findAndCountAll({
        where,
        order: [['id', 'DESC']],
        offset,
        limit,
        raw: true,
    })
})

/**
 * Single confirmed order by id, scoped to the requesting buyer so one
 * corporate user can't fetch another's order by guessing an id. Pass exactly
 * one of corporateUserId / subCorporateUserId (cart semantics).
 */
exports.findOneOndcOrderById = asyncHandler(async ({ id, corporateUserId, subCorporateUserId }) => {
    const where = subCorporateUserId ? { id, subCorporateUserId } : { id, corporateUserId }
    return await ondcOrders.findOne({ where, raw: true })
})

/**
 * Update an order's live state from an on_status callback (solicited or an
 * UNSOLICITED seller push) — orderId/orderState/fulfillments/cancellationTerms
 * are the only fields on_status is allowed to overwrite; everything else
 * captured at /confirm (items, quote, billing, payment) stays write-once.
 * cancellationTerms is included here (unlike those) because the applicable
 * cancellation fee genuinely changes as the fulfillment progresses (e.g. 0%
 * before pickup, 100% after) — see getApplicableCancellationFee
 * (utils/ondc_helper.js). Only fields actually present on the callback are
 * written (a partial callback must never null out a previously-known value).
 * Scoped by transactionId — 1:1 with a confirmed seller order (see
 * confirmOndcOrder / validateOndcCart, which mint one transactionId per
 * seller group at /select time).
 *
 * Returns { affected, appended, row } — `appended` is the status events this
 * callback genuinely introduced (empty on a replay), which is what the buyer
 * notification emails fire on, and `row` is the PRE-update row so a caller can
 * see what changed. The old return was `[affected]`; both existing callers
 * (controllers/webhook/ondc.js onStatus/onUpdate) ignore the return value.
 */
exports.updateOndcOrderStatus = asyncHandler(async ({
    transactionId, orderId, orderState, fulfillments, cancellationTerms, documents, source = "on_status",
}) => {
    if (!transactionId) return { affected: 0, appended: [], row: null }
    const row = await ondcOrders.findOne({ where: { transactionId }, raw: true })
    if (!row) return { affected: 0, appended: [], row: null }
    const nextState = orderState !== undefined ? orderState : row.orderState
    const nextFulfillments = fulfillments !== undefined ? fulfillments : row.fulfillments
    const { history, appended } = diffStatusHistory(row.statusHistory, {
        orderState: nextState,
        fulfillments: nextFulfillments,
    }, source)
    const changes = {
        statusCheckedAt: new Date(),
        statusHistory: history,
    }
    if (orderId !== undefined && orderId !== null) changes.orderId = orderId
    if (orderState !== undefined) changes.orderState = orderState
    if (fulfillments !== undefined) changes.fulfillments = fulfillments
    if (cancellationTerms !== undefined) changes.cancellationTerms = cancellationTerms
    // Non-empty check, not just `!== undefined`: sellers send `documents: []` freely
    // on every later callback, and that must not wipe an invoice we already hold.
    if (Array.isArray(documents) && documents.length) changes.documents = documents
    const [affected] = await ondcOrders.update(changes, { where: { transactionId } })
    return { affected, appended, row }
})

/**
 * Persist the latest on_track tracking block (courier location/url/status) —
 * verbatim `message.tracking` from the callback. Scoped by transactionId.
 */
exports.updateOndcOrderTracking = asyncHandler(async ({ transactionId, tracking }) => {
    if (!transactionId) return [0]
    return await ondcOrders.update(
        { tracking: tracking || null, trackingCheckedAt: new Date() },
        { where: { transactionId } }
    )
})

/**
 * Active (non-terminal) ONDC orders eligible for an admin cancel/return
 * action — since there's no customer-initiated ONDC cancel/return request
 * queue yet, the admin Cancel & Refunds / Return Requests screens surface
 * every order not already Cancelled/Returned and let the admin act directly.
 */
exports.findOndcOrdersForAdminAction = asyncHandler(async ({ searchText, from, to } = {}) => {
    const where = { orderState: { [Op.or]: [{ [Op.notIn]: ['Cancelled', 'Returned'] }, { [Op.is]: null }] } }
    if (searchText) {
        const like = { [Op.like]: containsLike(searchText) }
        where[Op.or] = [{ orderId: like }, { transactionId: like }, { vendorName: like }]
    }
    applyCreatedAtRange(where, from, to)
    const rows = await ondcOrders.findAll({ where, order: [['id', 'DESC']], raw: true })
    // Surfaced so the admin action screens can show the fee/tracking status
    // BEFORE someone clicks cancel/return, rather than discovering it only
    // after the seller NACKs, charges a fee, or the order was already out
    // for delivery.
    return rows.map((row) => ({
        ...row,
        cancellationFeePercent: getApplicableCancellationFee(row),
        tracking: getTrackingSummary(row),
    }))
})

/**
 * General-purpose paginated/filterable admin order listing — the "All
 * orders" tab. Unlike findOndcOrdersForAdminAction (scoped to orders still
 * eligible for a direct admin cancel/return), this returns every order
 * regardless of state. `orderIds`, when passed, restricts the result to that
 * id set — used for the "needs attention" filter (Part E: orders with a
 * non-terminal linked issue; computed by the caller via ondc_issue.js and
 * passed in here, since there's no cross-table association declared on
 * either Sequelize model).
 */
exports.findAllOndcOrdersForAdmin = asyncHandler(async ({
    status, sellerName, searchText, orderIds, from, to, delayedOnly = false, returnsOnly = false,
    noEtaFallbackHours = 24, now = new Date(),
    sort = "DESC", sortField = "createdAt", offset = 0, limit = 10,
} = {}) => {
    const where = {}
    if (status) where.orderState = status
    if (sellerName) where.vendorName = { [Op.like]: containsLike(sellerName) }
    if (Array.isArray(orderIds)) where.id = { [Op.in]: orderIds }
    if (searchText) {
        const like = { [Op.like]: containsLike(searchText) }
        where[Op.or] = [{ orderId: like }, { transactionId: like }, { vendorName: like }]
    }
    // "Returns only": the Return Requests tab. NOT `orderState = 'Returned'` — that is
    // only set once a return reaches Liquidated (see ondcReturnLifecycle's markReturned),
    // so keying on it hides every live request: Return_Initiated/Approved/Picked leave
    // orderState at 'Completed' and record the stage in returnStatus alone. returnedAt is
    // checked too, for rows returned before the returnStatus column existed.
    //
    // Goes in Op.and, not Op.or — searchText above already owns where[Op.or], and
    // assigning there would silently drop the operator's search.
    if (returnsOnly) {
        where[Op.and] = [
            ...(where[Op.and] || []),
            { [Op.or]: [{ returnStatus: { [Op.ne]: null } }, { returnedAt: { [Op.ne]: null } }] },
        ]
    }
    // "Delayed only": past the seller's ETA (or placed + fallback when the BPP
    // declared no TAT) and still undelivered. Unlike the needsAttention filter this
    // is expressible as a plain WHERE, so it stays in the query rather than becoming
    // an id-set pre-query. Same predicate the scheduler's TAT-breach alert uses
    // (scheduler/services/ondcTatBreach.js) — keep the two in step, or the badge
    // and the alert will disagree about which orders are late.
    if (delayedOnly) {
        const noEtaBefore = new Date(now.getTime() - noEtaFallbackHours * 3600000)
        where.deliveredAt = { [Op.is]: null }
        where.orderState = status || { [Op.or]: [{ [Op.notIn]: ['Cancelled'] }, { [Op.is]: null }] }
        where[Op.and] = [
            ...(where[Op.and] || []),
            {
                [Op.or]: [
                    { expectedDeliveryDate: { [Op.ne]: null, [Op.lte]: now } },
                    { expectedDeliveryDate: { [Op.is]: null }, createdAt: { [Op.lte]: noEtaBefore } },
                ],
            },
        ]
    }
    applyCreatedAtRange(where, from, to)
    const { count, rows } = await ondcOrders.findAndCountAll({
        where,
        order: [[sortField, sort === "ASC" ? "ASC" : "DESC"]],
        offset,
        limit,
        raw: true,
    })
    return {
        recordsTotal: count,
        rows: rows.map((row) => ({
            ...row,
            tracking: getTrackingSummary(row),
        })),
    }
})

/**
 * Orders that blew their delivery promise and are still undelivered — the buyer
 * "delivery delayed" notice (spec template 9, the seller-has-gone-quiet trigger).
 *
 * Same predicate as the admin panel's Delayed badge and the scheduler's TAT-breach
 * alert, so the three cannot disagree about which orders are late: past
 * expectedDeliveryDate, or placed more than noEtaFallbackHours ago when the BPP
 * declared no TAT. Terminal orders are excluded — a cancelled order is not late.
 *
 * Send-once is NOT expressed here: it belongs to ondcOrderNotifications, so this
 * returns the same rows every pass and the claim decides. That is deliberate — a
 * row we skipped because it had no recipient stays eligible.
 */
exports.findDelayedOndcOrders = asyncHandler(async ({
    now = new Date(), noEtaFallbackHours = 24, limit = 200,
} = {}) => {
    const noEtaBefore = new Date(now.getTime() - noEtaFallbackHours * 3600000)
    return await ondcOrders.findAll({
        where: {
            deliveredAt: { [Op.is]: null },
            cancelledAt: { [Op.is]: null },
            orderState: { [Op.or]: [{ [Op.notIn]: ['Cancelled', 'Returned'] }, { [Op.is]: null }] },
            [Op.or]: [
                { expectedDeliveryDate: { [Op.ne]: null, [Op.lte]: now } },
                { expectedDeliveryDate: { [Op.is]: null }, createdAt: { [Op.lte]: noEtaBefore } },
            ],
        },
        // Oldest promise first — most overdue, most worth an apology.
        order: [['expectedDeliveryDate', 'ASC']],
        limit,
        raw: true,
    })
})

/** Distinct seller/vendor names across all ONDC orders — the "Seller" filter dropdown. */
exports.findDistinctOndcVendorNames = asyncHandler(async () => {
    const rows = await ondcOrders.findAll({
        attributes: [[fn("DISTINCT", col("vendorName")), "vendorName"]],
        where: { vendorName: { [Op.ne]: null } },
        order: [["vendorName", "ASC"]],
        raw: true,
    })
    return rows.map((r) => r.vendorName).filter(Boolean)
})

/**
 * Single order by id, UNSCOPED by buyer — for admin cancel/return approval,
 * where the acting admin isn't the order's own corporate/sub-corporate user.
 * Never expose this lookup to buyer-facing routes.
 */
exports.findOndcOrderByIdAdmin = asyncHandler(async (id) => {
    return await ondcOrders.findOne({ where: { id }, raw: true })
})

/**
 * Mark an order Cancelled after the seller's on_cancel callback confirms it
 * (called by the admin cancellation-approval controller once its
 * waitForOnCancel resolves successfully — never called from the webhook
 * itself, mirroring how /confirm's controller — not onConfirm — persists).
 */
exports.updateOndcOrderCancellation = asyncHandler(async ({ id, cancelReason }) => {
    if (!id) return [0]
    const row = await ondcOrders.findOne({ where: { id }, raw: true })
    if (!row) return [0]
    const statusHistory = appendStatusHistory(row.statusHistory, {
        orderState: "Cancelled",
        fulfillments: row.fulfillments,
    }, "on_cancel")
    return await ondcOrders.update(
        { orderState: "Cancelled", cancelReason: cancelReason || null, cancelledAt: new Date(), statusHistory },
        { where: { id } }
    )
})

/**
 * Mark an order Returned after a successful DigiDukaan return (Liquidated /
 * reverse-QC complete). Prefer updateOndcOrderReturnLifecycle for in-flight states.
 */
exports.updateOndcOrderReturn = asyncHandler(async ({ id, returnReason, returnStatus = "Returned", returnRequestId = null, returnMeta = null }) => {
    if (!id) return [0]
    const patch = {
        orderState: "Returned",
        returnReason: returnReason || null,
        returnedAt: new Date(),
        returnStatus: returnStatus || "Returned",
    }
    if (returnRequestId != null) patch.returnRequestId = returnRequestId
    if (returnMeta != null) patch.returnMeta = returnMeta
    return await ondcOrders.update(patch, { where: { id } })
})

/**
 * Persist DigiDukaan return lifecycle fields without forcing orderState Returned
 * (used for Return_Initiated / Approved / Rejected / in-flight).
 */
exports.updateOndcOrderReturnLifecycle = asyncHandler(async ({
    id,
    returnStatus = null,
    returnRequestId = null,
    returnReason = null,
    returnMeta = null,
    fulfillments = null,
    markReturned = false,
    returnRefundedAt = undefined,
}) => {
    if (!id) return [0]
    const patch = {}
    if (returnStatus != null) patch.returnStatus = returnStatus
    if (returnRequestId != null) patch.returnRequestId = returnRequestId
    if (returnReason != null) patch.returnReason = returnReason
    if (returnMeta != null) patch.returnMeta = returnMeta
    if (fulfillments != null) patch.fulfillments = fulfillments
    if (markReturned) {
        patch.orderState = "Returned"
        patch.returnedAt = new Date()
    }
    if (returnRefundedAt !== undefined) patch.returnRefundedAt = returnRefundedAt
    if (!Object.keys(patch).length) return [0]
    return await ondcOrders.update(patch, { where: { id } })
})

/**
 * Stamp platform fee share + amountPaid on one confirmed seller order.
 */
exports.updateOndcOrderPaymentTotals = asyncHandler(async ({
    transactionId,
    platformFee = 0,
    amountPaid = null,
}) => {
    if (!transactionId) return [0]
    return await ondcOrders.update(
        {
            platformFee: platformFee ?? 0,
            amountPaid: amountPaid != null ? amountPaid : null,
        },
        { where: { transactionId: String(transactionId) } },
    )
})

// ============================================================
// Return-window payout hold — WHEN the seller's already-written split may settle.
// RELEASE runs in the scheduler (scheduler/services/ondcSellerPayout.js).
// ============================================================

/** Payout states needing no further action from the sweep. */
const TERMINAL_PAYOUT_STATUSES = ['RELEASED', 'BLOCKED', 'NOT_APPLICABLE']
exports.TERMINAL_PAYOUT_STATUSES = TERMINAL_PAYOUT_STATUSES

/** Order states that must stop a pending payout. */
const PAYOUT_BLOCKING_ORDER_STATES = ['Cancelled', 'Returned']
exports.PAYOUT_BLOCKING_ORDER_STATES = PAYOUT_BLOCKING_ORDER_STATES

/**
 * Record the first observation that an order was delivered and derive its payout
 * schedule.
 *
 * WRITE-ONCE on deliveredAt, enforced in the WHERE clause rather than by a
 * read-then-write. ONDC callbacks are at-least-once and unsolicited pushes are
 * allowed, so on_status can carry "Order-delivered" many times; if a later one
 * re-stamped deliveredAt, every repeat would push payoutDueAt further out and the
 * seller might never be paid. Returns [0] when delivery was already recorded.
 */
exports.markOndcOrderDelivered = asyncHandler(async ({
    transactionId, deliveredAt, returnWindow = null, payoutDueAt = null, payoutStatus = 'HELD',
}) => {
    if (!transactionId || !deliveredAt) return [0]
    return await ondcOrders.update(
        { deliveredAt, returnWindow, payoutDueAt, payoutStatus },
        { where: { transactionId: String(transactionId), deliveredAt: { [Op.is]: null } } },
    )
})

/**
 * Record a cancellation we learned about from a CALLBACK rather than from our own
 * /cancel request.
 *
 * An unsolicited seller cancel (stock-out, non-serviceable, LSP gave up) arrives as
 * on_cancel — which is notify-only, the authoritative write living in the controller
 * that awaits the waiter — or simply as on_status carrying state "Cancelled". Until
 * now neither path wrote cancelledAt or cancelReason, so a seller-cancelled order sat
 * in the DB with no record of why or when.
 *
 * WRITE-ONCE on cancelledAt, enforced in the WHERE clause like markOndcOrderDelivered:
 * ONDC callbacks are at-least-once, and the buyer's own cancel has already written
 * this row through updateOndcOrderCancellation, so this must lose that race silently
 * rather than overwrite the reason the buyer gave.
 *
 * @returns {Promise<number>} 1 = this call recorded the cancellation, 0 = already recorded
 */
exports.markOndcOrderCancelledFromCallback = asyncHandler(async ({
    transactionId, cancelReason = null, cancelledAt = new Date(),
}) => {
    if (!transactionId) return 0
    const [affected] = await ondcOrders.update(
        { orderState: 'Cancelled', cancelReason, cancelledAt },
        { where: { transactionId: String(transactionId), cancelledAt: { [Op.is]: null } } },
    )
    return affected
})

/**
 * Several orders by transactionId, UNSCOPED by buyer. Used where the caller already
 * holds the ids it just wrote (the confirm flow building its checkout email), so the
 * ids are not user input. Never hand a buyer-supplied list to this.
 */
exports.findOndcOrdersByTransactionIds = asyncHandler(async (transactionIds) => {
    const ids = (Array.isArray(transactionIds) ? transactionIds : [])
        .filter(Boolean)
        .map((id) => String(id))
    if (!ids.length) return []
    return await ondcOrders.findAll({
        where: { transactionId: { [Op.in]: ids } },
        order: [['id', 'ASC']],
        raw: true,
    })
})

/**
 * One order by transactionId, UNSCOPED by buyer — webhook and cron paths, where there
 * is no acting user. Never expose to a buyer-facing route (use findOneOndcOrderById).
 */
exports.findOndcOrderByTransactionId = asyncHandler(async (transactionId) => {
    if (!transactionId) return null
    return await ondcOrders.findOne({ where: { transactionId: String(transactionId) }, raw: true })
})

/**
 * Set the initial hold on a freshly-written split.
 *
 * Keyed on transactionId, the same key updateOndcOrderSplit uses. NOT paymentRef:
 * ondcOrders.paymentRef is whatever the BPP echoed in payment.params.transaction_id
 * (createOndcOrder in services/ondcOnConfirmPersist.js), so a paymentRef-keyed WHERE
 * can match zero rows — leaving payoutStatus NULL and the order invisible to the
 * sweep even though Cashfree was parked.
 *
 * Guarded on payoutStatus IS NULL so a redelivered on_confirm cannot reset an order
 * that has since been delivered, released, or blocked.
 */
exports.holdOndcOrderPayout = asyncHandler(async ({
    transactionId, payoutEligibilityDate = null, payoutError = null,
}) => {
    if (!transactionId) return [0]
    return await ondcOrders.update(
        { payoutStatus: 'HELD', payoutEligibilityDate, payoutError },
        { where: { transactionId: String(transactionId), payoutStatus: { [Op.is]: null } } },
    )
})

/** Nothing to hold — split SKIPPED/FAILED, or the hold is off. Same NULL guard. */
exports.markOndcOrderPayoutNotApplicable = asyncHandler(async ({ transactionId, payoutError = null }) => {
    if (!transactionId) return [0]
    return await ondcOrders.update(
        { payoutStatus: 'NOT_APPLICABLE', payoutError },
        { where: { transactionId: String(transactionId), payoutStatus: { [Op.is]: null } } },
    )
})

/**
 * Orders whose return window has closed with money still held. payoutDueAt must be
 * non-null AND past — a HELD row with a null due date is not yet delivered.
 */
exports.findOndcOrdersDuePayout = asyncHandler(async ({ now = new Date(), limit = 200 } = {}) => {
    return await ondcOrders.findAll({
        where: { payoutStatus: 'HELD', payoutDueAt: { [Op.ne]: null, [Op.lte]: now } },
        order: [['payoutDueAt', 'ASC']], limit, raw: true,
    })
})

/** Previously-failed releases still within budget. Compared in SQL so a burnt row is never fetched. */
exports.findOndcOrdersPayoutRetryable = asyncHandler(async ({ maxAttempts = 5, limit = 100 } = {}) => {
    return await ondcOrders.findAll({
        where: { payoutStatus: 'RELEASE_FAILED', payoutAttempts: { [Op.lt]: maxAttempts } },
        order: [['payoutDueAt', 'ASC']], limit, raw: true,
    })
})

/**
 * Recover rows stranded in the transient RELEASING claim state. A pass killed between
 * claiming and writing the outcome leaves a row no query would pick up again, so the
 * seller's money would sit held indefinitely. The threshold is generous relative to
 * one Cashfree call, so an in-flight release is never stolen from a running pass.
 */
exports.unstickStalePayouts = asyncHandler(async ({ staleMinutes = 30, now = new Date() } = {}) => {
    const [affected] = await ondcOrders.update(
        { payoutStatus: 'RELEASE_FAILED', payoutError: 'stuck_in_releasing' },
        {
            where: {
                payoutStatus: 'RELEASING',
                updatedAt: { [Op.lte]: new Date(now.getTime() - staleMinutes * 60000) },
            },
        },
    )
    return affected
})

/**
 * Confirmed orders that should have arrived but were never reported delivered —
 * used by the scheduler delivery-status poll. Throttled on statusCheckedAt (the
 * server-clock time of the last persisted on_status) so hourly runs do not
 * hammer a BPP.
 *
 * expectedDeliveryDate is null whenever on_confirm carried no @ondc/org/TAT. Those
 * orders must still be polled — keying only on a non-null ETA would leave them
 * permanently unpolled, never seen as delivered, and never released until Cashfree's
 * own ceiling fires. They fall back to createdAt + noEtaFallbackHours.
 */
exports.findOndcOrdersAwaitingDelivery = asyncHandler(async ({
    now = new Date(), throttleHours = 6, noEtaFallbackHours = 24, limit = 200,
} = {}) => {
    const staleBefore = new Date(now.getTime() - throttleHours * 3600000)
    const noEtaBefore = new Date(now.getTime() - noEtaFallbackHours * 3600000)
    return await ondcOrders.findAll({
        where: {
            deliveredAt: { [Op.is]: null },
            orderId: { [Op.ne]: null },
            bppUri: { [Op.ne]: null },
            orderState: { [Op.or]: [{ [Op.notIn]: ['Cancelled', 'Returned'] }, { [Op.is]: null }] },
            [Op.and]: [
                {
                    [Op.or]: [
                        { expectedDeliveryDate: { [Op.ne]: null, [Op.lte]: now } },
                        { expectedDeliveryDate: { [Op.is]: null }, createdAt: { [Op.lte]: noEtaBefore } },
                    ],
                },
                {
                    [Op.or]: [
                        { statusCheckedAt: { [Op.is]: null } },
                        { statusCheckedAt: { [Op.lte]: staleBefore } },
                    ],
                },
            ],
        },
        // MySQL sorts nulls first ASC, so no-ETA orders lead — most at risk of being forgotten.
        order: [['expectedDeliveryDate', 'ASC']], limit, raw: true,
    })
})

/**
 * Atomically claim a payout row: flip it out of fromStatus only if it is still there.
 * This compare-and-set is what makes the sweep safe to overlap with itself — two
 * passes read the same HELD row, but only one UPDATE affects a row and only that one
 * calls Cashfree. Callers MUST check the count and do nothing when it is 0.
 *
 * @returns {Promise<number>} 1 = claimed, 0 = someone else has it
 */
/**
 * Atomically claim the right to email this order's invoice. `invoiceEmailSentAt` IS
 * the lock: it flips from NULL only once, so two overlapping on_status callbacks
 * (the poll repeats hourly, each carrying the same documents) cannot both mail.
 *
 * The corollary matters more than the rule — NEVER claim a row we are not about to
 * email about, because a claim without a send silences that invoice permanently.
 *
 * @returns {Promise<number>} 1 = claimed, 0 = already sent / someone else has it
 */
exports.claimOndcOrderInvoiceEmail = asyncHandler(async ({ id, now = new Date() }) => {
    if (!id) return 0
    const [affected] = await ondcOrders.update(
        { invoiceEmailSentAt: now },
        { where: { id, invoiceEmailSentAt: { [Op.is]: null } } }
    )
    return affected
})

exports.claimOndcOrderPayout = asyncHandler(async ({ id, fromStatus, toStatus }) => {
    if (!id || !fromStatus || !toStatus) return 0
    const [affected] = await ondcOrders.update({ payoutStatus: toStatus }, { where: { id, payoutStatus: fromStatus } })
    return affected
})

// NOTE: the TAT-breach select/claim used to live here. The alert now runs entirely
// in the scheduler against the shared DB (scheduler/services/ondcTatBreach.js), so
// these were dead code. The `tatBreachNotifiedAt` COLUMN stays on the entity —
// purchase owns this table's creation and self-heal, so dropping it there would
// stop the column ever being added.

/**
 * Add to the order's running refunded total, in-DB via a literal so two concurrent
 * refunds can't clobber each other with a stale read.
 *
 * The ondcOrderRefunds ledger stays authoritative (sumOndcOrderRefunds); this is the
 * denormalised figure the admin screen and the cap check read.
 */
exports.incrementOndcOrderRefundedAmount = asyncHandler(async ({ id, amount }) => {
    const delta = Number(amount)
    if (!id || !Number.isFinite(delta) || delta <= 0) return [0]
    return await ondcOrders.update(
        { refundedAmount: literal(`refundedAmount + ${delta.toFixed(2)}`) },
        { where: { id } },
    )
})

/**
 * Write the outcome of a release attempt. incrementAttempts bumps in-DB via a literal
 * so a concurrent write can't clobber it with a stale read.
 */
exports.updateOndcOrderPayout = asyncHandler(async ({
    id, payoutStatus, payoutEligibilityDate, payoutReleasedAt, payoutDueAt, payoutError,
    incrementAttempts = false,
}) => {
    if (!id) return [0]
    const changes = {}
    if (payoutStatus !== undefined) changes.payoutStatus = payoutStatus
    if (payoutEligibilityDate !== undefined) changes.payoutEligibilityDate = payoutEligibilityDate
    if (payoutReleasedAt !== undefined) changes.payoutReleasedAt = payoutReleasedAt
    if (payoutDueAt !== undefined) changes.payoutDueAt = payoutDueAt
    if (payoutError !== undefined) changes.payoutError = payoutError
    if (incrementAttempts) changes.payoutAttempts = literal('payoutAttempts + 1')
    if (!Object.keys(changes).length) return [0]
    return await ondcOrders.update(changes, { where: { id } })
})
