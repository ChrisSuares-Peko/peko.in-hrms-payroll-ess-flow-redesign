'use strict';
const Joi = require('joi');
const ErrorResponse = require('../utils/error-response');
const { customLog } = require('../utils/loggerHelper');

// Same identifier convention as validations/emailTemplate.js.
const IDENTIFIER = /^[A-Z][A-Z0-9_]*$/;
// camelCase placeholder convention, e.g. employeeName, corporateTxnId.
const VARIABLE_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const keySchema = Joi.string().trim().uppercase().max(100).pattern(IDENTIFIER).messages({
    'string.pattern.base': 'key must start with a letter and contain only letters, numbers and underscores (e.g. WELCOME_EMAIL)',
    'string.max': 'key must be 100 characters or fewer',
});

const serviceSchema = Joi.string().trim().uppercase().max(50).pattern(IDENTIFIER).messages({
    'string.pattern.base': 'service must start with a letter and contain only letters, numbers and underscores (e.g. AUTH)',
    'string.max': 'service must be 50 characters or fewer',
});

const createSchema = Joi.object({
    key: keySchema.required().messages({ 'any.required': 'key is required' }),
    service: serviceSchema.required().messages({ 'any.required': 'service is required' }),
    isActive: Joi.boolean(),
});

const activeStatusSchema = Joi.object({
    isActive: Joi.boolean().required().messages({
        'any.required': 'isActive is required',
        'boolean.base': 'isActive must be true or false',
    }),
});

// Values are accepted as any string (including '') — nothing downstream reads the
// value side of this object, only the variable names carry meaning.
const variablesSchema = Joi.object({
    service: serviceSchema.required().messages({ 'any.required': 'service is required' }),
    key: keySchema.required().messages({ 'any.required': 'key is required' }),
    variables: Joi.object()
        .pattern(VARIABLE_NAME, Joi.string().allow(''))
        .required()
        .messages({
            'any.required': 'variables is required',
            'object.base': 'variables must be an object of variable names',
        }),
});

const validate = (schema) => (req, res, next) => {
    try {
        const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
        if (error) {
            customLog(req?.LogTraceId, 'warn', {
                message: 'emailTemplateKey validation failed',
                details: error.details,
            });
            return next(new ErrorResponse(error.details.map((d) => d.message).join('; '), 400));
        }
        req.body = value;
        return next();
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: 'emailTemplateKey validate threw', error: err.message });
        return next(err);
    }
};

module.exports = {
    validateCreateEmailTemplateKey: validate(createSchema),
    validateEmailTemplateKeyActiveStatus: validate(activeStatusSchema),
    validateSetEmailTemplateKeyVariables: validate(variablesSchema),
};
