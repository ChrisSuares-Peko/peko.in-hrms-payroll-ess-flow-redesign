'use strict';

const axios = require('axios');

const {
    CTRLPAY_APPLICATION_FILE_NAMES,
    CTRLPAY_LIMITS,
    CTRLPAY_MESSAGES,
    CTRLPAY_METHOD,
    CTRLPAY_SUCCESS,
} = require('../constants/ctrlPay');
const ErrorResponse = require('../utils/error-response');
const { customLog } = require('../utils/loggerHelper');
const { createCtrlPaySession, payloadStatus } = require('../utils/ctrlPay/client');
const { isChecklistComplete, toChecklist } = require('../utils/ctrlPay/mappers');
const store = require('../utils/ctrlPay/store');

const MAGIC_BYTES = {
    'application/pdf': [Buffer.from('%PDF-', 'latin1')],
    'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
    'image/tiff': [Buffer.from([0x49, 0x49, 0x2a, 0x00]), Buffer.from([0x4d, 0x4d, 0x00, 0x2a])],
};

const reject = (messageKey, statusCode) => {
    throw new ErrorResponse(CTRLPAY_MESSAGES[messageKey], statusCode);
};

const sessionFor = (user, logTraceId) => createCtrlPaySession({ corporateId: user.corporateId, logTraceId });

const matchesContentType = (bytes, contentType) =>
    (MAGIC_BYTES[contentType] ?? []).some((signature) => bytes.subarray(0, signature.length).equals(signature));

const isSafeUploadUrl = (value) => {
    try {
        const url = new URL(value);
        const host = url.hostname;
        return (
            url.protocol === 'https:' &&
            host !== 'localhost' &&
            !host.startsWith('[') &&
            !/^\d{1,3}(\.\d{1,3}){3}$/.test(host)
        );
    } catch {
        return false;
    }
};

const displayName = (originalName) =>
    String(originalName ?? '')
        .replace(/[^\w .()-]/g, '')
        .trim()
        .slice(0, 120) || null;

const readChecklist = async (session) => {
    const { httpStatus, payload } = await session.call(CTRLPAY_METHOD.getBusinessDocuments, {}, { idempotent: true });
    if (httpStatus === 200 && payload && typeof payload === 'object' && payloadStatus(payload) !== 'ERROR') {
        return toChecklist(payload);
    }
    if ([400, 404, 409].includes(httpStatus)) reject('stageMismatch', 409);
    return reject('generic', 502);
};

const findSlot = (checklist, fileName) => {
    if (fileName === 'pan_card') return checklist.panCard;
    if (fileName === 'ovd_of_ubo') return checklist.ovd.required ? checklist.ovd : null;
    if (fileName === 'ovd_of_ubo_back') return checklist.ovdBack.required ? checklist.ovdBack : null;
    return checklist.entityDocuments.find((document) => document.fileName === fileName) ?? null;
};

const withTracking = (checklist, tracked) => ({
    ...checklist,
    panCard: store.withUploadTracking(checklist.panCard, tracked),
    entityDocuments: checklist.entityDocuments.map((document) => store.withUploadTracking(document, tracked)),
    ovd: store.withUploadTracking(checklist.ovd, tracked),
    ovdBack: store.withUploadTracking(checklist.ovdBack, tracked),
});

exports.getDocuments = async ({ user, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const checklist = await readChecklist(session);
    const tracked = await store.readTrackedUploads(user.corporateId, logTraceId);
    return { ...withTracking(checklist, tracked), complete: isChecklistComplete(checklist) };
};

const requestUploadUrl = async (session, params) => {
    const method = CTRLPAY_APPLICATION_FILE_NAMES.includes(params.file_name)
        ? CTRLPAY_METHOD.getApplicationUploadUrl
        : CTRLPAY_METHOD.getBusinessDocumentUploadUrl;
    const { httpStatus, payload } = await session.call(method, params);
    if (httpStatus === 200 && payloadStatus(payload) === CTRLPAY_SUCCESS && isSafeUploadUrl(payload.upload_url)) {
        return payload.upload_url;
    }
    return reject('documentUploadFailed', 502);
};

const putFile = async (uploadUrl, bytes, contentType, logTraceId) => {
    const startedAt = Date.now();
    try {
        const response = await axios.put(uploadUrl, bytes, {
            headers: { 'Content-Type': contentType },
            timeout: CTRLPAY_LIMITS.uploadTimeoutMs,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            validateStatus: () => true,
        });
        customLog(logTraceId, response.status === 200 ? 'info' : 'error', {
            action: 'ctrlpay:documentPut',
            httpStatus: response.status,
            bytes: bytes.length,
            durationMs: Date.now() - startedAt,
        }, 'VENDOR');
        return response.status;
    } catch (error) {
        customLog(logTraceId, 'error', {
            action: 'ctrlpay:documentPutFailed',
            code: error.code ?? null,
            durationMs: Date.now() - startedAt,
        }, 'VENDOR');
        return null;
    }
};

exports.uploadDocument = async ({ user, fileName, contentType, data, originalName, ovdType, logTraceId }) => {
    const bytes = Buffer.from(data, 'base64');
    if (!bytes.length) reject('documentContent', 400);
    if (bytes.length > CTRLPAY_LIMITS.maxDocumentBytes) reject('documentSize', 413);
    if (!matchesContentType(bytes, contentType)) reject('documentContent', 400);

    const session = await sessionFor(user, logTraceId);
    const slot = findSlot(await readChecklist(session), fileName);
    if (!slot) reject('documentUnknown', 404);
    if (slot.status === 'VERIFIED') reject('documentVerified', 409);

    const params = {
        file_name: fileName,
        content_type: contentType,
        ...(fileName === 'ovd_of_ubo' ? { ovd_type: ovdType } : {}),
    };
    let status = await putFile(await requestUploadUrl(session, params), bytes, contentType, logTraceId);
    if (status === 403) {
        status = await putFile(await requestUploadUrl(session, params), bytes, contentType, logTraceId);
    }
    if (status !== 200) reject('documentUploadFailed', 502);

    await store.trackUpload(user.corporateId, fileName, displayName(originalName), logTraceId);
    return { fileName, status: 'PROCESSING' };
};

exports.withdrawDocument = async ({ user, fileName, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    const { httpStatus, payload } = await session.call(CTRLPAY_METHOD.markDocumentNotUploaded, { file_name: fileName });
    if (httpStatus === 200 && payloadStatus(payload) === CTRLPAY_SUCCESS) {
        await store.forgetUpload(user.corporateId, fileName, logTraceId);
        return { fileName, status: 'NOT_UPLOADED' };
    }
    if (httpStatus === 409) reject('documentVerified', 409);
    if (httpStatus === 404) reject('documentUnknown', 404);
    return reject('generic', 502);
};

exports.submitApplication = async ({ user, address, pincode, logTraceId }) => {
    const session = await sessionFor(user, logTraceId);
    if (!isChecklistComplete(await readChecklist(session))) reject('documentsIncomplete', 422);

    const addressResult = await session.call(CTRLPAY_METHOD.fillOsvAddress, {
        osv_address: address,
        osv_pincode: pincode,
    });
    if (!(addressResult.httpStatus === 200 && payloadStatus(addressResult.payload) === CTRLPAY_SUCCESS)) {
        if (addressResult.httpStatus === 400) reject('pincodeInvalid', 400);
        reject('generic', 502);
    }

    const submitted = await session.call(CTRLPAY_METHOD.submitForVerification, {});
    const status = payloadStatus(submitted.payload);
    if (submitted.httpStatus === 200 && status && status !== 'ERROR') {
        if (status === 'VERIFY_PHONE') await store.clearPhoneOtp(user.corporateId, logTraceId);
        return { status };
    }
    if (submitted.httpStatus === 400) reject('stageMismatch', 409);
    return reject('generic', 502);
};
