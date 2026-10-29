const Joi = require('@hapi/joi');

const ENACH_FREQUENCY_VALUES = [
    "Adhoc",
    "Daily",
    "Weekly",
    "Monthly",
    "Quarterly",
    "Semi-Annually",
    "Yearly",
    "Bi-Monthly",
];

const ENACH_CATEGORY_CODE_VALUES = [
    "API",
    "B2B",
    "CRED",
    "MAND",
    "EDU",
    "PREM",
    "PAYM",
    "LONS",
    "LONP",
    "MF",
    "OTH",
    "SUB",
    "TRE",
    "TAX",
    "ELEC",
    "GAS",
    "TELE",
    "WAT",
];

exports.validateStep1 = (req, res, next) => {
    try {
        const schema = Joi.object({
            businessName: Joi.string().trim().required(),
            bankName: Joi.string(),
            accountNumber: Joi.string(),
            ifsc: Joi.string()
                .uppercase()
        })

        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message],
                data: {},
            });
        }

        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: 'error', errors: [err.message], data: {} });
    }
};

exports.validatePanStep = (req, res, next) => {
    try {
        const schema = Joi.object({
            pan: Joi.string()
                .trim()
                .uppercase()
                .length(10)
                .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
                .required(),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message],
                data: {},
            });
        }

        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: 'error', errors: [err.message], data: {} });
    }
};

exports.validateSendPhoneOtp = (req, res, next) => {
    try {
        const schema = Joi.object({
            phone: Joi.string()
                .trim()
                .length(10)
                .regex(/^[6-9]\d{9}$/)
                .required(),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message],
                data: {},
            });
        }

        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: 'error', errors: [err.message], data: {} });
    }
};

exports.validateVerifyPhoneOtp = (req, res, next) => {
    try {
        const schema = Joi.object({
            phone: Joi.string()
                .trim()
                .length(10)
                .regex(/^[6-9]\d{9}$/)
                .required(),
            otp: Joi.string()
                .trim()
                .length(6)
                .regex(/^\d{6}$/)
                .required(),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message],
                data: {},
            });
        }

        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: 'error', errors: [err.message], data: {} });
    }
};

exports.validateBankStep = (req, res, next) => {
    try {
        const schema = Joi.object({
            accountNumber: Joi.string().required(),
            ifsc: Joi.string()
                .trim()
                .uppercase()
                .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/)
                .required(),
            name: Joi.string()
                .trim()
                .required(),
            phone: Joi.string()
                .trim()
                .optional(),
            phoneOtp: Joi.string()
                .trim()
                .length(6)
                .regex(/^\d{6}$/)
                .optional(),
            bankName: Joi.string().trim().allow('').optional(),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message],
                data: {},
            });
        }

        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: 'error', errors: [err.message], data: {} });
    }
};

exports.validateVerifyBank = (req, res, next) => {
    try {
        const schema = Joi.object({
            bankName: Joi.string().trim().required(),
            accountNumber: Joi.string().required(),
            ifsc: Joi.string()
                .trim()
                .uppercase()
                .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/)
                .required(),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message],
                data: {},
            });
        }

        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: 'error', errors: [err.message], data: {} });
    }
};

exports.validateStep2 = (req, res, next) => {
    try {
        const schema = Joi.object({
            consentAccepted: Joi.boolean().valid(true).required(),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message],
                data: {},
            });
        }

        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: 'error', errors: [err.message], data: {} });
    }
};

// Validation middleware for creating payment link, referencing body fields extracted in createPaymentLink controller
exports.validateCreatePaymentLink = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.number().positive().required(),
            purpose_message: Joi.string().trim().max(255).required(),
            expiry_time: Joi.number().integer().min(1).max(1440).optional(),
            customerName: Joi.string().trim().allow("").optional(),
            customerPhone: Joi.string().trim().allow("").optional(),
            accessKey: Joi.string().valid('invoice', 'payment_link').required(),
            invoiceId:Joi.string().allow("").optional()
        });

        const result = schema.validate(req.body);

        if (result.error) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message],
                data: {},
            });
        }

        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: 'error', errors: [err.message], data: {} });
    }
};

// NuPay Collection 360 initiate_transaction: amount + 10-digit payer mobile are mandatory;
// name / email / purpose are optional. Kept separate from validateCreatePaymentLink (Decentro).
exports.validateCreateNupayCollect = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.number().positive().max(100000).required(),
            purpose_message: Joi.string().trim().max(50).allow("").optional(),
            customerName: Joi.string().trim().allow("").optional(),
            customerEmail: Joi.string().trim().email().allow("").optional(),
            customerPhone: Joi.string().trim().regex(/^\d{10}$/).required(),
            accessKey: Joi.string().valid('invoice', 'payment_link').optional(),
            expiry_time: Joi.number().integer().optional(),
            invoiceId: Joi.string().allow("").optional(),
        });

        const result = schema.validate(req.body);

        if (result.error) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message],
                data: {},
            });
        }

        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: 'error', errors: [err.message], data: {} });
    }
};

exports.validateCreateDynamicQr = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.number().positive().required(),
            purpose_message: Joi.string().trim().min(5).max(50).required(),
            expiry_time: Joi.number().integer().min(1).max(1440).required(),
        });

        const result = schema.validate(req.body);

        if (result.error) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message],
                data: {},
            });
        }

        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: 'error', errors: [err.message], data: {} });
    }
};

exports.validateCreateEnachMandate = (req, res, next) => {
    try {
        const schema = Joi.object({
            customer_name: Joi.string().trim().required(),
            customer_phone: Joi.string().trim().required(),
            customer_email: Joi.string().email().allow("", null).optional(),
            account_number: Joi.string().trim().required(),
            account_type: Joi.string().trim().uppercase().valid("SAVINGS", "CURRENT").required(),
            bank_code: Joi.string().trim().required(),
            authentication_mode: Joi.string().trim().valid("DebitCard", "NetBanking", "Aadhaar", "PAN", "CustomerID").required(),
            amount_rule: Joi.string().trim().lowercase().valid("fixed", "max").required(),
            amount: Joi.number().positive().required(),
            frequency: Joi.string().trim().valid(...ENACH_FREQUENCY_VALUES).required(),
            category_code: Joi.string().trim().uppercase().valid(...ENACH_CATEGORY_CODE_VALUES).required(),
            start_date: Joi.date().required(),
            end_date: Joi.date().required(),

        });

        const result = schema.validate(req.body);

        if (result.error) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message],
                data: {},
            });
        }

        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: 'error', errors: [err.message], data: {} });
    }
};

exports.validateSettlementRequest = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.number().positive().required(),
            transferType: Joi.string().valid("IMPS", "NEFT").default("IMPS").optional(),
            remarks: Joi.string().max(250).allow("").optional(),
        });

        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(400).json({
                code: 400,
                status: "error",
                errors: [result.error.details[0].message],
                data: {},
            });
        }

        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: "error", errors: [err.message], data: {} });
    }
};

exports.validateGetTransactions = (req, res, next) => {
    try {
        const schema = Joi.object({
            accessKey: Joi.string().valid('payment_link', 'invoice').default('payment_link').optional(),
            page: Joi.number().integer().min(1).optional(),
            limit: Joi.number().integer().min(1).max(100).optional(),
            status: Joi.string().allow('', null).optional(),
            search: Joi.string().allow('', null).optional(),
            sort: Joi.string().valid('ASC', 'DESC').default('DESC').optional(),
            sortField: Joi.string().default('createdAt').optional(),
            startDate: Joi.string().isoDate().allow('', null).optional(),
            endDate: Joi.string().isoDate().allow('', null).optional(),
            // invoice-only filters
            paymentMethod: Joi.string().allow('', null).optional(),
            customer: Joi.string().allow('', null).optional(),
        });

        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });

        if (error) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                errors: [error.details[0].message],
                data: {},
            });
        }

        req.query = value;
        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: 'error', errors: [err.message], data: {} });
    }
};

exports.validateExecuteEnachMandate = (req, res, next) => {
    try {
        const schema = Joi.object({
            amount: Joi.number().positive().required(),
            debit_date: Joi.string().required(),
            split_settlement_rule_urn: Joi.string().max(255).optional(),
        });

        const result = schema.validate(req.body);

        if (result.error) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message],
                data: {},
            });
        }

        next();
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err);
        res.json({ code: err.code, status: 'error', errors: [err.message], data: {} });
    }
};

exports.validateUpdateVirtualAccount = (req, res, next) => {
    try {
        const schema = Joi.object({
            name:    Joi.string().trim().required(),
            pan:     Joi.string().trim().uppercase().length(10)
                         .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
            email:   Joi.string().trim().email().optional(),
            mobile:  Joi.string().trim().length(10).regex(/^\d{10}$/).optional(),
            address: Joi.string().trim().optional(),
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400, status: 'error',
                errors: [result.error.details[0].message],
            });
        }
        next();
    } catch (err) {
        res.json({ code: err.code, status: 'error', errors: [err.message] });
    }
};
