const Joi = require('joi');

exports.getEsimQDetailsValidation = (req, res, next) => {
  const schema = Joi.object({
    planId: Joi.string().trim().required(),
    iccidNo: Joi.string().trim().min(10).max(50).required(),
    customerUid: Joi.string().trim().allow('').optional(),
    country: Joi.string().trim().max(100).allow('').optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};

exports.findAllGiftCardAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    offset: Joi.number().integer().min(0).optional(),

    limit: Joi.number().integer().min(1).max(100).optional(),

    page: Joi.number().integer().min(1).optional(),

    searchText: Joi.string().trim().max(100).allow("").optional(),

    searchValue: Joi.string().trim().max(100).allow("").optional(),

    accessKeys: Joi.alternatives()
      .try(
        Joi.array().items(Joi.string()),
        Joi.string()
      )
      .optional()
      .custom((value) => {
        if (typeof value === "string") {
          try { return JSON.parse(value); } catch { return value.split(",").map((v) => v.trim()); }
        }
        return value;
      }),

    sortBy: Joi.string()
      .valid("all", "name", "popular")
      .allow("")
      .empty("")
      .default("all"),

    category: Joi.string().trim().max(100).allow("").optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};

exports.findAllTransactionsAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().iso().allow("", null).optional(),

    to: Joi.date()
      .iso()
      .allow("", null)
      .when("from", {
        is: Joi.date().iso(),
        then: Joi.date().min(Joi.ref("from")),
      }),

    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string().valid("ASC", "DESC").optional(),

    filter: Joi.string().trim().max(50).allow("", null).optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};

exports.findAllHikeTransactionsAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().iso().allow("", null).optional(),

    to: Joi.date()
      .iso()
      .allow("", null)
      .when("from", {
        is: Joi.date().iso(),
        then: Joi.date().min(Joi.ref("from")),
      }),

    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string().valid("ASC", "DESC").optional(),

    filter: Joi.string().trim().max(50).allow("", null).optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};


exports.findAllPlansAndDetailsValidation = (req, res, next) => {
  const schema = Joi.object({
    productId: Joi.number().integer().required(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};

exports.findAllSoftwareSubscriptionTransactionsAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().iso().allow("", null).optional(),

    to: Joi.date()
      .iso()
      .allow("", null)
      .when("from", {
        is: Joi.date().iso(),
        then: Joi.date().min(Joi.ref("from")),
      }),

    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string().valid("ASC", "DESC").optional(),

    filter: Joi.string().trim().max(50).allow("", null).optional(),

    productId: Joi.number().integer().optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};

exports.findAllCategoriesAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),
    sortField: Joi.string()
      .valid("createdAt", "categoryName", "vendor.vendorName", "categoryStatus")
      .allow("")
      .empty("")
      .default("createdAt"),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};


exports.getAllCouponCodesValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .optional(),

    sortField: Joi.string()
      .valid("createdAt", "couponCode", "discountType", "discount", "validFrom", "validTo", "status")
      .allow("")
      .empty("")
      .optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};

exports.findAllOrdersValidation = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().iso().allow("", null).optional(),

    to: Joi.date()
      .iso()
      .allow("", null)
      .when("from", {
        is: Joi.date().iso(),
        then: Joi.date().min(Joi.ref("from")),
      }),

    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string().valid("ASC", "DESC").allow("").optional(),

    sortField: Joi.string()
      .valid("transactionDate", "credential.name", "credential.username", "amountInINR", "ecomOrderStatus", "status")
      .allow("")
      .optional(),

    status: Joi.string().trim().max(50).allow("", null).optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};

exports.findCancelAndRefundsValidation = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().iso().allow("", null).optional(),

    to: Joi.date()
      .iso()
      .allow("", null)
      .when("from", {
        is: Joi.date().iso(),
        then: Joi.date().min(Joi.ref("from")),
      }),

    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string().valid("ASC", "DESC").allow("").optional(),

    sortField: Joi.string()
      .valid("transactionDate", "credential.name", "credential.username", "amountInINR", "workspaceOrderStatus", "status")
      .allow("")
      .optional(),

    status: Joi.string().trim().max(50).allow("", null).optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};

exports.findReturnAndRefundsValidation = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().iso().allow("", null).optional(),

    to: Joi.date()
      .iso()
      .allow("", null)
      .when("from", {
        is: Joi.date().iso(),
        then: Joi.date().min(Joi.ref("from")),
      }),

    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string().valid("ASC", "DESC").allow("").optional(),

    sortField: Joi.string()
      .valid("transactionDate", "credential.name", "credential.username", "status")
      .allow("")
      .optional(),

    status: Joi.string().trim().max(50).allow("", null).optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};

exports.findAllEsimValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .optional(),

    sortField: Joi.string()
      .valid("createdAt", "name", "dataMBs", "periodDays", "amount", "country", "status")
      .allow("")
      .empty("")
      .optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};

exports.fetchCountriesValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};
exports.coveragepprofilesValidation = (req, res, next) => {
  const schema = Joi.object({
    search: Joi.string().trim().max(50).allow("").optional()
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};


exports.getPriceEsimPlanValidation = (req, res, next) => {
  const schema = Joi.object({
    coverageId: Joi.string().trim().max(50).optional().allow(""),

    countryIso2: Joi.string()
      .trim()
      .length(2)
      .uppercase()
      .required(),

    indicator: Joi.string()
      .trim()
      .max(20)
      .required(),

    label: Joi.string()
      .trim()
      .max(100)
      .required(),
  });

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  next();
};

exports.findAllGiftCardsAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),

    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt", "product_name", "is_open_denominnation", "denominations", "expiry", "status")
      .allow("")
      .empty("")
      .default("createdAt"),
  });

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  next();
};

exports.findAllHikesValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),

    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    partnerId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().allow(""))
      .optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt", "name", "features", "credential.registeredByCredential.name", "planType", "amount", "salaryAmount", "salaryValidation", "status")
      .allow("")
      .empty("")
      .default("createdAt"),
  });

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  next();
};

exports.getAllSubscriptionCouponCodesValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),

    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt", "code", "couponType", "referralCode", "partnerName", "packageName", "serviceProvider", "discountType", "discount", "expiryDays", "minimumPurchase", "maximumDiscount", "billingType", "status")
      .allow("")
      .empty("")
      .default("createdAt"),

    partnerId: Joi.alternatives()
      .try(
        Joi.number().integer(),
        Joi.string().valid("default")
      )
      .allow("")
      .empty("")
      .optional(),

  });

  const { error } = schema.validate(req.query);
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  next();
};

exports.validatePekoCreditStatus = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid("ACTIVE", "DISABLED").required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  next();
};

exports.findAllVendorAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),

    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt", "vendorName", "apiUrl", "healthUrl", "type", "isActive")
      .allow("")
      .empty("")
      .default("createdAt"),
  });

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  next();
};

exports.findAllSubscriptionCodesAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),

    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt", "packageName", "activationCode", "billingType", "status", "isUsed", "partnerName")
      .allow("")
      .empty("")
      .default("createdAt"),
  });

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  next();
};

exports.findAllProductAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),

    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt", "description", "category.categoryName", "status", "quantity", "price")
      .allow("")
      .empty("")
      .default("createdAt"),
  });

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  next();
};
exports.findAllSoftwarePlansAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),

    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt", "name", "software.name", "vendorPrice", "validity", "price", "noOfUsers","status")
      .allow("")
      .empty("")
      .default("createdAt"),
  });

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  next();
};
exports.findAllSoftwareSubscriptionPlansAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),

    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt", "name", "softwares_subscription.name", "monthlyPrice", "yearlyPrice","status")
      .allow("")
      .empty("")
      .default("createdAt"),
  });

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  next();
};
exports.findAllSoftwareSubscriptionsAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),

    page: Joi.number().integer().min(1).optional(),

    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt", "name", "softwares_subscription.name", "type", "displayOrder","status")
      .allow("")
      .empty("")
      .default("createdAt"),

    start: Joi.number().integer().optional(),
    draw: Joi.number().integer().optional(),
  });

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  next();
};

exports.fetchAllCategoriesValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().trim().max(100).allow("").optional(),
  });

  const { error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  next();
};

/**
 * Office Supplies (ONDC) storefront product list.
 *
 * Without this, `parseInt(req.query.offset) || 0` let a negative offset through
 * (parseInt("-5") is truthy), so `OFFSET -5` reached Postgres and the resulting
 * SequelizeDatabaseError surfaced as a 500. Bad paging input is a 400.
 *
 * NOTE: stripUnknown drops anything not listed here and `req.query` is then
 * reassigned, so every param the controller reads must stay whitelisted.
 */
exports.validateOndcProductListQuery = (req, res, next) => {
  const schema = Joi.object({
    offset: Joi.number().integer().min(0).optional().messages({
      "number.base": "Offset must be a number.",
      "number.integer": "Offset must be a whole number.",
      "number.min": "Offset cannot be negative.",
    }),

    limit: Joi.number().integer().min(1).optional().messages({
      "number.base": "Limit must be a number.",
      "number.integer": "Limit must be a whole number.",
      "number.min": "Limit must be at least 1.",
      "number.max": "Limit cannot exceed 100.",
    }),

    city: Joi.string().trim().allow("").optional(),
    search: Joi.string().trim().allow("").optional(),
    localCategory: Joi.string().trim().allow("").optional(),
    categoryId: Joi.string().trim().allow("").optional(),
    sellers: Joi.string().trim().allow("").optional(),
    transactionId: Joi.string().trim().allow("").optional(),
    sort: Joi.string()
      .valid("relevance", "price_asc", "price_desc", "discount", "newest")
      .optional()
      .messages({
        "any.only": "Sort must be one of relevance, price_asc, price_desc, discount or newest.",
      }),

    priceMax: Joi.number().min(0).optional().messages({
      "number.base": "Maximum price must be a number.",
      "number.min": "Maximum price cannot be negative.",
    }),

    minDiscount: Joi.number().min(0).max(100).optional().messages({
      "number.base": "Minimum discount must be a number.",
      "number.min": "Minimum discount cannot be negative.",
      "number.max": "Minimum discount cannot exceed 100.",
    }),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};

/**
 * Office Supplies (ONDC) storefront home sections.
 *
 * Same uncapped-page-size problem as the product list: `parseInt(req.query.limit)
 * || 12` accepted any size. Caps each section at 100 rows.
 *
 * NOTE: stripUnknown drops anything not listed and `req.query` is then
 * reassigned, so every param the controller reads must stay whitelisted.
 */
exports.validateOndcSectionsQuery = (req, res, next) => {
  const schema = Joi.object({
    limit: Joi.number().integer().min(1).max(100).optional().messages({
      "number.base": "Limit must be a number.",
      "number.integer": "Limit must be a whole number.",
      "number.min": "Limit must be at least 1.",
      "number.max": "Limit cannot exceed 100.",
    }),

    offset: Joi.number().integer().min(0).optional().messages({
      "number.base": "Offset must be a number.",
      "number.integer": "Offset must be a whole number.",
      "number.min": "Offset cannot be negative.",
    }),

    city: Joi.string().trim().max(100).allow("").optional(),
    search: Joi.string().trim().max(100).allow("").optional(),
    localCategory: Joi.string().trim().max(100).allow("").optional(),
  });

  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
      responseCode: "001",
    });
  }

  req.query = value;
  next();
};
