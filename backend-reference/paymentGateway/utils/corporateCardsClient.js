const axios = require('axios');
const { customLog } = require('./loggerHelper');

const PURCHASE_PATH = '/api/v1/webhook/paymentgateway/corporate-cards/physical-card-purchase';
const TIMEOUT_MS = 10000;
// Short and bounded on purpose: this runs inside the admin's own /complete request as well as the
// Cashfree webhook, so the budget has to stay well under both. Covers a blip or a cold start, not an
// outage — corporateCard's unique paymentRefId index makes every retry safe to repeat.
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = [300, 600];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A 4xx is a decision, not a hiccup: a bad secret or a malformed body will fail identically next time.
const isRetryable = (error) => {
    const status = error?.response?.status;
    if (status === undefined) return true;
    return status >= 500;
};

// Same expression as cashFreeGateway's BACKEND_URL and corporateCard's othersClient: anything that is
// not explicitly "staging" resolves to production.
const gatewayBaseUrl = () => {
    // A local run points this at the local gateway; staging and production leave it unset.
    const raw = process.env.CORPORATE_CARDS_INTERNAL_URL
        || (process.env.NODE_ENV === 'staging' ? process.env.STAGING_URL : process.env.PRODUCTION_URL);
    return String(raw || '').replace(/\/+$/, '');
};

/**
 * Tells corporateCard that a physical card has been paid for.
 *
 * Never throws. A webhook side-effect that throws marks the Cashfree webhook FAILED, which triggers a
 * retry and double-creates downstream artifacts — and corporateCard's own unique index on paymentRefId
 * already makes a genuine retry harmless.
 */
const recordPhysicalCardPurchase = async (payload, { logTraceId } = {}) => {
    const secret = process.env.CARD_PURCHASE_CALLBACK_SECRET;
    const baseUrl = gatewayBaseUrl();

    if (!secret || !baseUrl) {
        customLog(logTraceId, 'error', {
            message: '[CorporateCards] Cannot record the paid physical card — callback not configured',
            hasSecret: Boolean(secret),
            hasBaseUrl: Boolean(baseUrl),
            paymentRefId: payload?.paymentRefId,
        });
        return { ok: false, reason: 'NOT_CONFIGURED' };
    }

    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
            const response = await axios.post(`${baseUrl}${PURCHASE_PATH}`, payload, {
                headers: {
                    'x-card-purchase-secret': secret,
                    'x-request-id': logTraceId || undefined,
                },
                timeout: TIMEOUT_MS,
            });
            customLog(logTraceId, 'info', {
                message: '[CorporateCards] Paid physical card recorded',
                paymentRefId: payload?.paymentRefId,
                corporateId: payload?.corporateId,
                attempt,
                response: response?.data?.data ?? null,
            });
            return { ok: true, data: response?.data?.data ?? null };
        } catch (error) {
            lastError = error;
            const retryable = isRetryable(error) && attempt < MAX_ATTEMPTS;
            customLog(logTraceId, retryable ? 'info' : 'error', {
                message: retryable
                    ? '[CorporateCards] Recording the paid physical card failed — retrying'
                    : '[CorporateCards] Failed to record the paid physical card — the payment stands, the card was not allocated',
                paymentRefId: payload?.paymentRefId,
                corporateId: payload?.corporateId,
                attempt,
                status: error?.response?.status,
                error: error?.response?.data || error.message,
            });
            if (!retryable) break;
            await sleep(RETRY_DELAY_MS[attempt - 1]);
        }
    }

    return {
        ok: false,
        reason: 'CALLBACK_FAILED',
        status: lastError?.response?.status ?? null,
    };
};

const IN_APP_BASE = '/api/v1/webhook/paymentgateway/corporate-cards/in-app';
// corporateCard waits up to 30s on Pine Labs and then reverses on its own; this hop has to outlast that.
const REDEEM_TIMEOUT_MS = 45000;

/**
 * One call to a corporateCard in-app endpoint. Never throws.
 * ok:true carries corporateCard's `data`; ok:false carries a reason: NOT_CONFIGURED, REJECTED (a 4xx, with
 * corporateCard's message) or UNREACHABLE (no answer or a 5xx after the allowed attempts).
 */
// `req` is the paying user's request: its session headers ride along so corporateCard can resolve the Pine Labs
// operator through the user's own entitlement when its cache is cold, instead of refusing the payment.
const forwardedSession = (req) => ({
    ...(req?.headers?.authorization && { authorization: req.headers.authorization }),
    ...(req?.headers?.sessionid && { sessionid: req.headers.sessionid }),
});

const callInApp = async (path, payload, { logTraceId, req, timeout = TIMEOUT_MS, attempts = 1 } = {}) => {
    const secret = process.env.CARD_PURCHASE_CALLBACK_SECRET;
    const baseUrl = gatewayBaseUrl();
    if (!secret || !baseUrl) {
        customLog(logTraceId, 'error', {
            message: `[CorporateCards] in-app ${path} not configured`,
            hasSecret: Boolean(secret),
            hasBaseUrl: Boolean(baseUrl),
        });
        return { ok: false, reason: 'NOT_CONFIGURED', message: 'Card payments are not configured' };
    }

    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            const response = await axios.post(`${baseUrl}${IN_APP_BASE}${path}`, payload, {
                headers: { 'x-card-purchase-secret': secret, 'x-request-id': logTraceId || undefined, ...forwardedSession(req) },
                timeout,
            });
            return { ok: true, data: response?.data?.data ?? null, message: response?.data?.message ?? null };
        } catch (error) {
            lastError = error;
            const retryable = isRetryable(error) && attempt < attempts;
            customLog(logTraceId, retryable ? 'info' : 'error', {
                message: `[CorporateCards] in-app ${path} ${retryable ? 'failed — retrying' : 'failed'}`,
                paymentRefId: payload?.paymentRefId,
                attempt,
                status: error?.response?.status,
                error: error?.response?.data || error.message,
            });
            if (!retryable) break;
            await sleep(RETRY_DELAY_MS[attempt - 1]);
        }
    }

    const status = lastError?.response?.status ?? null;
    if (status && status < 500) {
        return { ok: false, reason: 'REJECTED', status, message: lastError?.response?.data?.message || 'Card payment was rejected' };
    }
    return { ok: false, reason: 'UNREACHABLE', status, message: 'Card service is unavailable' };
};

const inAppEligibility = (payload, opts) => callInApp('/eligibility', payload, { ...opts, attempts: 2 });

// Exactly one attempt. corporateCard is idempotent on paymentRefId, but a retry racing a first call that is
// still redeeming would read INITIATED and report a failure for money that is about to move.
const inAppRedeem = (payload, opts) => callInApp('/redeem', payload, { ...opts, timeout: REDEEM_TIMEOUT_MS, attempts: 1 });

const inAppCancel = (payload, opts) => callInApp('/cancel', payload, { ...opts, attempts: MAX_ATTEMPTS });

module.exports = { recordPhysicalCardPurchase, inAppEligibility, inAppRedeem, inAppCancel };
