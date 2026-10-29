const Joi = require('joi');
exports.validateSendEsignRequest = (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          "string.base": "Email ID must be a valid email address.",
          "string.email": "Email ID must be a valid email address.",
          "any.required": "Email ID is required.",
        }),

      signerName: Joi.string()
        .min(3)
        .required()
        .messages({
          "string.base": "Signer name must be a valid string.",
          "string.min": "Signer name must be at least 3 characters.",
          "any.required": "Signer name is required.",
        }),

      designation: Joi.string()
        .min(3)
        .required()
        .messages({
          "string.base": "Designation must be a valid string.",
          "string.min": "Designation must be at least 3 characters.",
          "any.required": "Designation is required.",
        }),

      address: Joi.string()
        .min(5)
        .required()
        .messages({
          "string.base": "Address must be a valid string.",
          "string.min": "Address must be at least 5 characters.",
          "any.required": "Address is required.",
        }),

      city: Joi.string()
        .min(2)
        .regex(/^[a-zA-Z\s]+$/)
        .required()
        .messages({
          "string.base": "City name must be a valid string.",
          "string.min": "City name must be at least 2 characters.",
          "string.pattern.base": "City name must contain only alphabets.",
          "any.required": "City name is required.",
        }),
    });

    const { error } = schema.validate(req.body);

    if (error) {
      throw new Error(error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err.message);
    next(new Error(err.message));
  }
};