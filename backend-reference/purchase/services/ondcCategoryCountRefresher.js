const { refreshCategoryProductCounts } = require("../models/use-cases/ondc_category");
const { customLog } = require("../utils/loggerHelper");

// Wait for ingestion to go quiet before recomputing. A single catalog refresh
// arrives as many on_search callbacks over a few seconds, and recomputing per
// callback would run the same full-table aggregate dozens of times.
const DEBOUNCE_MS = 10 * 1000;

// ...but a busy network can keep callbacks trickling in indefinitely, which
// would starve the debounce forever. Recompute at least this often while
// requests keep coming.
const MAX_WAIT_MS = 60 * 1000;

let timer = null;
let firstRequestAt = 0;
let running = false;
let rerunRequested = false;

const runRefresh = async () => {
    if (running) {
        // Ingestion landed mid-run, so the aggregate we are finishing may
        // already be out of date — go again once this one settles.
        rerunRequested = true;
        return;
    }

    running = true;
    try {
        const summary = await refreshCategoryProductCounts();
        customLog(null, "info", {
            message: "ONDC category product counts refreshed",
            ...summary,
        }, "VENDOR");
    } catch (error) {
        customLog(null, "error", {
            message: "ONDC category product count refresh failed",
            error: error?.message || error,
            sql: error?.parent?.sql || error?.sql,
        }, "VENDOR");
    } finally {
        running = false;
        if (rerunRequested) {
            rerunRequested = false;
            exports.scheduleCategoryCountRefresh();
        }
    }
};

/**
 * Queue a recompute of the stored per-category product counts.
 *
 * Fire-and-forget and coalescing: call it freely from ingestion and admin
 * writes. Repeated calls collapse into one run once ingestion has been quiet
 * for DEBOUNCE_MS, or at the latest MAX_WAIT_MS after the first call in a
 * burst. Never throws and never blocks the caller — a webhook must still ACK
 * even if counting is broken.
 */
exports.scheduleCategoryCountRefresh = () => {
    const now = Date.now();
    if (!timer) firstRequestAt = now;

    // Don't let a continuous stream of callbacks push the run out forever.
    const elapsed = now - firstRequestAt;
    const delay = Math.max(0, Math.min(DEBOUNCE_MS, MAX_WAIT_MS - elapsed));

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
        timer = null;
        firstRequestAt = 0;
        runRefresh();
    }, delay);

    // Never keep the process alive just to recompute a count.
    if (typeof timer.unref === "function") timer.unref();
};

/** Test/shutdown hook — drops any pending run. */
exports.cancelCategoryCountRefresh = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    firstRequestAt = 0;
    rerunRequested = false;
};
