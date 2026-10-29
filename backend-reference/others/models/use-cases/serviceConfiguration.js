const sequelizeConfig = require("../../configs/database/index");
const { getPlanEntityConfig } = require("./accountingPlans");
const { PLAN_CATALOGUES } = require("./planCatalogues");
const { loadAddOnCounts } = require("./accountingAddOns");

const PLATFORM_FEE_COUNTS_SQL =
    "SELECT c.serviceOperatorId, COUNT(*) AS total, " +
    "SUM(COALESCE(c.isSurchargeConfigured, 0) = 0) AS notConfigured " +
    "FROM cashbacks c INNER JOIN packages p ON p.id = c.packageId " +
    "WHERE c.serviceStatus = 1 AND p.status = 1 AND c.serviceOperatorId IN (:operatorIds) " +
    "GROUP BY c.serviceOperatorId";

const EMPTY_COUNTS = Object.freeze({ total: 0, notConfigured: 0 });

const toCount = value => Number(value) || 0;

const countsOf = row => ({ total: toCount(row.total), notConfigured: toCount(row.notConfigured) });

const planConfigOf = service =>
    service && service.planType === "with_plans" ? getPlanEntityConfig(service.accessKey) : null;

const buildPlanCountsQuery = accessKeys => {
    const selects = [];
    const replacements = {};
    accessKeys.forEach((accessKey, index) => {
        const config = getPlanEntityConfig(accessKey);
        if (!config) return;
        const catalogue = PLAN_CATALOGUES.find(item => item.table === config.table);
        const where = [`${config.table}.status = 1`, config.where, catalogue && catalogue.extraWhere]
            .filter(Boolean)
            .join(" AND ");
        replacements[`key${index}`] = accessKey;
        selects.push(
            `SELECT :key${index} AS accessKey, COUNT(*) AS total, ` +
                `SUM(COALESCE(${config.table}.isCommissionConfigured, 0) = 0) AS notConfigured ` +
                `FROM ${config.table} WHERE ${where}`
        );
    });
    return { sql: selects.join(" UNION ALL "), replacements };
};

const selectRows = async (sql, replacements) =>
    (await sequelizeConfig.query(sql, { type: sequelizeConfig.QueryTypes.SELECT, replacements })) || [];

const loadPlatformFeeCounts = async operatorIds => {
    if (!operatorIds.length) return new Map();
    const rows = await selectRows(PLATFORM_FEE_COUNTS_SQL, { operatorIds });
    return new Map(rows.map(row => [Number(row.serviceOperatorId), countsOf(row)]));
};

const loadPlanCounts = async accessKeys => {
    const { sql, replacements } = buildPlanCountsQuery(accessKeys);
    if (!sql) return new Map();
    const rows = await selectRows(sql, replacements);
    return new Map(rows.map(row => [row.accessKey, countsOf(row)]));
};

const loadServiceConfiguration = async services => {
    const list = (services || []).filter(Boolean);
    const operatorIds = [...new Set(list.map(service => Number(service.id)).filter(Boolean))];
    const planKeys = [...new Set(list.filter(planConfigOf).map(service => service.accessKey))];

    const [platformFees, plans, addOns] = await Promise.all([
        loadPlatformFeeCounts(operatorIds),
        loadPlanCounts(planKeys),
        loadAddOnCounts(planKeys),
    ]);

    return new Map(
        list.map(service => {
            const config = planConfigOf(service);
            const addOnCounts = addOns.get(service.accessKey);
            return [
                service.id,
                {
                    plans: config ? plans.get(service.accessKey) || { ...EMPTY_COUNTS } : null,
                    ...(addOnCounts && {
                        addOns: { total: addOnCounts.total, notConfigured: addOnCounts.notConfigured.length },
                    }),
                    serviceCommissionItems: (config && config.serviceCommissionItems) || null,
                    platformFee: platformFees.get(Number(service.id)) || { ...EMPTY_COUNTS },
                },
            ];
        })
    );
};

const withConfiguration = async services => {
    const configuration = await loadServiceConfiguration(services);
    return services.map(service => ({ ...service, configuration: configuration.get(service.id) || null }));
};

module.exports = {
    PLATFORM_FEE_COUNTS_SQL,
    buildPlanCountsQuery,
    loadServiceConfiguration,
    withConfiguration,
};
