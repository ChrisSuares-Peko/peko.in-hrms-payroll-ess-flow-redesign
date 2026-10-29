const Joi = require("joi");
const { customLog } = require("../loggerHelper");

exports.validateOneKYBDocsUpload = (req, res, next) => {
    try {
      const documentSchema = Joi.object({
        documentName: Joi.string().required().messages({
          "any.required": "Document name is required.",
          "string.empty": "Document name cannot be empty.",
        }),
        fileBase: Joi.string().required().messages({
          "any.required": "File base (file content in base64) is required.",
          "string.empty": "File base cannot be empty.",
        }),
        fileFormat: Joi.string().required().messages({
          "any.required": "File format is required.",
          "string.empty": "File format cannot be empty.",
        }),
        expiryDate: Joi.string().optional().allow(null).messages({
          "string.base": "Expiry date must be a string.",
        }),
      });
  
      const schema = Joi.object({
        documents: Joi.array().items(documentSchema).required().messages({
          "any.required": "Documents are required.",
          "array.base": "Documents should be an array.",
        }),
        deleteDoclist: Joi.array().items(Joi.string()).optional().messages({
          "array.base": "delete document list should be an array of strings.",
        }),
      });
  
      const result = schema.validate(req.body);
      if (result.error) {
        throw new Error(result.error.details[0].message);
      }
      next();
    } catch (err) {
      customLog(
        req?.LogTraceId,
        "error",
        {
            error: err,
        },
    
    );
  }
  }