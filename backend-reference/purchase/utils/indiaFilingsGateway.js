const axios = require('axios');
const FormData = require('form-data');

const { findServiceOperatorByAccessKey } = require('./checkAndFetchServiceDetails');
const { getValue, setValue } = require('./cacheDataMethods');
const { customLog } = require('./loggerHelper');

// IndiaFilings vendor client for Gov Services V2 — config/auth shape mirrors
// officeAndBusiness/utils/indiaFilingsGateway.js (same vendor account),
// scoped to just what this feature needs.
//
// Config comes from the `business_registration` service-operator/vendor row:
//   vendor.apiUrl -> base_general, optional1 -> x-api-key, optional2 -> base_location,
//   optional3 -> login email, optional4 -> login password

const ACCESS_KEY = 'business_registration';

const TOKEN_CACHE_KEY = 'india_filings_api_token';
const TOKEN_TTL_SECONDS = 23 * 60 * 60;

// Axios has no default timeout.
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
    const url = `${cfg.baseLocation}/login`;
    // Never log the request/response bodies here — credentials and the token.
    customLog(null, 'info', { message: '[indiaFilings] request (login)', method: 'POST', url });
    const res = await axios.post(
        url,
        { email: cfg.loginEmail, password: cfg.loginPassword },
        { headers: { 'x-api-key': cfg.apiKey, 'Content-Type': 'application/json' }, timeout: REQUEST_TIMEOUT_MS }
    );
    customLog(null, 'info', { message: '[indiaFilings] response (login)', method: 'POST', url, status: res.status });
    const token = res.data?.api_token;
    if (!token) throw new Error(`Vendor login failed: ${JSON.stringify(res.data)}`);

    await setValue(TOKEN_CACHE_KEY, TOKEN_TTL_SECONDS, token);
    return token;
};

// The login api_token is a JWT carrying the account's gid claim.
exports.getTokenGid = async cfg => {
    try {
        const token = await getToken(cfg);
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
        return payload?.gid != null ? String(payload.gid) : null;
    } catch (err) {
        return null;
    }
};

// General endpoints live under /v3; location endpoints carry their own version.
const GENERAL_VERSION = '/v3';

const request = async (cfg, { base, method, path, params, data, withToken = true }) => {
    // Never logged: cfg.apiKey/loginEmail/loginPassword, the api-token header.
    const headers = { 'x-api-key': cfg.apiKey, 'Content-Type': 'application/json' };
    if (withToken) headers['api-token'] = await getToken(cfg);

    const root = base === 'general' ? `${cfg.baseGeneral}${GENERAL_VERSION}` : cfg.baseLocation;
    const url = `${root}${path}`;
    customLog(null, 'info', { message: '[indiaFilings] request', method, url, params: params ?? null, payload: data ?? null });
    try {
        const res = await axios({ method, url, headers, params, data, timeout: REQUEST_TIMEOUT_MS });
        customLog(null, 'info', { message: '[indiaFilings] response', method, url, status: res.status, response: res.data });
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

// Account info by email/customer_id.
exports.getCustomer = (cfg, params) =>
    request(cfg, { base: 'general', method: 'GET', path: '/pro/customer', params });

// Business List (doc §22) — every business under a gid.
exports.getBusinessList = (cfg, gid) =>
    request(cfg, { base: 'location', method: 'GET', path: '/v4/business', params: { gid } });

// View Business — same endpoint as Business List, scoped by application_id.
exports.getBusinessByApplicationId = (cfg, applicationId) =>
    request(cfg, { base: 'location', method: 'GET', path: '/v4/business', params: { application_id: applicationId } });

// Create Business by PAN (doc §23) — idempotent per PAN.
exports.createBusinessByPan = (cfg, body) =>
    request(cfg, { base: 'location', method: 'POST', path: '/v4/startup', data: body });

// Pincode -> state/district/country/city + serviceability.
exports.locationLookup = (cfg, pincode) =>
    request(cfg, { base: 'location', method: 'POST', path: '/location', data: { pincode } });

// Pincode -> GST jurisdiction (Commissionerate/Circle/Division/Range), each an array of
// {id, name} — GST_Registration.pdf §E6's pincode->jurisdiction step, confirmed live: same
// /pincode endpoint as the general location lookup, but on baseGeneral (not baseLocation) and
// with type: 'gst', which adds a gst_jurisdiction object to the response alongside the usual
// state/district/city fields.
exports.gstJurisdictionLookup = (cfg, pincode) =>
    request(cfg, { base: 'general', method: 'POST', path: '/pincode', data: { pincode, type: 'gst' } });

// Bulk catalog fetch (operation_type: getAllCatalogBIDbyData) — admin sync.
exports.getCatalog = (cfg, body) =>
    request(cfg, { base: 'general', method: 'POST', path: '/catalog', data: body, withToken: false });

// Same /catalog endpoint, scoped to one service_id — live pricing at payment time.
exports.getServiceDetailsById = (cfg, { service_id, status = '1' }) =>
    request(cfg, { base: 'general', method: 'POST', path: '/catalog', data: { operation_type: 'getServiceIDbyData', service_id, status }, withToken: false });

// Document types a corporate needs to upload for a given service_id.
exports.getServiceDocumentTypes = (cfg, { id, region = 'ind' }) =>
    request(cfg, { base: 'location', method: 'GET', path: '/v4/docs/Service', params: { id, region } });

// Multipart upload (not JSON base64 — large payloads make the vendor origin
// time out) — bypasses the shared request() helper, which only builds JSON bodies.
exports.uploadServiceDocument = async (cfg, fields, file) => {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => form.append(key, String(value)));
    form.append('file', file.buffer, { filename: file.fileName });
    const headers = { ...form.getHeaders(), 'x-api-key': cfg.apiKey, 'api-token': await getToken(cfg) };
    const url = `${cfg.baseLocation}/v4/docs/cloud-upload`;
    customLog(null, 'info', {
        message: '[indiaFilings] request (service document)',
        method: 'POST',
        url,
        payload: { ...fields, file: file.fileName },
    });
    try {
        const res = await axios.post(url, form, { headers, timeout: REQUEST_TIMEOUT_MS });
        customLog(null, 'info', {
            message: '[indiaFilings] response (service document)',
            method: 'POST',
            url,
            status: res.status,
            response: res.data,
        });
        return res.data;
    } catch (err) {
        customLog(null, 'error', {
            message: '[indiaFilings] error (service document)',
            method: 'POST',
            url,
            status: err?.response?.status ?? null,
            response: err?.response?.data ?? err.message,
        });
        throw err;
    }
};

// PAN holder verification (doc §12).
exports.verifyPan = (cfg, pan) =>
    request(cfg, { base: 'location', method: 'POST', path: '/v4/verify-pan', data: { pan } });

// Create Person (People API) — registers one authorized person/director/partner and returns
// people_id. Mirrors officeAndBusiness/utils/indiaFilingsGateway.js's createPerson exactly (same
// vendor account, same endpoint) — GST V2's own gateway had no people-API function until this was
// added for the GST filing's authorized-persons/partner_details feature.
exports.createPerson = (cfg, body) =>
    request(cfg, { base: 'location', method: 'POST', path: '/v4/global/people', data: body });


exports.createLead = (cfg, body) =>
    request(cfg, { base: 'general', method: 'POST', path: '/lead', data: body });

// Every engagement under a gid, across all services on the shared vendor account.
exports.getEngagementsByGid = (cfg, gid) =>
    request(cfg, { base: 'general', method: 'POST', path: '/engagements/service', data: { gid } });

// Same endpoint, scoped to a single engagement_id — backs the RM card.
exports.getEngagementByEngagementId = (cfg, engagementId) =>
    request(cfg, { base: 'general', method: 'POST', path: '/engagements/service', data: { engagement_id: engagementId } });

// Trademark Class Identification (doc §24) — goods/service text -> Nice class(es) + descriptions.
exports.getTrademarkClass = (cfg, goodsOrServices) =>
    request(cfg, { base: 'general', method: 'POST', path: '/trademark-description', data: { goods_or_services: goodsOrServices } });

// Similar Trademark Search — conflicting existing marks for a searched brand name.
exports.searchSimilarTrademarks = (cfg, searchTerm) =>
    request(cfg, { base: 'location', method: 'GET', path: '/trademark/search', params: { search_term: searchTerm, search_type: 'similar' } });


exports.searchTrademarkApplicationInfo = (cfg, applicationNumber) =>
    request(cfg, { base: 'location', method: 'GET', path: '/trademark/search', params: { search_term: applicationNumber, search_type: 'info' } });

// Smart Form Submission (doc §21) — files the Trademark Registration application.
exports.submitTrademarkSmartForm = (cfg, body) =>
    request(cfg, { base: 'general', method: 'POST', path: '/smartservices', data: body });

// Smart Form Submission — same /smartservices endpoint as Trademark, different
// form_id/form_data shape (GST Registration — PPOB, Service ID 79, Form ID 1).
exports.submitGstSmartForm = (cfg, body) =>
    request(cfg, { base: 'general', method: 'POST', path: '/smartservices', data: body });

// HSN code search (goods classification) for the "Top 5 - Goods & Services"
// field — re-confirmed live (2026-09-25) against the sandbox directly (Postman): the doc's POST
// verb 405s ("Method Not Allowed"), the real call is GET /v3/hsncode?hsncode=<search term> ->
// { data: [{ code, description }] } — not { hsn_code, hsn_description } as originally documented.
// Goods only — there is no sac_code in this response; SAC (services) search
// is a separate, still-unconfirmed endpoint (see searchSac below).
exports.searchHsnCode = (cfg, searchTerm) =>
    request(cfg, { base: 'general', method: 'GET', path: '/hsncode', params: { hsncode: searchTerm } });

// gstJurisdictionLookup() and searchSac() are intentionally NOT added yet —
// their endpoint contracts (base URL, verb, response shape) are unconfirmed by
// IndiaFilings. See GST_REGISTRATION_IMPLEMENTATION_PLAN.md §1.2 / Phase 2-3.

exports.addDirector = (cfg, body) =>
    request(cfg, { base: 'location', method: 'POST', path: '/v4/global/people', data: body });

exports.getDirectors = (cfg, gid) =>
    request(cfg, { base: 'location', method: 'GET', path: '/v4/global/people', params: { gid } });

exports.getDropdowns = (cfg, { service_id, operation }) =>
    request(cfg, { base: 'general', method: 'GET', path: '/dropdowns', params: { service_id, operation } });
