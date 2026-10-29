'use strict';
const Joi = require('joi');

const lineItemSchema = Joi.object({
  rfqLineItemId: Joi.number().integer().positive().allow(null).optional(),
  description:   Joi.string().max(500).required(),
  unitPrice:     Joi.number().min(0).allow(null).optional(),
  qty:           Joi.number().min(0).allow(null).optional(),
  total:         Joi.number().min(0).allow(null).optional(),
});

const submitLineItemSchema = lineItemSchema.keys({
  description: Joi.string().max(500).allow(null, '').optional(),
});

const attachmentSchema = Joi.object({
  fileName:   Joi.string().required(),
  fileBase64: Joi.string().required(),
  fileFormat: Joi.string().valid('pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx').required(),
});

exports.submitSchema = Joi.object({
  rfqId:          Joi.number().integer().positive().required(),
  vendorId:       Joi.number().integer().positive().required(),
  submissionMode: Joi.string().valid('Online', 'Offline').default('Online'),
  totalAmount:    Joi.number().min(0).allow(null).optional(),
  validUntil:     Joi.string().isoDate().allow(null, '').optional(),
  paymentTerms:     Joi.string().max(100).allow(null, '').optional(),
  contactPerson:    Joi.string().max(255).allow(null, '').optional(),
  contactEmail:     Joi.string().email().allow(null, '').optional(),
  contactMobile:    Joi.string().max(50).allow(null, '').optional(),
  deliveryTimeline: Joi.string().max(500).allow(null, '').optional(),
  warranty:         Joi.string().max(2000).allow(null, '').optional(),
  coverNote:        Joi.string().max(5000).allow(null, '').optional(),
  lineItems:      Joi.when('submissionMode', {
    is:        'Online',
    then:      Joi.array().items(submitLineItemSchema).min(1).optional(),
    otherwise: Joi.array().items(submitLineItemSchema).optional(),
  }),
  attachment: Joi.when('submissionMode', {
    is:        'Offline',
    then:      attachmentSchema.optional(),
    otherwise: Joi.any().forbidden(),
  }),
});

exports.declineSchema = Joi.object({
  reason: Joi.string().max(1000).allow(null, '').optional(),
});

exports.validate = (schema) => (req, res, next) => {
  if (req.body.isOffline !== undefined && req.body.submissionMode === undefined) {
    req.body.submissionMode = req.body.isOffline ? 'Offline' : 'Online';
  }
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({
      status: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
      responseCode: '001',
    });
  }
  req.body = value;
  return next();
};
