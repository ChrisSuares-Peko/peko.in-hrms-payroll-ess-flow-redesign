const Joi = require('joi');

const respond = (res, error) =>
    res.status(400).json({ status: false, message: error.details[0].message });

// GET /visa/search
exports.validateVisaSearch = (req, res, next) => {
    const schema = Joi.object({
        residency:          Joi.number().integer().required(),
        nationality:        Joi.number().integer().required(),
        destination:        Joi.number().integer().required(),
        category:           Joi.string().valid('Tourist', 'Business').default('Tourist'),
        adult:              Joi.number().integer().min(0).max(50).default(1),
        child:              Joi.number().integer().min(0).max(50).default(0),
        infant:             Joi.number().integer().min(0).max(50).default(0),
        travelDate:         Joi.date().iso().optional(),
        billing_state_code: Joi.string().trim().default('27'),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return respond(res, error);
    req.query = value;
    next();
};

// GET /visa/product-documents
exports.validateProductDocuments = (req, res, next) => {
    const schema = Joi.object({
        product_id: Joi.number().integer().required(),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return respond(res, error);
    req.query = value;
    next();
};

// GET /visa/product-content
exports.validateProductContent = (req, res, next) => {
    const schema = Joi.object({
        visatype:    Joi.string().trim().required(),
        residency:   Joi.number().integer().required(),
        nationality: Joi.number().integer().required(),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return respond(res, error);
    req.query = value;
    next();
};

// POST /visa/order/create
exports.validateCreateOrder = (req, res, next) => {
    const applicantSchema = Joi.object({
        first_name:  Joi.string().trim().required(),
        last_name:   Joi.string().trim().required(),
        dob:         Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
            'string.pattern.base': 'dob must be in YYYY-MM-DD format',
        }),
        passport_no: Joi.string().trim().required(),
    });

    const schema = Joi.object({
        product_id:                     Joi.number().integer().required(),
        applicants:                     Joi.array().items(applicantSchema).min(1).required(),
        travel_date:                    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
            'string.pattern.base': 'travel_date must be in YYYY-MM-DD format',
        }),
        amount:                         Joi.number().greater(0).required(),
        adult:                          Joi.number().integer().min(1).default(1),
        child:                          Joi.number().integer().min(0).default(0),
        infant:                         Joi.number().integer().min(0).default(0),
        residency:                      Joi.number().integer().default(103),
        nationality:                    Joi.number().integer().default(103),
        customer_first_name:            Joi.string().trim().required(),
        customer_last_name:             Joi.string().trim().required(),
        customer_email:                 Joi.string().email().required(),
        customer_mobile:                Joi.string().trim().required(),
        customer_billing_city:          Joi.string().trim().required(),
        customer_billing_state:         Joi.string().trim().required(),
        customer_billing_country:       Joi.string().trim().required(),
        customer_billing_address_line_1: Joi.string().trim().allow('').optional(),
        customer_billing_pincode:       Joi.string().trim().allow('').optional(),
        customer_billing_state_tax_code: Joi.string().trim().default('27'),
        visa_name:                      Joi.string().trim().optional(),
        visa_type:                      Joi.string().trim().optional(),
        destination_name:               Joi.string().trim().optional(),
        category:                       Joi.string().valid('Tourist', 'Business').optional(),
        base_currency:                  Joi.string().trim().default('INR'),
        unique_identifier:              Joi.string().trim().optional(),
        partner:                        Joi.string().trim().optional(),
        order_type:                     Joi.string().trim().optional(),
        source:                         Joi.string().trim().optional(),
        branch_code:                    Joi.string().trim().optional(),
        client_code:                    Joi.string().trim().optional(),
        group_name:                     Joi.string().trim().optional(),
        product_breakup:                Joi.object().optional().allow(null),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return respond(res, error);
    req.body = value;
    next();
};

// POST /visa/order/stage-document (multipart — validate body fields only, file checked in controller)
exports.validateStageDocument = (req, res, next) => {
    const schema = Joi.object({
        document_code: Joi.string().trim().required(),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return respond(res, error);
    req.body = value;
    next();
};

// GET /visa/order/applicant-documents
exports.validateApplicantDocuments = (req, res, next) => {
    const schema = Joi.object({
        application_id: Joi.number().integer().required(),
        order_number:   Joi.string().trim().required(),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return respond(res, error);
    req.query = value;
    next();
};

// POST /visa/order/upload-document  (multipart — validate body fields only, file checked in controller)
exports.validateUploadDocument = (req, res, next) => {
    const schema = Joi.object({
        document_code:  Joi.string().trim().valid('PASSPORT_FRONT', 'PASSPORT_BACK', 'PHOTOGRAPH', 'AADHAR_CARD', 'COVERING_LETTER').required(),
        application_id: Joi.alternatives().try(Joi.number().integer(), Joi.string()).required(),
        order_number:   Joi.string().trim().required(),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return respond(res, error);
    req.body = value;
    next();
};

// GET /visa/order/application-status
exports.validateApplicationStatus = (req, res, next) => {
    const schema = Joi.object({
        application_id: Joi.number().integer().required(),
        order_number:   Joi.string().trim().required(),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return respond(res, error);
    req.query = value;
    next();
};

// GET /visa/applications
exports.validateListApplications = (req, res, next) => {
    const schema = Joi.object({
        page:  Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return respond(res, error);
    req.query = value;
    next();
};

// GET /visa/bookings
exports.validateListBookings = (req, res, next) => {
    const schema = Joi.object({
        page:              Joi.number().integer().min(1).default(1),
        limit:             Joi.number().integer().min(1).max(100).default(10),
        from:              Joi.date().iso().optional(),
        to:                Joi.date().iso().optional(),
        paymentStatus:     Joi.string().valid('PENDING', 'PAID', 'FAILED', 'REFUNDED').optional(),
        applicationStatus: Joi.string().trim().optional(),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return respond(res, error);
    req.query = value;
    next();
};

// GET /visa/order/details
exports.validateOrderDetails = (req, res, next) => {
    const schema = Joi.object({
        order_number: Joi.string().trim().required(),
    });

    const { value, error } = schema.validate(req.query, { stripUnknown: true, convert: true });
    if (error) return respond(res, error);
    req.query = value;
    next();
};

// POST /visa/payment/wallet
exports.validateWalletPayment = (req, res, next) => {
    const stagedDocumentSchema = Joi.object({
        document_code: Joi.string().trim().required(),
        s3Key:         Joi.string().trim().required(),
    });

    const applicantSchema = Joi.object({
        first_name:     Joi.string().trim().required(),
        last_name:      Joi.string().trim().required(),
        dob:            Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
            'string.pattern.base': 'dob must be in YYYY-MM-DD format',
        }),
        passport_no:    Joi.string().trim().required(),
        contact_number: Joi.string().trim().allow('').optional(),
        documents:      Joi.array().items(stagedDocumentSchema).optional(),
    });

    // orderNumber present  => retry of a previously-FAILED payment; the vendor
    //                         order + documents already exist, so order-creation
    //                         fields are not required.
    // orderNumber absent   => first attempt; order-creation fields are required.
    const requiredUnlessRetry = Joi.any().when('orderNumber', {
        is: Joi.exist(),
        then: Joi.optional(),
        otherwise: Joi.required(),
    });

    const schema = Joi.object({
        orderNumber:      Joi.string().trim().optional(),
        amount:           Joi.number().greater(0).required(),
        totalAmount:      Joi.number().greater(0).optional(),
        payCashback:      Joi.boolean().default(false),
        addOns:           Joi.array().items(Joi.string().trim()).optional(),
        visa_type:        Joi.string().trim().optional(),
        // extra context fields passed by the frontend — forwarded to the order record
        accessKey:        Joi.string().trim().optional(),
        visaId:           Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
        productId:        Joi.number().integer().optional(),
        travellers:       Joi.object().optional(),
        companyName:      Joi.string().trim().allow('').optional(),
        billingEmail:     Joi.string().email().optional(),
        phoneNumber:      Joi.string().trim().optional(),
        billingAddress:   Joi.string().trim().allow('').optional(),
        destination_name: Joi.string().trim().optional(),
        visa_name:        Joi.string().trim().optional(),
        category:         Joi.string().trim().optional(),

        // ── order-creation fields — required on a first attempt (no orderNumber yet) ──
        product_id:                      Joi.number().integer().concat(requiredUnlessRetry),
        applicants:                      Joi.array().items(applicantSchema).min(1).concat(requiredUnlessRetry),
        // vendor order amount (visa cost only, excludes add-ons) — distinct from
        // `amount`/`totalAmount` which are the wallet debit (visa cost + add-ons)
        visa_amount:                     Joi.number().greater(0).concat(requiredUnlessRetry),
        travel_date:                     Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
        adult:                           Joi.number().integer().min(1).default(1),
        child:                           Joi.number().integer().min(0).default(0),
        infant:                          Joi.number().integer().min(0).default(0),
        residency:                       Joi.number().integer().default(103),
        nationality:                     Joi.number().integer().default(103),
        customer_first_name:             Joi.string().trim().optional(),
        customer_last_name:              Joi.string().trim().optional(),
        customer_email:                  Joi.string().email().optional(),
        customer_mobile:                 Joi.string().trim().optional(),
        customer_billing_city:           Joi.string().trim().optional(),
        customer_billing_state:          Joi.string().trim().optional(),
        customer_billing_country:        Joi.string().trim().optional(),
        customer_billing_address_line_1: Joi.string().trim().allow('').optional(),
        customer_billing_address_line_2: Joi.string().trim().allow('').optional(),
        customer_billing_pincode:        Joi.string().trim().allow('').optional(),
        customer_billing_state_tax_code: Joi.string().trim().default('27'),
        group_name:                      Joi.string().trim().optional(),
        unique_identifier:               Joi.string().trim().optional(),
        partner:                         Joi.string().trim().optional(),
        base_currency:                   Joi.string().trim().default('INR'),
        product_breakup:                 Joi.object().optional().allow(null),
    });

    const { value, error } = schema.validate(req.body, { stripUnknown: true, convert: true });
    if (error) return respond(res, error);
    req.body = value;
    next();
};
