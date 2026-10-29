const Joi = require('joi');
const { SUPPORTED_GATEWAY_PROVIDERS } = require('../constants/gatewayProviders');

function sendValidationError(res, message) {
  return res.status(400).json({
    status: false,
    message,
    responseCode: "001",
  });
}

exports.fetchAllAvailablePgMethodsCorporateValidation = (req, res, next) => {
  const schema = Joi.object({
    billerId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().trim())
      .allow("", null)
      .optional(),

    accessKey: Joi.string().trim().max(100).allow("", null).optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return sendValidationError(res, "Invalid request. Please check your details and try again.");
  }

  req.query = value;
  next();
};

exports.calculateServiceChargesValidation = (req, res, next) => {
  const schema = Joi.object({
    accessKey: Joi.string().trim().max(100).required().messages({
      "any.required": "Service information is missing. Please try again.",
      "string.empty": "Service information is missing. Please try again.",
    }),

    amount: Joi.number().positive().precision(2).required().messages({
      "number.base": "Please enter a valid amount.",
      "number.positive": "Amount must be greater than zero.",
      "any.required": "Amount is required.",
    }),

    quantity: Joi.number().integer().min(1).max(1000).optional().messages({
      "number.base": "Quantity must be a valid number.",
      "number.integer": "Quantity must be a whole number.",
      "number.min": "Quantity must be at least 1.",
      "number.max": "Quantity cannot exceed 1000.",
    }),

    billerId: Joi.string().trim().optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return sendValidationError(res, error.details[0].message);
  }

  req.query = value;
  next();
};

exports.getAllPaymentMethodsValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional().messages({
      "number.base": "Page must be a valid number.",
      "number.min": "Page must be at least 1.",
    }),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional().messages({
      "number.base": "Items per page must be a valid number.",
      "number.min": "Items per page must be at least 1.",
      "number.max": "Items per page cannot exceed 100.",
    }),

    sort: Joi.string().valid("ASC", "DESC").allow("").empty("").default("DESC").messages({
      "any.only": "Invalid sort order. Please use ascending or descending.",
    }),

    sortField: Joi.string()
      .valid("createdAt", "paymentMethod", "name", "id")
      .allow("")
      .empty("")
      .default("createdAt")
      .messages({
        "any.only": "Invalid sort field selected.",
      }),

    partnerId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().valid("default"))
      .allow("")
      .empty("")
      .optional()
      .messages({
        "alternatives.match": "Invalid partner selected.",
        "alternatives.types": "Invalid partner selected.",
      }),

    pgProvider: Joi.string()
      .valid(...SUPPORTED_GATEWAY_PROVIDERS)
      .allow("")
      .empty("")
      .optional()
      .messages({
        "any.only": "Invalid payment gateway selected.",
      }),

    isActive: Joi.boolean()
      .allow("")
      .empty("")
      .optional()
      .messages({
        "boolean.base": "Invalid status selected.",
      }),

    paymentMethod: Joi.string()
      .valid("PAYMENT_GATEWAY", "WALLET")
      .allow("")
      .empty("")
      .optional()
      .messages({
        "any.only": "Invalid payment method selected.",
      }),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return sendValidationError(res, error.details[0].message);
  }

  req.query = value;
  next();
};

const paymentMethodIdParamsSchema = Joi.object({
  paymentMethodId: Joi.number().integer().min(1).required(),
});

exports.updatePaymentMethodStatusValidation = (req, res, next) => {
  const bodySchema = Joi.object({
    isActive: Joi.boolean().strict().required().messages({
      "any.required": "Please select a status.",
      "boolean.base": "Invalid status selected.",
    }),
  });

  const params = paymentMethodIdParamsSchema.validate(req.params, { stripUnknown: true, convert: true });
  if (params.error) {
    return sendValidationError(res, "Invalid payment method selected.");
  }

  const body = bodySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (body.error) {
    return sendValidationError(res, body.error.details[0].message);
  }

  req.params.paymentMethodId = params.value.paymentMethodId;
  req.body = body.value;
  next();
};

const PAYMENT_METHOD_LIMITS = Object.freeze({
  limitPerTransaction: Object.freeze({ label: "Limit per transaction", max: 999999 }),
  limitPerDay: Object.freeze({ label: "Limit per day", max: 99999999 }),
  limitPerMonth: Object.freeze({ label: "Limit per month", max: 9999999999 }),
});

const limitSchemaKeys = Object.fromEntries(
  Object.entries(PAYMENT_METHOD_LIMITS).map(([key, { label, max }]) => [
    key,
    Joi.number().integer().min(0).max(max).empty("").default(0).messages({
      "number.base": `${label} must be a number.`,
      "number.integer": `${label} must be a whole number.`,
      "number.min": `${label} cannot be negative.`,
      "number.max": `${label} cannot exceed ${max}.`,
    }),
  ])
);

const findLimitConflict = ({ limitPerTransaction, limitPerDay, limitPerMonth }) => {
  if (limitPerTransaction && limitPerDay && limitPerDay < limitPerTransaction) {
    return "Limit per day cannot be lower than the limit per transaction.";
  }
  if (limitPerDay && limitPerMonth && limitPerMonth < limitPerDay) {
    return "Limit per month cannot be lower than the limit per day.";
  }
  if (limitPerTransaction && limitPerMonth && limitPerMonth < limitPerTransaction) {
    return "Limit per month cannot be lower than the limit per transaction.";
  }
  return null;
};

const paymentMethodBodyKeys = {
  partnerId: Joi.number().integer().min(1).allow(null).required().messages({
    "any.required": "Please select a partner.",
    "number.base": "Invalid partner selected.",
    "number.integer": "Invalid partner selected.",
    "number.min": "Invalid partner selected.",
  }),
  paymentMethod: Joi.string().valid("PAYMENT_GATEWAY", "WALLET").required().messages({
    "any.required": "Please select a payment method.",
    "any.only": "Invalid payment method selected.",
    "string.base": "Invalid payment method selected.",
  }),
  pgProvider: Joi.string().max(64).allow(null, ""),
  services: Joi.array()
    .items(
      Joi.number().integer().min(1).messages({
        "number.base": "Invalid service selected.",
        "number.integer": "Invalid service selected.",
        "number.min": "Invalid service selected.",
      })
    )
    .min(1)
    .unique()
    .required()
    .messages({
      "any.required": "Please select at least one service.",
      "array.base": "Please select at least one service.",
      "array.min": "Please select at least one service.",
      "array.unique": "Each service can be selected only once.",
    }),
};

const createPaymentMethodSchema = Joi.object({ ...paymentMethodBodyKeys, ...limitSchemaKeys });
const editPaymentMethodSchema = Joi.object({
  ...paymentMethodBodyKeys,
  limits: Joi.object(limitSchemaKeys).default(),
});

const validatePaymentMethodBody = (schema, body, readLimits) => {
  const { error, value } = schema.validate(body, { stripUnknown: true, convert: true });
  if (error) {
    return { message: error.details[0].message };
  }
  const limitConflict = findLimitConflict(readLimits(value));
  return limitConflict ? { message: limitConflict } : { value };
};

exports.createPaymentMethodValidation = (req, res, next) => {
  const { message, value } = validatePaymentMethodBody(createPaymentMethodSchema, req.body, (body) => body);
  if (message) {
    return sendValidationError(res, message);
  }

  req.body = value;
  next();
};

exports.editPaymentMethodValidation = (req, res, next) => {
  const params = paymentMethodIdParamsSchema.validate(req.params, { stripUnknown: true, convert: true });
  if (params.error) {
    return sendValidationError(res, "Invalid payment method selected.");
  }

  const { message, value } = validatePaymentMethodBody(editPaymentMethodSchema, req.body, (body) => body.limits);
  if (message) {
    return sendValidationError(res, message);
  }

  req.params.paymentMethodId = params.value.paymentMethodId;
  req.body = value;
  next();
};

exports.updatePgMethodsValidation = (req, res, next) => {
  const schema = Joi.object({
    isGatewayPaymentAvailable: Joi.boolean().strict().required(),
    isWalletPaymentAvailable: Joi.boolean().strict().required(),
    isCouponApplicable: Joi.boolean().strict().required(),
  });

  const { error, value } = schema.validate(req.body, { stripUnknown: true });
  if (error) {
    return sendValidationError(res, "Invalid payment settings. Please refresh the page and try again.");
  }
  if (value.isCouponApplicable && !value.isGatewayPaymentAvailable) {
    return sendValidationError(res, "Coupons need the payment gateway to be on.");
  }

  req.body = value;
  next();
};

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

exports.getManualRefundsValidation = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional().messages({
      "number.base": "Page must be a valid number.",
      "number.min": "Page must be at least 1.",
    }),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional().messages({
      "number.base": "Items per page must be a valid number.",
      "number.min": "Items per page must be at least 1.",
      "number.max": "Items per page cannot exceed 100.",
    }),
    searchText: Joi.string().trim().max(100).allow("").optional(),
    status: Joi.string()
      .valid("PENDING", "IN_PROGRESS", "SUCCESS", "FAILED")
      .allow("")
      .empty("")
      .optional()
      .messages({ "any.only": "Invalid refund status selected." }),
    partnerId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().valid("default"))
      .allow("")
      .empty("")
      .optional()
      .messages({
        "alternatives.match": "Invalid partner selected.",
        "alternatives.types": "Invalid partner selected.",
      }),
    from: Joi.string().pattern(ISO_DAY).allow("").empty("").optional().messages({
      "string.pattern.base": "Invalid from date.",
    }),
    to: Joi.string().pattern(ISO_DAY).allow("").empty("").optional().messages({
      "string.pattern.base": "Invalid to date.",
    }),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return sendValidationError(res, error.details[0].message);
  }

  req.query = value;
  next();
};

exports.updateManualRefundValidation = (req, res, next) => {
  const paramsResult = Joi.object({
    manualRefundId: Joi.number().integer().min(1).required(),
  }).validate(req.params, { convert: true, allowUnknown: true });

  if (paramsResult.error) {
    return sendValidationError(res, "Invalid refund selected.");
  }

  const schema = Joi.object({
    status: Joi.string().valid("IN_PROGRESS", "SUCCESS", "FAILED").required().messages({
      "any.required": "Please select the refund status",
      "string.empty": "Please select the refund status",
      "any.only": "Please select a valid refund status",
    }),
    refundReference: Joi.string()
      .trim()
      .max(128)
      .pattern(/^[A-Za-z0-9 ._/-]+$/)
      .allow("")
      .optional()
      .messages({
        "string.max": "Refund reference cannot exceed 128 characters",
        "string.pattern.base": "Refund reference can only contain letters, numbers, spaces and . _ / -",
      }),
    remarks: Joi.string().trim().max(500).allow("").optional().messages({
      "string.max": "Remarks cannot exceed 500 characters",
    }),
  });

  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return sendValidationError(res, error.details[0].message);
  }

  req.params.manualRefundId = paramsResult.value.manualRefundId;
  req.body = value;
  next();
};
