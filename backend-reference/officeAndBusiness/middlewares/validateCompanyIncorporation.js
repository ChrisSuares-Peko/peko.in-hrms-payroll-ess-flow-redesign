const ErrorResponse = require('../utils/error-response');
const {
    submitApplicationSchema,
    updateStatusSchema,
    verifyDocumentSchema,
} = require('../utils/validationSchemas/companyIncorporation');

const validateSubmitApplication = (req, res, next) => {
    const { error, value } = submitApplicationSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const messages = error.details.map(detail => detail.message).join(', ');
        return next(new ErrorResponse(messages, 400));
    }

    req.validatedBody = value;
    next();
};

const validateUpdateStatus = (req, res, next) => {
    const { error, value } = updateStatusSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const messages = error.details.map(detail => detail.message).join(', ');
        return next(new ErrorResponse(messages, 400));
    }

    req.validatedBody = value;
    next();
};

const validateVerifyDocument = (req, res, next) => {
    const { error, value } = verifyDocumentSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const messages = error.details.map(detail => detail.message).join(', ');
        return next(new ErrorResponse(messages, 400));
    }

    req.validatedBody = value;
    next();
};

module.exports = {
    validateSubmitApplication,
    validateUpdateStatus,
    validateVerifyDocument,
};
