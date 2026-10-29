const { Op } = require("sequelize");
const ondcProducts = require("../models/entities/ondc_product_with_transactionId");
const { customLog } = require("../utils/loggerHelper");
const { incrValue } = require("../utils/cacheDataMethods");

const OOS_DELETE_BATCH = 1000;
const STALE_MS = 24 * 60 * 60 * 1000;
const OFFICE_SUPPLIES = "OFFICE_SUPPLIES";
const LIST_CACHE_GLOBAL_VER = "ondc:list:ver:*";

const oosWhere = {
    availableQuantity: { [Op.lte]: 0 },
};

const staleWhere = (before) => ({
    source: OFFICE_SUPPLIES,
    updatedAt: { [Op.lt]: before },
});

const bumpListCache = async () => {
    try {
        await incrValue(LIST_CACHE_GLOBAL_VER);
    } catch (error) {
        customLog(null, "error", {
            message: "ONDC list cache bump failed",
            error: error?.message || error,
        }, "VENDOR");
    }
};

const destroyBatched = async (where, limit) => {
    let deleted = 0;
    for (;;) {
        const n = await ondcProducts.destroy({ where, limit });
        const count = Number(n) || 0;
        if (!count) break;
        deleted += count;
        if (count < limit) break;
    }
    return deleted;
};

/**
 * Midnight catalog purge (00:00 IST):
 * 1. Hard-delete office-supply rows not refreshed in 24 hours (disabled NPs
 *    freeze updatedAt because ingest is skipped).
 * 2. Hard-delete every source already at qty <= 0. Null qty is kept.
 *
 * Batched so a large table does not hold one giant delete lock. Bumps the
 * purchase list-cache global version so storefront pages miss immediately.
 */
exports.triggerOndcOosProductDelete = async ({
    batchSize = OOS_DELETE_BATCH,
    now = new Date(),
} = {}) => {
    const limit = Number(batchSize) > 0 ? Number(batchSize) : OOS_DELETE_BATCH;
    const before = new Date(now.getTime() - STALE_MS);
    try {
        const staleDeleted = await destroyBatched(staleWhere(before), limit);
        const oosDeleted = await destroyBatched(oosWhere, limit);
        const deleted = staleDeleted + oosDeleted;
        if (deleted) await bumpListCache();
        customLog(null, "info", {
            message: "ONDC product purge complete",
            deleted,
            staleDeleted,
            oosDeleted,
            staleBefore: before.toISOString(),
        }, "VENDOR");
        return { deleted, staleDeleted, oosDeleted };
    } catch (error) {
        customLog(null, "error", {
            message: "ONDC product purge failed",
            error: error?.message || error,
        }, "VENDOR");
        throw error;
    }
};
