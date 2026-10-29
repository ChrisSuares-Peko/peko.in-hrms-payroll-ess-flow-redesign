const rulesUseCase = require("../models/use-cases/ondc_catalog_rules");
const { bumpListCacheForCities } = require("./ondcProductListCache");
const { scheduleCategoryCountRefresh } = require("./ondcCategoryCountRefresher");
const { customLog } = require("../utils/loggerHelper");

/**
 * Glue for Manage > Products > Rules: the skip recorder for items refused at
 * ingest (imageless and banned-word ones — everything else is stored, hidden by
 * services/ondcProductVisibility.js), and the "delete products that already
 * match" step offered when a rule is added.
 */

const PRUNE_EVERY_MS = 60 * 60 * 1000;

let lastPruneAt = 0;

/**
 * Upsert skip rows (stamped now). Rows without a full product key are dropped.
 * Prunes rows older than the 24 h window at most hourly.
 */
const recordIngestSkips = async (rows) => {
    const now = new Date();
    const valid = (rows || [])
        .filter((r) => r.bppId && r.providerId && r.ondcProductId)
        .map((r) => ({
            ...r,
            productName: r.productName ? String(r.productName).slice(0, 512) : null,
            sellerName: r.sellerName ? String(r.sellerName).slice(0, 255) : null,
            ruleKey: r.ruleKey ? String(r.ruleKey).slice(0, 255) : null,
            lastSeenAt: now,
        }));
    if (valid.length) await rulesUseCase.upsertIngestSkips(valid);
    if (now.getTime() - lastPruneAt > PRUNE_EVERY_MS) {
        lastPruneAt = now.getTime();
        rulesUseCase.pruneIngestSkips(now).catch((error) =>
            customLog(null, "error", { scope: "ondcIngestSkips", step: "prune-failed", error: error?.message || String(error) }, "VENDOR")
        );
    }
};

/**
 * Hard-delete stored products a new rule matches (the admin chose "Delete"
 * over keeping them hidden).
 * @param {object[]} products  rows with `id`
 * @returns {Promise<number>} rows deleted
 */
const deleteMatchedProducts = async (products) => {
    if (!products.length) return 0;
    const deleted = await rulesUseCase.destroyProductsByIds(products.map((p) => p.id));
    await bumpListCacheForCities([]);
    scheduleCategoryCountRefresh();
    return deleted;
};

/**
 * Switch every product of a seller NP off (it was disabled and the admin chose
 * "Disable products") or back on (it was enabled again).
 * @returns {Promise<number>} rows updated
 */
const switchSellerNpProducts = async (bppId, visible) => {
    const n = await rulesUseCase.setSellerNpProductsVisible(bppId, visible);
    if (n) {
        await bumpListCacheForCities([]);
        scheduleCategoryCountRefresh();
    }
    return n;
};

module.exports = {
    recordIngestSkips,
    deleteMatchedProducts,
    switchSellerNpProducts,
};
