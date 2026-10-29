'use strict';
const Joi = require('joi');
const ErrorResponse = require('../utils/error-response');
const { customLog } = require('../utils/loggerHelper');

// Identifiers are stored uppercase so `type` lookups are exact.
const IDENTIFIER = /^[A-Z][A-Z0-9_]*$/;

// HEADER/FOOTER/etc — open identifier shape, not a fixed enum.
const typeSchema = Joi.string().trim().uppercase().max(50).pattern(IDENTIFIER).messages({
    'string.pattern.base': 'type must start with a letter and contain only letters, numbers and underscores (e.g. HEADER, FOOTER)',
    'string.max': 'type must be 50 characters or fewer',
});

// MEDIUMTEXT holds 16 MB; the body-parser limit is well below that. The cap here
// only guards against an accidental paste of something enormous.
const htmlSchema = Joi.string().allow('', null).max(5 * 1024 * 1024).messages({
    'string.max': 'draftHtml is too large',
});

// Partner credential id; empty/null means the default (no specific partner).
const partnerIdSchema = Joi.string().trim().allow('', null).max(100).messages({
    'string.max': 'partnerId must be 100 characters or fewer',
});

const createSchema = Joi.object({
    name: Joi.string().trim().min(1).max(150).required().messages({
        'any.required': 'name is required',
        'string.empty': 'name cannot be empty',
    }),
    type: typeSchema.required().messages({ 'any.required': 'type is required' }),
    partnerId: partnerIdSchema,
    draftHtml: htmlSchema,
    isActive: Joi.boolean(),
});

const updateSchema = Joi.object({
    name: Joi.string().trim().min(1).max(150),
    type: typeSchema,
    partnerId: partnerIdSchema,
    draftHtml: htmlSchema,
}).min(1).messages({
    'object.min': 'Provide at least one field to update',
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
                message: 'emailLayout validation failed',
                details: error.details,
            });
            return next(new ErrorResponse(error.details.map((d) => d.message).join('; '), 400));
        }
        req.body = value;
        return next();
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: 'emailLayout validate threw', error: err.message });
        return next(err);
    }
};

module.exports = {
    validateCreateEmailLayout: validate(createSchema),
    validateUpdateEmailLayout: validate(updateSchema),
    validateEmailLayoutActiveStatus: validate(activeStatusSchema),
};
