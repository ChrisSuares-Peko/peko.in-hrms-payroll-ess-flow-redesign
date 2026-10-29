const asyncHandler = require('./../../middlewares/async');
const ondcSellerPayouts = require('./../entities/ondc_seller_payout');

/**
 * Append one row to the seller-payout ledger — called for EVERY Cashfree
 * settlement-timing attempt, failures included.
 *
 * Rejects on a DB failure (asyncHandler's `.catch(next)` gets no `next` here, so the
 * rejection propagates). Callers MUST try/catch and carry on: the ledger is evidence,
 * not a precondition. See the guarded `ledger()` in utils/easySplitSettlement.js.
 */
exports.recordSellerPayoutAttempt = asyncHandler(async ({
    ondcOrderId = null,
    transactionId = null,
    paymentRef = null,
    gatewayOrderId = null,
    splitVendorId = null,
    amount = null,
    action,
    requestedEligibilityDate = null,
    status,
    httpStatus = null,
    responseBody = null,
    error = null,
    logTraceId = null,
}) => {
    return await ondcSellerPayouts.create({
        ondcOrderId,
        transactionId: transactionId != null ? String(transactionId) : null,
        paymentRef: paymentRef != null ? String(paymentRef) : null,
        gatewayOrderId: gatewayOrderId != null ? String(gatewayOrderId) : null,
        splitVendorId,
        amount,
        action,
        requestedEligibilityDate,
        status,
        httpStatus,
        responseBody,
        error,
        logTraceId,
    });
});

/** Ledger for one order, oldest first — the admin payout timeline. */
exports.findPayoutAttemptsForOrder = asyncHandler(async ({ ondcOrderId, transactionId }) => {
    const where = ondcOrderId ? { ondcOrderId } : { transactionId: String(transactionId) };
    return await ondcSellerPayouts.findAll({ where, order: [['id', 'ASC']], raw: true });
});
