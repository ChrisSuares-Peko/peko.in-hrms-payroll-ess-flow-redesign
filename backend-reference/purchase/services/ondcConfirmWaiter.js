/**
 * In-process registry that lets the /ondc/confirmOrder endpoint hold its HTTP
 * response open until the seller's asynchronous on_confirm callback arrives
 * for that transaction_id (mirrors ondcInitWaiter — 1:1, one on_confirm
 * carrying the created order per transaction).
 *
 * Flow:
 *   1. controller registers a pending entry (waitForOnConfirm) BEFORE firing
 *      the ONDC /confirm, so there's no race with a fast webhook.
 *   2. the on_confirm webhook calls notifyOnConfirm(transactionId, order,
 *      error) with `message.order` (state "Created" + echoed quote/payment)
 *      or the NACK `error` -> the pending promise resolves immediately.
 *   3. a hard-cap setTimeout resolves with { received: false } if no callback
 *      arrives in time.
 *
 * Single-process only (same purchase service handles both the confirm request
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
 * Register interest in a transaction_id and wait until its on_confirm callback
 * arrives (or the timeout). Always resolves (never rejects).
 *
 * @param {string} transactionId
 * @param {Object} [opts]
 * @param {number} [opts.timeoutMs=30000]
 * @returns {Promise<{received:boolean, reason:string, order:Object|null, error:Object|null}>}
 */
const waitForOnConfirm = (
    transactionId,
    { timeoutMs = DEFAULT_TIMEOUT_MS } = {}
) =>
    new Promise((resolve) => {
        // A key already pending is a BUG, not a legitimate supersede — same
        // cause as the identical check in ondcSelectWaiter/ondcInitWaiter (two
        // seller groups sharing one transaction_id, e.g. via forceTransactionId
        // with a multi-seller cart). Log it: this is the diagnostic that would
        // otherwise be missing if a collision made it all the way to confirm.
        if (pending.has(transactionId)) {
            customLog(null, "error", {
                message: "waitForOnConfirm: transactionId already pending — two seller groups share one transaction_id",
                transactionId,
            }, "VENDOR");
            settle(transactionId, 'superseded');
        }
        const timer = setTimeout(() => settle(transactionId, 'timeout'), timeoutMs);
        pending.set(transactionId, { resolve, timer });
    });

/**
 * Called by the on_confirm webhook with the created order from the callback
 * body (`message.order` — state + echoed quote/payment), or the ONDC `error`
 * object when the BPP NACKs. Settles the waiter immediately.
 *
 * @param {string} transactionId
 * @param {Object} [order] on_confirm `message.order`
 * @param {Object} [error] ONDC error object from a NACK/error callback
 */
const notifyOnConfirm = (transactionId, order, error) => {
    if (!transactionId) return;
    const entry = pending.get(transactionId);
    if (!entry) {
        // The order HAS been placed with the seller — this callback says so. If no
        // one is waiting on this id, the buyer's paid checkout cannot be matched to
        // it, which is the worst version of a correlation bug. The on_confirm
        // handler still persists the order, so this line is how you find it.
        // "error" not "warn": customLog writes nothing for any other level.
        customLog(null, "error", {
            message: "notifyOnConfirm: no pending wait for this transaction",
            transactionId,
            hasOrder: Boolean(order),
            hasError: Boolean(error),
        }, "VENDOR");
        return;
    }
    customLog(null, "info", { message: `notifyOnConfirm: ${transactionId}`, hasOrder: Boolean(order), error, order }, "VENDOR");
    settle(transactionId, error ? 'error' : 'on_confirm', order || null, error || null);
};

/** Cancel/clean up a pending waiter (e.g. client disconnected, confirm failed). */
const cancelConfirmWait = (transactionId, reason = 'cancelled') => {
    settle(transactionId, reason);
};

module.exports = {
    waitForOnConfirm,
    notifyOnConfirm,
    cancelConfirmWait,
};
