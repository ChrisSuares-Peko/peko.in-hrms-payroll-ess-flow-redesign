'use strict';

const axios = require('axios');

const { client: redisClient } = require('../cacheDataMethods');
const { customLog } = require('../loggerHelper');
const { CTRLPAY_LIMITS, CTRLPAY_METHOD_PATH } = require('../../constants/ctrlPay');
const {
    findCtrlPayConnection,
    updateCtrlPayConnection,
} = require('../../models/use-cases/ctrlPayConnection');
const { getCtrlPayConfig } = require('./config');
const { encryptRequest, readResponse } = require('./envelope');
const { CtrlPayAuthError, idTokenExpiry, refreshIdToken } = require('./oauth');
const { openToken, sealToken } = require('./tokenCipher');

class CtrlPayError extends Error {
    constructor(kind, { method = null, httpStatus = null } = {}) {
        super(`CTRLPay ${kind}${method ? ` (${method})` : ''}`);
        this.name = 'CtrlPayError';
        this.kind = kind;
        this.method = method;
        this.httpStatus = httpStatus;
    }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const expiresSoon = (expiresAt) =>
    !expiresAt ||
    new Date(expiresAt).getTime() - Date.now() <= CTRLPAY_LIMITS.tokenRefreshWindowSeconds * 1000;

const markReconnectRequired = (corporateId) =>
    updateCtrlPayConnection(corporateId, {
        status: 'RECONNECT_REQUIRED',
        idToken: null,
        idTokenExpiresAt: null,
        refreshToken: null,
    });

const openStoredToken = async (sealed, config, corporateId, logTraceId) => {
    try {
        return openToken(sealed, config.tokenKey);
    } catch {
        customLog(logTraceId, 'error', { action: 'ctrlpay:storedTokenUnreadable', corporateId }, 'VENDOR');
        await markReconnectRequired(corporateId);
        throw new CtrlPayError('RECONNECT_REQUIRED');
    }
};

const requireConnection = async (corporateId) => {
    const connection = await findCtrlPayConnection(corporateId);
    if (!connection || connection.status === 'DISCONNECTED') throw new CtrlPayError('NOT_CONNECTED');
    if (connection.status === 'RECONNECT_REQUIRED' || !connection.refreshToken) {
        throw new CtrlPayError('RECONNECT_REQUIRED');
    }
    return connection;
};

const acquireRefreshLock = async (lockKey, logTraceId) => {
    try {
        return Boolean(await redisClient.set(lockKey, '1', { NX: true, PX: CTRLPAY_LIMITS.refreshLockMs }));
    } catch (error) {
        customLog(logTraceId, 'error', { action: 'ctrlpay:refreshLockUnavailable', error: error.message }, 'VENDOR');
        return true;
    }
};

const releaseRefreshLock = async (lockKey, logTraceId) => {
    try {
        await redisClient.del(lockKey);
    } catch (error) {
        customLog(logTraceId, 'error', { action: 'ctrlpay:refreshLockReleaseFailed', error: error.message }, 'VENDOR');
    }
};

const waitForRefreshedToken = async (connection, config, logTraceId) => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
        await sleep(250);
        const latest = await findCtrlPayConnection(connection.corporateId);
        if (!latest || latest.status !== 'CONNECTED') throw new CtrlPayError('RECONNECT_REQUIRED');
        if (latest.idToken && latest.idToken !== connection.idToken && !expiresSoon(latest.idTokenExpiresAt)) {
            return openStoredToken(latest.idToken, config, connection.corporateId, logTraceId);
        }
    }
    throw new CtrlPayError('UNAVAILABLE');
};

const refreshTokens = async (connection, config, logTraceId) => {
    const { corporateId } = connection;
    const lockKey = `ctrlpay:refresh-lock:${corporateId}`;
    if (!(await acquireRefreshLock(lockKey, logTraceId))) {
        return waitForRefreshedToken(connection, config, logTraceId);
    }
    try {
        const refreshToken = await openStoredToken(connection.refreshToken, config, corporateId, logTraceId);
        const tokens = await refreshIdToken(config, refreshToken);
        await updateCtrlPayConnection(corporateId, {
            idToken: sealToken(tokens.idToken, config.tokenKey),
            idTokenExpiresAt: idTokenExpiry(tokens),
            ...(tokens.refreshToken ? { refreshToken: sealToken(tokens.refreshToken, config.tokenKey) } : {}),
        });
        customLog(logTraceId, 'info', { action: 'ctrlpay:tokenRefreshed', corporateId }, 'VENDOR');
        return tokens.idToken;
    } catch (error) {
        if (error instanceof CtrlPayError) throw error;
        if (error instanceof CtrlPayAuthError && error.httpStatus >= 400 && error.httpStatus < 500) {
            customLog(logTraceId, 'error', {
                action: 'ctrlpay:refreshRejected',
                corporateId,
                httpStatus: error.httpStatus,
                oauthError: error.oauthError,
            }, 'VENDOR');
            await markReconnectRequired(corporateId);
            throw new CtrlPayError('RECONNECT_REQUIRED');
        }
        customLog(logTraceId, 'error', { action: 'ctrlpay:refreshFailed', corporateId, error: error.message }, 'VENDOR');
        throw new CtrlPayError('UNAVAILABLE');
    } finally {
        await releaseRefreshLock(lockKey, logTraceId);
    }
};

const payloadStatus = (payload) =>
    payload && typeof payload === 'object' && !Array.isArray(payload) && typeof payload.status === 'string'
        ? payload.status
        : null;

const postOnce = async ({ config, method, params, idToken, corporateId, logTraceId }) => {
    const { body, session } = encryptRequest(params, config.publicKey);
    const startedAt = Date.now();
    let response;
    try {
        response = await axios.post(`${config.baseUrl}${CTRLPAY_METHOD_PATH}${method}`, body, {
            headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
            timeout: CTRLPAY_LIMITS.requestTimeoutMs,
            validateStatus: () => true,
        });
    } catch (error) {
        customLog(logTraceId, 'error', {
            action: 'ctrlpay:requestFailed',
            method,
            corporateId,
            code: error.code ?? null,
            durationMs: Date.now() - startedAt,
        }, 'VENDOR');
        return { retryable: true, error: new CtrlPayError('UNAVAILABLE', { method }) };
    }

    const durationMs = Date.now() - startedAt;
    if (response.status === 401) {
        customLog(logTraceId, 'info', { action: 'ctrlpay:unauthorized', method, corporateId, durationMs }, 'VENDOR');
        return { retryable: false, result: { httpStatus: 401, payload: null } };
    }

    let payload;
    try {
        payload = readResponse(response.data, session);
    } catch (error) {
        customLog(logTraceId, 'error', {
            action: 'ctrlpay:unreadableResponse',
            method,
            corporateId,
            httpStatus: response.status,
            reason: error.message,
            durationMs,
        }, 'VENDOR');
        const unavailable = response.status >= 500;
        return {
            retryable: unavailable,
            error: new CtrlPayError(unavailable ? 'UNAVAILABLE' : 'BAD_RESPONSE', { method, httpStatus: response.status }),
        };
    }

    const apiStatus = payloadStatus(payload);
    const rejected = response.status >= 400 || apiStatus === 'ERROR';
    customLog(logTraceId, response.status >= 500 ? 'error' : 'info', {
        action: 'ctrlpay:call',
        method,
        corporateId,
        httpStatus: response.status,
        apiStatus,
        durationMs,
        ...(rejected && typeof payload?.message === 'string' ? { vendorMessage: payload.message } : {}),
    }, 'VENDOR');

    if (response.status >= 500) {
        return { retryable: true, error: new CtrlPayError('UNAVAILABLE', { method, httpStatus: response.status }) };
    }
    return { retryable: false, result: { httpStatus: response.status, payload } };
};

const send = async (request, idempotent) => {
    const attempts = idempotent ? 3 : 1;
    for (let attempt = 1; ; attempt += 1) {
        const outcome = await postOnce(request);
        if (!outcome.retryable || attempt >= attempts) {
            if (outcome.error) throw outcome.error;
            return outcome.result;
        }
        await sleep(500 * 3 ** (attempt - 1));
    }
};

const createCtrlPaySession = async ({ corporateId, logTraceId }) => {
    const config = await getCtrlPayConfig();
    const connection = await requireConnection(corporateId);
    let tokenPromise = null;

    const resolveToken = async (forceRefresh) => {
        if (!forceRefresh && connection.idToken && !expiresSoon(connection.idTokenExpiresAt)) {
            return openStoredToken(connection.idToken, config, corporateId, logTraceId);
        }
        return refreshTokens(connection, config, logTraceId);
    };

    const loadToken = (forceRefresh = false) => {
        if (forceRefresh || !tokenPromise) {
            tokenPromise = resolveToken(forceRefresh).catch((error) => {
                tokenPromise = null;
                throw error;
            });
        }
        return tokenPromise;
    };

    const call = async (method, params = {}, { idempotent = false } = {}) => {
        const request = { config, method, params, corporateId, logTraceId };
        const first = await send({ ...request, idToken: await loadToken() }, idempotent);
        if (first.httpStatus !== 401) return first;
        const retried = await send({ ...request, idToken: await loadToken(true) }, idempotent);
        if (retried.httpStatus !== 401) return retried;
        await markReconnectRequired(corporateId);
        throw new CtrlPayError('RECONNECT_REQUIRED', { method });
    };

    return { call, connection, config };
};

module.exports = {
    CtrlPayError,
    createCtrlPaySession,
    markReconnectRequired,
    payloadStatus,
};
