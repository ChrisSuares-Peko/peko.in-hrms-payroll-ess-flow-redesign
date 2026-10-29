const axios = require('axios');

const { findServiceOperatorByAccessKey } = require('./checkAndFetchServiceDetails');
const { customLog } = require('./loggerHelper');
const withRetry = require('./withRetry');

// Restonik POS partner API client (Peko POS).
//
// Auth: a single `X-API-Key` header. The vendor rate-limits to 120 requests per
// minute per key, shared across every Peko tenant — reads are cached by the
// caller and every call goes through withRetry, which backs off on 429.
//
// Config is read from the `peko_pos` service-operator / vendor record:
//   vendor.apiUrl    -> partner API base (.../api/partner/v1, no trailing slash)
//   vendor.optional1 -> X-API-Key
//   vendor.optional2 -> OIDC initiate base (.../api/auth/oidc/initiate)
//   vendor.optional3 -> default target_link_uri (e.g. /admin/orders)
//   vendor.optional4 -> issuer override (blank -> process.env.IDP_ISSUER)
//
// NOTE: this helper is intentionally duplicated across officeAndBusiness, paymentGateway
// and scheduler.
// Each service ships as its own container in deploy, so cross-package require()
// breaks the pipeline. Keep the two copies in sync.

const ACCESS_KEY = 'peko_pos';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 2000;
const DEFAULT_TARGET_LINK_URI = '';

const MASK_FIELDS = ['apiKey', 'X-API-Key', 'x-api-key', 'email', 'phone'];

exports.configFromVendor = (vendor, serviceOperatorId) => {
    const row = vendor || {};
    const cfg = {
        baseUrl: row.apiUrl,
        apiKey: row.optional1,
        oidcInitiateUrl: row.optional2,
        defaultTargetLinkUri: row.optional3 || DEFAULT_TARGET_LINK_URI,
        issuer: row.optional4 || process.env.IDP_ISSUER,
        serviceOperatorId,
    };
    if (!cfg.baseUrl || !cfg.apiKey) return { error: 'Vendor configuration missing' };
    return cfg;
};

exports.getConfig = async () => {
    const service = await findServiceOperatorByAccessKey(ACCESS_KEY);
    if (!service || service.error) return { error: 'Vendor service unavailable' };
    return exports.configFromVendor(service.vendor, service.id);
};

const request = async (cfg, { method, path, data, params, traceId }) => {
    const url = `${cfg.baseUrl}${path}`;
    customLog(
        traceId,
        'info',
        { message: '[restonik] request', method, url, params: params || null, payload: data || null },
        'VENDOR',
        MASK_FIELDS
    );
    return withRetry(
        async () => {
            try {
                const response = await axios({
                    method,
                    url,
                    data,
                    params,
                    headers: { 'X-API-Key': cfg.apiKey, 'Content-Type': 'application/json' },
                    timeout: REQUEST_TIMEOUT_MS,
                });
                customLog(
                    traceId,
                    'info',
                    { message: '[restonik] response', method, url, status: response.status, response: response.data },
                    'VENDOR',
                    MASK_FIELDS
                );
                return response;
            } catch (err) {
                customLog(
                    traceId,
                    'error',
                    {
                        message: '[restonik] error',
                        method,
                        url,
                        status: err?.response?.status || null,
                        response: err?.response?.data || err.message,
                    },
                    'VENDOR',
                    MASK_FIELDS
                );
                throw err;
            }
        },
        MAX_ATTEMPTS,
        BASE_DELAY_MS
    );
};

const unwrap = body => (body && typeof body === 'object' && body.data !== undefined ? body.data : body);

// POST /restaurants is idempotent on externalId. The vendor reports that with a
// top-level `created` flag; a repeat call returns 200 + created:false carrying the
// EXISTING record unchanged — it does not apply the values just sent, so this is
// never a way to update a restaurant.
exports.createRestaurant = async (cfg, payload, traceId) => {
    const response = await request(cfg, { method: 'POST', path: '/restaurants', data: payload, traceId });
    const body = response.data || {};
    const data = unwrap(body) || {};
    return {
        created: body.created !== undefined ? Boolean(body.created) : response.status === 201,
        id: data.id || null,
        status: data.status || null,
        raw: data,
    };
};

exports.getRestaurant = async (cfg, id, traceId) => {
    const response = await request(cfg, { method: 'GET', path: `/restaurants/${id}`, traceId });
    return unwrap(response.data) || null;
};

exports.findRestaurantByExternalId = async (cfg, externalId, traceId) => {
    const response = await request(cfg, {
        method: 'GET',
        path: '/restaurants',
        params: { externalId, limit: 1 },
        traceId,
    });
    const data = unwrap(response.data);
    const list = Array.isArray(data) ? data : data?.items || data?.restaurants || [];
    return list[0] || null;
};

exports.updateRestaurant = async (cfg, id, patch, traceId) => {
    const response = await request(cfg, { method: 'PATCH', path: `/restaurants/${id}`, data: patch, traceId });
    return unwrap(response.data) || null;
};

exports.setRestaurantStatus = (cfg, id, status, traceId) =>
    exports.updateRestaurant(cfg, id, { status }, traceId);

// Third-party-initiated login (OIDC Core 4): we send the browser here and
// Restonik bounces it back to our own IdP to sign the user in.
exports.buildAdminSsoUrl = (cfg, options = {}) => {
    if (!cfg || !cfg.oidcInitiateUrl || !cfg.issuer) return null;
    const url = new URL(cfg.oidcInitiateUrl);
    url.searchParams.set('iss', cfg.issuer);
    if (options.loginHint) url.searchParams.set('login_hint', String(options.loginHint));
    url.searchParams.set('target_link_uri', options.targetLinkUri || cfg.defaultTargetLinkUri);
    return url.toString();
};

exports.mapVendorError = err => {
    const code = err?.response?.status;
    const message = err?.response?.data?.message;
    if (code === 400) return { httpStatus: 400, message: message || 'Invalid restaurant details' };
    if (code === 401 || code === 403) return { httpStatus: 502, message: 'Vendor authentication failed' };
    if (code === 404) return { httpStatus: 404, message: message || 'Restaurant not found' };
    if (code === 409) return { httpStatus: 409, message: message || 'Restaurant already exists' };
    if (code === 429) return { httpStatus: 503, message: 'Vendor rate limit reached, please retry shortly' };
    return { httpStatus: 500, message: message || 'POS provisioning failed' };
};
