'use strict';
const Joi = require('joi');

const attachmentItem = Joi.object({
  fileName:   Joi.string().required(),
  fileBase64: Joi.string().required(),
  fileFormat: Joi.string().valid('pdf', 'jpg', 'jpeg', 'png', 'csv').required(),
});

exports.createSchema = Joi.object({
  purchaseOrderId: Joi.number().integer().positive().required(),
  invoiceNumber:   Joi.string().trim().max(100).required(),
  amount:          Joi.number().positive().required(),
  invoiceDate:     Joi.string().isoDate().required(),
  receivedDate:    Joi.string().isoDate().required(),
  dueDate:         Joi.string().isoDate().allow('', null).optional(),
  accountNumber:   Joi.string().trim().max(100).allow('', null).optional(),
  ifscCode:        Joi.string().trim().max(100).allow('', null).optional(),
  notes:           Joi.string().trim().allow('', null).optional(),
  attachments:     Joi.array().items(attachmentItem).default([]),
});

exports.updateSchema = Joi.object({
  invoiceNumber: Joi.string().trim().max(100).optional(),
  amount:        Joi.number().positive().optional(),
  invoiceDate:   Joi.string().isoDate().optional(),
  receivedDate:  Joi.string().isoDate().optional(),
  dueDate:       Joi.string().isoDate().allow('', null).optional(),
  accountNumber: Joi.string().trim().max(100).allow('', null).optional(),
  ifscCode:      Joi.string().trim().max(100).allow('', null).optional(),
  notes:         Joi.string().trim().allow('', null).optional(),
  status:        Joi.string().valid('Pending', 'Verified', 'Approved', 'Rejected', 'Paid').optional(),
  attachments:   Joi.array().items(attachmentItem).optional(),
});

exports.validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
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
