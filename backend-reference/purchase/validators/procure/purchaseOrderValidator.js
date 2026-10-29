'use strict';
const Joi = require('joi');

const lineItemSchema = Joi.object({
  proposalLineItemId: Joi.number().integer().optional(),
  description:        Joi.string().trim().max(500).required(),
  qty:                Joi.number().positive().required(),
  unit:               Joi.string().trim().max(50).allow('', null).optional(),
  unitPrice:          Joi.number().min(0).required(),
  taxRate:            Joi.number().min(0).max(100).allow(null).optional(),
  gstType:            Joi.string().valid('inclusive', 'exclusive').allow(null).optional(),
  sortOrder:          Joi.number().integer().default(0),
});

exports.createSchema = Joi.object({
  vendorId:          Joi.number().integer().required(),
  title:             Joi.string().trim().max(200).optional(),
  proposalId:        Joi.number().integer().allow(null).optional(),
  rfqId:             Joi.number().integer().allow(null).optional(),
  purchaseRequestId: Joi.number().integer().allow(null).optional(),
  currency:          Joi.string().trim().max(10).default('AED'),
  deliveryAddress:   Joi.string().trim().allow('', null).optional(),
  deliveryDate:      Joi.date().iso().allow(null).optional(),
  paymentTerms:      Joi.string().trim().max(100).allow('', null).optional(),
  notesToVendor:     Joi.string().trim().allow('', null).optional(),
  internalNotes:     Joi.string().trim().allow('', null).optional(),
  lineItems:         Joi.array().items(lineItemSchema).min(1).required(),
});

exports.updateSchema = Joi.object({
  vendorId:          Joi.number().integer().optional(),
  title:             Joi.string().trim().max(200).allow('', null).optional(),
  rfqId:             Joi.number().integer().allow(null).optional(),
  purchaseRequestId: Joi.number().integer().allow(null).optional(),
  currency:          Joi.string().trim().max(10).optional(),
  deliveryAddress:   Joi.string().trim().allow('', null).optional(),
  deliveryDate:      Joi.date().iso().allow(null).optional(),
  paymentTerms:      Joi.string().trim().max(100).allow('', null).optional(),
  notesToVendor:     Joi.string().trim().allow('', null).optional(),
  internalNotes:     Joi.string().trim().allow('', null).optional(),
  lineItems:         Joi.array().items(lineItemSchema).min(1).optional(),
});

exports.cancelSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(500).required(),
});

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
