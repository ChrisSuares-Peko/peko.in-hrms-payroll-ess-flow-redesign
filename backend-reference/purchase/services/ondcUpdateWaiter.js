/**
 * In-process registry that lets the admin return-approval endpoint hold its
 * HTTP response open until the seller's asynchronous on_update callback
 * arrives for that transaction_id (mirrors ondcConfirmWaiter — 1:1, one
 * on_update carrying the updated order per transaction).
 *
 * Flow:
 *   1. controller registers a pending entry (waitForOnUpdate) BEFORE firing
 *      the ONDC /update (return), so there's no race with a fast webhook.
 *   2. the on_update webhook calls notifyOnUpdate(transactionId, order,
 *      error) with `message.order` (fulfillment state "Return_Initiated") or
 *      the NACK `error` -> the pending promise resolves immediately.
 *   3. a hard-cap setTimeout resolves with { received: false } if no callback
 *      arrives in time.
 *
 * Single-process only (same purchase service handles both the update request
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
 * Register interest in a transaction_id and wait until its on_update callback
 * arrives (or the timeout). Always resolves (never rejects).
 *
 * @param {string} transactionId
 * @param {Object} [opts]
 * @param {number} [opts.timeoutMs=30000]
 * @returns {Promise<{received:boolean, reason:string, order:Object|null, error:Object|null}>}
 */
const waitForOnUpdate = (
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
 * Called by the on_update webhook with the updated order from the callback
 * body (`message.order` — fulfillment state "Return_Initiated"), or the ONDC
 * `error` object when the BPP NACKs. Settles the waiter immediately.
 *
 * @param {string} transactionId
 * @param {Object} [order] on_update `message.order`
 * @param {Object} [error] ONDC error object from a NACK/error callback
 */
const notifyOnUpdate = (transactionId, order, error) => {
    if (!transactionId) return;
    const entry = pending.get(transactionId);
    if (!entry) return;
    customLog(null, "info", { message: `notifyOnUpdate: ${transactionId}`, hasOrder: Boolean(order), error, order }, "VENDOR");
    settle(transactionId, error ? 'error' : 'on_update', order || null, error || null);
};

/** Cancel/clean up a pending waiter (e.g. client disconnected, update failed). */
const cancelUpdateWait = (transactionId, reason = 'cancelled') => {
    settle(transactionId, reason);
};

module.exports = {
    waitForOnUpdate,
    notifyOnUpdate,
    cancelUpdateWait,
};
