const axios = require('axios');
const FormData = require('form-data');

const { findServiceOperatorByAccessKey } = require('./checkAndFetchServiceDetails');
const { getValue, setValue } = require('./cacheDataMethods');
const { customLog } = require('./loggerHelper');

// Redact heavy/secret fields before logging a vendor payload: base64 file
// contents are truncated to a size marker so the logs stay readable and no
// document bytes are dumped.
const redactPayload = data => {
    if (!data || typeof data !== 'object') return data;
    const clone = { ...data };
    if (clone.file_string) clone.file_string = `<base64 ${String(clone.file_string).length} chars>`;
    return clone;
};

// IndiaFilings vendor client for the Business Registration feature.
//
// Auth model (differs from the Company Incorporation vendor):
//   - x-api-key : business key, sent on every request.
//   - api-token : 24h user token from POST /login, cached in-memory per key.
// Two base URLs: general (uat-api.filings.cloud — /v3 is added by the client) and
// location (in-api-uat.ledgers.cloud).
//
// Config is read from the `business_registration` service-operator / vendor record:
//   vendor.apiUrl    -> base_general  (clean base, no /v3)
//   vendor.optional1 -> x-api-key
//   vendor.optional2 -> base_location
//   vendor.optional3 -> login email
//   vendor.optional4 -> login password

const ACCESS_KEY = 'business_registration';

// Shared Redis cache for the 24h api-token (same approach as the Zoho integration).
const TOKEN_CACHE_KEY = 'india_filings_api_token';
const TOKEN_TTL_SECONDS = 23 * 60 * 60;

// Hard ceiling on any single vendor call so a stuck connection can't hang the
// request (and the user's spinner) forever — axios has no default timeout.
// Generous enough for a multi-MB document upload over UAT.
const REQUEST_TIMEOUT_MS = 120000;

// Fetch + validate vendor config from the DB vendor record (scalar columns, the
// app-wide convention). Returns { error } on misconfiguration so the controller
// can return a 503, mirroring the Company Incorporation pattern.
//   apiUrl -> base_general | optional1 -> x-api-key | optional2 -> base_location
//   optional3 -> login email | optional4 -> login password
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

// The login api_token is a JWT whose payload carries the account's gid claim
// (verified on sandbox 2026-07-07) — the only place the vendor exposes a gid.
exports.getTokenGid = async cfg => {
    try {
        const token = await getToken(cfg);
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
        return payload?.gid != null ? String(payload.gid) : null;
    } catch (err) {
        return null;
    }
};

// General endpoints live under the /v3 API version. We add it in the client so
// the saved base URL (apiUrl) stays clean (https://uat-api.filings.cloud, no /v3).
// Location endpoints carry their own version in the path (/v3, /v4) where needed.
const GENERAL_VERSION = '/v3';

// Single request helper. base = 'general' | 'location'; withToken attaches api-token.
const request = async (cfg, { base, method, path, params, data, withToken = true, headers: extraHeaders }) => {
    const headers = { 'x-api-key': cfg.apiKey, 'Content-Type': 'application/json', ...extraHeaders };
    if (withToken) headers['api-token'] = await getToken(cfg);

    const root = base === 'general' ? `${cfg.baseGeneral}${GENERAL_VERSION}` : cfg.baseLocation;
    const url = `${root}${path}`;
    // Log every vendor request (payload + params) and its outcome — success or
    // error — so the full IndiaFilings exchange is traceable. Auth headers
    // (x-api-key / api-token) are deliberately NOT logged.
    customLog(null, 'info', {
        message: '[indiaFilings] request',
        method,
        url,
        params: params ?? null,
        payload: redactPayload(data),
    });
    try {
        const res = await axios({ method, url, headers, params, data, timeout: REQUEST_TIMEOUT_MS });
        customLog(null, 'info', {
            message: '[indiaFilings] response',
            method,
            url,
            status: res.status,
            response: res.data,
        });
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

// ── Immediately usable (lookups) ─────────────────────────────────────────────

// Entity catalog & pricing. Key-only.
exports.getCatalog = (cfg, body) =>
    request(cfg, { base: 'general', method: 'POST', path: '/catalog', data: body, withToken: false });

// Business name availability (MCA). GET /v4/mca/search with query params
// (search_term, search_type); api-token required.
exports.mcaSearch = (cfg, params) =>
    request(cfg, { base: 'location', method: 'GET', path: '/v4/mca/search', params });

// NIC business-activity list for a classification level.
exports.getBusinessActivities = (cfg, level = 4) =>
    request(cfg, { base: 'location', method: 'GET', path: '/v4/bizactivity/india-activity', params: { level } });

// Pincode -> state/district. Vendor moved this to the general base /v3/pincode.
exports.locationLookup = (cfg, pincode) =>
    request(cfg, { base: 'general', method: 'POST', path: '/pincode', data: { pincode } });

// Pincode + type 'gst' -> the SAME /pincode endpoint returns the GST jurisdiction
// (Commissionerate/Circle/Division/Range) under data.gst_jurisdiction, alongside the
// usual state/district/city (verified 2026-09-18). Used by the proprietorship GST form.
exports.jurisdictionLookup = (cfg, pincode) =>
    request(cfg, { base: 'general', method: 'POST', path: '/pincode', data: { pincode, type: 'gst' } });

// HSN/SAC code search for the GST form's Top-5 Goods & Services picker. POST
// GET /v3/hsncode?hsncode= -> data: [{ hsn_code, hsn_description }]. Vendor serves
// this as a GET with a query param (not a POST body).
exports.searchHsnCode = (cfg, hsncode) =>
    request(cfg, { base: 'general', method: 'GET', path: '/hsncode', params: { hsncode } });

// PAN holder verification (moved to /v4 in the updated v1.1 doc).
exports.verifyPan = (cfg, pan) =>
    request(cfg, { base: 'location', method: 'POST', path: '/v4/verify-pan', data: { pan } });

// Account info (email OR customer_id). Some fields return Base64-encoded.
exports.getCustomer = (cfg, params) =>
    request(cfg, { base: 'general', method: 'GET', path: '/pro/customer', params });

// DIN validation — MCA director data + related companies (doc v1.1 §13). Key-only;
// GET carries a JSON body, same quirk as mcaSearch. NOTE: documented on the PROD
// host (in-api.ledgers.cloud); UAT equivalent unconfirmed with the vendor.
exports.mcaDirector = (cfg, body) =>
    request(cfg, { base: 'location', method: 'GET', path: '/mca/director', data: body, withToken: false });

// ── Create / write chain (v1.1; open items: gid provisioning, entity_type enum, doc IDs) ─

// Lead / account (GID) creation — vendor moved this to /v3/lead (2026-09-21).
exports.createLead = (cfg, body) =>
    request(cfg, { base: 'general', method: 'POST', path: '/lead', data: body });

// Customer feedback / Google-reviews rating (insert_rating). Forwards the end-user's
// IP as Client-IP. status: 1 Desktop, 2 Mobile. Key-only (spec lists no api-token).
exports.submitFeedback = (cfg, body, clientIp) =>
    request(cfg, {
        base: 'general',
        method: 'POST',
        path: '/google-reviews',
        data: { operation: 'insert_rating', ...body },
        withToken: false,
        headers: clientIp ? { 'Client-IP': clientIp } : undefined,
    });

// Moved to /v4/startup (was /business/add-startup).
exports.addStartup = (cfg, body) =>
    request(cfg, { base: 'location', method: 'POST', path: '/v4/startup', data: body });

// Moved to /v4/global/people in the updated v1.1 doc (verified working on UAT).
exports.createPerson = (cfg, body) =>
    request(cfg, { base: 'location', method: 'POST', path: '/v4/global/people', data: body });

// Shareholding record per shareholder (doc v1.1 §15) — after Add Director.
exports.createShareholding = (cfg, body) =>
    request(cfg, { base: 'location', method: 'POST', path: '/v4/shareholdings', data: body });

// KYC/KYB status + document list (latest doc §16; People flow VERIFIED working
// on UAT 13-07 — returns the per-type document_Nid checklist).
exports.kycStatus = (cfg, body) =>
    request(cfg, { base: 'location', method: 'POST', path: '/v4/docs/kyc-status', data: body });

// Business/service document types for a catalog service (per entity). Required
// set = smartservice === 1 && status === 1; upload Nid = ledgers_document_id.
exports.getServiceDocumentTypes = (cfg, serviceId) =>
    request(cfg, { base: 'location', method: 'GET', path: '/v4/docs/Service', params: { id: serviceId, region: 'ind' } });

// Multipart form-data upload to /v4/docs/cloud-upload — the raw file is sent as a
// file part (NOT a base64 JSON body). This is the reliable path for BOTH People
// and Service documents; a large base64 JSON body makes the vendor origin time
// out (504). `fields` carries the process-specific keys, `file` the raw buffer.
const uploadMultipartDocument = async (cfg, fields, file, label) => {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => form.append(key, String(value)));
    form.append('file', file.buffer, { filename: file.fileName });
    const headers = { ...form.getHeaders(), 'x-api-key': cfg.apiKey, 'api-token': await getToken(cfg) };
    const url = `${cfg.baseLocation}/v4/docs/cloud-upload`;
    customLog(null, 'info', {
        message: `[indiaFilings] request (${label})`,
        method: 'POST',
        url,
        payload: { ...fields, file: file.fileName },
    });
    try {
        const res = await axios.post(url, form, { headers, timeout: REQUEST_TIMEOUT_MS });
        customLog(null, 'info', {
            message: `[indiaFilings] response (${label})`,
            method: 'POST',
            url,
            status: res.status,
            response: res.data,
        });
        return res.data;
    } catch (err) {
        customLog(null, 'error', {
            message: `[indiaFilings] error (${label})`,
            method: 'POST',
            url,
            status: err?.response?.status ?? null,
            response: err?.response?.data ?? err.message,
        });
        throw err;
    }
};

// People (KYC) Document upload — multipart form-data. VERIFIED on UAT: process
// 'People Document', request_on 'kyc', peopleid + document_Nid, file as a part.
exports.uploadPeopleDocument = (cfg, fields, file) =>
    uploadMultipartDocument(cfg, fields, file, 'people document');

// Service Document upload — multipart form-data. VERIFIED on UAT 15-07: process
// 'Service Document', request_on 'workspace', engagement_id with the lowercase
// 'e' prefix.
exports.uploadServiceDocument = (cfg, fields, file) =>
    uploadMultipartDocument(cfg, fields, file, 'service document');

// Signed URLs for uploaded documents (doc v1.1 §18). NOTE: documented on the PROD
// host; UAT equivalent unconfirmed with the vendor.
exports.docsView = (cfg, body) =>
    request(cfg, { base: 'location', method: 'POST', path: '/v4/docs/view', data: body });

exports.createOrder = (cfg, body) =>
    request(cfg, { base: 'general', method: 'POST', path: '/payment', data: body });

// Smart form filing (§21) — the actual incorporation filing after payment.
// DEPLOYED on UAT 21-07 (was 404). Current 422s are data-linkage validation
// (engagement↔Smartform, open_application_id) pending vendor answers.
exports.fileSmartForm = (cfg, body) =>
    request(cfg, { base: 'general', method: 'POST', path: '/smartservices', data: body });

exports.getEngagement = (cfg, body) =>
    request(cfg, { base: 'general', method: 'POST', path: '/engagements/service', data: body });

// Smart form status/record (§21.3) — deployed alongside fileSmartForm (21-07).
exports.getSmartForm = (cfg, params) =>
    request(cfg, { base: 'general', method: 'GET', path: '/smartservices', params });

// MOA/AOA draft generation (§16) — separate host the vendor stood up for their
// AI document service ("rough draft" per their 18-07 mail; consolidated APIs
// promised post-launch, so the host stays a const until then).
const BASE_GPT = 'https://uat-gpt.filings.cloud';
exports.generateDocDraft = async (cfg, body) => {
    const headers = { 'x-api-key': cfg.apiKey, 'Content-Type': 'application/json' };
    headers['api-token'] = await getToken(cfg);
    const res = await axios.post(`${BASE_GPT}/june/docs-draft`, body, { headers });
    return res.data;
};

// Fetch a (vendor-hosted) file as base64 — used to pull generated MOA/AOA
// drafts so they can be re-uploaded to the engagement as Service Documents.
exports.downloadFileBase64 = async url => {
    const res = await axios.get(url, { responseType: 'arraybuffer', maxRedirects: 5 });
    return Buffer.from(res.data).toString('base64');
};

// ── Mock mode ────────────────────────────────────────────────────────────────
// INDIA_FILINGS_MOCK=true swaps ONLY the endpoints listed in ./indiaFilingsMock
// (the ones broken/undeployed on the vendor sandbox — smart form, MOA/AOA
// download) for recorded responses; everything else always hits the real
// vendor. Checked per call — no restart-order issues.
const mock = require('./indiaFilingsMock');
const mockEnabled = () => String(process.env.INDIA_FILINGS_MOCK).toLowerCase() === 'true';
Object.keys(module.exports).forEach(name => {
    if (typeof mock[name] !== 'function') return;
    const real = module.exports[name];
    module.exports[name] = (...args) =>
        mockEnabled() ? Promise.resolve(mock[name](...args)) : real(...args);
});
