const Joi = require("joi");
const ErrorResponse = require("../../utils/error-response"); // Assuming you have this utility for error handling

exports.validateSalaryComponentCreate = (req, res, next) => {
  try {
    // Define the validation schema using Joi
    const payloadSchema = Joi.object({
      employee: Joi.string() .optional()
      .allow(null).allow("").messages({
        "string.base": "Employee ID must be a string or null",
      }),
      componentName: Joi.string().required().messages({
        "string.base": "Component name must be a string",
        "string.empty": "Component name cannot be empty",
        "any.required": "Component name is required",
      }),
      category: Joi.string()
        .valid("SALARY", "BONUS", "ALLOWANCE")
        .required()
        .messages({
          "string.base": "Category must be a string",
          "any.only": "Category must be one of SALARY, BONUS, or ALLOWANCE",
          "any.required": "Category is required",
        }),
        calculationType: Joi.string()
        .valid("FIXED", "PERCENTAGE")
        .required()
        .messages({
          "string.base": "Calculation type must be a string",
          "any.only": "Calculation type must be either FIXED or PERCENTAGE",
          "any.required": "Calculation type is required",
        }),
      
      // Conditional validation for amount when calculationType is 'FIXED'
      amount: Joi.when('calculationType', {
        is: 'FIXED',
        then: Joi.string()
          .required()
          .min(1)
          .messages({
            "number.base": "Amount must be a number",
            "any.required": "Amount is required when calculation type is FIXED",
            "number.min": "Amount must be greater than 0",
          }),
        otherwise: Joi.forbidden() // If calculationType is not 'FIXED', disallow this field
      }),
    
      // Conditional validation for percentage when calculationType is 'PERCENTAGE'
      percentage: Joi.when('calculationType', {
        is: 'PERCENTAGE',
        then: Joi.string()
          .required()
          .min(1)
          .max(100)
          .messages({
            "number.base": "Percentage must be a number",
            "any.required": "Percentage is required when calculation type is PERCENTAGE",
            "number.min": "Percentage must be greater than 0",
            "number.max": "Percentage must be less than or equal to 100",
          }),
        otherwise: Joi.forbidden() // If calculationType is not 'PERCENTAGE', disallow this field
      }),
      calculationBasis: Joi.when('calculationType', {
        is: 'PERCENTAGE',
        then: Joi.string()
        .optional()
          .min(1)
          .max(100)
          .messages({
            "number.base": "Percentage must be a number",
            "any.required": "Percentage is required when calculation type is PERCENTAGE",
            "number.min": "Percentage must be greater than 0",
            "number.max": "Percentage must be less than or equal to 100",
          }),
        otherwise: Joi.forbidden() // If calculationType is not 'PERCENTAGE', disallow this field
      }),
      calculationFrequency: Joi.string()
      .optional()
      .valid("MONTHLY", "YEARLY")
      .messages({
        "string.base": "Calculation basis must be a string",
        "any.only":
          "Calculation basis must be one of MONTHLY, or YEARLY",
      }),
      status: Joi.string().valid("ACTIVE", "INACTIVE").required().messages({
        "string.base": "Status must be a string",
        "any.only": "Status must be either ACTIVE or INACTIVE",
        "any.required": "Status is required",
      }),
      isGlobal: Joi.boolean().default(true).messages({
        "boolean.base": "isGlobal must be a boolean value",
      }),
    });

    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, return an error with the validation message
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }
    next();
  } catch (err) {
    console.error(err);
    return next(
      new ErrorResponse("Something went wrong during validation", 500)
    );
  }
};

exports.validateSalaryComponentUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      employee: Joi.string()
        .optional()
        .allow(null).allow("")
        .messages({
          "string.base": "Employee ID must be a string",
        }),
      componentName: Joi.string().optional().messages({
        "string.base": "Component name must be a string",
        "string.empty": "Component name cannot be empty",
      }),
      category: Joi.string()
        .optional()
        .valid("SALARY", "BONUS", "ALLOWANCE")
        .messages({
          "string.base": "Category must be a string",
          "any.only": "Category must be one of SALARY, BONUS, or ALLOWANCE",
        }),
        calculationType: Joi.string()
        .valid("FIXED", "PERCENTAGE")
        .optional()
        .messages({
          "string.base": "Calculation type must be a string",
          "any.only": "Calculation type must be either FIXED or PERCENTAGE",
          "any.required": "Calculation type is required",
        }),
      
      // Conditional validation for amount when calculationType is 'FIXED'
      amount: Joi.when('calculationType', {
        is: 'FIXED',
        then: Joi.string()
        .optional()
          .min(1)
          .messages({
            "number.base": "Amount must be a number",
            "any.required": "Amount is required when calculation type is FIXED",
            "number.min": "Amount must be greater than 0",
          }),
        otherwise: Joi.forbidden() // If calculationType is not 'FIXED', disallow this field
      }),
    
      // Conditional validation for percentage when calculationType is 'PERCENTAGE'
      percentage: Joi.when('calculationType', {
        is: 'PERCENTAGE',
        then:Joi.string()
        .optional()
          .min(1)
          .max(100)
          .messages({
            "number.base": "Percentage must be a number",
            "any.required": "Percentage is required when calculation type is PERCENTAGE",
            "number.min": "Percentage must be greater than 0",
            "number.max": "Percentage must be less than or equal to 100",
          }),
        otherwise: Joi.forbidden() // If calculationType is not 'PERCENTAGE', disallow this field
      }),
      calculationBasis: Joi.when('calculationType', {
        is: 'PERCENTAGE',
        then: Joi.string()
        .optional()
          .min(1)
          .max(100)
          .messages({
            "number.base": "Percentage must be a number",
            "any.required": "Percentage is required when calculation type is PERCENTAGE",
            "number.min": "Percentage must be greater than 0",
            "number.max": "Percentage must be less than or equal to 100",
          }),
        otherwise: Joi.forbidden() // If calculationType is not 'PERCENTAGE', disallow this field
      }),
      calculationFrequency: Joi.string()
        .optional()
        .valid("MONTHLY", "YEARLY")
        .messages({
          "string.base": "Calculation basis must be a string",
          "any.only":
            "Calculation basis must be one of MONTHLY, or YEARLY",
        }),
      status: Joi.string().optional().valid("ACTIVE", "INACTIVE").messages({
        "string.base": "Status must be a string",
        "any.only": "Status must be either ACTIVE or INACTIVE",
      }),
      isGlobal: Joi.boolean().optional().messages({
        "boolean.base": "isGlobal must be a boolean value",
      }),
      id: Joi.string().optional(),
    });

    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    // If validation passes, move to the next middleware or controller
    next();
  } catch (err) {
    console.error(err);
    return next(
      new ErrorResponse("Something went wrong during validation", 500)
    );
  }
};

exports.validateDeductionComponentCreate = (req, res, next) => {
  try {
    // Define the validation schema using Joi
    const payloadSchema = Joi.object({
      employee: Joi.string().optional().allow(null).messages({
        "string.base": "Employee ID must be a string or null",
      }),
      deductionName: Joi.string().required().messages({
        "string.base": "Deduction name must be a string",
        "string.empty": "Deduction name cannot be empty",
        "any.required": "Deduction name is required",
      }),
      deductionType: Joi.string().required().messages({
        "string.base": "Deduction type must be a string",
        "any.only": "Deduction type must be one of STATUTORY or NON_STATUTORY",
        "any.required": "Deduction type is required",
      }),
      calculationType: Joi.string()
      .valid("FIXED", "PERCENTAGE")
      .required()
      .messages({
        "string.base": "Calculation type must be a string",
        "any.only": "Calculation type must be either FIXED or PERCENTAGE",
        "any.required": "Calculation type is required",
      }),
    
    // Conditional validation for amount when calculationType is 'FIXED'
    amount: Joi.when('calculationType', {
      is: 'FIXED',
      then: Joi.number()
        .required()
        .min(1)
        .messages({
          "number.base": "Amount must be a number",
          "any.required": "Amount is required when calculation type is FIXED",
          "number.min": "Amount must be greater than 0",
        }),
      otherwise: Joi.forbidden() // If calculationType is not 'FIXED', disallow this field
    }),
  
    // Conditional validation for percentage when calculationType is 'PERCENTAGE'
    percentage: Joi.when('calculationType', {
      is: 'PERCENTAGE',
      then: Joi.number()
        .required()
        .min(1)
        .max(100)
        .messages({
          "number.base": "Percentage must be a number",
          "any.required": "Percentage is required when calculation type is PERCENTAGE",
          "number.min": "Percentage must be greater than 0",
          "number.max": "Percentage must be less than or equal to 100",
        }),
      otherwise: Joi.forbidden() // If calculationType is not 'PERCENTAGE', disallow this field
    }),
      calculationBasis: Joi.string()
        .valid("MONTHLY", "QUARTERLY", "YEARLY")
        .required()
        .messages({
          "string.base": "Calculation basis must be a string",
          "any.only":
            "Calculation basis must be one of MONTHLY, QUARTERLY, or YEARLY",
          "any.required": "Calculation basis is required",
        }),
      status: Joi.string().valid("ACTIVE", "INACTIVE").required().messages({
        "string.base": "Status must be a string",
        "any.only": "Status must be either ACTIVE or INACTIVE",
        "any.required": "Status is required",
      }),
      applicabilityCriteria: Joi.string().optional().allow(null).allow('').messages({
        "string.base": "Applicability criteria must be a string",
      }),
      isGlobal: Joi.boolean().default(true).messages({
        "boolean.base": "isGlobal must be a boolean value",
      }),
    });

    const result = payloadSchema.validate(req.body);

    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }
    next();
  } catch (err) {
    console.error(err);
    return next(
      new ErrorResponse("Something went wrong during validation", 500)
    );
  }
};

exports.validateDeductionComponentUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      employee: Joi.string()
        .optional()
        .allow(null) // Allow null for employee if it's a global component
        .messages({
          "string.base": "Employee ID must be a string",
        }),
      deductionName: Joi.string().optional().messages({
        "string.base": "Deduction name must be a string",
        "string.empty": "Deduction name cannot be empty",
      }),
      deductionType: Joi.string().optional().messages({
        "string.base": "Deduction type must be a string",
        "any.only": "Deduction type must be one of STATUTORY or NON_STATUTORY",
      }),
      calculationType: Joi.string()
        .valid("FIXED", "PERCENTAGE")
        .optional()
        .messages({
          "string.base": "Calculation type must be a string",
          "any.only": "Calculation type must be either FIXED or PERCENTAGE",
          "any.required": "Calculation type is required",
        }),
      
      // Conditional validation for amount when calculationType is 'FIXED'
      amount: Joi.when('calculationType', {
        is: 'FIXED',
        then: Joi.number()
        .optional()
          .min(1)
          .messages({
            "number.base": "Amount must be a number",
            "any.required": "Amount is required when calculation type is FIXED",
            "number.min": "Amount must be greater than 0",
          }),
        otherwise: Joi.forbidden() // If calculationType is not 'FIXED', disallow this field
      }),
    
      // Conditional validation for percentage when calculationType is 'PERCENTAGE'
      percentage: Joi.when('calculationType', {
        is: 'PERCENTAGE',
        then: Joi.number()
        .optional()
          .min(1)
          .max(100)
          .messages({
            "number.base": "Percentage must be a number",
            "any.required": "Percentage is required when calculation type is PERCENTAGE",
            "number.min": "Percentage must be greater than 0",
            "number.max": "Percentage must be less than or equal to 100",
          }),
        otherwise: Joi.forbidden() // If calculationType is not 'PERCENTAGE', disallow this field
      }),
      calculationBasis: Joi.string()
        .optional()
        .valid("MONTHLY", "QUARTERLY", "YEARLY")
        .messages({
          "string.base": "Calculation basis must be a string",
          "any.only":
            "Calculation basis must be one of MONTHLY, QUARTERLY, or YEARLY",
        }),
      status: Joi.string().optional().valid("ACTIVE", "INACTIVE").messages({
        "string.base": "Status must be a string",
        "any.only": "Status must be either ACTIVE or INACTIVE",
      }),
      applicabilityCriteria: Joi.string().optional().allow(null).allow('').messages({
        "string.base": "Applicability criteria must be a string",
      }),
      isGlobal: Joi.boolean().optional().messages({
        "boolean.base": "isGlobal must be a boolean value",
      }),
      id: Joi.string().optional(),
    });

    const result = payloadSchema.validate(req.body);

    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(
      new ErrorResponse("Something went wrong during validation", 500)
    );
  }
};
exports.validateLeaveComponentCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      leaveType: Joi.string().required().messages({
        "string.base": "Leave Type must be a string",
        "string.empty": "Leave Type cannot be empty",
        "any.required": "Leave Type is required",
      }),
      accrualType: Joi.string().valid("ACCRUAL", "FIXED","MONTHLY","DAILY",'YEARLY').required().messages({
        "string.base": "Accrual Type must be a string",
        "any.only": 'Accrual Type must be either "ACCRUAL", "FIXED", "MONTHLY", "DAILY", or "YEARLY"',
        "any.required": "Accrual Type is required",
      }),
      accrualRate: Joi.when('accrualType', {
        is: 'ACCRUAL',
        then: Joi.string().required().messages({
          "string.base": "Accrual Rate must be a string",
          "any.required": "Accrual Rate is required when Accrual Type is ACCRUAL",
        }),
        otherwise: Joi.optional().allow(null).messages({
          "string.base": "Accrual Rate must be a string",
        }),
      }),
      maximumAccrual: Joi.when('accrualType', {
        is: 'ACCRUAL',
        then: Joi.string().required().messages({
          "string.base": "Maximum Accrual must be a string",
          "any.required": "Maximum Accrual is required when Accrual Type is ACCRUAL",
        }),
        otherwise: Joi.optional().allow(null).messages({
          "string.base": "Maximum Accrual must be a string",
        }),
      }),
      leaveBalanceCarryover: Joi.string()
        .valid("ALLOWED", "NOT_ALLOWED")
        .required()
        .messages({
          "string.base": "Leave Balance Carryover must be a string",
          "any.only":
            'Leave Balance Carryover must be either "ALLOWED" or "NOT ALLOWED"',
          "any.required": "Leave Balance Carryover is required",
        }),
      maximumNumberOfLeaves: Joi.number().required().messages({
        "number.base": "Maximum Number of Leaves must be a number",
        "any.required": "Maximum Number of Leaves is required",
      }),
      isGlobal: Joi.boolean().optional().messages({
        "boolean.base": "isGlobal must be a boolean",
      }),
      applicableGender: Joi.string().valid("MALE", "FEMALE", "ALL").optional().messages({
        "string.base": "Applicable Gender must be a string",
        "any.only": 'Applicable Gender must be "MALE", "FEMALE", or "ALL"',
      }),
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
exports.validateLeaveComponentUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      leaveType: Joi.string().optional().messages({
        "string.base": "Leave Type must be a string",
        "string.empty": "Leave Type cannot be empty",
      }),
      accrualType: Joi.string().valid("MONTHLY", "FIXED",'YEARLY','DAILY').optional().messages({
        "string.base": "Accrual Type must be a string",
        "any.only": 'Accrual Type must be either "MONTHLY","YEARLY","DAILY" or "FIXED"',
      }),
        accrualRate: Joi.when('accrualType', {
        is: 'ACCRUAL',
        then: Joi.string().required().messages({
          "string.base": "Accrual Rate must be a string",
          "any.required": "Accrual Rate is required when Accrual Type is ACCRUAL",
        }),
        otherwise: Joi.optional().allow(null).messages({
          "string.base": "Accrual Rate must be a string",
        }),
      }),
      maximumAccrual: Joi.string()
        .optional()
        .allow(null) // Allowing null for this field
        .messages({
          "number.base": "Maximum Accrual must be a number",
        }),
      leaveBalanceCarryover: Joi.string()
        .valid("ALLOWED", "NOT_ALLOWED")
        .optional()
        .messages({
          "string.base": "Leave Balance Carryover must be a string",
          "any.only":
            'Leave Balance Carryover must be either "ALLOWED" or "NOT ALLOWED"',
        }),
      maximumNumberOfLeaves: Joi.number().optional().messages({
        "number.base": "Maximum Number of Leaves must be a number",
      }),
      id: Joi.string().optional(),
      employeeId: Joi.string().optional().messages({
        "string.base": "Employee ID must be a string",
    }),
    globalComponentId:Joi.string().optional().messages({
      "string.base": "Global component ID must be a string",
  }),
    applicableGender: Joi.string().valid("MALE", "FEMALE", "ALL").optional().messages({
      "string.base": "Applicable Gender must be a string",
      "any.only": 'Applicable Gender must be "MALE", "FEMALE", or "ALL"',
    }),
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
