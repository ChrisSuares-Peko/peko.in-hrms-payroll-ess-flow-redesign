'use strict';

const {
    CTRLPAY_CUSTOMER_TYPE,
    CTRLPAY_METHOD,
    CTRLPAY_SUCCESS,
} = require('../constants/ctrlPay');
const { updateCtrlPayConnection } = require('../models/use-cases/ctrlPayConnection');
const { customLog } = require('../utils/loggerHelper');
const { CtrlPayError, createCtrlPaySession, payloadStatus } = require('../utils/ctrlPay/client');
const { toApplication } = require('../utils/ctrlPay/mappers');

const blockedApplication = (status) => ({
    status,
    customerName: null,
    constitutionCode: null,
    constitutionDescription: null,
});

const readApplication = async (session) => {
    const { httpStatus, payload } = await session.call(
        CTRLPAY_METHOD.getOnboardingStatus,
        { customer_type: CTRLPAY_CUSTOMER_TYPE },
        { idempotent: true }
    );
    const status = payloadStatus(payload);
    if (httpStatus === 403) return blockedApplication('ACCOUNT_BLOCKED');
    if (httpStatus === 200 && status === 'ERROR') return blockedApplication('USER_BLOCKED');
    if (httpStatus === 200 && status) return toApplication(payload);
    throw new CtrlPayError('BAD_RESPONSE', { method: CTRLPAY_METHOD.getOnboardingStatus, httpStatus });
};

const tagPartnerCode = async (session, logTraceId) => {
    const { corporateId } = session.connection;
    try {
        const { httpStatus, payload } = await session.call(CTRLPAY_METHOD.validatePartnerCode, {
            partner_code: session.config.partnerCode,
        });
        if (httpStatus === 200 && payloadStatus(payload) === CTRLPAY_SUCCESS) {
            await updateCtrlPayConnection(corporateId, { partnerCodeTaggedAt: new Date() });
            customLog(logTraceId, 'info', { action: 'ctrlpay:partnerCodeTagged', corporateId }, 'VENDOR');
            return;
        }
        customLog(logTraceId, 'error', {
            action: 'ctrlpay:partnerCodeRejected',
            corporateId,
            httpStatus,
            apiStatus: payloadStatus(payload),
        }, 'VENDOR');
    } catch (error) {
        customLog(logTraceId, 'error', {
            action: 'ctrlpay:partnerCodeFailed',
            corporateId,
            error: error.message,
        }, 'VENDOR');
    }
};

const provisionApplication = async ({ corporateId, logTraceId }) => {
    const session = await createCtrlPaySession({ corporateId, logTraceId });
    const application = await readApplication(session);
    if (!session.connection.partnerCodeTaggedAt) await tagPartnerCode(session, logTraceId);
    return application;
};

module.exports = { readApplication, tagPartnerCode, provisionApplication };
