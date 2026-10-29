const { Op, fn, col, UniqueConstraintError } = require('sequelize');
const asyncHandler = require('./../../middlewares/async');
const ondcOrderRefunds = require('./../entities/ondc_order_refund');

/**
 * Append one refund attempt to the ledger.
 *
 * A duplicate `refundId` means this exact refund was already recorded — a replayed
 * request or a double-submit. Swallowed and reported as `{ duplicate: true }`
 * rather than thrown, so the caller can stop BEFORE calling Cashfree again.
 * That unique index is the double-refund guard.
 */
exports.recordOndcOrderRefund = asyncHandler(async ({
    ondcOrderId,
    transactionId = null,
    paymentRef = null,
    refundId,
    amount,
    reason = null,
    status,
    splitVendorId = null,
    vendorAmount = 0,
    merchantAmount = 0,
    gatewayRefundStatus = null,
    responseBody = null,
    error = null,
    initiatedByUserId = null,
    logTraceId = null,
}) => {
    try {
        const row = await ondcOrderRefunds.create({
            ondcOrderId,
            transactionId: transactionId != null ? String(transactionId) : null,
            paymentRef: paymentRef != null ? String(paymentRef) : null,
            refundId,
            amount,
            reason,
            status,
            splitVendorId,
            vendorAmount,
            merchantAmount,
            gatewayRefundStatus,
            responseBody,
            error,
            initiatedByUserId,
            logTraceId,
        });
        return { row, duplicate: false };
    } catch (err) {
        if (err instanceof UniqueConstraintError) {
            const existing = await ondcOrderRefunds.findOne({ where: { refundId }, raw: true });
            return { row: existing, duplicate: true };
        }
        throw err;
    }
});

/**
 * Total already committed to refunds for one order — the authoritative figure for the
 * cap. `ondcOrders.refundedAmount` is a denormalised convenience for display; if the
 * two ever disagree, this one is right.
 *
 * Counts everything EXCEPT `FAILED`, deliberately including `PENDING`. A PENDING row
 * means the gateway call was made and the outcome wasn't recorded (e.g. the finalise
 * write failed), so the money may well have moved. Excluding it would let the next
 * refund over-refund; including it errs toward under-refunding, which is recoverable.
 */
exports.sumOndcOrderRefunds = asyncHandler(async ({ ondcOrderId }) => {
    const row = await ondcOrderRefunds.findOne({
        where: { ondcOrderId, status: { [Op.ne]: 'FAILED' } },
        attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
        raw: true,
    });
    return parseFloat(row?.total || 0);
});

/**
 * Total already debited from the SELLER's Easy Split allocation for one order.
 *
 * The cap for `refund_splits`: Cashfree cannot debit a vendor more than the split
 * allocated them, so a second refund must know what the first already took off them.
 * Excludes only FAILED, for the same reason as sumOndcOrderRefunds — a PENDING row
 * means the gateway call was made and the debit may already have happened.
 */
exports.sumOndcOrderVendorRefunds = asyncHandler(async ({ ondcOrderId }) => {
    const row = await ondcOrderRefunds.findOne({
        where: { ondcOrderId, status: { [Op.ne]: 'FAILED' } },
        attributes: [[fn('COALESCE', fn('SUM', col('vendorAmount')), 0), 'total']],
        raw: true,
    });
    return parseFloat(row?.total || 0);
});

/** Refund history for one order, oldest first — the admin timeline. */
exports.findOndcOrderRefunds = asyncHandler(async ({ ondcOrderId }) => {
    return await ondcOrderRefunds.findAll({ where: { ondcOrderId }, order: [['id', 'ASC']], raw: true });
});
