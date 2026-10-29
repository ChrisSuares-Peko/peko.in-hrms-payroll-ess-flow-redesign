/**
 * In-process registry that lets a live tracking refresh (getOndcOrderById)
 * hold briefly until the seller's asynchronous on_track callback arrives for
 * that transaction_id — mirrors ondcStatusWaiter. Like on_status, on_track MAY
 * arrive unsolicited; controllers/webhook/ondc.js onTrack always persists the
 * callback to the ondcOrders row regardless of whether a waiter is
 * registered — this waiter only lets an in-flight request learn the answer
 * arrived early instead of running out its (short) timeout.
 *
 * Flow:
 *   1. controller registers a pending entry (waitForOnTrack) BEFORE firing
 *      the ONDC /track, so there's no race with a fast webhook.
 *   2. the on_track webhook calls notifyOnTrack(transactionId, tracking, error)
 *      with `message.tracking` (location/url/status) or the NACK `error` ->
 *      the pending promise resolves immediately.
 *   3. a hard-cap setTimeout resolves with { received: false } if no callback
 *      arrives in time (the caller then falls back to the last persisted row).
 *
 * Single-process only (same purchase service handles both the track request
 * and the webhook), so a module-level Map is sufficient.
 */

const { customLog } = require("../utils/loggerHelper");

const DEFAULT_TIMEOUT_MS = 30000;

const pending = new Map(); // transactionId -> { resolve, timer }

const settle = (transactionId, reason, tracking = null, error = null) => {
    const entry = pending.get(transactionId);
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.delete(transactionId);
    entry.resolve({ received: Boolean(tracking || error), reason, tracking, error });
};

/**
 * Register interest in a transaction_id and wait until its on_track callback
 * arrives (or the timeout). Always resolves (never rejects).
 *
 * @param {string} transactionId
 * @param {Object} [opts]
 * @param {number} [opts.timeoutMs=30000]
 * @returns {Promise<{received:boolean, reason:string, tracking:Object|null, error:Object|null}>}
 */
const waitForOnTrack = (
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
 * Called by the on_track webhook with the tracking block from the callback
 * body (`message.tracking` — location/url/status), or the ONDC `error` object
 * when the BPP NACKs. Settles the waiter immediately. Called regardless of
 * whether a waiter is pending (on_track may be unsolicited) — this is a no-op
 * when there's nothing waiting.
 *
 * @param {string} transactionId
 * @param {Object} [tracking] on_track `message.tracking`
 * @param {Object} [error] ONDC error object from a NACK/error callback
 */
const notifyOnTrack = (transactionId, tracking, error) => {
    if (!transactionId) return;
    const entry = pending.get(transactionId);
    if (!entry) return;
    customLog(null, "info", { message: `notifyOnTrack: ${transactionId}`, hasTracking: Boolean(tracking), error, tracking }, "VENDOR");
    settle(transactionId, error ? 'error' : 'on_track', tracking || null, error || null);
};

/** Cancel/clean up a pending waiter (e.g. the outbound /track call itself failed). */
const cancelTrackWait = (transactionId, reason = 'cancelled') => {
    settle(transactionId, reason);
};

module.exports = {
    waitForOnTrack,
    notifyOnTrack,
    cancelTrackWait,
};
