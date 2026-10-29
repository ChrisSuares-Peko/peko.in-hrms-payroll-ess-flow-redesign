const asyncHandler = require('./../../middlewares/async');
const ondcConfirmAttempts = require('./../entities/ondc_confirm_attempt');

/**
 * Per-seller /confirm attempts of a captured checkout — see
 * models/entities/ondc_confirm_attempt.js and services/ondcConfirmAfterPayment.js.
 * paymentGateway records each attempt and its /confirm answer; purchase settles it.
 *
 * Every function rejects on a DB failure (asyncHandler's `.catch(next)` gets no
 * `next` here, so the rejection propagates to the caller).
 */

/** Every attempt of one checkout, in the order they were recorded. */
exports.findConfirmAttempts = asyncHandler(async ({ paymentRef }) => {
    if (!paymentRef) return [];
    return await ondcConfirmAttempts.findAll({
        where: { paymentRef: String(paymentRef) },
        order: [['id', 'ASC']],
        raw: true,
    });
});

exports.findConfirmAttemptById = asyncHandler(async (id) => {
    if (!id) return null;
    return await ondcConfirmAttempts.findOne({ where: { id }, raw: true });
});

/** on_confirm echoes the /confirm message_id — the precise way back to an attempt. */
exports.findConfirmAttemptByMessageId = asyncHandler(async (messageId) => {
    if (!messageId) return null;
    return await ondcConfirmAttempts.findOne({
        where: { messageId: String(messageId) },
        order: [['id', 'DESC']],
        raw: true,
    });
});

/**
 * Fallback for a seller that does not echo message_id. Newest first: a transaction
 * id reused by a retried checkout belongs to the most recent capture.
 */
exports.findLatestConfirmAttemptByTransactionId = asyncHandler(async (transactionId) => {
    if (!transactionId) return null;
    return await ondcConfirmAttempts.findOne({
        where: { transactionId: String(transactionId) },
        order: [['id', 'DESC']],
        raw: true,
    });
});

/**
 * Compare-and-set: apply `patch` only while the row still matches `where`
 * (typically `{ status: <expected> }`). Returns true when THIS call won.
 */
exports.updateConfirmAttemptIf = asyncHandler(async ({ id, where = {}, patch }) => {
    if (!id || !patch) return false;
    const [affected] = await ondcConfirmAttempts.update(patch, { where: { ...where, id } });
    return affected > 0;
});
