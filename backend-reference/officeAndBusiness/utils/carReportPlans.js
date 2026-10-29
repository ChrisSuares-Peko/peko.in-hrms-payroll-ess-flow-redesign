// DB-backed Car Report pricing (carReportPlans table, admin-managed) with a shared
// redis cache. The hardcoded maps in carReport.js are the fallback when the table or
// cache is unreachable, so a purchase can never fail on pricing infrastructure.
// paymentGateway/utils/carReportPlans.js is a copy for the Cashfree leg — change both.
const carReportPlan = require('../models/entities/carReportPlan');
const { getValue, setValue, deleteValue } = require('./cacheDataMethods');
const { customLog } = require('./loggerHelper');
const { resolveReportPrice, resolveInspectionProductCode } = require('./carReport');
const { applyCommissionMarkup } = require('./applyCommissionMarkup');

// Shared with paymentGateway — same redis, so an admin update invalidates both services.
const CACHE_KEY = 'car_report_plans_active';
const CACHE_TTL = 600;

const loadActivePlans = async (logTraceId = null) => {
    try {
        const cached = await getValue(CACHE_KEY);
        if (cached) return JSON.parse(cached);
    } catch {
        // cache unreachable — fall through to the DB
    }

    try {
        const plans = await carReportPlan.findAll({
            where: { status: true },
            order: [['sortOrder', 'ASC']],
            raw: true,
        });
        try {
            await setValue(CACHE_KEY, CACHE_TTL, JSON.stringify(plans));
        } catch {
            // caching is best-effort
        }
        return plans;
    } catch (error) {
        customLog(logTraceId, 'error', {
            message: 'carReportPlans lookup failed — falling back to static pricing',
            error: error.message,
        });
        return null;
    }
};

// Marked up after loading, so the shared redis cache keeps the stored prices.
const loadMarkedUpPlans = async (credentialId = null, logTraceId = null) => {
    const plans = await loadActivePlans(logTraceId);
    await applyCommissionMarkup(plans, 'price', credentialId);
    return plans;
};

const findPlan = (plans, reportType, packageId = null) =>
    (plans || []).find(
        (p) => p.reportType === reportType && (p.packageId || null) === (packageId || null)
    ) || null;

// DB price for the product, falling back to the static maps. Returns null (unbuyable)
// only when both agree there is no such product.
exports.resolvePlanPrice = async (reportType, body = {}, credentialId = null, logTraceId = null) => {
    const plans = await loadMarkedUpPlans(credentialId, logTraceId);
    if (plans) {
        const packageId = reportType === 'inspection' ? body.packageId : null;
        const plan = findPlan(plans, reportType, packageId);
        if (plan) return Number(plan.price) || null;
        // An active-plans list that simply lacks the row means "not on sale".
        return null;
    }
    return resolveReportPrice(reportType, body);
};

// Droom's product_code for an inspection package; null = cannot be dispatched.
exports.resolvePlanProductCode = async (packageId, logTraceId = null) => {
    const plans = await loadActivePlans(logTraceId);
    if (plans) return findPlan(plans, 'inspection', packageId)?.vendorProductCode || null;
    return resolveInspectionProductCode(packageId);
};

// Active plans for the corporate-facing listing (and the admin cache bust on writes).
exports.getActivePlans = loadMarkedUpPlans;

exports.invalidatePlansCache = async () => {
    try {
        await deleteValue(CACHE_KEY);
    } catch {
        // worst case the 10-minute TTL expires it
    }
};
