/* eslint-disable no-unused-vars */
const Joi = require('joi');
const ErrorResponse = require('./error-response');
const { customLog } = require('./loggerHelper');
const { ESIGN_SOURCE_TYPE_VALUES } = require('../constants/eSignSourceTypes');

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


/// ------------------- ZeroCarbon --------------------- ///


exports.validateZeroCarbonBalance = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.'
                }),
            userType: Joi.string().optional(),
            amount: Joi.number().required()
                .messages({
                    'any.required': 'Amount is required.',
                    'number.base': 'Amount must be a number.'
                }),
            credits: Joi.number().required()
                .messages({
                    'any.required': 'Credits is required.',
                    'number.base': 'Credits must be a number.'
                }),
            projectId: Joi.number().required()
                .messages({
                    'any.required': 'Project ID is required.',
                    'number.base': 'Project ID must be a number.'
                })
        })

        const result = schema.validate(req.body);

        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateZeroCarbonPayment = (req, res, next) => {
    try {
        const schema = Joi.object({
            amountInInr: Joi.alternatives().try(
                Joi.number(),
                Joi.string()
            ).required()
                .messages({
                    'any.required': 'Amount in INR is required.',
                    'number.base': 'Amount in INR must be a number.'
                }),
            amount: Joi.alternatives().try(
                Joi.number(),
                Joi.string()
            ).required()
                .messages({
                    'any.required': 'Amount is required.',
                    'string.empty': 'Amount cannot be empty.'
                }),
            co2Offset: Joi.string().required()
                .messages({
                    'any.required': 'CO2 offset is required.',
                    'string.empty': 'CO2 offset cannot be empty.'
                }),
            credits: Joi.string().required()
                .messages({
                    'any.required': 'Credits is required.',
                    'string.empty': 'Credits cannot be empty.'
                }),
            selectedPackage: Joi.object({
                id: Joi.alternatives().try(
                    Joi.number(),
                    Joi.string()
                ).allow(null).required()
                    .messages({
                        'any.required': 'Selected package ID is required.'
                    })
            }).required()
                .messages({
                    'any.required': 'Selected package is required.'
                }),
            selectedProject: Joi.object({
                id: Joi.alternatives().try(
                    Joi.number(),
                    Joi.string()
                ).required()
                    .messages({
                        'any.required': 'Selected project ID is required.'
                    })
            }).required()
                .messages({
                    'any.required': 'Selected project is required.'
                }),
            projectName: Joi.string().required()
                .messages({
                    'any.required': 'Project name is required.',
                    'string.empty': 'Project name cannot be empty.'
                }),
            accessKey: Joi.string().required()
                .messages({
                    'any.required': 'Access key is required.',
                    'string.empty': 'Access key cannot be empty.',
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

exports.validateZeroCarbonQuestion = (req, res, next) => {
    try {
        const schema = Joi.object({
            answersObj: Joi.object().required()
                .messages({
                    'any.required': 'Answers object is required.'
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


/// ------------------- Edocs --------------------- ///


exports.validateEdocsCreate = (req, res, next) => {
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
            description: Joi.string().required().messages({
                "string.empty": "Description cannot be empty.",
                "any.required": "Description is required.",
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

exports.validateEdocsUpdate = (req, res, next) => {
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
            description: Joi.string().required()
                .messages({
                    'string.empty': 'Description cannot be empty.',
                    'any.required': 'Description is required.'
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

exports.validateEdocsUpdateStatus = (req, res, next) => {
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

/// ------------------- PayrollDocs --------------------- ///


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
/// ------------------- PekoWorks --------------------- ///


exports.validateWorksPayment = (req, res, next) => {
  try {
    const schema = Joi.object({
      planId: Joi.alternatives()
        .try(Joi.number(), Joi.string())
        .required()
        .messages({
          "any.required": "Plan ID is required.",
        }),
      amount: Joi.alternatives()
        .try(
          Joi.number().greater(0),
          Joi.string().custom((value, helpers) => {
            const number = parseFloat(value);
            if (isNaN(number) || number <= 0) {
              return helpers.error("any.invalid");
            }
            return value;
          })
        )
        .required()
        .messages({
          "any.required": "Amount is required.",
          "string.empty": "Amount cannot be empty.",
          "any.invalid": "Amount must be a non-negative number.",
        }),
      pocName: Joi.string().required().messages({
        "string.base": "POC name must be a string.",
        "any.required": "POC name is required.",
      }),
      email: Joi.string().email().required().messages({
        "string.base": "Email must be a string.",
        "string.email": "Invalid email format.",
        "any.required": "Email is required.",
      }),
      mobile: Joi.string().allow("").optional(),
      requirement: Joi.string().allow("").optional().messages({
        "string.base": "Requirement must be a string.",
      }),
      workId: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
      accessKey: Joi.string().required().messages({
        "string.base": "Access key must be a string.",
        "any.required": "Access key is required.",
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
    //  customLog(req?.LogTraceId, 'error', { error: err.message });

    next(err);
  }
};


/// ------------------- Workspace --------------------- ///


exports.validateWorkspaceFileUpload = (req, res, next) => {
    try {
        const fileSchema = Joi.object({
            file: Joi.string().required()
                .messages({
                    'string.base': 'File name must be a string.',
                    'any.required': 'File name is required.'
                }),
            base64String: Joi.string().required()
                .messages({
                    'string.base': 'Base64 string must be a string.',
                    'any.required': 'Base64 string is required.'
                }),
            imageFormat: Joi.string().required()
                .messages({
                    'string.base': 'Image format must be a string.',
                    'any.required': 'Image format is required.'
                })
        });

        const schema = Joi.object({
            fileUploadData: Joi.array().items(fileSchema).required()
                .messages({
                    'array.base': 'File upload data must be an array.',
                    'array.empty': 'File upload data cannot be empty.',
                    'any.required': 'File upload data is required.'
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

exports.validateWorkspacePayment = (req, res, next) => {
    try {
        const fileUploadSchema = Joi.object({
            ownerVisUrl: Joi.string().uri().required()
                .messages({
                    'string.base': 'Owner Vis URL must be a string.',
                    'string.empty': 'Owner Vis URL cannot be empty.',
                    'string.uri': 'Owner Vis URL must be a valid URI.',
                    'any.required': 'Owner Vis URL is required.'
                }),
            tradeLicenseUrl: Joi.string().uri().required()
                .messages({
                    'string.base': 'Trade License URL must be a string.',
                    'string.empty': 'Trade License URL cannot be empty.',
                    'string.uri': 'Trade License URL must be a valid URI.',
                    'any.required': 'Trade License URL is required.'
                })
        });

        const userDetailsSchema = Joi.object({
            companyName: Joi.string().required()
                .messages({
                    'string.base': 'Company name must be a string.',
                    'string.empty': 'Company name cannot be empty.',
                    'any.required': 'Company name is required.'
                }),
            expiryDate: Joi.date().iso().required()
                .messages({
                    'date.base': 'Expiry date must be a valid date format.',
                    'date.format': 'Expiry date must be in ISO format (YYYY-MM-DD).',
                    'any.required': 'Expiry date is required.'
                }),
            licenseType: Joi.string().valid('existing', 'new').required()
                .messages({
                    'string.base': 'License type must be a string.',
                    'string.empty': 'License type cannot be empty.',
                    'any.only': 'License type must be "existing" or "new".',
                    'any.required': 'License type is required.'
                }),
            fileUploadData: fileUploadSchema.required()
                .messages({
                    'object.base': 'File upload data must be an object.',
                    'object.empty': 'File upload data cannot be empty.',
                    'any.required': 'File upload data is required.'
                })
        });

        const schema = Joi.object({
            amount: Joi.alternatives().try(
                Joi.number().min(0),
                Joi.string().pattern(/^\d+(\.\d+)?$/)
            ).required()
                .messages({
                    'string.empty': 'Amount cannot be empty.',
                    'string.pattern.base': 'Amount must be a positive number.',
                    'number.min': 'Amount cannot be negative.',
                    'any.required': 'Amount is required.'
                }),
            planId: Joi.alternatives().try(
                Joi.number(),
                Joi.string()
            ).required()
                .messages({
                    'any.required': 'Plan ID is required.'
                }),
            workspaceId: Joi.alternatives().try(
                Joi.number(),
                Joi.string()
            ).allow(null).required()
                .messages({
                    'any.required': 'Workspace ID is required.'
                }),
            userDetails: userDetailsSchema.required()
                .messages({
                    'object.base': 'User details must be an object.',
                    'object.empty': 'User details cannot be empty.',
                    'any.required': 'User details are required.'
                }),
            accessKey: Joi.string().required()
                .messages({
                    'string.base': 'Access key must be a string.',
                    'string.empty': 'Access key cannot be empty.',
                    'any.required': 'Access key is required.'
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


/// ------------------- PekoConnect --------------------- ///


exports.validatePekoConnectCreate = (req, res, next) => {
    try {
        const schema = Joi.object({
            serviceProvider: Joi.string().required()
                .messages({
                    'string.base': 'Service provider must be a string.',
                    'string.empty': 'Service provider cannot be empty.',
                    'any.required': 'Service provider is required.'
                }),
            tagline: Joi.string().required()
                .messages({
                    'string.base': 'Tagline must be a string.',
                    'string.empty': 'Tagline cannot be empty.',
                    'any.required': 'Tagline is required.'
                }),
            mobileNo: Joi.string().allow('').required()
                .messages({
                    'string.base': 'Mobile number must be a string.',
                    'any.only': 'Mobile number must be empty or not provided.',
                    'any.required': 'Mobile number is required.'
                }),
            email: Joi.string().email().allow('').required()
                .messages({
                    'string.base': 'Email must be a string.',
                    'string.empty': 'Email cannot be empty.',
                    'string.email': 'Email must be a valid email address.',
                    'any.required': 'Email is required.'
                }),
            website: Joi.string().allow('').required()
                .messages({
                    'string.base': 'Website must be a string.',
                    'string.empty': 'Website cannot be empty.',
                    'string.uri': 'Website must be a valid URI.',
                    'any.required': 'Website is required.'
                }),
            address: Joi.string().required()
                .messages({
                    'string.base': 'Address must be a string.',
                    'string.empty': 'Address cannot be empty.',
                    'any.required': 'Address is required.'
                }),
            category: Joi.string().required()
                .messages({
                    'string.base': 'Category must be a string.',
                    'string.empty': 'Category cannot be empty.',
                    'any.required': 'Category is required.'
                }),
            logo: Joi.string().optional()
                .messages({
                    'string.base': 'Logo must be a string.',
                }),
            format: Joi.string().optional()
                .messages({
                    'string.base': 'Format must be a string.',
                }),
            description: Joi.string().required()
                .messages({
                    'string.base': 'Description must be a string.',
                    'string.empty': 'Description cannot be empty.',
                    'any.required': 'Description is required.'
                }),
            offerings: Joi.string().required()
                .messages({
                    'string.base': 'Offerings must be a string.',
                    'string.empty': 'Offerings cannot be empty.',
                    'any.required': 'Offerings are required.'
                }),
            rewards: Joi.string().required()
                .messages({
                    'string.base': 'Rewards must be a string.',
                    'string.empty': 'Rewards cannot be empty.',
                    'any.required': 'Rewards are required.'
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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

exports.validatePekoConnectUpdate = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
                    'string.empty': 'User type cannot be empty.',
                }),
            id: Joi.number().optional()
                .messages({
                    'number.base': 'ID must be a number.',
                }),
            serviceProvider: Joi.string().required()
                .messages({
                    'string.base': 'Service provider must be a string.',
                    'string.empty': 'Service provider cannot be empty.',
                    'any.required': 'Service provider is required.'
                }),
            tagline: Joi.string().required()
                .messages({
                    'string.base': 'Tagline must be a string.',
                    'string.empty': 'Tagline cannot be empty.',
                    'any.required': 'Tagline is required.'
                }),
            mobileNo: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Mobile number must be a string.',
                }),
            email: Joi.string().email().allow('').required()
                .messages({
                    'string.base': 'Email must be a string.',
                    'string.empty': 'Email cannot be empty.',
                    'string.email': 'Email must be a valid email address.',
                    'any.required': 'Email is required.'
                }),
            website: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Website must be a string.',
                    'string.uri': 'Website must be a valid URI.',
                }),
            address: Joi.string().required()
                .messages({
                    'string.base': 'Address must be a string.',
                    'string.empty': 'Address cannot be empty.',
                    'any.required': 'Address is required.'
                }),
            category: Joi.string().required()
                .messages({
                    'string.base': 'Category must be a string.',
                    'string.empty': 'Category cannot be empty.',
                    'any.required': 'Category is required.'
                }),
            description: Joi.string().required()
                .messages({
                    'string.base': 'Description must be a string.',
                    'string.empty': 'Description cannot be empty.',
                    'any.required': 'Description is required.'
                }),
            offerings: Joi.string().required()
                .messages({
                    'string.base': 'Offerings must be a string.',
                    'string.empty': 'Offerings cannot be empty.',
                    'any.required': 'Offerings are required.'
                }),
            rewards: Joi.string().required()
                .messages({
                    'string.base': 'Rewards must be a string.',
                    'string.empty': 'Rewards cannot be empty.',
                    'any.required': 'Rewards are required.'
                }),
            logo: Joi.string().optional()
                .messages({
                    'string.base': 'Logo must be a string.',
                }),
            format: Joi.string().optional()
                .messages({
                    'string.base': 'Format must be a string.',
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

exports.validatePekoConnectUpdateStatus = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional(),
            connectId: Joi.number().required()
                .messages({
                    'number.base': 'Connect ID must be a number.',
                    'any.required': 'Connect ID is required.'
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

exports.validateConnectRequest = (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required().messages({
                "string.empty": "Name cannot be empty.",
                "any.required": "Name is required.",
            }),
            mobile: Joi.string().required().messages({
                "any.required": "Mobile number is required.",
            }),
            email: Joi.string().email().required().messages({
                "string.email": "Invalid email format.",
                "any.required": "Email is required.",
            }),
            preferredMode: Joi.string().required().messages({
                "any.required": "Preferred mode is required.",
            }),
            requirement: Joi.string().allow("").optional(),
            connectId: Joi.number().required().messages({
                "number.base": "Connect ID must be a number.",
                "any.required": "Connect ID is required.",
            }),
            credentialId: Joi.number().required().messages({
                "number.base": "Credential ID must be a number.",
                "any.required": "Credential ID is required.",
            }),
            userType: Joi.string().optional(),
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


/// ------------------- Workspace Plan --------------------- ///


exports.validatePlanCreate = (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required()
                .messages({
                    'string.base': 'Name must be a string.',
                    'string.empty': 'Name cannot be empty.',
                    'any.required': 'Name is required.'
                }),
            price: Joi.string().required()
                .messages({
                    'string.base': 'Price must be a string.',
                    'string.empty': 'Price cannot be empty.',
                    'any.required': 'Price is required.'
                }),
            description: Joi.string().required()
                .messages({
                    'string.base': 'Description must be a string.',
                    'string.empty': 'Description cannot be empty.',
                    'any.required': 'Description is required.'
                }),
            highlights: Joi.string().required()
                .messages({
                    'string.base': 'Highlights must be a string.',
                    'string.empty': 'Highlights cannot be empty.',
                    'any.required': 'Highlights are required.'
                }),
            billingCycle: Joi.string().required()
                .messages({
                    'string.base': 'Billing cycle must be a string.',
                    'string.empty': 'Billing cycle cannot be empty.',
                    'any.required': 'Billing cycle is required.'
                }),
            is_available: Joi.boolean().required()
                .messages({
                    'boolean.base': 'Availability must be a boolean value.',
                    'any.required': 'Availability is required.'
                }),
            logo: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Logo must be a string.',
                    'string.empty': 'Logo cannot be empty.',
                }),
            logoFormat: Joi.string().optional()
                .messages({
                    'string.base': 'Logo format must be a string.',
                    'string.empty': 'Logo format cannot be empty.',
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                    'any.required': 'User ID is required.'
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
                    'string.empty': 'User type cannot be empty.',
                    'any.required': 'User type is required.'
                }),
            commissionMode: Joi.string().valid('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP').optional(),
            commissionType: Joi.string().valid('PERCENTAGE', 'FLAT').optional(),
            commission: Joi.number().min(0).optional(),
            fixedCommissionPerTransaction: Joi.number().min(0).optional(),
            isCommissionInclGST: Joi.boolean().optional()
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

exports.validatePlanUpdate = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional(),
            id: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            name: Joi.string().required()
                .messages({
                    'string.base': 'Name must be a string.',
                    'string.empty': 'Name cannot be empty.',
                    'any.required': 'Name is required.'
                }),
            price: Joi.string().required()
                .messages({
                    'string.base': 'Price must be a string.',
                    'string.empty': 'Price cannot be empty.',
                    'any.required': 'Price is required.'
                }),
            description: Joi.string().required()
                .messages({
                    'string.base': 'Description must be a string.',
                    'string.empty': 'Description cannot be empty.',
                    'any.required': 'Description is required.'
                }),
            highlights: Joi.string().required()
                .messages({
                    'string.base': 'Highlights must be a string.',
                    'string.empty': 'Highlights cannot be empty.',
                    'any.required': 'Highlights are required.'
                }),
            billingCycle: Joi.string().required()
                .messages({
                    'string.base': 'Billing cycle must be a string.',
                    'string.empty': 'Billing cycle cannot be empty.',
                    'any.required': 'Billing cycle is required.'
                }),
            is_available: Joi.number().required()
                .messages({
                    'boolean.base': 'Availability must be a number value.',
                    'any.required': 'Availability is required.'
                }),
            logo: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Logo must be a string.',
                    'any.only': 'Logo must be empty or a string.'
                }),
            logoFormat: Joi.string().optional()
                .messages({
                    'string.base': 'Logo format must be a string.',
                    'string.empty': 'Logo format cannot be empty.',
                }),
            commissionMode: Joi.string().valid('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP').optional(),
            commissionType: Joi.string().valid('PERCENTAGE', 'FLAT').optional(),
            commission: Joi.number().min(0).optional(),
            fixedCommissionPerTransaction: Joi.number().min(0).optional(),
            isCommissionInclGST: Joi.boolean().optional()
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

exports.validatePlanUpdateStatus = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional(),
            planId: Joi.number().required()
                .messages({
                    'number.base': 'Plan ID must be a number.',
                    'any.required': 'Plan ID is required.'
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


/// ------------------- PekoWorks Plan --------------------- ///


exports.validateWorkPlanCreate = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
                }),
            name: Joi.string().required()
                .messages({
                    'string.base': 'Name must be a string.',
                    'string.empty': 'Name cannot be empty.',
                    'any.required': 'Name is required.'
                }),
            description: Joi.string().required()
                .messages({
                    'string.base': 'Description must be a string.',
                    'string.empty': 'Description cannot be empty.',
                    'any.required': 'Description is required.'
                }),
            price: Joi.alternatives().try(
                Joi.number(),
                Joi.string()
            ).required()
                .messages({
                    'string.empty': 'Price cannot be empty.',
                    'any.required': 'Price is required.'
                }),
            billingCycle: Joi.string().required()
                .messages({
                    'string.base': 'Billing cycle must be a string.',
                    'string.empty': 'Billing cycle cannot be empty.',
                    'any.required': 'Billing cycle is required.'
                }),
            features: Joi.string().required()
                .messages({
                    'string.base': 'Features must be a string.',
                    'string.empty': 'Features cannot be empty.',
                    'any.required': 'Features are required.'
                }),
            status: Joi.boolean().optional()
                .messages({
                    'boolean.base': 'Status must be a boolean value.',
                }),
            popular: Joi.boolean().required()
                .messages({
                    'boolean.base': 'Popular must be a boolean value.',
                    'any.required': 'Popular is required.'
                }),
            workId: Joi.alternatives().try(
                Joi.number(),
                Joi.string()
            ).required()
                .messages({
                    'string.empty': 'Work ID cannot be empty.',
                    'any.required': 'Work ID is required.'
                }),
            commissionMode: Joi.string().valid('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP').optional(),
            commissionType: Joi.string().valid('PERCENTAGE', 'FLAT').optional(),
            commission: Joi.number().min(0).optional(),
            fixedCommissionPerTransaction: Joi.number().min(0).optional(),
            isCommissionInclGST: Joi.boolean().optional()
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

exports.validateWorkPlanUpdate = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
                }),
            id: Joi.number().optional()
                .messages({
                    'number.base': 'ID must be a number.',
                }),
            name: Joi.string().required()
                .messages({
                    'string.base': 'Name must be a string.',
                    'string.empty': 'Name cannot be empty.',
                    'any.required': 'Name is required.'
                }),
            description: Joi.string().required()
                .messages({
                    'string.base': 'Description must be a string.',
                    'string.empty': 'Description cannot be empty.',
                    'any.required': 'Description is required.'
                }),
            price: Joi.alternatives().try(
                Joi.number(),
                Joi.string()
            ).required()
                .messages({
                    'string.empty': 'Price cannot be empty.',
                    'any.required': 'Price is required.'
                }),
            billingCycle: Joi.string().required()
                .messages({
                    'string.base': 'Billing cycle must be a string.',
                    'string.empty': 'Billing cycle cannot be empty.',
                    'any.required': 'Billing cycle is required.'
                }),
            features: Joi.string().required()
                .messages({
                    'string.base': 'Features must be a string.',
                    'string.empty': 'Features cannot be empty.',
                    'any.required': 'Features are required.'
                }),
            status: Joi.alternatives().try(
                Joi.number(),
                Joi.boolean()
            ).optional()
                .messages({
                    'boolean.base': 'Status must be a boolean value.',
                }),
            popular: Joi.alternatives().try(
                Joi.number(),
                Joi.boolean()
            ).required()
                .messages({
                    'any.required': 'Popular is required.'
                }),
            workId: Joi.alternatives().try(
                Joi.number(),
                Joi.string()
            ).required()
                .messages({
                    'string.empty': 'Work ID cannot be empty.',
                    'any.required': 'Work ID is required.'
                }),
            commissionMode: Joi.string().valid('MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP').optional(),
            commissionType: Joi.string().valid('PERCENTAGE', 'FLAT').optional(),
            commission: Joi.number().min(0).optional(),
            fixedCommissionPerTransaction: Joi.number().min(0).optional(),
            isCommissionInclGST: Joi.boolean().optional()
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

exports.validateWorkPlanUpdateStatus = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional(),
            planId: Joi.number().required()
                .messages({
                    'number.base': 'Plan ID must be a number.',
                    'any.required': 'Plan ID is required.'
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


/// ------------------- PekoWorks --------------------- ///


exports.validateWorkCreate = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
                }),
            name: Joi.string().required()
                .messages({
                    'string.base': 'Name must be a string.',
                    'string.empty': 'Name cannot be empty.',
                    'any.required': 'Name is required.'
                }),
            features: Joi.string().required()
                .messages({
                    'string.base': 'Features must be a string.',
                    'string.empty': 'Features cannot be empty.',
                    'any.required': 'Features are required.'
                }),
            description: Joi.string().required()
                .messages({
                    'string.base': 'Description must be a string.',
                    'string.empty': 'Description cannot be empty.',
                    'any.required': 'Description is required.'
                }),
            contactName: Joi.string().required()
                .messages({
                    'string.base': 'Contact name must be a string.',
                    'string.empty': 'Contact name cannot be empty.',
                    'any.required': 'Contact name is required.'
                }),
            contactEmail: Joi.string().email().required()
                .messages({
                    'string.base': 'Contact email must be a string.',
                    'string.empty': 'Contact email cannot be empty.',
                    'string.email': 'Invalid email format.',
                    'any.required': 'Contact email is required.'
                }),
            contactMobile: Joi.string().required()
                .messages({
                    'string.base': 'Contact mobile must be a string.',
                    'string.empty': 'Contact mobile cannot be empty.',
                    'any.required': 'Contact mobile is required.'
                }),
            status: Joi.boolean().required()
                .messages({
                    'boolean.base': 'Status must be a boolean value.',
                    'any.required': 'Status is required.'
                }),
            vendorId: Joi.string().required()
                .messages({
                    'string.base': 'Vendor ID must be a string.',
                    'string.empty': 'Vendor ID cannot be empty.',
                    'any.required': 'Vendor ID is required.'
                }),
            imageBase: Joi.string().required()
                .messages({
                    'string.base': 'Image base must be a string.',
                    'string.empty': 'Image base cannot be empty.',
                    'any.required': 'Image base is required.'
                }),
            credentialId: Joi.alternatives()
                .try(Joi.string(), Joi.number())
                .optional()
                .messages({
                    "alternatives.types": "RegisteredBy must be either a string or a number.",
                }),
            imageFormat: Joi.string().required()
                .messages({
                    'string.base': 'Image format must be a string.',
                    'string.empty': 'Image format cannot be empty.',
                    'any.required': 'Image format is required.'
                }),
            portfolio: Joi.array().items(
                Joi.object()
            )
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

exports.validateWorkUpdate = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
                }),
            id: Joi.number().optional()
                .messages({
                    'number.base': 'ID must be a number.',
                }),
            workId: Joi.number().optional()
                .messages({
                    'number.base': 'ID must be a number.',
                }),
            name: Joi.string().required()
                .messages({
                    'string.base': 'Name must be a string.',
                    'string.empty': 'Name cannot be empty.',
                    'any.required': 'Name is required.'
                }),
            features: Joi.string().required()
                .messages({
                    'string.base': 'Features must be a string.',
                    'string.empty': 'Features cannot be empty.',
                    'any.required': 'Features are required.'
                }),
            description: Joi.string().required()
                .messages({
                    'string.base': 'Description must be a string.',
                    'string.empty': 'Description cannot be empty.',
                    'any.required': 'Description is required.'
                }),
            contactName: Joi.string().required()
                .messages({
                    'string.base': 'Contact name must be a string.',
                    'string.empty': 'Contact name cannot be empty.',
                    'any.required': 'Contact name is required.'
                }),
            contactEmail: Joi.string().email().required()
                .messages({
                    'string.base': 'Contact email must be a string.',
                    'string.empty': 'Contact email cannot be empty.',
                    'string.email': 'Invalid email format.',
                    'any.required': 'Contact email is required.'
                }),
            credentialId: Joi.alternatives()
                .try(Joi.string(), Joi.number())
                .optional()
                .messages({
                    "alternatives.types": "RegisteredBy must be either a string or a number.",
                }),
            contactMobile: Joi.string().required()
                .messages({
                    'string.base': 'Contact mobile must be a string.',
                    'string.empty': 'Contact mobile cannot be empty.',
                    'any.required': 'Contact mobile is required.'
                }),
            status: Joi.alternatives().try(
                Joi.number(),
                Joi.boolean()
            ).optional(),
            vendorId: Joi.string().required()
                .messages({
                    'string.base': 'Vendor ID must be a string.',
                    'string.empty': 'Vendor ID cannot be empty.',
                    'any.required': 'Vendor ID is required.'
                }),
            imageBase: Joi.string().required()
                .messages({
                    'string.base': 'Image base must be a string.',
                    'string.empty': 'Image base cannot be empty.',
                    'any.required': 'Image base is required.'
                }),
            imageFormat: Joi.string().allow(null).required()
                .messages({
                    'string.base': 'Image format must be a string.',
                    'string.empty': 'Image format cannot be empty.',
                    'any.required': 'Image format is required.'
                }),
            portfolio: Joi.array().items(
                Joi.object()
            )
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

exports.validateWorkUpdateStatus = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional(),
            workId: Joi.number().required()
                .messages({
                    'number.base': 'Work ID must be a number.',
                    'any.required': 'Work ID is required.'
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

exports.validateWorkReportUpdateStatus = (req, res, next) => {
    try {
        const schema = Joi.object({
            workspaceOrderStatus: Joi.string().required()
                .messages({
                    'boolean.base': 'Status must be a string value.',
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


/// ------------------- WorkSpace --------------------- ///


exports.validateWorkSpaceCreate = (req, res, next) => {
    try {
        const schema = Joi.object({
            // id: Joi.string().allow('').optional()
            //     .messages({
            //         'string.base': 'ID must be a string.',
            //         'any.only': 'Invalid ID.',
            //         'string.empty': 'ID cannot be empty.'
            //     }),
            name: Joi.string().required()
                .messages({
                    'string.base': 'Name must be a string.',
                    'string.empty': 'Name cannot be empty.',
                    'any.required': 'Name is required.'
                }),
            address: Joi.string().required()
                .messages({
                    'string.base': 'Address must be a string.',
                    'string.empty': 'Address cannot be empty.',
                    'any.required': 'Address is required.'
                }),
            monthlyPrice: Joi.string().required()
                .messages({
                    'string.base': 'Monthly price must be a string.',
                    'string.empty': 'Monthly price cannot be empty.',
                    'any.required': 'Monthly price is required.'
                }),
            yearlyPrice: Joi.string().required()
                .messages({
                    'string.base': 'Yearly price must be a string.',
                    'string.empty': 'Yearly price cannot be empty.',
                    'any.required': 'Yearly price is required.'
                }),
            latLng: Joi.string().required()
                .messages({
                    'string.base': 'LatLng must be a string.',
                    'string.empty': 'LatLng cannot be empty.',
                    'any.required': 'LatLng is required.'
                }),
            planId: Joi.number().required()
                .messages({
                    'number.base': 'Plan ID must be a number.',
                    'any.required': 'Plan ID is required.'
                }),
            logo: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Logo must be a string.',
                    'string.empty': 'Logo cannot be empty.'
                }),
            logoFormat: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Logo must be a string.',
                    'string.empty': 'Logo cannot be empty.'
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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

exports.validateWorkSpaceUpdate = (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.number().optional()
                .messages({
                    'string.empty': 'ID cannot be empty.'
                }),
            name: Joi.string().required()
                .messages({
                    'string.base': 'Name must be a string.',
                    'string.empty': 'Name cannot be empty.',
                    'any.required': 'Name is required.'
                }),
            address: Joi.string().required()
                .messages({
                    'string.base': 'Address must be a string.',
                    'string.empty': 'Address cannot be empty.',
                    'any.required': 'Address is required.'
                }),
            monthlyPrice: Joi.string().required()
                .messages({
                    'string.base': 'Monthly price must be a string.',
                    'string.empty': 'Monthly price cannot be empty.',
                    'any.required': 'Monthly price is required.'
                }),
            yearlyPrice: Joi.string().required()
                .messages({
                    'string.base': 'Yearly price must be a string.',
                    'string.empty': 'Yearly price cannot be empty.',
                    'any.required': 'Yearly price is required.'
                }),
            latLng: Joi.string().required()
                .messages({
                    'string.base': 'LatLng must be a string.',
                    'string.empty': 'LatLng cannot be empty.',
                    'any.required': 'LatLng is required.'
                }),
            planId: Joi.number().required()
                .messages({
                    'number.base': 'Plan ID must be a number.',
                    'any.required': 'Plan ID is required.'
                }),
            logo: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Logo must be a string.',
                    'string.empty': 'Logo cannot be empty.'
                }),
            logoFormat: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Logo must be a string.',
                    'string.empty': 'Logo cannot be empty.'
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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

exports.validateWorkSpaceUpdateStatus = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional(),
            workspaceId: Joi.number().optional()
                .messages({
                    'number.base': 'Work ID must be a number.',
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


/// ------------------- Invoice --------------------- ///


exports.validateInvoiceGuidelineBulkCreate = (req, res, next) => {
    try {
        let schema = Joi.object({
            data: Joi.array().items(Joi.object({
                id: Joi.number().integer().optional().allow(null).messages({
                    "number.base": "id  must be a number.",
                    "number.integer": "id  must be an integer."
                }),
                days: Joi.string().required().messages({
                    "any.required": "days is required.",
                }),
                actionDate: Joi.date().iso().required().messages({
                    "any.required": "Action date is required.",
                    "string.iso": "Action date must be a valid ISO date string."
                }),
                email: Joi.boolean().optional().messages({
                    "any.required": "Email flag is required.",
                    "boolean.base": "Email flag must be a boolean."
                }),
                sms: Joi.boolean().optional().messages({
                    "any.required": "SMS flag is required.",
                    "boolean.base": "SMS flag must be a boolean."
                }),
                notification: Joi.boolean().optional().messages({
                    "any.required": "Notification flag is required.",
                    "boolean.base": "Notification flag must be a boolean."
                }),
                templet: Joi.object({
                    email: Joi.object({
                        emailId: Joi.string().email().required().messages({
                            "any.required": "Email ID is required.",
                            "string.email": "Email ID must be a valid email address."
                        }),
                        subject: Joi.string().required().messages({
                            "any.required": "Email subject is required.",
                            "string.empty": "Email subject cannot be empty."
                        }),
                        body: Joi.string().required().messages({
                            "any.required": "Email body is required.",
                            "string.empty": "Email body cannot be empty."
                        }),
                        index: Joi.number().integer().required().messages({
                            "any.required": "Email index is required.",
                            "number.base": "Email index must be a number.",
                            "number.integer": "Email index must be an integer."
                        })
                    }).optional(),
                    sms: Joi.object({
                        mobileNo: Joi.number().required().messages({
                            "any.required": "Mobile number is required.",
                            "number.base": "Mobile number must be a number."
                        }),
                        body: Joi.string().required().messages({
                            "any.required": "SMS body is required.",
                            "string.empty": "SMS body cannot be empty."
                        }),
                        index: Joi.number().integer().required().messages({
                            "any.required": "SMS index is required.",
                            "number.base": "SMS index must be a number.",
                            "number.integer": "SMS index must be an integer."
                        })
                    }).optional(),
                    notification: Joi.object({
                        username: Joi.string().email().required().messages({
                            "any.required": "Email ID is required.",
                            "string.email": "Email ID must be a valid email address."
                        }),
                        subject: Joi.string().required().messages({
                            "any.required": "Email subject is required.",
                            "string.empty": "Email subject cannot be empty."
                        }),
                        body: Joi.string().required().messages({
                            "any.required": "Email body is required.",
                            "string.empty": "Email body cannot be empty."
                        }),
                        index: Joi.number().integer().required().messages({
                            "any.required": "Email index is required.",
                            "number.base": "Email index must be a number.",
                            "number.integer": "Email index must be an integer."
                        })
                    }).optional()
                }).required(),
                invoiceId: Joi.number().integer().required().messages({
                    "any.required": "Invoice ID is required.",
                    "number.base": "Invoice ID must be a number.",
                    "number.integer": "Invoice ID must be an integer."
                })
            })).required(),

        });

        if (req.method === "POST") {
            schema = schema.keys({
                invoiceId: Joi.number().integer().required().messages({
                    "any.required": "Invoice ID is required.",
                    "number.base": "Invoice ID must be a number.",
                    "number.integer": "Invoice ID must be an integer."
                })
            });
        }
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

exports.validateInvoiceGuidelineBulkUpdate = (req, res, next) => {
    try {
        let schema = Joi.object({
            data: Joi.array()
                .items(
                    Joi.object({
                        id: Joi.number().integer().optional().allow(null).messages({
                            "number.base": "id  must be a number.",
                            "number.integer": "id  must be an integer.",
                        }),
                        days: Joi.string().required().messages({
                            "any.required": "days is required.",
                        }),
                        status: Joi.string().optional().messages({
                            "string.base": "Status must be a string.",
                        }),
                        actionDate: Joi.date().iso().optional().messages({
                            "string.iso": "Action date must be a valid ISO date string.",
                        }),
                        email: Joi.boolean().optional().messages({
                            "any.required": "Email flag is required.",
                            "boolean.base": "Email flag must be a boolean.",
                        }),
                        sms: Joi.boolean().optional().messages({
                            "any.required": "SMS flag is required.",
                            "boolean.base": "SMS flag must be a boolean.",
                        }),
                        notification: Joi.boolean().optional().messages({
                            "any.required": "Notification flag is required.",
                            "boolean.base": "Notification flag must be a boolean.",
                        }),
                        templet: Joi.object({
                            email: Joi.object({
                                emailId: Joi.string().email().optional().messages({
                                    "any.required": "Email ID is required.",
                                    "string.email": "Email ID must be a valid email address.",
                                }),
                                subject: Joi.string().required().messages({
                                    "any.required": "Email subject is required.",
                                    "string.empty": "Email subject cannot be empty.",
                                }),
                                body: Joi.string().required().messages({
                                    "any.required": "Email body is required.",
                                    "string.empty": "Email body cannot be empty.",
                                }),
                                index: Joi.number().integer().required().messages({
                                    "any.required": "Email index is required.",
                                    "number.base": "Email index must be a number.",
                                    "number.integer": "Email index must be an integer.",
                                }),
                            }).optional().allow(null),
                            sms: Joi.object({
                                mobileNo: Joi.number().optional().messages({
                                    "any.required": "Mobile number is required.",
                                    "number.base": "Mobile number must be a number.",
                                }),
                                body: Joi.string().required().messages({
                                    "any.required": "SMS body is required.",
                                    "string.empty": "SMS body cannot be empty.",
                                }),
                                index: Joi.number().integer().required().messages({
                                    "any.required": "SMS index is required.",
                                    "number.base": "SMS index must be a number.",
                                    "number.integer": "SMS index must be an integer.",
                                }),
                            }).optional().allow(null),
                            notification: Joi.object({
                                username: Joi.string().email().required().messages({
                                    "any.required": "Email ID is required.",
                                    "string.email": "Email ID must be a valid email address.",
                                }),
                                subject: Joi.string().required().messages({
                                    "any.required": "Email subject is required.",
                                    "string.empty": "Email subject cannot be empty.",
                                }),
                                body: Joi.string().required().messages({
                                    "any.required": "Email body is required.",
                                    "string.empty": "Email body cannot be empty.",
                                }),
                                index: Joi.number().integer().required().messages({
                                    "any.required": "Email index is required.",
                                    "number.base": "Email index must be a number.",
                                    "number.integer": "Email index must be an integer.",
                                }),
                            }).optional(),
                        }).required(),
                        invoiceId: Joi.number().integer().required().messages({
                            "any.required": "Invoice ID is required.",
                            "number.base": "Invoice ID must be a number.",
                            "number.integer": "Invoice ID must be an integer.",
                        }),
                    })
                )
                .required(),
            invoiceId: Joi.number().integer().required().messages({
                "number.base": "Invoice Id  must be a number.",
                "any.required": "Invoice Id  is required.",
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


/// ------------------- eSign --------------------- ///


exports.validateDocketCreation = (req, res, next) => {
    try {
        const schema = Joi.object({
            docket_title: Joi.string().required().messages({
                'any.required': 'Docket title is required.',
                'string.empty': 'Docket title cannot be empty.'
            }),
            // expiry_date: Joi.date().required().messages({
            //     'any.required': 'Expiry date is required.',
            //     'date.base': 'Expiry date must be a valid date.'
            // }),
            expiry_date: Joi.date().optional().messages({
                'date.base': 'Expiry date must be a valid date.'
            }),
            reminder: Joi.boolean().required().messages({
                'any.required': 'Reminder is required.',
                'boolean.base': 'Reminder must be a boolean.'
            }),
            termsofUse: Joi.boolean().required().messages({
                'any.required': 'Terms of use is required.',
                'boolean.base': 'Terms of use is required.'
            }),
            reminder_interval: Joi.optional(),
            documentBase64: Joi.string().required().messages({
                'any.required': 'Document Base64 is required.',
                'string.empty': 'Document Base64 cannot be empty.'
            }),
            sequentialSignature: Joi.boolean().required().messages({
                'any.required': 'Signature sequence is required.',
                'boolean.base': 'Signature sequence must be either "true" (sequential) or "false" (parallel).'
            }),
            initiator_name: Joi.string().required().messages({
                'any.required': 'Initiator name is required.',
                'string.empty': 'Initiator name cannot be empty.'
            }),
            initiator_email: Joi.string().email().required().messages({
                'any.required': 'Initiator email is required.',
                'string.email': 'Initiator email must be a valid email.',
                'string.empty': 'Initiator email cannot be empty.'
            }),
            eSignType: Joi.string().required().messages({
                'any.required': 'eSign type is required.',
                'string.empty': 'eSign type cannot be empty.'
            }),
            sourceType: Joi.string().valid(...ESIGN_SOURCE_TYPE_VALUES).optional().allow(null).messages({
                'any.only': `sourceType must be one of ${ESIGN_SOURCE_TYPE_VALUES.join(', ')}.`
            }),
            sourceId: Joi.string().optional().allow(null).messages({
                'string.base': 'sourceId must be a string.'
            }),
            signers_info: Joi.array().items(
                Joi.object({
                    signer_name: Joi.string().required().messages({
                        'any.required': 'Signer name is required.',
                        'string.empty': 'Signer name cannot be empty.'
                    }),
                    signer_email: Joi.string().email().required().messages({
                        'any.required': 'Signer email is required.',
                        'string.email': 'Signer email must be a valid email.',
                        'string.empty': 'Signer email cannot be empty.'
                    }),
                    signer_mobile: Joi.optional(),
                    sequence: Joi.number().integer().min(1).required().messages({
                        'any.required': 'Sequence is required.',
                        'number.base': 'Sequence must be a number.',
                        'number.integer': 'Sequence must be an integer.',
                        'number.min': 'Sequence must be at least 1.'
                    }),
                    page_number: Joi.array()
                        .items(Joi.string())
                        .min(1)
                        .required()
                        .messages({
                            "array.min": "Please drop atleast one sign position from each signer.", // page no will get automatically  only if esign position is droped
                            "any.required": "Sign position is required.",
                        }),
                    signer_position: Joi.array().min(1).required().messages({
                        "array.min": "At least one signer position is required.",
                        "any.required": "Signer position is required.",
                    }),
                })
            )
                .min(1)
                .required()
                .messages({
                    "any.required": "Signers info is required.",
                    "array.min": "Signers info must contain at least one signer.",
                }),
        });
        const result = schema.validate(req.body);

        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};
exports.validateResendInvitation = (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required().messages({
                'any.required': 'Signer name is required.',
                'string.empty': 'Signer name cannot be empty.'
            }),
            email: Joi.string().email().required().messages({
                'any.required': 'Signer email is required.',
                'string.email': 'Signer email must be a valid email.',
                'string.empty': 'Signer email cannot be empty.'
            }),
        });

        const result = schema.validate(req.body);

        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateESignPositions = (req, res, next) => {
    try {
        const { signers_info } = req.body
        const store = {}
        const allStore = {}
        const errorMsg = 'Please select different signature positions for recipients.'

        // Check for unique signer emails
        const emails = signers_info.map(signer => signer.signer_email);
        const uniqueEmails = new Set(emails);
        if (emails.length !== uniqueEmails.size) {
            throw new Error('Signer email must be unique.');
        }

        // Validate positions
        for (let i = 0; i < signers_info.length; i++) {
            const { page_number, signer_position } = signers_info[i];
            for (let k = 0; k < page_number.length; k++) {
                const pageNumber = page_number[k];
                for (let j = 0; j < signer_position.length; j++) {
                    const position = signer_position[j];
                    if (pageNumber === 'all') {
                        if (allStore[position]) {
                            throw new Error(errorMsg);
                        }
                        allStore[position] = true
                        for (const [key, value] of Object.entries(store)) {
                            const [pageNumber2, position2] = key.split('_');
                            if (position2 === position) {
                                throw new Error(errorMsg);
                            }
                        }
                    } else {
                        let key = `${pageNumber}_${position}`
                        if (allStore[position]) {
                            throw new Error(errorMsg);
                        }
                        if (store[key]) {
                            throw new Error(errorMsg);
                        }
                        store[key] = true
                    }
                }
            }
        }
        next();
    } catch (err) {
        next(err);
    }
};

exports.validateEmailEsign = (req, res, next) => {
    try {

        const { signers_info } = req.body;
        // Check for unique signer emails
        const emails = signers_info.map((signer) => signer.signer_email);
        const uniqueEmails = new Set(emails);
        if (emails.length !== uniqueEmails.size) {
            throw new Error("Signer email must be unique.");
        }

        next();
    } catch (err) {
        next(err);
    }
};


/// ------------------- Invoice --------------------- ///


exports.validateInvoiceCreate = (req, res, next) => {
    try {
        const logoMaxSize = 1024; // 1024 KB = 1 MB
        const schema = Joi.object({
            // id: Joi.number().integer().min(0).required(),
            invoiceId: Joi.number().integer().min(0).required(),
            // updatedAt: Joi.string().allow('').required(),
            // createdAt: Joi.string().allow('').required(),
            comments: Joi.string().allow("").required(),
            termsConditions: Joi.string().allow("").required(),
            paymentMode: Joi.string().allow("").required(),
            saveCustomer: Joi.boolean().optional(),
            paymentDetails: Joi.object({
                subTotal: Joi.string().required(),
                gst: Joi.string().required(),
                discount: Joi.string().required(),
                shipping: Joi.string().allow("").required(),
                total: Joi.string().required(),
                amountDue: Joi.string().required(),
                amountPaid: Joi.string().allow("").required(),
            }).required(),
            productDetails: Joi.array()
                .items(
                    Joi.object({
                        amount: Joi.string().required(),
                        discount: Joi.string().allow("").required(),
                        item: Joi.string().required(),
                        price: Joi.string().required(),
                        quantity: Joi.string().required(),
                        gst: Joi.string().allow("").required(),
                    })
                )
                .required(),
            invoiceDetails: Joi.object({
                invoiceNo: Joi.string().required(),
                dueDate: Joi.string().isoDate().allow(null).optional(),
                invoiceDate: Joi.string().isoDate().required(),
                // logo: Joi.string().uri().required(),
                logo: Joi.alternatives()
                    .try(
                        Joi.object({
                            imageBase: Joi.string()
                                //   .custom(fileSizeValidation(logoMaxSize))
                                .required(),
                            imageFormat: Joi.string().required(),
                        }),
                        Joi.string().allow("")
                    )
                    .required().messages({
                        'any.required': 'Logo is required.',
                    }),
                invoiceName: Joi.string().required()
                    .messages({
                        "any.required": "Invoice Name is required",
                        "string.base": "Invoice Name must be a string",
                        "string.empty": "Invoice Name cannot be a empty string"
                    }),
            }).required(),
            recipientDetails: Joi.object({
                billerName: Joi.string().required(),
                billerEmail: Joi.string().email().required().messages({
                    "string.email": "Biller email must be a valid email address.",
                }),
                billerCompanyAddress: Joi.string().allow("").required(),
                billerPhone: Joi.string().required(),
                billerGST: Joi.string().allow("").required(),
                billerTRNNumber: Joi.string()
                    .optional()
                    .allow("")
                    .min(10)
                    // .pattern(trnRegex)
                    .messages({
                        'string.min': 'TRN number must be at least 10 digits',
                        'string.pattern.base': 'Please enter a valid TRN number'
                    }),
                customerName: Joi.string().required(),
                customerAddress: Joi.string().allow("").required(),
                customerEmail: Joi.string().email().allow("").required().messages({
                    "string.email": "Customer email must be a valid email address.",
                }),
                customerPhone: Joi.string().allow("").required(),
                customerId: Joi.string().allow("", null).optional(),
                customerUsername: Joi.string().allow("", null).optional(),
                customerTRNNumber: Joi.string()
                    .optional()
                    .allow("")
                    .min(10)
                    //   .pattern(trnRegex)
                    .messages({
                        'string.min': 'TRN number must be at least 10 digits',
                        'string.pattern.base': 'Please enter a valid TRN number'
                    }),
            }).required(),
            userId: Joi.number().integer().optional(),
            userType: Joi.string().optional(),
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

exports.validateInvoiceStatusChange = (req, res, next) => {
    try {
        const schema = Joi.object({

            status: Joi.string()
                .valid('PENDING', 'PAID', 'EXPIRED')
                .required()
                .messages({
                    'any.required': 'Status is required.',
                    'any.only': 'Status must be either "PENDING" or "PAID" or "EXPIRED".'
                }),
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

exports.validateInvoiceGetPaymentLink = (req, res, next) => {
    try {
        const schema = Joi.object({

            invoiceId: Joi.number()
                .required()
                .messages({
                    'any.required': 'InvoiceId is required.',
                }),
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

exports.validateInvoiceDownload = (req, res, next) => {
    try {
        const schema = Joi.object({
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional(),
            invoiceId: Joi.number().required()
                .messages({
                    'number.base': 'Invoice ID must be a number.',
                    'any.required': 'Invoice ID is required.'
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

exports.validateInvoiceSendEmail = (req, res, next) => {
    try {
        const schema = Joi.object({
            invoiceId: Joi.number().required()
                .messages({
                    'number.base': 'Invoice ID must be a number.',
                    'any.required': 'Invoice ID is required.'
                }),
            email: Joi.string().email().required()
                .messages({
                    'string.email': 'Invalid email format.',
                    'any.required': 'Email is required.'
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
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

exports.validateInvoiceCustomerCreate = (req, res, next) => {
    try {
        let schema = Joi.object({
            name: Joi.string()
                .required()
                .messages({
                    'string.base': 'Name must be a string',
                    'string.empty': 'Name cannot be empty',
                    'any.required': 'Name is required'
                }),
            email: Joi.string()
                .email({ tlds: { allow: false } })
                .required()
                .messages({
                    'string.base': 'Email must be a string',
                    'string.empty': 'Email cannot be empty',
                    'string.email': 'Email must be a valid email address',
                    'any.required': 'Email is required'
                }),
            phoneNumber: Joi.string()
                .required()
                .messages({
                    'string.base': 'Phone number must be a string',
                    'string.empty': 'Phone number cannot be empty',
                    'any.required': 'Phone number is required'
                }),
            address: Joi.string()
                .required()
                .messages({
                    'string.base': 'Address must be a string',
                    'string.empty': 'Address cannot be empty',
                    'any.required': 'Address is required'
                }),
            trnNo: Joi.string()
                .optional().allow(null)
                .messages({
                    'string.base': 'TRN number must be a string',
                    'string.empty': 'TRN number cannot be empty',
                }),
            credentialId: Joi.number()
                .integer().allow(null)
                .messages({
                    'number.base': 'Credential ID must be a number',
                    'number.integer': 'Credential ID must be an integer',
                })
        })
        if (req.method === "PUT") {
            schema = schema.keys({
                id: Joi.number().integer().optional().messages({
                    "number.base": " ID must be a number.",
                    "number.integer": "ID must be an integer."
                })
            });
        }
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


/// ------------------- PekoCloud --------------------- ///


exports.validateCreateEmployee = (req, res, next) => {
    try {
        const schema = Joi.object({
            employeeName: Joi.string().required()
                .messages({
                    'string.base': 'Employee name must be a string.',
                    'string.empty': 'Employee name cannot be empty.',
                    'any.required': 'Employee name is required.'
                }),
            employeeID: Joi.string().required()
                .messages({
                    'string.base': 'Employee ID must be a string.',
                    'string.empty': 'Employee ID cannot be empty.',
                    'any.required': 'Employee ID is required.'
                }),
            employeeEmail: Joi.string().required()
                .messages({
                    'string.base': 'Employee email must be a string.',
                    'string.empty': 'Employee email cannot be empty.',
                    'any.required': 'Employee email is required.'
                }),
            department: Joi.string().required()
                .messages({
                    'string.base': 'Yearly price must be a string.',
                    'string.empty': 'Yearly price cannot be empty.',
                    'any.required': 'Yearly price is required.'
                }),
            joiningDate: Joi.string().required()
                .messages({
                    'string.base': 'LatLng must be a string.',
                    'string.empty': 'LatLng cannot be empty.',
                    'any.required': 'LatLng is required.'
                }),
            profileImageBase: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Profile image must be a string.',
                    'string.empty': 'Profile image cannot be empty.'
                }),
            profileImageFormat: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Profile image must be a string.',
                    'string.empty': 'Profile image cannot be empty.'
                }),
            profilePicture: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Profile picture must be a string.',
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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
exports.validateUpdateEmployee = (req, res, next) => {
    try {
        const schema = Joi.object({
            employeeName: Joi.string().required()
                .messages({
                    'string.base': 'Employee name must be a string.',
                    'string.empty': 'Employee name cannot be empty.',
                    'any.required': 'Employee name is required.'
                }),
            employeeID: Joi.string().required()
                .messages({
                    'string.base': 'Employee ID must be a string.',
                    'string.empty': 'Employee ID cannot be empty.',
                    'any.required': 'Employee ID is required.'
                }),
            employeeEmail: Joi.string().required()
                .messages({
                    'string.base': 'Employee email must be a string.',
                    'string.empty': 'Employee email cannot be empty.',
                    'any.required': 'Employee email is required.'
                }),
            department: Joi.string().required()
                .messages({
                    'string.base': 'Yearly price must be a string.',
                    'string.empty': 'Yearly price cannot be empty.',
                    'any.required': 'Yearly price is required.'
                }),
            joiningDate: Joi.string().required()
                .messages({
                    'string.base': 'LatLng must be a string.',
                    'string.empty': 'LatLng cannot be empty.',
                    'any.required': 'LatLng is required.'
                }),
            profileImageBase: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Profile image must be a string.',
                    'string.empty': 'Profile image cannot be empty.'
                }),
            profileImageFormat: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Profile image must be a string.',
                    'string.empty': 'Profile image cannot be empty.'
                }),
            profilePicture: Joi.string().optional().allow('')
                .messages({
                    'string.base': 'Profile picture must be a string.',
                }),
            employeeId: Joi.number().optional()
                .messages({
                    'number.base': 'Employee ID must be a number.',
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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

exports.validateCreateOwner = (req, res, next) => {
    try {
        const schema = Joi.object({
            homeAddress: Joi.string().required().messages({
                'string.base': 'Home address must be a string.',
                'string.empty': 'Home address cannot be empty.',
                'any.required': 'Home address is required.',
            }),
            nationality: Joi.string().required().messages({
                'string.base': 'Nationality must be a string.',
                'string.empty': 'Nationality cannot be empty.',
                'any.required': 'Nationality is required.',
            }),
            ownerName: Joi.string().required().messages({
                'string.base': 'Owner name must be a string.',
                'string.empty': 'Owner name cannot be empty.',
                'any.required': 'Owner name is required.',
            }),
            percentageOfShare: Joi.string().required().messages({
                'string.base': 'Percentage of share must be a string.',
                'string.empty': 'Percentage of share cannot be empty.',
                'any.required': 'Percentage of share is required.',
            }),
            profileImageBase: Joi.string().allow('').optional().messages({
                'string.base': 'Profile image must be a string.',
                'string.empty': 'Profile image cannot be empty.',
            }),
            profileImageFormat: Joi.string().allow('').optional().messages({
                'string.base': 'Profile image must be a string.',
                'string.empty': 'Profile image cannot be empty.',
            }),
            profilePicture: Joi.string().optional().allow(null).messages({
                'string.base': 'Profile picture must be a string.',
            }),
            userId: Joi.number().optional().messages({
                'number.base': 'User ID must be a number.',
            }),
            userType: Joi.string().optional().messages({
                'string.base': 'User type must be a string.',
            }),
        })
        // Validate the request body against the schema
        const result = schema.validate(req.body)
        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}
exports.validateUpdateOwner = (req, res, next) => {
    try {
        const profileUpdateSchema = Joi.object({
            homeAddress: Joi.string().required().messages({
                'string.base': 'Home address must be a string.',
                'string.empty': 'Home address cannot be empty.',
                'any.required': 'Home address is required.',
            }),
            nationality: Joi.string().required().messages({
                'string.base': 'Nationality must be a string.',
                'string.empty': 'Nationality cannot be empty.',
                'any.required': 'Nationality is required.',
            }),
            ownerName: Joi.string().required().messages({
                'string.base': 'Owner name must be a string.',
                'string.empty': 'Owner name cannot be empty.',
                'any.required': 'Owner name is required.',
            }),
            percentageOfShare: Joi.string().required().messages({
                'string.base': 'Percentage of share must be a string.',
                'string.empty': 'Percentage of share cannot be empty.',
                'any.required': 'Percentage of share is required.',
            }),
            profileImageBase: Joi.string().allow('').optional().messages({
                'string.base': 'Profile image must be a string.',
                'string.empty': 'Profile image cannot be empty.',
            }),
            profileImageFormat: Joi.string().allow('').optional().messages({
                'string.base': 'Profile image must be a string.',
                'string.empty': 'Profile image cannot be empty.',
            }),
            profilePicture: Joi.string().optional().allow('').messages({
                'string.base': 'Profile picture must be a string.',
            }),
        })
        const documentsUpdateSchema = Joi.object({
            passport: Joi.object({
                documentBase: Joi.string().allow('').optional().messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.',
                }),
                documentFormat: Joi.string().allow('').optional().messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.',
                }),
                document: Joi.string().optional().allow('').messages({
                    'string.base': 'Document must be a string.',
                }),
                documentNumber: Joi.string().required().messages({
                    'string.base': 'Document number must be a string.',
                    'string.empty': 'Document number cannot be empty.',
                    'any.required': 'Document number is required.',
                }),
                documentType: Joi.string().required().messages({
                    'string.base': 'Document type must be a string.',
                    'string.empty': 'Document type cannot be empty.',
                    'any.required': 'Document type is required.',
                }),
                expireDate: Joi.string().required().messages({
                    'string.base': 'Expire date must be a string.',
                    'string.empty': 'Expire date cannot be empty.',
                    'any.required': 'Expire date is required.',
                }),
                issueDate: Joi.string().required().messages({
                    'string.base': 'Issue date must be a string.',
                    'string.empty': 'Issue date cannot be empty.',
                    'any.required': 'Issue date is required.',
                }),
            }).optional(),
            visa: Joi.object({
                documentBase: Joi.string().allow('').optional().messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.',
                }),
                documentFormat: Joi.string().allow('').optional().messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.',
                }),
                document: Joi.string().optional().allow('').messages({
                    'string.base': 'Document must be a string.',
                }),
                documentNumber: Joi.string().required().messages({
                    'string.base': 'Document number must be a string.',
                    'string.empty': 'Document number cannot be empty.',
                    'any.required': 'Document number is required.',
                }),
                documentType: Joi.string().required().messages({
                    'string.base': 'Document type must be a string.',
                    'string.empty': 'Document type cannot be empty.',
                    'any.required': 'Document type is required.',
                }),
                expireDate: Joi.string().required().messages({
                    'string.base': 'Expire date must be a string.',
                    'string.empty': 'Expire date cannot be empty.',
                    'any.required': 'Expire date is required.',
                }),
                issueDate: Joi.string().required().messages({
                    'string.base': 'Issue date must be a string.',
                    'string.empty': 'Issue date cannot be empty.',
                    'any.required': 'Issue date is required.',
                }),
            }).optional(),
            insurance: Joi.object({
                documentBase: Joi.string().allow('').optional().messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.',
                }),
                documentFormat: Joi.string().allow('').optional().messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.',
                }),
                document: Joi.string().optional().allow('').messages({
                    'string.base': 'Document must be a string.',
                }),
                documentNumber: Joi.string().required().messages({
                    'string.base': 'Document number must be a string.',
                    'string.empty': 'Document number cannot be empty.',
                    'any.required': 'Document number is required.',
                }),
                documentType: Joi.string().required().messages({
                    'string.base': 'Document type must be a string.',
                    'string.empty': 'Document type cannot be empty.',
                    'any.required': 'Document type is required.',
                }),
                expireDate: Joi.string().required().messages({
                    'string.base': 'Expire date must be a string.',
                    'string.empty': 'Expire date cannot be empty.',
                    'any.required': 'Expire date is required.',
                }),
                issueDate: Joi.string().required().messages({
                    'string.base': 'Issue date must be a string.',
                    'string.empty': 'Issue date cannot be empty.',
                    'any.required': 'Issue date is required.',
                }),
            }).optional(),
            emiratesId: Joi.object({
                documentBase: Joi.string().allow('').optional().messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.',
                }),
                documentFormat: Joi.string().allow('').optional().messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.',
                }),
                document: Joi.string().optional().allow('').messages({
                    'string.base': 'Document must be a string.',
                }),
                documentNumber: Joi.string().required().messages({
                    'string.base': 'Document number must be a string.',
                    'string.empty': 'Document number cannot be empty.',
                    'any.required': 'Document number is required.',
                }),
                documentType: Joi.string().required().messages({
                    'string.base': 'Document type must be a string.',
                    'string.empty': 'Document type cannot be empty.',
                    'any.required': 'Document type is required.',
                }),
                expireDate: Joi.string().required().messages({
                    'string.base': 'Expire date must be a string.',
                    'string.empty': 'Expire date cannot be empty.',
                    'any.required': 'Expire date is required.',
                }),
                issueDate: Joi.string().required().messages({
                    'string.base': 'Issue date must be a string.',
                    'string.empty': 'Issue date cannot be empty.',
                    'any.required': 'Issue date is required.',
                }),
            }).optional(),
            ejari: Joi.object({
                documentBase: Joi.string().allow('').optional().messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.',
                }),
                documentFormat: Joi.string().allow('').optional().messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.',
                }),
                document: Joi.string().optional().allow('').messages({
                    'string.base': 'Document must be a string.',
                }),
                documentNumber: Joi.string().required().messages({
                    'string.base': 'Document number must be a string.',
                    'string.empty': 'Document number cannot be empty.',
                    'any.required': 'Document number is required.',
                }),
                documentType: Joi.string().required().messages({
                    'string.base': 'Document type must be a string.',
                    'string.empty': 'Document type cannot be empty.',
                    'any.required': 'Document type is required.',
                }),
                expireDate: Joi.string().required().messages({
                    'string.base': 'Expire date must be a string.',
                    'string.empty': 'Expire date cannot be empty.',
                    'any.required': 'Expire date is required.',
                }),
                issueDate: Joi.string().required().messages({
                    'string.base': 'Issue date must be a string.',
                    'string.empty': 'Issue date cannot be empty.',
                    'any.required': 'Issue date is required.',
                }),
            }).optional(),
            bankDetails: Joi.object({
                documentBase: Joi.string().allow('').optional().messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.',
                }),
                documentFormat: Joi.string().allow('').optional().messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.',
                }),
                document: Joi.string().optional().allow('').messages({
                    'string.base': 'Document must be a string.',
                }),
                documentType: Joi.string().required().messages({
                    'string.base': 'Document type must be a string.',
                    'string.empty': 'Document type cannot be empty.',
                    'any.required': 'Document type is required.',
                }),
                iban: Joi.string().required().messages({
                    'string.base': 'IBAN must be a string.',
                    'string.empty': 'IBAN cannot be empty.',
                    'any.required': 'IBAN is required.',
                }),
                name: Joi.string().required().messages({
                    'string.base': 'Name must be a string.',
                    'string.empty': 'Name cannot be empty.',
                    'any.required': 'Name is required.',
                }),
                swiftcode: Joi.string().required().messages({
                    'string.base': 'Swift code must be a string.',
                    'string.empty': 'Swift code cannot be empty.',
                    'any.required': 'Swift code is required.',
                }),
            }).optional(),
        })
        let schema
        if (req.body.ownerName || req.body.percentageOfShare) {
            schema = profileUpdateSchema
        } else {
            schema = documentsUpdateSchema
        }
        // Validate the request body against the schema
        const result = schema.validate(req.body)
        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}

exports.validateCreateCompanyDoc = (req, res, next) => {
    try {
        const schema = Joi.object({
            documentBase: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            documentFormat: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            document: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Document must be a string.',
                }),
            documentName: Joi.string().required()
                .messages({
                    'string.base': 'Document name must be a string.',
                    'string.empty': 'Document name cannot be empty.',
                    'any.required': 'Document name is required.'
                }),
            documentNumber: Joi.string().required()
                .messages({
                    'string.base': 'Document number must be a string.',
                    'string.empty': 'Document number cannot be empty.',
                    'any.required': 'Document number is required.'
                }),
            documentType: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Document type must be a string.',
                }),
            expireDate: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Document type must be a string.',
                }),
            issueDate: Joi.string().required()
                .messages({
                    'string.base': 'Issue date must be a string.',
                    'string.empty': 'Issue date cannot be empty.',
                    'any.required': 'Issue date is required.'
                }),
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
exports.validateUpdateCompanyDoc = (req, res, next) => {
    try {
        const schema = Joi.object({
            documentBase: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            documentFormat: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            document: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Document must be a string.',
                }),
            documentName: Joi.string().required()
                .messages({
                    'string.base': 'Document name must be a string.',
                    'string.empty': 'Document name cannot be empty.',
                    'any.required': 'Document name is required.'
                }),
            documentNumber: Joi.string().required()
                .messages({
                    'string.base': 'Document number must be a string.',
                    'string.empty': 'Document number cannot be empty.',
                    'any.required': 'Document number is required.'
                }),
            documentType: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Document type must be a string.',
                }),
            expireDate: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Document type must be a string.',
                }),
            issueDate: Joi.string().required()
                .messages({
                    'string.base': 'Issue date must be a string.',
                    'string.empty': 'Issue date cannot be empty.',
                    'any.required': 'Issue date is required.'
                }),
            docId: Joi.number().optional()
                .messages({
                    'number.base': 'Doc ID must be a number.',
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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

exports.validateCreateChequeLeaf = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.string().required()
                .messages({
                    'string.base': 'Amount must be a string.',
                    'string.empty': 'Amount cannot be empty.',
                    'any.required': 'Amount is required.'
                }),
            bankAccount: Joi.string().required()
                .messages({
                    'string.base': 'Bank account name must be a string.',
                    'string.empty': 'Bank account name cannot be empty.',
                    'any.required': 'Bank account name is required.'
                }),
            chequeBookNumber: Joi.string().required()
                .messages({
                    'string.base': 'Cheque book number must be a string.',
                    'string.empty': 'Cheque book number cannot be empty.',
                    'any.required': 'Cheque book number is required.'
                }),
            payeeName: Joi.string().required()
                .messages({
                    'string.base': 'Payee name must be a string.',
                    'string.empty': 'Payee name cannot be empty.',
                    'any.required': 'Payee name is required.'
                }),
            chequeNumber: Joi.string().required()
                .messages({
                    'string.base': 'Cheque number must be a string.',
                    'string.empty': 'Cheque number cannot be empty.',
                    'any.required': 'Cheque number is required.'
                }),
            dateOfCheque: Joi.string().required()
                .messages({
                    'string.base': 'Date of cheque must be a string.',
                    'string.empty': 'Date of cheque cannot be empty.',
                    'any.required': 'Date of cheque is required.'
                }),
            type: Joi.string().required()
                .messages({
                    'string.base': 'Type must be a string.',
                    'string.empty': 'Type cannot be empty.',
                    'any.required': 'Type is required.'
                }),
            signedBy: Joi.string().required()
                .messages({
                    'string.base': 'Signed by must be a string.',
                    'string.empty': 'Signed by cannot be empty.',
                    'any.required': 'Signed by is required.'
                }),
            cloudChequeBookId: Joi.number().optional().allow(null)
                .messages({
                    'number.base': 'Cloud Cheque Book Id must be a string.',
                }),
            dueDate: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Due date must be a string.',
                }),
            status: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Status must be a string.',
                }),
            remarks: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Remarks must be a string.',
                }),
            voucherReferance: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Voucher referance must be a string.',
                }),
            documentBase: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            documentFormat: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            document: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Document must be a string.',
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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
exports.validateUpdateChequeLeaf = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.string().required()
                .messages({
                    'string.base': 'Amount must be a string.',
                    'string.empty': 'Amount cannot be empty.',
                    'any.required': 'Amount is required.'
                }),
            bankAccount: Joi.string().required()
                .messages({
                    'string.base': 'Bank account name must be a string.',
                    'string.empty': 'Bank account name cannot be empty.',
                    'any.required': 'Bank account name is required.'
                }),
            chequeBookNumber: Joi.string().required()
                .messages({
                    'string.base': 'Cheque book number must be a string.',
                    'string.empty': 'Cheque book number cannot be empty.',
                    'any.required': 'Cheque book number is required.'
                }),
            payeeName: Joi.string().required()
                .messages({
                    'string.base': 'Payee name must be a string.',
                    'string.empty': 'Payee name cannot be empty.',
                    'any.required': 'Payee name is required.'
                }),
            chequeNumber: Joi.string().required()
                .messages({
                    'string.base': 'Cheque number must be a string.',
                    'string.empty': 'Cheque number cannot be empty.',
                    'any.required': 'Cheque number is required.'
                }),
            dateOfCheque: Joi.string().required()
                .messages({
                    'string.base': 'Date of cheque must be a string.',
                    'string.empty': 'Date of cheque cannot be empty.',
                    'any.required': 'Date of cheque is required.'
                }),
            type: Joi.string().required()
                .messages({
                    'string.base': 'Type must be a string.',
                    'string.empty': 'Type cannot be empty.',
                    'any.required': 'Type is required.'
                }),
            signedBy: Joi.string().required()
                .messages({
                    'string.base': 'Signed by must be a string.',
                    'string.empty': 'Signed by cannot be empty.',
                    'any.required': 'Signed by is required.'
                }),
            cloudChequeBookId: Joi.number().optional().allow(null)
                .messages({
                    'number.base': 'Cloud Cheque Book Id must be a string.',
                }),
            dueDate: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Due date must be a string.',
                }),
            status: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Status must be a string.',
                }),
            remarks: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Remarks must be a string.',
                }),
            voucherReferance: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Voucher referance must be a string.',
                }),
            documentBase: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            documentFormat: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            document: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Document must be a string.',
                }),
            chequeLeafId: Joi.number().optional()
                .messages({
                    'number.base': 'Cheque leaf ID must be a number.',
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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
exports.validateCreateChequeBook = (req, res, next) => {
    try {
        const schema = Joi.object({
            bookId: Joi.string().required()
                .messages({
                    'string.base': 'Book ID must be a string.',
                    'string.empty': 'Book ID cannot be empty.',
                    'any.required': 'Book ID is required.'
                }),
            accountName: Joi.string().required()
                .messages({
                    'string.base': 'Account name must be a string.',
                    'string.empty': 'Account name cannot be empty.',
                    'any.required': 'Account name is required.'
                }),
            accountNumber: Joi.string().required()
                .messages({
                    'string.base': 'Account number must be a string.',
                    'string.empty': 'Account number cannot be empty.',
                    'any.required': 'Account number is required.'
                }),
            bankName: Joi.string().required()
                .messages({
                    'string.base': 'Bank name must be a string.',
                    'string.empty': 'Bank name cannot be empty.',
                    'any.required': 'Bank name is required.'
                }),
            status: Joi.string().required()
                .messages({
                    'string.base': 'Status must be a string.',
                    'string.empty': 'Status cannot be empty.',
                    'any.required': 'Status is required.'
                }),
            accountBalance: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Account balance must be a string.',
                }),
            currency: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Currency must be a string.',
                }),
            currencyDivision: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Currency division must be a string.',
                }),
            chequeStarting: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Cheque starting must be a string.',
                }),
            numberOfLeaves: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Number of leaves must be a string.',
                }),
            documentBase: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            documentFormat: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            document: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Document must be a string.',
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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
exports.validateUpdateChequeBook = (req, res, next) => {
    try {
        const schema = Joi.object({
            bookId: Joi.string().required()
                .messages({
                    'string.base': 'Book ID must be a string.',
                    'string.empty': 'Book ID cannot be empty.',
                    'any.required': 'Book ID is required.'
                }),
            accountName: Joi.string().required()
                .messages({
                    'string.base': 'Account name must be a string.',
                    'string.empty': 'Account name cannot be empty.',
                    'any.required': 'Account name is required.'
                }),
            accountNumber: Joi.string().required()
                .messages({
                    'string.base': 'Account number must be a string.',
                    'string.empty': 'Account number cannot be empty.',
                    'any.required': 'Account number is required.'
                }),
            bankName: Joi.string().required()
                .messages({
                    'string.base': 'Bank name must be a string.',
                    'string.empty': 'Bank name cannot be empty.',
                    'any.required': 'Bank name is required.'
                }),
            status: Joi.string().required()
                .messages({
                    'string.base': 'Status must be a string.',
                    'string.empty': 'Status cannot be empty.',
                    'any.required': 'Status is required.'
                }),
            accountBalance: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Account balance must be a string.',
                }),
            currency: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Currency must be a string.',
                }),
            currencyDivision: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Currency division must be a string.',
                }),
            chequeStarting: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Cheque starting must be a string.',
                }),
            numberOfLeaves: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Number of leaves must be a string.',
                }),
            documentBase: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            documentFormat: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            document: Joi.string().allow("").optional()
                .messages({
                    'string.base': 'Document must be a string.',
                }),
            chequeBookId: Joi.number().optional()
                .messages({
                    'number.base': 'Cheque book ID must be a number.',
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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

exports.validateCreateFinancialDoc = (req, res, next) => {
    try {
        const schema = Joi.object({
            documentBase: Joi.string().allow('').optional().messages({
                'string.base': 'Document must be a string.',
                'string.empty': 'Document cannot be empty.',
            }),
            documentFormat: Joi.string().allow('').optional().messages({
                'string.base': 'Document must be a string.',
                'string.empty': 'Document cannot be empty.',
            }),
            document: Joi.string().optional().allow(null).messages({
                'string.base': 'Document must be a string.',
            }),
            documentName: Joi.string().required().messages({
                'string.base': 'Document name must be a string.',
                'string.empty': 'Document name cannot be empty.',
                'any.required': 'Document name is required.',
            }),
            documentNumber: Joi.string().required().messages({
                'string.base': 'Document number must be a string.',
                'string.empty': 'Document number cannot be empty.',
                'any.required': 'Document number is required.',
            }),
            documentType: Joi.string().optional().allow('').messages({
                'string.base': 'Document type must be a string.',
            }),
            expireDate: Joi.string().optional().allow(null).messages({
                'string.base': 'Document type must be a string.',
            }),
            issueDate: Joi.string().required().messages({
                'string.base': 'Issue date must be a string.',
                'string.empty': 'Issue date cannot be empty.',
                'any.required': 'Issue date is required.',
            }),
            userId: Joi.number().optional().messages({
                'number.base': 'User ID must be a number.',
            }),
            userType: Joi.string().optional().messages({
                'string.base': 'User type must be a string.',
            }),
        })
        // Validate the request body against the schema
        const result = schema.validate(req.body)
        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}
exports.validateUpdateFinancialDoc = (req, res, next) => {
    try {
        const schema = Joi.object({
            documentBase: Joi.string().allow('').optional().messages({
                'string.base': 'Document must be a string.',
                'string.empty': 'Document cannot be empty.',
            }),
            documentFormat: Joi.string().allow('').optional().messages({
                'string.base': 'Document must be a string.',
                'string.empty': 'Document cannot be empty.',
            }),
            document: Joi.string().optional().allow('').messages({
                'string.base': 'Document must be a string.',
            }),
            documentName: Joi.string().required().messages({
                'string.base': 'Document name must be a string.',
                'string.empty': 'Document name cannot be empty.',
                'any.required': 'Document name is required.',
            }),
            documentNumber: Joi.string().required().messages({
                'string.base': 'Document number must be a string.',
                'string.empty': 'Document number cannot be empty.',
                'any.required': 'Document number is required.',
            }),
            documentType: Joi.string().optional().allow('').messages({
                'string.base': 'Document type must be a string.',
            }),
            expireDate: Joi.string().optional().allow(null).messages({
                'string.base': 'Document type must be a string.',
            }),
            issueDate: Joi.string().required().messages({
                'string.base': 'Issue date must be a string.',
                'string.empty': 'Issue date cannot be empty.',
                'any.required': 'Issue date is required.',
            }),
            docId: Joi.number().optional().messages({
                'number.base': 'Doc ID must be a number.',
            }),
            userId: Joi.number().optional().messages({
                'number.base': 'User ID must be a number.',
            }),
            userType: Joi.string().optional().messages({
                'string.base': 'User type must be a string.',
            }),
        })
        // Validate the request body against the schema
        const result = schema.validate(req.body)
        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}

exports.validateCreateSubscription = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.string().required().messages({
                'string.base': 'Amount must be a string.',
                'string.empty': 'Amount cannot be empty.',
                'any.required': 'Amount is required.',
            }),
            assignTo: Joi.array()
                .items(
                    Joi.object({
                        employeeName: Joi.string().required().messages({
                            'any.required': 'Signer name is required.',
                            'string.empty': 'Signer name cannot be empty.',
                        }),
                        id: Joi.number().required().messages({
                            'any.required': 'Sequence is required.',
                            'number.base': 'Sequence must be a number.',
                        }),
                    })
                )
                .optional(),
            billingCycle: Joi.string().required().messages({
                'string.base': 'Billing cycle must be a string.',
                'string.empty': 'Billing cycle cannot be empty.',
                'any.required': 'Billing cycle is required.',
            }),
            billingStartDate: Joi.string().required().messages({
                'string.base': 'Billing start date must be a string.',
                'string.empty': 'Billing start date cannot be empty.',
                'any.required': 'Billing start date is required.',
            }),
            currency: Joi.string().required()
                .messages({
                    'string.base': 'Currency must be a string.',
                    'string.empty': 'Currency cannot be empty.',
                    'any.required': 'Currency is required.'
                }),
            numberOfDevices: Joi.string().required().messages({
                'string.base': 'Number of devices must be a string.',
                'string.empty': 'Number of devices cannot be empty.',
                'any.required': 'Number of devices is required.',
            }),
            planDetails: Joi.string().required().messages({
                'string.base': 'Plan details must be a string.',
                'string.empty': 'Plan details cannot be empty.',
                'any.required': 'Plan details is required.',
            }),
            status: Joi.string().required().messages({
                'string.base': 'Status must be a string.',
                'string.empty': 'Status cannot be empty.',
                'any.required': 'Status is required.',
            }),
            subscriptionName: Joi.string().required().messages({
                'string.base': 'Subscription name must be a string.',
                'string.empty': 'Subscription name cannot be empty.',
                'any.required': 'Subscription name is required.',
            }),
            cloudSoftwareId: Joi.number().optional().allow(null).messages({
                'number.base': 'Cloud software ID must be a string.',
            }),
        })
        // Validate the request body against the schema
        const result = schema.validate(req.body)
        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}
exports.validateUpdateSubscription = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.string().required().messages({
                'string.base': 'Amount must be a string.',
                'string.empty': 'Amount cannot be empty.',
                'any.required': 'Amount is required.',
            }),
            assignTo: Joi.array()
                .items(
                    Joi.object({
                        employeeName: Joi.string().required().messages({
                            'any.required': 'Signer name is required.',
                            'string.empty': 'Signer name cannot be empty.',
                        }),
                        id: Joi.number().required().messages({
                            'any.required': 'Sequence is required.',
                            'number.base': 'Sequence must be a number.',
                        }),
                    })
                )
                .optional(),
            billingCycle: Joi.string().required().messages({
                'string.base': 'Billing cycle must be a string.',
                'string.empty': 'Billing cycle cannot be empty.',
                'any.required': 'Billing cycle is required.',
            }),
            billingStartDate: Joi.string().required().messages({
                'string.base': 'Billing start date must be a string.',
                'string.empty': 'Billing start date cannot be empty.',
                'any.required': 'Billing start date is required.',
            }),
            currency: Joi.string().required()
                .messages({
                    'string.base': 'Currency must be a string.',
                    'string.empty': 'Currency cannot be empty.',
                    'any.required': 'Currency is required.'
                }),
            numberOfDevices: Joi.string().required().messages({
                'string.base': 'Number of devices must be a string.',
                'string.empty': 'Number of devices cannot be empty.',
                'any.required': 'Number of devices is required.',
            }),
            planDetails: Joi.string().required().messages({
                'string.base': 'Plan details must be a string.',
                'string.empty': 'Plan details cannot be empty.',
                'any.required': 'Plan details is required.',
            }),
            status: Joi.string().required().messages({
                'string.base': 'Status must be a string.',
                'string.empty': 'Status cannot be empty.',
                'any.required': 'Status is required.',
            }),
            subscriptionName: Joi.string().required().messages({
                'string.base': 'Subscription name must be a string.',
                'string.empty': 'Subscription name cannot be empty.',
                'any.required': 'Subscription name is required.',
            }),
            cloudSoftwareId: Joi.number().optional().allow(null).messages({
                'number.base': 'Cloud software ID must be a string.',
            }),
            subscriptionId: Joi.number().optional().messages({
                'number.base': 'Subscription ID must be a number.',
            }),
            userId: Joi.number().optional().messages({
                'number.base': 'User ID must be a number.',
            }),
            userType: Joi.string().optional().messages({
                'string.base': 'User type must be a string.',
            }),
        })
        // Validate the request body against the schema
        const result = schema.validate(req.body)
        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}
exports.validateAssignSubscription = (req, res, next) => {
    try {
        const schema = Joi.object({
            employeeName: Joi.string().required().messages({
                'string.base': 'Employee name must be a string.',
                'string.empty': 'Employee name cannot be empty.',
                'any.required': 'Employee name is required.',
            }),
            subscriptionId: Joi.number().required().messages({
                'number.base': 'Subscription ID must be a string.',
                'number.empty': 'Subscription ID cannot be empty.',
                'any.required': 'Subscription ID is required.',
            }),
            id: Joi.number().optional().messages({
                'number.base': 'ID must be a number.',
            }),
        })
        // Validate the request body against the schema
        const result = schema.validate(req.body)
        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}

exports.validateCreateAsset = (req, res, next) => {
    try {
        const schema = Joi.object({
            assetCategory: Joi.string().required().messages({
                'string.base': 'Asset category must be a string.',
                'string.empty': 'Asset category cannot be empty.',
                'any.required': 'Asset category is required.',
            }),
            assetName: Joi.string().required().messages({
                'string.base': 'Asset name must be a string.',
                'string.empty': 'Asset name cannot be empty.',
                'any.required': 'Asset name is required.',
            }),
            serialNumber: Joi.string().required().messages({
                'string.base': 'Serial number must be a string.',
                'string.empty': 'Serial number cannot be empty.',
                'any.required': 'Serial number is required.',
            }),
            status: Joi.string().required().messages({
                'string.base': 'Status must be a string.',
                'string.empty': 'Status cannot be empty.',
                'any.required': 'Status is required.',
            }),
            amount: Joi.string().optional().allow('').messages({
                'string.base': 'Amount must be a string.',
            }),
            assetType: Joi.string().optional().allow('').messages({
                'string.base': 'Asset type must be a string.',
            }),
            cloudEmployeeId: Joi.number().optional().allow(null).messages({
                'number.base': 'Cloud Employee Id must be a string.',
            }),
            purchasedDate: Joi.string().optional().allow('').messages({
                'string.base': 'Purchased date must be a string.',
            }),
            warranty: Joi.string().optional().allow('').messages({
                'string.base': 'Warranty must be a string.',
            }),
            userId: Joi.number().optional().messages({
                'number.base': 'User ID must be a number.',
            }),
            userType: Joi.string().optional().messages({
                'string.base': 'User type must be a string.',
            }),
        })
        // Validate the request body against the schema
        const result = schema.validate(req.body)
        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}
exports.validateUpdateAsset = (req, res, next) => {
    try {
        const schema = Joi.object({
            assetCategory: Joi.string().required().messages({
                'string.base': 'Asset category must be a string.',
                'string.empty': 'Asset category cannot be empty.',
                'any.required': 'Asset category is required.',
            }),
            assetName: Joi.string().required().messages({
                'string.base': 'Asset name must be a string.',
                'string.empty': 'Asset name cannot be empty.',
                'any.required': 'Asset name is required.',
            }),
            serialNumber: Joi.string().required().messages({
                'string.base': 'Serial number must be a string.',
                'string.empty': 'Serial number cannot be empty.',
                'any.required': 'Serial number is required.',
            }),
            status: Joi.string().required().messages({
                'string.base': 'Status must be a string.',
                'string.empty': 'Status cannot be empty.',
                'any.required': 'Status is required.',
            }),
            amount: Joi.string().optional().allow('').messages({
                'string.base': 'Amount must be a string.',
            }),
            amountRecurring: Joi.string().optional().allow('').messages({
                'string.base': 'Amount recurring must be a string.',
            }),
            assetType: Joi.string().optional().allow('').messages({
                'string.base': 'Asset type must be a string.',
            }),
            batchNumber: Joi.string().optional().allow('').messages({
                'string.base': 'Batch number must be a string.',
            }),
            cloudEmployeeId: Joi.number().optional().allow(null).messages({
                'number.base': 'Cloud Employee Id must be a string.',
            }),
            purchasedDate: Joi.string().optional().allow(null).messages({
                'string.base': 'Purchased date must be a string.',
            }),
            warranty: Joi.string().optional().allow('').messages({
                'string.base': 'Warranty must be a string.',
            }),
            vendor: Joi.string().optional().allow('').messages({
                'string.base': 'Vendor must be a string.',
            }),
            assetId: Joi.number().optional().messages({
                'number.base': 'Asset ID must be a number.',
            }),
            userId: Joi.number().optional().messages({
                'number.base': 'User ID must be a number.',
            }),
            userType: Joi.string().optional().messages({
                'string.base': 'User type must be a string.',
            }),
        })
        // Validate the request body against the schema
        const result = schema.validate(req.body)
        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}
exports.validateAssignAsset = (req, res, next) => {
    try {
        // Base schema
        const baseSchema = Joi.object({
            newAssignDate: Joi.string().required().messages({
                'string.base': 'New assign date must be a string.',
                'string.empty': 'New assign date cannot be empty.',
                'any.required': 'New assign date is required.',
            }),
            newEmployeeId: Joi.number().required().messages({
                'number.base': 'New employee ID must be a number.',
                'number.empty': 'New employee ID cannot be empty.',
                'any.required': 'New employee ID is required.',
            }),
            assetId: Joi.number().required().messages({
                'number.base': 'Asset ID must be a number.',
                'number.empty': 'Asset ID cannot be empty.',
                'any.required': 'Asset ID is required.',
            }),
        })
        // Conditional schema
        const conditionalSchema = Joi.object({
            existReturnDate: Joi.string().required().messages({
                'string.base': 'Exist return date must be a string.',
                'string.empty': 'Exist return date cannot be empty.',
                'any.required': 'Exist return date is required.',
            }),
            existReturnStatus: Joi.string().required().messages({
                'string.base': 'Exist return status must be a string.',
                'string.empty': 'Exist return status cannot be empty.',
                'any.required': 'Exist return status is required.',
            }),
            existRemarks: Joi.string().optional().messages({
                'string.base': 'Exist remarks must be a string.',
            }),
            existUsageId: Joi.number().required().messages({
                'number.base': 'Exist usage ID must be a number.',
                'number.empty': 'Exist usage ID cannot be empty.',
                'any.required': 'Exist usage ID is required.',
            }),
        })
        const schema = baseSchema.concat(req.body.existUsageId ? conditionalSchema : Joi.object())
        // Validate the request body against the schema
        const result = schema.validate(req.body)
        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}
exports.validateCreateAssetDoc = (req, res, next) => {
    try {
        const schema = Joi.object({
            documentBase: Joi.string().allow('').optional().messages({
                'string.base': 'Document must be a string.',
                'string.empty': 'Document cannot be empty.',
            }),
            documentFormat: Joi.string().allow('').optional().messages({
                'string.base': 'Document must be a string.',
                'string.empty': 'Document cannot be empty.',
            }),
            document: Joi.string().optional().allow(null).messages({
                'string.base': 'Document must be a string.',
            }),
            documentName: Joi.string().required().messages({
                'string.base': 'Document name must be a string.',
                'string.empty': 'Document name cannot be empty.',
                'any.required': 'Document name is required.',
            }),
            documentNumber: Joi.string().required().messages({
                'string.base': 'Document number must be a string.',
                'string.empty': 'Document number cannot be empty.',
                'any.required': 'Document number is required.',
            }),
            cloudAssetId: Joi.number().required().messages({
                'string.base': 'Cloud asset ID must be a string.',
            }),
            expireDate: Joi.string().optional().allow(null).messages({
                'string.base': 'Document type must be a string.',
            }),
            issueDate: Joi.string().required().messages({
                'string.base': 'Issue date must be a string.',
                'string.empty': 'Issue date cannot be empty.',
                'any.required': 'Issue date is required.',
            }),
            userId: Joi.number().optional().messages({
                'number.base': 'User ID must be a number.',
            }),
            userType: Joi.string().optional().messages({
                'string.base': 'User type must be a string.',
            }),
        })
        // Validate the request body against the schema
        const result = schema.validate(req.body)
        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}
exports.validateUpdateAssetDoc = (req, res, next) => {
    try {
        const schema = Joi.object({
            documentBase: Joi.string().allow('').optional().messages({
                'string.base': 'Document must be a string.',
                'string.empty': 'Document cannot be empty.',
            }),
            documentFormat: Joi.string().allow('').optional().messages({
                'string.base': 'Document must be a string.',
                'string.empty': 'Document cannot be empty.',
            }),
            document: Joi.string().optional().allow('').messages({
                'string.base': 'Document must be a string.',
            }),
            documentName: Joi.string().required().messages({
                'string.base': 'Document name must be a string.',
                'string.empty': 'Document name cannot be empty.',
                'any.required': 'Document name is required.',
            }),
            documentNumber: Joi.string().required().messages({
                'string.base': 'Document number must be a string.',
                'string.empty': 'Document number cannot be empty.',
                'any.required': 'Document number is required.',
            }),
            expireDate: Joi.string().optional().allow(null).messages({
                'string.base': 'Document type must be a string.',
            }),
            issueDate: Joi.string().required().messages({
                'string.base': 'Issue date must be a string.',
                'string.empty': 'Issue date cannot be empty.',
                'any.required': 'Issue date is required.',
            }),
            docId: Joi.number().optional().messages({
                'number.base': 'Doc ID must be a number.',
            }),
            userId: Joi.number().optional().messages({
                'number.base': 'User ID must be a number.',
            }),
            userType: Joi.string().optional().messages({
                'string.base': 'User type must be a string.',
            }),
        })
        // Validate the request body against the schema
        const result = schema.validate(req.body)
        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}
exports.validateUpdateAssetUsageHistory = (req, res, next) => {
    try {
        const schema = Joi.object({
            assignDate: Joi.string().required().messages({
                'string.base': 'Asset category must be a string.',
                'string.empty': 'Asset category cannot be empty.',
                'any.required': 'Asset category is required.',
            }),
            cloudAssetId: Joi.number().required().messages({
                'number.base': 'Cloud asset ID must be a number.',
                'number.empty': 'Cloud asset ID cannot be empty.',
                'any.required': 'Cloud asset ID is required.',
            }),
            cloudEmployeeId: Joi.number().required().messages({
                'number.base': 'Cloud Employee Id must be a number.',
                'number.empty': 'Cloud Employee Id cannot be empty.',
                'any.required': 'Cloud Employee Id is required.',
            }),
            remarks: Joi.string().optional().allow('').messages({
                'string.base': 'Remarks must be a string.',
            }),
            returnDate: Joi.string().optional().allow('').messages({
                'string.base': 'Return date must be a string.',
            }),
            returnStatus: Joi.string().optional().allow('').messages({
                'string.base': 'Return status must be a string.',
            }),
            usageId: Joi.number().optional().messages({
                'number.base': 'Usage ID must be a number.',
            }),
            userId: Joi.number().optional().messages({
                'number.base': 'User ID must be a number.',
            }),
            userType: Joi.string().optional().messages({
                'string.base': 'User type must be a string.',
            }),
        })
        // Validate the request body against the schema
        const result = schema.validate(req.body)
        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}

exports.validateCreateFleet = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.string().required()
                .messages({
                    'string.base': 'Amount must be a string.',
                    'string.empty': 'Amount cannot be empty.',
                    'any.required': 'Amount is required.'
                }),
            purchasedDate: Joi.string().required()
                .messages({
                    'string.base': 'Purchased date must be a string.',
                    'string.empty': 'Purchased date cannot be empty.',
                    'any.required': 'Purchased date is required.'
                }),
            vehicleName: Joi.string().required()
                .messages({
                    'string.base': 'Vehicle name must be a string.',
                    'string.empty': 'Vehicle name cannot be empty.',
                    'any.required': 'Vehicle name is required.'
                }),
            vehicleNumber: Joi.string().required()
                .messages({
                    'string.base': 'Vehicle number must be a string.',
                    'string.empty': 'Vehicle number cannot be empty.',
                    'any.required': 'Vehicle number is required.'
                }),
            vehicleType: Joi.string().required()
                .messages({
                    'string.base': 'Vehicle type must be a string.',
                    'string.empty': 'Vehicle type cannot be empty.',
                    'any.required': 'Vehicle type is required.'
                }),
            status: Joi.string().required()
                .messages({
                    'string.base': 'Status must be a string.',
                    'string.empty': 'Status cannot be empty.',
                    'any.required': 'Status is required.'
                }),
            assetType: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Asset type must be a string.',
                }),
            cloudEmployeeId: Joi.number().optional().allow(null)
                .messages({
                    'number.base': 'Cloud Employee Id must be a string.',
                }),
            dateOfRenewal: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Date of renewal must be a string.',
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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
exports.validateUpdateFleet = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.string().required()
                .messages({
                    'string.base': 'Amount must be a string.',
                    'string.empty': 'Amount cannot be empty.',
                    'any.required': 'Amount is required.'
                }),
            purchasedDate: Joi.string().required()
                .messages({
                    'string.base': 'Purchased date must be a string.',
                    'string.empty': 'Purchased date cannot be empty.',
                    'any.required': 'Purchased date is required.'
                }),
            vehicleName: Joi.string().required()
                .messages({
                    'string.base': 'Vehicle name must be a string.',
                    'string.empty': 'Vehicle name cannot be empty.',
                    'any.required': 'Vehicle name is required.'
                }),
            vehicleNumber: Joi.string().required()
                .messages({
                    'string.base': 'Vehicle number must be a string.',
                    'string.empty': 'Vehicle number cannot be empty.',
                    'any.required': 'Vehicle number is required.'
                }),
            vehicleType: Joi.string().required()
                .messages({
                    'string.base': 'Vehicle type must be a string.',
                    'string.empty': 'Vehicle type cannot be empty.',
                    'any.required': 'Vehicle type is required.'
                }),
            status: Joi.string().required()
                .messages({
                    'string.base': 'Status must be a string.',
                    'string.empty': 'Status cannot be empty.',
                    'any.required': 'Status is required.'
                }),
            amountRecurring: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Amount recurring must be a string.',
                }),
            cloudEmployeeId: Joi.number().optional().allow(null)
                .messages({
                    'number.base': 'Cloud Employee Id must be a string.',
                }),
            chassisNumber: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Chassis number must be a string.',
                }),
            engineTransmission: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Engine transmission must be a string.',
                }),
            modelYear: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Model year must be a string.',
                }),
            odoMeter: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'ODO meter must be a string.',
                }),
            vendor: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Vendor must be a string.',
                }),
            fleetId: Joi.number().optional()
                .messages({
                    'number.base': 'Fleet ID must be a number.',
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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
exports.validateAssignFleet = (req, res, next) => {
    try {
        // Base schema
        const baseSchema = Joi.object({
            newAssignDate: Joi.string().required()
                .messages({
                    'string.base': 'New assign date must be a string.',
                    'string.empty': 'New assign date cannot be empty.',
                    'any.required': 'New assign date is required.'
                }),
            newEmployeeId: Joi.number().required()
                .messages({
                    'number.base': 'New employee ID must be a number.',
                    'number.empty': 'New employee ID cannot be empty.',
                    'any.required': 'New employee ID is required.'
                }),
            fleetId: Joi.number().required()
                .messages({
                    'number.base': 'Fleet ID must be a number.',
                    'number.empty': 'Fleet ID cannot be empty.',
                    'any.required': 'Fleet ID is required.'
                }),
        });
        // Conditional schema
        const conditionalSchema = Joi.object({
            existReturnDate: Joi.string().required()
                .messages({
                    'string.base': 'Exist return date must be a string.',
                    'string.empty': 'Exist return date cannot be empty.',
                    'any.required': 'Exist return date is required.'
                }),
            existReturnStatus: Joi.string().required()
                .messages({
                    'string.base': 'Exist return status must be a string.',
                    'string.empty': 'Exist return status cannot be empty.',
                    'any.required': 'Exist return status is required.'
                }),
            existRemarks: Joi.string().optional()
                .messages({
                    'string.base': 'Exist remarks must be a string.',
                }),
            existUsageId: Joi.number().required()
                .messages({
                    'number.base': 'Exist usage ID must be a number.',
                    'number.empty': 'Exist usage ID cannot be empty.',
                    'any.required': 'Exist usage ID is required.'
                }),
        });
        const schema = baseSchema.concat(
            req.body.existUsageId ? conditionalSchema : Joi.object()
        );
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
exports.validateCreateFleetDoc = (req, res, next) => {
    try {
        const schema = Joi.object({
            documentBase: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            documentFormat: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            document: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Document must be a string.',
                }),
            documentName: Joi.string().required()
                .messages({
                    'string.base': 'Document name must be a string.',
                    'string.empty': 'Document name cannot be empty.',
                    'any.required': 'Document name is required.'
                }),
            documentNumber: Joi.string().required()
                .messages({
                    'string.base': 'Document number must be a string.',
                    'string.empty': 'Document number cannot be empty.',
                    'any.required': 'Document number is required.'
                }),
            documentType: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Document type must be a string.',
                }),
            cloudFleetId: Joi.number().required()
                .messages({
                    'string.base': 'Cloud asset ID must be a string.',
                }),
            expireDate: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Expire date must be a string.',
                }),
            issueDate: Joi.string().required()
                .messages({
                    'string.base': 'Issue date must be a string.',
                    'string.empty': 'Issue date cannot be empty.',
                    'any.required': 'Issue date is required.'
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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
exports.validateUpdateFleetDoc = (req, res, next) => {
    try {
        const schema = Joi.object({
            documentBase: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            documentFormat: Joi.string().allow('').optional()
                .messages({
                    'string.base': 'Document must be a string.',
                    'string.empty': 'Document cannot be empty.'
                }),
            document: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Document must be a string.',
                }),
            documentName: Joi.string().required()
                .messages({
                    'string.base': 'Document name must be a string.',
                    'string.empty': 'Document name cannot be empty.',
                    'any.required': 'Document name is required.'
                }),
            documentNumber: Joi.string().required()
                .messages({
                    'string.base': 'Document number must be a string.',
                    'string.empty': 'Document number cannot be empty.',
                    'any.required': 'Document number is required.'
                }),
            documentType: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Document type must be a string.',
                }),
            expireDate: Joi.string().optional().allow(null)
                .messages({
                    'string.base': 'Document type must be a string.',
                }),
            issueDate: Joi.string().required()
                .messages({
                    'string.base': 'Issue date must be a string.',
                    'string.empty': 'Issue date cannot be empty.',
                    'any.required': 'Issue date is required.'
                }),
            docId: Joi.number().optional()
                .messages({
                    'number.base': 'Doc ID must be a number.',
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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
exports.validateUpdateFleetUsageHistory = (req, res, next) => {
    try {
        const schema = Joi.object({
            assignDate: Joi.string().required()
                .messages({
                    'string.base': 'Asset category must be a string.',
                    'string.empty': 'Asset category cannot be empty.',
                    'any.required': 'Asset category is required.'
                }),
            cloudFleetId: Joi.number().required()
                .messages({
                    'number.base': 'Cloud asset ID must be a number.',
                    'number.empty': 'Cloud asset ID cannot be empty.',
                    'any.required': 'Cloud asset ID is required.'
                }),
            cloudEmployeeId: Joi.number().required()
                .messages({
                    'number.base': 'Cloud Employee Id must be a number.',
                    'number.empty': 'Cloud Employee Id cannot be empty.',
                    'any.required': 'Cloud Employee Id is required.'
                }),
            remarks: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Remarks must be a string.',
                }),
            returnDate: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Return date must be a string.',
                }),
            returnStatus: Joi.string().optional().allow("")
                .messages({
                    'string.base': 'Return status must be a string.',
                }),
            usageId: Joi.number().optional()
                .messages({
                    'number.base': 'Usage ID must be a number.',
                }),
            userId: Joi.number().optional()
                .messages({
                    'number.base': 'User ID must be a number.',
                }),
            userType: Joi.string().optional()
                .messages({
                    'string.base': 'User type must be a string.',
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
exports.validateCreateFleetMaintenance = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.string().required().messages({
                'string.base': 'Amount must be a string.',
                'string.empty': 'Amount cannot be empty.',
                'any.required': 'Amount is required.',
            }),
            date: Joi.string().required().messages({
                'string.base': 'Assign date must be a string.',
                'string.empty': 'Assign date cannot be empty.',
                'any.required': 'Assign date is required.',
            }),
            repairCategory: Joi.string().required().messages({
                'string.base': 'Repair category must be a string.',
                'string.empty': 'Repair category cannot be empty.',
                'any.required': 'Repair category is required.',
            }),
            serviceType: Joi.string().required().messages({
                'string.base': 'Service type must be a string.',
                'string.empty': 'Service type cannot be empty.',
                'any.required': 'Service type is required.',
            }),
            cloudFleetId: Joi.number().required().messages({
                'number.base': 'Cloud Fleet Id must be a string.',
            }),
            receivedDate: Joi.string().optional().allow(null).messages({
                'string.base': 'Received date must be a string.',
            }),
            userId: Joi.number().optional().messages({
                'number.base': 'User ID must be a number.',
            }),
            userType: Joi.string().optional().messages({
                'string.base': 'User type must be a string.',
            }),
        })

        // Validate the request body against the schema
        const result = schema.validate(req.body)

        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }

        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}

exports.validateUpdateFleetMaintenance = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.string().required().messages({
                'string.base': 'Amount must be a string.',
                'string.empty': 'Amount cannot be empty.',
                'any.required': 'Amount is required.',
            }),
            date: Joi.string().required().messages({
                'string.base': 'Assign date must be a string.',
                'string.empty': 'Assign date cannot be empty.',
                'any.required': 'Assign date is required.',
            }),
            repairCategory: Joi.string().required().messages({
                'string.base': 'Repair category must be a string.',
                'string.empty': 'Repair category cannot be empty.',
                'any.required': 'Repair category is required.',
            }),
            serviceType: Joi.string().required().messages({
                'string.base': 'Service type must be a string.',
                'string.empty': 'Service type cannot be empty.',
                'any.required': 'Service type is required.',
            }),
            maintenanceId: Joi.number().required().messages({
                'number.base': 'Maintenance Id must be a number.',
            }),
            receivedDate: Joi.string().optional().allow(null).messages({
                'string.base': 'Received date must be a string.',
            }),
            userId: Joi.number().optional().messages({
                'number.base': 'User ID must be a number.',
            }),
            userType: Joi.string().optional().messages({
                'string.base': 'User type must be a string.',
            }),
        })

        // Validate the request body against the schema
        const result = schema.validate(req.body)

        if (result.error) {
            // If validation fails, throw an error with the validation message
            throw new Error(result.error.details[0].message)
        }

        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
}

exports.validateTempleteCreate = (req, res, next) => {
    try {
        const schema = Joi.object({
            type: Joi.string()
                .valid("notification", "sms", "email", "invoiceTemplate")
                .required()
                .messages({
                    "string.base": "Type must be a string",
                    "string.empty": "Type cannot be empty",
                    "any.only": 'Type must be one of: notification, sms, email, invoiceTemplate',
                    "any.required": "Type is required",
                }),
            body: Joi.string().required().messages({
                "string.base": "Body must be a string",
                "string.empty": "Body cannot be empty",
                "any.required": "Body is required",
            }),
            subject: Joi.string().optional().messages({
                "string.base": "Subject must be a string",
                "string.empty": "Subject cannot be empty",
            }),
            image: Joi.object({
                imageBase: Joi.string().required(),
                imageFormat: Joi.string().required(),
            }).optional().allow(null),
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

exports.validateActiveStatus = (req, res, next) => {
    try {
        const schema = Joi.object({
            status: Joi.boolean().required().messages({
                "boolean.base": "status must be a boolean.",
                "any.required": "status is required.",
            }),
            userId: Joi.number().optional().messages({
                "number.base": "User ID must be a number",
            }),
            userType: Joi.string().optional(),
        });
        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
        next();
    } catch (err) {
        err.code ? console.log(`🚀 ~Error:${err.message}`) : console.log(err);
        next(err);
    }
};

exports.validateCreatePaymentLink = (req, res, next) => {
    try {
        const schema = Joi.object({
            full_name: Joi.string()
                .min(1)
                .required()
                .description('Full name of the customer, must be a non-empty string.'),

            email: Joi.string()
                .email()
                .required()
                .messages({
                    "string.base": 'Email ID must be a valid email address.',
                    "string.email": 'Email ID must be a valid email address.',
                    "any.required": 'Email ID  is required.',
                }),


            phone_number: Joi.string()
                .pattern(/^\d+$/)  // Ensures the phone number contains only digits
                .required()
                .description('Phone number, must be a string of digits.'),

            expires_at: Joi.number()
                .integer()
                .positive()
                .required()
                .description("Expiration time in hours, must be a positive integer."),

            amount: Joi.string()
                .pattern(/^\d{1,8}(\.\d{1,2})?$/, { name: "amount_in_range" })
                .required()
                .messages({
                    "string.pattern.name":
                        "Amount must be up to 8 digits before the decimal and 2 digits after",
                    "any.required": 'The amount, must be a string of digits.',
                }),
            purpose_message: Joi.string()
                .max(15)
                .optional()
                .description("Purpose message, up to 15 characters allowed."),
            notification: Joi.string()
                .valid('EML', 'SMS', 'LNK', 'ALL')
                .required()
                .description('Notification type, must be one of "EML", "SMS", "LNK", or "ALL".'),
            invoiceId: Joi.number().optional()
        });

        const { error } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateAttestationAdminUpdate = (req, res, next) => {
    try {
        const schema = Joi.object({
            status: Joi.string().required().messages({
                "any.required": "Status is required.",
            }),
            base64String: Joi.string().allow("").optional(),
            documentFormat: Joi.string().allow("").optional(),
            poBox: Joi.string().allow("").optional(),
            contactPersonPhone: Joi.string().required().messages({
                "any.required": "Contact Number is required.",
            }),
            userId: Joi.number().required().messages({
                "any.required": "User Id is required.",
            }),
            userType: Joi.string().required().messages({
                "any.required": "User Type is required.",
            }),
            id: Joi.number().required().messages({
                "any.required": "Id is required.",
            }),
            address: Joi.string().required().messages({
                "any.required": "Address is required.",
            }),
            remarks: Joi.string().allow(""),
            email: Joi.string().allow(null),
        });

        const result = schema.validate(req.body);
        console.log(result, "this is the validateion result");
        if (result.error) {
            throw new Error(req.body, result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};
////////////////////Adding Corporate tax admin update////////////////////////////////
exports.validateCorporateTaxAdminUpdate = (req, res, next) => {
    try {
        const schema = Joi.object({
            status: Joi.string().valid("RE UPLOAD", "COMPLETED").required().messages({
                "any.required": "Status is required.",
                "any.only": 'Status must be either "RE UPLOAD" or "COMPLETED".',
            }),
            remarks: Joi.string().when("status", {
                is: "RE UPLOAD",
                then: Joi.string().required().messages({
                    "any.required": "Remarks are required for status RE UPLOAD.",
                }),
                otherwise: Joi.forbidden(), // Disallow remarks for status other than "RE UPLOAD"
            }),
            taxCertificateDoc: Joi.when("status", {
                is: "COMPLETED",
                then: Joi.object({
                    format: Joi.string()
                        .valid("pdf", "jpg", "png", "jpeg")
                        .required()
                        .messages({
                            "any.required":
                                'Tax certificate format is required for status "COMPLETED".',
                            "any.only":
                                "Tax certificate format must be one of: pdf, jpg, png, jpeg.",
                        }),
                    base64: Joi.string().required().messages({
                        "any.required":
                            'Base64 encoded tax certificate is required for status "COMPLETED".',
                    }),
                }),
                otherwise: Joi.forbidden(), // Disallow taxCertificateDoc for status "RE UPLOAD"
            }),
        });
        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};
////////////////////Adding Corporate tax admin update////////////////////////////////


/////////////////////////////////VERIFICATION SUITE//////////////////////////////////
exports.validateBankAccountDetails = (req, res, next) => {
    try {
        const schema = Joi.object({
            accounts: Joi.string()
                .pattern(/^\d{9,18}$/)
                .required()
                .messages({
                    "string.pattern.base": "Bank account number must be 9 to 18 digits.",
                    "any.required": "Bank account number is required."
                }),

            ifsc_code: Joi.string()
                .length(11)
                .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
                .required()
                .messages({
                    "string.length": "IFSC code must be 11 characters long.",
                    "string.pattern.base": "Invalid IFSC code format.",
                    "any.required": "IFSC code is required."
                }),

            account_name: Joi.string()
                .min(2)
                .max(100)
                .allow('', null)
                .messages({
                    "string.min": "Name must be at least 2 characters.",
                    "string.max": "Name must be at most 100 characters.",
                }),

            reference_number: Joi.string()
                .alphanum()
                .max(20)
                .allow('', null)
                .messages({
                    "string.alphanum": "Reference number must be alphanumeric.",
                    "string.max": "Reference number must be at most 20 characters.",
                }),

        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateIFSC = (req, res, next) => {
    try {
        const schema = Joi.object({
            ifsc: Joi.string()
                .length(11)
                .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
                .required()
                .messages({
                    "string.length": "IFSC code must be exactly 11 characters.",
                    "string.pattern.base": "IFSC code must be in the correct format (e.g., YESB0000262).",
                    "any.required": "IFSC code is required."
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validatePANAndName = (req, res, next) => {
    try {
        const schema = Joi.object({
            pan: Joi.string()
                .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
                .required()
                .messages({
                    "string.pattern.base": "PAN must be in format: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g., ABCPV1234D).",
                    "any.required": "PAN is required.",
                }),
            name: Joi.string()
                .min(2)
                .max(100)
                .allow('', null)
                .messages({
                    "string.min": "Name must be at least 2 characters long.",
                    "string.max": "Name must be less than or equal to 100 characters.",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validatePANDetailsV2 = (req, res, next) => {
    try {
        const schema = Joi.object({
            pan: Joi.string()
                .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
                .required()
                .messages({
                    "string.pattern.base": "PAN must be in format: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g., ABCPV1234D).",
                    "any.required": "PAN is required.",
                }),
            name: Joi.string()
                .min(2)
                .max(45)
                .required()
                .messages({
                    "string.min": "Name must be at least 2 characters long.",
                    "string.max": "Name must be less than or equal to 45 characters.",
                    "any.required": "Name is required.",
                }),
            date_of_birth: Joi.string()
                .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
                .required()
                .messages({
                    "string.pattern.base": "Date of birth must be in DD/MM/YYYY format.",
                    "any.required": "Date of birth is required.",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateGSTINBodyV2 = (req, res, next) => {
    try {
        const schema = Joi.object({
            gst_in: Joi.string()
                .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/)
                .required()
                .messages({
                    "string.pattern.base": "GSTIN must follow a valid format like 29AAICP2912R1ZR.",
                    "any.required": "GSTIN is required.",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateGstinByPanV2 = (req, res, next) => {
    try {
        const schema = Joi.object({
            pan_no: Joi.string()
                .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
                .required()
                .messages({
                    "string.pattern.base": "PAN must be in format: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g., ABCPV1234D).",
                    "any.required": "PAN is required.",
                }),
            state_code: Joi.string()
                .pattern(/^[0-9]{2}$/)
                .required()
                .messages({
                    "string.pattern.base": "State code must be a 2 digit GST state code (e.g., 06).",
                    "any.required": "State code is required.",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateGenerateAadhaarLinkV2 = (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string()
                .min(2)
                .max(60)
                .allow('', null)
                .messages({
                    "string.min": "Name must be at least 2 characters long.",
                    "string.max": "Name must be less than or equal to 60 characters.",
                }),
            email: Joi.string()
                .email()
                .max(100)
                .allow('', null)
                .messages({
                    "string.email": "Please enter a valid email address.",
                    "string.max": "Email must be less than or equal to 100 characters.",
                }),
            mobile: Joi.string()
                .pattern(/^[6-9]\d{9}$/)
                .allow('', null)
                .messages({
                    "string.pattern.base": "Please enter a valid 10-digit Indian mobile number",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateGetAadhaarDetailsV2 = (req, res, next) => {
    try {
        const schema = Joi.object({
            reference_number: Joi.string()
                .alphanum()
                .max(20)
                .required()
                .messages({
                    "string.alphanum": "Reference number must be alphanumeric.",
                    "string.max": "Reference number must be less than or equal to 20 characters.",
                    "any.required": "Reference number is required.",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};


  exports.validateGarageDocument = (req, res, next) => {
    try {
      const type = req.params.type?.toLowerCase();
      let schema;

      if (type === 'dl') {
        schema = Joi.object({
          doc_identity_no: Joi.string()
            .pattern(/^[A-Z]{2}\d{2}\d{4}\d{7}$/)
            .required()
            .messages({
              "string.pattern.base": "Driving License number is Invalid.",
              "any.required": "Driving License number is required.",
            }),
          dob: Joi.date()
            .iso()
            .less("now")
            .required()
            .messages({
              "date.base": "DOB must be a valid date.",
              "date.format": "DOB must be in ISO format (YYYY-MM-DD).",
              "date.less": "DOB must be in the past.",
              "any.required": "Date of birth is required.",
            }),
        });
      } else if (type === 'rc') {
        schema = Joi.object({
          doc_identity_no: Joi.string()
            .pattern(/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/)
            .required()
            .messages({
              "string.pattern.base": "Vehicle registration number is invalid",
              "any.required": "Vehicle registration number is required.",
            }),
        });
      } else {
        return next();
      }

      const result = schema.validate(req.body, { allowUnknown: true });
      if (result.error) {
        throw new Error(result.error.details[0].message);
      }

      next();
    } catch (err) {
      console.error(err);
      next(err);
    }
  };

exports.validateFleetServiceDates = (req, res, next) => {
  try {
    const schema = Joi.object({
      lastServiceDate: Joi.date()
        .iso()
        .max("now")
        .required()
        .messages({
          "date.base": "Last service date must be a valid date.",
          "date.format": "Last service date must be in ISO format (YYYY-MM-DD).",
          "date.max": "Last service date cannot be in the future.",
          "any.required": "Last service date is required.",
        }),
      nextServiceDue: Joi.date()
        .iso()
        .greater(Joi.ref("lastServiceDate"))
        .required()
        .messages({
          "date.base": "Next service due must be a valid date.",
          "date.format": "Next service due must be in ISO format (YYYY-MM-DD).",
          "date.greater": "Next service due must be after the last service date.",
          "any.required": "Next service due is required.",
        }),
    });

    const result = schema.validate(req.body, { allowUnknown: true });
    if (result.error) {
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateQuoteRequest = (req, res, next) => {
  try {
    const schema = Joi.object({
      fullName: Joi.string()
        .trim()
        .required()
        .messages({
          "string.empty": "Full name is required.",
          "any.required": "Full name is required.",
        }),
      mobileNumber: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({
          "string.pattern.base": "Please enter a valid 10-digit mobile number.",
          "string.empty": "Mobile number is required.",
          "any.required": "Mobile number is required.",
        }),
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
          "string.email": "Please enter a valid email.",
          "string.empty": "Email is required.",
          "any.required": "Email is required.",
        }),
      insuranceType: Joi.string()
        .trim()
        .required()
        .messages({
          "string.empty": "Insurance type is required.",
          "any.required": "Insurance type is required.",
        }),
    });

    const result = schema.validate(req.body, { allowUnknown: true });
    if (result.error) {
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateQuoteRequestStatus = (req, res, next) => {
  try {
    const schema = Joi.object({
      status: Joi.string()
        .valid("NEW", "CONTACTED", "QUOTED", "CONVERTED", "CLOSED")
        .required()
        .messages({
          "any.only": "Invalid status value.",
          "any.required": "Status is required.",
        }),
      remarks: Joi.string().allow("", null).optional(),
    });

    const result = schema.validate(req.body, { allowUnknown: true });
    if (result.error) {
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.validateFleetFastag = (req, res, next) => {
  try {
    const schema = Joi.object({
      fastagBillerId: Joi.string()
        .trim()
        .required()
        .messages({
          "string.empty": "Service provider is required.",
          "any.required": "Service provider is required.",
        }),
      fastagProvider: Joi.string()
        .trim()
        .required()
        .messages({
          "string.empty": "Service provider is required.",
          "any.required": "Service provider is required.",
        }),
      fastagRegistration: Joi.string()
        .trim()
        .required()
        .messages({
          "string.empty": "Vehicle registration number is required.",
          "any.required": "Vehicle registration number is required.",
        }),
      fastagParamName: Joi.string().allow("", null).optional(),
    });

    const result = schema.validate(req.body, { allowUnknown: true });
    if (result.error) {
      throw new Error(result.error.details[0].message);
    }

    next();
  } catch (err) {
    console.error(err);
    next(err);
  }
};

// Ticket 31000: type/size validation for Document Center uploads (the FE already enforces the same
// limits; this closes the API). Mirrors the garage_document type ENUM and the 5 MB / JPEG-PNG-PDF rule.
const GARAGE_DOCUMENT_TYPES = ["Aadhaar", "PAN", "DL", "RC", "Permit", "Insurance", "PUC", "Fitness", "RoadTax", "Other"];
const GARAGE_DOCUMENT_FORMATS = ["pdf", "jpg", "jpeg", "png"];
const GARAGE_DOCUMENT_MAX_MB = 5;
// base64 inflates by 4/3; the FE strips the data-URL prefix before sending.
const GARAGE_DOCUMENT_MAX_BASE64_LENGTH = Math.ceil((GARAGE_DOCUMENT_MAX_MB * 1024 * 1024 * 4) / 3);

const buildGarageDocumentSchema = (isCreate) => {
  const formatRule = Joi.string()
    .lowercase()
    .valid(...GARAGE_DOCUMENT_FORMATS)
    .messages({
      "any.only": "Only PDF, JPG, JPEG or PNG documents are allowed.",
      "string.empty": "Document format is required when a file is uploaded.",
      "any.required": "Document format is required when a file is uploaded.",
    });
  const fileRule = Joi.string()
    .base64({ paddingRequired: false })
    .max(GARAGE_DOCUMENT_MAX_BASE64_LENGTH)
    .messages({
      "string.base64": "Document file must be a valid base64 encoded file.",
      "string.max": `Document file must be smaller than ${GARAGE_DOCUMENT_MAX_MB} MB.`,
      "string.empty": "Document file is required.",
      "any.required": "Document file is required.",
    });
  const typeRule = Joi.string()
    .valid(...GARAGE_DOCUMENT_TYPES)
    .messages({ "any.only": "Invalid document type.", "any.required": "Document type is required.", "string.empty": "Document type is required." });

  return Joi.object({
    type: isCreate ? typeRule.required() : typeRule.optional(),
    // create: a file is mandatory; update: optional (expiry-only edits), but a file always needs its format
    documentBase: isCreate ? fileRule.required() : fileRule.allow("").optional(),
    documentFormat: Joi.when("documentBase", {
      is: Joi.string().min(1).required(),
      then: formatRule.empty("").required(), // "" → treated as missing so the required message fires
      otherwise: formatRule.allow("").optional(),
    }),
    expiryDate: Joi.date().allow(null, "").optional().messages({ "date.base": "Expiry date must be a valid date." }),
    vehicleId: Joi.number().integer().positive().allow(null).optional(),
    driverId: Joi.number().integer().positive().allow(null).optional(),
  }).unknown(true); // userId/userType and other envelope fields ride along from the FE client
};

const validateGarageDocumentBody = (isCreate) => (req, res, next) => {
  const result = buildGarageDocumentSchema(isCreate).validate(req.body || {}, { abortEarly: true });
  if (result.error) {
    return next(new ErrorResponse(result.error.details[0].message, 400));
  }
  req.body = result.value; // normalised (lowercased format)
  return next();
};

exports.validateGarageDocumentCreate = validateGarageDocumentBody(true);
exports.validateGarageDocumentUpdate = validateGarageDocumentBody(false);

exports.validateDLAndDOB = (req, res, next) => {
    try {
        const schema = Joi.object({
            dl_number: Joi.string()
                .pattern(/^[A-Z]{2}\d{2}\d{4}\d{7}$/)
                .required()
                .messages({
                    "string.pattern.base": "DL number must be in the format: 2 uppercase letters, 2 digits, 4 digits (year), and 7 digits (e.g., KA0120198900984).",
                    "any.required": "Driving License number is required.",
                }),
            dob: Joi.date()
                .iso()
                .less("now")
                .required()
                .messages({
                    "date.base": "DOB must be a valid date.",
                    "date.format": "DOB must be in ISO format (YYYY-MM-DD).",
                    "date.less": "DOB must be in the past.",
                    "any.required": "DOB is required.",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateVoterIdDetails = (req, res, next) => {
    try {
        const schema = Joi.object({
            epic_number: Joi.string()
                .pattern(/^[A-Z]{3}[0-9]{7}$/)
                .required()
                .messages({
                    "string.pattern.base": "EPIC number must be in the format: 3 uppercase letters followed by 7 digits (e.g., UAI4574761).",
                    "any.required": "EPIC number is required.",
                }),

            name: Joi.string()
                .min(2)
                .max(100)
                .allow('', null)
                .messages({
                    "string.min": "Name must be at least 2 characters.",
                    "string.max": "Name must be less than or equal to 100 characters.",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validatePassportDetails = (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string()
                .min(2)
                .max(100)
                .allow('', null)
                .messages({
                    "string.min": "Name must be at least 2 characters.",
                    "string.max": "Name must not exceed 100 characters.",
                }),

            file_number: Joi.string()
                .pattern(/^PA[0-9]{13}$/)
                .required()
                .messages({
                    "string.pattern.base":
                        "File number must start with 'PA' followed by 13 digits (e.g., PA1079341954215).",
                    "any.required": "File number is required.",
                }),

            dob: Joi.date()
                .iso()
                .less("now")
                .required()
                .messages({
                    "date.format": "DOB must be in ISO format (YYYY-MM-DD).",
                    "date.less": "DOB must be in the past.",
                    "any.required": "DOB is required.",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateCINDetails = (req, res, next) => {
    try {
        const schema = Joi.object({
            cin: Joi.string()
                .pattern(/^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/)
                .required()
                .messages({
                    "string.pattern.base": "CIN must follow the valid format, e.g., U72900KA2015PTC082988.",
                    "any.required": "CIN is required.",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateGSTINDetails = (req, res, next) => {
    try {
        const schema = Joi.object({
            GSTIN: Joi.string()
                .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/)
                .required()
                .messages({
                    "string.pattern.base": "GSTIN must follow a valid format like 29AAICP2912R1ZR.",
                    "any.required": "GSTIN is required.",
                }),

            business_name: Joi.string()
                .min(2)
                .allow('', null)
                .messages({
                    "string.min": "Business name must be at least 2 characters long.",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validatePANDetails = (req, res, next) => {
    try {
        const schema = Joi.object({
            pan: Joi.string()
                .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
                .required()
                .messages({
                    "string.pattern.base": "PAN must follow a valid format like ABCDE1234F.",
                    "any.required": "PAN is required.",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateAadhaarNumber = (req, res, next) => {
    try {
        const schema = Joi.object({
            aadhaar_number: Joi.string()
                .pattern(/^[0-9]{12}$/)
                .required()
                .messages({
                    "string.pattern.base": "Aadhaar number must be a 12-digit numeric string.",
                    "any.required": "Aadhaar number is required.",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateOtpVerification = (req, res, next) => {
    try {
      const schema = Joi.object({
        otp: Joi.string()
          .length(6)
          .pattern(/^[0-9]+$/)
          .required()
          .messages({
            "string.length": "OTP must be exactly 6 digits.",
            "string.pattern.base": "OTP must contain only numeric characters.",
            "any.required": "OTP is required.",
          }),

          ref_id: Joi.number()
          .required()
          .messages({
            "any.required": "Corporate ref ID is required.",

          }),
      });

      const result = schema.validate(req.body);
      if (result.error) {
        throw new Error(result.error.details[0].message);
      }

      next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

// ─── Domain & Hosting Payment Validation ────────────────────────────────────

exports.validateDomainHostingPayment = (req, res, next) => {
    try {
        const domainEntrySchema = Joi.object({
            ns: Joi.array().items(Joi.string()).min(2).max(13).optional().messages({
                'array.base': 'ns must be an array of nameserver strings',
                'array.min': 'At least 2 nameservers are required',
                'array.max': 'Maximum 13 nameservers are allowed',
            }),
            regContactId: Joi.string().optional(),
            adminContactId: Joi.string().optional(),
            techContactId: Joi.string().optional(),
            billingContactId: Joi.string().optional(),
            years: Joi.number().integer().min(1).max(10).optional().messages({
                'number.min': 'years must be between 1 and 10',
                'number.max': 'years must be between 1 and 10',
                'number.integer': 'years must be an integer',
            }),
            purchasePrivacyProtection: Joi.boolean().optional(),
            discountAmount: Joi.number().min(0).optional(),
            attrs: Joi.object().optional(),
        });

        const schema = Joi.object({
            amount: Joi.number().greater(0).required().messages({
                'number.base': 'amount must be a number',
                'number.greater': 'amount must be greater than 0',
                'any.required': 'amount is required',
            }),
            customerId: Joi.string().required().messages({
                'any.required': 'customerId is required',
                'string.base': 'customerId must be a string',
            }),
            cartId: Joi.number().integer().required().messages({
                'any.required': 'cartId is required',
                'number.base': 'cartId must be a number',
            }),
            pocName: Joi.string().allow('').optional(),
            email: Joi.string().email().allow('').optional().messages({
                'string.email': 'email must be a valid email address',
            }),
            payCashback: Joi.boolean().optional(),
            invoiceOption: Joi.string().valid('NoInvoice', 'PayInvoice', 'KeepInvoice').optional().messages({
                'any.only': 'invoiceOption must be one of: NoInvoice, PayInvoice, KeepInvoice',
            }),
            autoRenew: Joi.boolean().optional(),
            domainDetails: Joi.object().pattern(Joi.string(), domainEntrySchema).optional(),
            // Payment gateway fields (only one should be present at a time)
            razorPay: Joi.any().optional(),
            razorPayAmount: Joi.number().optional(),
            paymentGatewayResponse: Joi.any().optional(),
            pgAmount: Joi.number().optional(),
            paytmResponse: Joi.any().optional(),
            paytmAmount: Joi.number().optional(),
            pageAddress: Joi.string().optional(),
        });

        const result = schema.validate(req.body, { abortEarly: true });
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
        next();
    } catch (error) {
        next(error);
    }
};


/// ------------------- Invoicing V2 --------------------- ///

exports.validateManualPayment = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.number().required()
                .messages({
                    'number.base': 'Amount must be a number.',
                    'any.required': 'Amount is required.',
                }),
            paymentMethod: Joi.string().required()
                .messages({
                    'string.empty': 'Payment method cannot be empty.',
                    'any.required': 'Payment method is required.',
                }),
            paymentDate: Joi.string().isoDate().required()
                .messages({
                    'string.isoDate': 'Payment date must be a valid date (YYYY-MM-DD).',
                    'any.required': 'Payment date is required.',
                }),
            referenceId: Joi.string().allow('', null).optional(),
            notes: Joi.string().allow('', null).optional(),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateUpdateCreditNoteStatus = (req, res, next) => {
    try {
        const schema = Joi.object({
            status: Joi.string()
                .valid('PENDING', 'REFUNDED')
                .required()
                .messages({
                    'any.only': 'status must be PENDING or REFUNDED.',
                    'any.required': 'status is required.',
                }),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateGetAllInvoices = (req, res, next) => {
    try {
        const schema = Joi.object({
            from: Joi.string().isoDate().allow('', null).optional()
                .messages({ 'string.isoDate': 'from must be a valid date (YYYY-MM-DD).' }),
            to: Joi.string().isoDate().allow('', null).optional()
                .messages({ 'string.isoDate': 'to must be a valid date (YYYY-MM-DD).' }),
            searchText: Joi.string().allow('', null).optional(),
            page: Joi.number().integer().min(1).allow(null).optional()
                .messages({ 'number.min': 'page must be at least 1.' }),
            itemsPerPage: Joi.number().integer().min(1).allow(null).optional()
                .messages({ 'number.min': 'itemsPerPage must be at least 1.' }),
            sort: Joi.string().valid('ASC', 'DESC').allow('', null).optional()
                .messages({ 'any.only': 'sort must be ASC or DESC.' }),
            sortField: Joi.string().allow('', null).optional(),
            status: Joi.string().allow('', null).optional(),
            documentType: Joi.string().valid('INVOICE', 'SALES_ORDER', 'QUOTATION', 'CREDIT_NOTE').allow('', null).optional()
                .messages({ 'any.only': 'documentType must be one of INVOICE, SALES_ORDER, QUOTATION, CREDIT_NOTE.' }),
            customerId: Joi.number().integer().min(1).allow(null).optional()
                .messages({ 'number.base': 'customerId must be a number.', 'number.integer': 'customerId must be an integer.', 'number.min': 'customerId must be a positive integer.' }),
            invoiceType: Joi.string().valid('DOMESTIC', 'INTERNATIONAL').allow('', null).optional()
                .messages({ 'any.only': 'invoiceType must be one of DOMESTIC, INTERNATIONAL.' }),
            hasEInvoice: Joi.boolean().truthy('true').falsy('false').optional(),
            linkedInvoiceId: Joi.number().integer().min(1).allow(null).optional()
                .messages({ 'number.base': 'linkedInvoiceId must be a number.', 'number.integer': 'linkedInvoiceId must be an integer.', 'number.min': 'linkedInvoiceId must be a positive integer.' }),
        });

        const result = schema.validate(req.query);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateGetAllCustomers = (req, res, next) => {
    try {
        const schema = Joi.object({
            searchText: Joi.string().allow('', null).optional(),
            page: Joi.number().integer().min(1).allow(null).optional()
                .messages({ 'number.min': 'page must be at least 1.' }),
            itemsPerPage: Joi.number().integer().min(1).allow(null).optional()
                .messages({ 'number.min': 'itemsPerPage must be at least 1.' }),
            sort: Joi.string().valid('ASC', 'DESC').allow('', null).optional()
                .messages({ 'any.only': 'sort must be ASC or DESC.' }),
            sortField: Joi.string().allow('', null).optional(),
            status: Joi.string().valid('Active', 'Inactive').allow('', null).optional()
                .messages({ 'any.only': 'status must be ACTIVE or INACTIVE.' }),
            startDate: Joi.string().isoDate().allow('', null).optional()
                .messages({ 'string.isoDate': 'startDate must be a valid date (YYYY-MM-DD).' }),
            endDate: Joi.string().isoDate().allow('', null).optional()
                .messages({ 'string.isoDate': 'endDate must be a valid date (YYYY-MM-DD).' }),
        });

        const result = schema.validate(req.query);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateInvoiceCreateV2 = (req, res, next) => {
    try {
        const isCreditNote = req.body.documentType === 'CREDIT_NOTE';
        const schema = Joi.object({
            invoiceType: Joi.string().valid('DOMESTIC', 'INTERNATIONAL').when('documentType', {
                is: 'CREDIT_NOTE',
                then: Joi.optional().allow(null, ''),
                otherwise: Joi.required().messages({ 'any.only': 'Invoice type must be either DOMESTIC or INTERNATIONAL.', 'any.required': 'Invoice type is required.' }),
            }),

            taxType: Joi.string()
                .valid('Intra-State', 'Inter-State')
                .optional()
                .allow(null, '')
                .messages({
                    'any.only': 'Tax type must be either Intra-State or Inter-State.',
                }),

            // Cash sale: a walk-in customer with no record — relaxes every buyer field below to optional
            isCashSale: Joi.boolean().optional(),

            // Buyer details
            customerId: Joi.number().integer().optional().allow(null),
            name: Joi.string().when('isCashSale', {
                is: true,
                then: Joi.string().allow('', null).optional(),
                otherwise: Joi.string().required().messages({
                    'string.base': 'Buyer name must be a string.',
                    'string.empty': 'Buyer name cannot be empty.',
                    'any.required': 'Buyer name is required.',
                }),
            }),
            gstNumber: Joi.string().allow('', null).optional(),
            address: Joi.string().when('isCashSale', {
                is: true,
                then: Joi.string().allow('', null).optional(),
                otherwise: Joi.string().required().messages({
                    'string.base': 'Address must be a string.',
                    'string.empty': 'Address cannot be empty.',
                    'any.required': 'Address is required.',
                }),
            }),
            city: Joi.string().when('isCashSale', {
                is: true,
                then: Joi.string().allow('', null).optional(),
                otherwise: Joi.string().required().messages({
                    'string.base': 'City must be a string.',
                    'string.empty': 'City cannot be empty.',
                    'any.required': 'City is required.',
                }),
            }),
            state: Joi.string().when('isCashSale', {
                is: true,
                then: Joi.string().allow('', null).optional(),
                otherwise: Joi.string().required().messages({
                    'string.base': 'State must be a string.',
                    'string.empty': 'State cannot be empty.',
                    'any.required': 'State is required.',
                }),
            }),
            pincode: Joi.string().when('isCashSale', {
                is: true,
                then: Joi.string().allow('', null).optional(),
                otherwise: Joi.string().when('invoiceType', {
                    is: 'DOMESTIC',
                    then: Joi.string().required().messages({
                        'string.base': 'Pincode must be a string.',
                        'string.empty': 'Pincode cannot be empty.',
                        'any.required': 'Pincode is required for domestic invoices.',
                    }),
                    otherwise: Joi.string().allow('', null).optional(),
                }),
            }),
            country: Joi.string().when('isCashSale', {
                is: true,
                then: Joi.string().allow('', null).optional(),
                otherwise: Joi.string().when('invoiceType', {
                    is: 'INTERNATIONAL',
                    then: Joi.string().required().messages({
                        'string.base': 'Country must be a string.',
                        'string.empty': 'Country cannot be empty.',
                        'any.required': 'Country is required for international invoices.',
                    }),
                    otherwise: Joi.string().allow('', null).optional(),
                }),
            }),
            email: Joi.string().email().allow('', null).optional()
                .messages({
                    'string.email': 'Buyer email must be a valid email address.',
                }),
            phoneNumber: Joi.string().when('isCashSale', {
                is: true,
                then: Joi.string().allow('', null).optional(),
                otherwise: Joi.string().required().messages({
                    'string.base': 'Phone number must be a string.',
                    'string.empty': 'Phone number cannot be empty.',
                    'any.required': 'Phone number is required.',
                }),
            }),

            // Document type
            documentType: Joi.string().valid('INVOICE', 'SALES_ORDER', 'QUOTATION', 'CREDIT_NOTE').optional()
                .messages({ 'any.only': 'documentType must be one of INVOICE, SALES_ORDER, QUOTATION, CREDIT_NOTE.' }),

            // Quotation conversion field
            fromQuotationId: Joi.number().integer().optional().allow(null),

            // Credit note fields
            linkedInvoiceId: Joi.number().integer().when('documentType', {
                is: 'CREDIT_NOTE',
                then: Joi.required().messages({ 'any.required': 'Linked invoice is required.' }),
                otherwise: Joi.optional().allow(null),
            }),
            reason: Joi.string().valid('GOODS_RETURNED', 'OVERCHARGE', 'SERVICE_CANCELLED', 'DISCOUNT', 'OTHER').when('documentType', {
                is: 'CREDIT_NOTE',
                then: Joi.required().messages({ 'any.required': 'Reason is required.' }),
                otherwise: Joi.optional().allow(null, ''),
            }),
            additionalDetails: Joi.string().max(80).allow('', null).optional(),

            // Invoice details
            prefix: Joi.string().max(20).required()
                .messages({
                    'string.empty': 'Prefix cannot be empty.',
                    'string.max': 'Prefix must be at most 20 characters.',
                    'any.required': 'Prefix is required.',
                }),
            invoiceNumber: Joi.string().required()
                .messages({
                    'string.base': 'Invoice number must be a string.',
                    'string.empty': 'Invoice number cannot be empty.',
                    'any.required': 'Invoice number is required.',
                }),
            currency: Joi.string().when('invoiceType', {
                is: 'INTERNATIONAL',
                then: Joi.string().required().messages({
                    'string.base': 'Currency must be a string.',
                    'string.empty': 'Currency cannot be empty.',
                    'any.required': 'Currency is required for international invoices.',
                }),
                otherwise: Joi.string().allow('', null).optional(),
            }),
            // Required only when billing in a foreign currency — matches Peko-AE's conversionRate pattern.
            conversionRate: Joi.number().when('currency', {
                is: Joi.string().invalid('INR', '', null).required(),
                then: Joi.number().greater(0).required().messages({
                    'number.base': 'Exchange rate must be a number.',
                    'number.greater': 'Exchange rate must be greater than 0.',
                    'any.required': 'Exchange rate is required for foreign currency invoices.',
                }),
                otherwise: Joi.number().allow(null).optional(),
            }),
            invoiceDate: Joi.string().isoDate().required()
                .messages({
                    'string.isoDate': 'Invoice date must be a valid date.',
                    'any.required': 'Invoice date is required.',
                }),
            dueDate: Joi.string().isoDate().required()
                .messages({
                    'string.isoDate': 'Due date must be a valid date.',
                    'any.required': 'Due date is required.',
                }),
            dateOfSupply: Joi.string().isoDate().allow('', null).optional()
                .messages({
                    'string.isoDate': 'Date of supply must be a valid date.',
                }),

            // Items
            items: Joi.array()
                .items(
                    Joi.object({
                        name: Joi.string().required()
                            .messages({
                                'any.required': 'Item name is required.',
                            }),
                        hsn: Joi.string().allow('', null).optional()
                            .messages({
                                'string.base': 'HSN must be a string.',
                            }),
                        quantity: Joi.number().required()
                            .messages({
                                'number.base': 'Quantity must be a number.',
                                'any.required': 'Quantity is required.',
                            }),
                        unit: Joi.string().required()
                            .messages({
                                'string.base': 'Unit must be a string.',
                                'string.empty': 'Unit cannot be empty.',
                                'any.required': 'Unit is required.',
                            }),
                        unitPrice: Joi.number().required()
                            .messages({
                                'number.base': 'Unit price must be a number.',
                                'any.required': 'Unit price is required.',
                            }),
                        discount: Joi.number().allow(null).optional(),
                        // International line items use 'EXPORT_0'/'EXEMPTED' instead of a GST%.
                        taxRate: Joi.alternatives().try(Joi.number(), Joi.string().valid('EXPORT_0', 'EXEMPTED')).required()
                            .messages({
                                'alternatives.match': 'Tax rate must be a number or a valid export tax code.',
                                'any.required': 'Tax rate is required.',
                            }),
                        netAmount: Joi.number().required()
                            .messages({
                                'number.base': 'Net amount must be a number.',
                                'any.required': 'Net amount is required.',
                            }),
                        productId: Joi.string().allow('', null).optional(),
                        taxMode: Joi.string().valid('Exclusive', 'Inclusive').optional(),
                        itemId: Joi.string().allow('', null).optional(),
                    })
                )
                .min(1)
                .required()
                .messages({
                    'array.min': 'At least one item is required.',
                    'any.required': 'Items are required.',
                }),

            // Financial summary
            subtotal: Joi.number().required()
                .messages({
                    'number.base': 'Subtotal must be a number.',
                    'any.required': 'Subtotal is required.',
                }),
            tax: Joi.number().required()
                .messages({
                    'number.base': 'Tax must be a number.',
                    'any.required': 'Tax is required.',
                }),
            discount: Joi.number().required()
                .messages({
                    'number.base': 'Discount must be a number.',
                    'any.required': 'Discount is required.',
                }),
            shippingCost: Joi.number().allow('', null).optional(),
            totalAmount: Joi.number().required()
                .messages({
                    'number.base': 'Total amount must be a number.',
                    'any.required': 'Total amount is required.',
                }),
            amountPaid: Joi.number().allow('', null).optional(),

            // Save customer
            saveCustomer: Joi.boolean().optional(),

            autoUpdateDocumentNumber: Joi.boolean().optional(),

            // Additional
            paymentMode: Joi.string().required()
                .messages({
                    'string.base': 'Payment mode must be a string.',
                    'string.empty': 'Payment mode cannot be empty.',
                    'any.required': 'Payment mode is required.',
                }),
            termsAndConditions: Joi.string().allow('', null).optional(),
            notes: Joi.string().allow('', null).optional(),
        });

        const result = schema.validate(req.body);

        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

/// ------------------- Invoicing V2 Reminder Settings --------------------- ///
exports.validateReminderSettings = (req, res, next) => {
    try {
        const schema = Joi.object({
            reminders: Joi.array().items(
                Joi.object({
                    reminderInterval: Joi.number().integer().min(1).required()
                        .messages({
                            'number.base': 'reminderInterval must be a number.',
                            'number.integer': 'reminderInterval must be an integer.',
                            'number.min': 'reminderInterval must be at least 1.',
                            'any.required': 'reminderInterval is required.',
                        }),
                    sendSMS: Joi.boolean().optional()
                        .messages({ 'boolean.base': 'sendSMS must be a boolean.' }),
                    sendEmail: Joi.boolean().optional()
                        .messages({ 'boolean.base': 'sendEmail must be a boolean.' }),
                })
            ).allow(null).optional(),
        });

        const result = schema.validate(req.body);

        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateUpdateInvoiceStatus = (req, res, next) => {
    try {
        const schema = Joi.object({
            status: Joi.string()
                .valid('COMPLETED', 'PAID')
                .required()
                .messages({
                    'any.only': 'status must be COMPLETED or PAID.',
                    'any.required': 'status is required.',
                }),
        });

        const result = schema.validate(req.body);

        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};


/// ------------------- Invoice Customer V2 --------------------- ///
exports.validateCreateCustomerV2 = (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required()
                .messages({
                    'string.base': 'Name must be a string.',
                    'string.empty': 'Name cannot be empty.',
                    'any.required': 'Name is required.',
                }),
            email: Joi.string().email({ tlds: { allow: false } }).allow('', null).optional()
                .messages({
                    'string.base': 'Email must be a string.',
                    'string.email': 'Email must be a valid email address.',
                }),
            phoneNumber: Joi.string().allow('', null).optional(),
            gstin: Joi.string().allow('', null).optional(),
            upiId: Joi.string().allow('', null).optional(),
            personOfContact: Joi.string().allow('', null).optional(),
            notes: Joi.string().allow('', null).optional(),
            currency: Joi.string().length(3).uppercase().allow('', null).optional()
                .messages({
                    'string.length': 'Currency must be a 3-letter currency code.',
                }),

            // Primary Address
            primaryAddress: Joi.string().required()
                .messages({
                    'string.base': 'Primary address must be a string.',
                    'string.empty': 'Primary address cannot be empty.',
                    'any.required': 'Primary address is required.',
                }),
            primaryCity: Joi.string().required()
                .messages({
                    'string.base': 'Primary city must be a string.',
                    'string.empty': 'Primary city cannot be empty.',
                    'any.required': 'Primary city is required.',
                }),
            primaryState: Joi.string().required()
                .messages({
                    'string.base': 'Primary state must be a string.',
                    'string.empty': 'Primary state cannot be empty.',
                    'any.required': 'Primary state is required.',
                }),
            primaryPincode: Joi.string().required()
                .messages({
                    'string.base': 'Primary pincode must be a string.',
                    'string.empty': 'Primary pincode cannot be empty.',
                    'any.required': 'Primary pincode is required.',
                }),
            primaryCountry: Joi.string().required()
                .messages({
                    'string.base': 'Primary country must be a string.',
                    'string.empty': 'Primary country cannot be empty.',
                    'any.required': 'Primary country is required.',
                }),

            // Shipping Address
            shippingAddress: Joi.string().allow('', null).optional(),
            shippingCity: Joi.string().allow('', null).optional(),
            shippingState: Joi.string().allow('', null).optional(),
            shippingPincode: Joi.string().allow('', null).optional(),
            shippingCountry: Joi.string().allow('', null).optional(),

            // Bank Details (optional)
            bankDetails: Joi.array().items(
                Joi.object({
                    accountHolderName: Joi.string().required()
                        .messages({
                            'any.required': 'Account holder name is required.',
                        }),
                    accountNumber: Joi.string().required()
                        .messages({
                            'any.required': 'Account number is required.',
                        }),
                    ifscCode: Joi.string().required()
                        .messages({
                            'any.required': 'IFSC code is required.',
                        }),
                    swiftCode: Joi.string().allow('', null).optional(),
                    iban: Joi.string().allow('', null).optional(),
                    verified: Joi.boolean().optional(),
                    verifyToken: Joi.string().allow('', null).optional(),
                })
            ).optional(),
        });

        const result = schema.validate(req.body);

        if (result.error) {
            throw new Error(result.error.details[0].message);
        }

        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.validateDirectBankVerification = (req, res, next) => {
    try {
        const schema = Joi.object({
            bank_account: Joi.string()
                .pattern(/^\d{9,18}$/)
                .required()
                .messages({
                    "string.pattern.base": "Bank account number must be 9 to 18 digits.",
                    "any.required": "Bank account number is required.",
                }),
            ifsc: Joi.string()
                .length(11)
                .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
                .required()
                .messages({
                    "string.length": "IFSC code must be 11 characters long.",
                    "string.pattern.base": "Invalid IFSC code format.",
                    "any.required": "IFSC code is required.",
                }),
            name: Joi.string()
                .min(2)
                .max(100)
                .required()
                .messages({
                    "string.min": "Name must be at least 2 characters.",
                    "string.max": "Name must be at most 100 characters.",
                    "any.required": "Account holder name is required.",
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

/// ------------------- Invoice Settings V2 --------------------- ///

exports.validateUpdateReminderRule = (req, res, next) => {
    try {
        const templateSchema = Joi.object({
            subject: Joi.string().allow('', null).optional(),
            body: Joi.string().allow('', null).optional(),
        });

        const schema = Joi.object({
            enabled: Joi.boolean().optional()
                .messages({ 'boolean.base': 'enabled must be a boolean.' }),
            days: Joi.number().integer().min(0).optional()
                .messages({ 'number.base': 'days must be a number.', 'number.min': 'days must be 0 or greater.' }),
            sendEmail: Joi.boolean().optional()
                .messages({ 'boolean.base': 'sendEmail must be a boolean.' }),
            sendWhatsApp: Joi.boolean().optional()
                .messages({ 'boolean.base': 'sendWhatsApp must be a boolean.' }),
            emailTemplate: templateSchema.allow(null).optional(),
            whatsappTemplate: Joi.object({
                body: Joi.string().allow('', null).optional(),
            }).allow(null).optional(),
        });

        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        next(err);
    }
};

exports.validateToggleAutomaticReminders = (req, res, next) => {
    try {
        const schema = Joi.object({
            automaticReminders: Joi.boolean().required()
                .messages({
                    'boolean.base': 'automaticReminders must be a boolean.',
                    'any.required': 'automaticReminders is required.',
                }),
        });

        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        next(err);
    }
};

exports.validateInvoiceSettings = (req, res, next) => {
    try {
        const fileSchema = Joi.object({
            file: Joi.string().allow('', null).optional(),
            format: Joi.string().valid('png', 'jpg', 'jpeg', 'svg').allow(null).optional()
                .messages({ 'any.only': 'Format must be one of png, jpg, jpeg, svg.' }),
        });

        const schema = Joi.object({
            signature: fileSchema.allow(null).optional(),
            removeSignature: Joi.boolean().optional(),

            // Global document settings (shared across all document types)
            autoUpdateDocumentNumber: Joi.boolean().optional()
                .messages({ 'boolean.base': 'autoUpdateDocumentNumber must be a boolean.' }),
            autoAddToCatalog: Joi.boolean().optional()
                .messages({ 'boolean.base': 'autoAddToCatalog must be a boolean.' }),
            gstPercent: Joi.string().allow('', null).optional(),
            currency: Joi.string().allow('', null).optional(),
            paymentMode: Joi.string().allow('', null).optional(),
            defaultDueDays: Joi.number().integer().min(1).max(365).allow(null).optional(),
            termsAndConditions: Joi.string().allow('', null).optional(),
            notes: Joi.string().allow('', null).optional(),

            // Per document type — array of { type, prefix }
            documentPrefixes: Joi.array().items(
                Joi.object({
                    type: Joi.string()
                        .valid('INVOICE', 'SALES_ORDER', 'QUOTATION', 'AGREEMENT', 'CREDIT_NOTE')
                        .required()
                        .messages({
                            'any.only': 'type must be one of INVOICE, SALES_ORDER, QUOTATION, AGREEMENT, CREDIT_NOTE.',
                            'any.required': 'type is required.',
                        }),
                    prefix: Joi.string().max(20).required()
                        .messages({
                            'string.empty': 'Prefix cannot be empty.',
                            'string.max': 'Prefix must be at most 20 characters.',
                            'any.required': 'Prefix is required.',
                        }),
                })
            ).optional(),

            // Invoice template selection
            templateSettings: Joi.object({
                templateId: Joi.number().integer().required(),
            }).allow(null).optional(),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

// ─── Domain & Hosting Payment Validation ────────────────────────────────────

exports.validateDomainHostingPayment = (req, res, next) => {
    try {
        const domainEntrySchema = Joi.object({
            ns: Joi.array().items(Joi.string()).min(2).max(13).optional().messages({
                'array.base': 'ns must be an array of nameserver strings',
                'array.min': 'At least 2 nameservers are required',
                'array.max': 'Maximum 13 nameservers are allowed',
            }),
            regContactId: Joi.string().optional(),
            adminContactId: Joi.string().optional(),
            techContactId: Joi.string().optional(),
            billingContactId: Joi.string().optional(),
            years: Joi.number().integer().min(1).max(10).optional().messages({
                'number.min': 'years must be between 1 and 10',
                'number.max': 'years must be between 1 and 10',
                'number.integer': 'years must be an integer',
            }),
            purchasePrivacyProtection: Joi.boolean().optional(),
            discountAmount: Joi.number().min(0).optional(),
            attrs: Joi.object().optional(),
        });

        const schema = Joi.object({
            amount: Joi.number().greater(0).required().messages({
                'number.base': 'amount must be a number',
                'number.greater': 'amount must be greater than 0',
                'any.required': 'amount is required',
            }),
            customerId: Joi.string().required().messages({
                'any.required': 'customerId is required',
                'string.base': 'customerId must be a string',
            }),
            cartId: Joi.number().integer().required().messages({
                'any.required': 'cartId is required',
                'number.base': 'cartId must be a number',
            }),
            pocName: Joi.string().allow('').optional(),
            email: Joi.string().email().allow('').optional().messages({
                'string.email': 'email must be a valid email address',
            }),
            payCashback: Joi.boolean().optional(),
            invoiceOption: Joi.string().valid('NoInvoice', 'PayInvoice', 'KeepInvoice').optional().messages({
                'any.only': 'invoiceOption must be one of: NoInvoice, PayInvoice, KeepInvoice',
            }),
            autoRenew: Joi.boolean().optional(),
            domainDetails: Joi.object().pattern(Joi.string(), domainEntrySchema).optional(),
            // Payment gateway fields (only one should be present at a time)
            razorPay: Joi.any().optional(),
            razorPayAmount: Joi.number().optional(),
            paymentGatewayResponse: Joi.any().optional(),
            pgAmount: Joi.number().optional(),
            paytmResponse: Joi.any().optional(),
            paytmAmount: Joi.number().optional(),
            pageAddress: Joi.string().optional(),
        });

        const result = schema.validate(req.body, { abortEarly: true });
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
        next();
    } catch (error) {
        next(error);
    }
};


/// ------------------- Agreement --------------------- ///

exports.validateCreateAgreement = (req, res, next) => {
    try {
        const schema = Joi.object({
            customerId: Joi.number().integer().required()
                .messages({
                    'number.base': 'Customer ID must be a number.',
                    'any.required': 'Customer ID is required.',
                }),
            quotationId: Joi.number().integer().allow(null).optional()
                .messages({
                    'number.base': 'Quotation ID must be a number.',
                }),
            agreementNumber: Joi.string().optional(),
            prefix: Joi.string().max(20).optional(),
            title: Joi.string().required()
                .messages({
                    'string.empty': 'Agreement title cannot be empty.',
                    'any.required': 'Agreement title is required.',
                }),
            contractType: Joi.string().required()
                .messages({
                    'string.empty': 'Contract type cannot be empty.',
                    'any.required': 'Contract type is required.',
                }),
            currency: Joi.string().required()
                .messages({
                    'string.empty': 'Currency cannot be empty.',
                    'any.required': 'Currency is required.',
                }),
            paymentTerms: Joi.string().allow(null, '').optional(),
            billingFrequency: Joi.string().allow(null, '').optional(),
            contractValue: Joi.number().allow(null).optional()
                .messages({
                    'number.base': 'Contract value must be a number.',
                }),
            startDate: Joi.string().isoDate().required()
                .messages({
                    'string.isoDate': 'Start date must be a valid date.',
                    'any.required': 'Start date is required.',
                }),
            endDate: Joi.string().isoDate().allow(null, '').optional()
                .messages({
                    'string.isoDate': 'End date must be a valid date.',
                }),
            description: Joi.string().allow(null, '').optional(),
            specialTerms: Joi.string().allow(null, '').optional(),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateUploadAgreementDocument = (req, res, next) => {
    try {
        const schema = Joi.object({
            documentBase64: Joi.string().required().messages({
                'any.required': 'documentBase64 is required.',
                'string.empty': 'documentBase64 cannot be empty.',
            }),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateGetAllAgreements = (req, res, next) => {
    try {
        const schema = Joi.object({
            from: Joi.string().isoDate().optional()
                .messages({ 'string.isoDate': 'From date must be a valid ISO date.' }),
            to: Joi.string().isoDate().optional()
                .messages({ 'string.isoDate': 'To date must be a valid ISO date.' }),
            searchText: Joi.string().allow('').optional(),
            page: Joi.number().integer().min(1).optional()
                .messages({ 'number.base': 'Page must be a number.', 'number.min': 'Page must be at least 1.' }),
            itemsPerPage: Joi.number().integer().min(1).optional()
                .messages({ 'number.base': 'Items per page must be a number.', 'number.min': 'Items per page must be at least 1.' }),
            status: Joi.string().allow('').optional(),
            sort: Joi.string().valid('ASC', 'DESC').optional()
                .messages({ 'any.only': 'Sort must be either ASC or DESC.' }),
            sortField: Joi.string().optional(),
            customerId: Joi.number().integer().optional()
                .messages({ 'number.base': 'Customer ID must be a number.' }),
        });

        const result = schema.validate(req.query);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
        next();
    } catch (err) {
        console.error(err);
        return res.status(400).json({ status: false, message: err.message, responseCode: '400' });
    }
};


/// ------------------- E-Invoice --------------------- ///

exports.validateGenerateIRN = (req, res, next) => {
    try {
        const itemSchema = Joi.object({
            description: Joi.string().required().messages({ 'any.required': 'lineItem description is required.' }),
            hsnCode: Joi.string().required().messages({ 'any.required': 'lineItem hsnCode is required.' }),
            quantity: Joi.number().greater(0).required().messages({
                'any.required': 'lineItem quantity is required.',
                'number.greater': 'lineItem quantity must be greater than 0.',
            }),
            unitPrice: Joi.number().min(0).required().messages({
                'any.required': 'lineItem unitPrice is required.',
                'number.min': 'lineItem unitPrice must be 0 or greater.',
            }),
            unit: Joi.string().required().messages({ 'any.required': 'lineItem unit is required.' }),
            gstRate: Joi.number().min(0).required().messages({
                'any.required': 'lineItem gstRate is required.',
                'number.min': 'lineItem gstRate must be 0 or greater.',
            }),
            discount: Joi.number().min(0).optional().default(0),
            cessAmount: Joi.number().min(0).optional().default(0),
            otherCharges: Joi.number().min(0).optional().default(0),
        }).unknown(true);

        const sellerSchema = Joi.object({
            gstin: Joi.string().required().messages({ 'any.required': 'sellerDetails.gstin is required.' }),
            legalName: Joi.string().required().messages({ 'any.required': 'sellerDetails.legalName is required.' }),
            tradeName: Joi.string().allow('', null).optional(),
            addr1: Joi.string().required().messages({ 'any.required': 'sellerDetails.addr1 is required.' }),
            location: Joi.string().required().messages({ 'any.required': 'sellerDetails.location is required.' }),
            pin: Joi.alternatives().try(Joi.string(), Joi.number()).required().messages({ 'any.required': 'sellerDetails.pin is required.' }),
            stateCode: Joi.string().required().messages({ 'any.required': 'sellerDetails.stateCode is required.' }),
        }).unknown(true);

        const buyerSchema = Joi.object({
            gstin: Joi.string().allow('', null).optional(),
            legalName: Joi.string().required().messages({ 'any.required': 'buyerDetails.legalName is required.' }),
            tradeName: Joi.string().allow('', null).optional(),
            addr1: Joi.string().required().messages({ 'any.required': 'buyerDetails.addr1 is required.' }),
            location: Joi.string().required().messages({ 'any.required': 'buyerDetails.location is required.' }),
            pin: Joi.alternatives().try(Joi.string(), Joi.number()).required().messages({ 'any.required': 'buyerDetails.pin is required.' }),
            stateCode: Joi.string().required().messages({ 'any.required': 'buyerDetails.stateCode is required.' }),
            phoneNumber: Joi.string().allow('', null).optional(),
        }).unknown(true);

        const schema = Joi.object({
            supplyType: Joi.string().valid('B2B', 'B2C', 'SEZWP', 'SEZWOP', 'EXPWP', 'EXPWOP', 'DEXP').required()
                .messages({
                    'any.required': 'supplyType is required.',
                    'any.only': 'supplyType must be one of: B2B, B2C, SEZWP, SEZWOP, EXPWP, EXPWOP, DEXP.',
                }),
            docType: Joi.string().valid('INV', 'CRN', 'DBN').required()
                .messages({
                    'any.required': 'docType is required.',
                    'any.only': 'docType must be one of: INV, CRN, DBN.',
                }),
            docNo: Joi.string().required().messages({ 'any.required': 'docNo is required.' }),
            docDate: Joi.string().required().messages({ 'any.required': 'docDate is required.' }),
            placeOfSupply: Joi.string().required().messages({ 'any.required': 'placeOfSupply is required.' }),
            reverseCharge: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
            igstOnIntraState: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
            prefix: Joi.string().allow('', null).optional(),
            sellerDetails: sellerSchema.required().messages({ 'any.required': 'sellerDetails is required.' }),
            buyerDetails: buyerSchema.required().messages({ 'any.required': 'buyerDetails is required.' }),
            lineItems: Joi.array().items(itemSchema).min(1).required()
                .messages({
                    'any.required': 'lineItems is required.',
                    'array.min': 'lineItems must contain at least one item.',
                }),
            invoiceId: Joi.number().integer().optional().allow(null),
            customerId: Joi.number().integer().optional().allow(null),
        }).unknown(true);

        const result = schema.validate(req.body, { abortEarly: true });
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateListEInvoices = (req, res, next) => {
    try {
        const schema = Joi.object({
            from: Joi.string().isoDate().allow('').optional()
                .messages({ 'string.isoDate': 'from must be a valid ISO date.' }),
            to: Joi.string().isoDate().allow('').optional()
                .messages({ 'string.isoDate': 'to must be a valid ISO date.' }),
            searchText: Joi.string().allow('').optional(),
            page: Joi.number().integer().min(1).optional()
                .messages({ 'number.base': 'page must be a number.', 'number.min': 'page must be at least 1.' }),
            itemsPerPage: Joi.number().integer().min(1).optional()
                .messages({ 'number.base': 'itemsPerPage must be a number.', 'number.min': 'itemsPerPage must be at least 1.' }),
            sort: Joi.string().valid('ASC', 'DESC').optional()
                .messages({ 'any.only': 'sort must be either ASC or DESC.' }),
            sortField: Joi.string().allow('').optional(),
            status: Joi.string().allow('').optional(),
            supplyType: Joi.string().allow('').optional(),
            hasEwaybill: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false')).optional(),
        });

        const result = schema.validate(req.query, { abortEarly: true });
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        return res.status(400).json({ status: false, message: err.message, responseCode: '400' });
    }
};

exports.validateGenerateEwaybill = (req, res, next) => {
    try {
        const schema = Joi.object({
            distance: Joi.number().integer().min(1).required()
                .messages({
                    'any.required': 'distance is required.',
                    'number.base': 'distance must be a number.',
                    'number.integer': 'distance must be a whole number.',
                    'number.min': 'distance must be at least 1.',
                }),
            transMode: Joi.string().valid('road', 'rail', 'air', 'ship').required()
                .messages({
                    'any.required': 'transMode is required.',
                    'any.only': 'transMode must be one of: road, rail, air, ship.',
                }),
            transId: Joi.string().allow('', null).optional(),
            transName: Joi.string().allow('', null).optional(),
            vehNo: Joi.when('transMode', {
                is: 'road',
                then: Joi.string().required().messages({ 'any.required': 'vehNo is required for road transport.' }),
                otherwise: Joi.string().allow('', null).optional(),
            }),
            vehType: Joi.when('transMode', {
                is: 'road',
                then: Joi.string().valid('regular', 'odc').optional()
                    .messages({ 'any.only': 'vehType must be one of: regular, odc.' }),
                otherwise: Joi.string().allow('', null).optional(),
            }),
            transDocNo: Joi.when('transMode', {
                is: Joi.valid('rail', 'air', 'ship'),
                then: Joi.string().required().messages({ 'any.required': 'transDocNo is required for rail/air/ship transport.' }),
                otherwise: Joi.string().allow('', null).optional(),
            }),
            transDocDt: Joi.when('transMode', {
                is: Joi.valid('rail', 'air', 'ship'),
                then: Joi.string().required().messages({ 'any.required': 'transDocDt is required for rail/air/ship transport.' }),
                otherwise: Joi.string().allow('', null).optional(),
            }),
        });

        const result = schema.validate(req.body, { abortEarly: true });
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateCancelIRN = (req, res, next) => {
    try {
        const schema = Joi.object({
            cancelReason: Joi.string().required()
                .messages({
                    'any.required': 'cancelReason is required.',
                    'string.base': 'cancelReason must be a string.',
                }),
            cancelRemark: Joi.string().allow('', null).optional(),
        });

        const result = schema.validate(req.body, { abortEarly: true });
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateCancelEwaybill = (req, res, next) => {
    try {
        const schema = Joi.object({
            cancelReason: Joi.string().required()
                .messages({
                    'any.required': 'cancelReason is required.',
                    'string.base': 'cancelReason must be a string.',
                }),
        });

        const result = schema.validate(req.body, { abortEarly: true });
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

/// ------------------- Tax & More --------------------- ///

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[0-9A-Z]{1}[0-9A-Z]{1}$/;
const FY_REGEX    = /^\d{4}-\d{2}$/;

exports.validateGstSetup = (req, res, next) => {
    try {
        const schema = Joi.object({
            gstin:         Joi.string().pattern(GSTIN_REGEX).uppercase().required().messages({ 'string.pattern.base': 'Invalid GSTIN format' }),
            financialYear: Joi.string().pattern(FY_REGEX).required().messages({ 'string.pattern.base': 'financialYear must be in format YYYY-YY e.g. 2024-25' }),
        });
        const { error } = schema.validate(req.body);
        if (error) throw new Error(error.details[0].message);
        next();
    } catch (err) {
        return res.status(400).json({ status: false, message: err.message, responseCode: '400' });
    }
};

exports.validateAddSalesInvoices = (req, res, next) => {
    try {
        const invoiceSchema = Joi.object({
            invoiceType:      Joi.string().valid('B2B', 'B2C', 'EXPORT', 'NIL', 'CDN', 'B2C_SMALL', 'CDNR', 'CDNUR', 'ADVANCE').default('B2B'),
            invoiceNo:        Joi.string().max(50).required(),
            invoiceDate:      Joi.string().required(),
            hsnCode:          Joi.string().max(8).optional().allow('', null),
            uqc:              Joi.string().max(10).optional().allow('', null),
            qty:              Joi.number().min(0).optional().default(0),
            buyerGstin:       Joi.string().pattern(GSTIN_REGEX).uppercase().optional().allow('', null).messages({ 'string.pattern.base': 'Invalid GSTIN format. Please enter a valid 15-character GSTIN.' }),
            buyerName:        Joi.string().optional().allow('', null),
            placeOfSupply:    Joi.string().optional().allow('', null),
            portCode:         Joi.string().max(10).uppercase().optional().allow('', null),
            shippingBillNo:   Joi.string().max(20).optional().allow('', null),
            shippingBillDate: Joi.string().optional().allow('', null),
            taxableAmount:    Joi.number().min(0).required(),
            igst:             Joi.number().min(0).default(0),
            cgst:             Joi.number().min(0).default(0),
            sgst:             Joi.number().min(0).default(0),
        });
        const schema = Joi.object({
            gstin:         Joi.string().pattern(GSTIN_REGEX).uppercase().required(),
            financialYear: Joi.string().pattern(FY_REGEX).required(),
            month:         Joi.number().integer().min(1).max(12).required(),
            invoices:      Joi.array().items(invoiceSchema).min(1).required(),
        });
        const { error } = schema.validate(req.body);
        if (error) throw new Error(error.details[0].message);
        next();
    } catch (err) {
        return res.status(400).json({ status: false, message: err.message, responseCode: '400' });
    }
};

exports.validateUpdateSalesInvoice = (req, res, next) => {
    try {
        const schema = Joi.object({
            invoiceType:      Joi.string().valid('B2B', 'B2C', 'EXPORT', 'NIL', 'CDN', 'B2C_SMALL', 'CDNR', 'CDNUR', 'ADVANCE').optional(),
            invoiceNo:        Joi.string().max(50).optional(),
            invoiceDate:      Joi.string().optional(),
            hsnCode:          Joi.string().max(8).optional().allow('', null),
            uqc:              Joi.string().max(10).optional().allow('', null),
            qty:              Joi.number().min(0).optional(),
            buyerGstin:       Joi.string().pattern(GSTIN_REGEX).uppercase().optional().allow('', null).messages({ 'string.pattern.base': 'Invalid GSTIN format. Please enter a valid 15-character GSTIN.' }),
            portCode:         Joi.string().max(10).uppercase().optional().allow('', null),
            shippingBillNo:   Joi.string().max(20).optional().allow('', null),
            shippingBillDate: Joi.string().optional().allow('', null),
            buyerName:      Joi.string().optional().allow('', null),
            placeOfSupply:  Joi.string().optional().allow('', null),
            taxableAmount: Joi.number().min(0).optional(),
            igst:          Joi.number().min(0).optional(),
            cgst:          Joi.number().min(0).optional(),
            sgst:          Joi.number().min(0).optional(),
        });
        const { error } = schema.validate(req.body);
        if (error) throw new Error(error.details[0].message);
        next();
    } catch (err) {
        return res.status(400).json({ status: false, message: err.message, responseCode: '400' });
    }
};

exports.validateSubmitImsReconciliation = (req, res, next) => {
    try {
        const schema = Joi.object({
            gstin:                  Joi.string().pattern(GSTIN_REGEX).uppercase().required(),
            financialYear:          Joi.string().pattern(FY_REGEX).required(),
            month:                  Joi.number().integer().min(1).max(12).required(),
            reconciliationCriteria: Joi.string().valid('strict', 'moderate', 'flexible').default('strict'),
        });
        const { error } = schema.validate(req.body);
        if (error) throw new Error(error.details[0].message);
        next();
    } catch (err) {
        return res.status(400).json({ status: false, message: err.message, responseCode: '400' });
    }
};

exports.validateImsAction = (req, res, next) => {
    try {
        const schema = Joi.object({
            imsAction: Joi.string().valid('accepted', 'rejected', 'pending', 'noaction').required(),
        });
        const { error } = schema.validate(req.body);
        if (error) throw new Error(error.details[0].message);
        next();
    } catch (err) {
        return res.status(400).json({ status: false, message: err.message, responseCode: '400' });
    }
};

exports.validateGstinSearch = (req, res, next) => {
    try {
        const schema = Joi.object({
            gstin: Joi.string().pattern(GSTIN_REGEX).uppercase().required().messages({ 'string.pattern.base': 'Invalid GSTIN format' }),
        });
        const { error } = schema.validate(req.body);
        if (error) throw new Error(error.details[0].message);
        next();
    } catch (err) {
        return res.status(400).json({ status: false, message: err.message, responseCode: '400' });
    }
};

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

exports.validateVerifyPan = (req, res, next) => {
    try {
        const schema = Joi.object({
            pan: Joi.string().pattern(PAN_REGEX).uppercase().required().messages({
                'string.pattern.base': 'Invalid PAN format. Expected format: ABCDE1234F',
                'any.required': 'PAN number is required',
            }),
            fullName: Joi.string().min(2).max(100).trim().required().messages({
                'string.min': 'Name must be at least 2 characters',
                'any.required': 'Full name is required',
            }),
            dob: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
                'string.pattern.base': 'Date of birth must be in YYYY-MM-DD format',
                'any.required': 'Date of birth is required',
            }),
            stateCode: Joi.string().trim().required().messages({
                'any.required': 'State code is required',
            }),
        });
        const { error } = schema.validate(req.body, { convert: true });
        if (error) throw new Error(error.details[0].message);
        req.body.pan = req.body.pan.toUpperCase();
        next();
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: 'validateVerifyPan: validation failed', body: req.body, error: err.message })
        return res.status(400).json({ status: false, message: err.message, responseCode: '400' });
    }
};

exports.validateGstrEvcOtp = (req, res, next) => {
    try {
        const schema = Joi.object({
            gstin:    Joi.string().pattern(GSTIN_REGEX).uppercase().required().messages({ 'string.pattern.base': 'Invalid GSTIN format' }),
            pan:      Joi.string().pattern(PAN_REGEX).uppercase().required().messages({ 'string.pattern.base': 'Invalid PAN format. Expected format: ABCDE1234F' }),
            gstrType: Joi.string().valid('gstr-1', 'gstr-3b', 'gstr-9').optional().default('gstr-1'),
        });
        const { error } = schema.validate(req.body, { convert: true });
        if (error) throw new Error(error.details[0].message);
        req.body.pan = req.body.pan.toUpperCase();
        next();
    } catch (err) {
        return res.status(400).json({ status: false, message: err.message, responseCode: '400' });
    }
};

exports.validateGstPortalOtp = (req, res, next) => {
    try {
        const schema = Joi.object({
            gstin:    Joi.string().pattern(GSTIN_REGEX).uppercase().required().messages({ 'string.pattern.base': 'Invalid GSTIN format' }),
            username: Joi.string().min(1).required().messages({ 'string.empty': 'GST portal username is required' }),
        });
        const { error } = schema.validate(req.body);
        if (error) throw new Error(error.details[0].message);
        next();
    } catch (err) {
        return res.status(400).json({ status: false, message: err.message, responseCode: '400' });
    }
};

exports.validateGstPortalAuth = (req, res, next) => {
    try {
        const schema = Joi.object({
            gstin:    Joi.string().pattern(GSTIN_REGEX).uppercase().required().messages({ 'string.pattern.base': 'Invalid GSTIN format' }),
            otp:      Joi.string().pattern(/^\d{6}$/).required().messages({ 'string.pattern.base': 'OTP must be exactly 6 digits' }),
            username: Joi.string().min(1).required().messages({ 'string.empty': 'GST portal username is required' }),
        });
        const { error } = schema.validate(req.body);
        if (error) throw new Error(error.details[0].message);
        next();
    } catch (err) {
        return res.status(400).json({ status: false, message: err.message, responseCode: '400' });
    }
};

exports.validateAddAmendments = (req, res, next) => {
    try {
        const amendSchema = Joi.object({
            amendType:     Joi.string().valid('B2BA', 'B2CLA', 'B2CSA', 'CDNRA', 'CDNURA', 'EXPA').required(),
            origInvNo:     Joi.string().max(50).required(),
            origPeriod:    Joi.string().pattern(/^\d{6}$/).required().messages({ 'string.pattern.base': 'origPeriod must be MMYYYY e.g. 102024' }),
            receiverGstin: Joi.string().pattern(GSTIN_REGEX).uppercase().optional().allow('', null),
            receiverName:  Joi.string().optional().allow('', null),
            revisedInvNo:  Joi.string().max(50).optional().allow('', null),
            revisedDate:   Joi.string().optional().allow('', null),
            taxableAmount: Joi.number().min(0).required(),
            igst:          Joi.number().min(0).default(0),
            cgst:          Joi.number().min(0).default(0),
            sgst:          Joi.number().min(0).default(0),
        });
        const schema = Joi.object({
            gstin:         Joi.string().pattern(GSTIN_REGEX).uppercase().required(),
            financialYear: Joi.string().pattern(FY_REGEX).required(),
            month:         Joi.number().integer().min(1).max(12).required(),
            amendments:    Joi.array().items(amendSchema).min(1).required(),
        });
        const { error } = schema.validate(req.body);
        if (error) throw new Error(error.details[0].message);
        next();
    } catch (err) {
        return res.status(400).json({ status: false, message: err.message, responseCode: '400' });
    }
};


/// ------------------- Legal Service --------------------- ///


exports.validateCreateLegalDocument = (req, res, next) => {
    try {
        const schema = Joi.object({
            title: Joi.string().required().trim()
                .messages({
                    'string.empty': 'Title cannot be empty.',
                    'any.required': 'Title is required.',
                }),
            editorHtml: Joi.string().optional().allow(null, ''),
        });

        const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            const messages = error.details.map(d => d.message).join(', ');
            throw new Error(messages);
        }
        req.validatedBody = value;
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateUpdateLegalDocument = (req, res, next) => {
    try {
        const schema = Joi.object({
            editorHtml: Joi.string().optional().allow(null, ''),
        });

        const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            const messages = error.details.map(d => d.message).join(', ');
            throw new Error(messages);
        }
        req.validatedBody = value;
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateGetLegalDocuments = (req, res, next) => {
    try {
        const schema = Joi.object({
            status: Joi.string().valid('DRAFT', 'SENT', 'SIGNED', 'All').optional()
                .messages({ 'any.only': 'Status must be one of: DRAFT, SENT, SIGNED, All.' }),
            searchText: Joi.string().allow('').optional(),
            limit: Joi.number().integer().min(1).optional()
                .messages({ 'number.base': 'Limit must be a number.', 'number.min': 'Limit must be at least 1.' }),
            page: Joi.number().integer().min(1).optional(),
        });

        const { error } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
        if (error) {
            const messages = error.details.map(d => d.message).join(', ');
            throw new Error(messages);
        }
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.validateSavePersonalTemplate = (req, res, next) => {
    try {
        const schema = Joi.object({
            title: Joi.string().required().trim()
                .messages({
                    'string.empty': 'Title cannot be empty.',
                    'any.required': 'Title is required.',
                }),
            html: Joi.string().required()
                .messages({
                    'string.empty': 'HTML content cannot be empty.',
                    'any.required': 'HTML content is required.',
                }),
            iconKey: Joi.string().optional().allow(null, ''),
            category: Joi.string().optional().allow(null, ''),
            timeEstimate: Joi.string().optional().allow(null, ''),
        });

        const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            const messages = error.details.map(d => d.message).join(', ');
            throw new Error(messages);
        }
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateCatalogProduct = (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().min(2).max(100).required()
                .messages({
                    'string.empty': 'Name is required.',
                    'string.min': 'Name must be at least 2 characters.',
                    'string.max': 'Name cannot exceed 100 characters.',
                    'any.required': 'Name is required.',
                }),
            description: Joi.string().min(3).max(300).allow('', null).optional()
                .messages({
                    'string.min': 'Description must be at least 3 characters.',
                    'string.max': 'Description cannot exceed 300 characters.',
                }),
            hsnCode: Joi.string().pattern(/^\d{2,8}$/).allow('', null).optional()
                .messages({
                    'string.pattern.base': 'HSN code must be between 2 and 8 digits.',
                }),
            unitPrice: Joi.alternatives()
                .try(Joi.number().min(1).max(99999999.99), Joi.string().pattern(/^\d+(\.\d{1,2})?$/))
                .required()
                .messages({ 'any.required': 'Unit price is required.' }),
            gstPercent: Joi.string().valid('0', '5', '12', '18', '28').optional()
                .messages({ 'any.only': 'GST percent must be one of 0, 5, 12, 18, 28.' }),
        });
        const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            const messages = error.details.map(d => d.message).join(', ');
            throw new Error(messages);
        }
        next();
    } catch (err) {
        next(err);
    }
};
exports.validateCreateCreditNote = (req, res, next) => {
    try {
        const schema = Joi.object({
            linkedInvoiceId: Joi.number().integer().required()
                .messages({ 'any.required': 'Linked invoice is required.' }),
            reason: Joi.string()
                .valid('GOODS_RETURNED', 'OVERCHARGE', 'SERVICE_CANCELLED', 'DISCOUNT', 'OTHER')
                .required()
                .messages({ 'any.required': 'Reason is required.', 'any.only': 'Invalid reason.' }),
            additionalDetails: Joi.string().max(80).allow('', null).optional(),
            name: Joi.string().required(),
            gstNumber: Joi.string().allow('', null).optional(),
            address: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            pincode: Joi.string().allow('', null).optional(),
            country: Joi.string().allow('', null).optional(),
            email: Joi.string().email().allow('', null).optional(),
            phoneNumber: Joi.string().required(),
            prefix: Joi.string().max(20).required(),
            invoiceNumber: Joi.string().required(),
            invoiceDate: Joi.string().isoDate().required(),
            dueDate: Joi.string().isoDate().allow('', null).optional(),
            currency: Joi.string().allow('', null).optional(),
            taxType: Joi.string().valid('Intra-State', 'Inter-State').allow(null, '').optional(),
            items: Joi.array().items(
                Joi.object({
                    name: Joi.string().required(),
                    hsn: Joi.string().allow('', null).optional(),
                    quantity: Joi.number().required(),
                    unit: Joi.string().required(),
                    unitPrice: Joi.number().required(),
                    discount: Joi.number().allow(null).optional(),
                    // International line items use 'EXPORT_0'/'EXEMPTED' instead of a GST%.
                    taxRate: Joi.alternatives().try(Joi.number(), Joi.string().valid('EXPORT_0', 'EXEMPTED')).required(),
                    netAmount: Joi.number().required(),
                    productId: Joi.string().allow('', null).optional(),
                    taxMode: Joi.string().valid('Exclusive', 'Inclusive').optional(),
                })
            ).min(1).required(),
            subtotal: Joi.number().required(),
            tax: Joi.number().required(),
            discount: Joi.number().required(),
            shippingCost: Joi.number().allow('', null).optional(),
            totalAmount: Joi.number().required(),
            amountPaid: Joi.number().allow('', null).optional(),
            paymentMode: Joi.string().required(),
            termsAndConditions: Joi.string().allow('', null).optional(),
            notes: Joi.string().allow('', null).optional(),
            saveCustomer: Joi.boolean().optional(),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};


exports.validateListAccountingTransactions = (req, res, next) => {
    try {
        const schema = Joi.object({
            tab: Joi.string().valid('all', 'needs_review', 'matched', 'recurring', 'hidden').optional(),
            searchText: Joi.string().allow('').optional(),
            type: Joi.string().valid('Income', 'Expense').optional(),
            // comma-separated multi-selects
            category: Joi.string().allow('').optional(),
            source: Joi.string().allow('').optional(),
            bankAccount: Joi.string().allow('').optional(),
            status: Joi.string().valid('all', 'categorized', 'needs_review').allow('').optional(),
            from: Joi.string().isoDate().allow('').optional(),
            to: Joi.string().isoDate().allow('').optional(),
            // `fy` (+ optional quarter/month) is an alternative to from/to; it maps to
            // the FY date range (fy=2026 => 2026-04-01..2027-03-31). quarter/month
            // require fy and are mutually exclusive.
            fy: Joi.number().integer().min(2000).max(2100).optional(),
            quarter: Joi.number().integer().min(1).max(4).optional(),
            month: Joi.number().integer().min(1).max(12).optional(),
            page: Joi.number().integer().min(1).optional(),
            itemsPerPage: Joi.number().integer().min(1).max(200).optional(),
            sort: Joi.string().valid('ASC', 'DESC').optional(),
            sortField: Joi.string().valid('txnDate', 'amount', 'createdAt').optional(),
        })
            .with('quarter', 'fy')
            .with('month', 'fy')
            .oxor('quarter', 'month');
        const result = schema.validate(req.query);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

// Export selected transactions — body carries the chosen row ids.
exports.validateExportSelectedTransactions = (req, res, next) => {
    try {
        const schema = Joi.object({
            ids: Joi.array()
                .items(Joi.number().integer().positive())
                .min(1)
                .max(5000)
                .required()
                .messages({
                    'any.required': 'ids is required.',
                    'array.min': 'Select at least one transaction to export.',
                    'array.max': 'Cannot export more than 5000 transactions at once.',
                }),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateCreateAccountingTransaction = (req, res, next) => {
    try {
        const schema = Joi.object({
            txnDate: Joi.string().isoDate().required().messages({
                'any.required': 'Transaction date is required.',
                'string.isoDate': 'Transaction date must be a valid date.',
            }),
            description: Joi.string().max(512).required().messages({
                'any.required': 'Description is required.',
                'string.empty': 'Description cannot be empty.',
            }),
            amount: Joi.number().positive().required().messages({
                'any.required': 'Amount is required.',
                'number.base': 'Amount must be a number.',
                'number.positive': 'Amount must be greater than 0.',
            }),
            type: Joi.string().valid('Income', 'Expense').required().messages({
                'any.required': 'Type is required.',
                'any.only': 'Type must be Income or Expense.',
            }),
            account: Joi.string().valid('Bank', 'Upload', 'Manual').optional(),
            category: Joi.string().allow(null, '').optional(),
            note: Joi.string().allow(null, '').optional(),
            bankAccountId: Joi.number().integer().allow(null).optional(),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateUpdateAccountingTransaction = (req, res, next) => {
    try {
        const schema = Joi.object({
            note: Joi.string().allow(null, '').optional(),
            category: Joi.string().allow(null, '').optional(),
            account: Joi.string().valid('Bank', 'Upload', 'Manual').optional(),
            type: Joi.string().valid('Income', 'Expense').optional(),
            isRecurring: Joi.boolean().optional(),
            isHidden: Joi.boolean().optional(),
            reviewed: Joi.boolean().optional(),
        }).min(1).messages({ 'object.min': 'At least one field is required to update.' });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateUpdateTransactionNote = (req, res, next) => {
    try {
        const schema = Joi.object({
            note: Joi.string().allow(null, '').max(2000).required().messages({
                'any.required': 'note is required.',
                'string.max': 'Note cannot exceed 2000 characters.',
            }),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateUpdateTransactionCategory = (req, res, next) => {
    try {
        const schema = Joi.object({
            category: Joi.string().allow(null, '').max(120).required().messages({
                'any.required': 'category is required.',
                'string.max': 'Category cannot exceed 120 characters.',
            }),
            reviewed: Joi.boolean().optional(),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateReportSummary = (req, res, next) => {
    try {
        // `fy` is the financial-year start year (fy=2025 => FY 2025-26, Apr-Mar).
        // Within an `fy`, either `quarter` (1-4) or `month` (1-12) narrows the
        // range; both require `fy` and are mutually exclusive. `from`/`to` are an
        // explicit date-range override used only when `fy` is absent.
        const schema = Joi.object({
            from: Joi.string().isoDate().optional(),
            to: Joi.string().isoDate().optional(),
            fy: Joi.number().integer().min(2000).max(2100).optional(),
            quarter: Joi.number().integer().min(1).max(4).optional(),
            month: Joi.number().integer().min(1).max(12).optional(),
            category: Joi.string().trim().max(120).optional(),
        })
            .with("quarter", "fy")
            .with("month", "fy")
            .oxor("quarter", "month");
        const result = schema.validate(req.query);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateProfitAndLoss = (req, res, next) => {
    try {
        // Same date-range selection as /summary: `fy` (+ optional `quarter` or
        // `month`), or explicit `from`/`to` when `fy` is absent.
        const schema = Joi.object({
            from: Joi.string().isoDate().optional(),
            to: Joi.string().isoDate().optional(),
            fy: Joi.number().integer().min(2000).max(2100).optional(),
            quarter: Joi.number().integer().min(1).max(4).optional(),
            month: Joi.number().integer().min(1).max(12).optional(),
        })
            .with("quarter", "fy")
            .with("month", "fy")
            .oxor("quarter", "month");
        const result = schema.validate(req.query);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateReportInsights = (req, res, next) => {
    try {
        const schema = Joi.object({
            from: Joi.string().isoDate().optional(),
            to: Joi.string().isoDate().optional(),
        });
        const result = schema.validate(req.query);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

// Balance sheet is an "as-of" snapshot: `fy` (required) selects the financial year;
// optional `month` (1-12) narrows the as-of date to that month-end within the FY.
exports.validateBalanceSheet = (req, res, next) => {
    try {
        const schema = Joi.object({
            fy: Joi.number().integer().min(2000).max(2100).required().messages({
                'any.required': 'fy is required.',
            }),
            month: Joi.number().integer().min(1).max(12).optional(),
        });
        const result = schema.validate(req.query);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

// P&L comparison PDF: `fy` (required) — compares the selected FY with the FY before it.
exports.validatePlComparison = (req, res, next) => {
    try {
        const schema = Joi.object({
            fy: Joi.number().integer().min(2000).max(2100).required().messages({
                'any.required': 'fy is required.',
            }),
        });
        const result = schema.validate(req.query);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

// Cash flow is for a period: `fy` (+ optional quarter or month) selects the range, or
// explicit `from`/`to` when `fy` is absent. quarter/month require fy and are exclusive.
exports.validateCashFlowStatement = (req, res, next) => {
    try {
        const schema = Joi.object({
            from: Joi.string().isoDate().optional(),
            to: Joi.string().isoDate().optional(),
            fy: Joi.number().integer().min(2000).max(2100).optional(),
            quarter: Joi.number().integer().min(1).max(4).optional(),
            month: Joi.number().integer().min(1).max(12).optional(),
        })
            .with('quarter', 'fy')
            .with('month', 'fy')
            .oxor('quarter', 'month');
        const result = schema.validate(req.query);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateCreateFinancialAccount = (req, res, next) => {
    try {
        const schema = Joi.object({
            accountName: Joi.string().trim().max(120).required().messages({
                'any.required': 'accountName is required.',
                'string.empty': 'accountName cannot be empty.',
            }),
            accountNumber: Joi.string().allow(null, '').max(34).optional(),
            bankName: Joi.string().allow(null, '').max(120).optional(),
            ifscCode: Joi.string().allow(null, '').max(20).optional(),
            accountType: Joi.string().valid('Current', 'Savings', 'Other').optional(),
            currency: Joi.string().length(3).optional(),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateUpdateTransactionAccount = (req, res, next) => {
    try {
        const schema = Joi.object({
            account: Joi.string().valid('Bank', 'Upload', 'Manual').required().messages({
                'any.required': 'account is required.',
                'any.only': 'account must be one of Bank, Upload or Manual.',
            }),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateToggleTransactionRecurring = (req, res, next) => {
    try {
        const schema = Joi.object({
            isRecurring: Joi.boolean().required().messages({
                'any.required': 'isRecurring is required.',
                'boolean.base': 'isRecurring must be a boolean.',
            }),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateToggleTransactionHidden = (req, res, next) => {
    try {
        const schema = Joi.object({
            isHidden: Joi.boolean().required().messages({
                'any.required': 'isHidden is required.',
                'boolean.base': 'isHidden must be a boolean.',
            }),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateCreateTransactionLinks = (req, res, next) => {
    try {
        const schema = Joi.object({
            links: Joi.array().min(1).items(
                Joi.object({
                    targetType: Joi.string().valid('INVOICING', 'INVOICE', 'BILL').required(),
                    targetId: Joi.number().integer().required(),
                    amountApplied: Joi.number().positive().allow(null).optional(),
                })
            ).required().messages({
                'any.required': 'links is required.',
                'array.min': 'At least one link is required.',
            }),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateTransactionDocument = (req, res, next) => {
    try {
        const schema = Joi.object({
            documentBase64: Joi.string().required().messages({
                'any.required': 'documentBase64 is required.',
                'string.empty': 'documentBase64 cannot be empty.',
            }),
            fileName: Joi.string().required().messages({
                'any.required': 'fileName is required.',
            }),
            format: Joi.string().valid('pdf', 'jpg', 'jpeg', 'png', 'xls', 'xlsx').required().messages({
                'any.required': 'format is required.',
                'any.only': 'Unsupported file format.',
            }),
            mimeType: Joi.string().allow(null, '').optional(),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};

exports.validateCatalogProduct = (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().min(2).max(100).required()
                .messages({
                    'string.empty': 'Name is required.',
                    'string.min': 'Name must be at least 2 characters.',
                    'string.max': 'Name cannot exceed 100 characters.',
                    'any.required': 'Name is required.',
                }),
            description: Joi.string().min(3).max(300).allow('', null).optional()
                .messages({
                    'string.min': 'Description must be at least 3 characters.',
                    'string.max': 'Description cannot exceed 300 characters.',
                }),
            hsnCode: Joi.string().pattern(/^\d{2,8}$/).allow('', null).optional()
                .messages({
                    'string.pattern.base': 'HSN code must be between 2 and 8 digits.',
                }),
            unitPrice: Joi.alternatives()
                .try(Joi.number().min(1).max(99999999.99), Joi.string().pattern(/^\d+(\.\d{1,2})?$/))
                .required()
                .messages({ 'any.required': 'Unit price is required.' }),
            gstPercent: Joi.string().valid('0', '5', '12', '18', '28').optional()
                .messages({ 'any.only': 'GST percent must be one of 0, 5, 12, 18, 28.' }),
        });
        const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
        if (error) {
            const messages = error.details.map(d => d.message).join(', ');
            throw new Error(messages);
        }
        next();
    } catch (err) {
        next(err);
    }
};
exports.validateCreateCreditNote = (req, res, next) => {
    try {
        const schema = Joi.object({
            linkedInvoiceId: Joi.number().integer().required()
                .messages({ 'any.required': 'Linked invoice is required.' }),
            reason: Joi.string()
                .valid('GOODS_RETURNED', 'OVERCHARGE', 'SERVICE_CANCELLED', 'DISCOUNT', 'OTHER')
                .required()
                .messages({ 'any.required': 'Reason is required.', 'any.only': 'Invalid reason.' }),
            additionalDetails: Joi.string().max(80).allow('', null).optional(),
            name: Joi.string().required(),
            gstNumber: Joi.string().allow('', null).optional(),
            address: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            pincode: Joi.string().allow('', null).optional(),
            country: Joi.string().allow('', null).optional(),
            email: Joi.string().email().allow('', null).optional(),
            phoneNumber: Joi.string().required(),
            prefix: Joi.string().max(20).required(),
            invoiceNumber: Joi.string().required(),
            invoiceDate: Joi.string().isoDate().required(),
            dueDate: Joi.string().isoDate().allow('', null).optional(),
            currency: Joi.string().allow('', null).optional(),
            taxType: Joi.string().valid('Intra-State', 'Inter-State').allow(null, '').optional(),
            items: Joi.array().items(
                Joi.object({
                    name: Joi.string().required(),
                    hsn: Joi.string().allow('', null).optional(),
                    quantity: Joi.number().required(),
                    unit: Joi.string().required(),
                    unitPrice: Joi.number().required(),
                    discount: Joi.number().allow(null).optional(),
                    taxRate: Joi.number().required(),
                    netAmount: Joi.number().required(),
                    productId: Joi.string().allow('', null).optional(),
                    taxMode: Joi.string().valid('Exclusive', 'Inclusive').optional(),
                })
            ).min(1).required(),
            subtotal: Joi.number().required(),
            tax: Joi.number().required(),
            discount: Joi.number().required(),
            shippingCost: Joi.number().allow('', null).optional(),
            totalAmount: Joi.number().required(),
            amountPaid: Joi.number().allow('', null).optional(),
            paymentMode: Joi.string().required(),
            termsAndConditions: Joi.string().allow('', null).optional(),
            notes: Joi.string().allow('', null).optional(),
            saveCustomer: Joi.boolean().optional(),
        });
        const result = schema.validate(req.body);
        if (result.error) throw new Error(result.error.details[0].message);
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
};
