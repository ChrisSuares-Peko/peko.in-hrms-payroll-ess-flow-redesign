'use strict';

const { client: redisClient, deleteValue, getValue, setValue } = require('../cacheDataMethods');
const { customLog } = require('../loggerHelper');
const { CTRLPAY_LIMITS } = require('../../constants/ctrlPay');

const DOCUMENT_TRACKING_TTL_SECONDS = 7 * 24 * 60 * 60;
const DOCUMENT_PROCESSING_WINDOW_MS = 15 * 60 * 1000;
const CKYC_RESEND_TTL_SECONDS = 24 * 60 * 60;
const PHONE_OTP_SENT_TTL_SECONDS = 15 * 60;

const keys = {
    oauthState: (state) => `ctrlpay:oauth:${state}`,
    documents: (corporateId) => `ctrlpay:documents:${corporateId}`,
    ckycResends: (corporateId) => `ctrlpay:ckyc-resends:${corporateId}`,
    phoneOtpCooldown: (corporateId) => `ctrlpay:phone-otp-cooldown:${corporateId}`,
    phoneOtpSentAt: (corporateId) => `ctrlpay:phone-otp-sent:${corporateId}`,
};

const readJson = async (key, logTraceId) => {
    try {
        const raw = await getValue(key);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        customLog(logTraceId, 'error', { action: 'ctrlpay:storeReadFailed', key, error: error.message }, 'VENDOR');
        return null;
    }
};

const writeJson = async (key, ttlSeconds, value, logTraceId) => {
    try {
        await setValue(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
        customLog(logTraceId, 'error', { action: 'ctrlpay:storeWriteFailed', key, error: error.message }, 'VENDOR');
    }
};

const removeKey = async (key, logTraceId) => {
    try {
        await deleteValue(key);
    } catch (error) {
        customLog(logTraceId, 'error', { action: 'ctrlpay:storeDeleteFailed', key, error: error.message }, 'VENDOR');
    }
};

exports.saveOAuthState = (state, record) =>
    setValue(keys.oauthState(state), CTRLPAY_LIMITS.oauthStateTtlSeconds, JSON.stringify(record));

exports.takeOAuthState = async (state) => {
    const key = keys.oauthState(state);
    const raw = await getValue(key);
    if (!raw) return null;
    await deleteValue(key);
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

exports.readTrackedUploads = async (corporateId, logTraceId) =>
    (await readJson(keys.documents(corporateId), logTraceId)) ?? {};

exports.trackUpload = async (corporateId, fileName, originalName, logTraceId) => {
    const tracked = await exports.readTrackedUploads(corporateId, logTraceId);
    tracked[fileName] = { originalName, uploadedAt: Date.now() };
    await writeJson(keys.documents(corporateId), DOCUMENT_TRACKING_TTL_SECONDS, tracked, logTraceId);
};

exports.forgetUpload = async (corporateId, fileName, logTraceId) => {
    const tracked = await exports.readTrackedUploads(corporateId, logTraceId);
    if (!tracked[fileName]) return;
    delete tracked[fileName];
    await writeJson(keys.documents(corporateId), DOCUMENT_TRACKING_TTL_SECONDS, tracked, logTraceId);
};

exports.withUploadTracking = (document, tracked, now = Date.now()) => {
    const entry = tracked[document.fileName];
    if (!entry) return { ...document, uploadedFileName: null };
    const awaitingRegistration =
        (document.status === 'NOT_UPLOADED' || document.status === 'REJECTED') &&
        now - Number(entry.uploadedAt) < DOCUMENT_PROCESSING_WINDOW_MS;
    const status = awaitingRegistration ? 'PROCESSING' : document.status;
    return {
        ...document,
        status,
        uploadedFileName: status === 'NOT_UPLOADED' ? null : entry.originalName ?? null,
    };
};

exports.ckycResendsUsed = async (corporateId, logTraceId) =>
    Number(await readJson(keys.ckycResends(corporateId), logTraceId)) || 0;

exports.recordCkycResend = async (corporateId, logTraceId) => {
    const used = (await exports.ckycResendsUsed(corporateId, logTraceId)) + 1;
    await writeJson(keys.ckycResends(corporateId), CKYC_RESEND_TTL_SECONDS, used, logTraceId);
    return used;
};

exports.clearCkycResends = (corporateId, logTraceId) => removeKey(keys.ckycResends(corporateId), logTraceId);

exports.claimPhoneOtpSlot = async (corporateId, logTraceId) => {
    try {
        const claimed = await redisClient.set(keys.phoneOtpCooldown(corporateId), '1', {
            NX: true,
            EX: CTRLPAY_LIMITS.phoneOtpCooldownSeconds,
        });
        return Boolean(claimed);
    } catch (error) {
        customLog(logTraceId, 'error', { action: 'ctrlpay:phoneOtpCooldownUnavailable', error: error.message }, 'VENDOR');
        return true;
    }
};

exports.releasePhoneOtpSlot = (corporateId, logTraceId) => removeKey(keys.phoneOtpCooldown(corporateId), logTraceId);

exports.recordPhoneOtpSent = (corporateId, logTraceId) =>
    writeJson(keys.phoneOtpSentAt(corporateId), PHONE_OTP_SENT_TTL_SECONDS, new Date().toISOString(), logTraceId);

exports.phoneOtpSentAt = (corporateId, logTraceId) => readJson(keys.phoneOtpSentAt(corporateId), logTraceId);

exports.clearPhoneOtp = (corporateId, logTraceId) => removeKey(keys.phoneOtpSentAt(corporateId), logTraceId);
