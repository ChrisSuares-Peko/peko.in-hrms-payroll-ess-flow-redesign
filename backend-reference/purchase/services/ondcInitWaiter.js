/**
 * In-process registry that lets the checkout /ondc/initOrder endpoint hold its
 * HTTP response open until the seller's asynchronous on_init callback arrives
 * for that transaction_id (mirrors ondcSelectWaiter — 1:1, one on_init carrying
 * the final quote + payment terms per transaction).
 *
 * Flow:
 *   1. controller registers a pending entry (waitForOnInit) BEFORE firing the
 *      ONDC /init, so there's no race with a fast webhook.
 *   2. the on_init webhook calls notifyOnInit(transactionId, order, error)
 *      with `message.order` (quote + payment/settlement) or the NACK `error`
 *      -> the pending promise resolves immediately.
 *   3. a hard-cap setTimeout resolves with { received: false } if no callback
 *      arrives in time.
 *
 * Single-process only (same purchase service handles both the init request and
 * the webhook), so a module-level Map is sufficient.
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
 * Register interest in a transaction_id and wait until its on_init callback
 * arrives (or the timeout). Always resolves (never rejects).
 *
 * @param {string} transactionId
 * @param {Object} [opts]
 * @param {number} [opts.timeoutMs=30000]
 * @returns {Promise<{received:boolean, reason:string, order:Object|null, error:Object|null}>}
 */
const waitForOnInit = (
    transactionId,
    { timeoutMs = DEFAULT_TIMEOUT_MS } = {}
) =>
    new Promise((resolve) => {
        // A key already pending is a BUG, not a legitimate supersede: one
        // transaction_id is one order session with one BPP, so a collision means
        // two seller groups were handed the same id (see assignGroupTransactionIds
        // in utils/ondc_helper.js). Cancelling the first waiter silently is what
        // let a two-seller checkout fail with no diagnostic, so say so loudly.
        if (pending.has(transactionId)) {
            customLog(null, "error", {
                message: "waitForOnInit: transactionId already pending — two seller groups share one transaction_id",
                transactionId,
            }, "VENDOR");
            settle(transactionId, 'superseded');
        }
        const timer = setTimeout(() => settle(transactionId, 'timeout'), timeoutMs);
        pending.set(transactionId, { resolve, timer });
    });

/**
 * Called by the on_init webhook with the order from the callback body
 * (`message.order` — final quote + payment/settlement terms), or the ONDC
 * `error` object when the BPP NACKs. Settles the waiter immediately.
 *
 * @param {string} transactionId
 * @param {Object} [order] on_init `message.order`
 * @param {Object} [error] ONDC error object from a NACK/error callback
 */
const notifyOnInit = (transactionId, order, error) => {
    if (!transactionId) return;
    const entry = pending.get(transactionId);
    if (!entry) {
        // An on_init only arrives in answer to an /init we are waiting on, so no
        // pending entry means the seller answered under an id the wait was not
        // registered against — a correlation bug, silent until checkout times out.
        // "error" not "warn": customLog writes nothing for any other level.
        customLog(null, "error", {
            message: "notifyOnInit: no pending wait for this transaction",
            transactionId,
            hasOrder: Boolean(order),
            hasError: Boolean(error),
        }, "VENDOR");
        return;
    }
    customLog(null, "info", { message: `notifyOnInit: ${transactionId}`, hasOrder: Boolean(order), error, order }, "VENDOR");
    settle(transactionId, error ? 'error' : 'on_init', order || null, error || null);
};

/** Cancel/clean up a pending waiter (e.g. client disconnected, init failed). */
const cancelInitWait = (transactionId, reason = 'cancelled') => {
    settle(transactionId, reason);
};

module.exports = {
    waitForOnInit,
    notifyOnInit,
    cancelInitWait,
};
