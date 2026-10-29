'use strict';
const Joi = require('joi');

exports.createSchema = Joi.object({
  businessName:  Joi.string().trim().max(255).required(),
  gstin:         Joi.string().trim().max(20).allow('', null).optional(),
  contactPerson: Joi.string().trim().max(255).required(),
  email:         Joi.string().trim().email().max(255).allow('', null).optional(),
  phone:         Joi.string().trim().max(20).allow('', null).optional(),
  tags:          Joi.array().items(Joi.string()).default([]),
  paymentTerms:  Joi.string().allow('', null).optional(),
  status:        Joi.string().valid('Active', 'Inactive').default('Active'),
  bankName:      Joi.string().trim().max(255).allow('', null).optional(),
  accountNumber: Joi.string().trim().max(100).allow('', null).optional(),
  ifscCode:             Joi.string().trim().max(50).allow('', null).optional(),
  tradeLicenseNo:       Joi.string().trim().max(50).allow('', null).optional(),
  virtualAccountNumber: Joi.string().trim().max(100).allow('', null).optional(),
});

exports.updateSchema = Joi.object({
  businessName:  Joi.string().trim().max(255).optional(),
  gstin:         Joi.string().trim().max(20).allow('', null).optional(),
  contactPerson: Joi.string().trim().max(255).optional(),
  email:         Joi.string().trim().email().max(255).optional(),
  phone:         Joi.string().trim().max(20).allow('', null).optional(),
  tags:          Joi.array().items(Joi.string()).optional(),
  paymentTerms:  Joi.string().allow('', null).optional(),
  tradeLicenseNo:       Joi.string().trim().max(50).allow('', null).optional(),
  status:        Joi.string().valid('Active', 'Inactive').optional(),
  bankName:      Joi.string().trim().max(255).allow('', null).optional(),
  accountNumber: Joi.string().trim().max(100).allow('', null).optional(),
  ifscCode:      Joi.string().trim().max(50).allow('', null).optional(),
  virtualAccountNumber: Joi.string().trim().max(100).allow('', null).optional(),
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
