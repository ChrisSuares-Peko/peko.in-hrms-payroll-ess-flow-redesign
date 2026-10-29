const setting = require("../models/entities/setting");

/**
 * Storefront Top deals filters, kept in the generic `setting` table under
 * ONDC_TOP_DEALS (Manage > Products > Rules):
 *   minPrice        only products priced at or above this appear in Top deals
 *   maxDiscountPct  price sanity — a discount vs MRP above this (an inflated
 *                   MRP, usually) keeps the product out of Top deals
 * null disables a filter. Neither affects the normal catalog listing.
 */
const SETTING_NAME = "ONDC_TOP_DEALS";
const CACHE_TTL_MS = 60 * 1000;

let cached = null;
let cachedAt = 0;

const toNumberOrNull = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

const normalize = (details) => ({
    minPrice: toNumberOrNull(details?.minPrice),
    maxDiscountPct: toNumberOrNull(details?.maxDiscountPct),
});

const getTopDealsSettings = async () => {
    if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached;
    const row = await setting.findOne({ where: { name: SETTING_NAME }, raw: true });
    cached = normalize(row?.details);
    cachedAt = Date.now();
    return cached;
};

/** Merge `patch` into the stored settings; returns `{ before, after }`. */
const saveTopDealsSettings = async (patch) => {
    const row = await setting.findOne({ where: { name: SETTING_NAME } });
    const before = normalize(row?.details);
    const after = normalize({ ...before, ...patch });
    if (row) await row.update({ details: after });
    else await setting.create({ name: SETTING_NAME, details: after });
    cached = after;
    cachedAt = Date.now();
    return { before, after };
};

module.exports = { SETTING_NAME, getTopDealsSettings, saveTopDealsSettings };
