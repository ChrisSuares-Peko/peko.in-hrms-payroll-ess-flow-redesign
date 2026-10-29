const asyncHandler = require('../../middlewares/async');
const visaOrders = require('../entities/visaOrder');
const credential = require('../entities/credential');
const serviceOperator = require('../entities/serviceOperator');
const sequelizeConfig = require('../../configs/database/index');
const { Op } = require('sequelize');

// Maps applicationStatus codes to step_dates keys used in the tracking UI.
// Codes set to null are kept for historical DB records but are not surfaced in step_dates.
const STATUS_TO_STEP_KEY = {
    // ── Common first steps (all three flows) ──────────────────────────────────
    NEW:                  'application_created',
    APPLICATION_CREATED:  'application_created',
    DOCS_UNDER_REVIEW:    'documents_under_review',
    DOCS_REJECTED:        'documents_under_review',   // QC failure; badge/step render distinguishes outcome
    // ── E-Visa flow ───────────────────────────────────────────────────────────
    PROCESSING:           'processing',
    // ── Representative Submission flow ────────────────────────────────────────
    PICKUP_SCHEDULED:     'documents_pickup_scheduled',
    EMBASSY_SUBMISSION:   'embassy_submission',
    DOCUMENTS_RETURNED:   'documents_returned',
    // ── Embassy Visit flow ────────────────────────────────────────────────────
    APPOINTMENT_BOOKED:   'appointment_booked',
    EMBASSY_VISIT:        'embassy_visit',
    // ── Shared terminal step (E-Visa + Representative flows) ─────────────────
    VISA_ISSUED:          'visa_issued',
    VISA_REJECTED:        'visa_issued',   // rejected is the same terminal step; badge distinguishes outcome
    // ── Legacy codes — kept in DB but not shown in tracking UI ───────────────
    DOCUMENTS_VERIFIED:   null,
    UNDER_REVIEW:         null,
    VISA_STAMPED:         null,
    DELIVERED:            null,
    VISA_DELIVERED:       null,
};

async function appendToStatusLog(orderNumber, stepKey) {
    const order = await visaOrders.findOne({ where: { orderNumber }, attributes: ['id', 'statusLog'] });
    if (!order) return;
    const existing = (order.statusLog && typeof order.statusLog === 'object') ? order.statusLog : {};
    if (existing[stepKey]) return;
    await visaOrders.update(
        { statusLog: { ...existing, [stepKey]: new Date().toISOString() } },
        { where: { orderNumber } }
    );
}

module.exports.createVisaOrder = asyncHandler(async (params) => {
    const {
        credentialId,
        serviceOperatorId,
        orderNumber,
        corporateTxnId,
        productId,
        productName,
        destination,
        visaFormat,
        visaCategory,
        amountInINR,
        baseCurrency,
        adult,
        child,
        infant,
        travelDate,
        applicants,
        orderResponse,
        product_breakup,
        addOns,
        visaType,
        paymentStatus,
        actualAmountPaid,
        statusLog,
    } = params;

    const order = await visaOrders.create({
        credentialId,
        serviceOperatorId,
        orderNumber,
        corporateTxnId,
        productId,
        productName,
        destination,
        visaFormat,
        visaType: visaType || null,
        visaCategory,
        amountInINR,
        baseCurrency: baseCurrency || 'INR',
        adult: adult || 1,
        child: child || 0,
        infant: infant || 0,
        travelDate,
        applicants,
        orderResponse: JSON.stringify(orderResponse),
        paymentStatus: paymentStatus || 'PENDING',
        applicationStatus: 'NEW',
        transactionDate: new Date(),
        product_breakup: product_breakup || null,
        addOns: addOns || null,
        actualAmountPaid: actualAmountPaid ?? null,
        statusLog: statusLog || { application_created: new Date().toISOString() },
    });

    return order;
});

module.exports.updateVisaOrderPaymentStatus = asyncHandler(async (params) => {
    const { orderNumber, paymentStatus, corporateTxnId, actualAmountPaid, addOns, visaType } = params;

    const updateData = { paymentStatus, corporateTxnId };
    if (actualAmountPaid !== undefined) updateData.actualAmountPaid = actualAmountPaid;
    if (addOns !== undefined) updateData.addOns = addOns;

    if (visaType) {
        const existing = await visaOrders.findOne({ where: { orderNumber }, attributes: ['visaFormat', 'visaType'] });
        if (!existing?.visaFormat) updateData.visaFormat = visaType;
        if (!existing?.visaType) updateData.visaType = visaType;
    }

    await visaOrders.update(updateData, { where: { orderNumber } });

    if (paymentStatus === 'PAID') {
        await appendToStatusLog(orderNumber, 'application_submitted');
    }
});

module.exports.updateVisaOrderApplicationStatus = asyncHandler(async (params) => {
    const { orderNumber, applicationStatus } = params;

    await visaOrders.update(
        { applicationStatus },
        { where: { orderNumber } }
    );

    const stepKey = STATUS_TO_STEP_KEY[applicationStatus];
    if (stepKey) await appendToStatusLog(orderNumber, stepKey);
});

module.exports.findVisaOrders = asyncHandler(async (params) => {
    const { credentialId, serviceOperatorId, limit = 10, page = 1 } = params;

    const where = { credentialId };
    if (serviceOperatorId) where.serviceOperatorId = serviceOperatorId;

    return visaOrders.findAndCountAll({
        where,
        order: [['transactionDate', 'DESC']],
        limit,
        offset: (page - 1) * limit,
        include: [
            { model: credential, attributes: ['id', 'username', 'email'] },
            { model: serviceOperator, attributes: ['id', 'accessKey'] },
        ],
    });
});

module.exports.findVisaOrderByOrderNumber = asyncHandler(async (orderNumber) => {
    return visaOrders.findOne({
        where: { orderNumber },
        include: [
            { model: credential, attributes: ['id', 'username', 'email'] },
        ],
    });
});

module.exports.findAllVisaOrders = asyncHandler(async (params) => {
    const {
        credentialId,
        registeredBy,
        from,
        to,
        paymentStatus,
        applicationStatus,
        limit = 10,
        page = 1,
    } = params;

    const where = {};
    if (credentialId) where.credentialId = credentialId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (applicationStatus) where.applicationStatus = applicationStatus;
    if (from && to) {
        const end = new Date(to);
        end.setDate(end.getDate() + 1);
        where.transactionDate = { [Op.between]: [new Date(from), end] };
    } else if (from) {
        where.transactionDate = { [Op.gte]: new Date(from) };
    } else if (to) {
        where.transactionDate = { [Op.lte]: new Date(to) };
    }

    const credentialWhere = {};
    if (registeredBy) credentialWhere.registeredBy = registeredBy;

    return visaOrders.findAndCountAll({
        where,
        order: [['transactionDate', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        include: [
            {
                model: credential,
                attributes: ['id', 'name', 'username', 'email'],
                where: Object.keys(credentialWhere).length ? credentialWhere : undefined,
                required: Object.keys(credentialWhere).length ? true : false,
            },
            { model: serviceOperator, attributes: ['id', 'accessKey', 'serviceProvider'], required: false },
        ],
    });
});

module.exports.updateVisaOrderDocuments = asyncHandler(async ({ orderNumber, applicationId, documentCode, s3Key, presignedUrl }) => {
    await sequelizeConfig.transaction(async (t) => {
        const order = await visaOrders.findOne({
            where: { orderNumber },
            lock: t.LOCK.UPDATE,
            transaction: t,
        });
        if (!order) return;

        const applicants = Array.isArray(order.applicants)
            ? order.applicants
            : JSON.parse(order.applicants || '[]');

        const updated = applicants.map(a =>
            String(a.id) === String(applicationId)
                ? {
                    ...a,
                    documents: {
                        ...(a.documents || {}),
                        [documentCode]: { key: s3Key, url: presignedUrl, uploadedAt: new Date().toISOString() },
                    },
                }
                : a
        );

        await visaOrders.update({ applicants: updated }, { where: { orderNumber }, transaction: t });
    });
});

module.exports.updateVisaDocumentStatus = async ({ orderNumber, documents }) => {
    const order = await visaOrders.findOne({ where: { orderNumber } });
    if (!order) return null;

    const existing = (() => {
        try {
            if (!order.documents) return {};
            const raw = typeof order.documents === 'string'
                ? JSON.parse(order.documents)
                : order.documents;
            if (Array.isArray(raw)) {
                return raw.reduce((acc, d) => {
                    if (d.document_code) acc[d.document_code] = d;
                    return acc;
                }, {});
            }
            return raw;
        } catch { return {}; }
    })();

    const incoming = Array.isArray(documents)
        ? documents.reduce((acc, d) => { if (d.document_code) acc[d.document_code] = d; return acc; }, {})
        : documents || {};

    const merged = { ...existing, ...incoming };

    await visaOrders.update({ documents: merged }, { where: { orderNumber } });

    return visaOrders.findOne({
        where: { orderNumber },
        include: [{ model: credential, attributes: ['id', 'username', 'email', 'name'] }],
        raw: false,
    });
};

module.exports.updateVisaOrderWebhookStatus = async (params) => {
    const { orderNumber, applicationStatus, currentStage, stageLabel, documents } = params;

    const updateData = { applicationStatus };
    if (currentStage !== undefined) updateData.currentStage = currentStage;
    if (stageLabel !== undefined) updateData.stageLabel = stageLabel;
    if (documents !== undefined) updateData.documents = documents;

    await visaOrders.update(updateData, { where: { orderNumber } });

    const stepKey = STATUS_TO_STEP_KEY[applicationStatus];
    if (stepKey) await appendToStatusLog(orderNumber, stepKey);

    return visaOrders.findOne({
        where: { orderNumber },
        include: [{ model: credential, attributes: ['id', 'username', 'email', 'name'] }],
        raw: false,
    });
};
