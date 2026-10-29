const Joi = require('joi')
const ErrorResponse = require('../error-response')
const {
    CLOSURE_REASON,
    CLOSURE_REASON_VALUES,
    DETAILS_MIN,
    DETAILS_MAX,
} = require('../../constants/accountClosure')

const INVALID_REASON = 'Please select a reason for closing the account.'
const DETAILS_REQUIRED = 'Please tell us a little more about why you are leaving.'
const DETAILS_TOO_LONG = `The details must be ${DETAILS_MAX} characters or fewer.`
const DETAILS_TOO_SHORT = `The details must be at least ${DETAILS_MIN} characters.`

const detailsMessages = {
    'string.base': DETAILS_TOO_SHORT,
    'string.min': DETAILS_TOO_SHORT,
    'string.max': DETAILS_TOO_LONG,
    'string.empty': DETAILS_REQUIRED,
    'any.required': DETAILS_REQUIRED,
}

const details = Joi.string().trim().min(DETAILS_MIN).max(DETAILS_MAX)

const accountClosureRequestSchema = Joi.object({
    reason: Joi.string()
        .trim()
        .uppercase()
        .valid(...CLOSURE_REASON_VALUES)
        .required()
        .messages({
            'string.base': INVALID_REASON,
            'string.empty': INVALID_REASON,
            'any.only': INVALID_REASON,
            'any.required': INVALID_REASON,
        }),
    details: Joi.when('reason', {
        is: CLOSURE_REASON.OTHERS,
        then: details.required().messages(detailsMessages),
        otherwise: details.allow('').optional().messages(detailsMessages),
    }),
}).unknown(true)

exports.validateAccountClosureRequest = (req, res, next) => {
    const { error } = accountClosureRequestSchema.validate(req.body || {})
    if (error) return next(new ErrorResponse(error.details[0].message, 400))
    return next()
}

exports.accountClosureRequestSchema = accountClosureRequestSchema
