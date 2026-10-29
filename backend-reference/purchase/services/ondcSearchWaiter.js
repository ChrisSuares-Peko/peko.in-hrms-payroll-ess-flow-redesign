/**
 * In-process registry that lets the corporate /ondc/search endpoint hold its
 * HTTP response open until enough products have arrived on the asynchronous
 * on_search webhooks for that transaction_id.
 *
 * Flow:
 *   1. controller registers a pending entry (waitForProducts) BEFORE firing the
 *      ONDC /search, so there's no race with a fast webhook.
 *   2. each on_search webhook calls notifyOnSearch(transactionId, ids) -> the
 *      distinct product ids accumulate; once >= threshold the pending promise
 *      resolves.
 *   3. a hard-cap setTimeout resolves with whatever arrived if the threshold is
 *      never reached.
 *
 * Single-process only (same purchase service handles both the search request and
 * the webhook), so a module-level Map is sufficient.
 */

const { customLog } = require("../utils/loggerHelper");

const DEFAULT_THRESHOLD = 12;
const DEFAULT_TIMEOUT_MS = 30000;

const pending = new Map(); // transactionId -> { resolve, timer, seen:Set, threshold }
const batch = new Map()



const settle = (transactionId, reason, error = null) => {
    const entry = pending.get(transactionId);
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.delete(transactionId);
    const count = entry.seen.size;
    entry.resolve({ received: count > 0, reason, count, products: [...(entry?.seen || [])], error });
};

/**
 * Register interest in a transaction_id and wait until `threshold` distinct
 * products have arrived (or the timeout). Supports "batch" transactions: when
 * batchTransactionId is provided, multiple waits can be grouped and considered
 * together for resolving conditions. When `productId` is given, the wait
 * settles as soon as THAT product appears in a webhook batch (reason
 * 'product') — used by the exact-product refresh. Always resolves (never
 * rejects).
 *
 * @param {string} transactionId
 * @param {Object} [opts]
 * @param {number} [opts.threshold=12]
 * @param {number} [opts.timeoutMs=30000]
 * @param {string} [opts.productId] settle immediately when this ondcProductId arrives
 * @param {string} [opts.batchTransactionId] batch transaction to group multiple transactions
 * @returns {Promise<{received:boolean, reason:string, count:number, products: Array<string>, error: any}>}
 */
const waitForProducts = (
    transactionId,
    { threshold = DEFAULT_THRESHOLD, timeoutMs = DEFAULT_TIMEOUT_MS, productId, batchTransactionId } = {}
) =>
    new Promise((resolve) => {
        // If somehow already registered, settle the previous as superseded.
        if (pending.has(transactionId)) {
            settle(transactionId, 'superseded');
        }
        const timer = setTimeout(() => {
            // If part of a batch, settling the batch entity will settle all grouped transactions
            if (batchTransactionId && pending.has(batchTransactionId)) {
                settle(batchTransactionId, 'timeout');
            } else {
                settle(transactionId, 'timeout');
            }
        }, timeoutMs);

        // Handle batch transactions: group multiple transactionIds under a single batchTransactionId
        if (batchTransactionId) {
            if (pending.has(batchTransactionId)) {
                // Add this transactionId to the group's transactionId list
                let entry = pending.get(batchTransactionId);
                if (!entry.transactionIds.includes(transactionId)) {
                    entry.transactionIds.push(transactionId);
                }
                // Ensure this transaction points to its batch
                batch.set(transactionId, batchTransactionId);
            } else {
                // Create a new batch entry
                pending.set(batchTransactionId, {
                    resolve,
                    timer,
                    seen: new Set(),
                    threshold,
                    productId,
                    transactionIds: [transactionId]  // track all in this batch
                });
                batch.set(transactionId, batchTransactionId);
            }
        } else {
            // Non-batch: normal behavior
            pending.set(transactionId, { resolve, timer, seen: new Set(), threshold, productId });
        }
    });

/**
 * Called by the on_search webhook with the product ids stored in that callback.
 * Accumulates distinct ids and resolves the waiter once the awaited product
 * arrives (product-specific waits) or the threshold is hit.
 *
 * A NACK (`error` set) settles a *directed* wait (the seller answered for that
 * SKU). City-browse ingest has no waiter, so a NACK there is ignored.
 *
 * @param {string} transactionId
 * @param {Array<string>} [ondcProductIds]
 * @param {Object} [error] the callback's `error` object on NACK
 */
const notifyOnSearch = (transactionId, ondcProductIds = [], error = null) => {
    if (!transactionId) return;

    // Support batch: check if this txn belongs to a batch, and get the appropriate entry
    let entry = pending.get(transactionId);
    let batchId;
    if (!entry && batch && batch.has(transactionId)) {
        batchId = batch.get(transactionId);
        entry = pending.get(batchId);
    }

    if (!entry) {
        // City browse no longer registers a waiter — every seller's on_search
        // still ingests; this notify is only needed for directed product waits.
        return;
    }

    customLog(null, "info", { message: `notifyOnSearch: ${transactionId}`, ondcProductIds, hasError: Boolean(error) }, "VENDOR");

    // A NACK ends a directed one-SKU wait (the seller has already answered).
    // A broadcast city search has no productId waiter; one BPP NACK must not
    // look like the whole discovery failed.
    if (error) {
        if (entry.productId) {
            settle(batchId || transactionId, 'error', error);
        }
        return;
    }

    for (const pid of ondcProductIds) {
        if (pid) entry.seen.add(pid);
    }

    // For productId wait, must settle only the original transactionId—even if in a batch
    if (entry.productId && entry.seen.has(entry.productId)) {
        if (batchId) {
            settle(batchId, 'product');
        } else {
            settle(transactionId, 'product');
        }
        return;
    }

    // Threshold means threshold for the entire batch, or single txn if not in a batch
    if (entry.seen.size >= entry.threshold) {
        if (batchId) {
            settle(batchId, 'threshold');
        } else {
            settle(transactionId, 'threshold');
        }
    }
};

/** Cancel/clean up a pending waiter (e.g. client disconnected, search failed). */
const cancelWait = (transactionId, reason = 'cancelled') => {
    // Handle batch: if txnId is part of a batch, cancel the whole batch
    let idToSettle = transactionId;
    if (batch && batch.has(transactionId)) {
        idToSettle = batch.get(transactionId);
    }
    settle(idToSettle, reason);
};

module.exports = {
    waitForProducts,
    notifyOnSearch,
    cancelWait,
    resetForTests: () => {
        for (const entry of pending.values()) {
            if (entry?.timer) clearTimeout(entry.timer);
        }
        pending.clear();
        batch.clear();
    },
};
