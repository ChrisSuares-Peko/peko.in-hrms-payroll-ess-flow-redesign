const Joi = require("joi");

exports.createListQueryValidator = (sortableColumns = []) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    pageSize: Joi.number().integer().min(1).max(100).default(10),

    searchText: Joi.string().allow("").max(100).default(""),

    // default if missing, error if invalid
    orderCol: Joi.string().valid("ASC", "DESC").default("DESC"),

    // default if missing, error if invalid
    column: Joi.number()
      .integer()
      .min(0)
      .max(sortableColumns.length - 1)
      .default(0),

    from: Joi.date().optional(),
    to: Joi.date().optional(),
  });

  return (req, res, next) => {
    const { value, error } = schema.validate(req.query, {
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        message: error.details[0].message,
      });
    }

    // whitelist mapping
    value.sortField = sortableColumns[value.column];

    req.query = value;
    next();
  };
};

const VERIFICATION_SORTABLE_FIELDS = [
  "createdAt",
  "updatedAt",
  "corporateTxnId",
  "VerificationType",
  "amountInINR"
];

const STATUS_VALUES = ["ALL", "INVALID", "VALID"];

exports.validateVerificationQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    searchText: Joi.string().allow("").max(100).default(""),

    status: Joi.string()
      .valid(...STATUS_VALUES)
      .empty("")
      .default("ALL"),

    sort: Joi.string().valid("ASC", "DESC").default("DESC"),

    sortField: Joi.string()
      .valid(...VERIFICATION_SORTABLE_FIELDS)
      .empty("")
      .optional(),

    from: Joi.date().optional(),
    to: Joi.date().optional(),
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

const VERIFICATION_SORTABLE_FIELDS_V2 = [
  "createdAt",
  "updatedAt",
  "verificationType",
  "status"
];

const STATUS_VALUES_V2 = ["ALL", "PENDING", "VALID", "INVALID"];

exports.validateVerificationQueryV2 = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    searchText: Joi.string().allow("").max(100).default(""),

    status: Joi.string()
      .valid(...STATUS_VALUES_V2)
      .empty("")
      .default("ALL"),

    sort: Joi.string().valid("ASC", "DESC").default("DESC"),

    sortField: Joi.string()
      .valid(...VERIFICATION_SORTABLE_FIELDS_V2)
      .empty("")
      .default("createdAt"),

    from: Joi.date().optional(),
    to: Joi.date().optional(),
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


exports.validateOrdersQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    pageSize: Joi.number().integer().min(1).max(100).default(10),

    searchText: Joi.string()
      .trim()
      .allow("")
      .max(100)
      .default(""),
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

exports.validatePurchaseHistoryQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    status: Joi.string()
      .valid("ACTIVE", "EXPIRED", "CANCELLED", "PENDING")
      .empty("")
      .optional(),

    packageType: Joi.string().trim().empty("").optional(),

    searchText: Joi.string()
      .trim()
      .allow("")
      .max(100)
      .default(""),
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


exports.validateAdminVerificationQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    searchText: Joi.string()
      .trim()
      .allow("")
      .max(100)
      .default(""),

    status: Joi.string()
      .valid(...STATUS_VALUES)
      .empty("")
      .default("ALL"),

      sort: Joi.string()
      .valid("ASC", "DESC")
      .empty("")
      .default("DESC"),    

    sortField: Joi.string()
      .valid(...VERIFICATION_SORTABLE_FIELDS)
      .empty("")
      .optional(),

    from: Joi.date().optional(),
    to: Joi.date().optional(),
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

const VERIFICATION_ADDON_HISTORY_SORTABLE_FIELDS = ["createdAt", "updatedAt"];

exports.validateVerificationAddonHistoryQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    sort: Joi.string().valid("ASC", "DESC").default("DESC"),

    sortField: Joi.string()
      .valid(...VERIFICATION_ADDON_HISTORY_SORTABLE_FIELDS)
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

exports.validateExportType = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string().valid("excel", "csv").required(),
  }).unknown(true);

  const { error } = schema.validate(req.params);

  if (error) {
    return res.status(400).json({
      message: "Invalid export type",
    });
  }

  next();
};


const ADDON_SORTABLE_FIELDS = [
  "createdAt",
  "credential.name",
  "credential.username",
  "subscriptionAmountPaid",
  "subscriptionPrice",
  "status"
];

const ADDON_STATUS_VALUES = [
  "ALL",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED"
];

exports.validateAddOnsQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    searchText: Joi.string()
      .trim()
      .allow("")
      .max(100)
      .default(""),

    status: Joi.string()
      .valid(...ADDON_STATUS_VALUES)
      .empty("")
      .default("ALL"),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid(...ADDON_SORTABLE_FIELDS)
      .empty("")
      .optional(),

    from: Joi.date().optional(),
    to: Joi.date().optional(),
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