'use strict';
const fs = require('fs');
const axios = require('axios');
const puppeteer = require('puppeteer');
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const DomainHostingPlansUseCase = require('../../models/use-cases/domainHostingPlans');
const { getValue, setValue } = require('../../utils/cacheDataMethods');
const { findServiceOperatorByAccessKey } = require('../../utils/checkAndFetchServiceDetails');
const operatorsData = require('../../utils/operatorsData.json');

const accessKey = operatorsData?.domainAndHosting?.accessKey;
const { resolvePlanPricingDetails } = require('../../utils/resolveDomainHostingPrice');
const { customLog } = require('../../utils/loggerHelper');
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { reportPdfTemplate } = require('../../utils/reportTemplate');

const PLAN_TYPE_LABELS = {
    vps_server: 'VPS Server',
    shared_hosting: 'Shared Hosting',
    titan_email: 'Titan Email',
    google_workspace: 'Google Workspace',
    backup: 'Backup',
};

const ALLOWED_PLAN_TYPES = ['vps_server', 'shared_hosting', 'titan_email', 'google_workspace', 'backup'];

const fetchAndCachePricing = async () => {
    try {
        const serviceOperator = await findServiceOperatorByAccessKey(accessKey);
        if (!serviceOperator || serviceOperator.error) return null;
        const vendor = serviceOperator.vendor;
        const config = {
            method: 'GET',
            url: `${vendor.apiUrl}/api/products/customer-price.json`,
            params: {
                'auth-userid': vendor.optional1,
                'api-key': vendor.optional2,
            },
        };
        customLog(null, 'info', { message: 'fetchAndCachePricing ~ config', data: config }, 'VENDOR', ['api-key']);
        const response = await axios(config);
        customLog(null, 'info', { message: 'fetchAndCachePricing ~ response', data: response?.data }, 'VENDOR');
        const pricingData = response.data;
        await setValue('reseller_pricing', 60 * 60 * 12, JSON.stringify(pricingData));
        return pricingData;
    } catch (error) {
        customLog(null, 'error', { message: 'fetchAndCachePricing failed', data: error?.response?.data || error?.message });
        return null;
    }
};

const enrichWithPrice = async (plans) => {
    let pricingData = null;
    try {
        const cached = await getValue('reseller_pricing');
        if (cached) {
            pricingData = JSON.parse(cached);
        } else {
            pricingData = await fetchAndCachePricing();
        }
    } catch {
        // cache unavailable or fetch failed — return plans without price
    }
    return plans.map(p => {
        let currentPrice = null;
        try {
            if (pricingData && p.productId) {
                currentPrice = resolvePlanPricingDetails(pricingData, p.productId, p.planId);
            }
        } catch {
            // price resolution failure for a single plan must not break the response
        }
        return { ...p, currentPrice };
    });
};

exports.createPlan = asyncHandler(async (req, res, next) => {
    const {
        planType, planName, productId, planId, billingCycle, description, features,
        commissionMode, commissionType, commission, fixedCommissionPerTransaction, isCommissionInclGST,
    } = req.body;

    if (!planType || !planName || !productId) {
        return next(new ErrorResponse('planType, planName, and productId are required', 400));
    }
    if (!ALLOWED_PLAN_TYPES.includes(planType)) {
        return next(new ErrorResponse(`Invalid planType. Allowed: ${ALLOWED_PLAN_TYPES.join(', ')}`, 400));
    }

    const existing = await DomainHostingPlansUseCase.findByVendorKey({ productId, planId, billingCycle });
    if (existing) {
        return next(new ErrorResponse(`A plan with this productId/planId/billingCycle combination already exists`, 409));
    }

    const created = await DomainHostingPlansUseCase.create({
        planType,
        planName,
        productId,
        planId: planId || null,
        billingCycle: billingCycle || null,
        description: description || null,
        features: features ? JSON.stringify(features) : null,
        commissionMode: commissionMode || 'MARGIN',
        commissionType: commissionType || 'PERCENTAGE',
        commission: commission || 0,
        fixedCommissionPerTransaction: fixedCommissionPerTransaction || 0,
        isCommissionInclGST: isCommissionInclGST != null ? isCommissionInclGST : true,
    });

    if (!created) {
        return next(new ErrorResponse('Something went wrong while creating the plan', 500));
    }

    const [enriched] = await enrichWithPrice([created.toJSON ? created.toJSON() : created]);

    return res.status(200).json({
        status: true,
        message: 'Plan created successfully',
        data: enriched,
        responseCode: '000'
    });
});

exports.getAllPlans = asyncHandler(async (req, res, next) => {
    let { searchText, page, itemsPerPage, planType } = req.query;

    const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    const sortField = req.query.sortField || 'createdAt';

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    const limit = itemsPerPage || null;
    const offset = page && itemsPerPage ? (page - 1) * itemsPerPage : undefined;

    const result = await DomainHostingPlansUseCase.findAllAndCount({
        limit, offset, searchText, sort, sortField, planType
    });

    if (!result) {
        return next(new ErrorResponse('Something went wrong while fetching plans', 500));
    }

    const rows = await enrichWithPrice(result.rows);

    return res.status(200).json({
        status: true,
        data: {
            recordsTotal: result.count,
            recordsFiltered: result.count,
            data: rows
        },
        message: 'Records fetched successfully',
        responseCode: '000'
    });
});

exports.updatePlan = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    // price is intentionally excluded — it is read-only, sourced from vendor cache
    const {
        planType, planName, productId, planId, billingCycle, description, features,
        commissionMode, commissionType, commission, fixedCommissionPerTransaction, isCommissionInclGST,
    } = req.body;

    if (planType && !ALLOWED_PLAN_TYPES.includes(planType)) {
        return next(new ErrorResponse(`Invalid planType. Allowed: ${ALLOWED_PLAN_TYPES.join(', ')}`, 400));
    }

    if (productId || planId !== undefined || billingCycle !== undefined) {
        const existing = await DomainHostingPlansUseCase.findByVendorKey(
            { productId, planId, billingCycle },
            id
        );
        if (existing) {
            return next(new ErrorResponse(`A plan with this productId/planId/billingCycle combination already exists`, 409));
        }
    }

    const data = {};
    if (planType !== undefined) data.planType = planType;
    if (planName !== undefined) data.planName = planName;
    if (productId !== undefined) data.productId = productId;
    if (planId !== undefined) data.planId = planId || null;
    if (billingCycle !== undefined) data.billingCycle = billingCycle || null;
    if (description !== undefined) data.description = description;
    if (features !== undefined) data.features = typeof features === 'string' ? features : JSON.stringify(features);
    if (commissionMode !== undefined) data.commissionMode = commissionMode;
    if (commissionType !== undefined) data.commissionType = commissionType;
    if (commission !== undefined) data.commission = commission;
    if (fixedCommissionPerTransaction !== undefined) data.fixedCommissionPerTransaction = fixedCommissionPerTransaction;
    if (isCommissionInclGST !== undefined) data.isCommissionInclGST = isCommissionInclGST;

    const result = await DomainHostingPlansUseCase.update(id, data);
    if (!result) {
        return next(new ErrorResponse('Something went wrong while updating the plan', 400));
    }

    return res.status(200).json({
        status: true,
        message: 'Plan updated successfully',
        data: {},
        responseCode: '000'
    });
});

exports.updateStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (typeof status !== 'boolean') {
        return next(new ErrorResponse('status must be a boolean', 400));
    }

    const result = await DomainHostingPlansUseCase.update(id, { status });
    if (!result) {
        return next(new ErrorResponse('Something went wrong while updating status', 400));
    }

    return res.status(200).json({
        status: true,
        message: 'Status updated successfully',
        data: {},
        responseCode: '000'
    });
});

exports.deletePlan = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const result = await DomainHostingPlansUseCase.deletePlan(id);
    if (!result) {
        return next(new ErrorResponse('Something went wrong while deleting the plan', 400));
    }

    return res.status(200).json({
        status: true,
        message: 'Plan deleted successfully',
        data: {},
        responseCode: '000'
    });
});

const getExportData = async (params) => {
    const { searchText, sort, sortField } = params;
    const result = await DomainHostingPlansUseCase.findAllAndCount({
        limit: null, offset: undefined, searchText, sort, sortField
    });
    if (!result || result.rows.length < 1) return null;
    return result.rows.map(p => ({
        'Plan Name': p.planName || '-',
        'Plan Type': PLAN_TYPE_LABELS[p.planType] || p.planType || '-',
        'Product ID': p.productId || '-',
        'Plan ID': p.planId || '-',
        'Billing Cycle': p.billingCycle ? `${p.billingCycle} Month(s)` : '-',
        'Status': p.status ? 'Active' : 'Inactive',
    }));
};

exports.exportExcelCSV = asyncHandler(async (req, res, next) => {
    const { type } = req.params;
    const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    const sortField = req.query.sortField || 'createdAt';
    const { searchText } = req.query;

    const data = await getExportData({ searchText, sort, sortField });
    if (!data) {
        return next(new ErrorResponse('No data available for export', 400));
    }

    const { buffer, fileType } = await generateExcelBufferAndType(data, type);
    return res.status(200).json({
        status: true,
        data: { buffer, fileType },
        message: 'Fetched excel/csv data successfully',
        responseCode: '000'
    });
});

exports.refetchPricing = asyncHandler(async (_req, res, next) => {
    try {
        const pricingData = await fetchAndCachePricing();
        if (!pricingData) {
            return next(new ErrorResponse('Failed to fetch pricing from vendor', 500));
        }
        return res.status(200).json({
            status: true,
            message: 'Customer pricing refreshed successfully',
            data: {},
            responseCode: '000',
        });
    } catch (error) {
        return next(new ErrorResponse('Failed to refresh pricing', 500));
    }
});

exports.exportPDF = asyncHandler(async (req, res, next) => {
    const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    const sortField = req.query.sortField || 'createdAt';
    const { searchText } = req.query;

    const data = await getExportData({ searchText, sort, sortField });
    if (!data) {
        return next(new ErrorResponse('No data available for export', 400));
    }

    const templateDetails = { title: 'Domain & Hosting Plans Report' };
    const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
    const random = new Date().valueOf();

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });

    const outputFile = `report-${random}.pdf`;
    await page.pdf({ path: outputFile, format: 'A4', preferCSSPageSize: true });
    await browser.close();

    const buffer = fs.readFileSync(outputFile);
    fs.unlinkSync(outputFile);

    return res.status(200).json({
        status: true,
        message: 'Report generated successfully',
        data: { buffer, fileType: 'application/pdf' },
        responseCode: '000'
    });
});

const PRODUCT_TYPE_MAP = {
    virtualserverlinuxin: 'vps_server',
    virtualserverlinuxus: 'vps_server',
    singledomainhostinglinuxin: 'shared_hosting',
    singledomainhostingwindowsin: 'shared_hosting',
    singledomainhostinglinuxus: 'shared_hosting',
    singledomainhostingwindowsus: 'shared_hosting',
    multidomainhostinglinuxin: 'shared_hosting',
    multidomainwindowshostingin: 'shared_hosting',
    multidomainhostinglinuxusca: 'shared_hosting',
    multidomainhosting: 'shared_hosting',
    multidomainwindowshosting: 'shared_hosting',
    singledomainhostinglinuxusca: 'shared_hosting',
    singledomainhostingwindowsusca: 'shared_hosting',
    titanmailindia: 'titan_email',
    titanmailglobal: 'titan_email',
    gappsin: 'google_workspace',
    gappsgbl: 'google_workspace',
    gappsse: 'google_workspace',
    acronisbackupus: 'backup',
    acronisbackupasia: 'backup'
};

exports.fetchProductKeys = asyncHandler(async (_req, res, next) => {
    const serviceOperator = await findServiceOperatorByAccessKey(accessKey);
    if (!serviceOperator || serviceOperator.error) {
        return next(new ErrorResponse('Vendor credentials not configured', 500));
    }
    const vendor = serviceOperator.vendor;
    try {
        const response = await axios.get(`${vendor.apiUrl}/api/products/category-keys-mapping.json`, {
            params: { 'auth-userid': vendor.optional1, 'api-key': vendor.optional2 },
        });
        const hostingKeys = response.data?.hosting || [];
        return res.status(200).json({
            status: true,
            message: 'Product keys fetched successfully',
            data: hostingKeys.map(k => ({ productKey: k, planType: PRODUCT_TYPE_MAP[k] || null })),
            responseCode: '000',
        });
    } catch (err) {
        customLog(_req?.LogTraceId, 'error', { message: 'fetchProductKeys failed', error: err?.response?.data || err.message });
        return next(new ErrorResponse('Failed to fetch product keys from vendor', 500));
    }
});

exports.fetchPlansByProductKey = asyncHandler(async (req, res, next) => {
    const { productKey } = req.params;
    if (!productKey) return next(new ErrorResponse('productKey is required', 400));

    const serviceOperator = await findServiceOperatorByAccessKey(accessKey);
    if (!serviceOperator || serviceOperator.error) {
        return next(new ErrorResponse('Vendor credentials not configured', 500));
    }
    const vendor = serviceOperator.vendor;
    try {
        const response = await axios.get(`${vendor.apiUrl}/api/products/plan-details.json`, {
            params: { 'auth-userid': vendor.optional1, 'api-key': vendor.optional2, 'product-key': productKey },
        });
        const productData = response.data?.[productKey] || {};
        const planType = PRODUCT_TYPE_MAP[productKey] || null;
        const plans = Object.entries(productData).map(([planId, details]) => ({
            planId,
            planName: details.plan_name || planId,
            status: details.plan_status || 'Unknown',
            description: details.description || null,
            productId: productKey,
            planType,
        }));
        return res.status(200).json({
            status: true,
            message: 'Plans fetched successfully',
            data: plans,
            responseCode: '000',
        });
    } catch (err) {
        customLog(req?.LogTraceId, 'error', { message: 'fetchPlansByProductKey failed', productKey, error: err?.response?.data || err.message });
        return next(new ErrorResponse('Failed to fetch plans from vendor', 500));
    }
});

exports.bulkImportPlans = asyncHandler(async (req, res, next) => {
    const { plans } = req.body;
    if (!Array.isArray(plans) || plans.length === 0) {
        return next(new ErrorResponse('plans array is required', 400));
    }

    const imported = [];
    const alreadyExists = [];
    const failed = [];

    for (const plan of plans) {
        const { productId, planId, planType, planName, description } = plan;
        if (!productId || !planId || !planType || !planName) {
            failed.push({ planId, planName, planType: planType || null, productId, reason: 'Missing required fields' });
            continue;
        }
        if (!ALLOWED_PLAN_TYPES.includes(planType)) {
            failed.push({ planId, planName, planType, productId, reason: `Invalid planType: ${planType}` });
            continue;
        }
        try {
            const existing = await DomainHostingPlansUseCase.findByVendorKey({ productId, planId });
            if (existing) {
                alreadyExists.push({ planId, planName, planType, productId });
                continue;
            }
            await DomainHostingPlansUseCase.create({ planType, planName, productId, planId, description: description || null, features: null });
            imported.push({ planId, planName, planType, productId });
        } catch (err) {
            failed.push({ planId, planName, planType, productId, reason: err.message });
        }
    }

    return res.status(200).json({
        status: true,
        message: `Import complete: ${imported.length} imported, ${alreadyExists.length} already existed${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
        data: { imported, alreadyExists, failed },
        responseCode: '000',
    });
});
