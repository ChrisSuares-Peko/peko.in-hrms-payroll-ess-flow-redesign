"use strict";

// Shared Zoho auth — the single source of Zoho access/refresh tokens.
// Consumed by both chartOfAccount.js and journal.js so the token logic lives once.
const axios = require("axios");
const { getValue, setValue, deleteValue } = require("../../cacheDataMethods");
const { customLog } = require("../../loggerHelper");

const ZOHO_CODE = process.env.ZOHO_COA_CODE;
const ZOHO_CLIENT_ID = process.env.ZOHO_COA_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_COA_CLIENT_SECRET;
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI;
const DOMAIN = process.env.ZOHO_DOMAIN || ".com";
const REFRESH_TOKEN = process.env.ZOHO_COA_REFRESH_TOKEN;
const REQUEST_TIMEOUT_MS = Number(process.env.ZOHO_REQUEST_TIMEOUT_MS) || 20000;

const TOKEN_URL = `https://accounts.zoho${DOMAIN}/oauth/v2/token`;
const REFRESH_TOKEN_KEY = "zoho-coa-refresh-token";
const INVALID_TOKEN_ERRORS = ["invalid_code", "invalid_token"];

// The client secret and tokens travel in the form body, never the URL, so they cannot end up in logs or error messages.
const postToken = (params) =>
    axios.post(TOKEN_URL, new URLSearchParams(params).toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: REQUEST_TIMEOUT_MS,
    });

const getRefreshToken = async () => {
    const cached = await getValue(REFRESH_TOKEN_KEY);
    if (cached) return cached;

    // Use env var if already set
    if (REFRESH_TOKEN) {
        await setValue(REFRESH_TOKEN_KEY, Infinity, REFRESH_TOKEN);
        return REFRESH_TOKEN;
    }

    // Single time use only — exchanges ZOHO_COA_CODE for a refresh token
    try {
        const response = await postToken({
            code: ZOHO_CODE,
            client_id: ZOHO_CLIENT_ID,
            client_secret: ZOHO_CLIENT_SECRET,
            redirect_uri: ZOHO_REDIRECT_URI,
            grant_type: "authorization_code",
        });
        const { access_token, refresh_token, expires_in } = response.data;
        await setValue(REFRESH_TOKEN_KEY, Infinity, refresh_token);
        await setValue("zoho-coa-access-token", expires_in, access_token);
        return refresh_token;
    } catch (error) {
        customLog(null, "error", {
            message: "Failed to exchange Zoho auth code for refresh token",
            error: error?.response?.data || error.message,
        });
        return false;
    }
};

const getZohoAccessToken = async (afterReset = false) => {
    let ACCESS_TOKEN = await getValue("zoho-coa-access-token");
    if (ACCESS_TOKEN) return ACCESS_TOKEN;

    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
        customLog(null, "error", {
            message:
                "No Zoho refresh token available — set ZOHO_COA_REFRESH_TOKEN in env",
        });
        return false;
    }

    let reply;
    try {
        const response = await postToken({
            refresh_token: refreshToken,
            client_id: ZOHO_CLIENT_ID,
            client_secret: ZOHO_CLIENT_SECRET,
            redirect_uri: ZOHO_REDIRECT_URI,
            grant_type: "refresh_token",
        });
        reply = response.data || {};
    } catch (error) {
        reply = error?.response?.data || {};
        if (!reply.error) {
            customLog(null, "error", {
                message: "Failed to fetch Zoho access token",
                error: error.message,
            });
            return false;
        }
    }

    // The env token was rotated but Redis still holds the old one: drop the cached copy and try once more, which reads the env.
    if (
        !afterReset &&
        REFRESH_TOKEN &&
        REFRESH_TOKEN !== refreshToken &&
        INVALID_TOKEN_ERRORS.includes(reply.error)
    ) {
        await deleteValue(REFRESH_TOKEN_KEY);
        customLog(null, "info", {
            message: "Zoho rejected the cached refresh token — reloading it from env and retrying once",
        });
        return getZohoAccessToken(true);
    }

    if (!reply.access_token) {
        customLog(null, "error", {
            message: reply.error
                ? "Failed to fetch Zoho access token"
                : "Zoho token refresh returned no access_token",
            data: reply,
        });
        return false;
    }
    await setValue("zoho-coa-access-token", reply.expires_in, reply.access_token);
    return reply.access_token;
};

// Clears the cached access token so the next getZohoAccessToken() call is forced to fetch
// a fresh one via the refresh token — used when Zoho itself rejects the cached one (401),
// since otherwise every call would keep reusing the same bad token until its TTL expires.
const invalidateAccessToken = async () => {
    await deleteValue("zoho-coa-access-token");
};

// Invalidate-then-fetch in one step, for a caller that already knows the cached token is bad.
const refreshZohoAccessToken = async () => {
    await invalidateAccessToken();
    return getZohoAccessToken();
};

module.exports = {
    getZohoAccessToken,
    getRefreshToken,
    refreshZohoAccessToken,
    DOMAIN,
    REQUEST_TIMEOUT_MS,
};
