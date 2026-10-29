const axios = require('axios');
const { setValue, getValue, deleteValue } = require('./cacheDataMethods');
const { customLog } = require('./loggerHelper');
const operatorsData = require('./operatorsData.json');

const accessKey = operatorsData['flight']['accessKey'];

async function invalidateSession() {
    await deleteValue(`tokenId-${accessKey}`);
    await deleteValue(`memberId-${accessKey}`);
    await deleteValue(`agencyId-${accessKey}`);
}

async function authenticateAndCache(serviceDetails, loggerTraceId) {
    try {
        const data = JSON.stringify({
            ClientId: serviceDetails.vendor.optional3,
            UserName: serviceDetails.vendor.optional1,
            Password: serviceDetails.vendor.optional2,
            EndUserIp: serviceDetails.vendor.optional4,
        });

        const config = {
            method: 'post',
            url: `${serviceDetails.vendor.healthUrl}/rest/Authenticate`,
            headers: {
                'Content-Type': 'application/json',
                Accept: '*/*',
            },
            data,
        };

        customLog(loggerTraceId, 'info', {
            message: '[airline:Authenticate] request',
            endpoint: 'Authenticate',
            requestUrl: config.url,
            requestMethod: config.method,
            requestBody: { ...JSON.parse(data), Password: '<redacted>' },
        }, 'VENDOR');

        const response = await axios(config);

        customLog(loggerTraceId, 'info', {
            message: '[airline:Authenticate] response',
            endpoint: 'Authenticate',
            statusCode: response?.status,
            tokenIdSuffix: response?.data?.TokenId ? String(response.data.TokenId).slice(-4) : null,
            memberSno: response?.data?.Member?.Sno,
            vendorErrorCode: response?.data?.Error?.ErrorCode,
            vendorErrorMessage: response?.data?.Error?.ErrorMessage,
            responseData: response?.data,
        }, 'VENDOR');

        if (!response) {
            throw new Error('Authentication failed');
        }

        const now = Math.floor(Date.now() / 1000);
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const expirySeconds = Math.max(Math.floor(midnight.getTime() / 1000) - now, 1);

        const tokenValue = response.data?.TokenId ?? '';
        const memberValue = response.data?.Member?.MemberId ?? '';
        const agencyValue = response.data?.Member?.AgencyId ?? '';

        if (!tokenValue) {
            throw new Error('Authentication token missing in vendor response');
        }

        await setValue(`tokenId-${accessKey}`, expirySeconds, tokenValue);
        if (memberValue) {
            await setValue(`memberId-${accessKey}`, expirySeconds, memberValue);
        }
        if (agencyValue) {
            await setValue(`agencyId-${accessKey}`, expirySeconds, agencyValue);
        }

        return { token: tokenValue, memberId: memberValue, agencyId: agencyValue };
    } catch (error) {
        customLog(loggerTraceId, 'error', {
            message: '[airline:Authenticate] error',
            endpoint: 'Authenticate',
            errorMessage: error?.message,
            statusCode: error?.response?.status,
            errorCode: error?.code,
            vendorErrorCode: error?.response?.data?.Error?.ErrorCode,
            vendorErrorMessage: error?.response?.data?.Error?.ErrorMessage,
            responseData: error?.response?.data,
            errorStack: error?.stack,
        }, 'VENDOR');
        return { token: '', memberId: '', agencyId: '' };
    }
}

// TBO enforces single-session-per-credentials; concurrent Authenticate calls
// invalidate each other's tokens. When many in-flight requests hit ErrorCode 6
// simultaneously (e.g. after a server-side token rotation), all of them call
// getSession({ forceRefresh: true }) at once — without coalescing, each fires
// its own Authenticate, and each new session invalidates the previous one,
// causing a cascade of retries that re-fail with ErrorCode 6.
//
// We pin a single in-flight Authenticate promise per process and let all
// concurrent callers await the same fresh session. Within one Node instance
// this gives at-most-one Authenticate call per cold-cache window. Across
// multiple replicas the guarantee weakens to per-instance — for cross-instance
// coalescing a Redis-based mutex would be required.
let inFlightAuthPromise = null;

async function getSession(serviceDetails, options = null) {
    // Backward compatible: previous signature was getSession(serviceDetails, loggerTraceId).
    // New signature: getSession(serviceDetails, { forceRefresh, loggerTraceId }).
    let forceRefresh = false;
    let loggerTraceId = null;
    if (options && typeof options === 'object') {
        forceRefresh = !!options.forceRefresh;
        loggerTraceId = options.loggerTraceId ?? null;
    } else {
        loggerTraceId = options;
    }

    if (forceRefresh) {
        await invalidateSession();
    }

    if (!forceRefresh) {
        const tokenId = await getValue(`tokenId-${accessKey}`);
        if (tokenId) {
            const memberId = await getValue(`memberId-${accessKey}`);
            const agencyId = await getValue(`agencyId-${accessKey}`);
            return { token: tokenId, memberId, agencyId };
        }
    }

    if (inFlightAuthPromise) {
        return inFlightAuthPromise;
    }

    inFlightAuthPromise = authenticateAndCache(serviceDetails, loggerTraceId).finally(() => {
        inFlightAuthPromise = null;
    });

    return inFlightAuthPromise;
}

// TBO recommends auto-refreshing the TokenId and retrying once when an API call
// returns ErrorCode 6 (Invalid/expired TokenId) or an Authentication Failed
// response. `buildConfig(token)` produces the axios config with the supplied
// TokenId; `logRequest`/`logResponse` receive (config|result, isRetry).
const isTboTokenExpiredResponse = (result) => {
    const errorCode = result?.data?.Response?.Error?.ErrorCode ?? result?.data?.Error?.ErrorCode;
    if (errorCode === 6) return true;
    const errorMessage = result?.data?.Response?.Error?.ErrorMessage ?? result?.data?.Error?.ErrorMessage;
    if (typeof errorMessage === 'string') {
        const msg = errorMessage.toLowerCase();
        if (msg.includes('invalid token') || msg.includes('token expired') || msg.includes('authentication failed')) {
            return true;
        }
    }
    return false;
};

// ErrorCode 5 = the search session (TraceId) died, not a rejected booking — caller must re-search.
const isTboTraceIdExpiredResponse = (result) => {
    const errorCode = result?.data?.Response?.Error?.ErrorCode ?? result?.data?.Error?.ErrorCode;
    if (errorCode === 5) return true;
    const errorMessage = result?.data?.Response?.Error?.ErrorMessage ?? result?.data?.Error?.ErrorMessage;
    if (typeof errorMessage === 'string') {
        const msg = errorMessage.toLowerCase();
        if (msg.includes('traceid') && msg.includes('expired')) return true;
    }
    return false;
};

const createTraceIdExpiredError = (message = 'Your search session has expired. Please restart your search and try again.') => {
    const error = new Error(message);
    error.status_code = 400;
    error.isTraceIdExpired = true;
    error.responseCode = '005';
    return error;
};

async function callTboWithRetry({ buildConfig, serviceDetails, loggerTraceId, endpoint, logRequest, logResponse }) {
    const { token } = await getSession(serviceDetails, { loggerTraceId });
    if (!token) {
        throw new Error('Failed to fetch authentication token');
    }

    let config = buildConfig(token);
    if (logRequest) logRequest(config, false);
    let result = await axios(config);
    if (logResponse) logResponse(result, false);

    if (isTboTokenExpiredResponse(result)) {
        customLog(loggerTraceId, 'info', {
            message: `[airline:${endpoint}] retrying after Invalid/Expired Token`,
            endpoint,
            vendorErrorCode: result?.data?.Response?.Error?.ErrorCode ?? result?.data?.Error?.ErrorCode,
            vendorErrorMessage: result?.data?.Response?.Error?.ErrorMessage ?? result?.data?.Error?.ErrorMessage,
        }, 'VENDOR');

        const { token: freshToken } = await getSession(serviceDetails, { forceRefresh: true, loggerTraceId });
        if (!freshToken) {
            throw new Error('Failed to refresh authentication token');
        }

        config = buildConfig(freshToken);
        if (logRequest) logRequest(config, true);
        result = await axios(config);
        if (logResponse) logResponse(result, true);
    }

    return result;
}

module.exports = {
    accessKey,
    getSession,
    invalidateSession,
    isTboTokenExpiredResponse,
    isTboTraceIdExpiredResponse,
    createTraceIdExpiredError,
    callTboWithRetry,
};
