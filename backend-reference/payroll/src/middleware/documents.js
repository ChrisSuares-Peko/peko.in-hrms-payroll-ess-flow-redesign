const Joi = require("joi");
const ErrorResponse = require("../utils/error-response");

exports.validateDocumentCreate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      name: Joi.string().required().messages({
        "string.empty": "Document name cannot be empty",
        "any.required": "Document name is required",
      }),
      employee: Joi.string().required().messages({
        "string.empty": "Employee field cannot be empty",
        "any.required": "Employee field is required",
      }),
      expiryDate: Joi.date().optional().allow(""),
      // holderName: Joi.string().required().messages({
      //   "string.empty": "Holder name cannot be empty",
      //   "any.required": "Holder name is required",
      // }),
      url: Joi.object({
        base64: Joi.string().required().messages({
          "string.empty": "Base64 URL cannot be empty",
          "any.required": "Base64 URL is required",
        }),
        format: Joi.string().required().messages({
          "any.required": "Attachment format is required",
        }),
      })
        .required()
        .messages({
          "object.base": "URL object is required",
          "any.required": "URL object is required",
        }),
      attachmentFormat: Joi.string().required().messages({
        "any.required": "Attachment format is required",
      }),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateDocumentUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      name: Joi.string().required().messages({
        "string.empty": "Document name cannot be empty",
        "any.required": "Document name is required",
      }),
      employee: Joi.string().required().messages({
        "string.empty": "Employee field cannot be empty",
        "any.required": "Employee field is required",
      }),
      expiryDate: Joi.date().optional().allow(""),
      // holderName: Joi.string().required().messages({
      //   "string.empty": "Holder name cannot be empty",
      //   "any.required": "Holder name is required",
      // }),
      url: Joi.alternatives()
        .try(
          Joi.object({
            base64: Joi.string().required().messages({
              "string.empty": "Base64 URL cannot be empty",
              "any.required": "Base64 URL is required",
            }),
            format: Joi.string().required().messages({
              "any.required": "Attachment format is required",
            }),
          }),
          Joi.string()
        )
        .required()
        .messages({
          "any.required": "URL object is required",
        }),

      attachmentFormat: Joi.string().optional(),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number",
      }),
      userType: Joi.string().optional(),
      documentId: Joi.string().optional(),
      employeeId: Joi.string().optional(),
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};