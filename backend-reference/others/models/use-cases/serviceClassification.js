const sequelizeConfig = require("../../configs/database/index");
const setting = require("../entities/setting");
const {
    SETTING_NAME,
    PLAN_TYPES,
    VENDOR_PLAN_TYPES,
    classifiedKeys,
    isVendorPlanType,
    normalizeServicesTypeConfig,
    getServicesTypeConfig,
    findOverlappingKeys,
    findUnknownAccessKeys,
    findPlanTypeForAccessKey,
    serializeService,
    listOperatorsForClassification,
    listUnclassifiedActiveOperators,
} = require("./accountingServices");
const { listTrees, findLiveTrees } = require("./serviceApprovalTree");
const { grandfatherLiveTrees } = require("./serviceApprovals");
const { dropDashboardCache } = require("./accountingPeriod");

const gatedKeys = config => VENDOR_PLAN_TYPES.flatMap(planType => config[PLAN_TYPES[planType]]);

const withoutKey = (config, accessKey) =>
    Object.fromEntries(
        Object.values(PLAN_TYPES).map(field => [field, (config[field] || []).filter(key => key !== accessKey)])
    );

const becomesGated = (planType, previousPlanType) =>
    isVendorPlanType(planType) && !isVendorPlanType(previousPlanType);

const sameConfig = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const saveConfigLocked = async mutate => {
    const transaction = await sequelizeConfig.transaction();
    try {
        const row = await setting.findOne({ where: { name: SETTING_NAME }, transaction, lock: true });
        const current = normalizeServicesTypeConfig(row ? row.details : null);
        const outcome = mutate(current);
        if (outcome.next) {
            if (row) {
                row.details = outcome.next;
                await row.save({ transaction });
            } else {
                await setting.create({ name: SETTING_NAME, details: outcome.next }, { transaction });
            }
        }
        await transaction.commit();
        return { current, ...outcome };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const classifyService = async ({ accessKey, planType, actor }) => {
    const unknown = await findUnknownAccessKeys([accessKey]);
    if (unknown.length) return { code: "UNKNOWN", accessKey };

    const saved = await saveConfigLocked(current => {
        const previousPlanType = findPlanTypeForAccessKey(current, accessKey);
        const next = withoutKey(current, accessKey);
        if (planType) next[PLAN_TYPES[planType]].push(accessKey);
        const changed = !sameConfig(next, current);
        return { previousPlanType, changed, next: changed ? next : null, config: changed ? next : current };
    });

    const grandfathering = becomesGated(planType, saved.previousPlanType)
        ? await grandfatherLiveTrees({ accessKey, actor })
        : { autoApproved: [], skipped: [] };
    if (saved.changed) await dropDashboardCache();

    return {
        accessKey,
        planType: planType || null,
        previousPlanType: saved.previousPlanType,
        changed: saved.changed,
        config: saved.config,
        ...grandfathering,
    };
};

const applyServicesTypeConfig = async ({ config: raw, actor }) => {
    const config = normalizeServicesTypeConfig(raw);

    const overlapping = findOverlappingKeys(config);
    if (overlapping.length) return { code: "OVERLAP", keys: overlapping };

    const unknown = await findUnknownAccessKeys(classifiedKeys(config));
    if (unknown.length) return { code: "UNKNOWN", keys: unknown };

    const saved = await saveConfigLocked(current => {
        const before = new Set(gatedKeys(current));
        return { next: config, added: gatedKeys(config).filter(key => !before.has(key)) };
    });

    const autoApproved = [];
    const skipped = [];
    for (const accessKey of saved.added) {
        const result = await grandfatherLiveTrees({ accessKey, actor });
        autoApproved.push(...result.autoApproved.map(partner => ({ accessKey, ...partner })));
        skipped.push(...result.skipped.map(partner => ({ accessKey, ...partner })));
    }
    await dropDashboardCache();

    return { config, autoApproved, skipped };
};

const listClassification = async ({ classification, limit, offset, searchText, sort, sortField }) => {
    const config = await getServicesTypeConfig();
    const result = await listOperatorsForClassification({
        config,
        classification,
        limit,
        offset,
        searchText,
        sort,
        sortField,
    });
    const rows = result.rows.map(row =>
        serializeService(row, findPlanTypeForAccessKey(config, row.accessKey))
    );
    const keys = [...new Set(rows.map(row => row.accessKey).filter(Boolean))];
    const trees = keys.length ? await listTrees({ keys, partnersOnly: true }) : [];

    return {
        services: rows.map(row => ({
            ...row,
            liveFor: findLiveTrees(trees, row.accessKey).map(tree => ({
                partnerPermissionId: tree.id,
                partnerName: tree.partnerName,
            })),
        })),
        recordsTotal: result.count,
    };
};

const classifyServices = async ({ accessKeys, planType, actor }) => {
    const keys = [...new Set(accessKeys)];
    const unknown = await findUnknownAccessKeys(keys);
    if (unknown.length) return { code: "UNKNOWN", keys: unknown };

    const saved = await saveConfigLocked(current => {
        const previous = Object.fromEntries(keys.map(key => [key, findPlanTypeForAccessKey(current, key)]));
        const next = keys.reduce((config, key) => withoutKey(config, key), current);
        next[PLAN_TYPES[planType]].push(...keys);
        const changed = !sameConfig(next, current);
        return { previous, changed, next: changed ? next : null, config: changed ? next : current };
    });

    const results = [];
    for (const accessKey of keys) {
        const previousPlanType = saved.previous[accessKey];
        const grandfathering = becomesGated(planType, previousPlanType)
            ? await grandfatherLiveTrees({ accessKey, actor })
            : { autoApproved: [], skipped: [] };
        results.push({
            accessKey,
            planType,
            previousPlanType,
            changed: previousPlanType !== planType,
            ...grandfathering,
        });
    }
    if (saved.changed) await dropDashboardCache();

    return { config: saved.config, results };
};

const plainOf = row => (row && typeof row.get === "function" ? row.get({ plain: true }) : row);

const listClassificationOptions = async () => {
    const config = await getServicesTypeConfig();
    const rows = await listUnclassifiedActiveOperators(config);

    const seen = new Set();
    const services = [];
    (rows || []).forEach(row => {
        const plain = plainOf(row);
        if (!plain || !plain.accessKey || seen.has(plain.accessKey)) return;
        seen.add(plain.accessKey);
        services.push({
            id: plain.id,
            serviceProvider: plain.serviceProvider,
            accessKey: plain.accessKey,
            serviceCategory: plain.serviceCategory || null,
            vendor: plain.vendor ? { id: plain.vendor.id, vendorName: plain.vendor.vendorName } : null,
        });
    });

    const trees = services.length
        ? await listTrees({ keys: services.map(service => service.accessKey), partnersOnly: true })
        : [];
    return {
        services: services.map(service => ({
            ...service,
            liveFor: findLiveTrees(trees, service.accessKey).map(tree => ({
                partnerPermissionId: tree.id,
                partnerName: tree.partnerName,
            })),
        })),
    };
};

module.exports = {
    withoutKey,
    classifyService,
    classifyServices,
    applyServicesTypeConfig,
    listClassification,
    listClassificationOptions,
};
