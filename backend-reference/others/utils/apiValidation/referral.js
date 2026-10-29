const Joi = require('joi')

exports.validateReferThroughEmail = (req, res, next) => {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required().messages({
          "any.required": "Email is required.",
          "string.email": "Please provide a valid email address.",
        }),
      });
  
      const result = schema.validate(req.body);
      if (result.error) {
        throw new Error(result.error.details[0].message);
      }
      next();
    } catch (err) {
      err.code ? console.log(`🚀 ~Error:${err.message}`) : console.log(err);
      next(err);
    }
  };