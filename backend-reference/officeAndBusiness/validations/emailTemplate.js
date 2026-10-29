'use strict';
const Joi = require('joi');
const ErrorResponse = require('../utils/error-response');
const { customLog } = require('../utils/loggerHelper');

// Identifiers are stored uppercase so `service` + `key` lookups are exact.
const IDENTIFIER = /^[A-Z][A-Z0-9_]*$/;

const keySchema = Joi.string().trim().uppercase().max(100).pattern(IDENTIFIER).messages({
    'string.pattern.base': 'key must start with a letter and contain only letters, numbers and underscores (e.g. WELCOME_EMAIL)',
    'string.max': 'key must be 100 characters or fewer',
});

const serviceSchema = Joi.string().trim().uppercase().max(50).pattern(IDENTIFIER).messages({
    'string.pattern.base': 'service must start with a letter and contain only letters, numbers and underscores (e.g. AUTH)',
    'string.max': 'service must be 50 characters or fewer',
});

const subjectSchema = Joi.string().trim().allow('', null).max(255).messages({
    'string.max': 'subject must be 255 characters or fewer',
});

// Partner credential id; empty/null means the default (no specific partner).
const partnerIdSchema = Joi.string().trim().allow('', null).max(100).messages({
    'string.max': 'partnerId must be 100 characters or fewer',
});

// Custom "from" address/name; empty/null means the send path's current default.
const senderSchema = Joi.string().trim().allow('', null).max(255).messages({
    'string.max': 'sender must be 255 characters or fewer',
});

// MEDIUMTEXT holds 16 MB; the body-parser limit is well below that. The cap here
// only guards against an accidental paste of something enormous.
const htmlBodySchema = Joi.string().allow('', null).max(5 * 1024 * 1024).messages({
    'string.max': 'draftHtmlBody is too large',
});

// Maps a layout slot to an adminEmailLayout.id. Only header/footer allowed. No
// existence check against adminEmailLayouts — app-layer id, not a DB FK.
const layoutSchema = Joi.object({
    header: Joi.number().integer().positive().allow(null).messages({
        'number.base': 'layout.header must be a positive integer id',
    }),
    footer: Joi.number().integer().positive().allow(null).messages({
        'number.base': 'layout.footer must be a positive integer id',
    }),
}).allow(null).messages({
    // No literal { or } — Joi treats braces as template tokens and crashes on them.
    'object.base': 'layout must be an object with optional header/footer layout ids, e.g. header 1 and footer 2',
});

const createSchema = Joi.object({
    key: keySchema.required().messages({ 'any.required': 'key is required' }),
    name: Joi.string().trim().min(1).max(150).required().messages({
        'any.required': 'name is required',
        'string.empty': 'name cannot be empty',
    }),
    service: serviceSchema.required().messages({ 'any.required': 'service is required' }),
    partnerId: partnerIdSchema,
    sender: senderSchema,
    subject: subjectSchema,
    draftHtmlBody: htmlBodySchema,
    layout: layoutSchema,
    isActive: Joi.boolean(),
});

// `key` can't be changed after creation — a rename would break lookups.
const updateSchema = Joi.object({
    name: Joi.string().trim().min(1).max(150),
    service: serviceSchema,
    partnerId: partnerIdSchema,
    sender: senderSchema,
    subject: subjectSchema,
    draftHtmlBody: htmlBodySchema,
    layout: layoutSchema,
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
                message: 'emailTemplate validation failed',
                details: error.details,
            });
            return next(new ErrorResponse(error.details.map((d) => d.message).join('; '), 400));
        }
        req.body = value;
        return next();
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: 'emailTemplate validate threw', error: err.message });
        return next(err);
    }
};

module.exports = {
    validateCreateEmailTemplate: validate(createSchema),
    validateUpdateEmailTemplate: validate(updateSchema),
    validateEmailTemplateActiveStatus: validate(activeStatusSchema),
    // Raw schema for bulk import — validates one row at a time.
    createEmailTemplateSchema: createSchema,
};
