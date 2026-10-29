/**
 * In-process registry that lets a live order-status refresh (getOndcOrderById)
 * hold briefly until the seller's asynchronous on_status callback arrives for
 * that transaction_id — mirrors ondcConfirmWaiter, but on_status differs in
 * one important way: it can also arrive UNSOLICITED (a seller-pushed update
 * with no prior /status call and no pending waiter). The webhook handler
 * (controllers/webhook/ondc.js onStatus) ALWAYS persists the callback to the
 * ondcOrders row regardless of whether a waiter is registered; this waiter is
 * only how a live in-flight request finds out the answer arrived early
 * instead of running out its (short) timeout.
 *
 * Flow:
 *   1. controller registers a pending entry (waitForOnStatus) BEFORE firing
 *      the ONDC /status, so there's no race with a fast webhook.
 *   2. the on_status webhook calls notifyOnStatus(transactionId, order, error)
 *      with `message.order` (current state + fulfillments) or the NACK
 *      `error` -> the pending promise resolves immediately.
 *   3. a hard-cap setTimeout resolves with { received: false } if no callback
 *      arrives in time (the caller then falls back to the last persisted row).
 *
 * Single-process only (same purchase service handles both the status request
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
 * Register interest in a transaction_id and wait until its on_status callback
 * arrives (or the timeout). Always resolves (never rejects).
 *
 * @param {string} transactionId
 * @param {Object} [opts]
 * @param {number} [opts.timeoutMs=30000]
 * @returns {Promise<{received:boolean, reason:string, order:Object|null, error:Object|null}>}
 */
const waitForOnStatus = (
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
 * Called by the on_status webhook with the order from the callback body
 * (`message.order` — current state + fulfillments), or the ONDC `error`
 * object when the BPP NACKs. Settles the waiter immediately. Called
 * regardless of whether a waiter is pending (on_status may be unsolicited) —
 * this is a no-op when there's nothing waiting.
 *
 * @param {string} transactionId
 * @param {Object} [order] on_status `message.order`
 * @param {Object} [error] ONDC error object from a NACK/error callback
 */
const notifyOnStatus = (transactionId, order, error) => {
    if (!transactionId) return;
    const entry = pending.get(transactionId);
    if (!entry) return;
    customLog(null, "info", { message: `notifyOnStatus: ${transactionId}`, hasOrder: Boolean(order), error, order }, "VENDOR");
    settle(transactionId, error ? 'error' : 'on_status', order || null, error || null);
};

/** Cancel/clean up a pending waiter (e.g. the outbound /status call itself failed). */
const cancelStatusWait = (transactionId, reason = 'cancelled') => {
    settle(transactionId, reason);
};

module.exports = {
    waitForOnStatus,
    notifyOnStatus,
    cancelStatusWait,
};
