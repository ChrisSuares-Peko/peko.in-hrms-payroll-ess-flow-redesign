/* eslint-disable no-undef */
const Joi = require('joi')
const ErrorResponse = require('./error-response')
const { isProtectedSetting, PROTECTED_SETTING_MESSAGE } = require('./protectedSettings')
////////////////////Adding System User////////////////////////////////

const fileSizeValidation = (maxFileSize) => {
  return (value, helpers) => {
    // Convert KB to Bytes
    const maxFileSizeInBytes = maxFileSize * 1024;
    // Remove the base64 header if present
    const base64Str = value.split(';base64,').pop();

    // Calculate the size of the base64 string
    const buffer = Buffer.from(base64Str, 'base64');
    const fileSizeInBytes = buffer.length;

    if (fileSizeInBytes > maxFileSizeInBytes) {
      return helpers.message(`File size must be smaller than  ${maxFileSize % 1024 === 0 ? `${maxFileSize / 1024} MB` : `${maxFileSize} KB`}`);
    }

    return value;
  };
};
exports.validateIsActiveStatus = (req, res, next) => {
  try {
    const schema = Joi.object({
      isActive: Joi.boolean().required().messages({
        'boolean.base': 'status must be a boolean.',
        'any.required': 'status is required.',
      }),
      userId: Joi.number().optional().messages({
        'number.base': 'User ID must be a number',
      }),
      userType: Joi.string().optional(),
    })
    const result = schema.validate(req.body)
    if (result.error) {
      throw new Error(result.error.details[0].message)
    }
    next()
  } catch (err) {
    err.code ? console.log(`🚀 ~Error:${err.message}`) : console.log(err)
    next(err)
  }
}

exports.validateSystemUser = (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required().messages({
        'any.required': 'Name is required.',
        'string.empty': 'Name must not be empty.',
      }),
      username: Joi.string().required().messages({
        'any.required': 'Username is required.',
        'string.empty': 'Username must not be empty.',
      }),
      email: Joi.string().email().required().messages({
        'any.required': 'Email is required.',
        'string.empty': 'Email must not be empty.',
        'string.email': 'Invalid email format.',
      }),
      mobileNo: Joi.string()
        .optional()
        .allow('')
        .pattern(/^\d{10}$/)
        .messages({
          'string.pattern.base': 'Mobile number must be 10 digits.',
        }),
      registeredBy: Joi.number().optional().allow('').messages({
        'number.base': 'Registered by must be a number.',
      }),
      roleAndPermissionId: Joi.number().required().messages({
        'any.required': 'Role and permission ID is required.',
        'number.base': 'Role and permission ID must be a number.',
      }),
      portalUrl: Joi.string().optional().allow('').messages({
        'string.uri': 'Portal URL must be a valid URL.',
      }),
      userId: Joi.number().optional().messages({
        'number.base': 'User ID must be a number',
      }),
      partnerId: Joi.number().optional().allow('', null).messages({
        'number.base': 'partner ID by must be a number.',
      }),
      userType: Joi.string().optional(),
      passwordProtection: Joi.boolean().optional().messages(),
    })
    const result = schema.validate(req.body)
    if (result.error) {
      throw new Error(result.error.details[0].message)
    }
    next()
  } catch (err) {
    err.code ? console.log(`🚀 ~Error:${err.message}`) : console.log(err)
    next(err)
  }
}

////////////////////Adding Corporate  User////////////////////////////////
exports.validateUpdateCorporate = (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required().messages({
        "any.required": "Name is required.",
        "string.empty": "Name must not be empty.",
      }),
      contactPersonName: Joi.string().required().messages({
        "any.required": "Contact person name is required.",
        "string.empty": "Contact person name must not be empty.",
      }),
      activity: Joi.string().optional().allow("").messages({
        "string.empty": "Activity must not be empty.",
      }),
      city: Joi.string().optional().allow("").messages({
        "string.empty": "City must not be empty.",
      }),
      state: Joi.string().optional().allow("").messages({
        "string.empty": "State must not be empty.",
      }),
      email: Joi.string().email().required().messages({
        "any.required": "Email is required.",
        "string.empty": "Email must not be empty.",
        "string.email": "Invalid email format.",
      }),
      kycStatus: Joi.string().required().messages({
        "any.required": "KYC status is required.",
        "string.empty": "KYC status must not be empty.",
      }),
      designation: Joi.string().allow("").optional(),
      cinNumber: Joi.string().allow('', null).optional(),
      panNumber: Joi.string().allow('', null).optional(),
      tradeLicenseExpiry: Joi.string().allow(null, '').optional(),
      gstNumber: Joi.string().allow('').optional(),
      trnExpiry: Joi.string().allow(null, '').optional(),
      mobileNo: Joi.string()
        .pattern(/^\d{9,10}$/)
        .required()
        .messages({
          "any.required": "Mobile number is required.",
          "string.empty": "Mobile number must not be empty.",
          "string.pattern.base": "Mobile number must be least 9 digits.",
        }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
      passwordProtection: Joi.alternatives().try(
        Joi.boolean(),
        Joi.number().valid(0, 1)
      ).required().messages({
        "any.required": "Password protection is required.",
        "alternatives.types": "Password protection must be a boolean.",
      })
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

////////////////////Adding Notification////////////////////////////////
exports.validateAddingNotification = (req, res, next) => {
  try {
    const schema = Joi.object({
      notificationTitle: Joi.string().min(3).max(150).required(),
      notificationBrief: Joi.string().min(3).max(250).required(),
      notificationCategory: Joi.string().required(),
      notificationTo: Joi.string().required(),
      notificationBy: Joi.string().optional(),
      _csrf: Joi.string().optional()
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 400,
        status: 'error',
        errors: [result.error.details[0].message]
      });
    }
    next()
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err)
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message]
    })
  }
}

////////////////////Updating Notification////////////////////////////////
exports.validateUpdatingNotification = (req, res, next) => {
  try {
    const schema = Joi.object({
      notificationTitle: Joi.string().min(3).optional(),
      notificationBrief: Joi.string().min(3).optional(),
      notificationCategory: Joi.string().optional(),
      notificationTo: Joi.string().optional(),
      notificationBy: Joi.string().optional(),
      _csrf: Joi.string().optional()
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 400,
        status: 'error',
        errors: [result.error.details[0].message]
      });
    }
    next()
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err)
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message]
    })
  }
}

exports.validateSupportTicket = (req, res, next) => {
  try {
    let schema = Joi.object({



      screenshot: Joi.alternatives().try(Joi.string().allow("", null), Joi.string().uri(), Joi.string().base64()).messages({
        "string.empty": "screenshot cannot be empty",
        "string.uri": "screenshot must be a valid URI",
        "string.base64": "screenshot must be a base64 encoded string",
      }),
      screenshotImageFormat: Joi.allow(null, "").optional(),
      screenshotImage: Joi.allow(null, "").optional(),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
    });

    if (req.method === "POST") {
      schema = schema.keys({
        issueType: Joi.string().required().messages({
          "any.required": "Issue type is required.",
          "string.empty": "Issue type cannot be empty.",
        }),
        description: Joi.string().required().min(3).messages({
          "any.required": "Description is required.",
          "string.empty": "Description cannot be empty.",
          "string.min": "Description must be at least 3 characters long.",
        }),
        module: Joi.string().required().messages({
          "any.required": "Module is required.",
          "string.empty": "Module cannot be empty.",
        }),
        corporateUserId: Joi.number().optional().messages({
          "number.base": "User ID must be a number",
        }),
      });
    }
    if (req.method === "PUT") {
      schema = schema.keys({
        issueType: Joi.string().optional().messages({
          "string.empty": "Issue type cannot be empty.",
        }),
        module: Joi.string().optional().messages({
          "string.empty": "Module cannot be empty.",
        }),
        attachmentId: Joi.alternatives()
          .try(Joi.number().integer().positive(), Joi.allow(null))
          .messages({
            'number.base': 'attachmentId must be a number',
            'number.integer': 'attachmentId must be an integer',
            'number.positive': 'attachmentId must be a positive number',
            'any.allow': 'attachmentId can be null',
          }),
      });
    }

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

exports.validateSupportMessage = (req, res, next) => {
  try {
    const schema = Joi.object({
      id: Joi.number().required().messages({
        "any.required": "Ticket ID is required.",
        "number.base": "Ticket ID must be a number.",
      }),

      body: Joi.string().required().messages({
        "any.required": "Body is required.",
        "string.empty": "Body cannot be empty.",
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

exports.validateUpdateChatId = (req, res, next) => {
  try {
    const schema = Joi.object({
      restoreId: Joi.string().required().messages({
        "any.required": "Restore ID is required.",
        "string.empty": "Restore ID cannot be empty.",
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


exports.validateTicketStatus = (req, res, next) => {
  try {
    const schema = Joi.object({
      chatId: Joi.number().optional().messages({
        "number.base": "Chat ID must be a number",
      }),
      status: Joi.string().valid('PENDING', 'RESOLVED', 'REJECTED').optional().messages({
        "any.required": "Status is required.",
        "string.empty": "Status cannot be empty.",
      }),
      isClosed: Joi.boolean().optional().messages({
        "boolean.base": "IsClosed must be a boolean value.",
      })
    })

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
////////////////////Adding Service Operators////////////////////////////////
exports.validateServiceOperator = (req, res, next) => {
  try {
    const fileUploadMaxSize= 500 //500 kb
    const schema = Joi.object({
      serviceProvider: Joi.string().required().messages({
        "any.required": "Service Provider is required.",
        "string.empty": "Service Provider cannot be empty.",
      }),
      accessKey: Joi.string().required().messages({
        "any.required": "Access Key is required.",
        "string.empty": "Access Key cannot be empty.",
      }),
      serviceCategory: Joi.string().required().messages({
        "any.required": "Service Category is required.",
        "string.empty": "Service Category cannot be empty.",
      }),
      commissionType: Joi.string().valid("PERCENTAGE", "FLAT").optional().messages({
        "any.only": 'Commission Type must be either "PERCENTAGE" or "FLAT".',
      }),
      providerCommission: Joi.number().optional().messages({
        "number.base": "Provider Commission must be a number.",
      }),
      vendorId: Joi.number().required().messages({
        "any.required": "Vendor ID is required.",
        "number.base": "Vendor ID must be a number.",
      }),
      balanceMethod: Joi.boolean().optional().messages({
        "boolean.base": "Balance Method must be a boolean value.",
      }),
      serviceType: Joi.number().required().messages({
        "any.required": "Service Type is required.",
        "number.base": "Service Type must be a number.",
      }),
      serviceImage: Joi.alternatives().optional().try(Joi.string().base64().optional(), Joi.string().uri().optional()).custom(fileSizeValidation(fileUploadMaxSize)).optional().messages({
        "string.base64": "Service Image must be in base64 format.",
        "string.uri": "Service Image must be a valid URL.",
      }),
      imageFormat: Joi.string().valid("png", "jpg", "jpeg").optional().messages({
        "any.only": 'Image Format must be either "png", "jpg", or "jpeg".',
      }),
      paymentclientid: Joi.string().optional().allow("").messages({
        "string.base": "Payment client id must be a string.",
      }),
      paymentclientsecret: Joi.string().optional().allow("").messages({
        "string.base": "Payment client secret must be a string.",
      }),
      isDynamicUnitPricing: Joi.boolean().required().messages({
        "any.required": "Dynamic unit pricing is required.",
        "boolean.base": "Dynamic unit pricing must be a boolean value.",
      }),
      commissionMode: Joi.string().valid('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP').optional(),
      fixedCommissionPerTransaction: Joi.number().optional().messages({
        "number.base": "Fixed Commission Per Transaction must be a number.",
      }),
      isCommissionInclGST: Joi.boolean().optional().messages({
        "boolean.base": "Commission Include GST must be a boolean value.",
      }),
      recordJournalEntry: Joi.boolean().optional().messages({
        "boolean.base": "Record Journal Entry must be a boolean value.",
      }),
      oidcDetails: Joi.object({
        active: Joi.boolean().allow(null).optional(),
        client_id: Joi.string().allow(null).optional(),
        client_secret: Joi.string().allow(null).optional(),
        client_name: Joi.string().allow(null).optional(),
        logo: Joi.string().allow(null).optional(),
        logo_uri: Joi.string().allow(null).optional(),
        logoFormat: Joi.string().allow(null).optional(),
        redirect_uris: Joi.array().items(Joi.string().uri()).allow(null).optional(),
      }).optional(),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
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

exports.validateServiceOperatorStatus = (req, res, next) => {
  try {
    const schema = Joi.object({
      serviceStatus: Joi.boolean().required(),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
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
}

exports.validateMobileRechargeProvider = (req, res, next) => {
  try {
    const schema = Joi.object({
      providerName: Joi.string().required().messages({
        "any.required": "Provider Name is required.",
        "string.empty": "Provider Name cannot be empty.",
      }),
      displayName: Joi.string().required().messages({
        "any.required": "Display Name is required.",
        "string.empty": "Display Name cannot be empty.",
      }),
      commissionMode: Joi.string().valid("MARGIN", "AGENT_MARKUP", "PRINCIPAL_MARKUP").required().messages({
        "any.required": "Commission Mode is required.",
        "any.only": 'Commission Mode must be one of "MARGIN", "AGENT_MARKUP", or "PRINCIPAL_MARKUP".',
      }),
      commissionType: Joi.string().valid("PERCENTAGE", "FLAT").required().messages({
        "any.required": "Commission Type is required.",
        "any.only": 'Commission Type must be either "PERCENTAGE" or "FLAT".',
      }),
      commission: Joi.number().required().messages({
        "any.required": "Commission is required.",
        "number.base": "Commission must be a number.",
      }),
      fixedCommissionPerTransaction: Joi.number().allow(null).optional().messages({
        "number.base": "Fixed Commission Per Transaction must be a number.",
      }),
      isCommissionInclGST: Joi.boolean().optional().messages({
        "boolean.base": "Commission Includes GST must be a boolean value.",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
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
}

exports.validateMobileRechargeProviderStatus = (req, res, next) => {
  try {
    const schema = Joi.object({
      status: Joi.boolean().required(),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
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
}

exports.validatePackage = (req, res, next) => {
  try {
    const fileUploadMaxSize= 500
    const schema = Joi.object({
      id: Joi.string().optional(),
      packageName: Joi.string().required().messages({
        "any.required": "Package name is required.",
      }),
      packageType: Joi.string().valid("INDIVIDUAL", "GROUP").required().messages({
        "any.required": "Package type is required.",
        "any.only": "Package type must be either 'INDIVIDUAL' or 'GROUP'."
      }),
      packagePrices: Joi.object({
        monthly: Joi.number().min(0).required().messages({
          "number.base": "Monthly price must be a number.",
          "number.min": "Monthly price must be greater than or equal to zero.",
          "any.required": "Monthly price is required."
        }),
        annually: Joi.number().min(0).required().messages({
          "number.base": "Annual price must be a number.",
          "number.min": "Annual price must be greater than or equal to zero.",
          "any.required": "Annual price is required."
        })
      }).required().messages({
        "any.required": "Package prices are required.",
        "object.base": "Package prices must be an object."
      }).custom((value, helpers) => {
        // Custom validation for monthly price
        if (value.monthly < helpers.state.ancestors[0].discount.monthly) {
          return helpers.message("Monthly price must be greater than the monthly discount.");
        }
        // Custom validation for annual price
        if (value.annually < helpers.state.ancestors[0].discount.annually) {
          return helpers.message("Annual price must be greater than the annual discount.");
        }
        if (helpers.state.ancestors[0].vendorPackagePrices && value.monthly < helpers.state.ancestors[0].vendorPackagePrices.monthly) {
          return helpers.message("Monthly price must be greater than the vendor monthly price.");
        }
        if (helpers.state.ancestors[0].vendorPackagePrices && value.annually < helpers.state.ancestors[0].vendorPackagePrices.annually) {
          return helpers.message("Annual price must be greater than the vendor annual price.");
        }
        return value;
      }),    
      vendorPackagePrices: Joi.object({
        monthly: Joi.number().min(0).required().messages({
          "number.base": "Vendor monthly price must be a number.",
          "number.min": "Vendor monthly price must be greater than or equal to zero.",
          "any.required": "Vendor monthly price is required."
        }),
        annually: Joi.number().min(0).required().messages({
          "number.base": "Vendor annual price must be a number.",
          "number.min": "Vendor annual price must be greater than or equal to zero.",
          "any.required": "Vendor annual price is required."
        })
      })
      .messages({
        "object.base": "Vendor package prices must be an object."
      })
      .optional().allow(null),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
      description: Joi.string().optional().allow("", null),
      packageLogo: Joi.alternatives().optional().allow("", null).try(Joi.string().base64().optional(), Joi.string().uri().optional()).custom(fileSizeValidation(fileUploadMaxSize)).optional().messages({
        "string.base64": "Package Image must be in base64 format.",
        "string.uri": "Package Image must be a valid URL.",
      }),
      imageFormat: Joi.string().valid("png", "jpg", "jpeg").optional().messages({
        "any.only": 'Image Format must be either "png", "jpg", or "jpeg".',
      }),
      serviceList: Joi.string().optional().allow("", null).when('packageType', {
        is: 'GROUP',
        then: Joi.string().required().messages({
          "any.required": "Service list is required for group packages."
        }),
        otherwise: Joi.string().optional().allow("")
      }),
      priorityLevel: Joi.string().optional().when('packageType', {
        is: 'GROUP',
        then: Joi.string().required().messages({
          "any.required": "Priority level is required for group packages."
        }),
        otherwise: Joi.string().optional().allow("", null)
      }),
      discount:Joi.object({
        monthly: Joi.number().min(0).required().messages({
          "number.base": "Monthly price in discount object must be a number.",
          "number.min": "Monthly price in discount object must be greater than or equal to zero.",
          "any.required": "Monthly price is required in discount object."
        }),
        annually: Joi.number().min(0).required().messages({
          "number.base": "Annual price in discount object must be a number.",
          "number.min": "Annual price in discount object must be greater than or equal to zero.",
          "any.required": "Annual price is required in discount object."
        })
      }).required().messages({
        "any.required": "discount is required.",
        "object.base": "discount prices must be an object."
      }), 
      discountType: Joi.string().valid("FLAT", "PERCENTAGE").optional(),
      accessCode: Joi.string().optional().allow("")
        .when('packageType', {
          is: 'INDIVIDUAL',
          then: Joi.string().required().messages({
            "any.required": "Access code is required for individual packages."
          }),
          otherwise: Joi.string().optional().allow("")
        }),
      partnerId: Joi.number().allow(null).optional().messages({
        "any.required": "Partner ID is required.",
      }),
      externalId: Joi.string().allow(null).optional().empty(''), 
      notifyCorporates: Joi.boolean().optional(),
      commissionMode: Joi.string().valid('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP').optional(),
      commissionType: Joi.string().valid('PERCENTAGE', 'FLAT').optional(),
      commission: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
      fixedCommissionPerTransaction: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
      isCommissionInclGST: Joi.boolean().optional(),
      planCommissions: Joi.object({
        monthly: Joi.object({
          commissionMode: Joi.string().valid('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP').optional(),
          commissionType: Joi.string().valid('PERCENTAGE', 'FLAT').required(),
          commission: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).required(),
          fixedCommissionPerTransaction: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
          isCommissionInclGST: Joi.boolean().optional(),
        }).required(),
        annually: Joi.object({
          commissionMode: Joi.string().valid('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP').optional(),
          commissionType: Joi.string().valid('PERCENTAGE', 'FLAT').required(),
          commission: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).required(),
          fixedCommissionPerTransaction: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).optional(),
          isCommissionInclGST: Joi.boolean().optional(),
        }).required(),
      }).optional().allow(null),
      type: Joi.string().valid("1", "2").required().messages({
        "any.required": "Type is required.",
        "any.only": "Type must be either '1' or '2'."
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

exports.validateActiveStatus = (req, res, next) => {
  try {
    const schema = Joi.object({
      status: Joi.boolean().required().messages({
        "boolean.base": "status must be a boolean.",
        "any.required": "status is required.",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
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

const packageSyncPartnerId = Joi.alternatives()
  .try(Joi.string().valid("default"), Joi.number().integer().positive())
  .messages({ "alternatives.match": "Partner ID must be 'default' or a positive number." });

exports.validatePackageSyncPreview = (req, res, next) => {
  try {
    const schema = Joi.object({
      accessKey: Joi.string().required().messages({ "any.required": "Access key is required." }),
      type: Joi.string().valid("1", "2").required().messages({
        "any.required": "Type is required.",
        "any.only": "Type must be either '1' or '2'.",
      }),
      partnerIds: Joi.array().items(packageSyncPartnerId).min(1).max(50).unique().required().messages({
        "any.required": "Partner IDs are required.",
        "array.min": "Select at least one partner.",
        "array.unique": "Partner IDs must be unique.",
      }),
      userId: Joi.number().optional().messages({ "number.base": "User ID must be a number" }),
      userType: Joi.string().optional(),
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

exports.validatePackageSyncApply = (req, res, next) => {
  try {
    const schema = Joi.object({
      accessKey: Joi.string().required().messages({ "any.required": "Access key is required." }),
      type: Joi.string().valid("1", "2").required().messages({
        "any.required": "Type is required.",
        "any.only": "Type must be either '1' or '2'.",
      }),
      partners: Joi.array()
        .items(
          Joi.object({
            partnerId: packageSyncPartnerId.required(),
            opIds: Joi.array()
              .items(
                Joi.string().pattern(/^(add|update|deactivate):[^#s]+#[0-9a-f]{8}$/).messages({
                  "string.pattern.base": "Each op id must be an add, update or deactivate op from the preview.",
                })
              )
              .min(1)
              .max(500)
              .unique()
              .required(),
          })
        )
        .min(1)
        .max(50)
        .unique((a, b) => a.partnerId === b.partnerId)
        .required()
        .messages({
          "any.required": "Partners are required.",
          "array.min": "Select at least one partner.",
          "array.unique": "Partner IDs must be unique.",
        }),
      userId: Joi.number().optional().messages({ "number.base": "User ID must be a number" }),
      userType: Joi.string().optional(),
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

exports.validateReferralCode = (req, res, next) => {
  try {
    const schema = Joi.object({
      referralCode: Joi.string().required().messages({
        "any.required": "Referral code is required.",
        "string.empty": "Referral code must not be empty.",
      }),
      contactPersonName: Joi.string().required().messages({
        "any.required": "Contact person name is required.",
        "string.empty": "Contact person name must not be empty.",
      }),
      contactPersonPhone: Joi.string()
        .required()
        .min(9)
        .max(10)
        .pattern(/^[0-9]+$/)
        .messages({
          "any.required": "Contact person phone number is required.",
          "string.empty": "Contact person phone number must not be empty.",
          "string.min": "Contact person phone number must be at least 9 digits",
          "string.max": "Contact person phone number must be less than 10 digits",
          "string.pattern.base": "Contact person phone number must contain only digits.",
        }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
      partnerId: Joi.alternatives()
      .try(Joi.number(), Joi.valid(null))
      .messages({
        "number.base": "Partner ID must be a number",
        "any.only": "Partner ID must be a number or null",
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

exports.validateBanner = (req, res, next) => {
  try {
    const fileUploadMaxSize = 500 //500 kb
    const schema = Joi.object({
      bannerLink: Joi.string().uri().required().messages({
        "any.required": "Banner link is required.",
        "string.empty": "Banner link cannot be empty.",
        "string.uri": "Banner link must be a valid URL.",
      }),
      deviceType: Joi.string().valid("WEB", "MOBILE").required().messages({
        "any.required": "Device type is required.",
        "string.empty": "Device type cannot be empty.",
        "any.only": 'Device type must be either "WEB" or "MOBILE".',
      }),
      bannerImage: Joi.alternatives().required().try(Joi.string().base64().optional(), Joi.string().uri().optional()).custom(fileSizeValidation(fileUploadMaxSize)).optional().messages({
        "any.required": "Banner image is required.",
        "string.empty": "Banner image cannot be empty.",
        "string.uri": "Banner image must be a valid URL.",
        "string.base64": "Banner image must be a base64 encoded string.",
      }),

      bannerFormat: Joi.string()
        .valid("png")
        .when("bannerImage", {
          is: "base64",
          then: Joi.required(),
        })
        .messages({
          "any.required": "Banner format is required when image is base64.",
          "any.only": 'Banner format must be "png" when image is base64.',
        }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
      position: Joi.string().required().messages({
        "any.required": "Position is required.",
      }),
      partnerId: Joi.number().allow(null).optional(),
      bannerTitle: Joi.string().allow('').optional(),
      description: Joi.string().allow('').optional(),
      buttonText: Joi.string().allow('').optional(),
      status: Joi.boolean().optional(),
      bannerType: Joi.string().valid("SUBSCRIPTION", "OTHER").required().messages({
        "any.required": "Banner type is required.",
        "any.only": 'Banner type must be either "SUBSCRIPTION" or "OTHER".',
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
exports.validateBannerStatus = (req, res, next) => {
  try {
    const schema = Joi.object({
      status: Joi.boolean().optional().messages({
        "any.required": "Status is required.",
        "string.empty": "Status cannot be empty.",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
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
////////////////////Adding Beneficiary////////////////////////////////
exports.validateAddingBeneficiary = (req, res, next) => {
  try {
    /*  const schema = Joi.object({
          name: Joi.string().min(3).required(),
          accountNo: Joi.string().min(6).required(),
          accessKey: Joi.string().min(1).required(),
          isActive: Joi.string().required(),
          credentialId: Joi.string().required(),
          optional1: Joi.string().optional(),
          _csrf: Joi.string().optional()
      });
      const result = schema.validate(req.body);
      if (result.error) {
          return res.status(203).json({
              code: 203,
              status: 'error',
              errors: [result.error.details[0].message]
          });
      }*/
    next()
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err)
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message]
    })
  }
}

////////////////////Updating Beneficiary////////////////////////////////
exports.validateUpdatingBeneficiary = (req, res, next) => {
  try {
    /* const schema = Joi.object({
         name: Joi.string().min(3).optional(),
         accountNo: Joi.string().min(6).optional(),
         accessKey: Joi.string().min(1).optional(),
         optional1: Joi.string().optional(),
         isActive: Joi.string().optional(),
         _csrf: Joi.string().optional()
     });
     const result = schema.validate(req.body);
     if (result.error) {
         return res.status(203).json({
             code: 203,
             status: 'error',
             errors: [result.error.details[0].message]
         });
     }*/
    next()
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err)
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message]
    })
  }
}


////////////////////Adding  Cashback  Up////////////////////////////////
exports.validateCashback = (req, res, next) => {
  try {
    const schema = Joi.object({
      packageId: Joi.string().required().messages({
        "any.required": "Package ID is required.",
        "string.empty": "Package ID cannot be empty.",
      }),
      serviceOperatorId: Joi.string().required().messages({
        "any.required": "Service operator ID is required.",
        "string.empty": "Service operator ID cannot be empty.",
      }),
      cashbackType: Joi.string().valid("PERCENTAGE", "FLAT").required().messages({
        "any.required": "Cashback type is required.",
        "string.empty": "Cashback type cannot be empty.",
        "any.only": 'Cashback type must be either "PERCENTAGE" or "FLAT".',
      }),
      cashback: Joi.number().min(0).required().when('cashbackType', {
        is: 'PERCENTAGE',
        then: Joi.number().max(100),
      }).messages({
        "any.required": "Cashback amount is required.",
        "number.base": "Cashback amount must be a number.",
        "number.min": "Cashback amount must be a positive number or zero.",
        "number.max": "Cashback amount must be between 0 and 100 for percentage type.",
      }),
      surchargeType: Joi.string().valid("PERCENTAGE", "FLAT").required().messages({
        "any.required": "Surcharge type is required.",
        "string.empty": "Surcharge type cannot be empty.",
        "any.only": 'Surcharge type must be either "PERCENTAGE" or "FLAT".',
      }),
      surcharge: Joi.number().min(0).required().messages({
        "any.required": "Surcharge amount is required.",
        "number.base": "Surcharge amount must be a number.",
        "number.min": "Surcharge amount must be a positive number or zero.",
      }),
      unitPrice: Joi.number().optional().precision(2).min(0).messages({
        "number.base": "Unit price must be a number.",
        "number.precision": "Unit price must have at most 2 decimal places.",
        "number.min": "Unit price must be a positive number or zero.",
      }),
      baseLimit: Joi.number().optional().precision(2).min(0).messages({
        "number.base": "Base limit must be a number.",
        "number.precision": "Base limit must have at most 2 decimal places.",
        "number.min": "Base limit must be a positive number or zero.",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
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

// Backs the accounting Platform Fee/Cashbacks/Subscription Add-ons tabs' bulk-configure.
exports.validateAccountingServiceCashbackBulk = (req, res, next) => {
  const schema = Joi.object({
    ids: Joi.array().items(Joi.number().integer()).min(1).required().messages({
      "array.min": "Select at least one row to update.",
      "any.required": "ids is required.",
    }),
    cashbackType: Joi.string().valid("PERCENTAGE", "FLAT"),
    cashback: Joi.number().min(0).when('cashbackType', {
      is: 'PERCENTAGE',
      then: Joi.number().max(100),
    }),
    surchargeType: Joi.string().valid("PERCENTAGE", "FLAT"),
    surcharge: Joi.number().min(0),
    unitPrice: Joi.number().min(0).precision(2),
    baseLimit: Joi.number().min(0).precision(2),
  })
    .and('cashbackType', 'cashback')
    .and('surchargeType', 'surcharge')
    .or('cashbackType', 'surchargeType', 'unitPrice', 'baseLimit');

  const { value, error } = schema.validate(req.body, { stripUnknown: true });
  if (error) return next(new ErrorResponse(error.details[0].message, 400));

  req.body = value;
  next();
};

exports.validateServiceStatus = (req, res, next) => {
  try {
    const schema = Joi.object({
      serviceStatus: Joi.boolean().required().messages({
        "any.required": "Service status is required.",
        "boolean.base": "Service status must be a boolean.",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
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
exports.validateDisableService = (req, res, next) => {
  try {
    // Accept both singular serviceOperatorId (string or array) and plural serviceOperatorIds array
    if (req.body.serviceOperatorId !== undefined && req.body.serviceOperatorIds === undefined) {
      req.body.serviceOperatorIds = Array.isArray(req.body.serviceOperatorId)
        ? req.body.serviceOperatorId
        : [req.body.serviceOperatorId];
    }

    const schema = Joi.object({
      credentialId: Joi.string().required().messages({
        "any.required": "Credential ID is required.",
      }),
      serviceOperatorIds: Joi.array()
        .items(Joi.string().required())
        .min(1)
        .required()
        .messages({
          "array.base": "Service operator IDs must be an array.",
          "array.min": "Please provide at least one service operator ID.",
          "any.required": "Service operator IDs are required.",
        }),
      serviceOperatorId: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
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

exports.validateSelfTransfer = (req, res, next) => {
  try {
    const schema = Joi.object({
      credentialId: Joi.string().min(1).required(),
      // F-OTH-19: same fix as validateTransferFunds — type was an unrestricted string and
      // amount accepted any non-empty string, including negative numbers and non-numeric input.
      type: Joi.string().valid('Credit', 'Debit').required(),
      amount: Joi.number().positive().precision(2).max(99999999).required(),
      password: Joi.string().min(4).max(20).required(),
      otp: Joi.string().required(),
      _csrf: Joi.string().optional()


    });
    const result = schema.validate(req.body, { convert: true });
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message]
      });
    }
    req.body = result.value;
    next()
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err)
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message]
    })
  }
}

////////////////////validateTransferFunds////////////////////////////////
exports.validateTransferFunds = (req, res, next) => {
  try {
    const schema = Joi.object({
      credentialId: Joi.string().required(),
      // F-OTH-18: amount used to be Joi.string().min(1) — any non-empty string passed,
      // including negative numbers, "abc", or scientific notation. A number parsed from
      // garbage input silently becomes NaN downstream, and NaN < 0 is false, so the
      // balance check could never catch it. max(8) digits mirrors the frontend's own
      // input cap (maxLength={8}).
      amount: Joi.number().positive().precision(2).max(99999999).required(),
      password: Joi.string().min(3).required(),
      remarks: Joi.string().min(6).required(),
      type: Joi.string().valid('Credit', 'Debit').required(),
      otp: Joi.string().required(),
      _csrf: Joi.string().optional()
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message]
      });
    }
    // Apply the validated/coerced value back — amount must reach the controller as the
    // actual numeric, precision-limited value Joi just checked, not the raw input.
    req.body = result.value;
    // F-OTH-18: reject transferring to/from the acting admin's own wallet — the model
    // layer processes this as two sequential updates to the same row, and the second
    // silently overwrites the first, letting an admin mint funds into their own wallet
    // with no real debit ever taking effect.
    if (String(req.body.credentialId) === String(req.user?.id)) {
      return res.status(400).json({
        status: false,
        message: 'Cannot transfer funds to your own wallet.',
        data: {},
        responseCode: '001'
      });
    }
    next()
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err)
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message]
    })
  }
}

// F-OTH-19: this route had zero validation — corporateId, rechargeAmount, merchantCommission
// and adminCommission all arrived as raw, unchecked client input. adminCommission in
// particular was credited straight into the acting admin's own wallet with no balance check
// and no upper bound, letting any authenticated system user mint funds into their own
// wallet. Capping each commission at the transaction's own amount (via Joi.ref) closes that
// without needing to recompute commission server-side from the real cashback configuration.
exports.validateCreateTransaction = (req, res, next) => {
  try {
    const schema = Joi.object({
      corporateId: Joi.number().required(),
      corporateName: Joi.string().allow('').optional(),
      rechargeAmount: Joi.number().positive().precision(2).max(99999999).required(),
      surcharge: Joi.number().min(0).precision(2).optional(),
      accountNo: Joi.string().allow('').optional(),
      service: Joi.string().allow('').optional(),
      serviceType: Joi.number().optional(),
      merchantCommission: Joi.number().min(0).precision(2).max(Joi.ref('rechargeAmount')).required(),
      adminCommission: Joi.number().min(0).precision(2).max(Joi.ref('rechargeAmount')).required(),
      transactionId: Joi.string().required(),
      orderId: Joi.string().allow('').optional(),
      providerId: Joi.string().allow('').optional(),
      serviceOperatorId: Joi.number().required(),
      categoryName: Joi.string().allow('').optional(),
      remarks: Joi.string().allow('').optional(),
      otp: Joi.string().required(),
    });
    const result = schema.validate(req.body, { convert: true });
    if (result.error) {
      return res.status(400).json({
        status: false,
        message: result.error.details[0].message,
        data: {},
        responseCode: '001'
      });
    }
    req.body = result.value;
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err)
    return res.status(500).json({
      status: false,
      message: 'Something went wrong',
      data: {},
      responseCode: '001'
    });
  }
}

exports.validatePartnerPermission = (req, res, next) => {
  try {
    const schema = Joi.object({
      registeredBy: Joi.number().min(1).allow(null).required().messages({
        "any.required": "registeredBy is required.",
        "string.empty": "registeredBy cannot be empty.",
      }),
      permissions: Joi.array().required().messages({
        "any.required": "Permissions is required.",
        "string.empty": "Permissions cannot be empty.",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
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

exports.validatePartnerPermissionSourceTarget = (req, res, next) => {
  try {
    const schema = Joi.object({
      fromPartnerId: Joi.alternatives()
        .try(Joi.number().min(1), Joi.string().valid("default"))
        .required()
        .messages({
          "any.required": "fromPartnerId is required.",
          "alternatives.match": "fromPartnerId must be a partner id or 'default'.",
        }),
      toPartnerId: Joi.number().min(1).required().messages({
        "any.required": "toPartnerId is required.",
        "number.base": "toPartnerId must be a number.",
      }),
      userId: Joi.number().optional(),
      userType: Joi.string().optional(),
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

exports.validatePartnerPermisssionStatus = (req, res, next) => {
  try {
    const schema = Joi.object({
      status: Joi.boolean().required().messages({
        "any.required": "Status is required.",
        "string.empty": "Status cannot be empty.",
      })
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

exports.validateMailWorkspace = (req, res, next) => {
  try {
    const schema = Joi.object({
      content: Joi.string().required().messages({
        "any.required": "Content is required.",
        "string.empty": "Content must not be empty.",
      }),
      files: Joi.array()
        .items(
          Joi.object({
            format: Joi.string().required().messages({
              "any.required": "File format is required.",
            }),
            base64: Joi.string().required().messages({
              "any.required": "Base64 string is required.",
              "string.empty": "Base64 string must not be empty.",
            }),
          })
        )
        .required()
        .messages({
          "any.required": "Files array is required.",
        }),
      planId: Joi.number().required().messages({
        "any.required": "Plan ID is required.",
        "number.base": "Plan ID must be a number.",
      }),
      credentialId: Joi.number().required().messages({
        "any.required": "Credential ID is required.",
        "number.base": "Credential ID must be a number.",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
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

exports.validateUpdateWorkSpaceStatus = (req, res, next) => {
  try {
    const schema = Joi.object({
      workspaceOrderStatus: Joi.string().required().messages({
        "any.required": "status is required.",
      })
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
}
exports.validateSystemUserProfile = (req, res, next) => {
  try {
    const schema = Joi.object({
      mobileNo: Joi.string().required().messages({
        "any.required": "Mobile number is required.",
      }),
      email: Joi.string().email().required().messages({
        "any.required": "Email is required.",
        "string.email": "Please provide a valid email address.",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
      username: Joi.string().optional().messages({
        "string.empty": "Username cannot be empty.",
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

exports.validateChangePassword = (req, res, next) => {
  try {
    const schema = Joi.object({
      // id: Joi.string().required(),
      oldPassword: Joi.string().required().min(5).messages({
        "any.required": "Old password is required.",
        "string.empty": "Old password cannot be empty."
      }),
      newPassword: Joi.string()
        .required()
        .messages({
          "any.required": "New password is required.",
          "string.empty": "New password cannot be empty."
        }),
      ConfirmPassword: Joi.string()
        .required()
        .messages({
          "any.required": "Confirm password is required.",
          "string.empty": "Confirm password cannot be empty."
        }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),

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
exports.validateBankAccount = (req, res, next) => {
  try {
    let schema = Joi.object({
      accountHolderName: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .required()
        .pattern(/^[a-zA-Z\s]+$/)
        .messages({
          "any.required": "Please enter account holder name.",
          "string.empty": "Account holder name cannot be empty.",
          "string.min": "Name must be at least 3 characters long.",
          "string.max": "Maximum 50 characters are allowed for account holder name.",
          "string.pattern.base": "Please enter a valid account holder name.",
        }),
      bankName: Joi.string()
        .trim()
        .min(3)
        .max(50)
        .required()
        .pattern(/^[a-zA-Z\s]+$/)
        .messages({
          "any.required": "Please enter bank name.",
          "string.empty": "Bank name cannot be empty.",
          "string.min": "Bank name must be at least 3 characters long.",
          "string.max": "Maximum 50 characters are allowed for bank name.",
          "string.pattern.base": "Please enter a valid bank name.",
        }),
      accountNumber: Joi.string().min(8).required().messages({
        "any.required": "Please enter account number.",
        "string.min": "Account number must be at least 8 characters long.",
      }),
      bankBranch: Joi.string().trim().min(3).max(50).optional().allow('').messages({
        "string.min": "Bank address must be at least 3 characters long.",
        "string.max": "Maximum 50 characters are allowed for bank branch.",
      }),
      ifscCode: Joi.string()
        .required()
        .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
        .messages({
          "any.required": "Please enter IFSC Code.",
          "string.pattern.base": "Please enter a valid IFSC Code.",
      }),
      credentialId: Joi.string().optional().messages({
        "string.base": "Credential ID must be a string",
    }),    
      accountType: Joi.string().valid("Savings", "Current").required().messages({
        "any.required": "Account type is required.",
        "any.only": "Invalid account type. Allowed types are Savings or Current.",
      }),
      default: Joi.alternatives().try(
        Joi.number().required().messages({
          "any.required": "Please specify whether the account is default or not.",
        }),
        Joi.boolean().required().messages({
          "any.required": "Please specify whether the account is default or not.",
        }),
      ),
      otp: Joi.string().required().messages({
        "any.required": "Please enter the OTP.",
      }),
      scope: Joi.string().required().messages({
        "any.required": "Please specify the scope.",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
    });
    if (req.method === "PUT") {
      schema = schema.keys({
        id: Joi.number().required().messages({
          "any.required": "ID is required for PUT requests.",
          "number.base": "ID must be a number.",
        }),
      });
    }
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


exports.validateReferralReward = (req, res, next) => {
  try{
  const schema = Joi.object({
    reward: Joi.number()
      .min(0)
      .precision(2)
      .required()
      .messages({
        'number.base': 'Reward must be a number',
        'number.min': 'Reward must be at least 0',
        'number.precision': 'Reward can have at most 2 decimal places',
        'any.required': 'Reward is required'
      })
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      status: false,
      data: {},
      message: error.details[0].message,
      responseCode: '001'
    });
  }

  next();
}
catch (err) {
    customLog(
      req?.LogTraceId,
      "error",
      {
          error: err,
      },
  
  );
    next(new ErrorResponse("Something went wrong",400));
  }
};

exports.validateAddAccounts = (req, res, next) => {
    try {
        const schema = Joi.object({
            accounts: Joi.array().min(1).required().messages({
                "array.min": "Please select at least one account",
                "any.required": "Please select accounts",
                "array.base": "Please select accounts",
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

const priceOrDiscountSchema = Joi.object({
  monthly: Joi.alternatives()
    .try(Joi.number().min(0), Joi.string().allow('', null), Joi.valid(null))
    .optional()
    .messages({
      "number.min": "Monthly value must be zero or greater.",
    }),
  annually: Joi.alternatives()
    .try(Joi.number().min(0), Joi.string().allow('', null), Joi.valid(null))
    .optional()
    .messages({
      "number.min": "Annual value must be zero or greater.",
    }),
}).unknown(false);

exports.validateClonePackageToPartner = (req, res, next) => {
  try {
    const schema = Joi.object({
      fromPackageId: Joi.alternatives()
        .try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/))
        .required()
        .messages({
          "any.required": "fromPackageId is required.",
          "alternatives.match": "fromPackageId must be a positive integer.",
        }),
      toPartnerId: Joi.alternatives()
        .try(
          Joi.number().integer().positive(),
          Joi.string().pattern(/^\d+$/),
          Joi.string().valid('default')
        )
        .required()
        .messages({
          "any.required": "toPartnerId is required.",
          "alternatives.match":
            "toPartnerId must be a positive integer or the string 'default'.",
        }),
      overrides: Joi.object({
        packageName: Joi.string().trim().max(200).optional().allow('').messages({
          "string.max": "Package name must be at most 200 characters.",
        }),
        aliasName: Joi.string().trim().max(200).optional().allow('').messages({
          "string.max": "Alias name must be at most 200 characters.",
        }),
        packagePrices: priceOrDiscountSchema.optional(),
        discount: priceOrDiscountSchema.optional(),
      })
        .unknown(false)
        .optional(),
      userId: Joi.number().optional(),
      userType: Joi.string().optional(),
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

exports.validateAddCashbacksToPackage = (req, res, next) => {
  try {
    const schema = Joi.object({
      toPackageId: Joi.alternatives()
        .try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/))
        .required()
        .messages({
          "any.required": "toPackageId is required.",
          "alternatives.match": "toPackageId must be a positive integer.",
        }),
      sourceCashbackIds: Joi.array()
        .items(
          Joi.alternatives().try(
            Joi.number().integer().positive(),
            Joi.string().pattern(/^\d+$/)
          )
        )
        .min(1)
        .unique()
        .required()
        .messages({
          "any.required": "sourceCashbackIds is required.",
          "array.base": "sourceCashbackIds must be an array.",
          "array.min": "Select at least one cashback to copy.",
          "array.unique": "sourceCashbackIds must not contain duplicates.",
        }),
      userId: Joi.number().optional(),
      userType: Joi.string().optional(),
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


exports.validatePartnerServiceAccess = (req, res, next) => {
  try {
    const schema = Joi.object({
      partnerId: Joi.number().required().messages({
        "any.required": "partnerId is required.",
        "number.base": "partnerId must be a number.",
      }),
      permissions: Joi.array().required().messages({
        "any.required": "Permissions is required.",
        "array.base": "Permissions must be an array.",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
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

exports.validatePartnerServiceAccessUpdate = (req, res, next) => {
  try {
    const schema = Joi.object({
      status: Joi.boolean().required().messages({
        "any.required": "Status is required.",
        "boolean.base": "Status must be a boolean value.",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
    });

    const result = schema.validate(req.body);
    if (result.error) {
      throw new Error(result.error.details[0].message);
    }
    req.body = { status: result.value.status };
    next();
  } catch (err) {
    err.code ? console.log(`🚀 ~Error:${err.message}`) : console.log(err);
    next(err);
  }
};

exports.validateServicesTypeConfig = (req, res, next) => {
    const accessKeyList = Joi.array()
        .items(Joi.string().trim().min(1).max(100))
        .unique()
        .default([]);

    const schema = Joi.object({
        service_with_plans: accessKeyList,
        service_without_plans: accessKeyList,
        peko_service_subscriptions: accessKeyList,
        peko_subscription_vendors: accessKeyList,
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

exports.validateServiceClassification = (req, res, next) => {
    const schema = Joi.object({
        planType: Joi.string()
            .valid("with_plans", "without_plans", "peko_subscription", "peko_subscription_vendor")
            .allow(null)
            .required(),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

exports.validateAccountingGoLiveDate = (req, res, next) => {
    const schema = Joi.object({
        date: Joi.date().iso().required(),
        reason: Joi.string().trim().allow("", null).max(500).default(null),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

// Same shape as validatePackage's own `planCommissions`.
const splitCommissionBlockSchema = Joi.object({
    commissionMode: Joi.string().valid("MARGIN", "AGENT_MARKUP", "PRINCIPAL_MARKUP").required(),
    commissionType: Joi.string().valid("PERCENTAGE", "FLAT").required(),
    commission: Joi.number().min(0).required(),
    fixedCommissionPerTransaction: Joi.number().min(0).default(0),
    isCommissionInclGST: Joi.boolean().default(false),
});
const splitCommissionSchema = Joi.object({
    monthly: splitCommissionBlockSchema.required(),
    annually: splitCommissionBlockSchema.required(),
})
    .optional()
    .allow(null);

exports.validateAccountingServiceCommission = (req, res, next) => {
    const schema = Joi.object({
        price: Joi.number().min(0).optional(),
        annualPrice: Joi.number().min(0).optional(),
        discount: Joi.number().min(0).optional(),
        annualDiscount: Joi.number().min(0).optional(),
        commissionMode: Joi.string().valid("MARGIN", "AGENT_MARKUP", "PRINCIPAL_MARKUP").required(),
        commissionType: Joi.string().valid("PERCENTAGE", "FLAT").required(),
        providerCommission: Joi.number().min(0).required(),
        fixedCommissionPerTransaction: Joi.number().min(0).default(0),
        isCommissionInclGST: Joi.boolean().default(false),
        splitCommission: splitCommissionSchema,
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

exports.validateCommissionConfiguredStatus = (req, res, next) => {
    const schema = Joi.object({
        isCommissionConfigured: Joi.boolean().required(),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

exports.validateSurchargeConfiguredStatus = (req, res, next) => {
    const schema = Joi.object({
        isSurchargeConfigured: Joi.boolean().required(),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

// Backs the Plans tab's bulk-configure.
exports.validateAccountingServicePlanCommissionBulk = (req, res, next) => {
    const schema = Joi.object({
        planIds: Joi.array().items(Joi.number().integer()).min(1).required().messages({
            "array.min": "Select at least one plan to update.",
            "any.required": "planIds is required.",
        }),
        commissionMode: Joi.string().valid("MARGIN", "AGENT_MARKUP", "PRINCIPAL_MARKUP").required(),
        commissionType: Joi.string().valid("PERCENTAGE", "FLAT").required(),
        providerCommission: Joi.number().min(0).required(),
        fixedCommissionPerTransaction: Joi.number().min(0).default(0),
        isCommissionInclGST: Joi.boolean().default(false),
        splitCommission: splitCommissionSchema,
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

exports.validateAccountingServiceVendor = (req, res, next) => {
    const schema = Joi.object({
        vendorName: Joi.string().trim().min(1).max(255).required(),
        state: Joi.string().trim().allow("", null).max(100),
        gstNo: Joi.string()
            .trim()
            .uppercase()
            .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/)
            .optional()
            .allow("")
            .messages({
                "string.base": "GST number must be a string.",
                "string.pattern.base": "GST number must be a valid 15-character GSTIN.",
            }),
        address: Joi.string().trim().allow("", null).max(1000),
        vendorEmail: Joi.array()
            .items(Joi.string().email())
            .single()
            .required()
            .messages({
                "any.required": "Vendor email is required",
                "string.email": "Vendor email must be a valid email address",
            }),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

exports.validatePackagePricing = (req, res, next) => {
    const money = Joi.number().min(0).required();
    const schema = Joi.object({
        packagePrices: Joi.object({ monthly: money, annually: money }).required(),
        discount: Joi.object({ monthly: money, annually: money }).required(),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    }).custom((value, helpers) => {
        if (value.discount.monthly > value.packagePrices.monthly) {
            return helpers.message("Monthly discount cannot exceed the monthly price.");
        }
        if (value.discount.annually > value.packagePrices.annually) {
            return helpers.message("Annual discount cannot exceed the annual price.");
        }
        return value;
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

exports.validatePackagePricingBulk = (req, res, next) => {
    const money = Joi.number().min(0).required();
    const schema = Joi.object({
        ids: Joi.array().items(Joi.number().integer()).min(1).required().messages({
            "array.min": "Select at least one row to update.",
            "any.required": "ids is required.",
        }),
        packagePrices: Joi.object({ monthly: money, annually: money }).required(),
        discount: Joi.object({ monthly: money, annually: money }).required(),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    }).custom((value, helpers) => {
        if (value.discount.monthly > value.packagePrices.monthly) {
            return helpers.message("Monthly discount cannot exceed the monthly price.");
        }
        if (value.discount.annually > value.packagePrices.annually) {
            return helpers.message("Annual discount cannot exceed the annual price.");
        }
        return value;
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

exports.validatePartnerShare = (req, res, next) => {
    const schema = Joi.object({
        sharePercentage: Joi.number().min(0).max(100),
        gatewayCharge: Joi.object({
            percentage: Joi.number().min(0).max(100).required(),
            fixed: Joi.number().min(0).max(1e6).required(),
        }).allow(null),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    }).or("sharePercentage", "gatewayCharge");

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

const VENDOR_DEPOSIT_MODES = ["NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER"];

const VENDOR_SLIP_FORMATS = ["pdf", "jpg", "jpeg", "png"];

const VENDOR_SLIP_MAX_KB = 5 * 1024;

const vendorSlipKeys = {
    slipBase64: Joi.string()
        .allow("", null)
        .custom(fileSizeValidation(VENDOR_SLIP_MAX_KB))
        .optional(),
    slipName: Joi.string().trim().max(255).allow("", null).optional(),
    slipFormat: Joi.string()
        .lowercase()
        .valid(...VENDOR_SLIP_FORMATS)
        .allow("", null)
        .optional()
        .messages({ "any.only": "Slip must be a PDF, JPG or PNG file" }),
};

const validateLedgerBody = schema => (req, res, next) => {
    const { value, error } = schema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    return next();
};

const changeReasonKey = {
    changeReason: Joi.string().trim().min(3).max(200).required().messages({
        "any.required": "Say why the entry is being changed",
        "string.empty": "Say why the entry is being changed",
        "string.min": "Give a short reason for the change",
    }),
};

const partnerPayoutSchema = Joi.object({
    amount: Joi.number().greater(0).required(),
    payoutDate: Joi.date().iso().required(),
    reference: Joi.string().trim().max(40).required(),
    mode: Joi.string()
        .valid(...VENDOR_DEPOSIT_MODES)
        .default("NEFT"),
    note: Joi.string().trim().allow("").max(200).default(""),
    ...vendorSlipKeys,
    userId: Joi.any().optional(),
    userType: Joi.any().optional(),
});

exports.validatePartnerPayout = validateLedgerBody(partnerPayoutSchema);

exports.validatePartnerPayoutEdit = validateLedgerBody(partnerPayoutSchema.keys(changeReasonKey));

// The fee is never accepted from the client: it is the shortfall between what the ledger
// says is expected and what actually arrived, worked out by the controller.
const paymentGatewaySettlementSchema = Joi.object({
    amount: Joi.number().greater(0).required(),
    entryDate: Joi.date().iso().required(),
    reference: Joi.string().trim().max(40).required(),
    mode: Joi.string().valid(...VENDOR_DEPOSIT_MODES).default("NEFT"),
    note: Joi.string().trim().allow("").max(200).default(""),
    ...vendorSlipKeys,
    userId: Joi.any().optional(),
    userType: Joi.any().optional(),
});

exports.validatePaymentGatewaySettlement = validateLedgerBody(paymentGatewaySettlementSchema);

exports.validatePaymentGatewaySettlementEdit = validateLedgerBody(
    paymentGatewaySettlementSchema.keys(changeReasonKey)
);

const paymentGatewayFeeSchema = Joi.object({
    amount: Joi.number().greater(0).required(),
    entryDate: Joi.date().iso().required(),
    reference: Joi.string().trim().max(40).required(),
    mode: Joi.string().valid(...VENDOR_DEPOSIT_MODES).default("NEFT"),
    note: Joi.string().trim().allow("").max(200).default(""),
    ...vendorSlipKeys,
    userId: Joi.any().optional(),
    userType: Joi.any().optional(),
});

exports.validatePaymentGatewayFee = validateLedgerBody(paymentGatewayFeeSchema);

exports.validatePaymentGatewayFeeEdit = validateLedgerBody(paymentGatewayFeeSchema.keys(changeReasonKey));

const vendorDepositSchema = Joi.object({
    amount: Joi.number().greater(0).required(),
    depositDate: Joi.date().iso().required(),
    reference: Joi.string().trim().max(40).required(),
    mode: Joi.string()
        .valid(...VENDOR_DEPOSIT_MODES)
        .default("NEFT"),
    note: Joi.string().trim().allow("").max(200).default(""),
    ...vendorSlipKeys,
    userId: Joi.any().optional(),
    userType: Joi.any().optional(),
});

exports.validateVendorDeposit = validateLedgerBody(vendorDepositSchema);

exports.validateVendorDepositEdit = validateLedgerBody(vendorDepositSchema.keys(changeReasonKey));

// Shared by vendors, gateways and partners: an opening is a plain figure as of a date, with
// no reference and no mode. Deliberately no .greater(0) — an opening of zero is the normal
// case where everything before the cut-off was already settled, and a negative one is real.
const ledgerOpeningBalanceSchema = Joi.object({
    amount: Joi.number().required().messages({
        "any.required": "Opening balance is required",
    }),
    asOfDate: Joi.date().iso().required(),
    note: Joi.string().trim().allow("").max(200).default(""),
    ...vendorSlipKeys,
    userId: Joi.any().optional(),
    userType: Joi.any().optional(),
});

exports.validateLedgerOpeningBalance = validateLedgerBody(ledgerOpeningBalanceSchema);

exports.validateLedgerOpeningBalanceEdit = validateLedgerBody(
    ledgerOpeningBalanceSchema.keys(changeReasonKey)
);

// The vendor route has used this name since before the other ledgers had openings.
exports.validateVendorOpeningBalance = exports.validateLedgerOpeningBalance;

const vendorLedgerEntrySchema = Joi.object({
    amount: Joi.number().greater(0).required(),
    gstInclusive: Joi.boolean().default(true),
    issueDate: Joi.date().iso().required(),
    reason: Joi.string().trim().allow("").max(200).default(""),
    againstCorporateTxnId: Joi.string().trim().allow("").max(60).default(""),
    ...vendorSlipKeys,
    userId: Joi.any().optional(),
    userType: Joi.any().optional(),
});

const validateLedgerEntry = (req, res, next) => {
    const { value, error } = vendorLedgerEntrySchema.validate(req.body, {
        stripUnknown: true,
        convert: true,
    });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

exports.validateVendorCreditNote = validateLedgerEntry;

exports.validateVendorCommission = validateLedgerEntry;

exports.validateVendorCostOfSales = validateLedgerEntry;
exports.validateVendorDebitNote = validateLedgerEntry;

const commissionInvoiceBilledToSchema = Joi.object({
    companyName: Joi.string().trim().min(1).max(120).required(),
    address: Joi.string().trim().allow("").max(300).default(""),
    state: Joi.string().trim().allow("").max(120).default(""),
    gstin: Joi.string().trim().allow("").max(20).default(""),
    userId: Joi.any().optional(),
    userType: Joi.any().optional(),
});

exports.validateCommissionInvoiceBilledTo = validateLedgerBody(commissionInvoiceBilledToSchema);

exports.validateCommissionInvoicePreview = validateLedgerBody(
    Joi.object({
        billedTo: commissionInvoiceBilledToSchema.optional(),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    })
);

exports.validateCommissionInvoiceSend = validateLedgerBody(
    Joi.object({
        to: Joi.array()
            .items(Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(254))
            .min(1)
            .max(5)
            .unique()
            .required(),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    })
);


exports.validatePartnerDebitNote = validateLedgerEntry;

exports.validateLedgerEntryEdit = validateLedgerBody(vendorLedgerEntrySchema.keys(changeReasonKey));

exports.validateBooksTag = validateLedgerBody(
    Joi.object({
        synced: Joi.boolean().required(),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    })
);

exports.validateLedgerVoid = (req, res, next) => {
    const schema = Joi.object({
        reason: Joi.string().trim().min(3).max(200).required(),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

exports.validateServiceApprovalDecision = (req, res, next) => {
    const schema = Joi.object({
        nodeKey: Joi.string().trim().min(1).max(255).required(),
        partnerPermissionIds: Joi.array()
            .items(Joi.number().integer().positive())
            .min(1)
            .max(100)
            .unique()
            .required(),
        decision: Joi.string().valid("APPROVED", "REJECTED").required(),
        note: Joi.string()
            .trim()
            .max(500)
            .when("decision", {
                is: "REJECTED",
                then: Joi.required(),
                otherwise: Joi.allow(null).empty("").default(null),
            }),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

exports.validateServiceApprovalGate = (req, res, next) => {
    const schema = Joi.object({
        enabled: Joi.boolean().required(),
        reason: Joi.string().trim().allow("", null).max(500).default(null),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

const MANUAL_JOURNAL_KEYS = ["transaction", "refund", "adminRefund", "cashback", "cashbackReversal"];

// The split figures: numbers, plus the few facts the set-up step states alongside them.
const manualJournalNumbers = Joi.object({
    commissionMode: Joi.string().valid("MARGIN", "PRINCIPAL_MARKUP", "MIXED", "OWN_REVENUE").optional(),
    billingType: Joi.string().valid("MONTHLY", "ANNUALLY").optional(),
    paymentGatewayName: Joi.string().trim().max(60).optional(),
    isInterState: Joi.boolean().optional(),
    vendorIsInterState: Joi.boolean().optional(),
    salesIsInterState: Joi.boolean().optional(),
    partnerIsInterState: Joi.boolean().optional(),
}).pattern(Joi.string().max(60), Joi.number().min(0).max(1e9));

const yesNo = Joi.boolean().required();
const money = Joi.number().min(0).max(1e9);

// How an order was sold, as the accounts team states it before the figures are worked out.
exports.validateManualJournalSetup = (req, res, next) => {
    const schema = Joi.object({
        paymentThrough: Joi.string().valid("GATEWAY", "WALLET", "BOTH").required(),
        orderAmount: Joi.number().greater(0).max(1e9).required(),
        pgAmount: money.required(),
        gateway: Joi.object({
            name: Joi.string().trim().allow("", null).max(60).optional(),
            accountId: Joi.alternatives().try(Joi.string().trim().max(60), Joi.number()).allow(null).optional(),
        }).default({}),
        subscription: Joi.object({
            is: yesNo,
            billingType: Joi.string().valid("MONTHLY", "ANNUALLY").allow(null).optional(),
        }).required(),
        vendor: Joi.object({ present: yesNo }).required(),
        commission: Joi.object({
            present: yesNo,
            type: Joi.string().valid("PERCENTAGE", "FLAT").required(),
            mode: Joi.string().valid("MARGIN", "PRINCIPAL_MARKUP", "MIXED").required(),
            value: money.allow(null).optional(),
            fixed: money.allow(null).optional(),
            inclusiveOfGst: Joi.boolean().default(false),
        }).required(),
        mixed: Joi.object({
            principalAmount: money.allow(null).optional(),
            marginAmount: money.allow(null).optional(),
        }).default({}),
        platformFee: Joi.object({
            type: Joi.string().valid("FLAT", "PERCENTAGE").required(),
            value: money.allow(null).optional(),
        }).required(),
        partner: Joi.object({
            present: yesNo,
            sharePercentage: Joi.number().min(0).max(100).allow(null).optional(),
            gatewayCharge: Joi.object({
                percentage: Joi.number().min(0).max(100).allow(null).optional(),
                fixed: money.allow(null).optional(),
            })
                .allow(null)
                .optional(),
        }).required(),
        coupon: Joi.object({
            used: Joi.boolean().default(false),
            totalDiscount: money.allow(null).optional(),
        }).default({ used: false }),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    }).custom((value, helpers) => {
        const vendorSale = value.vendor.present && !value.subscription.is;
        if (vendorSale && value.commission.mode === "MIXED") {
            const principal = Number(value.mixed.principalAmount) || 0;
            const margin = Number(value.mixed.marginAmount) || 0;
            if (Math.abs(principal + margin - value.orderAmount) > 0.005) {
                return helpers.message("The amounts sold as principal and on margin must add up to the order amount");
            }
        }
        if (value.paymentThrough !== "WALLET" && !(value.pgAmount > 0)) {
            return helpers.message("Paid via gateway must be above zero unless the order was paid from the wallet");
        }
        return value;
    });

    const { value, error } = schema.validate(req.body || {}, { stripUnknown: true, convert: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

exports.validateManualJournalParams = (req, res, next) => {
    const schema = Joi.object({
        corporateTxnId: Joi.string().trim().min(1).max(60).required(),
        journalKey: Joi.string().valid(...MANUAL_JOURNAL_KEYS).optional(),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    });

    const { value, error } = schema.validate(req.params, { stripUnknown: false, convert: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.params = { ...req.params, ...value };
    next();
};

exports.validateManualJournalPreview = (req, res, next) => {
    const schema = Joi.object({
        journalData: manualJournalNumbers.optional(),
        amount: Joi.number().greater(0).optional(),
        refundAmount: Joi.number().greater(0).optional(),
        totalOrderAmount: Joi.number().greater(0).optional(),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    });

    const { value, error } = schema.validate(req.body || {}, { stripUnknown: true, convert: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

const manualJournalLine = Joi.object({
    accountId: Joi.alternatives().try(Joi.string().trim().min(1).max(60), Joi.number()).required(),
    direction: Joi.string().valid("debit", "credit").required(),
    amount: Joi.number().greater(0).max(1e9).precision(2).required(),
    description: Joi.string().trim().allow("").max(200).optional(),
});

const balanced = (lineItems, helpers) => {
    const total = direction =>
        lineItems.reduce((sum, line) => sum + (line.direction === direction ? Number(line.amount) : 0), 0);
    if (Math.abs(total("debit") - total("credit")) > 0.005) {
        return helpers.message("Debits and credits must be equal");
    }
    return lineItems;
};

exports.validateManualJournalEntry = (req, res, next) => {
    const schema = Joi.object({
        journalDate: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
        lineItems: Joi.array().items(manualJournalLine).min(2).max(60).required().custom(balanced),
        journalData: manualJournalNumbers.optional(),
        journalAccountIds: Joi.object().pattern(Joi.string().max(60), Joi.any()).allow(null).optional(),
        reason: Joi.string().trim().min(3).max(200).required(),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    });

    const { value, error } = schema.validate(req.body || {}, { stripUnknown: true, convert: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = { ...value, lineItems: value.lineItems.map(line => ({ ...line, accountId: String(line.accountId) })) };
    next();
};

exports.validateSettingWrite = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().trim().min(1).max(255).required(),
        details: Joi.any().required(),
    });

    const { value, error } = schema.validate(req.body, { allowUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));
    if (isProtectedSetting(value.name)) return next(new ErrorResponse(PROTECTED_SETTING_MESSAGE, 403));

    req.body = { ...req.body, name: value.name };
    next();
};

exports.validateServiceClassificationBulk = (req, res, next) => {
    const schema = Joi.object({
        accessKeys: Joi.array()
            .items(Joi.string().trim().min(1).max(100))
            .min(1)
            .max(100)
            .unique()
            .required(),
        planType: Joi.string()
            .valid("with_plans", "without_plans", "peko_subscription", "peko_subscription_vendor")
            .required(),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};

exports.validatePaymentLinkCharge = (req, res, next) => {
    const schema = Joi.object({
        percentage: Joi.number().min(0).max(100).required(),
        fixed: Joi.number().min(0).max(1e6).required(),
        userId: Joi.any().optional(),
        userType: Joi.any().optional(),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true });
    if (error) return next(new ErrorResponse(error.details[0].message, 400));

    req.body = value;
    next();
};
