'use strict';

const axios = require('axios');
const { domainToUnicode } = require('url');
const { getValue, setValue } = require('./cacheDataMethods');
const { findServiceOperatorByAccessKey } = require('./checkAndFetchServiceDetails');
const { customLog } = require('./loggerHelper');
const operatorsData = require('./operatorsData.json');

// Bump version suffix to invalidate any previously cached stale data
const CACHE_KEY = 'domain_tld_list_v2';
const CACHE_TTL = 60 * 60 * 24; // 24 hours

// Fallback list used when the vendor API is unavailable
const FALLBACK_TLDS = [
    // Core generic
    "com", "net", "org", "info", "biz", "name", "mobi", "pro",
    // India-specific
    "in", "co.in", "net.in", "org.in", "firm.in", "gen.in", "ind.in",
    // Short / brandable
    "co", "io", "me", "tv", "us", "uk",
    // Business & tech
    "tech", "digital", "agency", "studio", "solutions", "services",
    "consulting", "company", "business", "network", "group", "global",
    // E-commerce & products
    "store", "shop", "market", "deals", "sale",
    // Web presence
    "online", "website", "site", "web", "app", "dev", "cloud",
    // Media & content
    "media", "press", "blog", "news", "social", "live", "today", "world",
    // Lifestyle
    "life", "style", "club", "fun", "guru", "expert",
    // Misc popular new gTLDs
    "space", "zone", "link", "works", "email", "design",
];

/**
 * Converts a punycode-encoded TLD (xn--...) to its unicode display form.
 * Returns null if conversion fails (invalid punycode).
 */
const decodePunycodeTld = (tld) => {
    try {
        const decoded = domainToUnicode(`test.${tld}`);
        // domainToUnicode returns the full host — extract just the TLD part
        const parts = decoded.split('.');
        return parts.length >= 2 ? parts.slice(1).join('.') : null;
    } catch {
        return null;
    }
};

/**
 * Returns a flat array of all available TLDs (ASCII/punycode format for use in vendor API calls).
 * Fetches from vendor API and caches for 24 hours.
 * Falls back to FALLBACK_TLDS if the API call fails or returns no data.
 *
 * The preordering API returns only niche/specialty TLDs, so FALLBACK_TLDS
 * (standard TLDs: com, net, org, in, etc.) are always included as the base.
 */
const getTldList = async (logTraceId = 'SYSTEM') => {
    const cached = await getValue(CACHE_KEY);
    if (cached) return JSON.parse(cached);

    customLog(logTraceId, 'info', { action: 'tldCache:miss', message: 'Cache empty — fetching from vendor' });

    const serviceOperator = await findServiceOperatorByAccessKey(operatorsData['domainAndHosting']['accessKey']);
    if (!serviceOperator || serviceOperator.error) {
        customLog(logTraceId, 'info', { action: 'tldCache:fetch', message: 'Vendor config not found — using fallback TLD list' });
        return FALLBACK_TLDS;
    }

    const authParams = {
        'auth-userid': serviceOperator.vendor.optional1,
        'api-key': serviceOperator.vendor.optional2,
    };
    const baseUrl = serviceOperator.vendor.apiUrl;
    const query = Object.entries(authParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

    try {
        const response = await axios.get(`${baseUrl}/api/domains/preordering/fetchtldlist.json?${query}`);
        const body = response.data;

        if (body?.status !== 'success' || !body?.response_value) {
            customLog(logTraceId, 'info', { action: 'tldCache:invalidResponse', message: 'Unexpected response — using fallback TLD list', body });
            return FALLBACK_TLDS;
        }

        // Flatten the TLD arrays from all categories (Object.values gives the arrays, not the category name keys)
        // Keep xn-- punycode as-is — needed for vendor availability API calls
        const apiTlds = [...new Set(Object.values(body.response_value).flat())];

        // Always prepend FALLBACK_TLDS — the preordering API only returns niche/specialty TLDs,
        // not standard ones like com/net/org/in
        const tlds = [...new Set([...FALLBACK_TLDS, ...apiTlds])];

        await setValue(CACHE_KEY, CACHE_TTL, JSON.stringify(tlds));
        customLog(logTraceId, 'info', { action: 'tldCache:fetched', message: `TLD list cached (${tlds.length} total: ${apiTlds.length} from API + ${FALLBACK_TLDS.length} standard)` });
        return tlds;
    } catch (err) {
        customLog(logTraceId, 'error', { action: 'tldCache:fetchFailed', message: 'Failed to fetch TLD list from vendor — using fallback', error: err?.response?.data || err.message });
        return FALLBACK_TLDS;
    }
};

module.exports = { getTldList, FALLBACK_TLDS, decodePunycodeTld };
