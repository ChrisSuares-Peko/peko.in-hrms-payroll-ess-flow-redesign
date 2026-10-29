const Joi = require("joi");
const { customLog } = require("../loggerHelper");

/* ---------------- CONSTANTS ---------------- */
const ALLOWED_SORTS = Object.freeze(["rating", "name"]);

exports.validateSearchRequest = (req, res, next) => {
  try {
    /* -------- QUERY PARAMS -------- */
    const querySchema = Joi.object({
      query: Joi.string().trim().min(3).required().messages({
        "string.empty": "Search query cannot be empty",
        "string.min": "Search query must contain at least 3 character",
        "any.required": "Search query is required",
      }),

      productLimit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(50)
        .messages({
          "number.base": "productLimit must be a number",
          "number.integer": "productLimit must be an integer",
          "number.min": "productLimit must be at least 1",
          "number.max": "productLimit cannot exceed 100",
        }),

      parentCategoryLimit: Joi.number()
        .integer()
        .min(1)
        .max(50)
        .default(3)
        .messages({
          "number.base": "parentCategoryLimit must be a number",
          "number.integer": "parentCategoryLimit must be an integer",
          "number.min": "parentCategoryLimit must be at least 1",
          "number.max": "parentCategoryLimit cannot exceed 50",
        }),

      subCategoryLimit: Joi.number()
        .integer()
        .min(1)
        .max(50)
        .default(3)
        .messages({
          "number.base": "subCategoryLimit must be a number",
          "number.integer": "subCategoryLimit must be an integer",
          "number.min": "subCategoryLimit must be at least 1",
          "number.max": "subCategoryLimit cannot exceed 50",
        }),

      parentCategorySlug: Joi.string().trim().optional().messages({
        "string.base": "parentCategorySlug must be a string",
      }),
    });

    const { value: query, error: queryError } = querySchema.validate(
      req.query,
      {
        allowUnknown: true,
        stripUnknown: true,
        convert: true,
      },
    );

    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    req.query = query;
    next();
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      message: "Search validation failed",
      error: err.message,
    });
    next(err);
  }
};

exports.validateCategories = (req, res, next) => {
  try {
    /* -------- PATH PARAM -------- */
    const paramsSchema = Joi.object({
      parentCategory: Joi.string().trim().lowercase().required().messages({
        "any.required": "Category is required",
        "string.empty": "Category cannot be empty",
      }),
    });

    const { value: params, error: paramsError } = paramsSchema.validate(
      req.params,
    );

    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    req.params = params;
    req.params.parentCategory = decodeURIComponent(req.params.parentCategory);

    /* -------- QUERY PARAMS -------- */
    const querySchema = Joi.object({
      page: Joi.number().integer().min(1).default(1).messages({
        "number.base": "page must be a number",
        "number.integer": "page must be an integer",
        "number.min": "page must be at least 1",
      }),

      limit: Joi.number().integer().min(1).max(50).default(10).messages({
        "number.base": "limit must be a number",
        "number.integer": "limit must be an integer",
        "number.min": "limit must be at least 1",
        "number.max": "limit cannot exceed 50",
      }),

      sortBy: Joi.string()
        .trim()
        .lowercase()
        // .valid(
        //   "rating_high_to_low",
        //   "rating_low_to_high",
        //   "name_asc",
        //   "name_desc",
        // )
        .valid(...ALLOWED_SORTS)
        .optional()
        .messages({
          "any.only": `Sorting must be one of: ${ALLOWED_SORTS.join(", ")}`,
        }),

      search: Joi.string().trim().max(100).allow("").optional().messages({
        "string.max": "Search query cannot exceed 100 characters",
      }),

      filter: Joi.string().trim().max(100).allow("").optional().messages({
        "string.max": "Filter cannot exceed 100 characters",
      }),
    });

    const { value: query, error: queryError } = querySchema.validate(
      req.query,
      {
        allowUnknown: true,
        stripUnknown: true,
        convert: true,
      },
    );

    if (queryError) {
      throw new Error(queryError.details[0].message);
    }

    req.query = query;
    next();
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      message: "Category validation failed",
      error: err.message,
    });
    next(err);
  }
};

exports.validateProduct = (req, res, next) => {
  try {
    /* -------- PATH PARAM -------- */
    const paramsSchema = Joi.object({
      productUrl: Joi.string().trim().lowercase().required().messages({
        "any.required": "Product is required",
        "string.empty": "Product cannot be empty",
      }),
    });

    const { value: params, error: paramsError } = paramsSchema.validate(
      req.params,
    );

    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    req.params = params;
    req.params.productUrl = decodeURIComponent(req.params.productUrl);
    next();
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      message: "Category validation failed",
      error: err.message,
    });
    next(err);
  }
};

exports.validateCategoryForQuestion = (req, res, next) => {
  try {
    /* -------- PATH PARAM -------- */
    const paramsSchema = Joi.object({
      parentCategory: Joi.string().trim().lowercase().required().messages({
        "any.required": "Category is required",
        "string.empty": "Category cannot be empty",
      }),
    });

    const { value: params, error: paramsError } = paramsSchema.validate(
      req.params,
    );

    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    req.params = params;
    next();
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      message: "Category validation failed",
      error: err.message,
    });
    next(err);
  }
};

exports.validateRfpSubmission = (req, res, next) => {
  try {
    const questionValue = Joi.object({
      question: Joi.string().trim().required().messages({
        "string.empty": "Question cannot be empty",
        "any.required": "Question is required",
      }),
      answer: Joi.alternatives()
        .try(Joi.string().trim(), Joi.array().items(Joi.string().trim()).min(1))
        .required()
        .messages({
          "any.required": "Answer is required",
        }),
      followUp: Joi.object({
        question: Joi.string().trim().required(),
        answer: Joi.alternatives()
          .try(
            Joi.string().trim(),
            Joi.array().items(Joi.string().trim()).min(1),
          )
          .required(),
      }).optional(),
    });

    const bodySchema = Joi.object({
      softwareCategory: Joi.string().trim().required().messages({
        "string.empty": "Software category cannot be empty",
        "any.required": "Software category is required",
      }),

      generalQuestions: Joi.object()
        .pattern(Joi.string(), questionValue)
        .optional()
        .default({})
        .messages({
          "object.base": "General questions must be an object",
        }),

      specializedQuestions: Joi.object()
        .pattern(Joi.string(), questionValue)
        .min(1)
        .required()
        .messages({
          "object.base": "Specialized questions must be an object",
          "object.min": "At least one specialized question is required",
        }),
    });

    const { value: body, error: bodyError } = bodySchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (bodyError) {
      throw new Error(bodyError.details.map((d) => d.message).join(", "));
    }

    req.body = body;
    next();
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      message: "rfp recommandation validation failed",
      error: err.message,
    });
    next(err);
  }
};

exports.validatePurchaseAssistance = (req, res, next) => {
  try {
    /* -------- PATH PARAM -------- */
    const paramsSchema = Joi.object({
      productUrl: Joi.string().trim().lowercase().required().messages({
        "any.required": "Product is required",
        "string.empty": "Product cannot be empty",
      }),
    });

    const { value: params, error: paramsError } = paramsSchema.validate(
      req.params,
    );

    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    req.params = params;
    req.params.productUrl = decodeURIComponent(req.params.productUrl);
    next();
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      message: "Get assistance validation failed",
      error: err.message,
    });
    next(err);
  }
};

exports.validateSoftwaresPayment = (req, res, next) => {
  try {
    /* -------- BODY -------- */
    const schema = Joi.object({
      plan: Joi.object({
        skuCode: Joi.string()
          .messages({
            "string.base": "sku code must be a string.",
            "any.required": "sku code is required.1111",
          })
          .required(),
        webUrl: Joi.string().required().messages({
          "string.base": "webUrl name must be a string.",
        }),
        productName: Joi.string().required().messages({
          "string.base": "Product Name must be a string.",
          "any.required": "Product Name is required.",
        }),
        planName: Joi.string().required().messages({
          "string.base": "Plan name must be a string.",
        }),
        pricingDetails: Joi.object({
          billingCycle: Joi.string().required().messages({
            "string.base": "Billing cycle must be a string.",
            "any.required": "Billing cycle is required.",
          }),
          amount: Joi.string().required().messages({
            "string.base": "Amount must be a string.",
            "any.required": "Amount is required.",
          }), // default currency  amount  **********
          currency: Joi.string().required().messages({
            "string.base": "Currency must be a string.",
            "any.required": "Currency is required.",
          }),
          discountPercentage: Joi.string().optional().messages({
            "string.base": "Discount percentage must be a string.",
          }),
          discountedAmount: Joi.string().optional().messages({
            "string.base": "Discounted amount must be a string.",
          }),
          discountedAmountInConvertedCurrency: Joi.string()
            .optional()
            .messages({
              "string.base":
                "discountedAmountInConvertedCurrency must be a string.",
            }),
        }).required(),
      }).required(),
      amount: Joi.string().required(),
      accessKey: Joi.string().required(),
    });

    const result = schema.validate(req.body);

    if (result.error) {
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      message: "An error occurred",
      error: err,
    });
    next(err);
  }
};