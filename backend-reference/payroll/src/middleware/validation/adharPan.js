const Joi = require('joi');

  exports.validateAadhaarNumber = (req, res, next) => {
    try {
      const schema = Joi.object({
        aadhaar_number: Joi.string()
          .pattern(/^[0-9]{12}$/)
          .required()
          .messages({
            "string.pattern.base": "Aadhaar number must be a 12-digit numeric string.",
            "any.required": "Aadhaar number is required.",
          }),
      });
  
      const result = schema.validate(req.body);
      if (result.error) {
        throw new Error(result.error.details[0].message);
      }
  
      next();
    } catch (err) {
      console.error(err);
      next(err);
    }
  };


  exports.validatePANAndName = (req, res, next) => {
      try {
        const schema = Joi.object({
          pan: Joi.string()
            .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
            .required()
            .messages({
              "string.pattern.base": "PAN must be in format: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g., ABCPV1234D).",
              "any.required": "PAN is required.",
            }),
          name: Joi.string()
            .min(2)
            .max(100)
            .allow('', null)
            .messages({
              "string.min": "Name must be at least 2 characters long.",
              "string.max": "Name must be less than or equal to 100 characters.",
            }),
        });
    
        const result = schema.validate(req.body);
        if (result.error) {
          throw new Error(result.error.details[0].message);
        }
    
        next();
      } catch (err) {
        console.error(err);
        next(err);
      }
    };  