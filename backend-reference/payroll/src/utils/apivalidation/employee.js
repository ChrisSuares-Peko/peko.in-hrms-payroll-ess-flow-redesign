const Joi = require("joi");
const ErrorResponse = require("../error-response");

exports.validatePayrollSettings = (req, res, next) => {
    try {
      const payrollSettingsSchema = Joi.object({
        payrollSettings: Joi.object({
          selectWorkingDays: Joi.array()
            .items(Joi.string().valid('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'))
            .min(1)
            .required()
            .messages({
              'array.base': 'Select Working Days must be an array of strings',
              'array.min': 'At least one working day must be selected',
              'any.required': 'Select Working Days is required',
              'any.only': 'Each day must be a valid day of the week'
            }),
          calculateSalaryBasedOn: Joi.string()
            .valid('ACTUALDAYS', 'COMPANYWORKINGDAYS')
            .required()
            .messages({
              'string.base': 'Calculate Salary Based On must be a string',
              'any.only': 'Calculate Salary Based On must be either "ACTUALDAYS" or "COMPANYWORKINGDAYS"',
              'any.required': 'Calculate Salary Based On is required'
            }),
        }).required()
        .messages({
          'object.base': 'Payroll Settings must be an object',
          'any.required': 'Payroll Settings is required'
        })
      });
  
      // Validate the request body against the schema
      const result = payrollSettingsSchema.validate(req.body);
  
      if (result.error) {
        // If validation fails, throw an error with the validation message
        return next(new ErrorResponse(result.error.details[0].message, 400));
      }
  
      next();
    } catch (err) {
      console.error(err);
      return next(new ErrorResponse("Something went wrong", 500));
    }
  };