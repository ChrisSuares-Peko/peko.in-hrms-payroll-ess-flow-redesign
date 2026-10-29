const Joi = require('joi');

exports.validatePasswordPolicy = (req, res, next) => {
  try {
    const schema = Joi.object({
    
        userId: Joi.number().optional().messages({
            "number.base": "User ID must be a number",
          }),
          userType: Joi.string().optional(),
          level:Joi.number().optional(),
        //   customBannedPasswords:Joi.array().optional(),
        customBannedPasswords:Joi.string().optional(), 
          enableBannedPasswords:Joi.boolean().optional(),
          maxPasswordAge:Joi.number().optional(),
          minPasswordAge:Joi.number().optional(),
          minChangeChars:Joi.number().optional(),
          minLength:Joi.number().optional(),
          preventPersonalDataInPassword:Joi.boolean().optional(),
          prohibitPasswordReuse:Joi.boolean().optional(),
          prohibitPasswordReuseTimes:Joi.number().optional(),

          lockEffectivePeriod:Joi.number().optional(),



      maxInvalidLoginAttempts: Joi.number().min(1).required().messages({
        "any.required": "Maximum invalid login attempts is required.",
        "number.base": "Maximum invalid login attempts must be a number.",
        "number.min": "Invalid login attempts should not be zero.",
      }),
      lockoutTimespan: Joi.number()
      .greater(0)
      .required()
      .messages({
        "number.base": "Lockout time span must be a number.",
        "number.greater": "Lockout time span cannot be zero.",
        "any.required": "Lockout time span is required.",
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
