'use strict';

const {
    CTRLPAY_CUSTOMER_TYPE,
    CTRLPAY_LIMITS,
    CTRLPAY_MESSAGES,
    CTRLPAY_METHOD,
    CTRLPAY_SUCCESS,
} = require('../constants/ctrlPay');
const { findCtrlPayConnection, updateCtrlPayConnection } = require('../models/use-cases/ctrlPayConnection');
const ErrorResponse = require('../utils/error-response');
const { customLog } = require('../utils/loggerHelper');
const { createCtrlPaySession, payloadStatus } = require('../utils/ctrlPay/client');
const store = require('../utils/ctrlPay/store');
const { openToken, sealToken } = require('../utils/ctrlPay/tokenCipher');
const { readApplication, tagPartnerCode } = require('./ctrlPayApplication');

const CKYC_OTP_STATUSES = ['CKYC_INITIATED', 'CKYC_PENDING_OTP_SENT', 'CKYC_PENDING_INVALID_OTP', 'CKYC_OTP_EXPIRED'];
const PARTNER_TAGGING_STATUSES = ['EMAIL_ID_VERIFIED', 'CONSENT_RECORDED'];

const reject = (messageKey, statusCode) => {
    throw new ErrorResponse(CTRLPAY_MESSAGES[messageKey], statusCode);
};

const sessionFor = (user, logTraceId) => createCtrlPaySession({ corporateId: user.corporateId, logTraceId });

const progressed = ({ httpStatus, payload }) => {
    const status = payloadStatus(payload);
    return httpStatus === 200 && status && status !== 'ERROR' ? status : null;
};

const profileMobile = (user) => {
    const digits = String(user.mobileNo ?? '').replace(/\D/g, '').slice(-10);
    return /^[6-9]\d{9}$/.test(digits) ? digits : null;
};

const maskedSearchMobile = (session) => {
    try {
        const mobile = openToken(session.connection.mobile, session.config.tokenKey);
        return mobile ? `XXXXXX${mobile.slice(-4)}` : null;
    } catch {
        return null;
    }
};

const readVpa = async (session, logTraceId) => {
    try {
        const { httpStatus, payload } = await session.call(CTRLPAY_METHOD.getVpa, {}, { idempotent: true });
        return httpStatus === 200 && typeof payload === 'string' ? payload : null;
    } catch (error) {
        customLog(logTraceId, 'error', { action: 'ctrlpay:vpaUnavailable', error: error.message }, 'VENDOR');
        return null;
    }
};

exports.getStatus = async ({ user, logTraceId }) => {
    const { corporateId } = user;
    const base = { defaultMobile: profileMobile(user) };
    const connection = await findCtrlPayConnection(corporateId);
    if (!connection || connection.status === 'DISCONNECTED') {
        return { ...base, connected: false, reconnectRequired: false, account: null, application: null };
    }
    const account = { email: connection.email };
    if (connection.status === 'RECONNECT_REQUIRED') {
        return { ...base, connected: false, reconnectRequired: true, account, application: null };
    }

    const session = await sessionFor(user, logTraceId);
    const application = await readApplication(session);
    if (!connection.partnerCodeTaggedAt && PARTNER_TAGGING_STATUSES.includes(application.status)) {
        await tagPartnerCode(session, logTraceId);
    }

    const live = application.status === 'WALLET_CREATED';
    let { walletLiveAt } = connection;
    if (live && !walletLiveAt) {
        walletLiveAt = new Date();
        await updateCtrlPayConnection(corporateId, { walletLiveAt });
    }
    const dashboardEntered = live && Boolean(connection.dashboardEnteredAt);
    const ckycResendsLeft = CKYC_OTP_STATUSES.includes(application.status)
        ? Math.max(0, CTRLPAY_LIMITS.maxCkycOtpResends - (await store.ckycResendsUsed(corporateId, logTraceId)))
        : null;

    return {
        ...base,
        connected: true,
        reconnectRequired: false,
        account,
        application,
        walletLiveAt,
        dashboardEntered,
        vpa: live && !dashboardEntered ? await readVpa(session, logTraceId) : null,
        ckycResendsLeft,
        phoneOtpSentAt:
            application.status === 'VERIFY_PHONE' ? await store.phoneOtpSentAt(corporateId, logTraceId) : null,
        verificationMobile: application.status === 'VERIFY_PHONE' ? maskedSearchMobile(session) : null,
    };
};

exports.getConsent = async ({ user, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const { httpStatus, payload } = await session.call(
        CTRLPAY_METHOD.fetchConsentText,
        { customer_type: CTRLPAY_CUSTOMER_TYPE },
        { idempotent: true }
    );
    if (
        httpStatus === 200 &&
        payloadStatus(payload) === CTRLPAY_SUCCESS &&
        typeof payload.consent_master_name === 'string' &&
        typeof payload.consent_text === 'string'
    ) {
        return {
            masterName: payload.consent_master_name,
            text: payload.consent_text,
            forceReConsent: payload.force_re_consent === true,
        };
    }
    if (httpStatus === 503) reject('unavailable', 503);
    return reject('generic', 502);
};

exports.recordConsent = async ({ user, consentMasterName, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const { httpStatus, payload } = await session.call(CTRLPAY_METHOD.recordWalletConsent, {
        consent_master_name: consentMasterName,
    });
    if (httpStatus === 200 && payloadStatus(payload) === CTRLPAY_SUCCESS) return { recorded: true };
    if (httpStatus === 400) reject('consentRejected', 400);
    return reject('generic', 502);
};

exports.searchPan = async ({ user, pan, mobile, logTraceId }) => {
    const { corporateId } = user;
    const session = await sessionFor(user, logTraceId);
    const result = await session.call(CTRLPAY_METHOD.searchPanAndMobile, { pan, mobile, should_send_otp: false });
    const status = progressed(result);
    const remember = () =>
        updateCtrlPayConnection(corporateId, {
            pan: sealToken(pan, session.config.tokenKey),
            mobile: sealToken(mobile, session.config.tokenKey),
        });

    if (status) {
        await remember();
        await store.clearCkycResends(corporateId, logTraceId);
        return { status };
    }
    if (result.httpStatus === 409 && payloadStatus(result.payload) === 'DUPLICATE_PAN') {
        return { status: 'DUPLICATE_PAN' };
    }
    if (result.httpStatus === 429) {
        await remember();
        return { status: 'CKYC_BULK_PENDING', searchLimitReached: true };
    }
    if (result.httpStatus === 400) reject('consentMissing', 400);
    if (result.httpStatus === 409) reject('panLocked', 409);
    return reject('generic', 502);
};

exports.sendCkycOtp = async ({ user, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const result = await session.call(CTRLPAY_METHOD.initiateCkycOtp, {});
    const status = progressed(result);
    if (status) return { status };
    if (result.httpStatus === 429) reject('rateLimited', 429);
    if (result.httpStatus === 400 || result.httpStatus === 409) reject('stageMismatch', 409);
    return reject('generic', 502);
};

exports.resendCkycOtp = async ({ user, logTraceId }) => {
    const { corporateId } = user;
    const used = await store.ckycResendsUsed(corporateId, logTraceId);
    if (used >= CTRLPAY_LIMITS.maxCkycOtpResends) reject('ckycResendLimit', 429);
    const session = await sessionFor(user, logTraceId);
    const result = await session.call(CTRLPAY_METHOD.validateCkycOtp, { otp: '' });
    const status = progressed(result);
    if (status) {
        const nowUsed = await store.recordCkycResend(corporateId, logTraceId);
        return { status, resendsLeft: Math.max(0, CTRLPAY_LIMITS.maxCkycOtpResends - nowUsed) };
    }
    if (result.httpStatus === 429) return { status: 'CKYC_BULK_PENDING', attemptsExhausted: true };
    if (result.httpStatus === 400) reject('stageMismatch', 409);
    return reject('generic', 502);
};

exports.verifyCkycOtp = async ({ user, otp, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const result = await session.call(CTRLPAY_METHOD.validateCkycOtp, { otp });
    const status = progressed(result);
    if (status) {
        await store.clearCkycResends(user.corporateId, logTraceId);
        return { status };
    }
    if (result.httpStatus === 429) return { status: 'CKYC_BULK_PENDING', attemptsExhausted: true };
    const apiStatus = payloadStatus(result.payload);
    if (apiStatus === 'CKYC_OTP_EXPIRED') reject('ckycOtpExpired', 400);
    if (apiStatus === 'CKYC_PENDING_INVALID_OTP') reject('ckycInvalidOtp', 400);
    if (result.httpStatus === 400) reject('stageMismatch', 409);
    return reject('generic', 502);
};

exports.sendPhoneOtp = async ({ user, logTraceId }) => {
    const { corporateId } = user;
    if (!(await store.claimPhoneOtpSlot(corporateId, logTraceId))) reject('phoneOtpCooldown', 429);
    const session = await sessionFor(user, logTraceId);
    const result = await session.call(CTRLPAY_METHOD.sendPhoneOtp, {});
    if (result.httpStatus === 200 && payloadStatus(result.payload) === CTRLPAY_SUCCESS) {
        await store.recordPhoneOtpSent(corporateId, logTraceId);
        return { sentAt: new Date().toISOString(), cooldownSeconds: CTRLPAY_LIMITS.phoneOtpCooldownSeconds };
    }
    if (result.httpStatus === 429) reject('rateLimited', 429);
    await store.releasePhoneOtpSlot(corporateId, logTraceId);
    if (result.httpStatus === 400 || result.httpStatus === 404) reject('stageMismatch', 409);
    return reject('generic', 502);
};

exports.verifyPhoneOtp = async ({ user, otp, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const result = await session.call(CTRLPAY_METHOD.verifyPhoneOtp, { otp });
    const status = progressed(result);
    if (status) {
        await store.clearPhoneOtp(user.corporateId, logTraceId);
        return { status };
    }
    if (result.httpStatus === 429) reject('rateLimited', 429);
    if (result.httpStatus === 200 || result.httpStatus === 400) reject('phoneOtpInvalid', 400);
    return reject('generic', 502);
};

exports.enterDashboard = async ({ user, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const application = await readApplication(session);
    if (application.status !== 'WALLET_CREATED') reject('walletNotReady', 409);
    const now = new Date();
    await updateCtrlPayConnection(user.corporateId, {
        dashboardEnteredAt: now,
        ...(session.connection.walletLiveAt ? {} : { walletLiveAt: now }),
    });
    return { dashboardEntered: true };
};
