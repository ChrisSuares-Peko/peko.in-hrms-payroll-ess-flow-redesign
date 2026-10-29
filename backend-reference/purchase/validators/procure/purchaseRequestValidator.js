'use strict';
const Joi = require('joi');

const VALID_CURRENCIES = ['INR'];

const attachmentSchema = Joi.object({
  fileName:    Joi.string().required(),
  fileBase64:  Joi.string().required(),
  fileFormat:  Joi.string().valid('pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx').required(),
});

const lineItemSchema = Joi.object({
  key:          Joi.string().optional(),
  itemName:     Joi.string().trim().max(500).required(),
  description:  Joi.string().trim().max(2000).allow('', null).optional(),
  qty:          Joi.number().min(0).required(),
  unit:         Joi.string().trim().max(50).required(),
  estUnitCost:  Joi.number().min(0).allow(null, '').optional(),
});

exports.createSchema = Joi.object({
  department:      Joi.string().trim().max(255).allow('', null).optional(),
  category:        Joi.string().trim().max(255).allow('', null).optional(),
  estimatedBudget: Joi.number().min(0).precision(2).allow(null).optional(),
  currency:        Joi.string().valid('INR').default('INR'),
  neededBy:        Joi.string().isoDate().empty('').allow(null).optional(),
  description:     Joi.string().trim().max(5000).allow('', null).optional(),
  lineItems:       Joi.array().items(lineItemSchema).min(1).allow(null).optional(),
  notes:           Joi.string().trim().max(2000).allow('', null).optional(),
  requestedBy:     Joi.string().trim().max(2000).allow('', null).optional(),
  attachments:     Joi.array().items(attachmentSchema).max(10).default([]),
  status:          Joi.string().valid('Open', 'Draft').default('Open'),
});

exports.updateSchema = Joi.object({
  requestedBy:     Joi.string().trim().max(255).allow('', null).optional(),
  department:      Joi.string().trim().max(255).allow('', null).optional(),
  category:        Joi.string().trim().max(255).allow('', null).optional(),
  estimatedBudget: Joi.number().min(0).precision(2).allow(null).optional(),
  currency:        Joi.string().valid(...VALID_CURRENCIES).optional(),
  neededBy:        Joi.string().isoDate().empty('').allow(null).optional(),
  description:     Joi.string().trim().max(5000).allow('', null).optional(),
  lineItems:       Joi.array().items(lineItemSchema).min(1).allow(null).optional(),
  notes:           Joi.string().trim().max(2000).allow('', null).optional(),
  attachments:     Joi.array().items(attachmentSchema).max(10).optional(),
  deletedAttachments: Joi.array().items(Joi.string()).optional(),
  status:          Joi.string().valid('Open', 'Draft').optional(),
});

exports.rejectSchema = Joi.object({
  rejectionReason: Joi.string().trim().min(1).max(1000).required(),
});

exports.linkRfqSchema = Joi.object({
  rfqId: Joi.number().integer().positive().required(),
});

/**
 * Reusable express middleware factory.
 * Validates req.body against the given Joi schema.
 * Strips unknown keys and replaces req.body with sanitised values.
 */
exports.validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details.map((d) => d.message).join(', '),
      data: null,
      responseCode: '001',
    });
  }
  req.body = value;
  next();
};
