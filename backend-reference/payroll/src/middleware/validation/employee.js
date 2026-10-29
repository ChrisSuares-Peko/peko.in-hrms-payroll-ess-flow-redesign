const Joi = require("joi");
const ErrorResponse = require("../../utils/error-response");

exports.validateOffBoarding = (req, res, next) => {
  try {
    const schema = Joi.object({
      offBoardingDate: Joi.date().iso().required().messages({
        "any.required": "Off boarding date is required",
        "date.format":
          "Invalid format for last working day. Please provide a valid ISO date format",
      }),
      noticePeriod: Joi.number().integer().min(0).required().messages({
        "any.required": "Notice period is required",
        "number.integer": "Notice period must be an integer",
        "number.min": "Notice period must be a non-negative integer",
      }),
      lastWorkingDay: Joi.date().iso().required().messages({
        "any.required": "Last working day is required",
        "date.format":
          "Invalid format for last working day. Please provide a valid ISO date format",
      }),
      resignationLetter: Joi.alternatives()
        .try(
          Joi.string().uri(), // Accepts string as URL
          Joi.object({
            // Accepts object with base64 and format properties
            base64: Joi.string().required(),
            format: Joi.string()
              .valid("pdf", "png", "jpeg", "jpg")
              .required()
              .messages({
                "any.only":
                  "Invalid format. The resignation letter must be in pdf, png, jpg,or jpeg format.",
              }),
          })
        )
        .optional().allow('', null)
        .messages({
          "alternatives.types":
            "Resignation letter must be a string (representing a link) or an object with base64 and format properties",
        }),
      offBoardingType: Joi.string()
        .valid("RESIGNATION", "SUSPENSION")
        .required()
        .messages({
          "any.required": "Off boarding type is required",
          "any.only":
            "Invalid off boarding type. Allowed values are: RESIGNATION, SUSPENSION",
        }),
      reasonForOffBoarding: Joi.string().optional().allow(''),
    });
    const result = schema.validate(req.body);
    if (result.error) {
      throw new ErrorResponse(
        result?.error?.details[0]?.message || "validation error",
        400
      );
    }
    // Additional validation for last working day
    const offBoardingDate = new Date(req.body.offBoardingDate);
    const noticePeriod = req.body.noticePeriod;
    const lastWorkingDay = new Date(req.body.lastWorkingDay);

    const calculatedLastWorkingDay = new Date(offBoardingDate);
    calculatedLastWorkingDay.setDate(offBoardingDate.getDate() + noticePeriod);

    const isBothDaysEqual = areDatesEqualWithoutTime(
      calculatedLastWorkingDay,
      lastWorkingDay
    );

    if (!isBothDaysEqual) {
      throw new ErrorResponse(
        "Last working day does not match the calculated date.",
        400
      );
    }
    next();
  } catch (err) {
    console.log({ error: err });

    next(err);
  }
};

function areDatesEqualWithoutTime(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

exports.validateAddEmployee = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      profileImage: Joi.alternatives().try(
        Joi.object({
          base64: Joi.string().required().messages({
            "any.required": "Profile image base64 data is required.",
          }),
          format: Joi.string().valid("img").required().messages({
            "any.required": "Profile image format is required.",
            "any.only": 'Profile image format must be "img".',
          }),
        }).required(),
        Joi.string().allow(null).required()
      ),
      fullName: Joi.string().required().messages({
        "any.required": "Full name is required.",
      }),
      dateOfBirth: Joi.string().isoDate().required().messages({
        "any.required": "Date of birth is required.",
        "string.isoDate": "Date of birth must be in ISO date format.",
      }),
      gender: Joi.string().valid("MALE", "FEMALE").required().messages({
        "any.required": "Gender is required.",
        "any.only": "Gender must be one of: MALE, FEMALE, OTHER.",
      }),
      mobileNo: Joi.string().required().messages({
        "any.required": "Mobile number is required.",
      }),
      email: Joi.string().email().required().messages({
        "any.required": "Email is required.",
        "string.email": "Email must be a valid email address.",
      }),
      emergencyNo: Joi.string().allow("").optional(),
      emergencyContactName: Joi.string().allow("").optional(),
      emergencyContactRelation: Joi.string().allow("").optional(),
      isGccNationality: Joi.allow("").optional(),
      nationality: Joi.string().required().messages({
        "any.required": "Nationality is required.",
      }),
      state: Joi.string().required().messages({
        "any.required": "State is required.",
      }),
      personalAddress: Joi.string().allow("").optional(),
      employeeInformation: Joi.object({
        dateOfJoin: Joi.string().isoDate().required().messages({
          "any.required": "Date of join is required.",
          "string.isoDate": "Date of join must be in ISO date format.",
        }),
        employeeId: Joi.string().required().messages({
          "any.required": "Employee ID is required.",
        }),
        department: Joi.string().required().messages({
          "any.required": "Department is required.",
        }),
        reportingStaff: Joi.allow(null).optional(),
        employeeGrade: Joi.allow(null).optional(),

        workingHours: Joi.number().required().messages({
          "any.required": "Working hours is required.",
        }),
        workingDays: Joi.number().required().messages({
          "any.required": "Working hours is required.",
        }),

        probationPeriod: Joi.number().required().messages({
          "any.required": "Probation period is required.",
        }),
        designation: Joi.string().required().messages({
          "any.required": "Designation is required.",
        }),

        status: Joi.string()
          .valid("ACTIVE", "LEAVE", "SUSPENDED", "RESIGNED")
          .required()
          .messages({
            "any.required": "Status is required.",
            "any.only":
              "Status must be one of: ACTIVE, LEAVE, SUSPENDED, RESIGNED.",
          }),
        timeSchedule: Joi.string().required().messages({
          "any.required": "Time Schedule is required.",
        }),
        contractType: Joi.string().required().messages({
          "any.required": "Contract type is required.",
        }),
      }).required(),

      employeeDocuments: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required().messages({
              "any.required": "Document name is required.",
            }),
            url: Joi.object({
              base64: Joi.string().required().messages({
                "any.required": "Document URL base64 data is required.",
              }),
              format: Joi.string().required().messages({
                "any.required": "Document URL format is required.",
              }),
            }).required(),
            expiryDate: Joi.string().isoDate().required().messages({
              "any.required": "Document expiry date is required.",
              "string.isoDate":
                "Document expiry date must be in ISO date format.",
            }),
          })
        )
        .optional(),
      bankDetails: Joi.object({
        accountNumber: Joi.string().allow("").optional().messages({
          "any.required": "Account number is required.",
        }),
        bankName: Joi.string().allow("").optional().messages({
          "any.required": "Bank name is required.",
        }),
        accountName: Joi.string().allow("").optional().messages({
          "any.required": "Account name is required.",
        }),

        ifscCode: Joi.allow("").optional(),
      }).required(),
      salaryComponents: Joi.array()
        .items(
          Joi.object({
            component: Joi.string().required().messages({
              "any.required": "Salary component ID is required.",
            }),
            type: Joi.string().valid("CUSTOM", "DEFAULT").required().messages({
              "any.required": "Salary component type is required.",
              "any.only": "Salary component type must be one of: CUSTOM, DEFAULT.",
            }),
          })
        )
        .required(),

      otherConfigurations: Joi.object({
        enableEPF: Joi.boolean().required(),
        epfUAN: Joi.string().allow("").optional(),
        enableESI: Joi.boolean().required(),
        esiNumber: Joi.string().allow("").optional(),
        professionalTax: Joi.boolean().required(),
        laborWelfareFund: Joi.boolean().required(),
        tds: Joi.boolean().optional(),
        tdsRegime: Joi.string().allow("").optional(),
      }).required(),
      userId: Joi.number().optional().messages({
        "number.base": "User ID must be a number.",
      }),
      userType: Joi.string().optional(),
    });
    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      // If validation fails, throw an error with the validation message
      console.log(result.error, "result error");
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateEmployeePersonalDetailsUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      profileImage: Joi.object({
        base64: Joi.string().optional(),
        format: Joi.string().optional(),
      }).optional(),
      fullName: Joi.string().optional(),
      dateOfBirth: Joi.date().iso().optional(),
      gender: Joi.string().valid("MALE", "FEMALE").optional(),
      mobileNo: Joi.string().optional(),
      personalEmail: Joi.string().email().optional(),
      email: Joi.string().email().optional(),
      emergencyNo: Joi.string().allow("").optional(),
      emergencyContactName: Joi.string().allow("").optional(),
      emergencyContactRelation: Joi.string().allow("").optional(),
      country: Joi.string().optional(),
      qualification: Joi.string().allow("").optional(),
      experienceInYear: Joi.string().allow("").optional(),
      experienceInMonth: Joi.string().allow("").optional(),
      maritialStatus: Joi.string().allow("").optional(),
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

exports.validateEmployeeInformationUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      dateOfJoin: Joi.date().iso().required().messages({
        "any.required": "Date of join is required.",
        "date.isoDate": "Date of join must be a valid ISO date.",
      }),
      employeeId: Joi.string().required().messages({
        "any.required": "Employee ID is required.",
      }),
      designation: Joi.string().required().messages({
        "any.required": "Designation is required.",
      }),
      department: Joi.string().required().messages({
        "any.required": "Department is required.",
      }),
      reportingStaff: Joi.string().allow("").allow(null).optional(),

      jobType: Joi.string()
        .valid("FULL TIME", "PART TIME")
        .required()
        .messages({
          "any.required": "Job type is required.",
          "any.only": "Job type must be one of: FULL TIME, PART TIME.",
        }),
      workingHours: Joi.number().required().messages({
        "any.required": "Working hours is required.",
      }),
      schedule: Joi.string().required().messages({
        "any.required": "Schedule is required.",
      }),
      probation: Joi.number().required().messages({
        "any.required": "Probation is required.",
      }),
      taxRegime: Joi.string()
        .valid("New Tax Regime", "Old Tax Regime")
        .optional()
        .messages({
          "any.only": "Tax regime must be one of: New Tax Regime, Old Tax Regime.",
        }),
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

exports.validateEmployeeWorkEmailUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      workEmailId: Joi.string().required().messages({
        "any.required": "Work email is required.",
      }),
    });

    const result = payloadSchema.validate(req.body);
    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateEmployeeSalaryUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      basicPay: Joi.string().required().messages({
        "any.required": "Basic pay is required.",
      }),
      homeAllowances: Joi.string().required().messages({
        "any.required": "Home allowances is required.",
      }),
      travelAllowances: Joi.string().required().messages({
        "any.required": "Travel allowances is required.",
      }),
      medicalAllowances: Joi.string().required().messages({
        "any.required": "Medical allowances is required.",
      }),
      otherAllowances: Joi.string().required().messages({
        "any.required": "Other allowances is required.",
      }),
      other: Joi.string().required().messages({
        "any.required": "Other is required.",
      }),
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

exports.validateEmployeeCredentials = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      email: Joi.string().optional(),
      mobileNo: Joi.string().optional(),
      employeeId: Joi.string().optional(),
      dateOfJoin: Joi.string().optional(),
      workEmailId: Joi.string().optional().allow('')
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

exports.validateEmployeeBankUpdate = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      beneficiaryName: Joi.string().required().messages({
        "any.required": "Beneficiary name is required.",
      }),
      bankName: Joi.string().required().messages({
        "any.required": "Bank name is required.",
      }),
      accountNumber: Joi.string().required().messages({
        "any.required": "Account number is required.",
      }),
      ibanNumber: Joi.string().required().messages({
        "any.required": "IBAN number is required.",
      }),
      swiftCode: Joi.string().allow("").optional(),
      routingCode: Joi.string().allow("").optional(),
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

//new validation schemas

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

exports.validatePersonalInfo = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      profileImage: Joi.alternatives().try(
        Joi.object({
          base64: Joi.string().required().messages({
            "any.required": "Profile image base64 data is required.",
          }),
          format: Joi.string().valid("img").required().messages({
            "any.required": "Profile image format is required.",
            "any.only": 'Profile image format must be "img".',
          }),
        }),
        Joi.string().allow(null).allow("")
      ).optional(),
      personalInformation: Joi.object({
        fullName: Joi.string().required().messages({
          "any.required": "Full name is required.",
        }),
        dateOfBirth: Joi.string().isoDate().required().messages({
          "any.required": "Date of birth is required.",
          "string.isoDate": "Date of birth must be in ISO date format.",
        }),
        gender: Joi.string().valid("MALE", "FEMALE").required().messages({
          "any.required": "Gender is required.",
          "any.only": "Gender must be one of: MALE, FEMALE.",
        }),
        mobileNo: Joi.string().required().messages({
          "any.required": "Mobile number is required.",
        }),
        email: Joi.string().email().required().messages({
          "any.required": "Email is required.",
          "string.email": "Email must be a valid email address.",
        }),
        country: Joi.string().required().messages({
          "any.required": "Country is required.",
        }),
        state: Joi.string().optional().allow(null).allow(""),
        personalAddress: Joi.string().allow("").optional(),
        emergencyContactNo: Joi.string().allow("").optional(),
        emergencyContactName: Joi.string().allow("").optional(),
        emergencyContactRelation: Joi.string().allow("").optional(),
      }).required(),
    });

    const result = payloadSchema.validate(req.body);

    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};



exports.validateEmployeeInfo = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      profileImage: Joi.alternatives().try(
        Joi.object({
          base64: Joi.string().required().messages({
            "any.required": "Profile image base64 data is required.",
          }),
          format: Joi.string().valid("img").required().messages({
            "any.required": "Profile image format is required.",
            "any.only": 'Profile image format must be "img".',
          }),
        }),
        Joi.string().allow(null).allow("")
      ).optional(),
      employeeInformation: Joi.object({
        dateOfJoin: Joi.string().isoDate().required().messages({
          "any.required": "Date of joining is required.",
          "string.isoDate": "Date of joining must be in ISO date format.",
        }),
        employeeId: Joi.string().required().messages({
          "any.required": "Employee ID is required.",
        }),
        department: Joi.string().required().messages({
          "any.required": "Department is required.",
        }),
        reportingStaff: Joi.allow(null).optional(),
        employeeGrade: Joi.allow(null).optional(),
        workingHours: Joi.number().required().messages({
          "any.required": "Working hours are required.",
        }),
        workingDays: Joi.number().required().messages({
          "any.required": "Working days are required.",
        }),
        probationPeriod: Joi.number().optional().allow(null).allow(""),
        designation: Joi.string().required().messages({
          "any.required": "Designation is required.",
        }),
        employeeStatus: Joi.string().required().messages({
          "any.required": "Employee status is required.",
        }),
        status: Joi.string()
          .optional(),

        timeSchedule: Joi.string().required().messages({
          "any.required": "Time Schedule is required.",
        }),
        contractType: Joi.string().required().messages({
          "any.required": "Contract type is required.",
        }),
      }).required(),
    });

    const result = payloadSchema.validate(req.body);

    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};


exports.validateSalaryInfo = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      profileImage: Joi.alternatives().try(
        Joi.object({
          base64: Joi.string().required().messages({
            "any.required": "Profile image base64 data is required.",
          }),
          format: Joi.string().valid("img").required().messages({
            "any.required": "Profile image format is required.",
            "any.only": 'Profile image format must be "img".',
          }),
        }),
        Joi.string().allow(null).allow("")
      ).optional(),
      salaryComponents: Joi.array()
        .items(
          Joi.object({
            component: Joi.string().required().messages({
              "any.required": "Salary component ID is required.",
            }),
            type: Joi.string().valid("CUSTOM", "DEFAULT").required().messages({
              "any.required": "Salary component type is required.",
              "any.only": "Salary component type must be one of: CUSTOM, DEFAULT.",
            }),
          })
        )
        .required(),
      otherConfigurations: Joi.object({
        enableEPF: Joi.boolean().required(),
        epfUAN: Joi.string().allow("").optional(),
        enableESI: Joi.boolean().required(),
        esiNumber: Joi.string().allow("").optional(),
        professionalTax: Joi.boolean().required(),
        laborWelfareFund: Joi.boolean().required(),
        tds: Joi.boolean().optional(),
        tdsRegime: Joi.string().allow("").optional(),
      }).required(),
    });

    const result = payloadSchema.validate(req.body);

    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};


exports.validateDocumentInfo = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      profileImage: Joi.alternatives().try(
        Joi.object({
          base64: Joi.string().required().messages({
            "any.required": "Profile image base64 data is required.",
          }),
          format: Joi.string().valid("img").required().messages({
            "any.required": "Profile image format is required.",
            "any.only": 'Profile image format must be "img".',
          }),
        }),
        Joi.string().allow(null).allow("")
      ).optional(),
      employeeDocuments: Joi.array()
        .items(
          Joi.object({
            name: Joi.string().required().messages({
              "any.required": "Document name is required.",
            }),
            url: Joi.object({
              base64: Joi.string().required().messages({
                "any.required": "Document URL base64 data is required.",
              }),
              format: Joi.string().required().messages({
                "any.required": "Document URL format is required.",
              }),
            }).required(),
            expiryDate: Joi.string().isoDate().required().messages({
              "any.required": "Document expiry date is required.",
              "string.isoDate": "Document expiry date must be in ISO date format.",
            }),
          })
        )
        .optional(),
    });

    const result = payloadSchema.validate(req.body);

    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};


exports.validateBankInfo = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      profileImage: Joi.alternatives().try(
        Joi.object({
          base64: Joi.string().required().messages({
            "any.required": "Profile image base64 data is required.",
          }),
          format: Joi.string().valid("img").required().messages({
            "any.required": "Profile image format is required.",
            "any.only": 'Profile image format must be "img".',
          }),
        }),
        Joi.string().allow(null).allow("")
      ).optional(),
      bankDetails: Joi.object({
        accountNumber: Joi.string().allow("").optional().messages({
          "any.required": "Account number is required.",
        }),
        bankName: Joi.string().allow("").optional().messages({
          "any.required": "Bank name is required.",
        }),
        accountName: Joi.string().allow("").optional().messages({
          "any.required": "Account name is required.",
        }),
        ifscCode: Joi.string().allow("").optional(),
      }).required(),
    });

    const result = payloadSchema.validate(req.body);

    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};


