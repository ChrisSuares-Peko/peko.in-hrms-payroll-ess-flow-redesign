/* eslint-disable no-undef */
const axios = require('axios');

const { getValue, setValue } = require('./cacheDataMethods');
const { customLog } = require('./loggerHelper');

// Droom (Vahaan) traffic-challan vendor client (paymentGateway copy — mirrors payment MS).
// Vendor config comes from the `vendor` row via fetchServiceDetails():
//   apiUrl    -> base host only, e.g. https://apig.droom.in  (the /dss prefix is owned here)
//   optional1 -> client_id
//   optional2 -> client_secret  (this is ALSO the company_token for Push Order)
//   optional3 -> scope (e.g. *)
//   optional4 -> username
//   optional5 -> password

const TOKEN_CACHE_KEY = 'droom_oauth_token';

// All Droom challan endpoints (token, order-process) live under /dss.
const dssUrl = (vendor, path) => `${(vendor.apiUrl || '').replace(/\/+$/, '')}/dss${path}`;

// OAuth2 password grant, cached in Redis until shortly before expiry.
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
            const ttl = expiresIn ? Math.max(60, Number(expiresIn) - 60) : 3000;
            await setValue(TOKEN_CACHE_KEY, ttl, token);
            return token;
        }
        return false;
    } catch (error) {
        customLog(logTraceId, 'error', { message: 'Droom token fetch failed', url: dssUrl(vendor, '/v1/oauth/token'), status: error.response && error.response.status, data: error.response && error.response.data, error: error.message }, 'VENDOR');
        return false;
    }
};

// POST /v2/order-process (Push Order) — company_token injected from client_secret (optional2).
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
        // Droom reports a stale/invalidated token as 200 + code:"failed" ("authorization …"), not a 401.
        const failMsg = ((response.data && response.data.message) || '').toLowerCase();
        if (attempt === 0 && failMsg.includes('authorization')) {
            customLog(logTraceId, 'info', { message: 'Droom token rejected — refreshing token and retrying push-order', url }, 'VENDOR');
            const freshToken = await getDroomToken(vendor, logTraceId, true);
            if (freshToken) return pushOrder(vendor, body, freshToken, logTraceId, 1);
        }
        return { status: false, data: response.data };
    } catch (error) {
        if (attempt === 0 && error.response && error.response.status === 401) {
            customLog(logTraceId, 'info', { message: 'Droom token rejected (401) — refreshing token and retrying push-order', url }, 'VENDOR');
            const freshToken = await getDroomToken(vendor, logTraceId, true);
            if (freshToken) return pushOrder(vendor, body, freshToken, logTraceId, 1);
        }
        customLog(logTraceId, 'error', { message: 'Droom push-order failed', url, body: JSON.stringify(payload), status: error.response && error.response.status, data: JSON.stringify(error.response && error.response.data), error: error.message }, 'VENDOR');
        return { status: false, data: (error.response && error.response.data) || { error: error.message } };
    }
};

module.exports = { getDroomToken, pushOrder };
