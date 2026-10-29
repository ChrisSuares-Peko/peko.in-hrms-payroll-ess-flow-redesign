const axios = require('axios');

const { findServiceOperatorByAccessKey } = require('./checkAndFetchServiceDetails');
const { getValue, setValue } = require('./cacheDataMethods');
const { customLog } = require('./loggerHelper');

// IndiaFilings vendor client for the Gov Services V2 (vendor catalog) payment
// fulfilment — doc v1.1 §19 Create Order. Configured and authenticated exactly
// like officeAndBusiness/utils/indiaFilingsGateway.js and purchase's own copy
// (same shared vendor account) — ported here, scoped to just what this
// feature needs (order creation + gid resolution), rather than pulling in the
// whole Business Registration gateway. Keep the config/auth plumbing below in
// sync with those files if the shared vendor contract changes.
//
// Config is read from the `business_registration` service-operator / vendor
// record (same one officeAndBusiness's Business Registration feature uses):
//   vendor.apiUrl    -> base_general  (clean base, no /v3)
//   vendor.optional1 -> x-api-key
//   vendor.optional2 -> base_location
//   vendor.optional3 -> login email
//   vendor.optional4 -> login password

const ACCESS_KEY = 'business_registration';

const TOKEN_CACHE_KEY = 'india_filings_api_token';
const TOKEN_TTL_SECONDS = 23 * 60 * 60;

// Hard ceiling on any single vendor call so a stuck connection can't hang the
// request forever — axios has no default timeout.
const REQUEST_TIMEOUT_MS = 120000;

exports.getConfig = async () => {
    const service = await findServiceOperatorByAccessKey(ACCESS_KEY);
    if (!service || service.error) return { error: 'Vendor service unavailable' };

    const vendor = service.vendor || {};
    const cfg = {
        baseGeneral: vendor.apiUrl,
        apiKey: vendor.optional1,
        baseLocation: vendor.optional2,
        loginEmail: vendor.optional3,
        loginPassword: vendor.optional4,
    };
    if (!cfg.baseGeneral || !cfg.baseLocation || !cfg.apiKey) {
        return { error: 'Vendor configuration missing' };
    }
    return cfg;
};

const getToken = async cfg => {
    const cached = await getValue(TOKEN_CACHE_KEY);
    if (cached) return cached;

    const res = await axios.post(
        `${cfg.baseLocation}/login`,
        { email: cfg.loginEmail, password: cfg.loginPassword },
        { headers: { 'x-api-key': cfg.apiKey, 'Content-Type': 'application/json' }, timeout: REQUEST_TIMEOUT_MS }
    );
    const token = res.data?.api_token;
    if (!token) throw new Error(`Vendor login failed: ${JSON.stringify(res.data)}`);

    await setValue(TOKEN_CACHE_KEY, TOKEN_TTL_SECONDS, token);
    return token;
};

// The login api_token is a JWT whose payload carries the account's gid claim —
// the only verified way the vendor exposes a gid (a customer_id from
// /pro/customer is explicitly NOT a usable substitute).
exports.getTokenGid = async cfg => {
    try {
        const token = await getToken(cfg);
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
        return payload?.gid != null ? String(payload.gid) : null;
    } catch (err) {
        return null;
    }
};

// General endpoints live under the /v3 API version — added here in the client
// so the saved base URL (apiUrl) stays clean.
const GENERAL_VERSION = '/v3';

const request = async (cfg, { base, method, path, params, data, withToken = true }) => {
    const headers = { 'x-api-key': cfg.apiKey, 'Content-Type': 'application/json' };
    if (withToken) headers['api-token'] = await getToken(cfg);

    const root = base === 'general' ? `${cfg.baseGeneral}${GENERAL_VERSION}` : cfg.baseLocation;
    const url = `${root}${path}`;
    customLog(null, 'info', { message: '[indiaFilings] request', method, url, params: params ?? null });
    try {
        const res = await axios({ method, url, headers, params, data, timeout: REQUEST_TIMEOUT_MS });
        customLog(null, 'info', { message: '[indiaFilings] response', method, url, status: res.status });
        return res.data;
    } catch (err) {
        customLog(null, 'error', {
            message: '[indiaFilings] error',
            method,
            url,
            status: err?.response?.status ?? null,
            response: err?.response?.data ?? err.message,
        });
        throw err;
    }
};

// Create Order / Payment (doc v1.1 §19, USES gid) — creates the vendor
// payment order/engagement for a catalog service. Body: { gid, currency,
// total_amount, catalog_id, payment_id, application_id } — application_id
// (Create Business's own response, doc §23) links the created engagement to
// that specific business application; omitting it left the Smart Form
// submission (doc §21) unable to find it ("Engagement has no application_id
// linked"). gid here is the customer_id resolved by Create Lead (doc §6),
// passed through from the FE, not the shared JWT-derived gid. Returns
// data:[{transaction_id, engagement_id}] (sandbox) — engagement_id may carry
// an "E" prefix (strip to numeric for downstream lookups).
exports.createOrder = (cfg, body) =>
    request(cfg, { base: 'general', method: 'POST', path: '/payment', data: body });
