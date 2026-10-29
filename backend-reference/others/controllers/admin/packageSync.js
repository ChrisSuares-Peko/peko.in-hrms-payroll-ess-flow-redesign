const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const Package = require('../../models/entities/package');
const sequelize = require('../../configs/database/index');
const {
    listProviders,
    getProvider,
    describeProvider,
    normalizePartnerId,
    loadVendorPlans,
} = require('../../utils/packageSync');
const { buildDiff, splitOpId } = require('../../utils/packageSync/reconcile');

const COUNT_KEY = { add: 'added', update: 'updated', deactivate: 'deactivated' };
const emptyCounts = () => ({ added: 0, updated: 0, deactivated: 0 });

const loadLocalPackages = (provider, type, partnerId) =>
    Package.findAll({ where: { accessCode: provider.packageAccessCode, type, partnerId }, raw: true });

const applyOp = async (op, { provider, type, partnerId }, transaction) => {
    if (op.kind === 'add') {
        const synced = Object.fromEntries(provider.syncedFields.map(field => [field, op.changes[field].to]));
        const row = await Package.create(
            {
                ...synced,
                externalId: op.externalId,
                status: false,
                packageType: 'INDIVIDUAL',
                accessCode: provider.packageAccessCode,
                type,
                partnerId,
                packagePrices: { monthly: 0, annually: 0 },
                discount: { monthly: 0, annually: 0 },
            },
            { transaction }
        );
        return row.id;
    }
    const values =
        op.kind === 'deactivate'
            ? { status: false }
            : Object.fromEntries(Object.entries(op.changes).map(([field, { to }]) => [field, to]));
    const where = { id: op.packageId, ...(op.kind === 'deactivate' ? { status: true } : {}) };
    const [affected] = await Package.update(values, { where, transaction });
    if (affected !== 1) throw new Error(`Package ${op.packageId} changed while applying ${op.id}`);
    return op.packageId;
};

exports.listProviders = asyncHandler(async (req, res) =>
    res.status(200).json({
        status: true,
        message: 'Sync providers fetched successfully',
        data: { providers: listProviders() },
        responseCode: '000',
    })
);

exports.preview = asyncHandler(async (req, res, next) => {
    const traceId = req?.LogTraceId;
    const { accessKey, type, partnerIds } = req.body;
    const provider = getProvider(accessKey);
    if (!provider) return next(new ErrorResponse('Unknown sync provider', 400));

    const vendorPlans = await loadVendorPlans(provider, traceId);
    const fetchedAt = new Date().toISOString();

    const partners = [];
    for (const requested of partnerIds) {
        const localPackages = await loadLocalPackages(provider, type, normalizePartnerId(requested));
        const { ops, summary } = buildDiff({ vendorPlans, localPackages, syncedFields: provider.syncedFields });
        partners.push({ partnerId: String(requested), localCount: localPackages.length, summary, ops });
    }

    customLog(traceId, 'info', {
        message: '[packageSync] preview',
        accessKey,
        type,
        vendorCount: vendorPlans.length,
        partners: partners.map(p => ({ partnerId: p.partnerId, ...p.summary })),
        by: req.user?.id,
    });
    return res.status(200).json({
        status: true,
        message: 'Sync preview generated',
        data: {
            provider: describeProvider(provider),
            type,
            vendor: { count: vendorPlans.length, fetchedAt },
            partners,
        },
        responseCode: '000',
    });
});

exports.apply = asyncHandler(async (req, res, next) => {
    const traceId = req?.LogTraceId;
    const { accessKey, type, partners } = req.body;
    const provider = getProvider(accessKey);
    if (!provider) return next(new ErrorResponse('Unknown sync provider', 400));

    const vendorPlans = await loadVendorPlans(provider, traceId);

    const results = [];
    for (const { partnerId: requested, opIds } of partners) {
        const partnerId = normalizePartnerId(requested);
        const localPackages = await loadLocalPackages(provider, type, partnerId);
        const { ops } = buildDiff({ vendorPlans, localPackages, syncedFields: provider.syncedFields });
        const byId = new Map(ops.map(op => [op.id, op]));
        const keys = new Set(ops.map(op => op.key));

        const toRun = [];
        const skipped = [];
        for (const opId of opIds) {
            const op = byId.get(opId);
            if (op && op.selectable) toRun.push(op);
            else skipped.push({ opId, reason: keys.has(splitOpId(opId)) ? 'stale' : 'missing' });
        }

        const result = { partnerId: String(requested), applied: [], skipped, counts: emptyCounts() };
        const transaction = await sequelize.transaction();
        try {
            for (const op of toRun) {
                const packageId = await applyOp(op, { provider, type, partnerId }, transaction);
                result.applied.push({ opId: op.id, kind: op.kind, packageId });
                result.counts[COUNT_KEY[op.kind]] += 1;
            }
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            customLog(traceId, 'error', {
                message: '[packageSync] apply failed, partner rolled back',
                accessKey,
                type,
                partnerId: requested,
                error: error?.message,
                sql: error?.sql,
            });
            result.applied = [];
            result.counts = emptyCounts();
            result.error = error?.message || 'Apply failed';
        }
        customLog(traceId, 'info', {
            message: '[packageSync] applied',
            accessKey,
            type,
            partnerId: requested,
            counts: result.counts,
            applied: result.applied.map(a => a.opId),
            skipped: result.skipped,
            failed: Boolean(result.error),
            by: req.user?.id,
        });
        results.push(result);
    }

    const failed = results.filter(r => r.error).length;
    const allFailed = failed === results.length;
    let message = 'Sync applied successfully';
    if (allFailed) message = 'Sync failed; no changes were applied';
    else if (failed) message = `Sync applied; ${failed} partner(s) rolled back`;

    return res.status(allFailed ? 500 : 200).json({
        status: !allFailed,
        message,
        data: { provider: describeProvider(provider), type, partners: results },
        responseCode: allFailed ? '001' : '000',
    });
});
