const Joi = require('joi');
const ErrorResponse = require('../utils/error-response');

exports.validateOrganizationSettings = (req, res, next) => {
  try {
    const schema = Joi.object({
      companyProfile: Joi.object({
        companyName: Joi.string().required().messages({
          'string.base': 'Company Name must be a string',
          'any.required': 'Company Name is required'
        }),

        companyAddressLine1: Joi.string().required().messages({
          'string.base': 'Address Line 1 must be a string',
          'any.required': 'Address Line 1 is required'
        }),

        companyAddressLine2: Joi.string().allow("").optional().messages({
          'string.base': 'Address Line 2 must be a string',
          'any.required': 'Address Line 2 is required'
        }),

        city: Joi.string().required().messages({
          'string.base': 'City must be a string',
          'any.required': 'City is required'
        }),

        state: Joi.string().required().messages({
          'string.base': 'State must be a string',
          'any.required': 'State is required'
        }),

        pinCode: Joi.string().length(6).required().messages({
          'string.length': 'PinCode must be 6 digits',
          'any.required': 'PinCode is required'
        }),

        contactNumber: Joi.string().length(10).required().messages({
          'string.length': 'Contact Number must be 10 digits',
          'any.required': 'Contact Number is required'
        }),

        emailAddress: Joi.string().email().required().messages({
          'string.email': 'Email must be valid',
          'any.required': 'Email is required'
        }),

        industry: Joi.string().allow('').optional(),

        companyLogo: Joi.any().optional()

      }).required().messages({
        'object.base': 'Company Profile must be an object',
        'any.required': 'Company Profile is required'
      }),

      organizationTaxDetails: Joi.object({

        PAN: Joi.string()
          .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
          .required()
          .messages({
            'string.pattern.base': 'Invalid PAN format',
            'any.required': 'PAN is required'
          }),

        TAN: Joi.string()
          .pattern(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/)
          .required()
          .messages({
            'string.pattern.base': 'Invalid TAN format',
            'any.required': 'TAN is required'
          }),

        TDSCode: Joi.string()
          .uppercase()
          .pattern(/^[A-Z]{3}[WCR][0-9]{3,4}$/)
          .required()
          .messages({
            'string.pattern.base': 'Please enter a valid TDS Circle/AO Code (e.g. DELW0101 or NWRC881)',
            'any.required': 'Please enter the TDS Circle/AO Code'
          }),

        taxPaymentFrequency: Joi.string()
          .valid('MONTHLY', 'QUARTERLY', 'ANNUALLY')
          .required()
          .messages({
            'any.only': 'Invalid Tax Payment Frequency',
            'any.required': 'Tax Payment Frequency is required'
          })

      }).required().messages({
        'object.base': 'Organization Tax Details must be an object',
        'any.required': 'Organization Tax Details are required'
      })

    });

    const result = schema.validate(req.body);

    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next();

  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateBankDetails = (req, res, next) => {
  try {
    const bankDetailsSchema = Joi.object({
      bankDetails: Joi.object({
        bankName: Joi.string()
          .required()
          .messages({
            'string.base': 'Bank Name must be a string',
            'any.required': 'Bank Name is required'
          }),
        accountNumber: Joi.string()
          .pattern(/^[0-9]+$/)
          .required()
          .messages({
            'string.base': 'Account Number must be a string',
            'string.pattern.base': 'Account Number must contain only digits',
            'any.required': 'Account Number is required'
          }),
        accountHolderName: Joi.string()
          .required()
          .messages({
            'string.base': 'Account Holder Name must be a string',
            'any.required': 'Account Holder Name is required'
          }),
        ifscCode: Joi.string()
          .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
          .required()
          .messages({
            'string.base': 'IFSC Code must be a string',
            'string.pattern.base': 'IFSC Code must be in the format: 4 letters, a zero, and 6 alphanumeric characters',
            'any.required': 'IFSC Code is required'
          }),
        branchAddress: Joi.string()
          .required()
          .messages({
            'string.base': 'Branch Address must be a string',
            'any.required': 'Branch Address is required'
          })
      }).required()
      .messages({
        'object.base': 'Bank Details must be an object',
        'any.required': 'Bank Details are required'
      })
    });

    // Validate the request body against the schema
    const result = bankDetailsSchema.validate(req.body);

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

exports.validatePayrollSettings = (req, res, next) => {
  try {

    const schema = Joi.object({

      payrollSettings: Joi.object({

        selectWorkingDays: Joi.array()
          .items(
            Joi.string().valid(
              'MON',
              'TUE',
              'WED',
              'THU',
              'FRI',
              'SAT',
              'SUN'
            )
          )
          .min(1)
          .required()
          .messages({
            'array.base': 'Working Days must be an array',
            'array.min': 'At least one working day must be selected',
            'any.required': 'Working Days are required'
          }),

        calculateSalaryBasedOn: Joi.string()
          .valid(
            'COMPANYWORKINGDAYS',
            'ACTUALDAYS'
          )
          .required()
          .messages({
            'any.required': 'Salary calculation type is required'
          }),

        payrollFrom: Joi.date()
          .iso()
          .required()
          .messages({
            'date.base': 'Payroll From must be a valid date',
            'any.required': 'Payroll From date is required'
          }),

        payEmployeeOn: Joi.number()
          .integer()
          .min(1)
          .max(31)
          .required()
          .messages({
            'number.base': 'Pay Employee On must be a number',
            'number.min': 'Pay Employee On must be between 1 and 31',
            'number.max': 'Pay Employee On must be between 1 and 31',
            'any.required': 'Pay Employee On is required'
          })

      })
      .required()
      .messages({
        'object.base': 'Payroll Settings must be an object',
        'any.required': 'Payroll Settings are required'
      })

    });


    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {

      const errors = result.error.details.map(e => e.message);

      return next(
        new ErrorResponse(errors.join(', '), 400)
      );

    }

    next();

  }
  catch (err) {

    console.error(err);

    return next(
      new ErrorResponse("Something went wrong", 500)
    );

  }
};