/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const Joi = require('joi');
const ErrorResponse = require('./error-response');
const { customLog } = require('./loggerHelper');

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

// Optional evidence photos for an ONDC issue (raise/respond). Each item is a
// raw base64 image (no data-URL prefix) + its format; the controller uploads
// them to Firebase and forwards the resulting public URLs to the seller.
// Capped at 5 images, 2 MB each (2048 KB — reuses the app-wide fileSizeValidation).
const ondcIssueImagesSchema = Joi.array()
  .items(
    Joi.object({
      base64: Joi.string().base64().custom(fileSizeValidation(2048)).required(),
      format: Joi.string().valid('png', 'jpeg', 'jpg', 'pdf').required(),
      name: Joi.string().optional(),
    }).unknown(true)
  )
  .max(5)
  .optional();
////////////////////Adding System User////////////////////////////////
exports.validateAddingSystemUser = (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required(),
      username: Joi.string().required(),
      email: Joi.string().required().email(),
      mobileNo: Joi.string().required(),
      //isActive: Joi.string().required(),
      role: Joi.string().required(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 400,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }

    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

exports.validateGetOtp = (req, res, next) => {
  try {
    const schema = Joi.object({
      mobileNo: Joi.string().required(),
      email: Joi.string().min(6).required().email(),
      scope: Joi.string().required(),
      panNumber: Joi.string().min(6).max(10).required(),
      gstNumber: Joi.string().min(6).max(15).required(),
      resend: Joi.boolean().required(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 400,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

exports.validateSetNewPassword = (req, res, next) => {
  try {
    const schema = Joi.object({
      password: Joi.string().required(),
      username: Joi.string().required(),
      token: Joi.string().required(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 400,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

exports.validateSoftwareSubscriptionPayment = (req, res, next) => {
  try {
    const schema = Joi.object({
      planId: Joi.number().integer().positive().required().messages({
        'any.required': 'Plan ID is required',
        'number.base': 'Plan ID must be a number',
        'number.integer': 'Plan ID must be an integer',
        'number.positive': 'Plan ID must be positive',
      }),
      amount: Joi.number().positive().precision(2).required().messages({
        'any.required': 'Amount is required',
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be a positive number',
        'number.precision': 'Amount must have at most 2 decimal places',
      }),
      billingType: Joi.string().valid('MONTHLY', 'YEARLY').required().messages({
        'any.required': 'Billing type is required',
        'string.base': 'Billing type must be a string',
        'any.only': "Billing type must be either 'MONTHLY' or 'YEARLY'",
      }),
      formDetails: Joi.object().required().messages({
        'any.required': 'Form details are required',
        'object.base': 'Form details must be an object',
      }),
      accessKey: Joi.string().required().messages({
        'any.required': 'Access key is required',
        'string.empty': 'Access key cannot be empty',
      }),
    });

    // Validate request body against schema
    const result = schema.validate(req.body);
    if (result.error) {
      throw new Error(result.error.details[0].message);
    }

    // Proceed to the next middleware if validation succeeds
    next();
  } catch (err) {
    err.code ? console.log(`🚀 ~Error:${err.message}`) : console.log(err);
    next(err);
  }
};

////////////////////Updating SystemUser////////////////////////////

////////////////////Adding Corporate  User////////////////////////////////
exports.validateAddingCorporateUser = (req, res, next) => {
  try {
    // const schema = Joi.object({
    //     // // name: Joi.string().min(3).required(),
    //     // username: Joi.string().min(6).required(),
    //     // email: Joi.string().min(6).required().email(),
    //     // //password: Joi.string().min(6).required(),
    //     // mobileNo: Joi.string().min(6).required(),
    //     // website: Joi.string().min(6).required(),
    //     // country: Joi.string().min(3).required(),
    //     // city: Joi.string().min(3).required(),
    //     // //address: Joi.string().min(6).required(),
    //     // poBox: Joi.string().min(4).required(),
    //     // countryCode: Joi.string().min(1).required(),
    //     // contactPersonName: Joi.string().min(6).required(),
    //     // contactPersonEmail: Joi.string().min(6).required(),
    //     // contactPersonPhone: Joi.string().min(7).required(),
    //     // latLng: Joi.string().min(6).required(),
    //     // logo: Joi.string().min(7).required(),
    //     // isActive: Joi.string().required(),
    //     // registeredBy: Joi.string().min(4).required()
    // });
    // const result = schema.validate(req.body);
    // if (result.error) {
    //     return res.status(203).json({
    //         code: 400,
    //         status: 'error',
    //         errors: [result.error.details[0].message]
    //     });
    // }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////Updating System  User////////////////////////////
exports.validateUpdatingSystemUser = (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().min(3).optional(),
      username: Joi.string().min(3).optional(),
      email: Joi.string().min(6).optional().email(),
      mobileNo: Joi.string().required(),
      isActive: Joi.string().optional(),
      registeredBy: Joi.string().min(4).optional(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 400,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};
////////////////////Updating Corporate User////////////////////////////
exports.validateUpdatingCorporateUser = (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().min(3).optional(),
      username: Joi.string().min(3).optional(),
      email: Joi.string().min(6).optional().email(),
      password: Joi.string().min(6).optional(),
      mobileNo: Joi.string().min(6).optional(),
      website: Joi.string().min(6).optional(),
      country: Joi.string().min(3).optional(),
      sector: Joi.string().min(2).optional(),
      activity: Joi.string().min(3).optional(),
      city: Joi.string().min(3).optional(),
      address: Joi.string().min(1).optional(),
      poBox: Joi.string().min(4).optional(),
      countryCode: Joi.string().min(1).optional(),
      contactPersonName: Joi.string().min(6).optional(),
      contactPersonEmail: Joi.string().min(6).optional(),
      contactPersonPhone: Joi.string().min(7).optional(),
      latLng: Joi.string().min(6).optional(),
      logo: Joi.string().min(7).optional(),
      isActive: Joi.string().optional(),
      kycStatus: Joi.string().optional(),
      registeredBy: Joi.string().min(4).optional(),
      packageId: Joi.string().optional(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 400,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};
////////////////////Adding Commission////////////////////////////////

exports.validateAddingCommission = (req, res, next) => {
  try {
    const schema = Joi.object({
      serviceProvider: Joi.string().min(3).required(),
      accessKey: Joi.string().min(1).required(),
      commission: Joi.string().required(),
      surcharge: Joi.string().required(),
      adminCommission: Joi.string().required(),
      merchantCommission: Joi.string().required(),
      commissionType: Joi.string().min(4).required(),
      merchantName: Joi.string().min(3).required(),
      serviceType: Joi.string().min(3).required(),
      vendorName: Joi.string().min(3).required(),
      status: Joi.string().required(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(400).json({
        code: 400,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};
exports.validateFetchVendors = (req, res, next) => {
  try {
    const schema = Joi.object({
      productIds: Joi.array().items(Joi.number().integer().positive()).min(1).required().messages({
        'array.base': 'Product IDs must be an array.',
        'array.min': 'At least one product ID is required.',
        'any.required': 'Product IDs are required.',
        'number.base': 'Each product ID must be a number.',
        'number.integer': 'Each product ID must be an integer.',
        'number.positive': 'Each product ID must be a positive number.',
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
exports.validateAddToCart = (req, res, next) => {
  try {
    let schema = Joi.object({
      userId: Joi.number().optional().messages({
        'number.base': 'User ID must be a number',
      }),
      userType: Joi.string().optional().messages({
        'string.base': 'User type must be a string',
      }),
      productId: Joi.number().required().messages({
        'number.base': 'Product ID must be a number.',
        'number.empty': 'Product ID cannot be empty.',
        'any.required': 'Product ID is required.',
      }),
      productQuantity: Joi.number().messages({
        'number.base': 'Product quantity must be a number.',
      }),
      expectedDeliveryDate: Joi.string().allow(null).optional(),
      deliveryTat: Joi.string().allow(null).optional(),
    });
    if (req.method === 'PUT') {
      schema = schema.keys({
        operation: Joi.string().valid('decrease', 'increase').required().messages({
          'string.empty': 'Operation cannot be empty.',
          'any.required': 'Operation is required.',
          'any.only': "Operation must be either 'decrease' or 'increase'.",
        }),
      });
    }
    const result = schema.validate(req.body);
    if (result.error) {
      // ErrorResponse (not a bare Error) so the global handler reads status_code
      // and returns 400 instead of falling through to its 500 default.
      throw new ErrorResponse(result.error.details[0].message, 400);
    }
    next();
  } catch (err) {
    err.code ? console.log(`🚀 ~Error:${err.message}`) : console.log(err);
    next(err);
  }
};
exports.validateFetchProductImage = (req, res, next) => {
  try {
    const schema = Joi.object({
      productsId: Joi.string().required().messages({
        'string.empty': 'Product ID cannot be empty.',
        'any.required': 'Product ID is required.',
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
exports.validateEcommercePayment = (req, res, next) => {
  console.log('vannu njnnnnnnnnnnnnnnnnnnnnnnn');
  try {
    const schema = Joi.object({
      transactionId: Joi.number().required().messages({
        'number.base': 'Transaction ID must be a number.',
        'any.required': 'Transaction ID is required.',
      }),
      amount: Joi.number().required().messages({
        'number.base': 'Amount must be a number.',
        'any.required': 'Amount is required.',
      }),
      address: Joi.object({
        address: Joi.string().required().messages({
          'string.base': 'Address must be a string.',
          'any.required': 'Address is required.',
        }),
        firstName: Joi.string().required().messages({
          'string.base': 'First Name must be a string.',
          'any.required': 'First Name is required.',
        }),
        lastName: Joi.string().required().allow('').messages({
          'string.base': 'Last Name must be a string.',
          'any.required': 'Last Name is required.',
        }),
        phoneNumber: Joi.string().required().messages({
          'string.base': 'Phone must be a string.',
          'any.required': 'Phone is required.',
        }),
        remarks: Joi.string().allow('').messages({
          'string.base': 'Remarks must be a string.',
        }),
        saveThisAddress: Joi.boolean().messages({
          'boolean.base': 'Save this address must be a boolean.',
        }),
      }),
      cartId: Joi.number().required().messages({
        'number.base': 'Cart ID must be a number.',
        'any.required': 'Cart ID is required.',
      }),
      userEmail: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
          'string.base': 'User email must be a string.',
          'string.email': 'User email must be a valid email address.',
          'any.required': 'User email is required.',
        }),
      accessKey: Joi.string().required().messages({
        'string.base': 'accessKey must be a string.',
        'any.required': 'accessKey is required.',
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
exports.validateCancelOrder = (req, res, next) => {
  try {
    const schema = Joi.object({
      description: Joi.string().min(3).required().messages({
        'string.empty': 'Description cannot be empty.',
        'any.required': 'Description is required.',
        'string.min': 'Description must be at least 3 characters long.',
      }),
      reason: Joi.string().min(3).required().messages({
        'string.empty': 'Reason cannot be empty.',
        'any.required': 'Reason is required.',
        'string.min': 'Reason must be at least 3 characters long.',
      }),
      userId: Joi.number().optional().messages({
        'number.base': 'User ID must be a number',
      }),
      orderId: Joi.number().optional().messages({
        'number.base': 'Order ID must be a number',
      }),
      userType: Joi.string().optional().messages({
        'string.base': 'User type must be a string',
      }),
      otp: Joi.string().required().messages({
        'any.required': 'OTP is required.',
      }),
      scope: Joi.string().required().messages({
        'any.required': 'Scope is required.',
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
exports.validateRaiseOndcIssue = (req, res, next) => {
  try {
    const schema = Joi.object({
      category: Joi.string().valid('ITEM', 'FULFILLMENT', 'ORDER', 'AGENT').required().messages({
        'any.required': 'Category is required.',
        'any.only': 'Category must be one of ITEM, FULFILLMENT, ORDER, AGENT.',
      }),
      subCategory: Joi.string().min(2).required().messages({
        'any.required': 'Sub-category is required.',
        'string.min': 'Sub-category must be at least 2 characters long.',
      }),
      description: Joi.string().min(3).required().messages({
        'any.required': 'Description is required.',
        'string.min': 'Description must be at least 3 characters long.',
      }),
      images: ondcIssueImagesSchema,
      clientRequestId: Joi.string().guid().required().messages({
        'any.required': 'clientRequestId is required.',
        'string.guid': 'clientRequestId must be a valid uuid.',
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
exports.validateRespondToOndcIssue = (req, res, next) => {
  try {
    const schema = Joi.object({
      // allowed empty only when cannotProvideProof is true — that specific
      // combination is enforced in the controller, not this schema.
      message: Joi.string().allow('').required().messages({
        'any.required': 'message is required.',
      }),
      cannotProvideProof: Joi.boolean().optional(),
      images: ondcIssueImagesSchema,
      clientRequestId: Joi.string().guid().required().messages({
        'any.required': 'clientRequestId is required.',
        'string.guid': 'clientRequestId must be a valid uuid.',
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
exports.validateReturnOrder = (req, res, next) => {
  try {
    const schema = Joi.object({
      userId: Joi.number().optional().messages({
        'number.empty': 'User ID cannot be empty.',
      }),
      userType: Joi.string().optional().messages({
        'string.empty': 'User Type cannot be empty.',
      }),
      productId: Joi.number().required().messages({
        'number.empty': 'Product ID cannot be empty.',
        'any.required': 'Product ID is required.',
      }),
      orderId: Joi.number().optional().messages({
        'string.empty': 'Order ID cannot be empty.',
      }),
      description: Joi.string().min(3).required().messages({
        'string.empty': 'Description cannot be empty.',
        'any.required': 'Description is required.',
        'string.min': 'Description must be at least 3 characters long.',
      }),
      reason: Joi.string().min(3).required().messages({
        'string.empty': 'Reason cannot be empty.',
        'any.required': 'Reason is required.',
        'string.min': 'Reason must be at least 3 characters long.',
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
exports.validateReturnAndRefund = (req, res, next) => {
  try {
    const schema = Joi.object({
      // Required for the legacy productId-scoped return flow; the ONDC
      // return-approval flow (query param `ondcOrderId`) has no per-product
      // scoping, so this is optional at the validation layer.
      productId: Joi.alternatives().try(Joi.number(), Joi.string()).optional().messages({
        'string.empty': 'Product Id cannot be empty.',
      }),
      otp: Joi.string().required().messages({
        'any.required': 'OTP is required.',
        'string.empty': 'OTP cannot be empty.',
      }),
      scope: Joi.string().valid('email').required().messages({
        'any.only': 'Scope must be "email".',
        'any.required': 'Scope is required.',
      }),
      returnStatus: Joi.string().valid('Return Rejected', 'Return Initiated', 'Return Completed').required().messages({
        'any.only': 'Return status must be "Return Rejected", "Return Initiated", or "Return Completed".',
        'any.required': 'Return status is required.',
      }),
      returnPickUpDate: Joi.string()
        .isoDate()
        .when('returnStatus', {
          is: 'Return Initiated',
          then: Joi.required().messages({
            'any.required': 'Return pick-up date is required when return status is "Return Initiated".',
            'string.empty': 'Return pick-up date cannot be empty when return status is "Return Initiated".',
          }),
          otherwise: Joi.allow(null).allow(''),
        }),
      paymentStatus: Joi.string().optional().allow('').messages({
        'string.empty': 'Payment status cannot be empty.',
      }),
      // ONDC return-approval (query param `ondcOrderId`) doesn't touch a
      // specific legacy productId — optional here so that flow validates too.
      reason: Joi.string().optional().allow('').messages({
        'string.empty': 'Reason cannot be empty.',
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
exports.validateCancelAndRefund = (req, res, next) => {
  try {
    const schema = Joi.object({
      workspaceOrderStatus: Joi.string().valid('Cancel rejected', 'Cancel approved').required().messages({
        'any.only': 'Workspace order status must be "Cancel rejected" or "Cancel approved".',
        'any.required': 'Workspace order status is required.',
      }),
      otp: Joi.string().required().messages({
        'string.empty': 'OTP cannot be empty.',
        'any.required': 'OTP is required.',
      }),
      scope: Joi.string().required().messages({
        'string.empty': 'Scope cannot be empty.',
        'any.required': 'Scope is required.',
      }),
      // Required for the legacy refund-orchestration flow; the ONDC
      // cancel-approval flow (query param `ondcOrderId`) just marks the order
      // Cancelled with no refund branching, so this is optional here.
      paymentStatus: Joi.string().valid('PAID', 'REFUND', 'SUCCESS').optional().messages({
        'any.only': 'Payment status must be "PAID" or "REFUND".',
      }),
      reason: Joi.string().optional().allow('').messages({
        'string.empty': 'Reason cannot be empty.',
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

/**
 * Body for PUT /ondc/orders/:id/refund — the admin buyer-refund action.
 *
 * A separate schema rather than reusing validateCancelAndRefund: that one requires a
 * `workspaceOrderStatus` from the cancellation vocabulary and has nowhere to put an
 * amount. Joi defaults to `unknown: false`, so an unlisted field would 400.
 *
 * This action has no OTP gate. `otp`/`scope` are still accepted and IGNORED purely so a
 * frontend deployed before that change doesn't 400 during a rollout — they are not read
 * by the controller. Remove them once no client sends them.
 */
exports.validateOndcRefund = (req, res, next) => {
  try {
    const schema = Joi.object({
      otp: Joi.string().optional().allow(''),
      scope: Joi.string().optional().allow(''),
      // The service caps this to what is actually refundable; the schema only
      // rejects nonsense. `precision(2)` matches the DECIMAL(12,2) columns.
      amount: Joi.number().positive().precision(2).required().messages({
        'number.base': 'Refund amount must be a number.',
        'number.positive': 'Refund amount must be greater than zero.',
        'any.required': 'Refund amount is required.',
      }),
      reason: Joi.string().max(500).optional().allow('').messages({
        'string.max': 'Reason cannot exceed 500 characters.',
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

exports.validateSoftwaresPayment = (req, res, next) => {
  try {
    const schema = Joi.object({
      // The plan price as a plain number string (e.g. "1500.0000"); rejects negative or non-numeric values
      amount: Joi.string().pattern(/^\d+(\.\d+)?$/).required().messages({
        'string.base': 'Amount must be a string.',
        'string.pattern.base': 'Amount must be a valid number.',
        'any.required': 'Amount is required.',
      }),
      accessKey: Joi.string().required().messages({
        'string.base': 'AccessKey must be a string.',
        'any.required': 'AccessKey is required.',
      }),
      planId: Joi.string().required().messages({
        'string.base': 'Plan ID must be a string.',
        'any.required': 'Plan ID is required.',
      }),
      formDetails: Joi.object({
        companyName: Joi.string().required().messages({
          'string.base': 'Company name must be a string.',
          'any.required': 'Company name is required.',
        }),
        domainName: Joi.string().optional().allow('').messages({
          'string.base': 'Domain name must be a string.',
        }),
        adminEmail: Joi.string()
          .email({ tlds: { allow: false } })
          .required()
          .messages({
            'string.base': 'Admin email must be a string.',
            'string.email': 'Admin email must be a valid email address.',
            'any.required': 'Admin email is required.',
          }),
        // address: Joi.string().required().messages({
        //   "string.base": "Address must be a string.",
        //   "any.required": "Address is required.",
        // }),
        // country: Joi.string().required().messages({
        //   "string.base": "Country must be a string.",
        //   "any.required": "Country is required.",
        // }),
      }).required(),
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
        'boolean.base': 'status must be a boolean.',
        'any.required': 'status is required.',
      }),
      serviceOperatorId: Joi.number().optional().messages({
        'number.base': 'ID must be a number.',
      }),
      prodId: Joi.number().optional().messages({
        'number.base': 'ID must be a number.',
      }),
      subscriptionId: Joi.number().optional().messages({
        'number.base': 'ID must be a number.',
      }),
      otp: Joi.string().optional().alphanum().length(6).messages({
        'string.alphanum': 'OTP must contain only alphanumeric characters.',
        'string.length': 'OTP must be exactly 6 characters long.',
        'any.required': 'OTP is required.',
      }),
      // Scope validation as a string, and it must be "email"
      scope: Joi.string().optional().valid('email').messages({
        'any.only': 'Scope must be "email".',
        'any.required': 'Scope is required.',
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

exports.validateSoftwareSubscription = (req, res, next) => {
  try {
    const fileUploadMaxSize = 500; //500 kb
    let schema = Joi.object({
      name: Joi.string().trim().min(3).required().messages({
        'any.required': 'Name is required',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 3 characters long',
      }),
      type: Joi.string().valid('EMAIL', 'DOMAIN').required().messages({
        'any.required': 'Type of order is required',
        'any.only': 'Type of order should be either EMAIL or DOMAIN',
      }),
      offersText: Joi.string().trim().allow(''),
      image: Joi.alternatives()
        .conditional(Joi.string().base64().required(), {
          then: Joi.string().allow('').required(),
          otherwise: Joi.string().uri().allow(''),
        })
        .custom(fileSizeValidation(fileUploadMaxSize))
        .required()
        .messages({
          'any.required': 'Image is required',
          'string.empty': 'Image cannot be empty',
          'string.uri': 'Image must be a valid URI',
          'string.base64': 'Image must be a base64 encoded string',
        }),
      imageFormat: Joi.when('image', {
        is: Joi.string().base64(),
        then: Joi.string().valid('png', 'jpg', 'jpeg').required(),
        otherwise: Joi.allow(null, ''),
      }),
      sendVendorMail: Joi.alternatives().try(
        Joi.boolean().optional().messages({
          'boolean.base': 'Send Email Vendor must be a boolean value',
        }),
        Joi.number().optional().messages({
          'number.base': 'Send Vendor Email must be a number',
        })
      ),
      status: Joi.alternatives().try(
        Joi.boolean().optional().messages({
          'boolean.base': 'Status must be a boolean value',
        }),
        Joi.number().optional().messages({
          'number.base': 'Status must be a number',
        })
      ),
      sendInternalMail: Joi.alternatives().try(
        Joi.boolean().optional().messages({
          'boolean.base': 'Send Internal mail must be a boolean value',
        }),
        Joi.number().optional().messages({
          'number.base': 'Send Internal mail must be a number',
        })
      ),
      peko_key: Joi.string().trim().required().min(3).messages({
        'any.required': 'Peko key is required',
        'string.empty': 'Peko key cannot be empty',
        'string.min': 'Peko key must be at least 3 characters long',
      }),

      vendorId: Joi.number().required().messages({
        'any.required': 'Vendor ID is required',
        'number.base': 'Vendor ID must be a number',
      }),
      pekoEmail: Joi.array().items(Joi.string().email()).single().required().messages({
        'any.required': 'Peko email is required',
        'array.base': 'Peko email must be an array',
        'array.empty': 'Peko email cannot be empty',
        'string.email': 'Peko email must be a valid email address',
        'string.base': 'Peko email must be a valid email address',
        'array.sparse': 'Peko email must be a valid email address',
      }),
      displayOrder: Joi.number().allow('').optional(),
    });

    if (req.method === 'PUT') {
      schema = schema.keys({
        id: Joi.number().optional().messages({
          'number.empty': 'id cannot be empty',
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

exports.validateSoftwareSubscriptionPlan = (req, res, next) => {
  try {
    const fileUploadMaxSize = 500; // 500 kb
    let schema = Joi.object({
      name: Joi.string().trim().min(3).required().messages({
        'any.required': 'Name is required',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 3 characters long',
      }),
      monthlyPrice: Joi.number().precision(2).min(0).required().messages({
        'any.required': 'Monthly price is required',
        'number.base': 'Monthly price must be a number',
        'number.min': 'Monthly price cannot be negative',
      }),
      yearlyPrice: Joi.number().precision(2).min(0).required().messages({
        'any.required': 'Yearly price is required',
        'number.base': 'Yearly price must be a number',
        'number.min': 'Yearly price cannot be negative',
      }),
      image: Joi.alternatives()
        .conditional(Joi.string().base64().required(), {
          then: Joi.string().allow('').required(),
          otherwise: Joi.string().uri().allow(''),
        })
        .custom(fileSizeValidation(fileUploadMaxSize))
        .required()
        .messages({
          'any.required': 'Image is required',
          'string.empty': 'Image cannot be empty',
          'string.uri': 'Image must be a valid URI',
          'string.base64': 'Image must be a base64 encoded string',
        }),
      imageFormat: Joi.when('image', {
        is: Joi.string().base64(),
        then: Joi.string().valid('png', 'jpg', 'jpeg').required(),
        otherwise: Joi.allow(null, ''),
      }),
      features: Joi.array()
        .items(
          Joi.object({
            label: Joi.string().required(),
            value: Joi.string().required(),
          })
        )
        .default([])
        .messages({
          'array.base': 'Features must be an array',
        }),
      descriptions: Joi.array()
        .items(
          Joi.object({
            label: Joi.string().required(),
            value: Joi.string().required(),
          })
        )
        .default([])
        .messages({
          'array.base': 'Descriptions must be an array',
        }),
      image_url: Joi.string().uri().allow('').optional().messages({
        'string.uri': 'Image URL must be a valid URI',
      }),
      status: Joi.boolean().default(true).messages({
        'boolean.base': 'Status must be a boolean',
      }),
      softwaresSubscriptionId: Joi.number().integer().positive().required().messages({
        'any.required': 'Software Subscription ID is required',
        'number.base': 'Software Subscription ID must be a number',
        'number.integer': 'Software Subscription ID must be an integer',
        'number.positive': 'Software Subscription ID must be positive',
      }),
      commissionMode: Joi.string().valid('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP').optional(),
      commissionType: Joi.string().valid('PERCENTAGE', 'FLAT').default('PERCENTAGE').messages({
        'any.only': 'Commission type must be PERCENTAGE or FLAT',
      }),
      commission: Joi.number().min(0).default(0).messages({
        'number.base': 'Commission must be a number',
        'number.min': 'Commission must be 0 or greater',
      }),
      fixedCommissionPerTransaction: Joi.number().min(0).default(0).optional().messages({
        'number.base': 'Fixed commission must be a number',
        'number.min': 'Fixed commission must be 0 or greater',
      }),
      isCommissionInclGST: Joi.boolean().default(true).messages({
        'boolean.base': 'isCommissionInclGST must be a boolean',
      }),
    });

    if (req.method === 'PUT') {
      schema = schema.keys({
        id: Joi.number().optional().messages({
          'number.empty': 'id cannot be empty',
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
////////////////////Updating Commission////////////////////////////////
exports.validateUpdatingCommission = (req, res, next) => {
  try {
    const schema = Joi.object({
      serviceProvider: Joi.string().min(3).optional(),
      accessKey: Joi.string().min(1).optional(),
      commission: Joi.string().optional(),
      surcharge: Joi.string().optional(),
      adminCommission: Joi.string().optional(),
      merchantCommission: Joi.string().optional(),
      commissionType: Joi.string().min(4).optional(),
      merchantName: Joi.string().min(3).optional(),
      serviceType: Joi.string().min(3).optional(),
      vendorName: Joi.string().min(3).optional(),
      status: Joi.string().optional(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(400).json({
        code: 400,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
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
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 400,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////Updating Notification////////////////////////////////
exports.validateUpdatingNotification = (req, res, next) => {
  try {
    const schema = Joi.object({
      notificationTitle: Joi.string().min(3).optional(),
      notificationBrief: Joi.string().min(3).optional(),
      notificationCategory: Joi.string().optional(),
      notificationTo: Joi.string().optional(),
      notificationBy: Joi.string().optional(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 400,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////Adding Service Operators////////////////////////////////
exports.validateAddingServiceOperator = (req, res, next) => {
  try {
    /* const schema = Joi.object({
             serviceImage: Joi.string().min(4).optional(),
             imageFormat: Joi.string().min(1).optional(),
             serviceProvider: Joi.string().min(2).required(),
             providerCommission: Joi.string().optional(),
             serviceCategory: Joi.string().min(3).required(),
             accessKey: Joi.string().min(1).required(),
             countryName: Joi.string().min(3).required(),
             countryCode: Joi.string().min(1).required(),
             vendorId: Joi.string().required(),
             commissionType: Joi.string().min(4).optional(),
             balanceMethod: Joi.string().optional(),
             serviceType: Joi.string().required(),
             serviceStatus: Joi.string().optional(),
             _csrf: Joi.string().optional()

         });

         const result = schema.validate(req.body);
         //console.log(result)
         if (result.error) {
             return res.status(203).json({
                 code: 400,
                 status: 'error',
                 errors: [result.error.details[0].message]
             });
         }*/
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////Updating Service Operators////////////////////////////////
exports.validateUpdatingServiceOperator = (req, res, next) => {
  try {
    /*const schema = Joi.object({
            serviceProvider: Joi.string().min(3).optional(),
            accessKey: Joi.string().min(3).optional(),
            isTUFlexiAvailable: Joi.string().optional(),
            isTUFixedAvailable: Joi.string().optional(),
            isBPFlexiAvailable: Joi.string().optional(),
            isBPFixedAvailable: Joi.string().optional(),
            serviceStatus: Joi.string().optional(),
            commission: Joi.string().optional(),
            serviceCategory: Joi.string().min(3).optional(),
            remarks: Joi.string().optional(),
            countryName: Joi.string().min(3).optional(),
            countryCode: Joi.string().min(1).optional(),
            vendorCode: Joi.string().min(3).optional(),
            vendorName: Joi.string().min(4).optional(),
            balanceMethod: Joi.string().optional(),
            surCharge: Joi.string().optional(),
            optional1: Joi.string().min(4).optional(),
            optional2: Joi.string().min(4).optional(),
            optional3: Joi.string().min(4).optional(),
            optional4: Joi.string().min(4).optional(),
            optional5: Joi.string().min(4).optional(),
            optional6: Joi.string().min(4).optional(),
            commissionType: Joi.string().min(4).optional(),
            isPlanAvailable: Joi.string().optional(),
            optionalsRequired: Joi.string().optional(),
            serviceImage: Joi.string().min(4).optional(),
            isActive: Joi.string().optional()

        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }*/
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

exports.validateActiveStatus = (req, res, next) => {
    try {
      const schema = Joi.object({
        status: Joi.boolean().required().messages({
          "boolean.base": "status must be a boolean.",
          "any.required": "status is required.",
        }),
        serviceOperatorId: Joi.number().optional().messages({
          "number.base": "ID must be a number.",
        }),
        prodId: Joi.number().optional().messages({
          "number.base": "ID must be a number.",
        }),
        subscriptionId: Joi.number().optional().messages({
          "number.base": "ID must be a number.",
        }),
        userId: Joi.number()
        .optional(),
        userType: Joi.string()
        .optional()
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
  exports.validateAddCategory = (req, res, next) => {
    try {
      const fileUploadMaxSize = 500; //500 kb
      const schema = Joi.object({
        categoryName: Joi.string().required().messages({
          "string.base": "Category name must be a string.",
          "string.empty": "Category name cannot be empty.",
          "any.required": "Category name is required.",
        }),
        categoryStatus: Joi.boolean().required().messages({
          "boolean.base": "categoryStatus must be a boolean.",
          "any.required": "categoryStatus is required.",
        }),
        categoryImage: Joi.string().base64().custom(fileSizeValidation(fileUploadMaxSize)).required().messages({
          "string.base64": "Category image must be a base64 encoded string.",
          "string.empty": "Category image cannot be empty.",
          "any.required": "Category image is required.",
        }),
        categoryImageFormat: Joi.string().valid("png", "jpg", "jpeg", "gif").required().messages({
          "string.base": "Category image format must be a string.",
          "string.empty": "Category image format cannot be empty.",
          "any.only": "Category image format must be either png, jpg, jpeg, or gif.",
          "any.required": "Category image format is required.",
        }),
        vendorId: Joi.string().required().messages({
          "string.base": "Vendor ID must be a string.",
          "string.empty": "Vendor ID cannot be empty.",
          "any.required": "Vendor ID is required.",
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
  
  exports.validateUpdateCategory = (req, res, next) => {
    try {
      const fileUploadMaxSize = 500; //500 kb
      const schema = Joi.object({
        id: Joi.number().optional().messages({
          "number.base": "ID must be a number.",
          "number.empty": "ID cannot be empty.",
        }),
        categoryName: Joi.string().required().messages({
          "string.base": "Category name must be a string.",
          "string.empty": "Category name cannot be empty.",
          "any.required": "Category name is required.",
        }),
        categoryImage: Joi.string().custom(fileSizeValidation(fileUploadMaxSize)).required().messages({
          "string.base": "Category image must be a string.",
          "string.empty": "Category image cannot be empty.",
          "any.required": "Category image is required.",
        }),
        categoryImageFormat: Joi.when("categoryImage", {
          is: Joi.string().base64(),
          then: Joi.string().valid("png", "jpg", "jpeg", "gif").required().messages({
            "string.base": "Category image format must be a string.",
            "string.empty": "Category image format cannot be empty.",
            "any.only": "Category image format must be either png, jpg, jpeg, or gif.",
            "any.required": "Category image format is required.",
          }),
          otherwise: Joi.allow(null),
        }),
        vendorId: Joi.string().required().messages({
          "string.base": "Vendor ID must be a string.",
          "string.empty": "Vendor ID cannot be empty.",
          "any.required": "Vendor ID is required.",
        }),
        categoryStatus: Joi.number().optional().messages({
          "number.base": "Status must be a number.",
          "number.empty": "Status cannot be empty.",
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
  
  exports.validateUpdateCategoryStatus = (req, res, next) => {
    try {
      const schema = Joi.object({
        categoryStatus: Joi.boolean().required().messages({
          "boolean.base": "categoryStatus must be a boolean.",
          "any.required": "categoryStatus is required.",
        }),
        categoryId: Joi.number().required().messages({
          "number.base": "category ID must be a number.",
          "any.required": "category ID is required.",
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
  exports.validateProduct = (req, res, next) => {
    try {
      const schema = Joi.object({
        id: Joi.number().optional(),
        name: Joi.string().trim().min(3).required().messages({
          "any.required": "Product name is required",
          "string.empty": "Product name cannot be empty",
          "string.min": "Product name must be at least 3 characters long",
        }),
        brand: Joi.string().trim().min(3).required().messages({
          "any.required": "Brand name is required",
          "string.empty": "Brand name cannot be empty",
          "string.min": "Brand name must be at least 3 characters long",
        }),
        description: Joi.string().trim().min(3).required().messages({
          "any.required": "Description is required",
          "string.empty": "Description cannot be empty",
          "string.min": "Description must be at least 3 characters long",
        }),
        highlights: Joi.string().trim().min(3).required().messages({
          "any.required": "Highlights are required",
          "string.empty": "Highlights cannot be empty",
          "string.min": "Highlights must be at least 3 characters long",
        }),
        warranty: Joi.string().trim().optional().allow(""),
        SKUCode: Joi.string().trim().optional().allow(""),
  
        categoryId: Joi.string().required().messages({
          "any.required": "Category ID is required",
        }),
        categoryName: Joi.string().allow('').optional().messages({
          "string.base": "Category Name must be a string",
          "any.only": "Category Name be a valid string value",
        }),
        priceExcludedVat: Joi.number().messages({
          "number.base": "Price excluded GST must be a number",
        }),
        quantity: Joi.number().required().messages({
          "any.required": "Quantity is required",
          "number.base": "Quantity must be a number",
        }),
        discountType: Joi.string().valid("PERCENTAGE", "FLAT").required().messages({
          "any.required": "Discount type is required",
          "any.only": 'Discount type should be either "PERCENTAGE" or "FLAT"',
        }),
        discount: Joi.number().when("discountType", {
          is: "PERCENTAGE",
          then: Joi.number().min(0).max(100).required().messages({
            "any.required": "Percentage discount amount is required",
            "number.base": "Percentage discount must be a number",
            "number.min": "Percentage discount cannot be less than 0%",
            "number.max": "Percentage discount cannot be greater than 100%",
          }),
          otherwise: Joi.number().min(0).required().messages({
            "any.required": "Flat discount amount is required",
            "number.base": "Flat discount must be a number",
            "number.min": "Flat discount cannot be less than 0",
          }),
        }),
        gstType: Joi.string().valid("PERCENTAGE", "CUSTOM").required().messages({
          "any.required": "GST type is required",
          "any.only": 'GST type should be either "PERCENTAGE" or "CUSTOM"',
        }),
        GST: Joi.number().when("discountType", {
          is: "PERCENTAGE",
          then: Joi.number().min(0).max(100).required().messages({
            "any.required": "Percentage gst amount is required",
            "number.base": "Percentage gst must be a number",
            "number.min": "Percentage gst cannot be less than 0%",
            "number.max": "Percentage gst cannot be greater than 100%",
          }),
          otherwise: Joi.number().min(0).required().messages({
            "any.required": "Custom gst amount is required",
            "number.base": "Custom gst must be a number",
            "number.min": "Custom gst cannot be less than 0",
          }),
        }),
        actualPrice: Joi.number().required().messages({
          "any.required": "Price is required",
          "number.base": "Price must be a number",
        }),
        price: Joi.number().optional().min(0).max(Joi.ref("actualPrice")).messages({
          "number.base": "Price must be a number",
          "number.min": "Price cannot be less than 0",
          "number.max": "Price cannot be greater than actual price",
        }),
        productImage1: Joi.alternatives()
          .conditional(Joi.string().base64().required(), {
            then: Joi.string().required(),
            otherwise: Joi.string().uri(),
          })
          .required()
          .messages({
            "any.required": "Product image 1 is required",
            "string.empty": "Product image 1 cannot be empty",
            "string.uri": "Product image 1 must be a valid URI",
            "string.base64": "Product image 1 must be a base64 encoded string",
          }),
        productImage2: Joi.alternatives().try(Joi.string().allow("", null).required(), Joi.string().uri(), Joi.string().base64()).messages({
          "any.required": "Product image 2 is required",
          "string.empty": "Product image 2 cannot be empty",
          "string.uri": "Product image 2 must be a valid URI",
          "string.base64": "Product image 2 must be a base64 encoded string",
        }),
        productImage3: Joi.alternatives().try(Joi.string().allow("", null).required(), Joi.string().uri(), Joi.string().base64()).messages({
          "any.required": "Product image 3 is required",
          "string.uri": "Product image 3 must be a valid URI",
          "string.base64": "Product image 3 must be a base64 encoded string",
        }),
        format1: Joi.string().optional().allow(""),
        format2: Joi.string().optional().allow(""),
        format3: Joi.string().optional().allow(""),
        productImageFormat1: Joi.when("productImage1", {
          is: Joi.string().base64(),
          then: Joi.string().valid("png").required(),
          otherwise: Joi.allow(null),
        }),
        productImageFormat2: Joi.when("productImage2", {
          is: Joi.string().base64(),
          then: Joi.string().valid("png").required(),
          otherwise: Joi.allow(null),
        }),
        productImageFormat3: Joi.when("productImage3", {
          is: Joi.string().base64(),
          then: Joi.string().valid("png").required(),
          otherwise: Joi.allow(null),
        }),
  
        vendors: Joi.array()
          .min(1)
          .items(
            Joi.object({
              id: Joi.number().required(),
              price: Joi.number().required(),
              name: Joi.string().required(),
            })
          )
          .required()
          .messages({
            "any.required": "At least one vendor must be specified",
            "array.min": "At least one vendor must be specified",
            "object.base": "Each vendor must be an object",
            "object.missing": "Vendor is missing required fields",
            "object.child": "Vendor {{#label}} has an error: {{#reason}}",
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
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

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
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////Adding Vendor////////////////////////////////
exports.validateAddingVendor = (req, res, next) => {
  try {
    const schema = Joi.object({
      vendorName: Joi.string().min(4).trim().required().messages({
        'string.base': 'Vendor name must be a string.',
        'string.empty': 'Vendor name cannot be empty.',
        'string.min': 'Vendor name must be at least 4 characters long.',
        'any.required': 'Vendor name is required.',
      }),
      type: Joi.string().min(1).required().messages({
        'string.base': 'Type must be a string.',
        'string.empty': 'Type cannot be empty.',
        'string.min': 'Type must be at least 1 character long.',
        'any.required': 'Type is required.',
      }),
      apiUrl: Joi.string().uri().required().messages({
        'string.base': 'API URL must be a string.',
        'string.empty': 'API URL cannot be empty.',
        'string.uri': 'API URL must be a valid URL.',
        'any.required': 'API URL is required.',
      }),
      healthUrl: Joi.string().uri().optional().allow('').messages({
        'string.base': 'Health URL must be a string.',
        'string.uri': 'Health URL must be a valid URL.',
      }),
      state: Joi.string().optional().allow('').messages({
        'string.base': 'State must be a string.',
      }),
      gstNo: Joi.string().trim().uppercase().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/).optional().allow('').messages({
        'string.base': 'GST number must be a string.',
        'string.pattern.base': 'GST number must be a valid 15-character GSTIN.',
      }),
      address: Joi.string().max(500).optional().allow('').messages({
        'string.base': 'Address must be a string.',
        'string.max': 'Address must be at most 500 characters.',
      }),
      optional1: Joi.string().optional().allow(''),
      optional2: Joi.string().optional().allow(''),
      optional3: Joi.string().optional().allow(''),
      optional4: Joi.string().optional().allow(''),
      optional5: Joi.string().optional().allow(''),
      optional6: Joi.string().optional().allow(''),
      vendorEmail: Joi.array().items(Joi.string().email()).required().messages({
        'any.required': 'Peko email is required',
        'array.base': 'Peko email must be an array',
        'array.empty': 'Peko email cannot be empty',
        'string.email': 'Peko email must be a valid email address',
        'string.base': 'Peko email must be a valid email address',
        'array.sparse': 'Peko email must be a valid email address',
      }),
      optionals: Joi.object().optional()
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

/////////////////////Updating Vendor////////////////////////////////
exports.validateUpdatingVendor = (req, res, next) => {
  try {
    let schema = Joi.object({
      vendorName: Joi.string().min(4).trim().required().messages({
        'string.base': 'Vendor name must be a string.',
        'string.empty': 'Vendor name cannot be empty.',
        'string.min': 'Vendor name must be at least 4 characters long.',
        'any.required': 'Vendor name is required.',
      }),
      type: Joi.string().min(1).required().messages({
        'string.base': 'Type must be a string.',
        'string.empty': 'Type cannot be empty.',
        'string.min': 'Type must be at least 1 character long.',
        'any.required': 'Type is required.',
      }),
      apiUrl: Joi.string().uri().required().messages({
        'string.base': 'API URL must be a string.',
        'string.empty': 'API URL cannot be empty.',
        'string.uri': 'API URL must be a valid URL.',
        'any.required': 'API URL is required.',
      }),
      healthUrl: Joi.string().uri().optional().allow('').messages({
        'string.base': 'Health URL must be a string.',
        'string.uri': 'Health URL must be a valid URL.',
      }),
      state: Joi.string().optional().allow('').messages({
        'string.base': 'State must be a string.',
      }),
      gstNo: Joi.string().trim().uppercase().pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/).optional().allow('').messages({
        'string.base': 'GST number must be a string.',
        'string.pattern.base': 'GST number must be a valid 15-character GSTIN.',
      }),
      address: Joi.string().max(500).optional().allow('').messages({
        'string.base': 'Address must be a string.',
        'string.max': 'Address must be at most 500 characters.',
      }),
      optional1: Joi.string().optional().allow(''),
      optional2: Joi.string().optional().allow(''),
      optional3: Joi.string().optional().allow(''),
      optional4: Joi.string().optional().allow(''),
      optional5: Joi.string().optional().allow(''),
      optional6: Joi.string().optional().allow(''),
      vendorEmail: Joi.array().items(Joi.string().email()).single().required().messages({
        'any.required': 'Peko email is required',
        'array.base': 'Peko email must be an array',
        'array.empty': 'Peko email cannot be empty',
        'string.email': 'Peko email must be a valid email address',
        'string.base': 'Peko email must be a valid email address',
        'array.sparse': 'Peko email must be a valid email address',
      }),
      optionals: Joi.object().optional()
    });
    if (req.method === 'PUT') {
      schema = schema.keys({
        id: Joi.number().optional().messages({
          'number.empty': 'id cannot be empty',
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

exports.validateUpdateVendorStatus = (req, res, next) => {
  try {
    const schema = Joi.object({
      isActive: Joi.boolean().required().messages({
        'boolean.base': 'isActive must be a boolean.',
        'any.required': 'isActive is required.',
      }),
      vendorId: Joi.number().optional(),
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

////////////////////Adding Sign Up////////////////////////////////
exports.validateAddingSignUp = (req, res, next) => {
  try {
    const schema = Joi.object({
      firstName: Joi.string().min(3).required(),
      lastName: Joi.string().min(3).required(),
      password: Joi.string().min(8).required(),
      designation: Joi.string().min(2).required(),
      mobileNo: Joi.string().min(9).required(),
      companySize: Joi.string().min(1).required(),
      email: Joi.string().min(6).required().email(),
      name: Joi.string().min(1).required(),
      country: Joi.string().min(1).required(),
      countryCode: Joi.string().min(1).required(),
      city: Joi.string().min(4).required(),
      panNumber: Joi.string().min(6).max(10).required(),
      gstNumber: Joi.string().min(6).max(15).required(),
      gstOtp: Joi.string().min(6).required(),
      _csrf: Joi.string().optional(),
      referralCode: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////Updating Sign Up////////////////////////////////
exports.validateUpdatingSignUp = (req, res, next) => {
  try {
    const schema = Joi.object({
      firstName: Joi.string().min(1).optional(),
      username: Joi.string().min(1).optional(),
      name: Joi.string().min(1).optional(),
      address: Joi.string().min(1).optional(),
      status: Joi.string().min(1).optional(),
      lastName: Joi.string().min(1).optional(),
      designation: Joi.string().min(1).optional(),
      mobileNo: Joi.string().min(7).optional(),
      companySize: Joi.string().min(1).optional(),
      email: Joi.string().min(6).optional().email(),
      companyName: Joi.string().min(1).optional(),
      country: Joi.string().min(1).optional(),
      countryCode: Joi.string().min(1).optional(),
      city: Joi.string().min(1).optional(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////Updating  Up////////////////////////////////
exports.validateUpdatingMessage = (req, res, next) => {
  try {
    /* const schema = Joi.object({
             username: Joi.string().min(6).optional(),
             firstName: Joi.string().min(3).optional(),
             lastName: Joi.string().min(3).optional(),
             emailId: Joi.string().min(6).optional().email(),
             phoneNo: Joi.string().min(7).optional(),
             businessRegNo: Joi.string().min(5).optional(),
             contactPersonName: Joi.string().min(6).optional(),
             contactPersonNumber: Joi.string().min(7).optional(),
             address: Joi.string().min(6).optional(),
             companyName: Joi.string().min(3).optional(),
             country: Joi.string().min(3).optional(),
             countryCode: Joi.string().min(1).optional(),
             city: Joi.string().min(3).optional(),
             currency: Joi.string().min(3).optional(),
             status: Joi.string().optional()
         });*/
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////Updating  Up////////////////////////////////
exports.validateSystemServer = (req, res, next) => {
  try {
    /* const schema = Joi.object({
             username: Joi.string().min(6).optional(),
             firstName: Joi.string().min(3).optional(),
             lastName: Joi.string().min(3).optional(),
             emailId: Joi.string().min(6).optional().email(),
             phoneNo: Joi.string().min(7).optional(),
             businessRegNo: Joi.string().min(5).optional(),
             contactPersonName: Joi.string().min(6).optional(),
             contactPersonNumber: Joi.string().min(7).optional(),
             address: Joi.string().min(6).optional(),
             companyName: Joi.string().min(3).optional(),
             country: Joi.string().min(3).optional(),
             countryCode: Joi.string().min(1).optional(),
             city: Joi.string().min(3).optional(),
             currency: Joi.string().min(3).optional(),
             status: Joi.string().optional()
         });*/
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////Adding  Document////////////////////////////////
exports.validateAddingDocument = (req, res, next) => {
  try {
    const schema = Joi.object({
      documentType: Joi.string().required(),
      documentName: Joi.string().required(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////Updating  Document////////////////////////////////
exports.validateUpdateDocument = (req, res, next) => {
  try {
    const schema = Joi.object({
      documentId: Joi.string().required(),
      documentType: Joi.string().required(),
      documentName: Joi.string().required(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////Adding  Cashback  Up////////////////////////////////
exports.validateAddingCashback = (req, res, next) => {
  try {
    const schema = Joi.object({
      packageId: Joi.string().required(),
      serviceOperatorId: Joi.string().required(),
      cashbackType: Joi.string().required(),
      cashback: Joi.number().required(),
      surcharge: Joi.number().required(),
      serviceStatus: Joi.string().optional(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};
////////////////////Updating Cashback  Up////////////////////////////////
////////////////////Adding  Cashback  Up////////////////////////////////
exports.validateAddingDisableService = (req, res, next) => {
  try {
    const schema = Joi.object({
      credentialId: Joi.string().required(),
      serviceOperatorId: Joi.string().required(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};
////////////////////Updating Cashback  Up////////////////////////////////
exports.validateupdateCashback = (req, res, next) => {
  try {
    /* const schema = Joi.object({
             username: Joi.string().min(6).optional(),
             firstName: Joi.string().min(3).optional(),
             lastName: Joi.string().min(3).optional(),
             emailId: Joi.string().min(6).optional().email(),
             phoneNo: Joi.string().min(7).optional(),
             businessRegNo: Joi.string().min(5).optional(),
             contactPersonName: Joi.string().min(6).optional(),
             contactPersonNumber: Joi.string().min(7).optional(),
             address: Joi.string().min(6).optional(),
             companyName: Joi.string().min(3).optional(),
             country: Joi.string().min(3).optional(),
             countryCode: Joi.string().min(1).optional(),
             city: Joi.string().min(3).optional(),
             currency: Joi.string().min(3).optional(),
             status: Joi.string().optional()
         });*/
    const schema = Joi.object({
      packageId: Joi.string().required(),
      serviceOperatorId: Joi.string().required(),
      cashbackType: Joi.string().optional(),
      cashback: Joi.number().min(0).optional(),
      surcharge: Joi.number().min(0).optional(),
      // serviceStatus: Joi.string().optional(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////Updating Cashback  Up////////////////////////////////
////////////////////Updating Cashback  Up////////////////////////////////
exports.validateSelfTransfer = (req, res, next) => {
  try {
    const schema = Joi.object({
      credentialId: Joi.string().min(1).required(),
      type: Joi.string().min(3).required(),
      amount: Joi.string().min(1).required(),
      password: Joi.string().min(4).max(20).required(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////Updating Cashback  Up////////////////////////////////
////////////////////validateTransferFunds////////////////////////////////
exports.validateTransferFunds = (req, res, next) => {
  try {
    const schema = Joi.object({
      credentialId: Joi.string().required(),
      amount: Joi.string().min(1).required(),
      password: Joi.string().min(3).required(),
      remarks: Joi.string().min(6).required(),
      type: Joi.string().required(),
      _csrf: Joi.string().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////validateTransferFunds///////////////////////////////

////////////////////validate Password////////////////////////////////
exports.validatePassword = (req, res, next) => {
  try {
    const schema = Joi.object({
      oldPassword: Joi.string(),
      newPassword: Joi.string(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////validate Password////////////////////////////////

////////////////////validate Payment////////////////////////////////
exports.validatePayment = (req, res, next) => {
  try {
    /* const schema = Joi.object({
             username: Joi.string().min(6).optional(),
             firstName: Joi.string().min(3).optional(),
             lastName: Joi.string().min(3).optional(),
             emailId: Joi.string().min(6).optional().email(),
             phoneNo: Joi.string().min(7).optional(),
             businessRegNo: Joi.string().min(5).optional(),
             contactPersonName: Joi.string().min(6).optional(),
             contactPersonNumber: Joi.string().min(7).optional(),
             address: Joi.string().min(6).optional(),
             companyName: Joi.string().min(3).optional(),
             country: Joi.string().min(3).optional(),
             countryCode: Joi.string().min(1).optional(),
             city: Joi.string().min(3).optional(),
             currency: Joi.string().min(3).optional(),
             status: Joi.string().optional()
         });*/
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////validate Password////////////////////////////////

////////////////////validate Payment////////////////////////////////
exports.validateCreateMessage = (req, res, next) => {
  try {
    /* const schema = Joi.object({
             username: Joi.string().min(6).optional(),
             firstName: Joi.string().min(3).optional(),
             lastName: Joi.string().min(3).optional(),
             emailId: Joi.string().min(6).optional().email(),
             phoneNo: Joi.string().min(7).optional(),
             businessRegNo: Joi.string().min(5).optional(),
             contactPersonName: Joi.string().min(6).optional(),
             contactPersonNumber: Joi.string().min(7).optional(),
             address: Joi.string().min(6).optional(),
             companyName: Joi.string().min(3).optional(),
             country: Joi.string().min(3).optional(),
             countryCode: Joi.string().min(1).optional(),
             city: Joi.string().min(3).optional(),
             currency: Joi.string().min(3).optional(),
             status: Joi.string().optional()
         });*/
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

////////////////////validate Password////////////////////////////////

////////////////////VALIDATING GIFT CARD UPLOAD////////////////////////////////

exports.validatePreOrderCheck = (req, res, next) => {
  try {
    const schema = Joi.object({
      items: Joi.array()
        .items(
          Joi.object({
            product_id: Joi.number().integer().required().messages({
              'number.base': 'Product ID must be a number',
              'number.integer': 'Product ID must be an integer',
              'any.required': 'Product ID is required',
            }),
            mrp: Joi.number().min(0).required().messages({
              'number.base': 'MRP must be a number',
              'number.min': 'MRP cannot be negative',
              'any.required': 'MRP is required',
            }),
            selling_price: Joi.number().min(0).required().messages({
              'number.base': 'Selling Price must be a number',
              'number.min': 'Selling Price cannot be negative',
              'any.required': 'Selling Price is required',
            }),
            qty: Joi.number().integer().min(1).required().messages({
              'number.base': 'Quantity must be a number',
              'number.integer': 'Quantity must be an integer',
              'number.min': 'Quantity must be at least 1',
              'any.required': 'Quantity is required',
            }),
          })
        )
        .required()
        .messages({
          'array.base': 'Items must be an array',
          'array.empty': 'Items cannot be empty',
          'any.required': 'Items are required',
        }),

      total_selling_price: Joi.number().min(0).required().messages({
        'number.base': 'Total Selling Price must be a number',
        'number.min': 'Total Selling Price cannot be negative',
        'any.required': 'Total Selling Price is required',
      }),

      credentialId: Joi.number().integer().positive().required().messages({
        'number.base': 'Credential ID must be a number',
        'number.integer': 'Credential ID must be an integer',
        'number.positive': 'Credential ID must be a positive number',
        'any.required': 'Credential ID is required',
      }),

      userType: Joi.string().valid('corporate').required().messages({
        'string.base': 'User Type must be a string',
        'string.empty': 'User Type cannot be empty',
        'any.only': 'User Type must be "corporate"',
        'any.required': 'User Type is required',
      }),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (error) {
    error.code ? console.log(`🚀 ~Error:${error.message}`) : console.log(error);
    next(error);
  }
};
exports.validateGiftCardPayment = (req, res, next) => {
  console.log();
  try {
    const schema = Joi.object({
      first_name: Joi.string().min(1).allow('').optional().messages({
        'string.base': 'Receiver First Name must be a string',
      }),
      giftCardId: Joi.number().integer().required().messages({
        'number.base': 'Product ID must be a number',
        'number.integer': 'Product ID must be an integer',
        'any.required': 'Product ID is required',
      }),
      amount: Joi.number().greater(0).required().messages({
        'number.base': 'MRP must be a number',
        'number.greater': 'MRP must be greater than 0',
        'any.required': 'MRP is required',
      }),
      number_of_items: Joi.number().integer().min(1).required().messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
        'any.required': 'Quantity is required',
      }),

      email: Joi.string().min(1).allow('').optional().messages({
        'string.base': 'Receiver Email must be a string',
       
      }),

      senderName: Joi.string().min(1).required().messages({
        'string.base': 'Sender Name must be a string',
        'string.empty': 'Sender Name cannot be empty',
        'any.required': 'Sender Name is required',
      }),
      accessKey: Joi.string().min(1).required().messages({
        'string.empty': 'accessKey  cannot be empty',
        'any.required': 'accessKey is required',
      }),

      message: Joi.string().allow("").optional().messages({
        'string.base': 'Message must be a string',
      }),
        orderType: Joi.string().valid('buyForSelf', 'bulkPurchase', 'buyForOther', 'buyForEmployees').required().messages({
        'string.base': 'Order Type must be a string',
        'any.only': 'Order Type must be one of: buyForSelf, bulkPurchase, buyForOther, buyForEmployees',
        'any.required': 'Order Type is required',
      }),
      employee: Joi.array().items(Joi.object()).optional().messages({
        'array.base': 'Employee must be an array',
      }),
      load_amount: Joi.number().min(0).optional().messages({
        'number.base': 'Load amount must be a number',
        'number.min': 'Load amount cannot be negative',
      }),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    next();
  } catch (error) {
    error.code ? console.log(`🚀 ~Error:${error.message}`) : console.log(error);
    next(error);
  }
};
exports.validateGiftCard = (req, res, next) => {
  console.log(req.body);
  try {
    const schema = Joi.object({
      merchant_id: Joi.string().allow(''),
      merchant_name: Joi.string().allow(''),
      product_id: Joi.required(),
      product_name: Joi.string().trim().required(),
      // brand_name, brand_logo, expiry are no longer sent by the FE on create/update.
      brand_name: Joi.string().allow('').optional(),
      brand_logo: Joi.alternatives()
        .try(
          Joi.string().allow(''),
          Joi.object({
            imageBase: Joi.string().required(),
            imageFormat: Joi.string().required(),
          })
        )
        .optional(),
      expiry: Joi.optional(),
      priceType: Joi.string().valid('FIXED', 'FLEXI').optional(),
      // min_price/max_price are only sent (and required) for FLEXI price type;
      // FIXED price type instead sends denominations.
      min_price: Joi.when('priceType', {
        is: 'FLEXI',
        then: Joi.number().required(),
        otherwise: Joi.number().optional(),
      }),
      max_price: Joi.when('priceType', {
        is: 'FLEXI',
        then: Joi.number().required(),
        otherwise: Joi.number().optional(),
      }),
      denominations: Joi.when('priceType', {
        is: 'FIXED',
        then: Joi.array()
          .items(Joi.number().required())
          .required()
          .error(() => {
            return {
              message: 'Denominations are required and must be an array of numbers for FIXED price type.',
            };
          }),
        otherwise: Joi.array()
          .items(Joi.number())
          .default([])
          .error(() => {
            return {
              message: 'Denominations must be an array of numbers.',
            };
          }),
      }),
      // activation_fee: Joi.when('serviceOperatorId', {
      //     is: 43,
      //     then: Joi.number().precision(2).required(),
      //     otherwise: Joi.optional()
      // }),
      // currency: Joi.string().valid('INR').required(),
      is_open_denominnation: Joi.boolean().optional(),
      // Usage type is routed to exactly one of these two keys by the FE, never both:
      // gv_type for existing Edenred records, usageType for everything else.
      gv_type: Joi.string().valid('ONLINE', 'OFFLINE', 'OMNI-CHANNEL').optional(),
      usageType: Joi.string().valid('ONLINE', 'OFFLINE', 'Both').optional(),
      // terms_and_condition: Joi.string().optional(),
      // how_to_redeem: Joi.string().optional(),
      status: Joi.boolean().optional(),
      _csrf: Joi.string().optional(),
      commissionMode: Joi.string().valid('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP').optional(),
      commissionType: Joi.string().valid('PERCENTAGE', 'FLAT').optional(),
      commission: Joi.number().min(0).optional(),
      fixedCommissionPerTransaction: Joi.number().min(0).optional(),
      isCommissionInclGST: Joi.boolean().optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: [result.error.details[0].message],
      });
    }
    if (parseFloat(req.body.min_price) > parseFloat(req.body.max_price)) {
      return res.status(203).json({
        code: 203,
        status: 'error',
        errors: ['Min denomination must be less than max denomination'],
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    res.json({
      code: err.code,
      status: 'error',
      errors: [err.message],
    });
  }
};

exports.validateActiveStatus = (req, res, next) => {
  try {
    const schema = Joi.object({
      status: Joi.boolean().required().messages({
        'boolean.base': 'status must be a boolean.',
        'any.required': 'status is required.',
      }),
      serviceOperatorId: Joi.number().optional().messages({
        'number.base': 'ID must be a number.',
      }),
      prodId: Joi.number().optional().messages({
        'number.base': 'ID must be a number.',
      }),
      subscriptionId: Joi.number().optional().messages({
        'number.base': 'ID must be a number.',
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

////////////////////VALIDATING GIFT CARD BULK UPLOAD////////////////////////////////
exports.validateBulkUploadsGiftCards = (req, res, next) => {
  if (!req.excelToJsonData) {
    return next(new ErrorResponse(`Something went wrong!`, 200));
  }
  const jsonData = req.excelToJsonData;
  console.log({
    jsonData,
  });

  try {
    const schema = Joi.object({
      serviceOperatorId: Joi.number().valid(15, 35, 43).required(),
      product_id: Joi.required(),
      brand_code: Joi.when('serviceOperatorId', {
        is: 35,
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
      name: Joi.string().trim().required(),
      image: Joi.string().required(),
      priceType: Joi.string().valid('FIXED', 'FLEXI').required(),
      denominations: Joi.when('priceType', {
        is: 'FIXED',
        then: Joi.array()
          .items(Joi.number().required())
          .required()
          .error(() => {
            return {
              message: 'Denominations are required and must be an array of numbers for FIXED price type.',
            };
          }),
        otherwise: Joi.array()
          .items(Joi.number())
          .default([])
          .error(() => {
            return {
              message: 'Denominations must be an array of numbers.',
            };
          }),
      }),
      minDenomination: Joi.when('priceType', {
        is: 'FIXED',
        then: Joi.number()
          .valid(Joi.ref('denominations'))
          .required()
          .min(Joi.ref('denominations'))
          .error(() => {
            return {
              message: 'minDenomination must be the minimum value in the denominations array for FIXED price type.',
            };
          }),
        otherwise: Joi.number().required(),
      }),
      maxDenomination: Joi.when('priceType', {
        is: 'FIXED',
        then: Joi.number()
          .valid(Joi.ref('denominations'))
          .required()
          .max(Joi.ref('denominations'))
          .error(() => {
            return {
              message: 'maxDenomination must be the maximum value in the denominations array for FIXED price type.',
            };
          }),
        otherwise: Joi.number().required(),
      }),
      activation_fee: Joi.when('serviceOperatorId', {
        is: 43,
        then: Joi.number().precision(2).required(),
        otherwise: Joi.number().precision(2).optional(),
      }),
      currency: Joi.string().valid('INR').required(),
      description: Joi.string().optional(),
      redemption_instructions: Joi.string().optional(),
    });

    const validationErrors = [];

    for (const [index, item] of jsonData.entries()) {
      if (typeof item.denominations === 'string') {
        const denominationsArray = item.denominations.split(',').map(Number);
        item.denominations = denominationsArray;
      } else {
        item.denominations = [];
      }

      const result = schema.validate(item);
      if (result.error) {
        validationErrors.push(`${result.error.details[0].message} in ${index + 2} row`);
      } else {
        if (item.priceType === 'FIXED') {
          const [min, max] = findMinAndMax(item.denominations);
          item.minDenomination = min;
          item.maxDenomination = max;
        }
      }
    }
    //next check duplicate entries with the array of gift cards(ie, product_id, brand_code, name should be unique to each serviceOperator)
    let duplicates = findDuplicates(jsonData);
    if (duplicates.length > 0) {
      duplicates.forEach((element) => {
        validationErrors.push(`${element.name} is a duplicate Entry`);
      });
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        code: 400,
        status: 'error',
        errors: validationErrors,
      });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 500,
      status: 'error',
      errors: ['Internal Server Error'],
    });
  }

  function findDuplicates(arr) {
    const duplicates = [];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (
          arr[i].serviceOperatorId == arr[j].serviceOperatorId &&
          (arr[i].product_id == arr[j].product_id || arr[i].name == arr[j].name || arr[i].brand_code == arr[j].brand_code)
        ) {
          duplicates.push(arr[j]);
        }
      }
    }
    return duplicates;
  }

  function findMinAndMax(arr) {
    if (arr.length === 0) {
      return [undefined, undefined];
    }
    let min = parseFloat(arr[0]);
    let max = parseFloat(arr[0]);

    for (let i = 1; i < arr.length; i++) {
      let x = parseFloat(arr[i]);
      if (x < min) {
        min = x;
      } else if (x > max) {
        max = x;
      }
    }
    return [min, max];
  }
};

exports.validateUpdateOrder = (req, res, next) => {
  try {
    const schema = Joi.object({
      ecomOrderStatus: Joi.string().required(),
      selectedVendor: Joi.object().required(),
      trackingDetails: Joi.object().optional(),
      cancelReason: Joi.string().allow('').optional(),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      return res.status(400).json({
        status: false,
        message: result.error.details[0].message,
        data: {},
        responseCode: '001',
      });
    }
    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    return res.status(400).json({
      status: false,
      message: 'Something went wrong',
      data: {},
      responseCode: '001',
    });
  }
};

exports.validateBulkProducts = (req, res, next) => {
  if (!req.body.productsJsonData) {
    return next(new ErrorResponse(`Products data not found`, 400));
  }
  const productsJsonData = req.body.productsJsonData;
  try {
    const schema = Joi.object({
      name: Joi.string()
        .trim()
        .required()
        .min(3)
        .messages({
          "any.required": "Product name is required",
          "string.empty": "Product name cannot be empty",
          "string.min": "Product name must be at least 3 characters long",
        })
        .custom((value, helpers) => {
          if (/^\s/.test(value)) {
            return helpers.message("Product name cannot start with whitespace");
          }
          if (/\s{2,}/.test(value)) {
            return helpers.message("Product name cannot contain consecutive whitespaces");
          }
          if (/^\s*$/.test(value)) {
            return helpers.message("Product name cannot be only whitespace");
          }
          return value;
        }),
      brand: Joi.string().trim().required().min(3).messages({
        "any.required": "Brand name is required",
        "string.empty": "Brand name cannot be empty",
        "string.min": "Brand name must be at least 3 characters long",
      }),
      categoryName: Joi.string().trim().required().messages({
        "any.required": "Category name is required",
        "string.empty": "Category name cannot be empty",
      }),
      description: Joi.string().trim().required().min(3).messages({
        "any.required": "Description is required",
        "string.empty": "Description cannot be empty",
        "string.min": "Description must be at least 3 characters long",
      }),
      highlights: Joi.string().trim().required().min(3).messages({
        "any.required": "Highlights are required",
        "string.empty": "Highlights cannot be empty",
        "string.min": "Highlights must be at least 3 characters long",
      }),
      warranty: Joi.string().trim().optional(),
      SKUCode: Joi.string().trim().optional(),

      actualPrice: Joi.number().required().messages({
        "any.required": "Price is required",
        "number.base": "Price must be a number",
      }),
      price: Joi.number().optional().min(0).max(Joi.ref("actualPrice")).messages({
        "number.base": "Price must be a number",
        "number.min": "Price cannot be less than 0",
        "number.max": "Price cannot be greater than actual price",
      }),
      quantity: Joi.number().required().messages({
        "any.required": "Quantity is required",
        "number.base": "Quantity must be a number",
      }),

      discountType: Joi.string().valid("PERCENTAGE", "FLAT").required().messages({
        "any.required": "Discount type is required",
        "any.only": 'Discount type should be either "PERCENTAGE" or "FLAT"',
      }),
      discount: Joi.number().when("discountType", {
        is: "PERCENTAGE",
        then: Joi.number().min(0).max(100).required().messages({
          "any.required": "Percentage discount amount is required",
          "number.base": "Percentage discount must be a number",
          "number.min": "Percentage discount cannot be less than 0%",
          "number.max": "Percentage discount cannot be greater than 100%",
        }),
        otherwise: Joi.number().min(0).max(Joi.ref("actualPrice")).required().messages({
          "any.required": "Discount amount is required",
          "number.base": "Discount must be a number",
          "number.min": "Discount cannot be less than 0",
          "number.max": "Discount cannot be greater than actual price",
        }),
      }),

      gstType: Joi.string().valid("PERCENTAGE", "CUSTOM").required().messages({
        "any.required": "GST type is required",
        "any.only": 'GST type should be either "PERCENTAGE" or "CUSTOM"',
      }),

      GST: Joi.number().when("gstType", {
        is: "PERCENTAGE",
        then: Joi.number().min(0).max(100).required().messages({
          "any.required": "Percentage GST amount is required",
          "number.base": "Percentage GST must be a number",
          "number.min": "Percentage GST cannot be less than 0",
          "number.max": "Percentage GST cannot be greater than 100",
        }),
        otherwise: Joi.number().min(0).required().messages({
          "any.required": "GST amount is required",
          "number.base": "GST must be a number",
          "number.min": "GST cannot be less than 0",
        }),
      }),

      vendorName: Joi.string().trim().required().messages({
        "any.required": "Vendor name is required",
        "string.empty": "Vendor name cannot be empty",
      }),
      vendorPrice: Joi.number().required().messages({
        "any.required": "Vendor price is required",
        "number.base": "Vendor price must be a number",
      }),

      productImage1: Joi.string().uri().optional().allow("").messages({
        "string.uri": "Product image 1 must be a valid URL",
      }),
      productImage2: Joi.string().uri().optional().allow("").messages({
        "string.uri": "Product image 2 must be a valid URL",
      }),
      productImage3: Joi.string().uri().optional().allow("").messages({
        "string.uri": "Product image 3 must be a valid URL",
      }),

      status: Joi.boolean().optional(),
      errors: Joi.array().optional(),
      TID: Joi.number().optional(),
    });

    const productNameMap = {};
    for (const [index, item] of productsJsonData.entries()) {
      item.status = true;
      item.errors = [];
      delete item.categoryId;
      delete item.vendors;

      const { error } = schema.validate(item, { abortEarly: false });
      if (error && error?.details) {
        item.status = false;
        error.details.forEach((v, i) => {
          item.errors.push(v.message);
        });
      }
      //avoid duplicate product names in excel sheet
      if (productNameMap[item.name]) {
        item.status = false;
        item.errors.push(`${item.name} is a duplicate name, please change`);
      } else {
        productNameMap[item.name] = true;
      }
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse(`Something went wrong!`, 200));
  }
};

exports.validateSoftware = (req, res, next) => {
  try {
    const fileUploadMaxSize = 500; //500 kb
    let schema = Joi.object({
      name: Joi.string().trim().min(3).required().messages({
        'any.required': 'Name is required',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 3 characters long',
      }),

      description: Joi.string().trim().required().min(3).messages({
        'any.required': 'Description is required',
        'string.empty': 'Description cannot be empty',
        'string.min': 'Description must be at least 3 characters long',
      }),
      discount: Joi.string()
        .allow('')
        .optional()
        .custom((value, helpers) => {
          if (value === '') {
            return value;
          }
          const number = parseFloat(value);
          if (isNaN(number) || number < 0) {
            return helpers.error('any.invalid');
          }
          return value;
        })
        .messages({
          'string.base': 'Discount must be a string.',
          'any.invalid': 'Discount must be a non-negative number.',
        }),
      features: Joi.string().trim().required().min(3).messages({
        'any.required': 'Features are required',
        'string.empty': 'Features cannot be empty',
        'string.min': 'Features must be at least 3 characters long',
      }),
      pekoEmail: Joi.array().items(Joi.string().email()).single().required().messages({
        'any.required': 'Peko email is required',
        'array.base': 'Peko email must be an array',
        'array.empty': 'Peko email cannot be empty',
        'string.email': 'Peko email must be a valid email address',
        'string.base': 'Peko email must be a valid email address',
        'array.sparse': 'Peko email must be a valid email address',
      }),

      sendMail: Joi.alternatives().try(
        Joi.boolean().optional().messages({
          'boolean.base': 'Send Email must be a boolean value',
        }),
        Joi.number().optional().messages({
          'number.base': 'Send Email must be a number',
        })
      ),
      sendVendorMail: Joi.alternatives().try(
        Joi.boolean().optional().messages({
          'boolean.base': 'Send Email must be a boolean value',
        }),
        Joi.number().optional().messages({
          'number.base': 'Send Email must be a number',
        })
      ),

      typeOfOrder: Joi.string().valid('MANUAL', 'API').required().messages({
        'any.required': 'Type of order is required',
        'any.only': 'Type of order should be either MANUAL or API',
      }),
      vendorId: Joi.number().required().messages({
        'any.required': 'Vendor ID is required',
        'number.base': 'Vendor ID must be a number',
      }),
      categoryId: Joi.number().required().messages({
        'any.required': 'Category ID is required',
        'number.base': 'Category ID must be a number',
      }),
      categoryName: Joi.string().allow('').optional().messages({
        'string.base': 'Category Name must be a string',
        'any.only': 'Category Name be a valid string value',
      }),
      image: Joi.alternatives()
        .conditional(Joi.string().base64().required(), {
          then: Joi.string().allow('').required(),
          otherwise: Joi.string().uri().allow(''),
        })
        .custom(fileSizeValidation(fileUploadMaxSize))
        .required()
        .messages({
          'any.required': 'Image is required',
          'string.empty': 'Image cannot be empty',
          'string.uri': 'Image must be a valid URI',
          'string.base64': 'Image must be a base64 encoded string',
        }),
      imageFormat: Joi.when('image', {
        is: Joi.string().base64(),
        then: Joi.string().valid('png', 'jpg', 'jpeg').required(),
        otherwise: Joi.allow(null, ''),
      }),
      productId: Joi.string().trim().optional().messages({
        'string.empty': 'Product id cannot be empty',
      }),
    });

    if (req.method === 'PUT') {
      schema = schema.keys({
        id: Joi.number().optional().messages({
          'number.empty': 'id cannot be empty',
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

exports.validateSoftwarePlan = (req, res, next) => {
  try {
    let schema = Joi.object({
      name: Joi.string().trim().min(3).required().messages({
        "any.required": "Name is required",
        "string.empty": "Name cannot be empty",
        "string.min": "Name must be at least 3 characters long",
      }),
      vendorPrice: Joi.number().required().min(1, 'number.greaterThanZero').messages({
        'any.required': 'Vendor price is required',
        'number.base': 'Vendor price must be a number',
        'number.greaterThanZero': 'Vendor price cannot be zero',
        'string.empty': 'Vendor price cannot be empty',
      }),

      price: Joi.number().required().custom(priceGreaterThanVendorPrice).messages({
        "any.required": "Price is required",
        "number.base": "Price must be a number",
        "string.empty": "Price cannot be empty",
      }),
      validity: Joi.string().trim().required().messages({
        "any.required": "Validity is required",
        "string.empty": "Validity cannot be empty",
        "string.base": "Validity must be a string",
      }),
      discount: Joi.string()
        .allow("")
        .optional()
        .custom((value, helpers) => {
          if (value === "") {
            return value;
          }
          const number = parseFloat(value);
          if (isNaN(number) || number < 0) {
            return helpers.error("any.invalid");
          }
          return value;
        })
        .messages({
          "string.base": "Discount must be a string.",
          "any.invalid": "Discount must be a non-negative number.",
        }),
      gstType: Joi.string().valid("PERCENTAGE", "FLAT").required().messages({
        "any.required": "GST type is required",
        "any.only": 'GST type should be either "PERCENTAGE" or "FLAT"',
      }),
      GST: Joi.number().when("discountType", {
        is: "PERCENTAGE",
        then: Joi.number().min(0).max(100).required().messages({
          "any.required": "Percentage gst amount is required",
          "number.base": "Percentage gst must be a number",
          "number.min": "Percentage gst cannot be less than 0%",
          "number.max": "Percentage gst cannot be greater than 100%",
        }),
        otherwise: Joi.number().min(0).required().messages({
          "any.required": "Custom gst amount is required",
          "number.base": "Custom gst must be a number",
          "number.min": "Custom gst cannot be less than 0",
        }),
      }),
      features: Joi.string().trim().min(3).required().messages({
        "any.required": "Features are required",
        "string.empty": "Features cannot be empty",
        "string.min": "Name must be at least 3 characters long",
      }),
      noOfUsers: Joi.number().integer().required().messages({
        "any.required": "No of users is required",
        "number.base": "No of users must be a valid number",
        "number.integer": "No of users must be a valid number",
        "number.unsafe": "No of users must be a valid number",
      }),
      softwareId: Joi.number().required().messages({
        "any.required": "Software Id is required",
        "string.empty": "Software Id cannot be empty",
      }),
      planId: Joi.string().trim().optional().messages({
        "string.empty": "Plan id cannot be empty",
      }),
    });
    if (req.method === "PUT") {
      schema = schema.keys({
        id: Joi.number().optional().messages({
          "string.empty": "Plan id cannot be empty",
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

const priceGreaterThanVendorPrice = (value, helpers) => {
  const vendorPrice = helpers.state.ancestors[0].vendorPrice;
  if (value <= vendorPrice) {
    return helpers.message('Customer price must be greater than vendor price');
  }
  return value;
};

exports.validateBulkSoftwarePlan = (req, res, next) => {
  if (!req.body.softwaresJsonData) {
    return next(new ErrorResponse(`Softwares plan data not found`, 400));
  }
  const softwaresJsonData = req.body.softwaresJsonData;
  try {
    const schema = Joi.object({
      planId: Joi.string().trim().required().messages({
        'any.required': 'Plan id is required',
        'string.empty': 'Plan id cannot be empty',
      }),
      name: Joi.string().trim().required().messages({
        'any.required': 'Name is required',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 3 characters long',
      }),
      vendorPrice: Joi.number().required().messages({
        'any.required': 'Vendor price is required',
        'number.base': 'Vendor price must be a number',
        'number.greaterThanZero': 'Vendor price cannot be zero',
        'string.empty': 'Vendor price cannot be empty',
      }),
      price: Joi.number().required().messages({
        'any.required': 'Price is required',
        'number.base': 'Price must be a number',
        'number.greaterThanZero': 'Price cannot be zero',
        'string.empty': 'Price cannot be empty',
      }),
      validity: Joi.string().trim().required().messages({
        'any.required': 'Validity is required',
        'string.empty': 'Validity cannot be empty',
        'string.base': 'Validity must be a string',
      }),
      discount: Joi.string().optional().messages({
        'string.base': 'Discount must be a string',
      }),
      features: Joi.string().trim().required().messages({
        'any.required': 'Features are required',
        'string.empty': 'Features cannot be empty',
        'string.min': 'Features must be at least 3 characters long',
      }),
      noOfUsers: Joi.string().trim().required().messages({
        'any.required': 'No of users are required',
        'number.base': 'No of users must be a valid number',
        'number.integer': 'No of users must be a valid number',
        'string.empty': 'No of users cannot be empty',
      }),
      software: Joi.string().trim().required().messages({
        'any.required': 'Software is required',
        'string.empty': 'Software cannot be empty',
      }),
      softwareId: Joi.number().optional(),
      TID: Joi.number().optional(),
      status: Joi.boolean().optional(),
      errors: Joi.array().optional(),
    });

    const softwareNameMap = {};
    const softwareplanIdMap = {};
    for (const [index, item] of softwaresJsonData.entries()) {
      item.status = true;
      item.errors = [];
      delete item.categoryId;
      // delete item.vendor

      const { error } = schema.validate(item, { abortEarly: false });
      if (error && error?.details) {
        item.status = false;
        error.details.forEach((v, i) => {
          item.errors.push(v.message);
        });
      }
      //avoid duplicate product names in excel sheet
      if (softwareNameMap[item.name]) {
        item.status = false;
        item.errors.push(`${item.name} is a duplicate name, please change`);
      } else {
        softwareNameMap[item.name] = true;
      }
      if (softwareplanIdMap[item.planId]) {
        item.status = false;
        if (item.planId) item.errors.push(`${item.planId} is a duplicate Plan ID, please change`);
      } else {
        softwareplanIdMap[item.planId] = true;
      }
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse(`Something went wrong!`, 200));
  }
};

exports.validateBulkSoftwares = (req, res, next) => {
  if (!req.body.softwaresJsonData) {
    return next(new ErrorResponse(`Softwares data not found`, 400));
  }
  const softwaresJsonData = req.body.softwaresJsonData;
  try {
    const schema = Joi.object({
      name: Joi.string().trim().required().messages({
        'any.required': 'Name is required',
        'string.empty': 'Name cannot be empty',
      }),
      productId: Joi.string().trim().required().messages({
        'any.required': 'Product id is required',
        'string.empty': 'Product id cannot be empty',
      }),
      description: Joi.string().trim().required().messages({
        'any.required': 'Description is required',
        'string.empty': 'Description cannot be empty',
        'string.min': 'Description must be at least 3 characters long',
      }),
      discount: Joi.string().optional().messages({
        'string.base': 'Discount must be a string',
        'any.only': 'Discount must be a valid string value',
      }),
      features: Joi.string().trim().required().messages({
        'any.required': 'Features are required',
        'string.empty': 'Features cannot be empty',
        'string.min': 'Features must be at least 3 characters long',
      }),
      pekoEmail: Joi.array().items(Joi.string().email()).required().messages({
        'any.required': 'Peko email is required',
        'array.base': 'Peko email must be an array',
        'array.empty': 'Peko email cannot be empty',
        'string.email': 'Peko email must be a valid email address',
        'string.base': 'Peko email must be a valid email address',
        'array.sparse': 'Peko email must be a valid email address',
      }),
      sendMail: Joi.boolean().optional().messages({
        'boolean.base': 'Send Email must be a boolean value',
      }),
      typeOfOrder: Joi.string().valid('MANUAL', 'API').required().messages({
        'any.required': 'Type of order is required',
        'any.only': 'Type of order should be either "MANUAL" or "API"',
      }),
      vendor: Joi.string().trim().required().messages({
        'any.required': 'Vendor are required',
        'string.empty': 'Vendor cannot be empty',
      }),
      vendorId: Joi.number().optional(),
      category: Joi.string().trim().required().messages({
        'any.required': 'Category are required',
        'string.empty': 'Category cannot be empty',
      }),
      categoryId: Joi.number().optional(),
      image: Joi.string().uri().optional().messages({
        'string.uri': 'Image must be a valid URL',
      }),
      status: Joi.boolean().optional(),
      errors: Joi.array().optional(),
      TID: Joi.number().optional(),
    });

    const softwareNameMap = {};
    const softwareIdMap = {};
    for (const [index, item] of softwaresJsonData.entries()) {
      item.status = true;
      item.errors = [];
      delete item.categoryId;
      // delete item.vendor

      const { error } = schema.validate(item, { abortEarly: false });
      if (error && error?.details) {
        item.status = false;
        error.details.forEach((v, i) => {
          item.errors.push(v.message);
        });
      }
      //avoid duplicate product names in excel sheet
      if (softwareNameMap[item.name]) {
        item.status = false;
        if (item.name) item.errors.push(`${item.name} is a duplicate Name, please change`);
      } else {
        softwareNameMap[item.name] = true;
      }
      if (softwareIdMap[item.productId]) {
        item.status = false;
        if (item.productId) item.errors.push(`${item.productId} is a duplicate Product ID, please change`);
      } else {
        softwareIdMap[item.productId] = true;
      }
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse(`Something went wrong!`, 200));
  }
};

exports.validateApplyCoupon = (req, res, next) => {
  try {
    const schema = Joi.object({
      couponCode: Joi.string().trim().required().messages({
        "string.base": "Coupon code must be a string.",
        "string.empty": "Coupon code cannot be empty.",
        "any.required": "Coupon code is required.",
      }),
      amount: Joi.number().positive().required().messages({
        "number.base": "Amount must be a number.",
        "number.positive": "Amount must be a positive number.",
        "any.required": "Amount is required.",
      }),
      packageId: Joi.number().messages({
        "number.base": "Package ID must be a number.",
      }),
      billingType: Joi.string()
        .valid("monthly", "annually") 
        .optional()
        .messages({
          "string.base": "Billing type must be a string",
          "any.only": "Billing type must be either 'monthly' or 'annually'",
        }),
      accessKey: Joi.string().messages({
        "string.base": "Access Key must be a string.",
      }),
    }).xor("packageId", "accessKey")

    const result = schema.validate(req.body, { abortEarly: false }); // Add abortEarly option to show all errors
    if (result.error) {
      // const errorMessage = result.error.details.map((detail) => detail.message).join("; ");
      return res.status(400).json({
        status: false,
        message: result.error.details[0].message,
        data: {},
        responseCode: "001",
      });
    }

    next();
  } catch (err) {
    customLog(req?.LogTraceId, "error", { message: "An error occurred", error: err });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
};

exports.validateActivationCode = (req, res, next) => {
  try {
    const schema = Joi.object({
      activationCode: Joi.string()
        .trim()
        .required()
        .regex(/^[A-Z0-9]{16}$/)
        .messages({
          "string.base": "Voucher code must be a string",
          "string.empty": "Voucher code is required",
          "string.pattern.base": "Voucher code must be exactly 16 characters long and contain only capitalized alphabets and numbers",
          "any.required": "Voucher code is required",
        }),
      billingType: Joi.string()
        .required()
        .valid("monthly", "annually")
        .messages({
          "string.base": "Billing type must be a string",
          "string.empty": "Billing type is required",
          "any.only": "Billing type must be either 'monthly' or 'annually'"
        }),
      packageId: Joi.number().required().messages({
        "string.base": "Package ID must be a string",
        "string.empty": "Package ID is required",
      })
    })
    const result = schema.validate(req.body);
    if (result.error) {
      throw new Error(result.error.details[0].message);
    }
    next();
  } catch (err) {
    next(err);
  }
};
  exports.validateNewActivationCode = (req, res, next) => {
    const method = req.method.toLowerCase();
  
    const schema = Joi.object({
      billingType: Joi.string().valid("MONTHLY", "ANNUALLY").required().messages({
        "string.base": "Billing Type must be a string",
        "any.only": "Billing Type must be either MONTHLY or ANNUALLY",
        "any.required": "Billing Type is required",
      }),
      packageId: Joi.number().required().messages({
        "number.base": "Package ID must be a number",
        "any.required": "Package ID is required",
      }),
      quantity: Joi.number().integer().min(1).required().messages({
        "number.base": "Quantity must be a number.",
        "number.integer": "Quantity must be an integer.",
        "number.min": "Quantity must be at least 1.",
        "any.required": "Quantity is required.",
      }),
    });
  
    const { error } = schema.validate(req.body, { abortEarly: false });
  
    if (error) {
      throw new Error(error.details[0].message);
    }
  
    next();
  };
  
  exports.validateActivationCodeStatus = (req, res, next) => {
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
const couponCodeFields = () => ({
    couponCode: Joi.string()
      .trim()
      .required()
      .pattern(/^[A-Za-z0-9]+$/)
        .min(5)
    .max(20)
      .messages({
        "string.base": "Coupon code must be a string.",
        "string.empty": "Coupon code cannot be empty.",
        "any.required": "Coupon code is required.",
         "string.pattern.base": "Coupon code must not contain spaces or special characters.",
      "string.min": "Coupon code must be at least 5 characters.",
      "string.max": "Coupon code must not exceed 20 characters.",
      }),
    discountType: Joi.string().valid("FLAT", "PERCENTAGE").default("PERCENTAGE").messages({
      "string.base": "Discount type must be a string.",
      "string.valid": "Discount type must be either FLAT or PERCENTAGE.",
    }),
      discount: Joi.number()
    .required()
    .min(0.01)
    .messages({
      "number.min": "Please enter a valid discount.",
    })
    .when("discountType", {
      is: "PERCENTAGE",
      then: Joi.number()
        .messages({
          "number.base": "Discount must be a number.",
        })
        .max(100)
        .messages({
          "number.max": "Discount must be at most 100.",
        }),
    }),
    couponType: Joi.string()
    .required()
    .valid("SERVICES", "SUBSCRIPTION")
    .messages({
      "string.base": "Coupon type must be a string.",
      "any.required": "Please select the coupon type.",
      "any.only": "Coupon type must be either SERVICES or SUBSCRIPTION.",
    }),
    validFrom: Joi.date().required().messages({
      "date.base": "Valid from must be a valid date.",
      "any.required": "Valid from date is required.",
    }),
    validTo: Joi.date().required().messages({
      "date.base": "Valid to must be a valid date.",
      "any.required": "Valid to date is required.",
    }),
    status: Joi.boolean().default(true).messages({
      "boolean.base": "Status must be a boolean value.",
    }),
   partnerId: Joi.number().allow(null).required().messages({
    "number.base": "Partner ID must be a number",
    "number.empty": "Partner ID is required",
  }),
  referralCodeId: Joi.number().allow(null).optional().messages({
    "number.base": "Referral Code must be a number",
  }),
   usageCount: Joi.number().required().min(1).messages({
    "number.base": "Usage count must be a number",
    "any.required": "Usage count is required",
    "number.min": "Usage count must be at least 1.",
  }),
  billingType: Joi.string()
    .valid("MONTHLY", "ANNUALLY")
    .when("couponType", {
      is: "SUBSCRIPTION",
      then: Joi.required().messages({
        "any.required": "Please select the billing type.",
        "any.only": "Billing type must be either MONTHLY or ANNUALLY.",
      }),
      otherwise: Joi.allow(null, "").optional(),
    })
    .messages({
      "string.base": "Billing type must be a string.",
      "any.only": "Billing type must be either MONTHLY or ANNUALLY.",
    }),
  packageId: Joi.number()
    .when("couponType", {
      is: "SUBSCRIPTION",
      then: Joi.required().messages({
        "any.required": "Please select a package.",
        "number.base": "Package ID must be a number.",
      }),
      otherwise: Joi.allow(null).optional(),
    }),
  minimumPurchase: Joi.number()
    .required()
    .min(0)
    .messages({
      "number.base": "Minimum purchase must be a number.",
      "any.required": "Minimum purchase is required.",
      "number.min": "Minimum purchase must be at least 0.",
    }),
  maximumDiscount: Joi.number()
    .min(0)
    .when("discountType", {
      is: "PERCENTAGE",
      then: Joi.required().messages({
        "any.required": "Maximum discount is required for percentage discount type.",
        "number.base": "Maximum discount must be a number.",
        "number.min": "Maximum discount must be at least 0.",
      }),
      otherwise: Joi.allow(null).optional(),
    }),
});

const couponDateError = (req, res) => {
  const { validFrom, validTo } = req.body;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (validFrom && new Date(validFrom) > new Date(validTo)) {
    return res.status(400).json({
      status: false,
      message: "Valid from date cannot be greater than valid to date.",
      data: {},
      responseCode: "001",
    });
  }

  if (validFrom && new Date(validFrom) < now) {
    return res.status(400).json({
      status: false,
      message: "Valid from date cannot be in the past.",
      data: { validFrom, now },
      responseCode: "001",
    });
  }

  if (validTo && new Date(validTo) < now) {
    return res.status(400).json({
      status: false,
      message: "Valid to date cannot be in the past.",
      data: { validTo, now },
      responseCode: "001",
    });
  }

  return null;
};

const validateCouponRequest = (schema) => (req, res, next) => {
  try {
    const result = schema.validate(req.body, { abortEarly: false });
    if (result.error) {
      return res.status(400).json({
        status: false,
        message: result.error.details[0].message,
        data: {},
        responseCode: "001",
      });
    }

    const dateError = couponDateError(req, res);
    if (dateError) return dateError;

    next();
  } catch (err) {
    err.code ? console.log(`Error:${err.message}`) : console.log(err);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
};

exports.validateCouponCode = validateCouponRequest(Joi.object({
  ...couponCodeFields(),
    serviceOperatorId: Joi.number()
      .when("couponType", {
        is: "SERVICES",
        then: Joi.required().messages({
          "any.required": "Please select the service operator.",
          "number.base": "Service operator ID must be a number.",
        }),
        otherwise: Joi.allow(null).optional(),
      }),
}));

exports.validateBulkCreateCouponCode = validateCouponRequest(Joi.object({
  ...couponCodeFields(),
  serviceOperatorIds: Joi.array()
    .items(Joi.number())
    .when("couponType", {
      is: "SERVICES",
      then: Joi.array().min(1).required().messages({
        "array.min": "Please select at least one service operator.",
        "any.required": "Please select at least one service operator.",
      }),
      otherwise: Joi.allow(null).optional(),
    })
    .messages({
      "array.base": "Service operators must be a list.",
      "number.base": "Service operator ID must be a number.",
    }),
}));

exports.validateHikePayment = (req, res, next) => {
  try {
    const schema = Joi.object({
      amount: Joi.number().positive().precision(2).required().messages({
        'any.required': 'Total amount is required',
        'number.base': 'Total amount must be a number',
        'number.positive': 'Total amount must be a positive number',
        'number.precision': 'Total amount must have at most 2 decimal places',
      }),
      payCashback: Joi.boolean().required().messages({
        'any.required': 'Pay cashback flag is required',
        'boolean.base': 'Pay cashback must be a boolean value (true or false)',
      }),
      selectedHikes: Joi.array()
        .items(
          Joi.object({
            id: Joi.number().integer().positive().required().messages({
              'any.required': 'Hike ID is required',
              'number.base': 'Hike ID must be a number',
              'number.integer': 'Hike ID must be an integer',
              'number.positive': 'Hike ID must be positive',
            }),
            quantity: Joi.number().integer().positive().required().messages({
              'any.required': 'Quantity is required',
              'number.base': 'Quantity must be a number',
              'number.integer': 'Quantity must be an integer',
              'number.positive': 'Quantity must be positive',
            }),
            price: Joi.number().positive().precision(2).required().messages({
              'any.required': 'Price is required',
              'number.base': 'Price must be a number',
              'number.positive': 'Price must be a positive number',
              'number.precision': 'Price must have at most 2 decimal places',
            }),
            hikeName: Joi.string().required().messages({
              'any.required': 'Hike name is required',
              'string.empty': 'Hike name cannot be empty',
            }),
            totalPrice: Joi.number().positive().precision(2).required().messages({
              'any.required': 'Total price is required',
              'number.base': 'Total price must be a number',
              'number.positive': 'Total price must be a positive number',
              'number.precision': 'Total price must have at most 2 decimal places',
            }),
            employees: Joi.array()
              .items(
                Joi.object({
                  name: Joi.string().required().messages({
                    'any.required': 'Employee name is required when employee is selected',
                    'string.empty': 'Employee name cannot be empty',
                  }),
                  employeeId: Joi.number().integer().positive().required().messages({
                    'any.required': 'Employee ID is required when employee is selected',
                    'number.base': 'Employee ID must be a number',
                    'number.integer': 'Employee ID must be an integer',
                    'number.positive': 'Employee ID must be positive',
                  }),
                })
              )
              .optional()
              .messages({
                'array.base': 'Employees must be an array of employee objects',
              }),
          })
        )
        .required()
        .messages({
          'any.required': 'Selected hikes are required',
          'array.base': 'Selected hikes must be an array of objects',
        }),
      accessKey: Joi.string().required().messages({
        'any.required': 'Access key is required',
        'string.empty': 'Access key cannot be empty',
      }),
    });

    // Validate request body against schema
    const result = schema.validate(req.body);
    if (result.error) {
      throw new Error(result.error.details[0].message);
    }

    // Proceed to the next middleware if validation succeeds
    next();
  } catch (err) {
    err.code ? console.log(`🚀 ~Error:${err.message}`) : console.log(err);
    next(err);
  }
};

  exports.validateHike = (req, res, next) => {
    try {
      const schema = Joi.object({
        name: Joi.string().trim().min(3).required().messages({
          "string.base": "Name must be a string",
          "string.empty": "Name cannot be empty",
          "string.min": "Name must be at least 3 characters long",
          "any.required": "Name is required",
        }),
        features: Joi.string().trim().min(3).required().messages({
          "string.base": "Features must be a string",
          "string.empty": "Features cannot be empty",
          "string.min": "Features must be at least 3 characters long",
          "any.required": "Features is required",
        }),
        logoBase: Joi.string().optional().allow("").messages({
          "string.base": "Logo base must be a string",
          "string.empty": "Logo base cannot be empty",
        }),
        logoFormat: Joi.string().optional().allow("").messages({
          "string.base": "Logo format must be a string",
          "string.empty": "Logo format cannot be empty",
        }),
        partnersBase: Joi.string().optional().allow("").messages({
          "string.base": "Partners base must be a string",
          "string.empty": "Partners base cannot be empty",
        }),
        partnersFormat: Joi.string().optional().allow("").messages({
          "string.base": "Partners format must be a string",
          "string.empty": "Partners format cannot be empty",
        }),
        planType: Joi.string().valid("MONTHLY", "YEARLY").required().messages({
          "string.base": "Plan type must be a string",
          "any.only": "Plan type must be either MONTHLY or YEARLY",
          "any.required": "Plan type is required",
        }),
        salaryAmount: Joi.number().required().messages({
          "number.base": "Salary amount must be a number",
          "any.required": "Salary amount is required",
        }),
        salaryValidation: Joi.string().valid("LESS_THAN", "GREATER_THAN").required().messages({
          "string.base": "Salary validation must be a string",
          "any.only": "Salary validation must be either LESS_THAN or GREATER_THAN",
          "any.required": "Salary validation is required",
        }),
        amount: Joi.number().required().messages({
          "number.base": "Amount must be a number",
          "any.required": "Amount is required",
        }),
        status: Joi.boolean().optional().messages({
          "boolean.base": "Status must be a boolean",
        }),
        logo: Joi.string().optional().allow("").messages({
          "string.base": "Logo must be a string",
          "string.empty": "Logo cannot be empty",
        }),
        partners: Joi.string().optional().allow("").messages({
          "string.base": "Partners must be a string",
          "string.empty": "Partners cannot be empty",
        }),
        credentialId: Joi.alternatives()
          .try(Joi.string(), Joi.number())
          .optional()
          .messages({
            "alternatives.types": "RegisteredBy must be either a string or a number.",
        }),
        commissionMode: Joi.string().valid('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP').optional(),
        commissionType: Joi.string().valid('PERCENTAGE', 'FLAT').optional(),
        commission: Joi.number().min(0).optional(),
        fixedCommissionPerTransaction: Joi.number().min(0).optional(),
        isCommissionInclGST: Joi.boolean().optional(),
      });

      const result = schema.validate(req.body);
      if (result.error) {
        throw new Error(result.error.details[0].message);
      }
      next();
    } catch (err) {
      next(err);
    }
  };


exports.validateEsim = (req, res, next) => {
  try {
    const schema = Joi.object({
      coverage: Joi.string().optional(),
      coverageId: Joi.string().trim().min(3).required().messages({
        'string.base': 'CoverageId must be a string',
        'string.empty': 'CoverageId cannot be empty',
        'string.min': 'CoverageId must be at least 3 characters long',
        'any.required': 'CoverageId is required',
      }),
      country: Joi.string().trim().min(2).required().messages({
        'string.base': 'Country must be a string',
        'string.empty': 'Country cannot be empty',
        'string.min': 'Country must be at least 3 characters long',
        'any.required': 'Country is required',
      }),
      dataMBs: Joi.number().optional().messages({
        'number.base': 'DataMBs must be a number.',
        'number.empty': 'DataMBs cannot be empty.',
      }),
      periodDays: Joi.number().optional().messages({
        'number.base': 'PeriodDays must be a number.',
        'number.empty': 'PeriodDays cannot be empty.',
      }),
      amount: Joi.number().positive().required().messages({
        'number.base': 'Amount must be a number.',
        'number.empty': 'Amount cannot be empty.',
        'number.positive': 'Amount must be a positive number.',
        'any.required': 'Amount is required.',
      }),
      networks: Joi.number().positive().required().messages({
        'number.base': 'networks must be a number.',
        'number.empty': 'networks cannot be empty.',
        'number.positive': 'networks must be a positive number.',
        'any.required': 'networks is required.',
      }),
      provider: Joi.string().trim().min(1).required().messages({
        'string.base': 'Provider must be a string',
        'string.empty': 'Provider cannot be empty',
        'string.min': 'Provider must be at least 1 characters long',
        'any.required': 'Provider is required',
      }),
      status: Joi.boolean().optional().messages({
        'boolean.base': 'Status must be a boolean',
      }),
      commissionMode: Joi.string().valid('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP').optional(),
      commissionType: Joi.string().valid('PERCENTAGE', 'FLAT').default('PERCENTAGE').messages({
        'any.only': 'Commission type must be PERCENTAGE or FLAT',
      }),
      commission: Joi.number().min(0).default(0).messages({
        'number.base': 'Commission must be a number',
        'number.min': 'Commission must be 0 or greater',
      }),
      fixedCommissionPerTransaction: Joi.number().min(0).default(0).optional().messages({
        'number.base': 'Fixed commission must be a number',
        'number.min': 'Fixed commission must be 0 or greater',
      }),
      isCommissionInclGST: Joi.boolean().truthy(1).falsy(0).default(true).messages({
        'boolean.base': 'isCommissionInclGST must be a boolean',
      }),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      throw new Error(result.error.details[0].message);
    }
    next();
  } catch (err) {
    next(err);
  }
};

// Editing an existing eSIM plan is restricted to commission-related fields only.
// Plan details (coverage, coverageId, dataMBs, name, periodDays, etc.) cannot be
// changed through this endpoint.
exports.validateEsimUpdate = (req, res, next) => {
  try {
    const schema = Joi.object({
      commissionMode: Joi.string().valid('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP').optional().messages({
        'any.only': 'Commission mode must be MARGIN, AGENT_MARKUP or PRINCIPAL_MARKUP',
      }),
      commissionType: Joi.string().valid('PERCENTAGE', 'FLAT').required().messages({
        'any.only': 'Commission type must be PERCENTAGE or FLAT',
        'any.required': 'Commission type is required',
      }),
      commission: Joi.number().min(0).required().messages({
        'number.base': 'Commission must be a number',
        'number.min': 'Commission must be 0 or greater',
        'any.required': 'Commission is required',
      }),
      fixedCommissionPerTransaction: Joi.number().min(0).optional().messages({
        'number.base': 'Fixed commission must be a number',
        'number.min': 'Fixed commission must be 0 or greater',
      }),
      isCommissionInclGST: Joi.boolean().truthy(1).falsy(0).optional().messages({
        'boolean.base': 'isCommissionInclGST must be a boolean',
      }),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      throw new Error(result.error.details[0].message);
    }
    next();
  } catch (err) {
    next(err);
  }
};

exports.validateSubscriptionCoupon = (req, res, next) => {
  try {
    const schema = Joi.object({
      code: Joi.string()
        .trim()
        .required()
        .pattern(/^[A-Za-z0-9]+$/)
        .messages({
          "string.base": "Coupon code must be a string.",
          "string.empty": "Coupon code cannot be empty.",
          "any.required": "Coupon code is required.",
          "string.pattern.base": "Coupon code must not contain spaces or special characters.",
        }),
      couponType: Joi.string().valid("SUBSCRIPTION", "SERVICES").required().messages({
        "any.required": "Coupon type is required.",
        "any.only": "Coupon type must be either 'SUBSCRIPTION' or 'SERVICES'."
      }),
      billingType: Joi.string()
        .when("couponType", {
          is: "SUBSCRIPTION",
          then: Joi.valid("MONTHLY", "ANNUALLY").required().messages({
            "any.required": "Billing type is required.",
            "any.only": "Billing type must be either 'MONTHLY' or 'ANNUALLY'."
          })
        }),
      serviceOperatorId: Joi.number()
        .when("couponType", {
          is: "SERVICES",
          then: Joi.required().messages({
            "any.required": "Operator ID is required when coupon type is 'SERVICES'."
          }),
          otherwise: Joi.forbidden()
        }),

      packageId: Joi.number()
        .when("couponType", {
          is: "SUBSCRIPTION",
          then: Joi.required().messages({
            "any.required": "Package ID is required when coupon type is 'SUBSCRIPTION'."
          }),
          otherwise: Joi.forbidden()
        }),
      discountType: Joi.string().valid("FLAT", "PERCENTAGE").default("PERCENTAGE").messages({
        "string.base": "Discount type must be a string.",
        "string.valid": "Discount type must be either FLAT or PERCENTAGE.",
      }),
      discount: Joi.number()
        .required()
        .min(0)
        .messages({
          "number.min": "Discount must be greater than zero.",
        })
        .when("discountType", {
          is: "PERCENTAGE",
          then: Joi.number()
            .messages({
              "number.base": "Discount must be a number.",
            })
            .max(100)
            .messages({
              "number.max": "Discount must be at most 100.",
            }),
        }),
      // status: Joi.string().valid("ACTIVE", "DISABLED").required().messages({
      //   "any.required": "Status is required.",
      //   "any.only": 'Status must be either "ACTIVE" or "DISABLED".',
      // }),
      expiryDays: Joi.number().optional().min(1).max(36500).messages({
        "number.base": "Expiry Days must be a number.",
        "number.min": "Expiry Days must be greater than 1",
        "number.max": "Expiry Days must be less than 36500",
        "number.empty": "Expiry Days cannot be empty.",
      }),

      partnerId: Joi.number().allow(null).required().messages({
        "number.base": "Partner ID must be a string",
        "number.empty": "Partner ID is required",
      }),
      referralCodeId: Joi.number().allow(null).optional().messages({
        "number.base": "Referral Code must be a number",
      }),
      minimumPurchase: Joi.number().required().min(0).messages({
        "number.base": "Minimum purchase must be a number.",
        "number.min": "Minimum purchase cannot be negative.",
        "any.required": "Minimum purchase is required."
      }),
      maximumDiscount: Joi.number()
        .min(0)
        .when("discountType", {
          is: "PERCENTAGE",
          then: Joi.required().messages({
            "any.required": "Maximum discount is required when discount type is 'PERCENTAGE'."
          }),
          otherwise: Joi.allow(null)
        })
        .messages({
          "number.base": "Maximum discount must be a number.",
          "number.min": "Maximum discount cannot be negative."
        }),
      notifyCorporates: Joi.boolean().optional(),
      validUntil: Joi.date()
        .iso()
        .required()
        .messages({
          "date.base": "Valid Till must be a valid date.",
          "date.format": "Valid Till must be in YYYY-MM-DD format.",
          "any.required": "Valid Till date is required.",
        }),
    });

    const result = schema.validate(req.body, { abortEarly: false }); // Add abortEarly option to show all errors
    if (result.error) {
      // const errorMessage = result.error.details.map((detail) => detail.message).join("; ");
      return res.status(400).json({
        status: false,
        message: result.error.details[0].message,
        data: {},
        responseCode: "001",
      });
    }
    next();
  } catch (err) {
    customLog(req?.LogTraceId, "error", { message: "An error occurred", error: err });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
};

/**
 * Office Supplies (ONDC) delivery address save.
 *
 * Phone and pincode were previously enforced only in the browser, so an address
 * with phone "abc" / pincode "99" was stored as-is. Delivery depends on both,
 * so they are format-checked here too.
 *
 * Regexes match the Office Supplies checkout form: a 10-digit Indian mobile
 * (frontend `indianMobileRegex`) and a 6-digit pincode with no leading zero
 * (the same shape as INDIAN_PIN_RE in utils/indianPincodeLookup.js).
 */
exports.validateSaveEcommerceAddress = (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().trim().min(1).max(100).required().messages({
        'string.empty': 'Name is required.',
        'any.required': 'Name is required.',
      }),
      addressLine1: Joi.string().trim().min(1).max(200).required().messages({
        'string.empty': 'Address is required.',
        'any.required': 'Address is required.',
      }),
      phoneNumber: Joi.string()
        .trim()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({
          'string.pattern.base': 'Please enter a valid 10-digit mobile number.',
          'string.empty': 'Mobile number is required.',
          'any.required': 'Mobile number is required.',
        }),
      zipCode: Joi.string()
        .trim()
        .pattern(/^[1-9]\d{5}$/)
        .required()
        .messages({
          'string.pattern.base': 'Please enter a valid 6-digit pincode.',
          'string.empty': 'Pincode is required.',
          'any.required': 'Pincode is required.',
        }),
      addressLine2: Joi.string().trim().max(200).allow('', null).optional(),
      email: Joi.string().trim().email().allow('', null).optional().messages({
        'string.email': 'Please enter a valid email address.',
      }),
      nickname: Joi.string().trim().max(100).allow('', null).optional(),
      city: Joi.string().trim().max(100).allow('', null).optional(),
      state: Joi.string().trim().max(100).allow('', null).optional(),
    });

    const result = schema.validate(req.body);
    if (result.error) {
      throw new ErrorResponse(result.error.details[0].message, 400);
    }
    next();
  } catch (err) {
    err.code ? console.log(`🚀 ~Error:${err.message}`) : console.log(err);
    next(err);
  }
};