  const Joi = require("joi");
const { CONFIG_TYPES } = require("./auditedModels");
const { THIRD_PARTY_SALE_KINDS } = require("../models/use-cases/thirdPartySales");

const BENEFICIARY_SORTABLE_FIELDS = [
  "createdAt",
  "beneficiaryName",
  "accountNumber",
  "status"
];

exports.validateBeneficiaryQuery = (req, res, next) => {
  const schema = Joi.object({
    start: Joi.number().integer().min(0).default(0),

    length: Joi.number().integer().min(1).max(100).default(10),

    draw: Joi.number().integer().min(0).default(1),

    orderCol: Joi.string()
      .valid("ASC", "DESC")
      .empty("")
      .default("DESC"),

    column: Joi.string()
      .valid(...BENEFICIARY_SORTABLE_FIELDS)
      .empty("")
      .optional(),

    beneficiaryStatus: Joi.string()
      .valid("ACTIVE", "INACTIVE")
      .empty("")
      .optional(),

    credentialId: Joi.number().integer().optional(),

    search: Joi.object({
      value: Joi.string().allow("").max(100).default(""),
    }).default({ value: "" }),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: false, // keep nested structure
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateTransactionsChartQuery = (req, res, next) => {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 10;

  const schema = Joi.object({
    paymentMode: Joi.string()
      .valid("all", "WALLET", "PAYMENT GATEWAY", "PAYMENT GATEWAY + WALLET", "CORPORATE CARD", "CORPORATE CARD + WALLET")
      .empty("")
      .default("all"),

    year: Joi.alternatives()
      .try(
        Joi.string().valid("all"),
        Joi.number().integer().min(minYear).max(currentYear)
      )
      .default("all"),

    month: Joi.alternatives()
      .try(
        Joi.string().valid("all"),
        Joi.number().integer().min(1).max(12)
      )
      .default("all"),

    monthlyView: Joi.boolean()
      .truthy("true")
      .falsy("false")
      .default(false),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

const BANNER_POSITIONS = ["TOP", "BOTTOM", "SIDEBAR"];

exports.validateBannerQuery = (req, res, next) => {
  const schema = Joi.object({
    position: Joi.string()
      .valid(...BANNER_POSITIONS)
      .empty("")
      .optional(),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateSearchQuery = (required = false) => {
  return (req, res, next) => {
    const schema = Joi.object({
      q: required
        ? Joi.string().trim().min(1).max(50).required()
        : Joi.string().trim().allow("").max(50).default(""),
    });

    const { value, error } = schema.validate(req.query, {
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    req.query = value;
    next();
  };
};


const NOTIFICATION_SORT_FIELDS = [
  "createdAt",
  // "title",
  // "status"
];

exports.validateNotificationQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    pageSize: Joi.number().integer().min(1).max(100).default(10),

    fromDate: Joi.date().optional(),

    toDate: Joi.date().optional(),

    search: Joi.string()
      .trim()
      .allow("")
      .max(100)
      .default(""),

    orderCol: Joi.string()
      .valid("ASC", "DESC")
      .empty("")
      .default("ASC"),

    sortField: Joi.string()
      .valid(...NOTIFICATION_SORT_FIELDS)
      .empty("")
      .default("createdAt"),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateProfileProgressQuery = (req, res, next) => {
  const schema = Joi.object({
    isReceiver: Joi.boolean()
      .truthy("true")
      .falsy("false")
      .default(false),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      message: "Invalid query parameter",
    });
  }

  req.query = value;
  next();
};

exports.validateOtpQuery = (req, res, next) => {
  const schema = Joi.object({
    scope: Joi.string()
      .valid("email", "sms")
      .required()
      .messages({
        "any.only": "Scope must be 'email' or 'sms'",
        "any.required": "OTP scope is required",
      }),
    newMobileNo: Joi.string()
      .pattern(/^\d{10,15}$/)
      .optional()
      .messages({
        "string.pattern.base": "New mobile number must be 10-15 digits",
      }),
  });

  const { value, error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};


exports.validateAddressQuery = (req, res, next) => {
  const schema = Joi.object({
    q: Joi.string()
      .trim()
      .allow("")
      .max(50)
      .default("")
      .messages({
        "string.max": "Search text must be under 50 characters",
      }),

    isReceiver: Joi.boolean()
      .truthy("true")
      .falsy("false")
      .default(false),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateAddressOtpQuery = (req, res, next) => {
  const schema = Joi.object({
    scope: Joi.string()
      .valid("email")
      .required()
      .messages({
        "any.only": "Scope must be 'email'",
      }),

    method: Joi.string()
      .valid("add", "update", "delete")
      .default("add"),

    id: Joi.number()
      .integer()
      .when("method", {
        is: "delete",
        then: Joi.required(),
        otherwise: Joi.optional(),
      }),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateProfileOtpQuery = (req, res, next) => {
  const schema = Joi.object({
    scope: Joi.string()
      .valid("sms", "email", "both")
      .default("both"),

    mobileNo: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .when("scope", {
        is: Joi.valid("sms", "both"),
        then: Joi.required(),
        otherwise: Joi.optional(),
      })
      .messages({
        "string.pattern.base": "Mobile number must be 10 digits",
      }),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};


exports.validateBankOtpQuery = (req, res, next) => {
  const schema = Joi.object({
    scope: Joi.string()
      .valid("email")
      .required()
      .messages({
        "any.only": "Scope must be email",
        "any.required": "Scope is required",
      }),

    method: Joi.string()
      .valid("add", "update", "delete")
      .default("add"),

    selectedId: Joi.number()
      .integer()
      .empty("")
      .optional(),

    accountNumber: Joi.string()
      .pattern(/^[0-9]{6,20}$/)
      .optional()
      .messages({
        "string.pattern.base": "Invalid account number",
      }),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateCorporateProfileParams = (req, res, next) => {
  const allowedTypes = ["basic", "company", "security"];

  if (!allowedTypes.includes(req.params.type)) {
    return res.status(400).json({
      status: false,
      message: "Invalid profile type",
    });
  }

  next();
};

exports.validateTicketIdParam = (req, res, next) => {
  const { id } = req.params;

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({
      status: false,
      message: "Invalid ticket id",
    });
  }

  next();
};


exports.validateTicketsQuery = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().required(),
    to: Joi.date().required(),

    page: Joi.number().integer().min(1).default(1),

    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    searchText: Joi.string()
      .trim()
      .allow("")
      .max(100)
      .default(""),

    module: Joi.string()
      .trim()
      .allow("all")
      .optional(),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateTransactionReportQuery = (req, res, next) => {
  const schema = Joi.object({
    fromDate: Joi.date().required(),
    toDate: Joi.date().required(),
  });

  const { value, error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: "Please provide a valid date range",
    });
  }

  req.query = value;
  next();
};

const ALLOWED_PAYMENT_FILTERS = ["SUCCESS", "FAILED", "PENDING", "REFUNDED"];
const normalizeFilterValue = (v) => {
  const u = v.toUpperCase();
  return u === 'FAILURE' ? 'FAILED' : u;
};
const ALLOWED_SORT_FIELDS = [
  "corporateTxnId",
  "transactionDate",
  "transactionCategory",
  "serviceOperator.serviceProvider",
  "order.amountInINR",
  "order.paymentMode",
];

exports.validateTransactionListQuery = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().required(),
    to: Joi.date().required(),

    searchText: Joi.string().trim().allow("").max(100).default(""),

    page: Joi.number().integer().min(1).default(1),
    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid(...ALLOWED_SORT_FIELDS)
      .empty("")
      .default("corporateTxnId"),

    filter: Joi.string()
      .custom(normalizeFilterValue)
      .valid(...ALLOWED_PAYMENT_FILTERS)
      .empty("")
      .optional()
      .messages({ 'any.only': 'Something went wrong, please try again later.' }),

    categoryName: Joi.string().allow("all").empty("")
      .optional(),

    accessKey: Joi.string().allow("all").empty("")
      .optional(),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};


// const ALLOWED_SORT_FIELDS = [
//   "corporateTxnId",
//   "transactionDate",
//   "transactionCategory",
//   "corporateCashback",
// ];

const ALLOWED_CATEGORIES = [
  "all",
  "Telecom Payments",
  "Utility Payments",
  "Travel",
  "Office Supplies",
  "Softwares",
  "Gift Card/Vouchers",
  "Peko Connect",
  "Invoicing",
  "Other Services",
];

exports.validateCashbackQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    itemsPerPage: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10),

    searchText: Joi.string()
      .trim()
      .allow("")
      .max(100)
      .default(""),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .empty("")
      .default("ASC"),

    sortField: Joi.string()
      .valid(...ALLOWED_SORT_FIELDS)
      .empty("")
      .default("corporateTxnId"),

    categoryName: Joi.string()
      .valid(...ALLOWED_CATEGORIES)
      .empty("")
      .default("all"),

    from: Joi.date().required().messages({
      "any.required": "From date is required",
    }),

    to: Joi.date().required().messages({
      "any.required": "To date is required",
    }),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateTransactionIdParam = (req, res, next) => {
  const { transactionId } = req.params;

  if (!transactionId || !/^[a-zA-Z0-9_-]+$/.test(transactionId)) {
    return res.status(400).json({
      status: false,
      message: "Invalid transaction id",
    });
  }

  next();
};

const ALLOWED_EXPORT_TYPES = ["excel", "csv"];
const ALLOWED_TITLES = ["Transactions", "Cashbacks"];

exports.validateCorporateReportQuery = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().required(),
    to: Joi.date().required(),

    searchText: Joi.string()
      .trim()
      .allow("")
      .max(100)
      .default(""),

    title: Joi.string()
      .valid(...ALLOWED_TITLES)
      .required()
      .messages({
        "any.only": "Title must be Transactions or Cashbacks",
      }),


    categoryName: Joi.string()
      .allow("")
      .default("all")
      .custom((value, helpers) => {
        let decoded;
        try {
          decoded = decodeURIComponent(value || "").trim() || "all";
        } catch {
          return helpers.error("any.invalid");
        }

        // Categories are DB-driven (same as /orders listing), so only sanity-check the value
        if (decoded.length > 100) {
          return helpers.error("any.invalid");
        }

        return decoded;
      })
      .messages({
        "any.invalid": "Invalid category selected",
      }),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid(...ALLOWED_SORT_FIELDS)
      .empty("")
      .default("corporateTxnId"),

    filter: Joi.string()
      .custom(normalizeFilterValue)
      .valid("SUCCESS", "FAILED", "PENDING", "REFUNDED")
      .messages({ 'any.only': 'Something went wrong, please try again later.' })
      .empty("")
      .optional(),

    corporateId: Joi.number().integer().optional(),

    accessKey: Joi.string().allow("all").empty("").optional(),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateExportTypeParam = (req, res, next) => {
  const { type } = req.params;

  if (![...ALLOWED_EXPORT_TYPES].includes(type)) {
    return res.status(400).json({
      status: false,
      message: "Invalid export type",
    });
  }

  next();
};

exports.validateSubscriptionOrdersQuery = (req, res, next) => {
  const normalize = (v) => (v === "" ? undefined : v);

  req.query.categoryName = normalize(req.query.categoryName);
  req.query.filter = normalize(req.query.filter);
  req.query.sortField = normalize(req.query.sortField);
  req.query.searchText = normalize(req.query.searchText);

  if (req.query.categoryName) {
    req.query.categoryName = decodeURIComponent(req.query.categoryName)
      .toUpperCase()
      .trim();
  }

  const schema = Joi.object({
    from: Joi.date().required(),
    to: Joi.date().min(Joi.ref("from")).required(),

    searchText: Joi.string().max(100).default(""),

    page: Joi.number().integer().min(1).default(1),
    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    categoryName: Joi.string()
      .valid(
        "ALL",
        "SUBSCRIPTION",
        "WHATSAPP-SUBSCRIPTION",
        "SUBSCRIPTION-ADDONS",
        "ACCOUNTING-SUBSCRIPTION",
        "BUSINESS-EMAIL-SUBSCRIPTION"
      )
      .optional(),

    filter: Joi.string()
      .custom(normalizeFilterValue)
      .valid("SUCCESS", "FAILED", "PENDING", "REFUNDED")
      .messages({ 'any.only': 'Something went wrong, please try again later.' })
      .optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .default("DESC"),

    sortField: Joi.string()
      .valid("corporateTxnId", "transactionDate", "amountInINR", "paymentMode")
      .default("transactionDate"),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  if (value.categoryName === "ALL") {
    value.categoryName = undefined;
  }

  req.query = value;
  next();
};

exports.validateWalletReportsQuery = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().required().messages({
      "date.base": "Invalid from date",
      "any.required": "From date is required",
    }),

    to: Joi.date().min(Joi.ref("from")).required().messages({
      "date.base": "Invalid to date",
      "any.required": "To date is required",
      "date.min": "To date must be after from date",
    }),

    searchText: Joi.string()
      .allow("")
      .max(100)
      .default(""),

    page: Joi.number()
      .integer()
      .min(1)
      .default(1),

    itemsPerPage: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .default("DESC"),

    sortField: Joi.string()
      .valid(
        "createdAt",
        "amount",
        "status",
        "transactionId"
      )
      .default("createdAt"),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateBannerListQuery = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().optional(),
    to: Joi.date().min(Joi.ref("from")).optional(),

    searchText: Joi.string()
      .allow("")
      .max(100)
      .default(""),

    page: Joi.number()
      .integer()
      .min(1)
      .default(1),

    itemsPerPage: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10),

    deviceType: Joi.string()
      .valid("WEB", "MOBILE", "ALL")
      .allow("")
      .empty("")
      .optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .default("DESC")
      .optional(),
    sortField: Joi.string()
      .empty("")
      .optional()
      .valid("createdAt", "deviceType", "bannerLink", "partnerId", "position", "status")
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};


exports.validateBrandingQuery = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().optional(),

    to: Joi.date()
      .min(Joi.ref("from"))
      .optional(),

    searchText: Joi.string()
      .allow("")
      .max(100)
      .default(""),

    page: Joi.number()
      .integer()
      .min(1)
      .default(1),

    itemsPerPage: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt")
      .allow("")
      .empty("")
      .default("createdAt"),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};


exports.validatePackageCashbackQuery = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().allow("").max(100).default(""),

    page: Joi.number().integer().min(1).default(1),

    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    partnerId: Joi.alternatives()
      .try(
        Joi.number().integer(),
        Joi.string().valid("default")
      )
      .allow("")
      .empty("")
      .optional(),

    serviceOperatorId: Joi.number().integer().allow("").empty("").optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid(
        "createdAt",
        "cashback",
        "cashbackType",
        "packageName",
        "serviceProvider",
        "vendorName",
        "partnerName",
        "surcharge"
      )
      .allow("")
      .empty("")
      .default("createdAt"),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateFetchServiceOperatorQuery = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().allow("").max(100).default(""),
    partnerId: Joi.number().integer().optional(),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};


exports.validateServicePackagesQuery = (req, res, next) => {
  const schema = Joi.object({
    partnerId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().valid("default"))
      .optional(),

    excludeBasic: Joi.boolean()
      .truthy("true")
      .falsy("false")
      .default(false),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateCheckCashbackServiceOperator = (req, res, next) => {
  const schema = Joi.object({
    partnerId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().valid("default"))
      .required(),

    packageId: Joi.number().integer().required(),

    serviceOperators: Joi.string()
      .pattern(/^[0-9,]+$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid service operator list",
      }),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateFetchServiceOperatorQuery = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string()
      .allow("")
      .max(100)
      .default("")
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: "Invalid search text",
    });
  }

  req.query = value;
  next();
};


exports.validateDashboardQuery = (req, res, next) => {
  const schema = Joi.object({
    fromDate: Joi.date().optional(),
    toDate: Joi.date()
      .min(Joi.ref("fromDate"))
      .optional()
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: "Invalid date range",
    });
  }

  req.query = value;
  next();
};

exports.validateDisabledServicesQuery = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().allow("").max(100).default(""),

    page: Joi.number().integer().min(1).default(1),

    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt", "id")
      .allow("")
      .empty("")
      .default("createdAt"),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};


exports.validateFetchServiceOperatorQuery = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string()
      .allow("")
      .max(100)
      .default(""),

    partnerId: Joi.alternatives()
      .try(
        Joi.number().integer(),
        Joi.string().valid("default"),
        Joi.string().allow("")
      )
      .optional(),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: "Invalid query parameters",
    });
  }

  req.query = value;
  next();
};


exports.validateFetchAllCorporateQuery = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string()
      .allow("")
      .max(100)
      .default(""),

    partnerId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().valid("default"), Joi.string().allow(""))
      .optional(),

    subPartnerId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().allow(""))
      .optional(),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: "Invalid query parameters",
    });
  }

  req.query = value;
  next();
};

exports.validateFindAllKybVerificationsQuery = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().optional(),

    to: Joi.date()
      .min(Joi.ref("from"))
      .optional(),

    searchText: Joi.string()
      .allow("")
      .max(100)
      .default(""),

    page: Joi.number()
      .integer()
      .min(1)
      .default(1),

    itemsPerPage: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: "Invalid query parameters",
    });
  }

  req.query = value;
  next();
};

exports.validateNotificationsQuery = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().optional(),
    to: Joi.date().min(Joi.ref("from")).optional(),

    searchText: Joi.string().allow("").max(100).default(""),

    page: Joi.number().integer().min(1).default(1),
    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    corporateId: Joi.alternatives()
      .try(Joi.number(), Joi.string().valid("default"))
      .optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt", "notificationTitle", "notificationBrief", "notificationCategory", "notificationTo")
      .allow("")
      .empty("")
      .default("createdAt"),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }

  req.query = value;
  next();
};

exports.validateTransactionsQuery = (req, res, next) => {
  if (req.query.categoryName !== undefined) {
    req.query.categoryName = decodeURIComponent(req.query.categoryName)
      .trim();
  }

  const schema = Joi.object({
    from: Joi.date().optional(),
    to: Joi.date().min(Joi.ref("from")).optional(),

    searchText: Joi.string().allow("").max(100).default(""),

    page: Joi.number().integer().min(1).default(1),
    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    corporateId: Joi.number()
      .allow(null)
      .empty("")
      .optional(),


    categoryName: Joi.string()
      .valid(
        "all",
        "Telecom Payments",
        "Utility Payments",
        "Travel",
        "Office Supplies",
        "Softwares",
        "Gift Card/Vouchers",
        "Peko Connect",
        "Invoicing",
        "Other Services"
      )
      .allow("")
      .optional(),

    filter: Joi.string()
      .custom(normalizeFilterValue)
      .valid("SUCCESS", "FAILED", "PENDING", "REFUNDED")
      .messages({ 'any.only': 'Something went wrong, please try again later.' })
      .optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("ASC"),

    sortField: Joi.string()
      .valid(
        "corporateTxnId",
        "transactionDate",
        "transactionCategory",
        "corporateCashback",
        "credential.username",
        "order.accountNo",
        "credential.name",
        "credential.registeredBy",
        "serviceOperator.serviceProvider"
      )
      .allow("")
      .empty("")
      .default("corporateTxnId"),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateFindAllPackagesQuery = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().allow("").max(100).default(""),

    page: Joi.number().integer().min(1).default(1),
    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt", "packageName", "status", "partnerName", "priorityLevel")
      .allow("")
      .empty("")
      .default("createdAt"),

    partnerId: Joi.alternatives()
      .try(Joi.number(), Joi.string())
      .allow("")
      .empty("")
      .optional(),

    type: Joi.alternatives()
      .try(Joi.number().valid(1, 2), Joi.string())
      .allow("")
      .empty("")
      .optional(),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }

  req.query = value;
  next();
};


exports.validateDashboardStatisticsQuery = (req, res, next) => {
  const schema = Joi.object({
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2000).max(2100).required(),
  });

  const { value, error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: "Invalid month or year.",
    });
  }

  req.query = value;
  next();
};

exports.validateGetPackagesCashbackQuery = (req, res, next) => {
  const schema = Joi.object({
    partnerId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().valid("default"))
      .optional()
      .allow("")
      .empty(""),
  });

  const { value, error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: "Invalid partnerId",
    });
  }

  req.query = value;
  next();
};

exports.validateGetPackagesCashbackQuery = (req, res, next) => {
  const schema = Joi.object({
    partnerId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().valid("default"))
      .optional()
      .allow("")
      .empty(""),
  });

  const { value, error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: "Invalid partnerId",
    });
  }

  req.query = value;
  next();
};

exports.validateFindAllPartnerPermission = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().optional().allow(""),
    to: Joi.date().optional().allow(""),

    searchText: Joi.string().allow("").optional(),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .optional()
      .allow("")
      .empty(""),

    sortField: Joi.string()
      .valid(
        "createdAt",
        "status",
        "partnerId",
      )
      .optional()
      .allow("")
      .empty(""),
  });

  const { value, error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }

  req.query = value;
  next();
};

exports.walletReportsValidation = (req, res, next) => {

  const schema = Joi.object({
    from: Joi.date().iso().optional().allow(null, ""),
    to: Joi.date().iso().optional().allow(null, ""),

    searchText: Joi.string().allow("", null).default(""),

    page: Joi.number().integer().min(1).optional(),
    // F-OTH-08: this was the one itemsPerPage validator in the file with no upper bound —
    // every other one caps at 100, matching that here.
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    corporateId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().valid("default"))
      .optional()
      .allow("", null),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .optional()
      .allow("")
      .default("DESC"),

    sortField: Joi.string()
      .valid(
        "createdAt",
        "transactionDate",
        "corporateTxnId",
        "debitAmount",
        "creditAmount",
        "status",
        "credential.name",
        "credential.username",
        "transactionType"
      )
      .optional()
      .allow("")
      .default("createdAt"),
  })
  const { value, error } = schema.validate(req.query);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }

  req.query = value;
  next();
};

exports.validateCorporateUsersQuery = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().allow("").default(""),

    page: Joi.number().integer().min(1).default(1),
    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    partnerId: Joi.alternatives()
      .try(Joi.number(), Joi.string().valid("default"))
      .allow("")
      .optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid("createdAt", "credential.username", "credential.registeredBy", "isActive", "city")
      .allow("")
      .empty("")
      .default("createdAt"),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: "Invalid query parameters",
    });
  }

  req.query = value;
  next();
};


exports.findAllSubscriptionsValidation = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().allow("").optional(),

    packageType: Joi.string().optional().allow(""),

    searchText: Joi.string().allow("").optional(),

    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),

    corporateId: Joi.string().allow("", null).optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid(
        "subscriptionStartDate",
        "subscriptionEndDate",
        "createdAt",
        "subscriptionPaymentRefId",
        "corporateName",
        "packageName",
        "corporateTxnId",
        "corporateUsername",
        "registeredByUsername",
        "subscriptionPrice",
        "discount",
        "paymentMode",
        "subscriptionAmountPaid",
        "voucherCode",
      )
      .allow("")
      .empty("")
      .default("createdAt"),
    page: Joi.number().integer().min(1).optional(),

    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),
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

exports.findAllSystemUsersValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().allow("").optional(),

    userType: Joi.string()
      .valid("SYSTEMUSER", "PARTNER", "SUBPARTNER")
      .required(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid(
        "createdAt",
        "isActive",
        "credential.username",
        "credential.name",
        "roleAndPermission.roleName",
      )
      .allow("")
      .empty("")
      .default("createdAt"),

    page: Joi.number().integer().min(1).optional(),

    itemsPerPage: Joi.number()
      .integer()
      .min(1)
      .max(100)
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


exports.fetchAllCorporateUsersValidation = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().allow("").optional(),

    partnerId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().valid("default"))
      .allow("", null)
      .optional(),

    subPartnerId: Joi.number().integer().allow("", null).optional(),
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


exports.findAllTransactionsCorporateValidation = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),

    searchText: Joi.string().allow("").optional(),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    corporateId: Joi.number().integer().allow("", null).optional(),

    categoryName: Joi.string().allow("").optional(),

    filter: Joi.string().allow("").optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid(
        "corporateTxnId",
        "transactionDate",
        "transactionCategory",
        "creditAmount",
        "debitAmount",
        "totalCashback",
        "systemCashback",
        "balance",
        "status"
      )
      .allow("")
      .empty("")
      .default("corporateTxnId"),
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

exports.getTransactionReportValidation = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),

    searchText: Joi.string().allow("").optional(),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    corporateId: Joi.number().integer().allow("", null).optional(),
    partnerId: Joi.alternatives()
      .try(
        Joi.number().integer(),
        Joi.string().valid("default"),
        Joi.string().allow("")
      )
      .optional(),
    categoryName: Joi.string().allow("").optional(),
    filter: Joi.string().allow("").optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid(
        "transactionDate",
        "customerName",
        "serviceCategory",
        "service",
        "partner",
        "paymentMode",
        "vendorName",
        "Amount",
      )
      .allow("")
      .empty("")
      .default("transactionDate"),
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
exports.findAllPendingSignUpsAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),

    searchText: Joi.string().allow("").optional(),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    partnerId: Joi.alternatives()
      .try(
        Joi.number().integer(),
        Joi.string().valid("default"),
        Joi.string().allow("")
      )
      .optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid(
        "createdAt",
        "companyName",
        "partnerId",
        "status",
      )
      .allow("")
      .empty("")
      .default("createdAt"),

    status: Joi.string()
      .valid("PENDING", "COMPLETED", "CLOSED")
      .allow("")
      .empty("")
      .default("PENDING"),
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

exports.updatePendingSignUpValidation = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid("PENDING", "CLOSED").required(),
    remarks: Joi.string().allow("").max(2000).optional(),
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

exports.findAllMessageAndCountValidation = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().allow("").optional(),

    searchText: Joi.string().allow("").optional(),

    from: Joi.date().iso().optional(),
    to: Joi.date().iso().optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    page: Joi.number().integer().min(1).optional(),

    itemsPerPage: Joi.number()
      .integer()
      .min(1)
      .max(100)
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


exports.findAllServiceOperatorAndCountValidation = (req, res, next) => {
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
      .valid("createdAt", "serviceProvider", "accessKey", "serviceCategory", "commissionType", "providerCommission", "vendor.vendorName", "serviceStatus")
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

exports.fetchAllRolesAndPermissionsValidation = (req, res, next) => {
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
      .valid("createdAt", "roleName")
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
exports.findAllReferralCodesAndCountValidation = (req, res, next) => {
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
      .valid("createdAt", "referralCode", "contactPersonName", "contactPersonPhone", "partnerName", "status")
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

exports.generalReferralReportsExcelValidation = (req, res, next) => {
  const schema = Joi.object({
    fromDate: Joi.date().iso().allow("", null).optional(),

    toDate: Joi.date()
      .iso()
      .allow("", null)
      .when("fromDate", {
        is: Joi.date().iso(),
        then: Joi.date().min(Joi.ref("fromDate")),
      }),

    // F-OTH-20: Joi.string().allow("", null) accepted ANY string, including a SQLi payload
    // like "1 OR SLEEP(3)" — it reaches a raw-interpolated query in referral_codes.js with
    // no further validation. The only real string value this field ever takes is 'default'.
    partnerId: Joi.alternatives()
      .try(
        Joi.number().integer(),
        Joi.string().valid("default").allow("", null)
      )
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

exports.validateUpdateIsAdmin = (req, res, next) => {
    const schema = Joi.object({
        isAdmin: Joi.boolean().required().messages({
            'boolean.base': 'isAdmin must be true or false',
            'any.required': 'isAdmin is required',
        }),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true, convert: true });

    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            responseCode: '001',
        });
    }

    req.body = value;
    next();
};

exports.validateCopyCashbackCompareQuery = (req, res, next) => {
  const partnerIdRule = Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().valid("default"))
    .required();

  const schema = Joi.object({
    fromPartnerId: partnerIdRule.messages({
      "any.required": "fromPartnerId is required.",
      "alternatives.match":
        "fromPartnerId must be a positive integer or the string 'default'.",
    }),
    toPartnerId: partnerIdRule.messages({
      "any.required": "toPartnerId is required.",
      "alternatives.match":
        "toPartnerId must be a positive integer or the string 'default'.",
    }),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validatePartnerServiceAccessQuery = (req, res, next) => {
  const schema = Joi.object({
    partnerId: Joi.number().integer().positive().allow("").empty("").optional(),
    searchText: Joi.string().allow("").max(100).default(""),
    status: Joi.boolean().allow("").empty("").optional(),
    page: Joi.number().integer().min(1).default(1),
    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

const ACCOUNTING_SERVICE_TYPES = ["with_plans", "without_plans"];
const ACCOUNTING_SORTABLE_FIELDS = [
    "serviceProvider",
    "serviceCategory",
    "serviceStatus",
    "commissionType",
    "providerCommission",
    "createdAt",
    "vendor.vendorName",
];

exports.validateAccountingServicesQuery = (req, res, next) => {
    const schema = Joi.object({
        type: Joi.string().valid(...ACCOUNTING_SERVICE_TYPES).required(),
        page: Joi.number().integer().min(1).default(1),
        itemsPerPage: Joi.number().integer().min(1).max(100).default(10),
        searchText: Joi.string().allow("").max(100).default(""),
        sort: Joi.string().valid("ASC", "DESC").empty("").default("DESC"),
        sortField: Joi.string()
            .valid(...ACCOUNTING_SORTABLE_FIELDS)
            .empty("")
            .default("serviceProvider"),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            data: {},
            responseCode: "001",
        });
    }

    req.query = value;
    next();
};

const ACCOUNTING_PLAN_SORTABLE_FIELDS = ["planName", "partnerName"];

exports.validateAccountingServicePlansQuery = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        itemsPerPage: Joi.number().integer().min(1).max(100).default(10),
        searchText: Joi.string().allow("").max(100).default(""),
        partnerId: Joi.string().allow("").default(""),
        sort: Joi.string().valid("ASC", "DESC").empty("").default("ASC"),
        sortField: Joi.string()
            .valid(...ACCOUNTING_PLAN_SORTABLE_FIELDS)
            .empty("")
            .default(""),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            data: {},
            responseCode: "001",
        });
    }

    req.query = value;
    next();
};

exports.validateAccountingDashboardQuery = (req, res, next) => {
    const schema = Joi.object({
        refresh: Joi.boolean().truthy("1").falsy("0").default(false),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            data: {},
            responseCode: "001",
        });
    }

    req.query = value;
    next();
};

const VENDOR_LEDGER_SORTABLE_FIELDS = ["vendorName", "type", "isActive", "createdAt"];

exports.validateVendorLedgerQuery = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        itemsPerPage: Joi.number().integer().min(1).max(100).default(10),
        searchText: Joi.string().allow("").max(100).default(""),
        sort: Joi.string().valid("ASC", "DESC").empty("").default("ASC"),
        sortField: Joi.string()
            .valid(...VENDOR_LEDGER_SORTABLE_FIELDS)
            .empty("")
            .default("vendorName"),
        refresh: Joi.boolean().truthy("1").falsy("0").default(false),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            data: {},
            responseCode: "001",
        });
    }

    req.query = value;
    next();
};

const PARTNER_LEDGER_SORTABLE_FIELDS = [
    "partnerName",
    "sharePercentage",
    "brandingStatus",
    "createdAt",
];

exports.validatePartnerLedgerQuery = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        itemsPerPage: Joi.number().integer().min(1).max(100).default(10),
        searchText: Joi.string().allow("").max(100).default(""),
        sort: Joi.string().valid("ASC", "DESC").empty("").default("ASC"),
        sortField: Joi.string()
            .valid(...PARTNER_LEDGER_SORTABLE_FIELDS)
            .empty("")
            .default("partnerName"),
        refresh: Joi.boolean().truthy("1").falsy("0").default(false),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            data: {},
            responseCode: "001",
        });
    }

    req.query = value;
    next();
};

const PAYMENT_GATEWAY_LEDGER_SORTABLE_FIELDS = ["gatewayName", "createdAt"];

exports.validatePaymentGatewayLedgerQuery = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        itemsPerPage: Joi.number().integer().min(1).max(100).default(10),
        searchText: Joi.string().allow("").max(100).default(""),
        sort: Joi.string().valid("ASC", "DESC").empty("").default("ASC"),
        sortField: Joi.string()
            .valid(...PAYMENT_GATEWAY_LEDGER_SORTABLE_FIELDS)
            .empty("")
            .default("gatewayName"),
        refresh: Joi.boolean().truthy("1").falsy("0").default(false),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            data: {},
            responseCode: "001",
        });
    }

    req.query = value;
    next();
};

// The fee table paginates, searches and filters independently, via its own feePage,
// feeSearchText and feeStatus; the plain names belong to the received table.
exports.validatePaymentGatewaySettlementQuery = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        feePage: Joi.number().integer().min(1).default(1),
        itemsPerPage: Joi.number().integer().min(1).max(100).default(5),
        searchText: Joi.string().allow("").max(100).default(""),
        status: Joi.string().valid("received", "opening", "reversal", "reversed", "deleted").empty(""),
        mode: Joi.string().valid("NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER").empty(""),
        feeSearchText: Joi.string().allow("").max(100).default(""),
        feeStatus: Joi.string().valid("charged", "reversal", "reversed", "deleted").empty(""),
        from: Joi.date().iso(),
        to: Joi.date().iso().min(Joi.ref("from")),
    }).and("from", "to");

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            data: {},
            responseCode: "001",
        });
    }

    req.query = value;
    next();
};

const OTHER_SALES_SORTABLE_FIELDS = [
    "transactionDate",
    "corporateTxnId",
    "service",
    "vendorName",
    "totalAmount",
    "status",
];

exports.validateOtherSalesQuery = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        itemsPerPage: Joi.number().integer().min(1).max(100).default(10),
        searchText: Joi.string().allow("").max(100).default(""),
        accounts: Joi.string().valid("all", "internal").empty("").default("all"),
        sort: Joi.string().valid("ASC", "DESC").empty("").default("DESC"),
        sortField: Joi.string()
            .valid(...OTHER_SALES_SORTABLE_FIELDS)
            .empty("")
            .default("transactionDate"),
        vendorId: Joi.number().integer().min(1).empty(""),
        partnerId: Joi.alternatives()
            .try(Joi.number().integer().min(1), Joi.string().valid("default"))
            .allow("")
            .empty("")
            .optional(),
        from: Joi.date().iso(),
        to: Joi.date().iso().min(Joi.ref("from")),
    }).and("from", "to");

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            data: {},
            responseCode: "001",
        });
    }

    req.query = value;
    next();
};

const THIRD_PARTY_SALES_SORTABLE_FIELDS = ["eventDate", "amount", "createdAt", "status"];

const THIRD_PARTY_SALES_STATUSES = ["paid", "pending", "failed", "expired"];

exports.validateThirdPartySalesQuery = (req, res, next) => {
    const params = Joi.object({
        kind: Joi.string()
            .valid(...Object.values(THIRD_PARTY_SALE_KINDS))
            .required(),
    }).unknown(true);
    if (params.validate(req.params || {}).error) {
        return res.status(400).json({
            status: false,
            message: "Unknown third-party sales kind",
            data: {},
            responseCode: "001",
        });
    }

    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        itemsPerPage: Joi.number().integer().min(1).max(100).default(10),
        searchText: Joi.string().allow("").max(100).default(""),
        accounts: Joi.string().valid("all", "internal").empty("").default("all"),
        sort: Joi.string().valid("ASC", "DESC").empty("").default("DESC"),
        sortField: Joi.string()
            .valid(...THIRD_PARTY_SALES_SORTABLE_FIELDS)
            .empty("")
            .default("eventDate"),
        status: Joi.string()
            .valid(...THIRD_PARTY_SALES_STATUSES)
            .empty(""),
        from: Joi.date().iso(),
        to: Joi.date().iso().min(Joi.ref("from")),
    }).and("from", "to");

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            data: {},
            responseCode: "001",
        });
    }

    req.query = value;
    next();
};

exports.validateLedgerTabQuery = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        itemsPerPage: Joi.number().integer().min(1).max(100).default(10),
        searchText: Joi.string().allow("").max(100).default(""),
        // Only the tabs with a Status filter read these, each its own choices; every other tab
        // ignores them.
        status: Joi.string()
            .valid(
                "success",
                "refunded",
                "failed",
                "earned",
                "active",
                "paid",
                "received",
                "charged",
                "opening",
                "reversal",
                "reversed",
                "deleted"
            )
            .empty(""),
        mode: Joi.string().valid("NEFT", "RTGS", "IMPS", "UPI", "CHEQUE", "OTHER").empty(""),
        // Only the subscriber Wallet reads this: the kind of movement.
        type: Joi.string()
            .valid("purchase", "refund", "cashback", "cashback-reversal", "top-up", "admin-credit", "admin-withdrawal")
            .empty(""),
        // Only the statements and the subscriber Wallet read this: debit or credit lines.
        side: Joi.string().valid("debit", "credit").empty(""),
        from: Joi.date().iso(),
        to: Joi.date().iso().min(Joi.ref("from")),
    }).and("from", "to");

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            data: {},
            responseCode: "001",
        });
    }

    req.query = value;
    next();
};

exports.validateLedgerDetailQuery = (req, res, next) => {
    const schema = Joi.object({
        from: Joi.date().iso(),
        to: Joi.date().iso().min(Joi.ref("from")),
    }).and("from", "to");

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            data: {},
            responseCode: "001",
        });
    }

    req.query = value;
    next();
};

exports.validateVendorLedgerTabQuery = exports.validateLedgerTabQuery;
exports.validateVendorLedgerDetailQuery = exports.validateLedgerDetailQuery;

const SUBSCRIBER_LEDGER_SORTABLE_FIELDS = ["name", "username", "walletBalance", "isActive", "createdAt"];

exports.validateSubscriberLedgerQuery = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        itemsPerPage: Joi.number().integer().min(1).max(100).default(10),
        searchText: Joi.string().allow("").max(100).default(""),
        sort: Joi.string().valid("ASC", "DESC").empty("").default("ASC"),
        sortField: Joi.string()
            .valid(...SUBSCRIBER_LEDGER_SORTABLE_FIELDS)
            .empty("")
            .default("name"),
        partnerId: Joi.alternatives()
            .try(Joi.number().integer().min(1), Joi.string().valid("default"))
            .allow("")
            .empty("")
            .optional(),
        refresh: Joi.boolean().truthy("1").falsy("0").default(false),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) {
        return res.status(400).json({
            status: false,
            message: error.details[0].message,
            data: {},
            responseCode: "001",
        });
    }

    req.query = value;
    next();
};

const SERVICE_APPROVAL_STATUSES = ["awaiting", "pending", "approved", "rejected", "all"];

const invalidQuery = (res, error) =>
    res.status(400).json({
        status: false,
        message: error.details[0].message,
        data: {},
        responseCode: "001",
    });

exports.validateServiceApprovalParams = (req, res, next) => {
    const schema = Joi.object({
        partnerPermissionId: Joi.number().integer().positive().required(),
    });

    const { value, error } = schema.validate(req.params, { allowUnknown: true, convert: true });
    if (error) return invalidQuery(res, error);

    req.params.partnerPermissionId = value.partnerPermissionId;
    next();
};

exports.validateServiceApprovalsQuery = (req, res, next) => {
    const schema = Joi.object({
        status: Joi.string()
            .valid(...SERVICE_APPROVAL_STATUSES)
            .empty("")
            .default("all"),
        switchedOn: Joi.boolean().truthy("1").falsy("0").empty(""),
        searchText: Joi.string().allow("").max(100).default(""),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return invalidQuery(res, error);

    req.query = value;
    next();
};

exports.validateServiceApprovalNodeQuery = (req, res, next) => {
    const schema = Joi.object({
        nodeKey: Joi.string().trim().min(1).max(255).required(),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return invalidQuery(res, error);

    req.query = value;
    next();
};

const SERVICE_CLASSIFICATIONS = [
    "all",
    "unclassified",
    "with_plans",
    "without_plans",
    "peko_subscription",
    "peko_subscription_vendor",
];

exports.validateServiceClassificationParams = (req, res, next) => {
    const schema = Joi.object({
        accessKey: Joi.string().trim().min(1).max(100).required(),
    });

    const { value, error } = schema.validate(req.params, { allowUnknown: true, convert: true });
    if (error) return invalidQuery(res, error);

    req.params.accessKey = value.accessKey;
    next();
};

exports.validateServiceClassificationQuery = (req, res, next) => {
    const schema = Joi.object({
        classification: Joi.string()
            .valid(...SERVICE_CLASSIFICATIONS)
            .empty("")
            .default("all"),
        page: Joi.number().integer().min(1).default(1),
        itemsPerPage: Joi.number().integer().min(1).max(100).default(10),
        searchText: Joi.string().allow("").max(100).default(""),
        sort: Joi.string().valid("ASC", "DESC").empty("").default("ASC"),
        sortField: Joi.string()
            .valid(...ACCOUNTING_SORTABLE_FIELDS)
            .empty("")
            .default("serviceProvider"),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return invalidQuery(res, error);

    req.query = value;
    next();
};

exports.validateConfigAuditLogsQuery = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        itemsPerPage: Joi.number().integer().min(1).max(100).default(10),
        searchText: Joi.string().allow("").max(100).default(""),
        configType: Joi.string()
            .valid(...CONFIG_TYPES)
            .empty(""),
        source: Joi.string().valid("ACCOUNTING_PORTAL", "ADMIN_PANEL").empty(""),
        partnerName: Joi.string().max(255).empty(""),
        sort: Joi.string().valid("ASC", "DESC").empty("").default("DESC"),
        sortField: Joi.string()
            .valid("createdAt", "actorName", "configType", "partnerName")
            .empty("")
            .default("createdAt"),
        from: Joi.date().iso(),
        to: Joi.date().iso().min(Joi.ref("from")),
    }).and("from", "to");

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return invalidQuery(res, error);

    req.query = value;
    next();
};

exports.validateCommissionInvoiceSearchQuery = (req, res, next) => {
    const schema = Joi.object({ search: Joi.string().trim().min(1).max(60).required() });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return invalidQuery(res, error);

    req.query = value;
    next();
};

const PAYMENT_LINK_CHARGE_SORTABLE_FIELDS = ["corporate", "status", "updatedAt"];

exports.validatePaymentLinkChargesQuery = (req, res, next) => {
    const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        itemsPerPage: Joi.number().integer().min(1).max(100).default(10),
        searchText: Joi.string().allow("").max(100).default(""),
        scope: Joi.string().valid("all", "custom").empty("").default("all"),
        sort: Joi.string().valid("ASC", "DESC").empty("").default("ASC"),
        sortField: Joi.string()
            .valid(...PAYMENT_LINK_CHARGE_SORTABLE_FIELDS)
            .empty("")
            .default("corporate"),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return invalidQuery(res, error);

    req.query = value;
    next();
};

exports.validatePaymentLinkChargeParams = (req, res, next) => {
    const schema = Joi.object({
        credentialId: Joi.number().integer().positive().required(),
    }).unknown(true);

    const { value, error } = schema.validate(req.params || {}, { convert: true });
    if (error) return invalidQuery(res, error);

    req.params = { ...req.params, credentialId: value.credentialId };
    next();
};
