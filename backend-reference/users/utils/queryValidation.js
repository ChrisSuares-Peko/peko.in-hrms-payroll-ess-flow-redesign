const Joi = require("joi");

exports.validateGetWhatsAppNumbers = (req, res, next) => {
  const schema = Joi.object({
    searchText: Joi.string().allow("").optional(),

    page: Joi.number()
      .integer()
      .min(1)
      .default(1),

    itemsPerPage: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10),
  });

  const { value, error } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
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

exports.validateSubCorporateListQuery = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string()
      .valid("ACTIVE", "INACTIVE")
      .allow("")
      .optional(),

    page: Joi.number()
      .integer()
      .min(1)
      .default(1),

    itemsPerPage: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10),

    searchText: Joi.string()
      .allow("")
      .trim()
      .max(100)
      .default("")
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

exports.validatePackageDetailsQuery = (req, res, next) => {
  const schema = Joi.object({
    packageId: Joi.number()
      .integer()
      .required()
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message
    });
  }

  req.query = value;
  next();
};

exports.validateIndividualDetailsQuery = (req, res, next) => {
  const schema = Joi.object({
    accessKey: Joi.string().trim().required(),
    serviceAccessKey: Joi.string().trim().required()
  });

  const { value, error } = schema.validate(req.query, {
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      message: error.details[0].message
    });
  }

  req.query = value;
  next();
};

exports.validatePurchaseHistoryQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),

    itemsPerPage: Joi.number()
      .integer()
      .min(1)
      .max(1000)
      .default(10),

    status: Joi.string()
      .allow("")
      .optional(),

    packageType: Joi.string()
      .allow("")
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


exports.validateDownloadInvoice = (req, res, next) => {
  const schema = Joi.object({
    type: Joi.string()
      .valid("serviceSubscription", "whatsAppSubscription", "subscription")
      .allow("")
      .optional(),
  });

  const paramsSchema = Joi.object({
    subscriptionId: Joi.number()
      .integer()
      .required(),
  });

  const { value, error } = schema.validate(req.query, { stripUnknown: true });
  const { value: paramsValue, error: paramsError } = paramsSchema.validate(req.params);

  if (error || paramsError) {
    return res.status(400).json({
      message: error?.details?.[0]?.message || paramsError.details[0].message,
    });
  }

  req.query = value;
  req.params = paramsValue;
  next();
};
