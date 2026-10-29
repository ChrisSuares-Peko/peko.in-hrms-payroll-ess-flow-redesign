const Joi = require("joi");
const ErrorResponse = require("./error-response");

exports.validateEpfSettings = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      epfNumber: Joi.string().required().messages({
        "string.empty": "EPF number cannot be empty",
        "any.required": "EPF number is required",
      }),
      pfWagesPolicy: Joi.string().valid("CAPPED_15000", "FULL_BASIC").required().messages({
        "any.required": "PF wages policy is required",
        "any.only": "PF wages policy must be one of: CAPPED_15000, FULL_BASIC",
      }),
      enableProRatedPfWage: Joi.boolean().required().messages({
        "any.required": "Enable pro-rated PF wage is required",
      }),
      considerSalaryComponents: Joi.boolean().required().messages({
  "any.required": "Consider salary components is required",
}),

      
    });

    const result = payloadSchema.validate(req.body);

    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next();
  } catch (err) {
    return next(new ErrorResponse("Something went wrong", 500));
  }
};

exports.validateEpfApplicability = (req, res, next) => {
  const result = Joi.object({
    isApplicable: Joi.boolean().required().messages({
      "any.required": "isApplicable is required",
      "boolean.base": "isApplicable must be true or false",
    }),
  }).validate(req.body);

  if (result.error) {
    return next(new ErrorResponse(result.error.details[0].message, 400));
  }
  next();
};

exports.validateEpfEarningsLine = (req, res, next) => {
  const result = Joi.object({
    showInEarnings: Joi.boolean().required().messages({
      "any.required": "showInEarnings is required",
      "boolean.base": "showInEarnings must be true or false",
    }),
  }).validate(req.body);

  if (result.error) {
    return next(new ErrorResponse(result.error.details[0].message, 400));
  }
  next();
};

exports.validateESISettings = (req, res, next) => {

  try {

    const schema = Joi.object({

      esiNumber: Joi.string()
        .pattern(/^\d{6,17}$/)
        .required()
        .messages({
          'string.pattern.base': 'ESI Number must be 6 to 17 digits',
          'any.required': 'ESI Number is required'
        }),

      deductionCycle: Joi.string()
        .valid('Monthly', 'Quarterly', 'Half-Yearly', 'Yearly')
        .required()
        .messages({
          'any.only': 'Invalid Deduction Cycle',
          'any.required': 'Deduction Cycle is required'
        }),

      employeeContribution: Joi.number()
        .min(0)
        .max(1)
        .precision(4)
        .required()
        .messages({
          'number.base': 'Employee Contribution must be a number',
          'number.max': 'Employee Contribution cannot exceed 1',
          'any.required': 'Employee Contribution is required'
        }),

      employerContribution: Joi.number()
        .min(0)
        .max(1)
        .precision(4)
        .required()
        .messages({
          'number.base': 'Employer Contribution must be a number',
          'number.max': 'Employer Contribution cannot exceed 1',
          'any.required': 'Employer Contribution is required'
        })

    });


    const result = schema.validate(req.body, {
      abortEarly: false,
      allowUnknown: false
    });


    if (result.error) {

      const errors = result.error.details.map(e => e.message);

      return next(
        new ErrorResponse(errors.join(', '), 400)
      );

    }


    next();

  }
  catch (err) {

    console.error(err);

    return next(
      new ErrorResponse("Something went wrong", 500)
    );

  }

};


exports.validateProfessionalTaxSettings = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      _id: Joi.string().optional().allow(null).messages({
        "string.base": "Income slab ID must be a string",
      }), 
      ptNumber: Joi.string().required().messages({
        "string.empty": "Professional Tax number cannot be empty",
        "any.required": "Professional Tax number is required",
      }),
      // Professional Tax's own settings form has never collected this (unlike ESI, which
      // has a real Deduction Cycle dropdown) and nothing downstream reads
      // professionalTax.deductionCycle to affect when PT is actually deducted (that's
      // driven by the Statutory Components tab per-employee, not this org-level setting) —
      // requiring it here just blocked every PT settings save with no corresponding UI to
      // satisfy it. Defaults to the only cycle PT is actually deducted on in practice.
      deductionCycle: Joi.string()
        .valid("Monthly", "Quarterly", "Half-Yearly", "Yearly")
        .optional()
        .default("Monthly")
        .messages({
          "string.empty": "Deduction cycle cannot be empty",
          "any.only":
            "Deduction cycle must be one of: Monthly, Quarterly, Half-Yearly, Yearly",
        }),
      // Same gap as deductionCycle above — the Professional Tax settings page has no UI to
      // enter income slabs at all (per its own on-page copy, "Each employee's PT amount is
      // set on their Statutory Components tab" — nothing here auto-computes it from a
      // slab table), and nothing downstream reads professionalTax.incomeSlabs either.
      // Requiring at least one slab blocked every PT settings save from this page.
      incomeSlabs: Joi.array()
        .items(
          Joi.object({
            incomeStartRange: Joi.number().required().positive().messages({
              "number.base": "Income start range must be a number",
              "any.required": "Income start range is required",
              "number.positive": "Income start range must be a positive number",
            }),
            incomeEndRange: Joi.number().required().positive().greater(Joi.ref('incomeStartRange')).messages({
              "number.base": "Income end range must be a number",
              "any.required": "Income end range is required",
              "number.positive": "Income end range must be a positive number",
              "number.greater": "Income end range must be greater than the start range",
            }),
            taxAmount: Joi.number().required().positive().messages({
              "number.base": "Tax amount must be a number",
              "any.required": "Tax amount is required",
              "number.positive": "Tax amount must be a positive number",
            }),
          })
        )
        .optional()
        .default([]),
    });

    const result = payloadSchema.validate(req.body);

    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next(); // Proceed to the controller if no validation errors
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};


exports.validateLaborWelfareFundSettings = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      workState: Joi.string().required().messages({
        "string.empty": "Org work state cannot be empty",
        "any.required": "Org work state is required",
      }),
      registrationNumber: Joi.string().allow("", null).max(20).messages({
        "string.max": "LWF registration number cannot exceed 20 characters",
      }),
    });

    // Validate the request body against the schema
    const result = payloadSchema.validate(req.body);

    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next(); // Proceed to the controller if no validation errors
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};



exports.validateTdsSettings = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      tan: Joi.string().required().messages({
        "string.empty": "TAN cannot be empty",
        "any.required": "TAN is required",
      }),
      // Commissioner/Address/Father's Name/Signature are no longer collected by the TDS
      // settings form (redesigned to match the simplified prototype) — kept optional
      // rather than removed so an org that already saved these under the older form
      // doesn't fail validation on its next unrelated save.
      assignedCommissioner: Joi.string().allow('', null).messages({
        "string.empty": "Assigned Commissioner cannot be empty",
      }),
      address: Joi.string().allow('', null).messages({
        "string.empty": "Address cannot be empty",
      }),
      bsr: Joi.object({
        // "Deposit Bank" in the redesigned form — no longer required there.
        bankName: Joi.string().allow('', null).messages({
          "string.empty": "Bank name cannot be empty",
        }),
        bsrCode: Joi.string().required().messages({
          "string.empty": "BSR Code cannot be empty",
          "any.required": "BSR Code is required",
        }),
      }).required().messages({
        "any.required": "BSR details are required",
      }),
      authorizedSignatoryDetails: Joi.object({
        name: Joi.string().required().messages({
          "string.empty": "Signatory name cannot be empty",
          "any.required": "Signatory name is required",
        }),
        fathersName: Joi.string().allow('', null).messages({
          "string.empty": "Father's name cannot be empty",
        }),
        signature: Joi.string().allow('', null).messages({
          "string.empty": "Signature cannot be empty",
        }),
        placeOfSigning: Joi.string().allow('', null).messages({
          "string.empty": "Place of signing cannot be empty",
        }),
      }).required().messages({
        "any.required": "Authorized signatory details are required",
      }),
      taxRegime: Joi.string().valid('Old Tax Regime', 'New Tax Regime').default('New Tax Regime').messages({
        "string.empty": "Tax Regime cannot be empty",
        "any.required": "Tax Regime is required",
        "any.only": "Tax Regime must be either 'Old Tax Regime' or 'New Tax Regime'",
      }),
    });

    const result = payloadSchema.validate(req.body);

    if (result.error) {
      return next(new ErrorResponse(result.error.details[0].message, 400));
    }

    next(); // Proceed to the controller if no validation errors
  } catch (err) {
    console.error(err);
    return next(new ErrorResponse("Something went wrong", 500));
  }
};
