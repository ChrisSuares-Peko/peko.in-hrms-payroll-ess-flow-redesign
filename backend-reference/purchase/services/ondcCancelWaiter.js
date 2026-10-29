/**
 * In-process registry that lets the admin cancel-approval endpoint hold its
 * HTTP response open until the seller's asynchronous on_cancel callback
 * arrives for that transaction_id (mirrors ondcConfirmWaiter — 1:1, one
 * on_cancel carrying the cancelled order per transaction).
 *
 * Flow:
 *   1. controller registers a pending entry (waitForOnCancel) BEFORE firing
 *      the ONDC /cancel, so there's no race with a fast webhook.
 *   2. the on_cancel webhook calls notifyOnCancel(transactionId, order,
 *      error) with `message.order` (state "Cancelled") or the NACK `error`
 *      -> the pending promise resolves immediately.
 *   3. a hard-cap setTimeout resolves with { received: false } if no callback
 *      arrives in time.
 *
 * Single-process only (same purchase service handles both the cancel request
 * and the webhook), so a module-level Map is sufficient.
 */

const { customLog } = require("../utils/loggerHelper");

const DEFAULT_TIMEOUT_MS = 30000;

const pending = new Map(); // transactionId -> { resolve, timer }

const settle = (transactionId, reason, order = null, error = null) => {
    const entry = pending.get(transactionId);
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.delete(transactionId);
    entry.resolve({ received: Boolean(order || error), reason, order, error });
};

/**
 * Register interest in a transaction_id and wait until its on_cancel callback
 * arrives (or the timeout). Always resolves (never rejects).
 *
 * @param {string} transactionId
 * @param {Object} [opts]
 * @param {number} [opts.timeoutMs=30000]
 * @returns {Promise<{received:boolean, reason:string, order:Object|null, error:Object|null}>}
 */
const waitForOnCancel = (
    transactionId,
    { timeoutMs = DEFAULT_TIMEOUT_MS } = {}
) =>
    new Promise((resolve) => {
        // If somehow already registered, settle the previous as superseded.
        if (pending.has(transactionId)) {
            settle(transactionId, 'superseded');
        }
        const timer = setTimeout(() => settle(transactionId, 'timeout'), timeoutMs);
        pending.set(transactionId, { resolve, timer });
    });

/**
 * Called by the on_cancel webhook with the cancelled order from the callback
 * body (`message.order` — state "Cancelled"), or the ONDC `error` object when
 * the BPP NACKs. Settles the waiter immediately.
 *
 * @param {string} transactionId
 * @param {Object} [order] on_cancel `message.order`
 * @param {Object} [error] ONDC error object from a NACK/error callback
 */
const notifyOnCancel = (transactionId, order, error) => {
    if (!transactionId) return;
    const entry = pending.get(transactionId);
    if (!entry) return;
    customLog(null, "info", { message: `notifyOnCancel: ${transactionId}`, hasOrder: Boolean(order), error, order }, "VENDOR");
    settle(transactionId, error ? 'error' : 'on_cancel', order || null, error || null);
};

/** Cancel/clean up a pending waiter (e.g. client disconnected, cancel failed). */
const cancelCancelWait = (transactionId, reason = 'cancelled') => {
    settle(transactionId, reason);
};

/**
 * Turn a waiter outcome into something an operator and a UI can act on.
 *
 * The four failure modes are genuinely different and callers used to collapse
 * them all into one "Seller did not confirm the cancellation" 502, which left
 * ops unable to tell a refusal from an outage:
 *
 *   timeout    the seller never answered. On a normal cancel this is the seller
 *              declining — the signal that a FORCE cancellation is the next step.
 *   error      the seller actively NACK'd, and said why.
 *   superseded another cancel for this same order started and evicted this wait;
 *              the original request may still be live at the seller, so this is
 *              NOT evidence the cancellation failed.
 *   cancelled  we abandoned the wait ourselves.
 *
 * @param {{received:boolean, reason:string, order:Object|null, error:Object|null}} result
 * @param {{ forced?: boolean }} [opts] whether the attempt already used force
 * @returns {{ok:boolean, outcome:string, statusCode:number, message:string, canForce:boolean}}
 */
const describeCancelOutcome = (result = {}, { forced = false } = {}) => {
    if (result.received && !result.error) {
        return { ok: true, outcome: 'cancelled', statusCode: 200, message: 'Order cancelled', canForce: false };
    }
    if (result.error) {
        return {
            ok: false,
            outcome: 'seller_rejected',
            statusCode: 502,
            message: result.error?.message || 'The seller rejected this cancellation',
            // A refusal is exactly what force overrides — unless we already forced.
            canForce: !forced,
        };
    }
    if (result.reason === 'superseded') {
        return {
            ok: false,
            outcome: 'superseded',
            statusCode: 409,
            message: 'Another cancellation for this order is already in progress',
            canForce: false,
        };
    }
    return {
        ok: false,
        outcome: result.reason === 'cancelled' ? 'abandoned' : 'no_response',
        statusCode: 502,
        message: forced
            ? 'The seller did not respond to the forced cancellation'
            : 'The seller did not respond to this cancellation request',
        canForce: !forced,
    };
};

module.exports = {
    waitForOnCancel,
    notifyOnCancel,
    cancelCancelWait,
    describeCancelOutcome,
};
