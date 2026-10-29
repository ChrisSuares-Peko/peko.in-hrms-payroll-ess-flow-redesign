const { customLog } = require("../../loggerHelper");
const { refreshZohoAccessToken } = require("./auth");

const DAILY_LIMIT_CODE = 45;
const POLL_INTERVAL_MS = Number(
    process.env.ZOHO_RATE_LIMIT_POLL_INTERVAL_MS || 60 * 1000
);
const DAILY_LIMIT_POLL_INTERVAL_MS = Number(
    process.env.ZOHO_DAILY_LIMIT_POLL_INTERVAL_MS || 30 * 60 * 1000
);

const TRANSIENT_RETRY_LIMIT = Number(
    process.env.ZOHO_TRANSIENT_RETRY_LIMIT || 3
);
const TRANSIENT_RETRY_DELAY_MS = Number(
    process.env.ZOHO_TRANSIENT_RETRY_DELAY_MS || 5000
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRateLimitError = (error) => error?.response?.status === 429;

const rateLimitWaitMs = (error) =>
    error?.response?.data?.code === DAILY_LIMIT_CODE
        ? DAILY_LIMIT_POLL_INTERVAL_MS
        : POLL_INTERVAL_MS;

const isAuthError = (error) => error?.response?.status === 401;

const isTransientError = (error) => {
    if (!error?.response) return true;
    return error.response.status >= 500;
};

// Shared by both functions below. Returns the new attempt count if it waited and
// should be retried, or null if this error isn't transient / retries are used up
// (caller should throw in that case).
const retryIfTransient = async (error, attemptsSoFar, context) => {
    if (!isTransientError(error) || attemptsSoFar >= TRANSIENT_RETRY_LIMIT) {
        return null;
    }
    const attempt = attemptsSoFar + 1;
    customLog(null, "info", {
        message: "[zoho] transient error (no response or 5xx) — retrying",
        status: error?.response?.status || "no-response",
        errorMessage: error?.message,
        transientAttempt: attempt,
        waitMs: TRANSIENT_RETRY_DELAY_MS,
        ...context,
    });
    await sleep(TRANSIENT_RETRY_DELAY_MS);
    return attempt;
};

const retryIfAuthError = async (error, alreadyRetried, onTokenRefreshed, context) => {
    if (!isAuthError(error) || alreadyRetried || typeof onTokenRefreshed !== "function") {
        return false;
    }
    customLog(null, "info", {
        message: "[zoho] access token rejected (401) — refreshing token and retrying once",
        ...context,
    });
    const freshToken = await refreshZohoAccessToken();
    if (!freshToken) return false;
    await onTokenRefreshed(freshToken);
    return true;
};

// Full version — for queued operations only (nothing waiting on a live request).
// Checks run in this order, every time the call fails:
//   1. Auth (401)?         -> refresh the token once, retry.
//   2. Rate limit (429)?   -> wait (long for the known daily-limit code, else the generic
//                             interval), retry, repeat — forever.
//   3. Transient (no response / 5xx)? -> wait (short), retry a few times.
//   4. Otherwise           -> real problem, throw it, stop.
exports.callWithZohoRateLimitRetry = async (fn, context = {}, onTokenRefreshed) => {
    let transientAttempts = 0;
    let authRetried = false;
    for (let attempt = 1; ; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (await retryIfAuthError(error, authRetried, onTokenRefreshed, context)) {
                authRetried = true;
                continue;
            }

            if (isRateLimitError(error)) {
                const waitMs = rateLimitWaitMs(error);
                customLog(null, "info", {
                    message: "[zoho] rate limit hit — waiting then retrying",
                    code: error?.response?.data?.code ?? null,
                    zohoMessage: error?.response?.data?.message,
                    attempt,
                    waitMs,
                    ...context,
                });
                await sleep(waitMs);
                continue;
            }

            const updatedAttempts = await retryIfTransient(error, transientAttempts, context);
            if (updatedAttempts !== null) {
                transientAttempts = updatedAttempts;
                continue;
            }

            throw error;
        }
    }
};

// Light version — safe for a live caller (e.g. an admin page waiting on this request
// right now). Same order of checks, but a rate limit fails fast instead of waiting —
// the long wait (up to 30 min) would just hang whoever's waiting.
//   1. Auth (401)?  -> refresh the token once, retry.
//   2. Rate limit?  -> log it, throw immediately, no wait.
//   3. Transient?   -> wait (short), retry a few times.
//   4. Otherwise    -> throw it, stop.
exports.callWithZohoTransientRetry = async (fn, context = {}, onTokenRefreshed) => {
    let transientAttempts = 0;
    let authRetried = false;
    for (;;) {
        try {
            return await fn();
        } catch (error) {
            if (await retryIfAuthError(error, authRetried, onTokenRefreshed, context)) {
                authRetried = true;
                continue;
            }

            if (isRateLimitError(error)) {
                customLog(null, "info", {
                    message: "[zoho] rate limit hit on a read — not waiting, failing now",
                    code: error?.response?.data?.code ?? null,
                    zohoMessage: error?.response?.data?.message,
                    ...context,
                });
                throw error;
            }

            const updatedAttempts = await retryIfTransient(error, transientAttempts, context);
            if (updatedAttempts !== null) {
                transientAttempts = updatedAttempts;
                continue;
            }

            throw error;
        }
    }
};
