/**
 * In-process registry that lets a select/quote endpoint hold its HTTP response
 * open until the seller's asynchronous on_select callback arrives for that
 * transaction_id (mirrors ondcSearchWaiter, but 1:1 — one on_select carrying
 * the quote per transaction, not N product batches).
 *
 * Flow:
 *   1. controller registers a pending entry (waitForOnSelect) BEFORE firing the
 *      ONDC /select, so there's no race with a fast webhook.
 *   2. the on_select webhook calls notifyOnSelect(transactionId, order, error)
 *      with `message.order` (contains the quote) or the NACK `error` -> the
 *      pending promise resolves immediately.
 *   3. a hard-cap setTimeout resolves with { received: false } if no callback
 *      arrives in time.
 *
 * Single-process only (same purchase service handles both the select request and
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
 * Register interest in a transaction_id and wait until its on_select callback
 * arrives (or the timeout). Always resolves (never rejects).
 *
 * @param {string} transactionId
 * @param {Object} [opts]
 * @param {number} [opts.timeoutMs=30000]
 * @returns {Promise<{received:boolean, reason:string, order:Object|null, error:Object|null}>}
 */
const waitForOnSelect = (
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
                message: "waitForOnSelect: transactionId already pending — two seller groups share one transaction_id",
                transactionId,
            }, "VENDOR");
            settle(transactionId, 'superseded');
        }
        const timer = setTimeout(() => settle(transactionId, 'timeout'), timeoutMs);
        pending.set(transactionId, { resolve, timer });
    });

/**
 * Called by the on_select webhook with the quote/order from the callback body
 * (`message.order`), or the ONDC `error` object when the BPP NACKs. Settles the
 * waiter immediately.
 *
 * @param {string} transactionId
 * @param {Object} [order] on_select `message.order` (carries the quote)
 * @param {Object} [error] ONDC error object from a NACK/error callback
 */
const notifyOnSelect = (transactionId, order, error) => {
    if (!transactionId) return;
    const entry = pending.get(transactionId);
    if (!entry) {
        // We only ever get an on_select because we sent a /select and are waiting
        // on it, so this means the id the seller answered under is not the one the
        // wait was registered against — a correlation bug. The visible symptom is
        // a checkout that times out after 30s with the seller's quote sitting
        // right here, unclaimed. "error" not "warn": customLog writes nothing for
        // any other level.
        customLog(null, "error", {
            message: "notifyOnSelect: no pending wait for this transaction",
            transactionId,
            hasOrder: Boolean(order),
            hasError: Boolean(error),
        }, "VENDOR");
        return;
    }
    customLog(null, "info", { message: `notifyOnSelect: ${transactionId}`, hasOrder: Boolean(order), error,order }, "VENDOR");
    settle(transactionId, error ? 'error' : 'on_select', order || null, error || null);
};

/** Cancel/clean up a pending waiter (e.g. client disconnected, select failed). */
const cancelSelectWait = (transactionId, reason = 'cancelled') => {
    settle(transactionId, reason);
};

module.exports = {
    waitForOnSelect,
    notifyOnSelect,
    cancelSelectWait,
};
