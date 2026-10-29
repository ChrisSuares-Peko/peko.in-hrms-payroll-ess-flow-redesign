const Joi = require('@hapi/joi');

exports.findAllMessageAndCountValidation = (req, res, next) => {
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

exports.findAllBbpsTransactionsAndCountValidation = (req, res, next) => {
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

exports.findKYBDetailsValidation = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    searchText: Joi.string().trim().max(100).allow("").optional(),

    sort: Joi.string()
      .valid("ASC", "DESC")
      .allow("")
      .empty("")
      .default("DESC"),

    sortField: Joi.string()
      .valid(
        "createdAt",
        "companyName",
        "status",
        "credential.username",
        "offEmail"
      )
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


exports.findAllPaymentLinksAndCountValidation = (req, res, next) => {
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
      .valid(
        "createdAt",
        "id",
        "amount",
        "status",
        "expiryDate"
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



exports.validateVirtualAccountStatement = (req, res, next) => {
  const schema = Joi.object({
    from: Joi.string()
      .required(),
    to: Joi.string()
      .required(),
    page: Joi.number().integer().min(0).default(0).optional(),
    limit: Joi.number().integer().min(1).optional(),
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
      data: {},
    });
  }

  if (value.to <= value.from) {
    return res.status(400).json({
      status: false,
      message: '"to" must be after "from"',
      responseCode: "001",
      data: {},
    });
  }

  req.query = value;
  next();
};

exports.findRefundTransactionsValidation = (req, res, next) => {
  const schema = Joi.object({
    corporateId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().allow("", null))
      .optional(),

    serviceAccessKey: Joi.string().trim().max(100).allow("", null).optional(),

    searchText: Joi.string().trim().max(100).allow("").optional(),

    fromStart: Joi.date().allow("", null).optional(),

    endDate: Joi.date()
      .allow("", null)
      .when("fromStart", {
        is: Joi.date(),
        then: Joi.date().min(Joi.ref("fromStart")),
      }),

    page: Joi.number().integer().min(1).optional(),
    itemsPerPage: Joi.number().integer().min(1).max(100).optional(),

    sort: Joi.string().valid("ASC", "DESC").allow("").empty("").default("DESC"),

    sortField: Joi.string().allow("", null).optional(),

    partnerId: Joi.alternatives()
      .try(Joi.number().integer(), Joi.string().allow("", null))
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
