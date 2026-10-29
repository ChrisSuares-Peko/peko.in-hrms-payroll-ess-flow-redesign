const Joi = require('joi');
const ErrorResponse = require('../error-response');

const companyInfoSchema = Joi.object({
    name: Joi.string().optional(),
    cin: Joi.string().regex(/^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/).optional().messages({
        'string.pattern.base': 'CIN must be a valid 21-character CIN number',
    }),
    incorporationDate: Joi.string().optional(),
    type: Joi.string().optional(),
    pan: Joi.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().messages({
        'string.pattern.base': 'PAN must be a valid 10-character PAN number',
    }),
    tan: Joi.string().regex(/^[A-Z]{4}[0-9]{5}[A-Z]{1}$/).optional().messages({
        'string.pattern.base': 'TAN must be a valid 10-character TAN number',
    }),
    gstin: Joi.string().length(15).optional().messages({
        'string.length': 'GSTIN must be exactly 15 characters',
    }),
    registeredAddress: Joi.string().optional(),
    email: Joi.string().email().max(55).optional(),
    mobile: Joi.string().regex(/^[6-9]\d{9}$/).optional().messages({
        'string.pattern.base': 'Mobile number must be a valid 10-digit Indian mobile number',
    }),
    authorisedCapital: Joi.string().optional(),
    paidUpCapital: Joi.string().optional(),
    businessActivity: Joi.string().optional(),
    financialYear: Joi.string().optional(),
    contactName: Joi.string().optional(),
    contactDesignation: Joi.string().optional(),
    contactMobile: Joi.string().optional(),
    contactEmail: Joi.string().email().optional(),
}).unknown(true);

const createComplianceSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().optional().allow('', null),
    complianceType: Joi.string().valid('MCA', 'GST', 'TDS', 'EPF_ESI', 'INC20A', 'BANK_ACCOUNT', 'PT', 'AUDIT').required(),
    category: Joi.string().valid('one-time', 'recurring').required(),
    section: Joi.string().valid('tax-financial', 'corporate-governance').required(),
    dueDate: Joi.date().iso().optional().allow(null),
    companyInfo: companyInfoSchema.optional(),
    formData: Joi.object().unknown(true).optional(),
});

const submitDocumentsSchema = Joi.object({
    documents: Joi.array().items(
        Joi.object({
            key: Joi.string().required(),
            name: Joi.string().required(),
            base64: Joi.string().required(),
            mimeType: Joi.string().valid('application/pdf', 'image/jpeg', 'image/png').optional(),
        })
    ).min(1).required(),
    notes: Joi.string().optional().allow('', null),
    formData: Joi.object().unknown(true).optional(),
});

const updateComplianceStatusSchema = Joi.object({
    id: Joi.number().required(),
    status: Joi.string().valid('under_review', 'approved', 'rejected', 'reopened').optional(),
    adminStatus: Joi.string().valid('under_review', 'approved', 'rejected', 'reopened').optional(),
    remarks: Joi.string().optional().allow('', null),
    adminRemarks: Joi.string().optional().allow('', null),
    rejectedDocumentKeys: Joi.array().items(Joi.string()).optional().allow(null),
    rejectedFormFields: Joi.array().items(Joi.string()).optional().allow(null),
}).or('status', 'adminStatus');

exports.validateCreateCompliance = (req, res, next) => {
    const { error, value } = createComplianceSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        const messages = error.details.map((d) => d.message).join(', ');
        return next(new ErrorResponse(messages, 400));
    }
    req.validatedBody = value;
    next();
};

exports.validateSubmitDocuments = (req, res, next) => {
    const { error, value } = submitDocumentsSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        const messages = error.details.map((d) => d.message).join(', ');
        return next(new ErrorResponse(messages, 400));
    }
    req.validatedBody = value;
    next();
};

exports.validateUpdateComplianceStatus = (req, res, next) => {
    console.log('validateUpdateComplianceStatus req.body:', JSON.stringify(req.body, null, 2));
    const { error, value } = updateComplianceStatusSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        const messages = error.details.map((d) => d.message).join(', ');
        return next(new ErrorResponse(messages, 400));
    }
    req.validatedBody = value;
    next();
};
