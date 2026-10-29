/* eslint-disable no-undef */
const Joi = require("joi");
const { customLog } = require('./loggerHelper');

const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const INDIAN_MOBILE_WITH_COUNTRY_CODE = /^(?:\+?91)?[6-9]\d{9}$/;
const EMAIL = /^[a-zA-Z0-9._'-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const FULL_NAME = /^(?=.*[a-zA-Z])[a-zA-Z .'-]+$/;
const COMPANY_NAME = /^(?=.*[A-Za-z0-9])[A-Za-z0-9&.'\- ]+$/;

exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string()
      .pattern(/^[a-zA-Z0-9\-_@.']+$/, { name: "valid characters" })
      .required()
      .messages({
        "string.empty": "Please enter Email ID or Account Number",
        "string.pattern.name": "Please enter valid Email ID or Account Number",
        "any.required": "Please enter Email ID or Account Number",
      }),
    password: Joi.string().required().messages({
      "string.empty": "Please enter Password",
      "any.required": "Please enter Password",
    }),
    partnerId: Joi.string().allow(null)
            .optional()
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false, // include all errors
    errors: { wrap: { label: "" } }, // remove quotes around labels
  });

  if (error) {
    const messages = error.details.map((detail) => {
      return `${detail.context.label} error: ${detail.message}`;
    });
    customLog(req?.LogTraceId, 'info', { message: 'Login validation errors', messages }, 'CONSOLE');
    return res.status(400).json({
      status: false,
      message: messages.join(", "),
      data: {},
      responseCode: "400",
    });
  }
  next();
};

const registerSchema = Joi.object({
  contactPersonName: Joi.string()
    .pattern(FULL_NAME, { name: "valid characters" })
    .min(3)
    .required()
    .messages({
      "string.empty": "Please enter full name",
      "string.pattern.name": "Please enter valid name",
      "string.min": "Name must be at least 3 characters",
      "any.required": "Please enter full name",
    }),
  countryCode: Joi.number().integer().valid(91).required().messages({
    "number.base": "Country Code must be a number",
    "any.only": "Country Code must be 91",
    "any.required": "Country Code is required",
  }),
  mobileNo: Joi.string()
    .pattern(INDIAN_MOBILE, { name: "valid mobile number" })
    .required()
    .messages({
      "string.empty": "Please enter mobile number",
      "string.pattern.name": "Please enter a valid 10-digit mobile number",
      "any.required": "Please enter mobile number",
    }),
  email: Joi.string()
    .email()
    .pattern(EMAIL, { name: "valid email" })
    .max(55)
    .required()
    .messages({
      "string.empty": "Please enter business email",
      "string.email": "Please enter valid business email",
      "string.pattern.name": "Please enter valid business email",
      "string.max": "Email must be at most 55 characters",
      "any.required": "Please enter business email",
    }),
  name: Joi.string()
    .pattern(COMPANY_NAME, { name: "valid characters" })
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.empty": "Please enter company name",
      "string.pattern.name": "Please enter valid company name",
      "string.min": "Company name must be at least 3 characters",
      "string.max": "Company name must be at most 50 characters",
      "any.required": "Please enter company name",
    })
    .when("signupType", {
      is: Joi.valid("NEW_COMPANY", "FREELANCER").required(),
      then: Joi.string().max(50).allow("", null).optional(),
    })
    .when("accountType", {
      is: Joi.valid("freelancer").required(),
      then: Joi.string().max(50).allow("", null).optional(),
    }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required",
  }),
  phoneOtp: Joi.when("scope", {
    is: Joi.valid("both", "mobile").required(),
    then: Joi.string().length(6).required().messages({
      "string.empty": "Phone OTP is required",
      "string.length": "Phone OTP must be 6 digits",
      "any.required": "Phone OTP is required",
    }),
    otherwise: Joi.string().length(6).allow("", null).optional(),
  }),
  emailOtp: Joi.when("scope", {
    is: Joi.valid("both", "email").required(),
    then: Joi.string().min(4).max(6).required().messages({
      "string.empty": "Email OTP is required",
      "string.min": "Email OTP must be at least 4 digits",
      "string.max": "Email OTP must be at most 6 digits",
      "any.required": "Email OTP is required",
    }),
    otherwise: Joi.string().min(4).max(6).allow("", null).optional(),
  }),
  scope: Joi.string().valid("both", "email", "mobile").required().messages({
    "any.only": 'Scope must be one of "both", "email", or "mobile"',
    "any.required": "Scope is required",
  }),
  registeredBy: Joi.string()
        .allow("", null)
        .optional(),
  state: Joi.string()
        .max(100)
        .allow("", null)
        .optional(),
  accountType: Joi.string()
        .valid("freelancer", "corporate")
        .allow("", null)
        .optional()
        .messages({
            'any.only': 'accountType must be one of freelancer or corporate',
        }),
  signupType: Joi.string()
        .valid("NEW_COMPANY", "EXISTING_COMPANY", "FREELANCER", "COMPLIANCE_HEALTH")
        .allow("", null)
        .optional()
        .messages({
            'any.only': 'signupType must be one of NEW_COMPANY, EXISTING_COMPANY, FREELANCER, COMPLIANCE_HEALTH',
        }),
  referralCode: Joi.string()
        .allow("", null)
        .optional()
        .pattern(/^[a-zA-Z0-9]*$/)
        .messages({
            'string.base': 'Referral code must be a string',
            'string.pattern.base': 'Referral code can only contain letters, numbers',
        }),

    policyIds: Joi.object()
        .pattern(
            Joi.string().pattern(/^\d+$/),
            Joi.boolean()
        )
        .optional()
        .messages({
            'object.base': 'policyIds must be an object',
        }),

    marketingConsent: Joi.boolean()
        .optional(),

});
const addCorporateSchema = Joi.object({
    contactPersonName: Joi.string()
        .pattern(/^[a-zA-Z ]+$/, { name: 'valid characters' })
        .min(3)
        .required()
        .messages({
            'string.empty': 'Please enter full name',
            'string.pattern.name': 'Please enter valid name',
            'string.min': 'Name must be at least 3 characters',
            'any.required': 'Please enter full name'
        }),
    countryCode: Joi.number()
        .integer()
        .required()
        .messages({
            'number.base': 'Country Code must be a number',
            'any.required': 'Country Code is required'
        }),
    mobileNo: Joi.string()
        .min(9)
        .required()
        .messages({
            'string.empty': 'Please enter mobile number',
            'string.min': 'Mobile number must be at least 9 digits',
            'any.required': 'Please enter mobile number'
        }),
    email: Joi.string()
        .email()
        .pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, { name: 'valid email' })
        .max(40)
        .required()
        .messages({
            'string.empty': 'Please enter business email',
            'string.email': 'Please enter valid business email',
            'string.pattern.name': 'Please enter valid business email',
            'string.max': 'Email must be at most 40 characters',
            'any.required': 'Please enter business email'
        }),
    name: Joi.string()
        .pattern(/^[a-zA-Z0-9 .&]+$/, { name: 'valid characters' })
        .min(3)
        .required()
        .messages({
            'string.empty': 'Please enter company name',
            'string.pattern.name': 'Please enter valid company name',
            'string.min': 'Company name must be at least 3 characters',
            'any.required': 'Please enter company name'
        }),
    registeredBy: Joi.string()
        .optional(),
    autoPasswordGeneration: Joi.boolean()
        .required()
        .messages({
            'boolean.base': 'autoPasswordGeneration must be a boolean',
        }),
    isAdminCreation: Joi.boolean()
        .required()
        .messages({
            'boolean.base': 'isAdminCreation must be a boolean',
        })
});

exports.validateRegister = (req, res, next) => {
  const { error } = registerSchema.validate(req.body, {
    abortEarly: false, // Include all errors
    errors: { wrap: { label: "" } }, // Remove quotes around labels
  });

  if (error) {
    const messages = error.details.map((detail) => {
      return `${detail.context.label} error: ${detail.message}`;
    });
    customLog(req?.LogTraceId, 'info', { message: 'Register validation errors', messages }, 'CONSOLE');
    return res.status(400).json({
      status: false,
      message: messages.join(", "),
      data: {},
      responseCode: "400",
    });
  }
  next();
};

exports.validateOtpRequest = (req, res, next) => {
  const schema = Joi.object({
    mobileNo: Joi.string()
      .pattern(INDIAN_MOBILE_WITH_COUNTRY_CODE, { name: "valid mobile number" })
      .required()
      .messages({
        "string.empty": "Please enter mobile number",
        "string.pattern.name": "Please enter a valid 10-digit mobile number",
        "any.required": "Please enter mobile number",
      }),
    password: Joi.string().allow("", null).optional(),
    partnerId: Joi.string().allow("", null).optional(),
    channel: Joi.string().valid("whatsapp").optional().messages({
      "any.only": 'Channel must be "whatsapp"',
    }),
    email: Joi.string()
      .email()
      .pattern(EMAIL, { name: "valid email" })
      .max(55)
      .required()
      .messages({
        "string.empty": "Please enter business email",
        "string.email": "Please enter valid business email",
        "string.pattern.name": "Please enter valid business email",
        "string.max": "Email must be at most 55 characters",
        "any.required": "Please enter business email",
      }),
    scope: Joi.string().valid("email", "mobile", "both").required().messages({
      "any.only": 'Scope must be one of "email", "mobile", or "both"',
      "any.required": "Scope is required",
    }),
    name: Joi.string().max(50).allow("", null).required().messages({
      "string.max": "Name must be at most 50 characters",
      "any.required": "Name is required",
    }),
    resend: Joi.boolean().required().messages({
      "boolean.base": "Resend must be a boolean value",
      "any.required": "Resend is required",
    }),
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false, // include all errors
    errors: { wrap: { label: "" } }, // remove quotes around labels
  });

  if (error) {
    const messages = error.details.map((detail) => {
      return `${detail.context.label} error: ${detail.message}`;
    });
    customLog(req?.LogTraceId, 'info', { message: 'OTP request validation errors', messages }, 'CONSOLE');
    return res.status(400).json({
      status: false,
      message: messages.join(", "),
      data: {},
      responseCode: "400",
    });
  }

  next();
};

exports.validateAddCorporate = (req, res, next) => {
    
    try{
    const { error } = addCorporateSchema.validate(req.body, {
        abortEarly: false,  // Include all errors
        errors: { wrap: { label: '' } }  // Remove quotes around labels
    });

    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            data: {},
            responseCode: '001'
        });
    }
    next();
}
catch (err) {
         customLog(req?.LogTraceId, "error", { message: "An error occurred", error: err });
        return res.status(400).json({
            status: false,
            message: 'Something went wrong',
            data: {},
            responseCode: '001',
        });
    }
};


exports.validateOTPRequest = (req, res, next) => {
  const schema = Joi.object({
    phoneOtp: Joi.when("scope", {
      is: "both",
      then: Joi.string().min(4).max(6).required().label("Phone OTP"),
      otherwise: Joi.optional(),
    }),
    emailOtp: Joi.string().min(4).max(6).required().label("Email OTP"),
    mobileNo: Joi.string()
      .pattern(INDIAN_MOBILE_WITH_COUNTRY_CODE, { name: "valid mobile number" })
      .required()
      .messages({
        "string.empty": "Please enter mobile number",
        "string.pattern.name": "Please enter a valid 10-digit mobile number",
        "any.required": "Please enter mobile number",
      }),
    email: Joi.string()
      .email()
      .pattern(EMAIL, { name: "valid email" })
      .max(55)
      .required()
      .messages({
        "string.empty": "Please enter business email",
        "string.email": "Please enter valid business email",
        "string.pattern.name": "Please enter valid business email",
        "string.max": "Email must be at most 55 characters",
        "any.required": "Please enter business email",
      }),
  });

  // Validate the request body against the schema
  const { error } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
    errors: { wrap: { label: "" } },
  });

  // If errors, return the first one found
  if (error) {
    const messages = error.details.map((detail) => {
      return `${detail.context.label} error: ${detail.message}`;
    });
    return res.status(400).json({
      status: false,
      message: messages.join(", "),
      data: {},
      responseCode: "400",
    });
  }

  next();
};

exports.validateEmailAndMobileInput = (req, res, next) => {
  const schema = Joi.object({
    mobileNo: Joi.string()
      .pattern(INDIAN_MOBILE, { name: "valid mobile number" })
      .required()
      .messages({
        "string.empty": "Please enter mobile number",
        "string.pattern.name": "Please enter a valid 10-digit mobile number",
        "any.required": "Please enter mobile number",
      }),
    email: Joi.string()
      .email()
      .pattern(EMAIL, { name: "valid email" })
      .max(55)
      .required()
      .messages({
        "string.empty": "Please enter business email",
        "string.email": "Please enter valid business email",
        "string.pattern.name": "Please enter valid business email",
        "string.max": "Email must be at most 55 characters",
        "any.required": "Please enter business email",
      }),
      registeredBy: Joi.string()
            .allow("", null)
            .optional(),
        referralCode: Joi.string()
            .allow("", null)
            .optional()
            .pattern(/^[a-zA-Z0-9]*$/)
            .messages({
                'string.base': 'Referral code must be a string',
                'string.pattern.base': 'Referral code can only contain letters, numbers',
            }),
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
    errors: { wrap: { label: "" } },
  });

  if (error) {
    const messages = error.details.map(
      (detail) => `${detail.context.label} error: ${detail.message}`
    );
    return res.status(400).json({
      status: false,
      message: messages.join(", "),
      data: {},
      responseCode: "400",
    });
  }

  next();
};

// exports.validateForgotPassword = (req, res, next) => {
//   const schema = Joi.object({
//     username: Joi.string()
//       .email()
//       .pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
//         name: "valid email",
//       })
//       .max(40)
//       .required()
//       .messages({
//         "string.empty": "Please enter email ID",
//         "string.email": "Please enter valid email ID",
//         "string.pattern.name": "Please enter valid email",
//         "string.max": "Email must be at most 40 characters",
//         "any.required": "Please enter email ID",
//       }),
//   });

//   const { error } = schema.validate(req.body, {
//     abortEarly: false, // Return all errors found
//     allowUnknown: true, // Allow other attributes in the object
//     stripUnknown: true, // Remove unknown keys
//   });

//   if (error) {
//     const messages = error.details.map((detail) => {
//       return `${detail.context.label} error: ${detail.message}`;
//     });
//     return res.status(400).json({
//       status: false,
//       message: messages.join(", "),
//       data: {},
//       responseCode: "400",
//     });
//   }
//   next();
// };





// exports.validateForgotPassword = (req, res, next) => {
//   const schema = Joi.object({
//     username: Joi.string()
//       .email()
//       .max(255) // Updated to allow longer email addresses
//       .required()
//       .messages({
//         "string.empty": "Please enter an email ID.",
//         "string.email": "Please enter a valid email ID.",
//         "string.max": "Email must be at most 255 characters.",
//         "any.required": "Email ID is required.",
//       }),
//   });

//   const { error } = schema.validate(req.body, {
//     abortEarly: false, // Return all errors
//     allowUnknown: false, // Disallow unknown fields for stricter validation
//     stripUnknown: false, // Do not strip unknown keys (depends on your API needs)
//   });

//   if (error) {
//     const messages = error.details.map((detail) => detail.message);
//     return res.status(400).json({
//       status: false,
//       message: messages.join(", "),
//       data: {},
//       responseCode: "400",
//     });
//   }

//   next();
// };




exports.validateForgotPassword = (req, res, next) => {
  const schema = Joi.object({
      username: Joi.string()
          .email()
          // .pattern(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,{name:'please enter a valid email id'})
          .max(55)
          .required()
          .messages({
              'string.empty': 'Please enter email ID',
              'string.email': 'Please enter valid email ID',
              'string.pattern.name': 'Please enter valid email',
              'string.max': 'Email must be at most 55 characters',
              'any.required': 'Please enter email ID'
          }),
          partnerId: Joi.alternatives()
          .try(Joi.string(), Joi.number())
          .optional()
          .messages({
              'string.base': 'partnerId must be a string',
              'number.base': 'partnerId must be a number'
          })
  });

  const {error} = schema.validate(req.body, {
      abortEarly: false, // Return all errors found
      allowUnknown: true, // Allow other attributes in the object
      stripUnknown: true // Remove unknown keys
  });

  if (error) {
      return res.status(400).json({
          status: false,
          message: error.details[0].message,
          data: {},
          responseCode: '001'
      });
  }
  next();
};
exports.validateForgotPasswordPost = (req, res, next) => {
  const schema = Joi.object({
    password: Joi.string().required(),
    token: Joi.string().required(),
    username: Joi.string().required(),
    isForgot: Joi.alternatives()
      .try(
        Joi.boolean().messages({
          "boolean.base": "isForgot must be a boolean value.",
          "any.required": "isForgot field is required.",
        }),
        Joi.string().valid("true", "false").messages({
          "any.only": 'isForgot must be either "true" or "false".',
          "any.required": "isForgot field is required.",
        })
      )
      .required(),
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false, // Return all errors found
    allowUnknown: true, // Allow other attributes in the object
    stripUnknown: true, // Remove unknown keys
  });

  if (error) {
    const messages = error.details.map((detail) => {
      return `${detail.context.label} error: ${detail.message}`;
    });
    return res.status(400).json({
      status: false,
      message: messages.join(", "),
      data: {},
      responseCode: "400",
    });
  }
  next();
};

exports.validatePasswordExpiryReset = (req, res, next) => {
  const schema = Joi.object({
    password: Joi.string().required(),
    newPassword: Joi.string().required(),
    username: Joi.string().required(),
  });
  const { error } = schema.validate(req.body, {
    abortEarly: false, // Return all errors found
    allowUnknown: true, // Allow other attributes in the object
    stripUnknown: true, // Remove unknown keys
  });

  if (error) {
    const messages = error.details.map((detail) => {
      return `${detail.context.label} error: ${detail.message}`;
    });
    return res.status(400).json({
      status: false,
      message: messages.join(", "),
      data: {},
      responseCode: "400",
    });
  }
  next();
};

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().label("Refresh Token"),
  oauth_refreshToken: Joi.string().optional().label("OAuth Refresh Token"),
  registeredBy: Joi.alternatives().try(Joi.string(), Joi.number()).optional().label("Registered By"),
  // Add other fields here if needed
});

exports.validateRefreshTokenRequest = (req, res, next) => {
  const { error } = refreshTokenSchema.validate(req.body, {
    abortEarly: false, // Include all errors
    errors: { wrap: { label: "" } }, // Remove quotes around labels
  });

  if (error) {
    const messages = error.details.map((detail) => detail.message);
    return res.status(400).json({
      status: false,
      message: messages.join(", "),
      data: {},
      responseCode: "400",
    });
  }

  next();
};

////////////////////validate ESS employee invite////////////////////////////////
exports.validateCreateEssUser = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().messages({
      "any.required": "Name is required.",
      "string.empty": "Name cannot be empty.",
    }),
    email: Joi.string().email().required().messages({
      "any.required": "Email is required.",
      "string.empty": "Email must not be empty.",
      "string.email": "Invalid email format.",
    }),
    mobileNo: Joi.string()
      .optional()
      .pattern(/^[0-9]{9,10}$/)
      .messages({
        "string.empty": "Mobile number must not be empty.",
        "string.pattern.base": "Mobile number must be at least 9 digits.",
      }),
    employeeId: Joi.string()
      .optional()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        "string.pattern.base": "Invalid employee reference.",
      }),
    baseUrl: Joi.string().optional().allow("", null),
  });

  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      data: {},
      responseCode: "001",
    });
  }

  // The sanitised body is what the controller sees. Keeping only `error` left stripUnknown doing nothing,
  // so a caller could name their own services — including Corporate Cards with role Admin — on an endpoint
  // whose job is a Payroll invite. Which services an invite grants is the server's to decide.
  req.body = value;

  next();
};

exports.validateUpdateEssEmail = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "any.required": "Email is required.",
      "string.empty": "Email must not be empty.",
      "string.email": "Invalid email format.",
    }),
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      data: {},
      responseCode: "001",
    });
  }

  next();
};

////////////////////validate userManagement////////////////////////////////
const { SUB_CORPORATE_ROLE_NAMES } = require("./subCorporateRoleNames");

// The Corporate Cards member invite. Separate from the sub-corporate one: here `role` IS an authorization
// input — corporateCard resolves 'Admin' to corporate-wide card authority — so it is an enum, and the mobile
// is required because the cardholder's KYC is filed against it.
exports.validateCreateCardMember = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().trim().max(50).required().messages({
      "any.required": "Name is required.",
      "string.empty": "Name cannot be empty.",
      "string.max": "Name cannot exceed 50 characters.",
    }),
    email: Joi.string().email().required().messages({
      "any.required": "Email is required.",
      "string.empty": "Email must not be empty.",
      "string.email": "Invalid email format.",
    }),
    mobileNo: Joi.string()
      .pattern(/^[6-9][0-9]{9}$/)
      .required()
      .messages({
        "any.required": "Mobile number is required.",
        "string.empty": "Mobile number must not be empty.",
        "string.pattern.base": "Enter a valid 10-digit mobile number.",
      }),
    role: Joi.string().trim().valid(...SUB_CORPORATE_ROLE_NAMES).required().messages({
      "any.required": "Role is required.",
      "string.empty": "Role cannot be empty.",
      "any.only": `Role must be one of: ${SUB_CORPORATE_ROLE_NAMES.join(", ")}.`,
    }),
    baseUrl: Joi.string().optional(),
  });

  const { error } = schema.validate(req.body, { abortEarly: true, allowUnknown: false });
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      data: {},
      responseCode: "001",
    });
  }
  return next();
};

exports.validateCreateSubCorporate = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required().messages({
      "any.required": "Name is required.",
      "string.empty": "Name cannot be empty.",
    }),
    email: Joi.string().email().required().messages({
      "any.required": "Email is required.",
      "string.empty": "Email must not be empty.",
      "string.email": "Invalid email format.",
    }),
    mobileNo: Joi.string()
      .optional()
      .pattern(/^[0-9]{9,10}$/)
      .messages({
        "string.empty": "Mobile number must not be empty.",
        "string.pattern.base": "Mobile number must be at least 9 digits.",
      }),
    // A job title. Corporate-cards authority is held on the employee row and set from the cards People
    // screen, so this is free text and carries no grant.
    role: Joi.string().trim().required().messages({
      "any.required": "Role is required.",
      "string.empty": "Role cannot be empty.",
    }),
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      data: {},
      responseCode: "001",
    });
  }

  next();
};

exports.validateChangeStatusSubCorporate = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid("ACTIVE", "INACTIVE", "PENDING")
      .optional()
      .messages({
        "any.only": "Status must be one of [ACTIVE, INACTIVE, PENDING].",
        "any.required": "Status is required.",
        "string.empty": "Status cannot be empty.",
      }),
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      data: {},
      responseCode: "001",
    });
  }

  next();
};
////////////////////WhatsApp Notification Validations////////////////////////////////
exports.validateWhatsAppNotificationPost = (req, res, next) => {
  const schema = Joi.object({
      whatsappNumber: Joi.string()
      .required()
      .min(10)
      .messages({
          "string.pattern.name": "Invalid whatsapp number",
          "string.min": "Whatsapp number must be at least 9 digits",
          "any.required": "Please enter the whatsapp number",
          "string.empty": "Whatsapp number cannot be empty",
      }),
      name: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
          "string.min": "Name must be at least 3 characters",
          "string.max": "Name cannot be more than 3 characters",
          "string.empty": "Name cannot be empty",
      }),
  });

  const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
  });

  if (error) {
      return res.status(400).json({
          status: false,
          message: error.details[0].message,
          data: {},
          responseCode: '001'
      });
  }

  next();
};

exports.validateWhatsAppNotificationPut = (req, res, next) => {
  const schema = Joi.object({
      currentNumber: Joi.string()
      .required()
      .min(10)
      .messages({
          "string.pattern.name": "Invalid whatsapp number",
          "string.min": "Whatsapp number must be at least 9 digits",
          "any.required": "Please enter the whatsapp number",
          "string.empty": "Whatsapp number cannot be empty",
      }),
      data: Joi.object({
          whatsappNumber: Joi.string()
          .required()
          .min(10)
          .messages({
              "string.pattern.name": "Invalid whatsapp number",
              "string.min": "Whatsapp number must be at least 9 digits",
              "any.required": "Please enter the whatsapp number",
              "string.empty": "Whatsapp number cannot be empty",
          }),
          name: Joi.string()
          .min(3)
          .max(50)
          .required()
          .messages({
              "string.min": "Name must be at least 3 characters",
              "string.max": "Name cannot be more than 3 characters",
              "string.empty": "Name cannot be empty",
          }),
      })
  });

  const { error } = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
  });

  if (error) {
      return res.status(400).json({
          status: false,
          message: error.details[0].message,
          data: {},
          responseCode: '001'
      });
  }

  next();
};

exports.validateAcceptPrivacyPolicy = (req, res, next) => {
    const schema = Joi.object({
        policyIds: Joi.object()
            .pattern(
                Joi.string().pattern(/^\d+$/),
                Joi.boolean()
            )
            .optional()
            .messages({
                'object.base': 'policyIds must be an object',
            }),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            responseCode: '001',
            data: {}
        });
    }

    next();
};

exports.validatePrivacyPolicyEnforcement = (req, res, next) => {
    const schema = Joi.object({
        partnerId: Joi.number().integer().positive().optional(),
    });

    const { error } = schema.validate(req.query);
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            responseCode: '001',
            data: {}
        });
    }

    next();
};


// ------------- OAUTH VALIDATION ------------------- //

exports.validateOAuthConsentRequest = (req, res, next) => {
  const schema = Joi.object({
    token: Joi.string().required().messages({
      "string.base": "token must be a string",
      "string.empty": "token must not be empty",
      "any.required": "token is required"
    }),
    user: Joi.object({
      id: Joi.number().required().messages({
        "number.base": "user.id must be a number",
        "any.required": "user.id is required"
      })
    }).required().messages({
      "object.base": "user must be an object",
      "any.required": "user is required"
    })
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      data: {},
      responseCode: "001"
    });
  }

  next();
};

exports.validateOAuthTokenRequest = (req, res, next) => {
  const commonMessages = {
    "string.base": "{{#label}} must be a string",
    "string.empty": "{{#label}} must not be empty",
    "any.required": "{{#label}} is required",
  };

  const schema = Joi.object({
    grant_type: Joi.string()
      .valid("authorization_code", "refresh_token")
      .required()
      .messages({
        ...commonMessages,
        "any.only": "grant_type must be either authorization_code or refresh_token",
      }),

    // Fields for authorization_code grant
    code: Joi.when("grant_type", {
      is: "authorization_code",
      then: Joi.string().required().messages(commonMessages),
      otherwise: Joi.string().optional(),
    }),

    code_verifier: Joi.when("grant_type", {
      is: "authorization_code",
      then: Joi.string().required().messages(commonMessages),
      otherwise: Joi.string().optional(),
    }),

    client_id: Joi.when("grant_type", {
      is: "authorization_code",
      then: Joi.string().required().messages(commonMessages),
      otherwise: Joi.string().optional(),
    }),

    redirect_uri: Joi.when("grant_type", {
      is: "authorization_code",
      then: Joi.string().uri().required().messages({
        ...commonMessages,
        "string.uri": "redirect_uri must be a valid URI",
      }),
      otherwise: Joi.string().optional(),
    }),

    // Fields for refresh_token grant
    refresh_token: Joi.when("grant_type", {
      is: "refresh_token",
      then: Joi.string().required().messages(commonMessages),
      otherwise: Joi.string().optional(),
    }),
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      data: {},
      responseCode: "001",
    });
  }

  next();
};

exports.validateAuthorizeRequest = (req, res, next) => {
  const schema = Joi.object({
    response_type: Joi.string().valid("code").required(),
    client_id: Joi.string().required().messages({
      "string.empty": "client_id must not be empty",
      "any.required": "client_id is required",
    }),
    redirect_uri: Joi.string().uri().required().messages({
      "string.empty": "redirect_uri must not be empty",
      "any.required": "redirect_uri is required",
      "string.uri": "redirect_uri must be a valid URI",
    }),
    scope: Joi.string().required().messages({
      "string.empty": "scope must not be empty",
      "any.required": "scope is required",
    }),
    state: Joi.string().optional(),
    code_challenge: Joi.string().required().messages({
      "string.empty": "code_challenge must not be empty",
      "any.required": "code_challenge is required",
    }),
    code_challenge_method: Joi.string()
      .valid("S256")
      .required()
      .messages({
        "any.only": "Only S256 is supported as code_challenge_method",
        "any.required": "code_challenge_method is required",
      }),
  });

  const { error } = schema.validate(req.query, {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details.map((d) => d.message).join(", "),
      data: {},
      responseCode: "001",
    });
  }

  next();
};