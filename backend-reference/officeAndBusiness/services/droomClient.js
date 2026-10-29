/**
 * Shared Droom MYBIZ transport — vendor lookup, OAuth token acquisition, and the three
 * request shapes Droom uses: multipart POST (catalog, inspection), query-string GET
 * (history / vehicle-rc-details, PaaS report status) and JSON POST (PaaS report create —
 * the one MYBIZ endpoint that takes application/json). Split out of droomCatalog.js once
 * a second endpoint needed the same token, so one token serves them all.
 *
 * Credential columns are read in the SAME layout as the Traffic Challan product's
 * `payment/utils/droomClient.js` (optional3 = scope, optional4 = username,
 * optional5 = password), so both products share the one existing Droom `vendors` row —
 * no car-report-specific vendor row is needed. The scheduler sweep
 * (scheduler/services/carReportStatus.js) reads the same layout; change all together.
 *
 * One-time manual setup per environment: a `serviceOperators` row with
 * accessKey = 'car_report' (matches Peko-IN-Frontend's `accessKeys.vehicleReports`),
 * serviceStatus = true, pointing at the existing Droom vendor row.
 * See DROOM_MYBIZ_API_REFERENCE.md (workspace root) for the full API reference.
 */
const axios = require('axios');
const FormData = require('form-data');
// const { getValue, setValue } = require('../utils/cacheDataMethods');
const { customLog } = require('../utils/loggerHelper');
const { findServiceOperatorByAccessKey } = require('../utils/checkAndFetchServiceDetails');
const operatorsData = require('../utils/operatorsData.json');

// Sourced from operatorsData rather than a literal so this and the payment service's
// car-report endpoints can never resolve different serviceOperator rows.
const ACCESS_KEY = operatorsData.carReport.accessKey;

const fetchVendorDetails = async () => {
    const vendor = await findServiceOperatorByAccessKey(ACCESS_KEY);
    if (!vendor || vendor.error) throw new Error('Droom MYBIZ service is not configured');
    return vendor;
};

// Best-effort read of a JWT's `exp` claim (seconds since epoch) without a verification
// library — we're not validating the token, only estimating its remaining lifetime.
// const decodeJwtExpiry = (token) => {
//     try {
//         const payload = token.split('.')[1];
//         const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
//         return typeof decoded.exp === 'number' ? decoded.exp : null;
//     } catch (error) {
//         return null;
//     }
// };

const requestAccessToken = async (vendor) => {
    // Challan-layout columns: optional3 is the scope ('*', hardcoded below).
    const { apiUrl, optional1: clientId, optional2: clientSecret, optional4: username, optional5: password } = vendor.vendor;

    const response = await axios.post(
        `${apiUrl}/dss/v1/oauth/token`,
        new URLSearchParams({
            grant_type: 'password',
            client_id: clientId,
            client_secret: clientSecret,
            scope: '*',
            username,
            password,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token: accessToken } = response.data || {};
    if (!accessToken) throw new Error('Droom MYBIZ token response had no access_token');

    // let ttl = DEFAULT_TOKEN_TTL;
    // if (typeof expiresIn === 'number') {
    //     ttl = expiresIn - TOKEN_REFRESH_BUFFER;
    // } else {
    //     // const exp = decodeJwtExpiry(accessToken);
    //     // if (exp) ttl = Math.floor(exp - Date.now() / 1000) - TOKEN_REFRESH_BUFFER;
    // }
    // ttl = Math.max(ttl, 60);

    // await setValue(TOKEN_CACHE_KEY, ttl, accessToken);
    return accessToken;
};

const getAccessToken = async (vendor) => {
    
    return requestAccessToken(vendor);
};

// Most Droom endpoints Peko uses take multipart/form-data — the exception is the
// history lookup, which is a plain GET (see getDroomJson below). Undefined/empty fields
// are dropped rather than sent blank: the catalog endpoint keys its cascade level off
// which fields are present at all.
const buildForm = (fields) => {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
    });
    return form;
};

const post = async (apiUrl, path, form, accessToken, logTraceId) => {
    const config = {
        method: 'post',
        url: `${apiUrl}${path}`,
        headers: { ...form.getHeaders(), Authorization: `Bearer ${accessToken}` },
        data: form,
    };
    customLog(logTraceId, 'info', { url: config.url, params: form });
    const response = await axios(config);
    customLog(logTraceId, 'info', { result: response?.data }, 'VENDOR');
    return response.data;
};

const postJson = async (apiUrl, path, body, accessToken, logTraceId) => {
    const config = {
        method: 'post',
        url: `${apiUrl}${path}`,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        data: body,
    };
    customLog(logTraceId, 'info', { url: config.url, params: body });
    const response = await axios(config);
    customLog(logTraceId, 'info', { result: response?.data }, 'VENDOR');
    return response.data;
};

const get = async (apiUrl, path, params, accessToken, logTraceId) => {
    const config = {
        method: 'get',
        url: `${apiUrl}${path}`,
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
    };
    customLog(logTraceId, 'info', { url: config.url, params });
    const response = await axios(config);
    customLog(logTraceId, 'info', { result: response?.data }, 'VENDOR');
    return response.data;
};

// Resolves the vendor + a token, runs `attempt(apiUrl, accessToken)`, and retries once on
// a 401 with a fresh token. A 401 means the token died early (revoked, or rotated on
// Droom's side) — every endpoint wants the same handling, so it lives here rather than
// being copied per request shape.
const withTokenRetry = async (attempt, logTraceId) => {
    const vendor = await fetchVendorDetails();
    const { apiUrl } = vendor.vendor;
    const accessToken = await getAccessToken(vendor);

    try {
        return await attempt(apiUrl, accessToken);
    } catch (error) {
        if (error?.response?.status === 401) {
            return attempt(apiUrl, await getAccessToken(vendor, true));
        }
        customLog(logTraceId, 'error', { error: error?.response?.data || error.message }, 'VENDOR');
        throw error;
    }
};

// POSTs `fields` as multipart to `path` on the Droom gateway and returns the raw
// response body.
exports.postDroomForm = async (path, fields, logTraceId = null) =>
    withTokenRetry(
        (apiUrl, accessToken) => post(apiUrl, path, buildForm(fields), accessToken, logTraceId),
        logTraceId
    );

// GETs `path` with `params` as a query string and returns the raw response body. Used by
// the history lookup and the PaaS report status poll
// (see DROOM_MYBIZ_API_REFERENCE.md §4).
exports.getDroomJson = async (path, params, logTraceId = null) =>
    withTokenRetry(
        (apiUrl, accessToken) => get(apiUrl, path, params, accessToken, logTraceId),
        logTraceId
    );

// POSTs `body` as application/json to `path` and returns the raw response body. Used by
// the PaaS report create — Droom's v2 endpoints take JSON, unlike the multipart v1s.
exports.postDroomJson = async (path, body, logTraceId = null) =>
    withTokenRetry(
        (apiUrl, accessToken) => postJson(apiUrl, path, body, accessToken, logTraceId),
        logTraceId
    );
