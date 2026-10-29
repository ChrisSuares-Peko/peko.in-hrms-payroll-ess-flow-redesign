/// ------------------- PayrollDocs --------------------- ///

const Joi = require('joi')
const fileSizeValidation = (maxFileSize) => {
    return (value, helpers) => {
      // Convert KB to Bytes
      const maxFileSizeInBytes = maxFileSize * 1024;
      // Remove the base64 header if present
      const base64Str = value.split(";base64,").pop();
  
      // Calculate the size of the base64 string
      const buffer = Buffer.from(base64Str, "base64");
      const fileSizeInBytes = buffer.length;
  
      if (fileSizeInBytes > maxFileSizeInBytes) {
        return helpers.message(
          `File size must be smaller than  ${maxFileSize % 1024 === 0
            ? `${maxFileSize / 1024} MB`
            : `${maxFileSize} KB`
          }`
        );
      }
  
      return value;
    };
  };

exports.validatePayrollDocsCreate = (req, res, next) => {
    try {
      const fileUploadMaxSize = 500; //500 kb
      const schema = Joi.object({
        userId: Joi.number().optional().messages({
          "number.base": "User ID must be a number.",
        }),
        userType: Joi.string().optional(),
        id: Joi.string().allow("").optional(),
        categoryId: Joi.string().required().messages({
          "any.required": "Category ID is required.",
        }),
        documentName: Joi.string().required().messages({
          "string.empty": "Document name cannot be empty.",
          "any.required": "Document name is required.",
        }),
        documentBase: Joi.string()
          .custom(fileSizeValidation(fileUploadMaxSize))
          .required()
          .messages({
            "string.empty": "Document base cannot be empty.",
            "any.required": "Document base is required.",
          }),
        documentFormat: Joi.string().required().messages({
          "any.required": "Document format is required.",
        }),
        categoryName: Joi.string().required().messages({
          "string.empty": "Category name cannot be empty.",
          "any.required": "Category name is required.",
        }),
      });
  
      // Validate the request body against the schema
      const result = schema.validate(req.body);
  
      if (result.error) {
        // If validation fails, throw an error with the validation message
        throw new Error(result.error.details[0].message);
      }
  
      next();
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

exports.validatePayrollDocsUpdate = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional(),
            id: Joi.number().optional(),
            categoryId: Joi.number().required()
                .messages({
                    'any.required': 'Category ID is required.'
                }),
            documentName: Joi.string().required()
                .messages({
                    'string.empty': 'Document name cannot be empty.',
                    'any.required': 'Document name is required.'
                }),
            documentBase: Joi.string().required()
                .messages({
                    'string.empty': 'Document base cannot be empty.',
                    'any.required': 'Document base is required.'
                }),
            documentFormat: Joi.string().optional()
                .messages({
                    'any.required': 'Document format is required.'
                }),
            categoryName: Joi.string().required()
                .messages({
                    'string.empty': 'Category name cannot be empty.',
                    'any.required': 'Category name is required.'
                })
        })

        // Validate the request body against the schema
        const result = schema.validate(req.body);

        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validatePayrollDocsUpdateStatus = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional(),
            docId: Joi.number().required()
                .messages({
                    'number.base': 'Doc ID must be a number.',
                    'any.required': 'Doc ID is required.'
                }),
            status: Joi.boolean().required()
                .messages({
                    'boolean.base': 'Status must be a boolean value.',
                    'any.required': 'Status is required.'
                })
        })

        // Validate the request body against the schema
        const result = schema.validate(req.body);

        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};