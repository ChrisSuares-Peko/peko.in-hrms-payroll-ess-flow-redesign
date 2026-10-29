const Joi = require("joi");
const ErrorResponse = require("../../utils/error-response");

exports.validateIncomeDeclarationForm = (req, res, next) => {
  try {
    const payloadSchema = Joi.object({
      employee: Joi.string().required().messages({
        'string.base': 'Employee ID must be a string',
        'any.required': 'Employee ID is required',
        'string.empty': 'Employee ID cannot be empty'
      }),
      financialYear: Joi.string().required().messages({
        'string.base': 'Financial Year must be a string',
        'any.required': 'Financial Year is required',
        'string.empty': 'Financial Year cannot be empty'
      }),
      hraDetails: Joi.object({
        totalRentPaid: Joi.number().optional(),
        landlordName: Joi.string().optional(),
        landlordPAN: Joi.string().optional(),
        rentedPropertyAddress: Joi.string().optional(),
        rentReceipts: Joi.string().optional(),
      }).optional(),

      ltaDetails: Joi.object({
        ltaAmountClaimed: Joi.number().optional(),
        travelDate: Joi.date().optional(),
        travelDestination: Joi.string().optional(),
        travelProof: Joi.string().optional(),
      }).optional(),

      homeLoanInterestDetails: Joi.object({
        interestPaid: Joi.number().optional(),
        lenderName: Joi.string().optional(),
        lenderPAN: Joi.string().optional(),
        lenderAddress: Joi.string().optional(),
        loanProof: Joi.string().optional(),
      }).optional(),

      incomeDeclaration: Joi.object({
        annualIncome: Joi.number().optional(),
        incomeProof: Joi.string().optional(),
      }).optional(),

      chapterVIA: Joi.array().items(
        Joi.object({
          investmentType: Joi.string().optional(),
          amountInvested: Joi.number().optional(),
          proofDocument: Joi.string().optional(),
          _id: Joi.string().optional(),
        })
      ).optional(),

      homeLoanDeductions: Joi.array().items(
        Joi.object({
          deductionType: Joi.string().optional(),
          amountClaimed: Joi.number().optional(),
          institutionName: Joi.string().optional(),
          certificationDate: Joi.date().optional(),
          proofDocument: Joi.string().optional(),
          _id: Joi.string().optional(),
        })
      ).optional(),
      corporateUser: Joi.string().optional(),
      createdAt: Joi.date().optional(),
      updatedAt: Joi.date().optional(),
      id: Joi.string().optional(),
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
