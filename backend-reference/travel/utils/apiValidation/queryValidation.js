const Joi = require("joi");

exports.validatePackageDetailsQuery = (req, res, next) => {
  const schema = Joi.object({
    orderId: Joi.number().integer().required(),
    iccid: Joi.string().trim().required(),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateFetchPackagesQuery = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string().trim().optional(),

    country: Joi.string().trim().optional(),

    limit: Joi.number().integer().min(1).max(100).default(10),

    page: Joi.number().integer().min(1).default(1),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateOrderPackageListQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    searchText: Joi.string()
      .trim()
      .allow("")
      .max(100)
      .default(""),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .default("DESC"),

    fromDate: Joi.date().optional(),
    toDate: Joi.date().optional(),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateTopupListQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

    searchText: Joi.string()
      .trim()
      .allow("")
      .max(100)
      .default(""),

    iccid: Joi.string().trim().allow("").optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .default("DESC"),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateCountriesQuery = (req, res, next) => {
  const schema = Joi.object({
    searchQuery: Joi.string()
      .trim()
      .allow("")
      .max(50)
      .default("")
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateAirportsQuery = (req, res, next) => {
  const schema = Joi.object({
    q: Joi.string()
      .trim()
      .allow("")
      .max(50)
      .default("")
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};


exports.validateBookingsQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    limit: Joi.number().integer().min(1).max(50).default(10),

    availability: Joi.string()
      .trim()
      .allow("")
      .optional()
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateBookingDetailsQuery = (req, res, next) => {
  const schema = Joi.object({
    id: Joi.number().integer().required()
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};


exports.validateCancelOtpQuery = (req, res, next) => {
  const schema = Joi.object({
    scope: Joi.string()
      .valid("email")
      .required(),

    id: Joi.number().integer().required()
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};


exports.validateDownloadTicketQuery = (req, res, next) => {
  const schema = Joi.object({
    orderId: Joi.number().integer().required()
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateHotelCancelOtpQuery = (req, res, next) => {
  const schema = Joi.object({
    scope: Joi.string().valid("email").required()
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};


exports.validateListBookingsQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    limit: Joi.number().integer().min(1).max(50).default(10),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateReportsQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    itemsPerPage: Joi.number().integer().min(1).max(100).default(10),

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
      .valid("order.transactionDate", "order.corporateTxnId", "order.status", "credential.username", "credential.name", "credential.registeredBy", "order.paymentMode", "order.providerId", "order.amountInINR")
      .empty("")
      .default("transactionDate"),

    from: Joi.date().optional(),
    to: Joi.date().optional(),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.validateCancelledBookingsQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    limit: Joi.number().integer().min(1).max(50).default(10),

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
      .valid("createdAt", "corporateTxnId", "status", "debitAmount", "credential.name", "id")
      .empty("")
      .default("createdAt"),
    credentialId: Joi.number()
      .integer()
      .empty("")
      .optional(),

    from: Joi.date().optional(),
    to: Joi.date().optional(),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};
exports.validatelistAllModificationQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),

    limit: Joi.number().integer().min(1).max(50).default(10),

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
      .valid("createdAt", "transaction.corporateTxnId", "status", "flightBooking.bookingReferenceId", "credential.name", "id")
      .empty("")
      .default("createdAt"),
    credentialId: Joi.number()
      .integer()
      .empty("")
      .optional(),

    from: Joi.date().optional(),
    to: Joi.date().optional(),
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message,
    });
  }

  req.query = value;
  next();
};

exports.fetchAllCancelledHotelBookingsValidation = (req, res, next) => {
  const schema = Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .default(10),

    page: Joi.number()
      .integer()
      .min(1)
      .default(1),

    credentialId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().allow(""))
      .optional(),
    partnerId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().allow(""))
      .optional(),
    sort: Joi.string()
      .valid("ASC", "DESC")
      .empty("")
      .default("ASC"),
    sortField: Joi.string()
      .valid("transactionDate")
      .empty("")
      .default("transactionDate"),
    from: Joi.date().optional(),

    to: Joi.date().optional(),

    searchText: Joi.string()
      .allow("")
      .default(""),
  });

  const { error, value } = schema.validate(req.query);

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

exports.validateAddAirport = (req, res, next) => {
    const schema = Joi.object({
        airportCode: Joi.string().trim().uppercase().alphanum().min(2).max(10).required().messages({
            'string.empty': 'Airport code is required',
            'any.required': 'Airport code is required',
            'string.max': 'Airport code must not exceed 10 characters',
        }),
        airportName: Joi.string().trim().min(2).max(200).required().messages({
            'string.empty': 'Airport name is required',
            'any.required': 'Airport name is required',
        }),
        cityCode: Joi.string().trim().uppercase().alphanum().max(10).allow('', null).optional(),
        cityName: Joi.string().trim().min(2).max(100).required().messages({
            'string.empty': 'City name is required',
            'any.required': 'City name is required',
        }),
        countryCode: Joi.string().trim().uppercase().alpha().max(10).allow('', null).optional(),
        countryName: Joi.string().trim().min(2).max(100).required().messages({
            'string.empty': 'Country name is required',
            'any.required': 'Country name is required',
        }),
        priority: Joi.number().integer().min(1).max(9999).allow(null).optional().messages({
            'number.base': 'Priority must be a number',
            'number.integer': 'Priority must be a whole number',
            'number.min': 'Priority must be at least 1',
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
