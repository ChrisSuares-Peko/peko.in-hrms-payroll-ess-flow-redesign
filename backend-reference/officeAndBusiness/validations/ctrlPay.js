'use strict';
const Joi = require('joi');
const ErrorResponse = require('../utils/error-response');
const {
    CTRLPAY_APPLICATION_FILE_NAMES,
    CTRLPAY_DOCUMENT_CONTENT_TYPES,
    CTRLPAY_LIMITS,
    CTRLPAY_TRANSACTION_METHODS,
    CTRLPAY_WEB_OVD_TYPES,
} = require('../constants/ctrlPay');

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ENTITY_FILE_NAME = /^[A-Z][A-Z0-9_]{1,99}$/;
const MAX_BASE64_LENGTH = Math.ceil(CTRLPAY_LIMITS.maxDocumentBytes / 3) * 4 + 8;

const fileNameSchema = Joi.alternatives()
    .try(Joi.string().valid(...CTRLPAY_APPLICATION_FILE_NAMES), Joi.string().pattern(ENTITY_FILE_NAME))
    .required()
    .messages({ 'alternatives.match': 'Choose a document from your checklist' });

const otpSchema = Joi.object({
    otp: Joi.string().trim().pattern(/^\d{6}$/).required().messages({
        'string.pattern.base': 'Code must be 6 digits',
        'any.required': 'Please enter the 6-digit code',
        'string.empty': 'Please enter the 6-digit code',
    }),
});

const schemas = {
    signInCallback: Joi.object({
        code: Joi.string().trim().min(1).max(2048).required(),
        state: Joi.string().trim().pattern(/^[A-Za-z0-9_-]{16,128}$/).required(),
    }),
    consent: Joi.object({
        consentMasterName: Joi.string().trim().min(1).max(100).required(),
    }),
    panSearch: Joi.object({
        pan: Joi.string().trim().uppercase().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/).required().messages({
            'string.pattern.base': 'PAN must be 5 letters, 4 digits and 1 letter',
            'any.required': 'Please enter the business PAN',
            'string.empty': 'Please enter the business PAN',
        }),
        mobile: Joi.string().trim().pattern(/^[6-9]\d{9}$/).required().messages({
            'string.pattern.base': 'Please enter a valid 10-digit mobile number',
            'any.required': 'Please enter the mobile number',
            'string.empty': 'Please enter the mobile number',
        }),
    }),
    otp: otpSchema,
    documentUpload: Joi.object({
        fileName: fileNameSchema,
        contentType: Joi.string().valid(...CTRLPAY_DOCUMENT_CONTENT_TYPES).required().messages({
            'any.only': 'Only PDF, JPG, PNG or TIFF files can be uploaded.',
        }),
        data: Joi.string().max(MAX_BASE64_LENGTH).pattern(/^[A-Za-z0-9+/]+={0,2}$/).required().messages({
            'string.max': 'Files must be 10 MB or smaller.',
            'string.pattern.base': 'The file could not be read. Please try again.',
        }),
        originalName: Joi.string().trim().max(255).allow('').default(''),
        ovdType: Joi.when('fileName', {
            is: Joi.string().valid('ovd_of_ubo').required(),
            then: Joi.string().valid(...CTRLPAY_WEB_OVD_TYPES).required().messages({
                'any.required': 'Choose the type of identity document.',
                'any.only': 'Choose the type of identity document.',
            }),
            otherwise: Joi.forbidden(),
        }),
    }),
    documentParams: Joi.object({ fileName: fileNameSchema }).unknown(true),
    submit: Joi.object({
        address: Joi.string().trim().min(10).max(250).required().messages({
            'string.min': 'Address must be at least 10 characters',
            'string.max': 'Address cannot exceed 250 characters',
            'any.required': 'Please enter the address',
            'string.empty': 'Please enter the address',
        }),
        pincode: Joi.string().trim().pattern(/^[1-9][0-9]{5}$/).required().messages({
            'string.pattern.base': 'Enter a valid 6-digit PIN code.',
            'any.required': 'Please enter the PIN code',
        }),
    }),
    senderAccount: Joi.object({
        accountName: Joi.string().trim().uppercase().min(1).max(100).pattern(/^[A-Z0-9 .&'()/-]+$/).required().messages({
            'string.pattern.base': 'Account holder name has characters that are not allowed',
        }),
        accountNumber: Joi.string().trim().pattern(/^\d{9,18}$/).required().messages({
            'string.pattern.base': 'Account number must be 9 to 18 digits',
        }),
        ifsc: Joi.string().trim().uppercase().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required().messages({
            'string.pattern.base': 'Enter a valid IFSC code',
        }),
    }),
    senderAccountParams: Joi.object({
        accountNumber: Joi.string().pattern(/^\d{9,18}$/).required(),
    }).unknown(true),
    transactionFilters: Joi.object({
        page: Joi.number().integer().min(1).max(10000).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(10),
        kind: Joi.string().valid('Spend', 'Load'),
        status: Joi.string().valid('Completed', 'Pending', 'Initiated', 'Failed'),
        method: Joi.string().valid(...CTRLPAY_TRANSACTION_METHODS),
        from: Joi.string().pattern(DATE),
        to: Joi.string().pattern(DATE),
        search: Joi.string().trim().max(100).allow(''),
    }),
    statement: Joi.object({
        from: Joi.string().pattern(DATE).required(),
        to: Joi.string().pattern(DATE).required(),
    }),
};

const validate = (schema, source = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(req[source] ?? {}, { abortEarly: false, stripUnknown: source !== 'body' });
    if (error) {
        return next(new ErrorResponse(error.details.map((detail) => detail.message).join('; '), 400));
    }
    req[source] = value;
    return next();
};

module.exports = {
    validateCtrlPaySignInCallback: validate(schemas.signInCallback),
    validateCtrlPayConsent: validate(schemas.consent),
    validateCtrlPayPanSearch: validate(schemas.panSearch),
    validateCtrlPayOtp: validate(schemas.otp),
    validateCtrlPayDocumentUpload: validate(schemas.documentUpload),
    validateCtrlPayDocumentParams: validate(schemas.documentParams, 'params'),
    validateCtrlPaySubmit: validate(schemas.submit),
    validateCtrlPaySenderAccount: validate(schemas.senderAccount),
    validateCtrlPaySenderAccountParams: validate(schemas.senderAccountParams, 'params'),
    validateCtrlPayTransactionFilters: validate(schemas.transactionFilters, 'query'),
    validateCtrlPayStatement: validate(schemas.statement, 'query'),
};
