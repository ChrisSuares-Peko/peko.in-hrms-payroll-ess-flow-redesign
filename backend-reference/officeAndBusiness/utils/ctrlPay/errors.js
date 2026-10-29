'use strict';

const ErrorResponse = require('../error-response');
const { customLog } = require('../loggerHelper');
const { CTRLPAY_MESSAGES } = require('../../constants/ctrlPay');
const { CtrlPayError } = require('./client');
const { CtrlPayConfigError } = require('./config');

const CTRLPAY_ERROR_RESPONSES = {
    NOT_CONNECTED: [CTRLPAY_MESSAGES.notConnected, 401],
    RECONNECT_REQUIRED: [CTRLPAY_MESSAGES.reconnectRequired, 401],
    UNAVAILABLE: [CTRLPAY_MESSAGES.unavailable, 503],
    BAD_RESPONSE: [CTRLPAY_MESSAGES.generic, 502],
};

const toErrorResponse = (error, req) => {
    if (error instanceof ErrorResponse && error.status_code) return error;
    if (error instanceof CtrlPayError) {
        const [message, statusCode] = CTRLPAY_ERROR_RESPONSES[error.kind] ?? [CTRLPAY_MESSAGES.generic, 502];
        return new ErrorResponse(message, statusCode);
    }
    customLog(req?.LogTraceId, 'error', {
        action: error instanceof CtrlPayConfigError ? 'ctrlpay:notConfigured' : 'ctrlpay:unexpectedError',
        error: error?.message,
        stack: error?.stack,
    }, 'VENDOR');
    return new ErrorResponse(CTRLPAY_MESSAGES.generic, 500);
};

const ctrlPayHandler = (handler) => (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch((error) => next(toErrorResponse(error, req)));

const sendCtrlPayData = (res, data, message = 'Success') =>
    res.status(200).json({ status: true, message, data, responseCode: '000' });

const rejectWith = (message, statusCode) => {
    throw new ErrorResponse(message, statusCode);
};

module.exports = { ctrlPayHandler, sendCtrlPayData, rejectWith, toErrorResponse };
