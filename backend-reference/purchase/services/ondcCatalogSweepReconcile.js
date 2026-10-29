const { customLog } = require("../utils/loggerHelper");
const { reconcileCatalogSweep } = require("../models/use-cases/ondc_product_with_transactionId");

// Wait for catalog_full on_search callbacks to go quiet before dropping SKUs
// this snapshot did not send. Link payloads arrive over minutes.
const DEBOUNCE_MS = 2 * 60 * 1000;
const MAX_WAIT_MS = 10 * 60 * 1000;

const sweeps = new Map();

const sweepKey = ({ city, domain, sweepId }) => `${city}|${domain}|${sweepId}`;

const runReconcile = async ({ city, domain, sweepId, ingested }) => {
    if (!ingested) {
        customLog(null, "info", {
            message: "ONDC catalog sweep reconcile skipped — zero products ingested",
            city,
            domain,
            sweepId,
        }, "VENDOR");
        return;
    }
    try {
        const result = await reconcileCatalogSweep({ city, domain, sweepId });
        customLog(null, "info", {
            message: "ONDC catalog sweep reconcile complete",
            city,
            domain,
            sweepId,
            ...result,
        }, "VENDOR");
    } catch (error) {
        customLog(null, "error", {
            message: "ONDC catalog sweep reconcile failed",
            city,
            domain,
            sweepId,
            error: error?.message || error,
        }, "VENDOR");
    }
};

/**
 * Queue a snapshot reconcile for one city+domain catalog_full sweep.
 * Call from on_search after a real-city upsert. Incremental city "*" must not
 * call this. A sweep that ingested nothing never deletes existing rows.
 */
const scheduleCatalogSweepReconcile = ({ city, domain, sweepId, ingested = 0 } = {}) => {
    if (!city || city === "*" || !domain || !sweepId) return;

    const key = sweepKey({ city, domain, sweepId });
    const now = Date.now();
    let state = sweeps.get(key);
    if (!state) {
        state = { firstAt: now, ingested: 0, city, domain, sweepId, timer: null };
        sweeps.set(key, state);
    }
    state.ingested += Number(ingested) || 0;

    const elapsed = now - state.firstAt;
    const delay = Math.max(0, Math.min(DEBOUNCE_MS, MAX_WAIT_MS - elapsed));
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => {
        sweeps.delete(key);
        const snapshot = state;
        state.timer = null;
        void runReconcile(snapshot);
    }, delay);
    if (typeof state.timer.unref === "function") state.timer.unref();
};

const cancelCatalogSweepReconcile = () => {
    for (const state of sweeps.values()) {
        if (state.timer) clearTimeout(state.timer);
    }
    sweeps.clear();
};

module.exports = {
    DEBOUNCE_MS,
    MAX_WAIT_MS,
    scheduleCatalogSweepReconcile,
    cancelCatalogSweepReconcile,
};
