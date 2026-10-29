'use strict';
const Joi = require('joi');
const ErrorResponse = require('../utils/error-response');
const { customLog } = require('../utils/loggerHelper');

// Same identifier convention as validations/emailTemplate.js.
const IDENTIFIER = /^[A-Z][A-Z0-9_]*$/;

const keySchema = Joi.string().trim().uppercase().max(50).pattern(IDENTIFIER).messages({
    'string.pattern.base': 'key must start with a letter and contain only letters, numbers and underscores (e.g. AUTH)',
    'string.max': 'key must be 50 characters or fewer',
});

const createSchema = Joi.object({
    key: keySchema.required().messages({ 'any.required': 'key is required' }),
    isActive: Joi.boolean(),
});

const activeStatusSchema = Joi.object({
    isActive: Joi.boolean().required().messages({
        'any.required': 'isActive is required',
        'boolean.base': 'isActive must be true or false',
    }),
});

const validate = (schema) => (req, res, next) => {
    try {
        const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: false });
        if (error) {
            customLog(req?.LogTraceId, 'warn', {
                message: 'emailTemplateService validation failed',
                details: error.details,
            });
            return next(new ErrorResponse(error.details.map((d) => d.message).join('; '), 400));
        }
        req.body = value;
        return next();
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: 'emailTemplateService validate threw', error: err.message });
        return next(err);
    }
};

module.exports = {
    validateCreateEmailTemplateService: validate(createSchema),
    validateEmailTemplateServiceActiveStatus: validate(activeStatusSchema),
};
