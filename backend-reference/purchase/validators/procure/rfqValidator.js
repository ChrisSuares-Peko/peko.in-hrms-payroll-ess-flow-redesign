'use strict';
const Joi = require('joi');

const lineItemSchema = Joi.object({
  id:          Joi.number().integer().positive().optional(),
  description: Joi.string().max(500).required(),
  qty:         Joi.number().positive().required(),
  unit:        Joi.string().max(50).optional().allow('', null),
  estUnitCost: Joi.number().min(0).optional().allow(null),
  sortOrder:   Joi.number().integer().min(0).optional(),
});

const attachmentSchema = Joi.object({
  fileName:   Joi.string().required(),
  fileBase64: Joi.string().required(),
  fileFormat: Joi.string().valid('pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx').required(),
});

const prAttachmentSchema = Joi.object({
  fileName:   Joi.string().required(),
  url:        Joi.string().required(),
  uploadedAt: Joi.string().optional().allow('', null),
});

exports.createSchema = Joi.object({
  title:              Joi.string().max(255).required(),
  type:               Joi.string().valid('RFQ', 'RFP', 'RFI').required(),
  submissionDeadline: Joi.date().iso().optional().allow(null),
  termsAndConditions: Joi.string().optional().allow('', null),
  buyerNotes:         Joi.string().optional().allow('', null),
  purchaseRequestId:  Joi.number().integer().positive().optional().allow(null),
  invitedVendors:     Joi.array().items(Joi.number().integer().positive()).optional(),
  invitedEmails:      Joi.array().items(Joi.string().email({ tlds: { allow: false } })).optional(),
  attachments:        Joi.array().items(attachmentSchema).optional(),
  prAttachments:      Joi.array().items(prAttachmentSchema).optional(),
  lineItems:          Joi.array().items(lineItemSchema).min(1).required(),
  send:               Joi.boolean().default(false),
});

exports.updateSchema = Joi.object({
  title:              Joi.string().max(255).optional(),
  type:               Joi.string().valid('RFQ', 'RFP', 'RFI').optional(),
  submissionDeadline: Joi.date().iso().optional().allow(null),
  termsAndConditions: Joi.string().optional().allow('', null),
  buyerNotes:         Joi.string().optional().allow('', null),
  invitedVendors:     Joi.array().items(Joi.number().integer().positive()).optional(),
  invitedEmails:      Joi.array().items(Joi.string().email({ tlds: { allow: false } })).optional(),
  attachments:        Joi.array().items(attachmentSchema).optional(),
  prAttachments:      Joi.array().items(prAttachmentSchema).optional(),
  lineItems:          Joi.array().items(lineItemSchema).min(1).optional(),
});

exports.saveDraftSchema = Joi.object({
  title:              Joi.string().max(255).optional().allow('', null),
  type:               Joi.string().valid('RFQ', 'RFP', 'RFI').optional(),
  submissionDeadline: Joi.date().iso().optional().allow(null),
  termsAndConditions: Joi.string().optional().allow('', null),
  buyerNotes:         Joi.string().optional().allow('', null),
  purchaseRequestId:  Joi.number().integer().positive().optional().allow(null),
  invitedVendors:     Joi.array().items(Joi.number().integer().positive()).optional(),
  invitedEmails:      Joi.array().items(Joi.string().email({ tlds: { allow: false } })).optional(),
  attachments:        Joi.array().items(attachmentSchema).optional(),
  prAttachments:      Joi.array().items(prAttachmentSchema).optional(),
  lineItems:          Joi.array().items(lineItemSchema).optional(),
});

exports.addVendorSchema = Joi.object({
  vendorId: Joi.number().integer().positive().required(),
});

exports.deleteAttachmentSchema = Joi.object({
  fileName: Joi.string().required(),
});

exports.validate = (schema) => (req, res, next) => {
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
  next();
};
