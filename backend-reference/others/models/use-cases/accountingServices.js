const { Op } = require("sequelize");
const serviceOperator = require("../entities/serviceOperator");
const vendors = require("../entities/vendor");
const { getASetting } = require("./setting");
const { handleSortFields } = require("../../utils/sortHandle");

const SETTING_NAME = "servicesTypeConfig";

const PLAN_TYPES = {
    with_plans: "service_with_plans",
    without_plans: "service_without_plans",
    peko_subscription: "peko_service_subscriptions",
    peko_subscription_vendor: "peko_subscription_vendors",
};

const VENDOR_PLAN_TYPES = ["with_plans", "without_plans"];

const CLASSIFICATIONS = ["all", "unclassified", ...Object.keys(PLAN_TYPES)];

const SORTABLE_FIELDS = [
    "serviceProvider",
    "serviceCategory",
    "serviceStatus",
    "commissionType",
    "providerCommission",
    "createdAt",
    "vendor.vendorName",
];

const SERVICE_ATTRIBUTES = [
    "id",
    "serviceProvider",
    "accessKey",
    "serviceCategory",
    "serviceStatus",
    "serviceImage",
    "commissionMode",
    "commissionType",
    "providerCommission",
    "fixedCommissionPerTransaction",
    "isCommissionInclGST",
    "isCommissionConfigured",
    "recordJournalEntry",
    "createdAt",
];

const VENDOR_INCLUDE = [
    { model: vendors, attributes: ["id", "vendorName", "state", "gstNo", "address", "vendorEmail"] },
];

const toKeyList = value =>
    Array.isArray(value)
        ? [
              ...new Set(
                  value
                      .filter(item => typeof item === "string")
                      .map(item => item.trim())
                      .filter(Boolean)
              ),
          ]
        : [];

const normalizeServicesTypeConfig = raw => ({
    service_with_plans: toKeyList(raw && raw.service_with_plans),
    service_without_plans: toKeyList(raw && raw.service_without_plans),
    peko_service_subscriptions: toKeyList(raw && raw.peko_service_subscriptions),
    peko_subscription_vendors: toKeyList(raw && raw.peko_subscription_vendors),
});

const classifiedKeys = config => Object.values(PLAN_TYPES).flatMap(field => config[field] || []);

const isVendorPlanType = planType => VENDOR_PLAN_TYPES.includes(planType);

const getServicesTypeConfig = async () => normalizeServicesTypeConfig(await getASetting(SETTING_NAME));

const findOverlappingKeys = config => {
    const keys = classifiedKeys(config);
    return [...new Set(keys.filter((key, index) => keys.indexOf(key) !== index))];
};

const findUnknownAccessKeys = async keys => {
    if (!keys.length) return [];
    const rows = await serviceOperator.findAll({
        where: { accessKey: { [Op.in]: keys } },
        attributes: ["accessKey"],
    });
    const known = new Set(rows.map(row => row.accessKey));
    return keys.filter(key => !known.has(key));
};

const resolveAccessKeyFilter = (config, type) => ({
    include: config[PLAN_TYPES[type]] || [],
});

const resolveClassificationFilter = (config, classification) => {
    if (PLAN_TYPES[classification]) return resolveAccessKeyFilter(config, classification);
    if (classification === "unclassified") return { exclude: classifiedKeys(config) };
    return { exclude: [] };
};

const findPlanTypeForAccessKey = (config, accessKey) =>
    Object.keys(PLAN_TYPES).find(planType => (config[PLAN_TYPES[planType]] || []).includes(accessKey)) || null;

// Driven by the explicit isCommissionConfigured flag (set only when Accounting saves a
// commission), not by commissionType's own nullability — several tables default that column
// to a non-null value, which would otherwise read as "configured" before anyone reviewed it.
const isCommissionConfigured = row =>
    [true, 1, "1", "true"].includes(row ? row.isCommissionConfigured : null);

const serializeService = (row, planType) => {
    const plain = row && typeof row.get === "function" ? row.get({ plain: true }) : row;
    return {
        ...plain,
        providerCommission: Number(plain.providerCommission) || 0,
        fixedCommissionPerTransaction: Number(plain.fixedCommissionPerTransaction) || 0,
        vendor: plain.vendor
            ? {
                  id: plain.vendor.id,
                  vendorName: plain.vendor.vendorName,
                  state: plain.vendor.state,
                  gstNo: plain.vendor.gstNo,
                  address: plain.vendor.address,
                  vendorEmail: Array.isArray(plain.vendor.vendorEmail) ? plain.vendor.vendorEmail : [],
              }
            : null,
        planType,
        commissionConfigured: isCommissionConfigured(plain),
    };
};

const queryServices = async ({ keyFilter, limit, offset, searchText, sort, sortField }) => {
    if (keyFilter.include && !keyFilter.include.length) return { rows: [], count: 0 };

    const where = {};
    if (keyFilter.include) where.accessKey = { [Op.in]: keyFilter.include };
    else if (keyFilter.exclude && keyFilter.exclude.length) {
        where.accessKey = { [Op.notIn]: keyFilter.exclude };
    }

    if (searchText) {
        const like = { [Op.like]: `%${searchText}%` };
        where[Op.or] = [
            { serviceProvider: like },
            { accessKey: like },
            { serviceCategory: like },
            { "$vendor.vendorName$": like },
        ];
    }

    const field = SORTABLE_FIELDS.includes(sortField) ? sortField : "serviceProvider";
    const query = {
        attributes: SERVICE_ATTRIBUTES,
        include: VENDOR_INCLUDE,
        where,
        order: handleSortFields(field, sort === "ASC" ? "ASC" : "DESC"),
    };
    if (limit) query.limit = limit;
    if (offset !== undefined) query.offset = offset;

    return serviceOperator.findAndCountAll(query);
};

const listServicesByPlanType = async ({ config, type, ...rest }) =>
    queryServices({ keyFilter: resolveAccessKeyFilter(config, type), ...rest });

const listOperatorsForClassification = async ({ config, classification, ...rest }) =>
    queryServices({ keyFilter: resolveClassificationFilter(config, classification), ...rest });

const OPTION_ATTRIBUTES = ["id", "serviceProvider", "accessKey", "serviceCategory", "serviceStatus"];

const listUnclassifiedActiveOperators = async config => {
    const listed = classifiedKeys(config);
    const accessKey = { [Op.ne]: "" };
    if (listed.length) accessKey[Op.notIn] = listed;
    return serviceOperator.findAll({
        attributes: OPTION_ATTRIBUTES,
        include: [{ model: vendors, attributes: ["id", "vendorName"] }],
        where: { serviceStatus: true, accessKey },
        order: [
            ["serviceProvider", "ASC"],
            ["id", "ASC"],
        ],
    });
};

const findServiceByAccessKey = async accessKey =>
    serviceOperator.findOne({
        attributes: SERVICE_ATTRIBUTES,
        include: VENDOR_INCLUDE,
        where: { accessKey },
    });

// Reaching this at all means an admin explicitly saved commission through the Accounting
// Portal, which is the signal the "configured" status is reporting on.
const updateServiceCommission = async (id, data) => {
    return await serviceOperator.update(
        { ...data, isCommissionConfigured: true },
        {
            where: {
                id,
            },
        }
    );
};

const updateVendorRecord = async (vendorId, data) => {
    return await vendors.update(data, {
        where: {
            id: vendorId,
        },
    });
};

// isCommissionInclGST is excluded — it's a toggle with no "unset" state, so it never blocks this.
const COMMISSION_REQUIRED_FIELDS = [
    "commissionMode",
    "commissionType",
    "providerCommission",
    "fixedCommissionPerTransaction",
];

const hasAllCommissionFields = row =>
    COMMISSION_REQUIRED_FIELDS.every(field => row[field] !== null && row[field] !== undefined);

// A manual override for rows whose commission was genuinely set before this flag existed —
// turning it on is blocked unless the commission fields are actually there to back it up.
const setServiceCommissionConfigured = async (id, value) => {
    if (!value) {
        await serviceOperator.update({ isCommissionConfigured: false }, { where: { id } });
        return { ok: true };
    }

    const row = await serviceOperator.findOne({
        where: { id },
        attributes: COMMISSION_REQUIRED_FIELDS,
        raw: true,
    });
    if (!row || !hasAllCommissionFields(row)) {
        return { ok: false, reason: "MISSING_FIELDS" };
    }

    await serviceOperator.update({ isCommissionConfigured: true }, { where: { id } });
    return { ok: true };
};

module.exports = {
    SETTING_NAME,
    PLAN_TYPES,
    VENDOR_PLAN_TYPES,
    CLASSIFICATIONS,
    classifiedKeys,
    isVendorPlanType,
    SORTABLE_FIELDS,
    SERVICE_ATTRIBUTES,
    VENDOR_INCLUDE,
    normalizeServicesTypeConfig,
    getServicesTypeConfig,
    findOverlappingKeys,
    findUnknownAccessKeys,
    findPlanTypeForAccessKey,
    resolveAccessKeyFilter,
    resolveClassificationFilter,
    isCommissionConfigured,
    serializeService,
    queryServices,
    listServicesByPlanType,
    listOperatorsForClassification,
    listUnclassifiedActiveOperators,
    findServiceByAccessKey,
    updateServiceCommission,
    updateVendorRecord,
    setServiceCommissionConfigured,
};
