const axios = require("axios");
const { getValue, setValue } = require("../utils/cacheDataMethods");
const { customLog } = require("../utils/loggerHelper");
const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails");
const operatorsData = require("../utils/operatorsData.json");

const XOXODAY_ACCESS_KEY = operatorsData["xoxoday"]["accessKey"];


/**
 * Proactively refresh the Xoxoday access token using the stored refresh token.
 * Runs on a schedule (every day) and refreshes only when the next-refresh
 * timestamp stored in Redis has been reached (i.e. ~13 days after last refresh).
 *
 * Redis keys (shared with purchase MS):
 *   xoxoday-access-token-<accessKey>        → access token  (14-day TTL)
 *   xoxoday-refresh-token-<accessKey>       → refresh token (30-day TTL)
 *   xoxoday-token-next-refresh-<accessKey>  → unix-ms timestamp for next refresh
 *
 * Fallback chain when Redis refresh token is missing (e.g. server was down 30+ days):
 *   1. Try refresh token from Redis (normal flow)
 *   2. Fall back to seed refresh token from serviceDetails.optional4 (DB)
 *   3. If both missing → log CRITICAL alert — manual re-seeding required
 *   4. If API rejects the seed token (401) → log CRITICAL alert — seed token is stale
 */
exports.xoxodayTokenRefresh = async () => {
    const ACCESS_TOKEN_CACHE_KEY  = `xoxoday-access-token-${XOXODAY_ACCESS_KEY}`;
    const REFRESH_TOKEN_CACHE_KEY = `xoxoday-refresh-token-${XOXODAY_ACCESS_KEY}`;
    const NEXT_REFRESH_CACHE_KEY  = `xoxoday-token-next-refresh-${XOXODAY_ACCESS_KEY}`;

    try {
        // Check if it's time to refresh
        customLog(null, "info", {
                message: `Xoxoday scheduler for token refresh started`,
            });

        const nextRefreshStr = await getValue(NEXT_REFRESH_CACHE_KEY);
        
        if (nextRefreshStr && Date.now() < parseInt(nextRefreshStr, 10)) {
            customLog(null, "info", {
                message: `[Xoxoday] Token refresh not due yet. Next refresh at: ${new Date(parseInt(nextRefreshStr, 10)).toISOString()}`,
            });
            return;
        }

        // If nextRefreshStr is missing entirely, Redis may have been flushed or the scheduler
        // was down long enough for the key to expire — treat as overdue and attempt refresh.
        if (!nextRefreshStr) {
            customLog(null, "info", {
                message: "[Xoxoday] Next-refresh timestamp missing from Redis (possible long downtime or Redis flush). Attempting token refresh now.",
            });
        }

        // Fetch service operator details to get clientId and clientSecret
        const serviceOperator = await findServiceOperatorByAccessKey(XOXODAY_ACCESS_KEY);
        if (!serviceOperator || serviceOperator.error) {
            customLog(null, "error", {
                message: `[Xoxoday] Service operator not found for accessKey: ${XOXODAY_ACCESS_KEY}`,
            });
            return;
        }

        const clientId     = serviceOperator.vendor?.optional1;
        const clientSecret = serviceOperator.vendor?.optional2;
        const baseUrl      = serviceOperator.vendor?.apiUrl 

        if (!clientId || !clientSecret || !baseUrl) {
            customLog(null, "error", {
                message: "[Xoxoday] Missing clientId, clientSecret, or baseUrl in serviceOperator",
            });
            return;
        }

        // --- Refresh token fallback chain ---
        let refreshToken    = await getValue(REFRESH_TOKEN_CACHE_KEY);
        let usedSeedToken   = false;

        if (!refreshToken) {
            // Redis refresh token expired (server down 30+ days) — fall back to DB seed value
            refreshToken  = serviceOperator.vendor?.optional4;
            usedSeedToken = true;

            if (refreshToken) {
                customLog(null, "info", {
                    message: "[Xoxoday] CRITICAL: Redis refresh token has expired (server likely down 30+ days). " +
                             "Falling back to seed refresh token from serviceDetails.optional4. " +
                             "Update optional4 in the dashboard with a fresh token immediately.",
                });
            }
        }

        if (!refreshToken) {
            customLog(null, "error", {
                message: "[Xoxoday] CRITICAL: No refresh token available in Redis or serviceDetails.optional4. " +
                         "Xoxoday gift card flows will fail. Manual action required: " +
                         "obtain a fresh token from the Xoxoday dashboard and update optional3 (access) and optional4 (refresh) in serviceDetails.",
            });
            return;
        }

        // Call Xoxoday token refresh endpoint
        customLog(null, "info", {
            message: "[Xoxoday] Token refresh request config",
            url: `${baseUrl}/token/user`,
            grant_type: "refresh_token",
            client_id: clientId,
            refresh_token: refreshToken ? `${refreshToken.slice(0, 6)}…` : null,
        }, "VENDOR");

        let response;
        try {
            response = await axios({
                method: "post",
                url: `${baseUrl}/token/user`,
                headers: { "Content-Type": "application/json" },
                data: {
                    grant_type:    "refresh_token",
                    refresh_token: refreshToken,
                    client_id:     clientId,
                    client_secret: clientSecret,
                },
            });
        } catch (apiError) {
            const status = apiError?.response?.status;
            if (usedSeedToken && (status === 401 || status === 400)) {
                customLog(null, "error", {
                    message: "[Xoxoday] CRITICAL: Seed refresh token from optional4 was rejected by Xoxoday API. " +
                             "The seed token is expired or invalid. Manual action required: " +
                             "log in to the Xoxoday dashboard, generate new tokens, and update optional3 and optional4 in serviceDetails.",
                    status,
                    error: apiError?.response?.data,
                });
            } else {
                customLog(null, "error", {
                    message: "[Xoxoday] Xoxoday token refresh API call failed",
                    status,
                    // The full response carries the request config (client secret, refresh token) — log the vendor's reply only
                    error: apiError?.response?.data || apiError?.message
                });
            }
            return;
        }

        const tokenData = response.data;

        if (!tokenData || !tokenData.access_token) {
            customLog(null, "error", {
                message: "[Xoxoday] Token refresh API did not return a valid access_token",
                response: tokenData,
            });
            return;
        }

        const newAccessToken  = tokenData.access_token;
        const newRefreshToken = tokenData.refresh_token || refreshToken;
        const nextRefreshAt   = Date.now() + 13 * 24 * 60 * 60 * 1000; // 13 days from now

        const ACCESS_TTL  = 14 * 24 * 60 * 60; // 14 days in seconds
        const REFRESH_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

        await setValue(ACCESS_TOKEN_CACHE_KEY,  ACCESS_TTL,  newAccessToken);
        await setValue(REFRESH_TOKEN_CACHE_KEY, REFRESH_TTL, newRefreshToken);
        await setValue(NEXT_REFRESH_CACHE_KEY,  REFRESH_TTL, String(nextRefreshAt));

        customLog(null, "info", {
            message: "[Xoxoday] Access token refreshed successfully by scheduler",
            usedSeedFallback: usedSeedToken,
            nextRefreshAt: new Date(nextRefreshAt).toISOString(),
        });

    } catch (error) {
        customLog(null, "error", {
            message: "[Xoxoday] Scheduler error during token refresh",
            error: error?.response || error.message,
        });
    }
};
