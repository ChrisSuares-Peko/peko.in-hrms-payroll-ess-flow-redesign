const Joi = require("joi");
const ErrorResponse = require("../../utils/error-response");

exports.validateOnboardingDocuments = (req, res, next) => {
  try {
    const fileSchema = Joi.alternatives().try(
      Joi.string().uri(),
      Joi.object({
        base64: Joi.string().required(),
        format: Joi.string().valid("pdf", "png", "jpeg", "jpg").required().messages({
          "any.only": "Documents must be in pdf, png, jpg, or jpeg format.",
        }),
      })
    );

    const schema = Joi.object({
      employeeDocuments: Joi.array()
        .items(
          Joi.object({
            key: Joi.string().required(),
            name: Joi.string().required(),
            url: fileSchema.required(),
            expiryDate: Joi.date().optional().allow(null, ''),
          })
        )
        .min(1)
        .required()
        .messages({
          "array.min": "At least one document is required.",
          "any.required": "employeeDocuments is required.",
        }),
    });

    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateOnboardingBank = (req, res, next) => {
  try {
    const schema = Joi.object({
      accountName: Joi.string().min(3).max(100).required().messages({
        "any.required": "Please enter the account holder name",
        "string.min": "Account holder name must be at least 3 characters",
        "string.max": "Account holder name cannot exceed 100 characters",
      }),
      bankName: Joi.string().min(3).required().messages({
        "any.required": "Please enter the bank name",
        "string.min": "Bank name must be at least 3 characters",
      }),
      accountNumber: Joi.string().min(9).max(18).pattern(/^\d+$/).required().messages({
        "any.required": "Please enter the account number",
        "string.pattern.base": "Account number must contain only digits",
        "string.min": "Account number must be at least 9 digits",
        "string.max": "Account number cannot exceed 18 digits",
      }),
      ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required().messages({
        "any.required": "Please enter the IFSC code",
        "string.pattern.base": "Please enter a valid IFSC code",
      }),
      upiId: Joi.string().optional().allow('', null),
    });

    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateProfileUpdateRequest = (req, res, next) => {
  try {
    const schema = Joi.object({
      mobileNumber: Joi.string().min(9).pattern(/^\d+$/).required().messages({
        "any.required": "Please enter your mobile number",
        "string.pattern.base": "Please enter a valid mobile number",
      }),
      addressLine1: Joi.string().required().messages({
        "any.required": "Please enter your address",
      }),
      addressLine2: Joi.string().optional().allow('', null),
      state: Joi.string().optional().allow('', null),
      country: Joi.string().optional().allow('', null),
      pinCode: Joi.string().optional().allow('', null),
      emergencyContactName: Joi.string().required().messages({
        "any.required": "Please enter your emergency contact name",
      }),
      emergencyContactPhone: Joi.string().min(9).pattern(/^\d+$/).required().messages({
        "any.required": "Please enter your emergency contact phone",
        "string.pattern.base": "Please enter a valid emergency contact phone",
      }),
    });

    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateBankUpdateRequest = (req, res, next) => {
  try {
    const schema = Joi.object({
      bankName: Joi.string().min(3).required().messages({
        "any.required": "Please enter the bank name",
        "string.min": "Bank name must be at least 3 characters",
      }),
      accountNumber: Joi.string().min(9).max(18).pattern(/^\d+$/).required().messages({
        "any.required": "Please enter the account number",
        "string.pattern.base": "Account number must contain only digits",
      }),
      ifscCode: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required().messages({
        "any.required": "Please enter the IFSC code",
        "string.pattern.base": "Please enter a valid IFSC code",
      }),
    });

    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

// Requestable document catalog — swapped in place of AE's two UAE-only items
// (Travel Permission Letter, Tenancy/Lease Support Letter) for India-relevant
// equivalents already used by the ESS "Request Documents" tab.
exports.REQUESTABLE_DOCUMENTS = [
  'Salary Certificate',
  'Bank Verification Letter',
  'Employment Verification Letter',
  'Experience Letter',
  'Relieving Letter',
  'Address Proof Letter',
  'NOC Request',
  'Form 16',
  'Others',
];

exports.validateUserDocumentRequest = (req, res, next) => {
  try {
    const schema = Joi.object({
      documentType: Joi.string().valid(...exports.REQUESTABLE_DOCUMENTS).required().messages({
        "any.required": "Please select a document type",
        "any.only": "Please select a valid document type",
      }),
      purpose: Joi.string().optional().allow('', null),
    });

    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateDocumentRequestUpload = (req, res, next) => {
  try {
    const schema = Joi.object({
      // {base64, format} — uploaded to real storage by documentRequestFilesUpload
      // before the controller ever sees it as a plain URL.
      document: Joi.alternatives().try(
        Joi.object({
          base64: Joi.string().required(),
          format: Joi.string().valid('pdf', 'png', 'jpeg', 'jpg', 'doc', 'docx').required().messages({
            'any.only': 'Documents must be in pdf, doc, docx, png, jpg, or jpeg format.',
          }),
        }),
        Joi.string()
      ).required().messages({
        "any.required": "Please attach the document",
      }),
      note: Joi.string().max(250).optional().allow('', null),
    });

    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateUserDocumentCreate = (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required().messages({
        "any.required": "Please select a document name",
      }),
      holderName: Joi.string().optional().allow('', null),
      expiryDate: Joi.date().optional().allow('', null),
      // {base64, format} — uploaded to real storage by essDocumentFilesUpload
      // before the controller ever sees it as a plain URL.
      url: Joi.alternatives().try(
        Joi.object({
          base64: Joi.string().required(),
          format: Joi.string().valid('pdf', 'png', 'jpeg', 'jpg').required().messages({
            'any.only': 'Documents must be in pdf, png, jpg, or jpeg format.',
          }),
        }),
        Joi.string()
      ).required().messages({
        "any.required": "Please attach a file",
      }),
    });

    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateReimbursementRequest = (req, res, next) => {
  try {
    const schema = Joi.object({
      amount: Joi.number().positive().required().messages({
        "any.required": "Please enter the reimbursement amount",
        "number.positive": "Amount must be greater than 0",
      }),
      expenseDate: Joi.date().required().messages({
        "any.required": "Please select the expense date",
      }),
      expenseDetails: Joi.string().optional().allow('', null),
      // {base64, format} — uploaded to real storage by reimbursementFilesUpload
      // before this validator's sibling controller ever sees it as a plain URL.
      supportingDocs: Joi.alternatives().try(
        Joi.object({
          base64: Joi.string().required(),
          format: Joi.string().valid('pdf', 'png', 'jpeg', 'jpg').required().messages({
            'any.only': 'Receipts must be in pdf, png, jpg, or jpeg format.',
          }),
        }),
        Joi.string().allow('', null)
      ).optional(),
    });

    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

// Check-in. Geo coords + note are optional; employee/corporate are derived server-side.
exports.validateCheckIn = (req, res, next) => {
  try {
    const schema = Joi.object({
      checkIn: Joi.object({
        lat: Joi.number().min(-90).max(90).optional().allow(null).messages({
          "number.base": "checkIn.lat must be a number",
        }),
        lng: Joi.number().min(-180).max(180).optional().allow(null).messages({
          "number.base": "checkIn.lng must be a number",
        }),
      }).optional(),
      notes: Joi.string().optional().allow("", null),
    });

    const result = schema.validate(req.body, { abortEarly: false, allowUnknown: true });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

// Check-out. Same shape as check-in but under `checkOut`.
exports.validateCheckOut = (req, res, next) => {
  try {
    const schema = Joi.object({
      checkOut: Joi.object({
        lat: Joi.number().min(-90).max(90).optional().allow(null).messages({
          "number.base": "checkOut.lat must be a number",
        }),
        lng: Joi.number().min(-180).max(180).optional().allow(null).messages({
          "number.base": "checkOut.lng must be a number",
        }),
      }).optional(),
      notes: Joi.string().optional().allow("", null),
    });

    const result = schema.validate(req.body, { abortEarly: false, allowUnknown: true });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

// Overtime request raised by the employee.
exports.validateOvertimeRequest = (req, res, next) => {
  try {
    const schema = Joi.object({
      hours: Joi.number().positive().max(24).required().messages({
        "any.required": "hours is required",
        "number.base": "hours must be a number",
        "number.positive": "hours must be greater than 0",
        "number.max": "hours cannot exceed 24",
      }),
      date: Joi.date().required().messages({
        "any.required": "date is required",
        "date.base": "date must be a valid date",
      }),
      notes: Joi.string().optional().allow("", null),
    });

    const result = schema.validate(req.body, { abortEarly: false, allowUnknown: true });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

// Raise a dispute against a late/absent attendance record.
exports.validateAttendanceDispute = (req, res, next) => {
  try {
    const schema = Joi.object({
      // A real ObjectId, or a "virtual-YYYY-MM-DD" id for a day the attendance list
      // synthesized as absent because no AttendanceRecord exists yet for it.
      attendanceId: Joi.string().required().pattern(/^([0-9a-fA-F]{24}|virtual-\d{4}-\d{2}-\d{2})$/).messages({
        "any.required": "attendanceId is required",
        "string.pattern.base": "attendanceId must be a valid id",
      }),
      reason: Joi.string().required().messages({
        "any.required": "reason is required",
        "string.empty": "reason cannot be empty",
      }),
      // {base64, format} — uploaded to real storage by reimbursementFilesUpload
      // before this validator's sibling controller ever sees it as a plain URL.
      supportingDocs: Joi.alternatives().try(
        Joi.object({
          base64: Joi.string().required(),
          format: Joi.string().valid('pdf', 'png', 'jpeg', 'jpg').required().messages({
            'any.only': 'Supporting documents must be in pdf, png, jpg, or jpeg format.',
          }),
        }),
        Joi.string().allow('', null)
      ).optional(),
    });

    const result = schema.validate(req.body, { abortEarly: false, allowUnknown: true });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

// Apply for leave (Employee Self-Service).
exports.validateLeaveApply = (req, res, next) => {
  try {
    const schema = Joi.object({
      start: Joi.date().required().messages({
        "any.required": "start date is required",
        "date.base": "start must be a valid date",
      }),
      end: Joi.date().required().messages({
        "any.required": "end date is required",
        "date.base": "end must be a valid date",
      }),
      leaveCount: Joi.number().positive().required().messages({
        "any.required": "leaveCount is required",
        "number.positive": "leaveCount must be greater than 0",
      }),
      isUnpaidLeave: Joi.boolean().optional(),
      typeOfLeave: Joi.when('isUnpaidLeave', {
        is: true,
        then: Joi.string().optional(),
        otherwise: Joi.string().required().messages({
          "any.required": "Please select a leave type",
        }),
      }),
      halfDaySelection: Joi.string().valid('FIRST_HALF', 'SECOND_HALF').allow(null, ''),
      notes: Joi.string().optional().allow('', null),
    });

    const result = schema.validate(req.body, { abortEarly: false, allowUnknown: true });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateListLeaveApplications = (req, res, next) => {
  try {
    const schema = Joi.object({
      from: Joi.date().iso().optional(),
      to: Joi.date().iso().optional(),
      status: Joi.string().valid('applied', 'approved', 'rejected', 'cancelledByEmployee').optional(),
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
    });

    const result = schema.validate(req.query, { abortEarly: false, allowUnknown: true });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateOnboardingEmergency = (req, res, next) => {
  try {
    const schema = Joi.object({
      emergencyContactName: Joi.string().min(3).required().messages({
        "any.required": "Please enter the emergency contact name",
        "string.min": "Emergency contact name must be at least 3 characters",
      }),
      emergencyContactNo: Joi.string().min(9).pattern(/^\d+$/).required().messages({
        "any.required": "Please enter the emergency contact number",
        "string.pattern.base": "Please enter a valid emergency contact number",
        "string.min": "Emergency contact number must be at least 9 digits",
      }),
      emergencyContactRelation: Joi.string().optional().allow('', null),
    });

    const result = schema.validate(req.body, { abortEarly: false });

    if (result.error) {
      const errors = result.error.details.map(e => e.message);
      return next(new ErrorResponse(errors.join(', '), 400));
    }

    next();
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};
