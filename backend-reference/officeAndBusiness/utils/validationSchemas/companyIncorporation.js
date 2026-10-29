const Joi = require('joi');

const applicantDetailsSchema = Joi.object({
    fullName: Joi.string().required().trim(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
    state: Joi.string().required(),
});

const proposedNamesSchema = Joi.object({
    firstChoice: Joi.string().required().trim(),
    secondChoice: Joi.string().allow('').optional(),
    thirdChoice: Joi.string().allow('').optional(),
});

const registeredOfficeSchema = Joi.object({
    availability: Joi.string().valid('have', 'need').required(),
    officeType: Joi.string().when('availability', {
        is: 'have',
        then: Joi.string().valid('rented', 'owned', 'shared_office').required(),
        otherwise: Joi.string().allow(''),
    }),
    address: Joi.string().when('availability', {
        is: 'have',
        then: Joi.string().required(),
        otherwise: Joi.string().allow(''),
    }),
    state: Joi.string().optional().allow(''),
    hasIdProof: Joi.boolean().default(false),
});

const directorSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
    nationality: Joi.string().required(),
    panNumber: Joi.when('nationality', {
        is: 'Indian',
        then: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
        otherwise: Joi.string().allow('').optional(),
    }),
    passportNumber: Joi.when('nationality', {
        is: Joi.not('Indian'),
        then: Joi.string().min(5).max(20).required(),
        otherwise: Joi.string().allow('').optional(),
    }),
    din: Joi.string().allow('').optional(),
    aadhaar: Joi.string().allow('').optional(),
    hasDIN: Joi.boolean().default(false),
    hasDSC: Joi.boolean().default(false),
    requestDINfromPeko: Joi.boolean().default(false),
    requestDSCfromPeko: Joi.boolean().default(false),
    educationQualification: Joi.string().required().trim(),
    occupation: Joi.string().required().trim(),
    placeOfBirth: Joi.when('nationality', {
        is: 'Indian',
        then: Joi.object({
            state: Joi.string().required(),
            district: Joi.string().required(),
        }).required(),
        otherwise: Joi.object({
            state: Joi.string().allow('').optional(),
            district: Joi.string().allow('').optional(),
        }).optional(),
    }),
});

// Additional shareholders are share-owners, not directors. The FE drawer only
// collects name/nationality/email/mobile/PAN (or passport), so the BE accepts a
// leaner schema and treats director-style fields as optional.
const additionalShareholderSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
    nationality: Joi.string().required(),
    panNumber: Joi.when('nationality', {
        is: 'Indian',
        then: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
        otherwise: Joi.string().allow('').optional(),
    }),
    passportNumber: Joi.when('nationality', {
        is: Joi.not('Indian'),
        then: Joi.string().min(5).max(20).required(),
        otherwise: Joi.string().allow('').optional(),
    }),
    din: Joi.string().allow('').optional(),
    aadhaar: Joi.string().allow('').optional(),
    hasDIN: Joi.boolean().default(false),
    hasDSC: Joi.boolean().default(false),
    requestDINfromPeko: Joi.boolean().default(false),
    requestDSCfromPeko: Joi.boolean().default(false),
    educationQualification: Joi.string().allow('').optional(),
    occupation: Joi.string().allow('').optional(),
    placeOfBirth: Joi.object({
        state: Joi.string().allow('').optional(),
        district: Joi.string().allow('').optional(),
    }).optional(),
});

const capitalSchema = Joi.object({
    authorizedCapital: Joi.number().positive().required(),
    paidUpCapital: Joi.number().min(0).required(),
    faceValuePerShare: Joi.number().positive().optional(),
    shareholders: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            shareholding: Joi.number().min(0).max(100).required(),
            sharesAllotted: Joi.number().min(0).optional(),
            email: Joi.string().email().allow('').optional(),
            mobile: Joi.string().pattern(/^[0-9]{10}$/).allow('').optional(),
            panNumber: Joi.string()
                .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
                .allow('')
                .optional(),
            passportNumber: Joi.string().allow('').optional(),
            nationality: Joi.string().allow('').optional(),
        })
    ),
});

const businessActivitySchema = Joi.object({
    section: Joi.string().required(),
    division: Joi.string().required(),
    group: Joi.string().allow('').optional(),
    class: Joi.string().allow('').optional(),
    subclass: Joi.string().allow('').optional(),
    secondaryActivity: Joi.string().allow('').optional(),
    otherActivities: Joi.string().allow('').optional(),
    description: Joi.string().required(),
});

const moaAoaSchema = Joi.object({
    moaType: Joi.string().valid('standard', 'custom').default('standard'),
    aoaType: Joi.string().valid('standard', 'customized').default('standard'),
    confirmed: Joi.boolean().default(false),
});

const llpAgreementSchema = Joi.object({
    agreementType: Joi.string().valid('standard', 'custom').default('standard'),
    partnerRights: Joi.object().required(),
    partnerDuties: Joi.object().required(),
    meetingQuorum: Joi.string().required(),
    votingThreshold: Joi.string().required(),
    disputeResolution: Joi.object({
        method: Joi.string().required(),
        jurisdiction: Joi.string().required(),
    }).required(),
    confirmed: Joi.boolean().default(false),
});

const nomineeSchema = Joi.object({
    name: Joi.string().required().trim(),
    email: Joi.string().email().required(),
    mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
    nationality: Joi.string().required(),
    panNumber: Joi.when('nationality', {
        is: 'Indian',
        then: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
        otherwise: Joi.string().allow('').optional(),
    }),
    passportNumber: Joi.when('nationality', {
        is: Joi.not('Indian'),
        then: Joi.string().min(5).max(20).required(),
        otherwise: Joi.string().allow('').optional(),
    }),
    din: Joi.string().allow('').optional(),
    aadhaar: Joi.string().allow('').optional(),
    hasDIN: Joi.boolean().default(false),
    requestDINfromPeko: Joi.boolean().default(false),
    educationQualification: Joi.string().required().trim(),
    occupation: Joi.string().required().trim(),
    placeOfBirth: Joi.when('nationality', {
        is: 'Indian',
        then: Joi.object({
            state: Joi.string().required(),
            district: Joi.string().required(),
        }).required(),
        otherwise: Joi.object({
            state: Joi.string().allow('').optional(),
            district: Joi.string().allow('').optional(),
        }).optional(),
    }),
});

const submitApplicationSchema = Joi.object({
    entityType: Joi.string()
        .valid('private_limited', 'public_limited', 'opc', 'llp')
        .required(),
    applicantDetails: applicantDetailsSchema.required(),
    proposedNames: proposedNamesSchema.required(),
    registeredOffice: registeredOfficeSchema.required(),
    directors: Joi.array().items(directorSchema).min(1).required(),
    additionalShareholders: Joi.array().items(additionalShareholderSchema).optional().default([]),
    llpNicCodes: Joi.when('entityType', {
        is: 'llp',
        then: Joi.string().allow('').optional(),
        otherwise: Joi.any().strip(),
    }),
    llpTotalCapital: Joi.when('entityType', {
        is: 'llp',
        then: Joi.string().allow('').optional(),
        otherwise: Joi.any().strip(),
    }),
    capital: capitalSchema.optional(),
    businessActivity: businessActivitySchema.required(),
    moaAoa: Joi.when('entityType', {
        is: Joi.string().valid('private_limited', 'public_limited', 'opc'),
        then: moaAoaSchema,
        otherwise: Joi.forbidden(),
    }),
    llpAgreement: Joi.when('entityType', {
        is: 'llp',
        then: llpAgreementSchema,
        otherwise: Joi.forbidden(),
    }),
    documents: Joi.array().items(
        Joi.object({
            docType: Joi.string().required(),
            fileName: Joi.string().required(),
            fileUrl: Joi.string().required(),
            mimeType: Joi.string().required(),
        })
    ).optional(),
    nominee: Joi.when('entityType', {
        is: 'opc',
        then: nomineeSchema.required(),
        otherwise: Joi.any().strip(),
    }),
    selectedServices: Joi.array().items(Joi.string()).default([]),
});

const updateStatusSchema = Joi.object({
    status: Joi.string()
        .valid('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')
        .required(),
    rejectionReason: Joi.string().when('status', {
        is: 'REJECTED',
        then: Joi.string().required(),
        otherwise: Joi.string().optional(),
    }),
    notes: Joi.string().optional(),
});

const verifyDocumentSchema = Joi.object({
    status: Joi.string().valid('VERIFIED', 'REJECTED').required(),
    verificationNotes: Joi.string().optional(),
});

module.exports = {
    submitApplicationSchema,
    updateStatusSchema,
    verifyDocumentSchema,
    applicantDetailsSchema,
    proposedNamesSchema,
    registeredOfficeSchema,
    directorSchema,
    capitalSchema,
    businessActivitySchema,
    moaAoaSchema,
    llpAgreementSchema,
    nomineeSchema,
};
