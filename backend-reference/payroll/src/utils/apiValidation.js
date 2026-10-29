const Joi = require("joi");
const ErrorResponse = require("./error-response");
const { ONE_TIME_DEDUCTION_TYPES } = require("./oneTimeDeductionTypes");

exports.validateGeneratePaySlip = (req, res, next) => {
  try {
    const schema = Joi.object({
      logo: Joi.optional(),
      companyName: Joi.string().required(),
      website: Joi.string().required(),
      address: Joi.string().required(),
      email: Joi.string().required().email(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }
    next();
  } catch (err) {
    next(err);
  }
};

exports.validateAnnoucementCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      subject: Joi.string().required().messages({
        "string.empty": "Subject cannot be empty",
        "any.required": "Subject is required",
      }),
      details: Joi.string().required().messages({
        "string.empty": "Details cannot be empty",
        "any.required": "Details are required",
      }),
      excludedEmployees: Joi.array().items(Joi.string()).messages({
        "array.base": "Employee must be an array",
      }),
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateAssetCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      assetType: Joi.string().required().messages({
        "string.empty": "Asset type cannot be empty",
        "any.required": "Asset type is required",
      }),
      assetName: Joi.string().required().messages({
        "string.empty": "Asset name cannot be empty",
        "any.required": "Asset name is required",
      }),
      assetId: Joi.string().required().messages({
        "string.empty": "Asset ID cannot be empty",
        "any.required": "Asset ID is required",
      }),
      purchasedDate: Joi.date().required().messages({
        "date.base": "Purchased date must be a valid date in ISO format",
        "any.required": "Purchased date is required",
      }),
      employee: Joi.string().required().messages({
        "string.empty": "Employee field cannot be empty",
        "any.required": "Employee field is required",
      }),
      status: Joi.string()
        .valid("ACTIVE", "AVAILABLE", "IN USE")
        .required()
        .messages({
          "any.only": "Status must be one of: ACTIVE, INACTIVE, PENDING",
          "any.required": "Status is required",
        }),
      batchNo: Joi.string().required().messages({
        "string.empty": "Batch number cannot be empty",
        "any.required": "Batch number is required",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateDocumentCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      name: Joi.string().required().messages({
        "string.empty": "Document name cannot be empty",
        "any.required": "Document name is required",
      }),
      employee: Joi.string().required().messages({
        "string.empty": "Employee field cannot be empty",
        "any.required": "Employee field is required",
      }),
      expiryDate: Joi.date().optional().allow(""),
      // holderName: Joi.string().required().messages({
      //   "string.empty": "Holder name cannot be empty",
      //   "any.required": "Holder name is required",
      // }),
      url: Joi.object({
        base64: Joi.string().required().messages({
          "string.empty": "Base64 URL cannot be empty",
          "any.required": "Base64 URL is required",
        }),
        format: Joi.string().required().messages({
          "any.required": "Attachment format is required",
        }),
      })
        .required()
        .messages({
          "object.base": "URL object is required",
          "any.required": "URL object is required",
        }),
      attachmentFormat: Joi.string().required().messages({
        "any.required": "Attachment format is required",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateDocumentUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      name: Joi.string().required().messages({
        "string.empty": "Document name cannot be empty",
        "any.required": "Document name is required",
      }),
      employee: Joi.string().required().messages({
        "string.empty": "Employee field cannot be empty",
        "any.required": "Employee field is required",
      }),
      expiryDate: Joi.date().optional().allow(""),
      // holderName: Joi.string().required().messages({
      //   "string.empty": "Holder name cannot be empty",
      //   "any.required": "Holder name is required",
      // }),
      url: Joi.alternatives()
        .try(
          Joi.object({
            base64: Joi.string().required().messages({
              "string.empty": "Base64 URL cannot be empty",
              "any.required": "Base64 URL is required",
            }),
            format: Joi.string().required().messages({
              "any.required": "Attachment format is required",
            }),
          }),
          Joi.string()
        )
        .required()
        .messages({
          "any.required": "URL object is required",
        }),

      attachmentFormat: Joi.string().optional(),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
      documentId: Joi.string().optional(),
      employeeId: Joi.string().optional(),
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateBonusCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      employeeId: Joi.string().required().messages({
        "string.empty": "Employee ID cannot be empty",
        "any.required": "Employee ID is required",
      }),
      bonusDate: Joi.date().required().messages({
        "date.base": "Bonus date must be a valid date in ISO format",
        "any.required": "Bonus date is required",
      }),
      type: Joi.string().required().messages({
        "any.required": "Type is required",
      }),
      bonusPercentage: Joi.when("type", {
        is: "percentage",
        then: Joi.number().positive().max(100).required().messages({
          "number.base": "Bonus percentage must be a positive number",
          "number.max": "Bonus percentage cannot exceed 100",
          "any.required": "Bonus percentage is required",
        }),
      }),
      bonusAmount: Joi.when("type", {
        is: "amount",
        then: Joi.number().positive().required().messages({
          "number.base": "Bonus amount must be a positive number",
          "any.required": "Bonus amount is required",
        }),
      }),
      userId: Joi.number().optional(),
      userType: Joi.string().optional(),
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateBonusUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      employeeId: Joi.string().optional(),
      id: Joi.string().optional(),
      bId: Joi.string().optional(),
      bonusDate: Joi.date().required().messages({
        "date.base": "Bonus date must be a valid date in ISO format",
        "any.required": "Bonus date is required",
      }),
      type: Joi.string().required().messages({
        "any.required": "Type is required",
      }),
      bonusPercentage: Joi.alternatives().try(Joi.string(), Joi.number()),
      bonusAmount: Joi.number().min(0).messages({
        'number.base': 'Bonus amount must be a number.',
        'number.min': 'Bonus amount must be a non-negative number.',
      }),
      userId: Joi.number().optional(),
      userType: Joi.string().optional(),
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateBonusCalculation = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      userId: Joi.number().optional(),
      userType: Joi.string().optional(),
      eId: Joi.string().required().messages({
        "string.empty": "Employee ID cannot be empty",
        "any.required": "Employee ID is required",
      }),
      type: Joi.string().required().messages({
        "any.required": "Type is required",
      }),
      bonusPercentage: Joi.string().required().allow("").messages({
        "any.required": "Bonus percentage is required",
      }),
      bonusAmount: Joi.string().required().allow("").custom((value, helpers) => {
        if (value === "") {
          return value;
        }
        const number = parseFloat(value);
        if (isNaN(number) || number < 0) {
          return helpers.error('any.invalid');
        }
        return value;
      }).messages({
        "string.base": "Bonus amount must be a string.",
        "any.required": "Bonus amount is required.",
        "any.invalid": "Bonus amount must be a non-negative number.",
      }),
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateActivityCalenderSendEmail = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      userId: Joi.number().optional(),
      userType: Joi.string().optional(),
      activityId: Joi.string().required().messages({
        "string.empty": "Activity ID cannot be empty",
        "any.required": "Activity ID is required",
      }),
      companyName: Joi.string().optional(),
      logo: Joi.string().optional(),
      sender: Joi.string().optional(),
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

// Add Deduction / Edit Deduction — a typed one-time recovery from earned pay for one month.
const oneTimeDeductionFields = {
  deductionFor: Joi.string().valid(...ONE_TIME_DEDUCTION_TYPES).required().messages({
    "any.only": "Choose what the deduction is for from the list",
    "string.empty": "Deduction for is required",
    "any.required": "Deduction for is required",
  }),
  note: Joi.when('deductionFor', {
    is: 'Other',
    then: Joi.string().trim().max(200).required(),
    otherwise: Joi.string().trim().max(200).allow(''),
  }).messages({
    "string.empty": 'Add a note when the deduction is for "Other"',
    "any.required": 'Add a note when the deduction is for "Other"',
    "string.max": "Note can be at most 200 characters",
  }),
  amount: Joi.number().integer().greater(0).required().messages({
    "number.base": "Amount must be a number",
    "number.integer": "Amount must be in whole rupees",
    "number.greater": "Amount must be more than ₹0",
    "any.required": "Amount is required",
  }),
};

const validateBody = (schema) => (req, res, next) => {
  const result = schema.validate(req.body);
  if (result.error) {
    return next(new ErrorResponse(result.error.details[0].message, 400));
  }
  req.body = result.value;
  return next();
};

exports.validateDeductionDirect = validateBody(Joi.object({
  ...oneTimeDeductionFields,
  // The salary month the deduction belongs to — the month selected on Salary Details.
  month: Joi.number().integer().min(1).max(12).required().messages({
    "number.base": "Month is required",
    "any.required": "Month is required",
  }),
  year: Joi.number().integer().min(2000).required().messages({
    "number.base": "Year is required",
    "any.required": "Year is required",
  }),
}));

// The month stays the one the deduction was added for; only type, note and amount change.
exports.validateOneTimeDeductionUpdate = validateBody(Joi.object(oneTimeDeductionFields));

exports.validateDeductionCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      deductionDate: Joi.date().required().messages({
        "date.base":
          "Deduction date must be a valid date in ISO format (YYYY-MM-DD)",
        "any.required": "Deduction date is required",
      }),
      deductionType: Joi.string().required().messages({
        "string.empty": "Deduction type cannot be empty",
        "any.required": "Deduction type is required",
      }),
      deductionAmount: Joi.number().min(0).required().messages({
        "number.base": "Deduction amount must be a number.",
        "number.min": "Deduction amount must be a non-negative number.",
        "any.required": "Deduction amount is required.",
      }),
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateDepartmentCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      departmentName: Joi.string().required().messages({
        "string.empty": "Department name cannot be empty",
        "any.required": "Department name is required",
      }),
      departmentCode: Joi.string().allow("").messages({
        "string.empty": "Department code cannot be empty",
      }),
    
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateDepartmentUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      userId: Joi.number().optional(),
      userType: Joi.string().optional(),
      id: Joi.string().optional(),
      departmentName: Joi.string().required().messages({
        "string.empty": "Department name cannot be empty",
        "any.required": "Department name is required",
      }),
      departmentCode: Joi.string().allow("").messages({
        "string.empty": "Department code cannot be empty",
      }),
   
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateGratuityCalculation = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      basicSalary: Joi.number().min(0).required().messages({
        'number.base': 'Basic salary must be a number.',
        'number.min': 'Basic salary must be a non-negative number.',
        'any.required': 'Basic salary is required.',
      }),
      fromDate: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'From date must be a valid date in ISO format',
          'date.required': 'From date is required',
        }),
      toDate: Joi.date()
        .iso()
        .required()
        .greater(Joi.ref('fromDate'))
        .messages({
          'date.base': 'To date must be a valid date in ISO format',
          'date.required': 'To date is required',
          'date.greater': 'To date must be greater than from date'
        }),
      userId: Joi.number()
        .optional(),
      userType: Joi.string()
        .optional()

    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateHolidayCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      title: Joi.string()
        .required()
        .messages({
          'string.base': 'Title must be a string',
          'string.empty': 'Title cannot be empty',
          'any.required': 'Title is required'
        }),
      isAllDay: Joi.boolean()
        .required()
        .messages({
          'boolean.base': 'isAllDay must be a boolean value',
          'any.required': 'isAllDay is required'
        }),
      start: Joi.date()
        .required()
        .messages({
          'date.base': 'Start date must be a valid date in ISO format',
          'date.empty': 'Start date cannot be empty',
          'any.required': 'Start date is required',
        }),
      end: Joi.date()
        .required()
        .messages({
          'date.base': 'End date must be a valid date in ISO format',
          'date.empty': 'End date cannot be empty',
          'any.required': 'End date is required',
        }),
      category: Joi.string()
        .required()
        .messages({
          'string.base': 'Category must be a string',
          'any.required': 'Category is required',
        }),
      sendPriorEmailDate:Joi.date()
        .required()
        .messages({
          'date.base': 'Holiday reminder date must be a valid date in ISO format',
          'date.empty': 'Holiday reminder date cannot be empty',
          'any.required': 'Holiday reminder date is required',
        }),
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateHolidaySendEmail = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateHolidayUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      title: Joi.string()
        .required()
        .messages({
          'string.base': 'Title must be a string',
          'string.empty': 'Title cannot be empty',
          'any.required': 'Title is required'
        }),
      isAllDay: Joi.boolean()
        .required()
        .messages({
          'boolean.base': 'isAllDay must be a boolean value',
          'any.required': 'isAllDay is required'
        }),
      start: Joi.alternatives().try(
        Joi.string(),
        Joi.number()
      ).required()
        .messages({
          'string.base': 'Start date must be a string in ISO date format',
          'string.empty': 'Start date cannot be empty',
          'number.base': 'Start date must be a valid timestamp',
          'any.required': 'Start date is required'
        }),
      end: Joi.date()
        .required()
        .messages({
          'date.base': 'End date must be a valid date in ISO format',
          'date.empty': 'End date cannot be empty',
          'any.required': 'End date is required'
        }),
      category: Joi.string()
        .required()
        .messages({
          'string.base': 'Category must be a string',
          'any.required': 'Category is required',
        }),
      sendPriorEmailDate: Joi.date()
        .required()
        .messages({
          'date.base': 'Holiday reminder date must be a valid date in ISO format',
          'date.empty': 'Holiday reminder date cannot be empty',
          'any.required': 'Holiday reminder date is required',
        }),
      holidayId: Joi.string()
        .required()
        .messages({
          'string.base': 'Holiday ID must be a string',
          'string.empty': 'Holiday ID cannot be empty',
          'any.required': 'Holiday ID is required'
        }),
      userId: Joi.number()
        .optional(),
      userType: Joi.string()
        .optional()
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateIncentiveCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      employeeId: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
        }),
      incentiveDate: Joi.string()
        .isoDate()
        .required()
        .messages({
          'string.base': 'Incentive date must be a string in ISO date format',
          'string.empty': 'Incentive date cannot be empty',
          'string.isoDate': 'Incentive date must be a valid date in ISO format',
          'any.required': 'Incentive date is required'
        }),
      monthlyTarget: Joi.number()
        .required()
        .messages({
          'number.base': 'Monthly target must be a number',
          'any.required': 'Monthly target is required'
        }),
      achievedTarget: Joi.number()
        .required()
        .messages({
          'number.base': 'Achieved target must be a number',
          'any.required': 'Achieved target is required'
        }),
      achievedSaleInPercent: Joi.string()
        .required()
        .messages({
          'any.required': 'Achieved sale in percent is required'
        }),
      amount: Joi.number().min(0)
        .required()
        .messages({
          'number.base': 'Amount must be a number',
          'number.min': 'Amount must be a non-negative number.',
          'any.required': 'Amount is required'
        }),
      userId: Joi.number()
        .optional(),
      userType: Joi.string()
        .optional()
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateIncentiveUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      id: Joi.string()
        .optional()
        .messages({
          'string.base': 'ID must be a string',
        }),
      employeeId: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
        }),
      incentiveDate: Joi.string()
        .isoDate()
        .required()
        .messages({
          'string.base': 'Incentive date must be a string in ISO date format',
          'string.empty': 'Incentive date cannot be empty',
          'string.isoDate': 'Incentive date must be a valid date in ISO format',
          'any.required': 'Incentive date is required'
        }),
      monthlyTarget: Joi.number()
        .required()
        .messages({
          'number.base': 'Monthly target must be a number',
          'any.required': 'Monthly target is required'
        }),
      achievedTarget: Joi.number()
        .required()
        .messages({
          'number.base': 'Achieved target must be a number',
          'any.required': 'Achieved target is required'
        }),
      achievedSaleInPercent: Joi.string()
        .required()
        .messages({
          'any.required': 'Achieved sale in percent is required'
        }),
      amount: Joi.number().min(0)
        .required()
        .messages({
          'number.base': 'Amount must be a number',
          'any.required': 'Amount is required',
          'number.min': 'Amount must be a non-negative number.',
        }),
      userId: Joi.number()
        .optional()
        .messages({
          'number.base': 'User ID must be a number',
        }),
      userType: Joi.string()
        .optional()
        .messages({
          'string.base': 'User type must be a string',
        })
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateIncrementCalculation = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      userId: Joi.number()
        .optional()
        .messages({
          'number.base': 'User ID must be a number',
          'any.required': 'User ID is required'
        }),
      userType: Joi.string()
        .optional()
        .messages({
          'string.base': 'User type must be a string',
          'any.required': 'User type is required',
        }),
      eId: Joi.string()
        .required()
        .messages({
          'string.base': 'Employee ID must be a string',
          'string.empty': 'Employee ID cannot be empty',
          'any.required': 'Employee ID is required'
        }),
      type: Joi.string()
        .valid('percentage', 'flat')
        .required()
        .messages({
          'string.base': 'Type must be a string',
          'any.required': 'Type is required',
          'any.only': 'Type must be either "percentage" or "flat"'
        }),
      incrementPercentage: Joi.when('type', {
        is: 'percentage',
        then: Joi.string()
          .required()
          .messages({
            'any.required': 'Increment percentage is required'
          }),
        otherwise: Joi.string().allow('').optional()
      }),
      incrementAmount: Joi.when('type', {
        is: 'flat',
        then: Joi.string()
          .required()
          .messages({
            'any.required': 'Increment amount is required'
          }),
        otherwise: Joi.string().allow('').optional()
      }),
      basicSalary: Joi.number().min(0)
        .required()
        .messages({
          'number.base': 'Basic salary must be a number',
          'any.required': 'Basic salary is required',
          'number.min': 'Basic salary must be a non-negative number.'
        }),
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateIncrementCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      userId: Joi.number()
        .optional()
        .messages({
          'number.base': 'User ID must be a number',
          'any.required': 'User ID is required'
        }),
      userType: Joi.string()
        .optional()
        .messages({
          'string.base': 'User type must be a string',
          'any.required': 'User type is required',
        }),
      employeeId: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
          'string.empty': 'Employee ID cannot be empty',
        }),
      basicSalary: Joi.number().min(0)
        .required()
        .messages({
          'number.base': 'Basic salary must be a number',
          'any.required': 'Basic salary is required',
          'number.min': 'Basic salary must be a non-negative number.',
        }),
      incrementType: Joi.string()
        .valid('percentage', 'flat')
        .required()
        .messages({
          'string.base': 'Increment type must be a string',
          'any.required': 'Increment type is required',
          'any.only': 'Increment type must be either "percentage" or "flat"'
        }),
      incrementPercentage: Joi.when("incrementType", {
        is: "percentage",
        then: Joi.number().positive().max(100).required().messages({
          "number.base": "Increment percentage must be a positive number",
          "number.max": "Increment percentage cannot exceed 100 percetage.",
          "any.required": "Increment percentage is required",
        }),
      }),
      incrementAmount: Joi.when('incrementType', {
        is: 'flat',
        then: Joi.number()
          .required()
          .messages({
            'number.base': 'Increment amount must be a number',
            'any.required': 'Increment amount is required'
          }),
        otherwise: Joi.number().allow('').optional()
      }),
      newBasicSalary: Joi.number()
        .required()
        .messages({
          'number.base': 'New basic salary must be a number',
          'any.required': 'New basic salary is required'
        }),
      effectiveDate: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'Effective date must be a valid date',
          'date.iso': 'Effective date must be in ISO format',
          'any.required': 'Effective date is required'
        }),
      attachment: Joi.alternatives()
        .try(
          Joi.object({
            base64: Joi.string()
              .messages({
                'string.base': 'Attachment must be a string',
              }),
            format: Joi.string()
              .valid('png', 'jpg', 'jpeg', 'pdf')
              .messages({
                'string.base': 'Attachment format must be a string',
                'any.only': 'Attachment format must be null or one of: png, jpg, jpeg, pdf'
              })
          }), Joi.string()
            .allow(null)
            .messages({
              'string.base': 'Attachment must be a string',
              'any.only': 'Attachment must be null or a string'
            })),
      attachmentFormat: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
          'string.empty': 'Employee ID cannot be empty',
        }),
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateIncrementUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      userId: Joi.number()
        .optional()
        .messages({
          'number.base': 'User ID must be a number',
          'any.required': 'User ID is required'
        }),
      userType: Joi.string()
        .optional()
        .messages({
          'string.base': 'User type must be a string',
          'any.required': 'User type is required',
        }),
      employeeId: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
          'string.empty': 'Employee ID cannot be empty',
          'any.required': 'Employee ID is required'
        }),
      basicSalary: Joi.number().min(0)
        .required()
        .messages({
          'number.base': 'Basic salary must be a number',
          'any.required': 'Basic salary is required',
          'number.min': 'Basic salary must be a non-negative number.',
        }),
      incrementType: Joi.string()
        .valid('percentage', 'flat')
        .required()
        .messages({
          'string.base': 'Increment type must be a string',
          'any.required': 'Increment type is required',
          'any.only': 'Increment type must be either "percentage" or "flat"'
        }),
      incrementPercentage: Joi.when('incrementType', {
        is: 'percentage',
        then: Joi.number()
          .required()
          .messages({
            'number.base': 'Increment percentage must be a number',
            'any.required': 'Increment percentage is required'
          }),
        otherwise: Joi.number().allow('').optional()
      }),
      incrementAmount: Joi.when('incrementType', {
        is: 'flat',
        then: Joi.number().min(0)
          .required()
          .messages({
            'number.base': 'Increment amount must be a number',
            'any.required': 'Increment amount is required',
            'number.min': 'Increment must be a non-negative number.',
          }),
        otherwise: Joi.number().allow('').optional()
      }),
      newBasicSalary: Joi.number().min(0)
        .required()
        .messages({
          'number.base': 'New basic salary must be a number',
          'any.required': 'New basic salary is required',
          'number.min': 'New basic salary must be a non-negative number.',
        }),
      incrementId: Joi.string()
        .optional()
        .messages({
          'number.base': 'New basic salary must be a number',
        }),
      effectiveDate: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'Effective date must be a valid date',
          'date.iso': 'Effective date must be in ISO format',
          'any.required': 'Effective date is required'
        }),
      id: Joi.string()
        .optional()
        .messages({
          'string.base': 'ID must be a string',
          'string.empty': 'ID cannot be empty',
        }),
      attachment: Joi.object({
        base64: Joi.string()
          .required()
          .messages({
            'string.base': 'Attachment must be a string',
            'string.empty': 'Attachment cannot be empty',
            'any.required': 'Attachment is required'
          }),
        format: Joi.string()
          .valid('png', 'jpg', 'jpeg', 'pdf')
          .required()
          .messages({
            'string.base': 'Attachment format must be a string',
            'string.empty': 'Attachment format cannot be empty',
            'any.required': 'Attachment format is required',
            'any.only': 'Attachment format must be one of: png, jpg, jpeg, pdf'
          })
      }).optional(),
      attachmentFormat: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
          'string.empty': 'Employee ID cannot be empty',
        }),
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateLeaveCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      userId: Joi.number()
        .optional()
        .messages({
          'number.base': 'User ID must be a number',
          'any.required': 'User ID is required'
        }),
      userType: Joi.string()
        .optional()
        .messages({
          'string.base': 'User type must be a string',
          'any.required': 'User type is required',
        }),
      halfDaySelection: Joi.string().allow("").allow(null).optional(),
      employeeId: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
          'string.empty': 'Employee ID cannot be empty',
          'any.required': 'Employee ID is required'
        }),
        employee: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
          'string.empty': 'Employee ID cannot be empty',
          'any.required': 'Employee ID is required'
        }),
      typeOfLeave: Joi.string()
        
        .required()
        .messages({
          'string.base': 'Type of leave must be a string',
          'any.required': 'Type of leave is required',
       
        }),
      leaveCount: Joi.number()
        .required()
        .messages({
          'number.base': 'Leave count must be a number',
          'any.required': 'Leave count is required'
        }),
      start: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'Start date must be a valid date',
          'date.iso': 'Start date must be in ISO format',
          'any.required': 'Start date is required'
        }),
      end: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'End date must be a valid date',
          'date.iso': 'End date must be in ISO format',
          'any.required': 'End date is required'
        }),
      leaveSupportingDocs: Joi.alternatives()
        .try(
          Joi.object({
            base64: Joi.string()
              .required()
              .messages({
                'string.base': 'Supporting document must be a string',
                'string.empty': 'Supporting document cannot be empty',
                'any.required': 'Supporting document is required'
              }),
            format: Joi.string()
              .valid('pdf', 'png', 'jpg', 'jpeg')
              .required()
              .messages({
                'string.base': 'Supporting document format must be a string',
                'string.empty': 'Supporting document format cannot be empty',
                'any.required': 'Supporting document format is required',
                'any.only': 'Supporting document format must be one of: pdf, png, jpg, jpeg'
              })
          }).required(), Joi.string()
            .required().allow(null)
            .messages({
              'any.required': 'Attachment is required',

            })),
      supportingDocFormat: Joi.string()
        .optional().allow('')
        .messages({
          'string.base': 'Employee ID must be a string',
          'any.required': 'Attachment Format is required',

        }),
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateLeaveUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      userId: Joi.number()
        .optional()
        .messages({
          'number.base': 'User ID must be a number',
          'any.required': 'User ID is required'
        }),
      userType: Joi.string()
        .optional()
        .messages({
          'string.base': 'User type must be a string',
          'any.required': 'User type is required',
        }),
      employeeId: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
          'string.empty': 'Employee ID cannot be empty',
        }),
      leaveId: Joi.string()
        .optional()
        .messages({
          'string.base': 'Leave ID must be a string',
          'string.empty': 'Leave ID cannot be empty',
        }),
      typeOfLeave: Joi.string()
        .valid(
          "UNPAID",
          "annualLeave",
          "sickLeave",
          "parentalLeave",
          "sabbaticalLeave",
          "studyLeave",
          "HajjAndUmrahLeave",
          "maternityLeave",
          "officialLeavesAndVacations",
          "otherPaidLeaves",
          "eligibilityTimePeriod")
        .required()
        .messages({
          'string.base': 'Type of leave must be a string',
          'any.required': 'Type of leave is required',
          'any.only': 'Type of leave must be one of: PAID, UNPAID, SICK, VACATION, OTHER'
        }),
      leaveCount: Joi.number()
        .required()
        .messages({
          'number.base': 'Leave count must be a number',
          'any.required': 'Leave count is required'
        }),
      start: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'Start date must be a valid date',
          'date.iso': 'Start date must be in ISO format',
          'any.required': 'Start date is required'
        }),
      end: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'End date must be a valid date',
          'date.iso': 'End date must be in ISO format',
          'any.required': 'End date is required'
        }),
      leaveSupportingDocs:
        Joi.alternatives()
          .try(
            Joi.object({
              base64: Joi.string()
                .required()
                .messages({
                  'string.base': 'Supporting document must be a string',
                  'string.empty': 'Supporting document cannot be empty',
                  'any.required': 'Supporting document is required'
                }),
              format: Joi.string()
                .valid('pdf', 'png', 'jpg', 'jpeg')
                .required()
                .messages({
                  'string.base': 'Supporting document format must be a string',
                  'string.empty': 'Supporting document format cannot be empty',
                  'any.required': 'Supporting document format is required',
                  'any.only': 'Supporting document format must be one of: pdf, png, jpg, jpeg'
                })
            }).required(), Joi.string()
              .required().allow('')
              .messages({
                'string.base': 'Supporting document must be a string',
                'string.empty': 'Supporting document cannot be empty',
                'any.required': 'Supporting document is required',

              })),
      supportingDocFormat: Joi.string().allow('')
        .required()
        .messages({
          'string.base': 'Supporting document format must be a string',
          'string.empty': 'Supporting document format cannot be empty',
          'any.required': 'Supporting document format is required',

        }),
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateOvertimeCalculation = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      userId: Joi.number()
        .optional()
        .messages({
          'number.base': 'User ID must be a number',
        }),
      userType: Joi.string()
        .optional()
        .messages({
          'string.base': 'User type must be a string',
        }),
      eId: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
          'string.empty': 'Employee ID cannot be empty',
        }),
      extraHours: Joi.alternatives()
        .try(
          Joi.string()
            .required()
            .messages({
              'string.base': 'Extra hours must be a string',
              'string.empty': 'Extra hours cannot be empty',
              'any.required': 'Extra hours is required'
            }),
          Joi.number()
            .required()
            .messages({
              'string.empty': 'Extra hours cannot be empty',
            })),
      overtimeRate: Joi.number()
        .required()
        .messages({
          'number.base': 'Overtime rate must be a number',
          'number.empty': 'Overtime rate cannot be empty',
          'any.required': 'Overtime rate is required'
        })
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateOvertimeCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      employeeId: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
          'string.empty': 'Employee ID cannot be empty',
        }),
      overTimeDate: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'Overtime date must be a valid date',
          'date.format': 'Overtime date must be in ISO 8601 format',
          'any.required': 'Overtime date is required'
        }),
      extraHours: Joi.alternatives()
        .try(
          Joi.number()
            .required()
            .messages({
              'number.base': 'Extra hours must be a number',
              'number.empty': 'Extra hours cannot be empty',
              'any.required': 'Extra hours is required'
            }),
          Joi.string()
            .required()
            .messages({
              'string.base': 'Extra hours must be a string',
              'string.empty': 'Extra hours cannot be empty',
              'any.required': 'Extra hours is required'
            })),
      overTimeRate: Joi.alternatives()
        .try(
          Joi.number()
            .required()
            .messages({
              'number.base': 'Overtime rate must be a number',
              'number.empty': 'Overtime rate cannot be empty',
              'any.required': 'Overtime rate is required'
            }),
          Joi.string()
            .required()
            .messages({
              'string.base': 'Overtime rate must be a string',
              'string.empty': 'Overtime rate cannot be empty',
              'any.required': 'Overtime rate is required'
            })),
      totalWorkingHours: Joi.number()
        .required()
        .messages({
          'number.base': 'Total working hours must be a number',
          'any.required': 'Total working hours is required'
        }),
      hourlyRate: Joi.alternatives()
        .try(
          Joi.number()
            .required()
            .messages({
              'number.base': 'Hourly rate must be a number',
              'number.empty': 'Hourly rate cannot be empty',
              'any.required': 'Hourly rate is required'
            }),
          Joi.string()
            .required()
            .messages({
              'string.base': 'Hourly rate must be a string',
              'string.empty': 'Hourly rate cannot be empty',
              'any.required': 'Hourly rate is required'
            })),
      overTimeAmount: Joi.number()
        .required()
        .messages({
          'number.base': 'Overtime amount must be a number',
          'any.required': 'Overtime amount is required'
        }),
      userId: Joi.number()
        .optional()
        .messages({
          'number.base': 'User ID must be a number',
        }),
      userType: Joi.string()
        .optional()
        .messages({
          'string.base': 'User type must be a string',
        })
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateOvertimeUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      employeeId: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
          'string.empty': 'Employee ID cannot be empty',
        }),
      overTimeDate: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'Overtime date must be a valid date',
          'date.format': 'Overtime date must be in ISO 8601 format',
          'any.required': 'Overtime date is required'
        }),
      extraHours: Joi.number()
        .required()
        .messages({
          'number.base': 'Extra hours must be a number',
          'any.required': 'Extra hours is required'
        }),
      overTimeRate: Joi.string()
        .required()
        .messages({
          'string.base': 'Overtime rate must be a string',
          'string.empty': 'Overtime rate cannot be empty',
          'any.required': 'Overtime rate is required'
        }),
      totalWorkingHours: Joi.number()
        .required()
        .messages({
          'number.base': 'Total working hours must be a number',
          'any.required': 'Total working hours is required'
        }),
      hourlyRate: Joi.string()
        .required()
        .messages({
          'string.base': 'Hourly rate must be a string',
          'string.empty': 'Hourly rate cannot be empty',
          'any.required': 'Hourly rate is required'
        }),
      overTimeAmount: Joi.number()
        .required().min(0)
        .messages({
          'number.base': 'Overtime amount must be a number',
          'any.required': 'Overtime amount is required',
          'number.min': 'Overtime amount must be a non-negative number.',
        }),
      overtimeId: Joi.string()
        .required()
        .messages({
          'string.base': 'Overtime ID must be a string',
          'string.empty': 'Overtime ID cannot be empty',
          'any.required': 'Overtime ID is required'
        }),
      userId: Joi.number()
        .optional()
        .messages({
          'number.base': 'User ID must be a number',
        }),
      userType: Joi.string()
        .optional()
        .messages({
          'string.base': 'User type must be a string',
          'any.required': 'User type is required'
        })
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateOvertimeRateUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      overTimeRate: Joi.string()
        .required()
        .messages({
          'string.base': 'Overtime rate must be a string',
          'string.empty': 'Overtime rate cannot be empty',
          'any.required': 'Overtime rate is required'
        }),
      notes: Joi.string()
        .optional()
        .allow('')
        .messages({
          'string.base': 'Notes must be a string',
        })
    });

    const result = payloadSchema.validate(req.body);
    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateReimbusementCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      employeeId: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
          'string.empty': 'Employee ID cannot be empty',
        }),
      expenseDate: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'Expense date must be a valid date',
          'date.format': 'Expense date must be in ISO 8601 format',
          'any.required': 'Expense date is required'
        }),
      // managerEmail: Joi.string()
      //   .email()
      //   .required()
      //   .messages({
      //     'string.base': 'Manager email must be a string',
      //     'string.empty': 'Manager email cannot be empty',
      //     'string.email': 'Manager email must be a valid email address',
      //     'any.required': 'Manager email is required'
      //   }),
      expenseDetails: Joi.string()
        .required()
        .messages({
          'string.base': 'Expense details must be a string',
          'string.empty': 'Expense details cannot be empty',
          'any.required': 'Expense details is required'
        }),
      totalPay: Joi.string().required().custom((value, helpers) => {
        if (value === "") {
          return helpers.error('string.empty');
        }
        const number = parseFloat(value);
        if (isNaN(number) || number < 0) {
          return helpers.error('any.invalid');
        }
        return value;
      }).messages({
        'string.base': 'Total pay must be a string.',
        'string.empty': 'Total pay cannot be empty.',
        'any.invalid': 'Total pay must be a non-negative number.',
        'any.required': 'Total pay is required.',
      }),
      supportingDocs: Joi.alternatives()
        .try(
          Joi.object({
            base64: Joi.string()
              .required()
              .messages({
                'string.base': 'Supporting document must be a string',
                'string.empty': 'Supporting document cannot be empty',
                'any.required': 'Supporting document is required'
              }),
            format: Joi.string()
              .required()
              .messages({
                'string.base': 'Supporting document format must be a string',
                'string.empty': 'Supporting document format cannot be empty',
                'any.required': 'Supporting document format is required'
              })
          }).required()
            .messages({
              'object.base': 'Supporting docs must be an object',
              'any.required': 'Supporting docs are required'
            }), Joi.string()
              .required()
              .allow(null)
              .messages({
                'string.base': 'Supporting document must be a string',
                'string.empty': 'Supporting document cannot be empty',
                'any.required': 'Supporting document is required'
              })),
      supportingDocFormat: Joi.string()
        .optional()
        .messages({
          'string.base': 'Supporting document format must be a string',
          'string.empty': 'Supporting document format cannot be empty',
        }),
      transferMethod: Joi.string()
        .required()
        .messages({
          'string.base': 'Transfer method must be a string',
          'any.required': 'Transfer method is required'
        }),
      userId: Joi.number()
        .optional()
        .messages({
          'number.base': 'User ID must be a number',
        }),
      userType: Joi.string()
        .optional()
        .messages({
          'string.base': 'User type must be a string',
        })
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateReimbusementUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      employeeId: Joi.string()
        .optional()
        .messages({
          'string.base': 'Employee ID must be a string',
          'string.empty': 'Employee ID cannot be empty',
        }),
      reimbursementId: Joi.string()
        .optional()
        .messages({
          'string.base': 'Reimbursement ID must be a string',
          'string.empty': 'Reimbursement ID cannot be empty',
        }),
      expenseDate: Joi.date()
        .iso()
        .required()
        .messages({
          'date.base': 'Expense date must be a valid date',
          'date.format': 'Expense date must be in ISO 8601 format',
          'any.required': 'Expense date is required'
        }),
      // managerEmail: Joi.string()
      //   .email()
      //   .required()
      //   .messages({
      //     'string.base': 'Manager email must be a string',
      //     'string.empty': 'Manager email cannot be empty',
      //     'string.email': 'Manager email must be a valid email address',
      //     'any.required': 'Manager email is required'
      //   }),
      expenseDetails: Joi.string()
        .required()
        .messages({
          'string.base': 'Expense details must be a string',
          'string.empty': 'Expense details cannot be empty',
          'any.required': 'Expense details is required'
        }),
      totalPay: Joi.string().required().custom((value, helpers) => {
        if (value === "") {
          return helpers.error('string.empty');
        }
        const number = parseFloat(value);
        if (isNaN(number) || number < 0) {
          return helpers.error('any.invalid');
        }
        return value;
      }).messages({
        'string.base': 'Total pay must be a string.',
        'string.empty': 'Total pay cannot be empty.',
        'any.invalid': 'Total pay must be a non-negative number.',
        'any.required': 'Total pay is required.',
      }),
      supportingDocs: Joi.alternatives()
        .try(
          Joi.object({
            base64: Joi.string()
              .required()
              .messages({
                'string.base': 'Supporting document must be a string',
                'string.empty': 'Supporting document cannot be empty',
                'any.required': 'Supporting document is required'
              }),
            format: Joi.string()
              .required()
              .messages({
                'string.base': 'Supporting document format must be a string',
                'string.empty': 'Supporting document format cannot be empty',
                'any.required': 'Supporting document format is required'
              })
          }).required()
            .messages({
              'object.base': 'Supporting docs must be an object',
              'any.required': 'Supporting docs are required'
            }), Joi.string()
              .required()
              .allow('')
              .messages({
                'string.base': 'Supporting document must be a string',
                'string.empty': 'Supporting document cannot be empty',
                'any.required': 'Supporting document is required'
              })),
      supportingDocFormat: Joi.string()
        .optional()
        .messages({
          'string.base': 'Supporting document format must be a string',
          'string.empty': 'Supporting document format cannot be empty',
        }),
      transferMethod: Joi.string()
        .optional()
        .messages({
          'string.base': 'Transfer method must be a string',
        }),
      userId: Joi.number()
        .optional()
        .messages({
          'number.base': 'User ID must be a number',
        }),
      userType: Joi.string()
        .optional()
        .messages({
          'string.base': 'User type must be a string',
        })
    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateCheckSalaryDetails = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({

      userId: Joi.number()
        .optional()
        .messages({
          'number.base': 'User ID must be a number',
        }),
      userType: Joi.string()
        .optional()
        .messages({
          'string.base': 'User type must be a string',
        }),
      date: Joi.date()
        .iso()
        .required()
        .messages({
          'string.base': 'Manager email must be a string',
          'string.empty': 'Manager email cannot be empty',
          'any.required': 'Manager email is required'
        }),
      employeeId: Joi.string()
        .required()
        .messages({
          'string.base': 'Manager email must be a string',
          'string.empty': 'Manager email cannot be empty',
          'any.required': 'Manager email is required'
        }),

    })
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateHrSettingsPayrollUpdate = (req, res, next) => {
  try {
    const signatureSchema = Joi.object({
      base64: Joi.string().required()
        .messages({
          'any.required': 'Signature base64 data is required.'
        }),
      format: Joi.string().valid('png').required()
        .messages({
          'any.required': 'Signature format is required.',
          'any.only': 'Signature format must be "png".'
        })
    });

    const companyStampSchema = Joi.object({
      base64: Joi.string().required()
        .messages({
          'any.required': 'Company official stamp base64 data is required.'
        }),
      format: Joi.string().valid('png').required()
        .messages({
          'any.required': 'Company official stamp is required.',
          'any.only': 'Company official stamp format must be "png".'
        })
    });

    const payrollSettingsSchema = Joi.object({
      organizationWorkingDays: Joi.number().required()
        .messages({
          'any.required': 'Organization working days is required.',
          'number.base': 'Organization working days must be a number.',
        }),
      salaryCycleDay: Joi.number().required()
        .messages({
          'any.required': 'Salary cycle day is required.',
          'number.base': 'Salary cycle day must be a number.',
        }),
      payrollStartsFrom: Joi.date().iso().required()
        .messages({
          'any.required': 'Payroll starts from date is required.',
          'date.isoDate': 'Payroll starts from date must be a valid ISO date.'
        }),
      selectedWeekdaysCount: Joi.array().items(
        Joi.number().integer().required()
      ).required()
        .messages({
          'array.base': 'Selected weekdays count must be an array.',
          'array.includesRequiredUnknowns': 'Selected weekdays count must include only integers.',
          'any.required': 'Selected weekdays count is required.'
        }),

    });

    const officialDocumentsSchema = Joi.object({
      hrManagerName: Joi.string().required()
        .messages({
          'any.required': 'HR manager name is required.'
        }),

      hrManagerSignature: Joi.alternatives()
        .try(
          signatureSchema.required()
            .messages({
              'any.required': 'HR manager signature is required.'
            }), Joi.string().allow(null).required()
              .messages({
                'any.required': 'HR manager signature is required.'
              })),
      companyOfficialStamp: Joi.alternatives()
        .try(companyStampSchema.required()
          .messages({
            'any.required': 'Company official stamp is required.'
          }), Joi.string().allow(null).required()
            .messages({
              'any.required': 'Company official stamp is required.'
            })),
      MOLNumber: Joi.string().optional().allow('')
        .messages({
          'any.required': 'MOL number is required.'
        }),
      establishmentId: Joi.string().optional().allow('')
        .messages({
          'any.required': 'Establishment ID is required.'
        }),
    });

    const payloadSchema = Joi.object({
      payrollSettings: payrollSettingsSchema.required()
        .messages({
          'any.required': 'Payroll settings is required.'
        }),
      officialDocuments: officialDocumentsSchema.required()
        .messages({
          'any.required': 'Official documents is required.'
        })
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateHrSettingsLeaveUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      leaveSettings: Joi.object({
        annualLeave: Joi.number().integer().required()
          .messages({
            'any.required': 'Annual leave is required.',
            'number.base': 'Annual leave must be a number.',
            'number.integer': 'Annual leave must be an integer.'
          }),
        sickLeave: Joi.number().integer().required()
          .messages({
            'any.required': 'Sick leave is required.',
            'number.base': 'Sick leave must be a number.',
            'number.integer': 'Sick leave must be an integer.'
          }),
        parentalLeave: Joi.number().integer().required()
          .messages({
            'any.required': 'Parental leave is required.',
            'number.base': 'Parental leave must be a number.',
            'number.integer': 'Parental leave must be an integer.'
          }),
        sabbaticalLeave: Joi.number().integer().required()
          .messages({
            'any.required': 'Sabbatical leave is required.',
            'number.base': 'Sabbatical leave must be a number.',
            'number.integer': 'Sabbatical leave must be an integer.'
          }),
        studyLeave: Joi.number().integer().required()
          .messages({
            'any.required': 'Study leave is required.',
            'number.base': 'Study leave must be a number.',
            'number.integer': 'Study leave must be an integer.'
          }),
        HajjAndUmrahLeave: Joi.number().integer().required()
          .messages({
            'any.required': 'Hajj and Umrah leave is required.',
            'number.base': 'Hajj and Umrah leave must be a number.',
            'number.integer': 'Hajj and Umrah leave must be an integer.'
          }),
        maternityLeave: Joi.number().integer().required()
          .messages({
            'any.required': 'Maternity leave is required.',
            'number.base': 'Maternity leave must be a number.',
            'number.integer': 'Maternity leave must be an integer.'
          }),
        officialLeavesAndVacations: Joi.number().integer().required()
          .messages({
            'any.required': 'Official leaves and vacations is required.',
            'number.base': 'Official leaves and vacations must be a number.',
            'number.integer': 'Official leaves and vacations must be an integer.'
          }),
        otherPaidLeaves: Joi.number().integer().required()
          .messages({
            'any.required': 'Other paid leaves is required.',
            'number.base': 'Other paid leaves must be a number.',
            'number.integer': 'Other paid leaves must be an integer.'
          }),
        eligibilityTimePeriod: Joi.number().integer().required()
          .messages({
            'any.required': 'Eligibility time period is required.',
            'number.base': 'Eligibility time period must be a number.',
            'number.integer': 'Eligibility time period must be an integer.'
          })
      }).required()
        .messages({
          'any.required': 'Leave settings is required.'
        }),
      userId: Joi.number().integer().optional()
        .messages({
          'number.base': 'User ID must be a number.',
          'number.integer': 'User ID must be an integer.'
        }),
      userType: Joi.string().optional()
        .messages({
          'any.only': 'User type must be "corporate".'
        })
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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

exports.validateApproveSalary = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      payingDate: Joi.date().required().messages({
        "date.base": "Paying date must be a valid date in ISO format",
        "any.required": "paying date is required",
      }),
      month: Joi.when("type", {
        is: "month",
        then: Joi.number().positive().required().messages({
          "number.base": "Month must be a positive number",
          "any.required": "Month is required",
        }),
      }),

      year: Joi.when("type", {
        is: "year",
        then: Joi.number().positive().required().messages({
          "number.base": "Year must be a positive number",
          "any.required": "Year is required",
        }),
      }),

      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
      sendPayslip: Joi.boolean().required()
        .messages({
          'boolean.base': 'SendPayslip must be a boolean value',
          'any.required': 'SendPayslip is required'
        }),
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

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


exports.validateMarkAsPaid = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      payingDate: Joi.date().required().messages({
        'date.base': 'Paying date must be a valid date in ISO format',
        'any.required': 'Paying date is required',
      }),
      month: Joi.number().integer().min(1).max(12).required().messages({
        'number.base': 'Month must be a number',
        'any.required': 'Month is required',
      }),
      year: Joi.number().integer().min(2000).required().messages({
        'number.base': 'Year must be a number',
        'any.required': 'Year is required',
      }),
      sendPayslip: Joi.boolean().optional(),
      userId: Joi.number().optional(),
      userType: Joi.string().optional(),
    });
    const result = payloadSchema.validate(req.body);
    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }
    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse('Something went wrong', 500));
  }
};

exports.validateMarkAsApproved = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      month: Joi.number().integer().min(1).max(12).required().messages({
        'number.base': 'Month must be a number',
        'any.required': 'Month is required',
      }),
      year: Joi.number().integer().min(2000).required().messages({
        'number.base': 'Year must be a number',
        'any.required': 'Year is required',
      }),
      userId: Joi.number().optional(),
      userType: Joi.string().optional(),
    });
    const result = payloadSchema.validate(req.body);
    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }
    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse('Something went wrong', 500));
  }
};

//new payroll design

exports.validateCompanyProfile = (req, res, next) => {
  try {
    const companyProfileSchema = Joi.object({
      companyProfile: Joi.object({
        companyName: Joi.string()
          .required()
          .messages({
            'string.base': 'Company Name must be a string',
            'any.required': 'Company Name is required'
          }),
        state: Joi.string()
          .required()
          .messages({
            'string.base': 'State must be a string',
            'any.required': 'State is required'
          }),
        contactNumber: Joi.string()
          .required()
          .messages({
            'string.base': 'Contact Number must be a string',
            'any.required': 'Contact Number is required'
          }),
        emailAddress: Joi.string()
          .email()
          .required()
          .messages({
            'string.base': 'Email Address must be a string',
            'string.email': 'Email Address must be a valid email',
            'any.required': 'Email Address is required'
          }),
        industry: Joi.string()
        .optional().allow(null).allow('')
          .messages({
            'string.base': 'Industry must be a string',
            'any.required': 'Industry is required'
          }),
        companyLogo: Joi.alternatives().allow("").try(
          Joi.string().uri().messages({
            'string.base': 'Company Logo must be a valid URL string'
          }),
          Joi.object({
            base64: Joi.string()
              .required()
              .messages({
                'string.base': 'Base64 must be a string',
                'any.required': 'Base64 is required'
              }),
            format: Joi.string()
              .valid('jpeg', 'png', 'gif')
              .required()
              .messages({
                'string.base': 'Format must be a string',
                'any.only': 'Format must be either "jpeg", "png", or "gif"',
                'any.required': 'Format is required'
              })
          }).messages({
            'object.base': 'Company Logo must be an object if provided as base64'
          })
        ).optional()
      }).required()
      .messages({
        'object.base': 'Company Profile must be an object',
        'any.required': 'Company Profile is required'
      }),

      organizationTaxDetails: Joi.object({
        PAN: Joi.string()
          .required()
          .messages({
            'string.base': 'PAN must be a string',
            'any.required': 'PAN is required'
          }),
        TAN: Joi.string()
          .required()
          .messages({
            'string.base': 'TAN must be a string',
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
            'string.base': 'Tax Payment Frequency must be a string',
            'any.only': 'Tax Payment Frequency must be either "MONTHLY", "QUARTERLY", or "ANNUALLY"',
            'any.required': 'Tax Payment Frequency is required'
          })
      }).required()
      .messages({
        'object.base': 'Organization Tax Details must be an object',
        'any.required': 'Organization Tax Details are required'
      })
    });

    // Validate the request body against the schema
    const result = companyProfileSchema.validate(req.body);

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

        companyAddressLine2: Joi.string().required().messages({
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
            'any.only': 'Invalid salary calculation type',
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

exports.validateOnboardingDocumentsUpdate = (req, res, next) => {
  try {
    const schema = Joi.object({
      onboardingDocuments: Joi.array().items(
        Joi.object({
          key: Joi.string().required(),
          required: Joi.boolean().required(),
        })
      ).min(1).required().messages({
        'array.min': 'onboardingDocuments must contain at least one entry.',
        'any.required': 'onboardingDocuments is required.',
      }),
    });

    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateGracePeriodUpdate = (req, res, next) => {
  try {
    const schema = Joi.object({
      gracePeriodMinutes: Joi.number().integer().min(0).max(1440).required().messages({
        'any.required': 'gracePeriodMinutes is required.',
        'number.base': 'gracePeriodMinutes must be a number.',
        'number.min': 'gracePeriodMinutes cannot be negative.',
        'number.max': 'gracePeriodMinutes cannot exceed 1440.',
      }),
    });

    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateCheckInOutUpdate = (req, res, next) => {
  try {
    const schema = Joi.object({
      checkInOutEnabled: Joi.boolean().required().messages({
        'any.required': 'checkInOutEnabled is required.',
      }),
    });

    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateWorkScheduleUpdate = (req, res, next) => {
  try {
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    const schema = Joi.object({
      checkInTime: Joi.string().pattern(timePattern).required().messages({
        'any.required': 'checkInTime is required.',
        'string.pattern.base': 'checkInTime must be in HH:mm format.',
      }),
      checkOutTime: Joi.string().pattern(timePattern).required().messages({
        'any.required': 'checkOutTime is required.',
        'string.pattern.base': 'checkOutTime must be in HH:mm format.',
      }),
    });

    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};


exports.validateTdsOverride = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      month: Joi.number().integer().min(1).max(12).required().messages({
        'number.base': 'Month must be a number',
        'any.required': 'Month is required',
      }),
      year: Joi.number().integer().min(2000).required().messages({
        'number.base': 'Year must be a number',
        'any.required': 'Year is required',
      }),
      amount: Joi.number().min(0).max(100000000).required().messages({
        'number.base': 'TDS amount must be a number',
        'number.min': 'TDS amount cannot be negative',
        'any.required': 'TDS amount is required',
      }),
      applyToFutureMonths: Joi.boolean().optional(),
      userId: Joi.number().optional(),
      userType: Joi.string().optional(),
    });
    const result = payloadSchema.validate(req.body);
    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }
    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse('Something went wrong', 500));
  }
};
