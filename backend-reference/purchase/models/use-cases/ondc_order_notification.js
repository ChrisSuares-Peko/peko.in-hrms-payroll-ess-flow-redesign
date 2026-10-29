const { UniqueConstraintError } = require('sequelize');
const asyncHandler = require('./../../middlewares/async');
const ondcOrderNotifications = require('./../entities/ondc_order_notification');

/**
 * Atomically claim the right to send ONE notification email about ONE order.
 *
 * The UNIQUE (ondcOrderId, eventKey) index IS the lock: the INSERT either wins or
 * collides, so two overlapping on_status callbacks — and the delivery poll repeats
 * hourly, each reply carrying the same fulfillment state — cannot both mail.
 *
 * Callers MUST check `claimed` and send nothing when it is false.
 *
 * The corollary matters more than the rule (same as claimOndcOrderInvoiceEmail):
 * NEVER claim for a row you are not about to email about — resolve the recipient
 * first. A claim without a send silences that notification permanently, because
 * there is deliberately no un-claim.
 *
 * @returns {Promise<{claimed: boolean}>}
 */
exports.claimOndcOrderNotification = asyncHandler(async ({
    ondcOrderId,
    transactionId = null,
    eventKey,
    recipient = null,
    logTraceId = null,
    now = new Date(),
}) => {
    if (!ondcOrderId || !eventKey) return { claimed: false };
    try {
        await ondcOrderNotifications.create({
            ondcOrderId,
            transactionId: transactionId != null ? String(transactionId) : null,
            eventKey: String(eventKey),
            sentAt: now,
            // Truncated to the column width rather than letting MySQL reject the row:
            // losing the audit string must never cost the email.
            recipient: recipient ? String(recipient).slice(0, 191) : null,
            logTraceId,
        });
        return { claimed: true };
    } catch (err) {
        if (err instanceof UniqueConstraintError) return { claimed: false };
        throw err;
    }
});

/**
 * What we have already sent about one order — the support view, and how a sender
 * can cheaply skip before doing any recipient lookup.
 */
exports.findOndcOrderNotifications = asyncHandler(async ({ ondcOrderId }) => {
    if (!ondcOrderId) return [];
    return await ondcOrderNotifications.findAll({
        where: { ondcOrderId },
        order: [['sentAt', 'ASC']],
        raw: true,
    });
});
