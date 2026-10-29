const asyncHandler = require('./../../middlewares/async');
const ondcCallbackLogs = require('./../entities/ondc_callback_log');

/**
 * Persist one ONDC callback (on_select / on_init / on_confirm) for auditing.
 * Callers fire-and-forget this — a failed audit write must never affect the
 * webhook ACK.
 */
exports.createCallbackLog = asyncHandler(async (data) => {
    return await ondcCallbackLogs.create(data)
})

/** All callbacks of an order session, oldest first — for root-cause digging. */
exports.findLogsByTransactionId = asyncHandler(async ({ transactionId }) => {
    return await ondcCallbackLogs.findAll({
        where: { transactionId },
        order: [['id', 'ASC']],
        raw: true,
    })
})

/**
 * The newest successful on_init of an order session — the order /confirm echoes.
 * Same query as paymentGateway's findLatestOnInitByTransactionId, which placed the
 * orders before purchase took the confirm-after-payment flow over.
 */
exports.findLatestOnInitByTransactionId = asyncHandler(async (transactionId) => {
    if (!transactionId) return null
    return await ondcCallbackLogs.findOne({
        where: { action: 'on_init', transactionId: String(transactionId), hasError: false },
        order: [['id', 'DESC']],
        raw: true,
    })
})

/**
 * The newest on_confirm of an order session. The timeout sweep reads it so a
 * callback that was logged but never processed (the process died mid-way) is
 * replayed instead of the seller being timed out and refunded.
 */
exports.findLatestOnConfirmByTransactionId = asyncHandler(async (transactionId) => {
    if (!transactionId) return null
    return await ondcCallbackLogs.findOne({
        where: { action: 'on_confirm', transactionId: String(transactionId) },
        order: [['id', 'DESC']],
        raw: true,
    })
})
