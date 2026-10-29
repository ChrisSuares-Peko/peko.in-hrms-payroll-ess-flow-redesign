'use strict';
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const CarReportPlansUseCase = require('../../models/use-cases/carReportPlans');
const { invalidatePlansCache } = require('../../utils/carReportPlans');

const REPORT_TYPES = ['valuation', 'history', 'inspection'];
const COMMISSION_MODES = ['MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'];
const COMMISSION_TYPES = ['PERCENTAGE', 'FLAT'];

// Only the commission fields the request actually sent.
const toCommissionPayload = (body) => {
    const data = {};
    if (body.commissionMode !== undefined) data.commissionMode = body.commissionMode;
    if (body.commissionType !== undefined) data.commissionType = body.commissionType;
    if (body.commission !== undefined) data.commission = Number(body.commission) || 0;
    if (body.fixedCommissionPerTransaction !== undefined) {
        data.fixedCommissionPerTransaction = Number(body.fixedCommissionPerTransaction) || 0;
    }
    if (body.isCommissionInclGST !== undefined) data.isCommissionInclGST = Boolean(body.isCommissionInclGST);
    return data;
};

const toPlanPayload = (body) => ({
    reportType: body.reportType,
    // packageId only means something for inspection; flat products store null.
    packageId: body.reportType === 'inspection' ? body.packageId || null : null,
    displayName: body.displayName,
    price: body.price,
    vendorProductCode: body.vendorProductCode || null,
    sortOrder: Number(body.sortOrder) || 0,
    ...toCommissionPayload(body),
});

const validateCommission = (body, price) => {
    const { commissionMode, commissionType, commission, fixedCommissionPerTransaction } = body;
    if (commissionMode != null && !COMMISSION_MODES.includes(commissionMode)) return 'Invalid commission mode';
    if (commissionType != null && !COMMISSION_TYPES.includes(commissionType)) return 'Invalid commission type';
    if (commission != null && commission !== '') {
        const value = Number(commission);
        if (!Number.isFinite(value) || value < 0) return 'Commission cannot be negative';
        if (commissionType === 'PERCENTAGE' && value > 100) return 'Commission cannot exceed 100% when type is Percentage';
        if (commissionType === 'FLAT' && value > price) return 'Commission cannot exceed the price when type is Flat';
    }
    if (fixedCommissionPerTransaction != null && fixedCommissionPerTransaction !== '') {
        const value = Number(fixedCommissionPerTransaction);
        if (!Number.isFinite(value) || value < 0) return 'Fixed commission cannot be negative';
    }
    return null;
};

const validate = (body) => {
    if (!REPORT_TYPES.includes(body.reportType)) return 'A valid reportType is required';
    if (body.reportType === 'inspection' && !body.packageId) return 'packageId is required for inspection plans';
    if (!body.displayName) return 'displayName is required';
    const price = Number(body.price);
    if (!Number.isFinite(price) || !(price > 0)) return 'A valid price is required';
    return validateCommission(body, price);
};

// GET / — paginated list for the admin table.
exports.getAllPlans = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const itemsPerPage = Math.min(100, Math.max(1, parseInt(req.query.itemsPerPage, 10) || 10));

    const { rows, count } = await CarReportPlansUseCase.findAllAndCount({
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        searchText: (req.query.searchText || '').toString().trim(),
        sort: req.query.sort,
        sortField: req.query.sortField,
        reportType: (req.query.reportType || '').toString().trim(),
        isAdmin: true,
    });

    return res.status(200).json({
        status: true,
        data: { plans: rows, count },
        message: 'Car report plans fetched successfully',
        responseCode: '000',
    });
});

exports.createPlan = asyncHandler(async (req, res, next) => {
    const invalid = validate(req.body);
    if (invalid) return next(new ErrorResponse(invalid, 400));

    const payload = toPlanPayload(req.body);
    if (await CarReportPlansUseCase.findDuplicate(payload)) {
        return next(new ErrorResponse('A plan for this product already exists', 400));
    }

    const plan = await CarReportPlansUseCase.create(payload);
    await invalidatePlansCache();

    return res.status(201).json({
        status: true,
        data: plan,
        message: 'Car report plan created successfully',
        responseCode: '000',
    });
});

exports.updatePlan = asyncHandler(async (req, res, next) => {
    const existing = await CarReportPlansUseCase.findById(req.params.id);
    if (!existing) return next(new ErrorResponse('Plan not found', 404));

    const invalid = validate({ ...existing, ...req.body });
    if (invalid) return next(new ErrorResponse(invalid, 400));

    // reportType/packageId are the product's identity — orders reference it, so edits
    // are limited to price, naming, vendor code and ordering.
    await CarReportPlansUseCase.update(req.params.id, {
        displayName: req.body.displayName ?? existing.displayName,
        price: req.body.price ?? existing.price,
        vendorProductCode:
            req.body.vendorProductCode !== undefined
                ? req.body.vendorProductCode || null
                : existing.vendorProductCode,
        sortOrder: req.body.sortOrder ?? existing.sortOrder,
        ...toCommissionPayload(req.body),
    });
    await invalidatePlansCache();

    return res.status(200).json({
        status: true,
        data: {},
        message: 'Car report plan updated successfully',
        responseCode: '000',
    });
});

// PUT /status/:id — deactivate rather than delete: old orders reference the product.
exports.updateStatus = asyncHandler(async (req, res, next) => {
    const existing = await CarReportPlansUseCase.findById(req.params.id);
    if (!existing) return next(new ErrorResponse('Plan not found', 404));

    await CarReportPlansUseCase.update(req.params.id, { status: !!req.body.status });
    await invalidatePlansCache();

    return res.status(200).json({
        status: true,
        data: {},
        message: 'Car report plan status updated successfully',
        responseCode: '000',
    });
});
