'use strict';

/**
 * Resolves a single vendor price from cache for a specific billing cycle.
 * - domain:           pricingData[classkey].addnewdomain['1']
 * - hosting/shared:   pricingData[classkey][planId].add[cycle]
 * - titan/workspace:  pricingData[classkey].plans[planId].add[cycle]
 */
const resolveDomainHostingPrice = (pricingData, productId, planType, planId, billingCycle) => {
    const product = pricingData?.[productId];
    if (!product) return null;

    const getMinCyclePrice = (addObj) => {
        if (!addObj || typeof addObj !== 'object') return null;
        const keys = Object.keys(addObj).sort((a, b) => Number(a) - Number(b));
        for (const k of keys) {
            const p = parseFloat(addObj[k]);
            if (!isNaN(p) && p > 0) return p;
        }
        return null;
    };

    // Returns the minimum price value across all cycles (for per-month pricing like VPS).
    const getMinPriceValue = (addObj) => {
        if (!addObj || typeof addObj !== 'object') return null;
        const prices = Object.values(addObj).map(parseFloat).filter(p => !isNaN(p) && p > 0);
        return prices.length ? Math.min(...prices) : null;
    };

    if (planType === 'domain') {
        return parseFloat(product?.addnewdomain?.['1']) || null;
    }

    if (planType === 'shared_hosting') {
        const addObj = product?.[planId]?.add;
        if (billingCycle) {
            const p = parseFloat(addObj?.[String(billingCycle)]);
            if (!isNaN(p) && p > 0) return p;
        }
        return getMinCyclePrice(addObj);
    }

    if (planType === 'vps_server') {
        const addObj = product?.plans?.[planId]?.add;
        if (billingCycle) {
            const p = parseFloat(addObj?.[String(billingCycle)]);
            if (!isNaN(p) && p > 0) return p;
        }
        return getMinPriceValue(addObj);
    }

    if (planType === 'titan_email' || planType === 'google_workspace') {
        const addObj = product?.plans?.[planId]?.add;
        if (billingCycle) {
            const p = parseFloat(addObj?.[String(billingCycle)]);
            if (!isNaN(p) && p > 0) return p;
        }
        return getMinCyclePrice(addObj);
    }

    return null;
};

/**
 * Returns the full pricing breakdown for a plan — all billing cycles for both
 * "add" (new customers) and "renew" (existing customers).
 * Tries both cache structures automatically (no planType needed):
 *   1. pricingData[productId][planId]        — hosting/shared_hosting
 *   2. pricingData[productId].plans[planId]  — titan_email/google_workspace
 * Returns null if no pricing node is found.
 */
const resolvePlanPricingDetails = (pricingData, productId, planId) => {
    const product = pricingData?.[productId];
    if (!product) return null;

    // Try direct key first (hosting/shared_hosting), then nested .plans (titan/workspace)
    const node = product?.[planId] || product?.plans?.[planId] || null;

    if (!node) return null;

    const parseEntries = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        const result = {};
        for (const [cycle, price] of Object.entries(obj)) {
            const parsed = parseFloat(price);
            if (!isNaN(parsed) && parsed > 0) result[cycle] = parsed;
        }
        return Object.keys(result).length ? result : null;
    };

    const add = parseEntries(node.add);
    const renew = parseEntries(node.renew);

    if (!add && !renew) return null;

    return { add: add || {}, renew: renew || {} };
};

/**
 * Returns the list of valid billing cycle values (as integers) for a given plan.
 * Returns null if the plan/pricing node is not found.
 */
const getValidBillingCycles = (pricingData, productId, planType, planId) => {
    const product = pricingData?.[productId];
    if (!product) return null;

    let addObj;
    if (planType === 'shared_hosting') {
        addObj = product?.[planId]?.add;
    } else if (planType === 'vps_server' || planType === 'titan_email' || planType === 'google_workspace') {
        addObj = product?.plans?.[planId]?.add;
    } else {
        return null;
    }

    if (!addObj || typeof addObj !== 'object') return null;
    const cycles = Object.keys(addObj)
        .map(Number)
        .filter(n => !isNaN(n) && parseFloat(addObj[String(n)]) > 0);
    return cycles.length ? cycles : null;
};

module.exports = { resolveDomainHostingPrice, resolvePlanPricingDetails, getValidBillingCycles };
