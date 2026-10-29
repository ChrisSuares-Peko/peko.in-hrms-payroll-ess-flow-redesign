/* eslint-disable no-undef */
const axios = require('axios');

const { getValue, setValue } = require('./cacheDataMethods');
const { customLog } = require('./loggerHelper');

// Droom (Vahaan) traffic-challan vendor client.
// Vendor config comes from the `vendor` row via fetchServiceDetails():
//   apiUrl    -> base host only, e.g. https://apig.droom.in  (the /dss prefix is owned here)
//   optional1 -> client_id
//   optional2 -> client_secret  (this is ALSO the company_token for Push Order)
//   optional3 -> scope (e.g. *)
//   optional4 -> username
//   optional5 -> password

const TOKEN_CACHE_KEY = 'droom_oauth_token';

// Build a full Droom endpoint from the configured host. The `/dss` namespace is a fixed
// part of the API contract, so we own it in code — the DB only stores the host. Any
// trailing slash on apiUrl is stripped so the row is forgiving to enter.
// All Droom challan endpoints (token, get-challan, order-process) live under /dss.
const dssUrl = (vendor, path) => `${(vendor.apiUrl || '').replace(/\/+$/, '')}/dss${path}`;

// OAuth2 password grant. Cached in Redis until shortly before expiry (mirrors the
// BillAvenue token pattern in controllers/corporate/bbps.js).
const getDroomToken = async (vendor, logTraceId = null, forceRefresh = false) => {
    try {
        if (!forceRefresh) {
            const cached = await getValue(TOKEN_CACHE_KEY);
            if (cached) return cached;
        }

        const body = new URLSearchParams({
            grant_type: 'password',
            client_id: vendor.optional1,
            client_secret: vendor.optional2,
            scope: vendor.optional3 || '*',
            username: vendor.optional4,
            password: vendor.optional5,
        });

        const response = await axios.post(dssUrl(vendor, '/v1/oauth/token'), body.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const token = response.data && response.data.access_token;
        const expiresIn = response.data && response.data.expires_in;
        if (token) {
            // refresh 60s early to avoid edge-of-expiry failures
            const ttl = expiresIn ? Math.max(60, Number(expiresIn) - 60) : 3000;
            await setValue(TOKEN_CACHE_KEY, ttl, token);
            return token;
        }
        customLog(logTraceId, 'error', { message: 'Droom token mint returned no access_token', status: response.status, data: JSON.stringify(response.data) }, 'VENDOR');
        return false;
    } catch (error) {
        customLog(logTraceId, 'error', { message: 'Droom token fetch failed', url: dssUrl(vendor, '/v1/oauth/token'), status: error.response && error.response.status, data: error.response && error.response.data, error: error.message }, 'VENDOR');
        return false;
    }
};

// GET /get-challan?registration_number=<VRN>  -> { code:'success', data:[...] }
const fetchChallans = async (vendor, registrationNumber, token, logTraceId = null, attempt = 0) => {
    const url = dssUrl(vendor, '/get-challan');
    customLog(logTraceId, 'info', { message: 'Droom fetch-challan request', method: 'get', url, registrationNumber, attempt }, 'VENDOR');
    try {
        const response = await axios.get(url, {
            params: { registration_number: registrationNumber },
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        // Challan arrays get long — log the shape here, full body only on the non-success branch below.
        customLog(logTraceId, 'info', { message: 'Droom fetch-challan response', url, registrationNumber, attempt, status: response.status, code: response.data && response.data.code, vendorMessage: response.data && response.data.message, challanCount: Array.isArray(response.data && response.data.data) ? response.data.data.length : null }, 'VENDOR');
        if (response.data && response.data.code === 'success') {
            return { status: true, data: response.data.data || [] };
        }
        // Droom reports "no challans for this vehicle" as code:"failed" + "Data not found".
        if (/data not found/i.test((response.data && response.data.message) || '')) {
            return { status: true, data: [] };
        }
        // Droom returns a bad/expired token as HTTP 200 + code:"failed" with an "authorization …"
        // message (NOT a 401). Treat that like a stale token: mint fresh and retry once.
        const failMsg = ((response.data && response.data.message) || '').toLowerCase();
        if (attempt === 0 && failMsg.includes('authorization')) {
            const freshToken = await getDroomToken(vendor, logTraceId, true);
            if (freshToken) return fetchChallans(vendor, registrationNumber, freshToken, logTraceId, 1);
        }
        // HTTP 200 + code!=='success' for anything other than "Data not found" — log the body.
        customLog(logTraceId, 'error', { message: 'Droom fetch-challan returned non-success', url, registrationNumber, attempt, status: response.status, data: JSON.stringify(response.data) }, 'VENDOR');
        return { status: false, data: response.data };
    } catch (error) {
        // Self-heal: a stale/invalidated cached token returns 401 — mint a fresh one and retry once.
        if (attempt === 0 && error.response && error.response.status === 401) {
            const freshToken = await getDroomToken(vendor, logTraceId, true);
            if (freshToken) return fetchChallans(vendor, registrationNumber, freshToken, logTraceId, 1);
        }
        customLog(logTraceId, 'error', { message: 'Droom fetch-challan failed', url, registrationNumber, status: error.response && error.response.status, data: JSON.stringify(error.response && error.response.data), error: error.message }, 'VENDOR');
        return { status: false, data: { error: error.message } };
    }
};

// POST /v2/order-process  (Push Order) — registers the paid challans with Droom.
// company_token is injected from the vendor's client_secret (optional2).
const pushOrder = async (vendor, body, token, logTraceId = null, attempt = 0) => {
    const url = dssUrl(vendor, '/v2/order-process');
    const payload = { ...body, company_token: vendor.optional2 };
    const config = {
        method: 'post',
        url,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: payload,
    };
    customLog(logTraceId, 'info', { message: 'Droom pushOrder config', method: 'post', url, body: JSON.stringify(payload) }, 'VENDOR');
    try {
        const response = await axios(config);
        customLog(logTraceId, 'info', { message: 'Droom pushOrder response', url, status: response.status, data: JSON.stringify(response.data) }, 'VENDOR');
        if (response.data && response.data.code === 'success') {
            return { status: true, data: response.data };
        }
        // Same as fetch: a bad/expired token comes back as 200 + code:"failed" — refresh and retry once.
        const failMsg = ((response.data && response.data.message) || '').toLowerCase();
        if (attempt === 0 && failMsg.includes('authorization')) {
            const freshToken = await getDroomToken(vendor, logTraceId, true);
            if (freshToken) return pushOrder(vendor, body, freshToken, logTraceId, 1);
        }
        return { status: false, data: response.data };
    } catch (error) {
        // Self-heal: a stale/invalidated cached token returns 401 — mint a fresh one and retry once.
        if (attempt === 0 && error.response && error.response.status === 401) {
            customLog(logTraceId, 'info', { message: 'Droom token rejected (401) — refreshing token and retrying push-order', url }, 'VENDOR');
            const freshToken = await getDroomToken(vendor, logTraceId, true);
            if (freshToken) return pushOrder(vendor, body, freshToken, logTraceId, 1);
        }
        customLog(logTraceId, 'error', { message: 'Droom push-order failed', url, body: JSON.stringify(payload), status: error.response && error.response.status, data: JSON.stringify(error.response && error.response.data), error: error.message }, 'VENDOR');
        return { status: false, data: (error.response && error.response.data) || { error: error.message } };
    }
};

// GET /challan/orderdetail?order_id=<reference_id> — live order status + per-challan breakdown.
const getOrderDetail = async (vendor, orderId, token, logTraceId = null, attempt = 0) => {
    const url = dssUrl(vendor, '/challan/orderdetail');
    try {
        const response = await axios.get(url, {
            params: { order_id: orderId },
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (response.data && response.data.code === 'success') {
            return { status: true, data: response.data.data || [] };
        }
        const failMsg = ((response.data && response.data.message) || '').toLowerCase();
        if (attempt === 0 && failMsg.includes('authorization')) {
            const freshToken = await getDroomToken(vendor, logTraceId, true);
            if (freshToken) return getOrderDetail(vendor, orderId, freshToken, logTraceId, 1);
        }
        return { status: false, data: response.data };
    } catch (error) {
        if (attempt === 0 && error.response && error.response.status === 401) {
            const freshToken = await getDroomToken(vendor, logTraceId, true);
            if (freshToken) return getOrderDetail(vendor, orderId, freshToken, logTraceId, 1);
        }
        customLog(logTraceId, 'error', { message: 'Droom order-detail failed', url, orderId, status: error.response && error.response.status, data: JSON.stringify(error.response && error.response.data), error: error.message }, 'VENDOR');
        return { status: false, data: { error: error.message } };
    }
};

module.exports = { getDroomToken, fetchChallans, pushOrder, getOrderDetail };
