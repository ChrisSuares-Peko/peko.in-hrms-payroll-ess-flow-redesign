'use strict';
const Joi = require('joi');

exports.addNoteSchema = Joi.object({
  note: Joi.string().trim().min(1).required(),
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
