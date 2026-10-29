const sequelizeConfig = require("../../configs/database/index");
const sequelize = require("sequelize");
const PLAN_ENTITY_CONFIG = require("../../utils/planEntityConfig");
const { auditRawUpdate } = require("../../utils/auditHooks");
const { deleteKey } = require("../../utils/cacheDataMethods");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");

const auditedPlanUpdate = (accessKey, config, planIds, run) =>
    auditRawUpdate({ sequelize: sequelizeConfig, table: config.table, ids: planIds, accessKey, run });

const getPlanEntityConfig = (accessKey) => PLAN_ENTITY_CONFIG[accessKey] || null;

// A service that caches its plan rows must drop the cache, or the saved price shows only when it expires.
const refreshPlanCache = async (config) => {
    if (!config.cacheKey) return;
    try {
        await deleteKey(config.cacheKey);
    } catch (err) {
        // best effort: the cache expires on its own
    }
};

// Assembles one SELECT from the config — see planEntityConfig.js for what each key means.
const buildSelectClause = (config) => {
    const {
        table,
        nameColumn,
        priceColumn,
        priceRangeColumns,
        priceJsonColumn,
        priceJsonKeys,
        discountJsonColumn,
        discountJsonKeys,
        customAmountColumn,
        extraColumns,
        splitCommissionColumn,
    } = config;

    const selectParts = [
        `${table}.id AS id`,
        `${table}.${nameColumn} AS planName`,
        `${table}.commissionMode AS commissionMode`,
        `${table}.commissionType AS commissionType`,
        `${table}.commission AS commission`,
        `${table}.fixedCommissionPerTransaction AS fixedCommissionPerTransaction`,
        `${table}.isCommissionInclGST AS isCommissionInclGST`,
        `${table}.isCommissionConfigured AS commissionConfigured`,
    ];

    if (splitCommissionColumn) selectParts.push(`${table}.${splitCommissionColumn} AS splitCommission`);
    if (priceColumn) selectParts.push(`${table}.${priceColumn} AS monthlyPrice`);
    if (priceRangeColumns) {
        selectParts.push(`${table}.${priceRangeColumns.min} AS minPrice`);
        selectParts.push(`${table}.${priceRangeColumns.max} AS maxPrice`);
    }
    if (priceJsonColumn && priceJsonKeys) {
        Object.entries(priceJsonKeys).forEach(([alias, key]) => {
            selectParts.push(`JSON_UNQUOTE(JSON_EXTRACT(${priceJsonColumn}, '$.${key}')) AS ${alias}`);
        });
    }
    if (discountJsonColumn && discountJsonKeys) {
        Object.entries(discountJsonKeys).forEach(([alias, key]) => {
            selectParts.push(`JSON_UNQUOTE(JSON_EXTRACT(${discountJsonColumn}, '$.${key}')) AS ${alias}`);
        });
    }
    if (customAmountColumn) selectParts.push(`(${customAmountColumn} IS NOT NULL) AS hasCustomAmount`);
    if (extraColumns) {
        Object.entries(extraColumns).forEach(([alias, expr]) => {
            selectParts.push(`${expr} AS ${alias}`);
        });
    }

    return selectParts.join(",\n            ");
};

// searchText/partnerId are always parameterized replacements, never interpolated directly.
const buildWhereClause = (config, { searchText, partnerId }) => {
    const conditions = [];
    if (config.where) conditions.push(config.where);
    if (searchText) {
        const searchColumns = [`${config.table}.${config.nameColumn}`, ...(config.extraSearchColumns || [])];
        conditions.push(`(${searchColumns.map((col) => `${col} LIKE :searchText`).join(" OR ")})`);
    }
    if (partnerId && config.partnerFilterColumn) {
        conditions.push(
            partnerId === "default"
                ? `${config.partnerFilterColumn} IS NULL`
                : `${config.partnerFilterColumn} = :partnerId`
        );
    }
    return conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
};

const SORT_COLUMN_RESOLVERS = {
    planName: (config) => `${config.table}.${config.nameColumn}`,
    partnerName: (config) => (config.extraColumns && config.extraColumns.partnerName) || null,
};

const buildOrderClause = (config, { sort, sortField }) => {
    const resolver = SORT_COLUMN_RESOLVERS[sortField];
    const column = resolver ? resolver(config) : null;
    if (column) return `ORDER BY ${column} ${sort === "DESC" ? "DESC" : "ASC"}`;

    const defaultColumn = config.priceColumn
        ? `${config.table}.${config.priceColumn}`
        : config.priceRangeColumns
        ? `${config.table}.${config.priceRangeColumns.min}`
        : `${config.table}.id`;
    return `ORDER BY ${defaultColumn} ASC`;
};

const buildReplacements = ({ searchText, partnerId }) => {
    const replacements = {};
    if (searchText) replacements.searchText = `%${searchText}%`;
    if (partnerId && partnerId !== "default") replacements.partnerId = partnerId;
    return replacements;
};

const parseSplitCommission = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value;
    try {
        return JSON.parse(value);
    } catch (err) {
        return null;
    }
};

// The stored prices stay as they are (the drawer edits them). This adds what a markup commission puts on
// top of each one, the amount the admin lists show as "Before commission".
const attachPriceMarkup = async (config, rows) => {
    const hasPrice = Boolean(config.priceColumn || config.priceJsonColumn);
    const hasVendorPrice = Boolean(config.extraColumns && config.extraColumns.vendorPrice);
    if (!hasPrice && !hasVendorPrice) return;

    await Promise.all(
        rows.map(async (row) => {
            const item = {
                ...row,
                packagePrices: { monthly: row.monthlyPrice, annually: row.annualPrice },
                planCommissions: row.splitCommission || undefined,
            };
            if (hasPrice) {
                await applyCommissionMarkup(item, "packagePrices.monthly", null, true, "priceMarkup.monthlyPrice");
                await applyCommissionMarkup(item, "packagePrices.annually", null, true, "priceMarkup.annualPrice");
            }
            if (hasVendorPrice) {
                // With a custom amount the customer pays that, so the vendor price carries no markup.
                if (row.hasCustomAmount) item.priceMarkup = { ...item.priceMarkup, vendorPrice: 0 };
                else await applyCommissionMarkup(item, "vendorPrice", null, true, "priceMarkup.vendorPrice");
            }
            row.priceMarkup = item.priceMarkup;
            delete row.hasCustomAmount;
        })
    );
};

const findPlansForService = async (accessKey, filters = {}) => {
    const config = getPlanEntityConfig(accessKey);
    if (!config) return null;

    const { searchText, partnerId, sort, sortField, limit, offset } = filters;
    const query = `
        SELECT ${buildSelectClause(config)}
        FROM ${config.table}
        ${config.joins || ""}
        ${buildWhereClause(config, { searchText, partnerId })}
        ${buildOrderClause(config, { sort, sortField })}
        LIMIT :limit OFFSET :offset
    `;

    const rows = await sequelizeConfig.query(query, {
        replacements: { ...buildReplacements({ searchText, partnerId }), limit, offset },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
    });

    const plans = rows.map((row) => ({
        ...row,
        commissionConfigured: Boolean(row.commissionConfigured),
        ...(config.splitCommissionColumn
            ? { splitCommission: parseSplitCommission(row.splitCommission) }
            : {}),
    }));
    await attachPriceMarkup(config, plans);
    return plans;
};

const countPlansForService = async (accessKey, filters = {}) => {
    const config = getPlanEntityConfig(accessKey);
    if (!config) return 0;

    const { searchText, partnerId } = filters;
    const query = `
        SELECT COUNT(*) AS count
        FROM ${config.table}
        ${config.joins || ""}
        ${buildWhereClause(config, { searchText, partnerId })}
    `;

    const [result] = await sequelizeConfig.query(query, {
        replacements: buildReplacements({ searchText, partnerId }),
        type: sequelize.QueryTypes.SELECT,
        raw: true,
    });
    return Number(result && result.count) || 0;
};

// Prices (and package discounts) a service lets the portal edit: plain columns, or keys of a JSON column.
const JSON_PRICE_FIELDS = [
    { column: "priceJsonColumn", fields: { price: "monthly", annualPrice: "annually" } },
    { column: "discountJsonColumn", fields: { discount: "monthly", annualDiscount: "annually" } },
];

const buildPriceUpdate = (config, data) => {
    const parts = [];
    const replacements = {};
    if (!config.priceEditable) return { parts, replacements };

    if (config.priceColumn && data.price != null) {
        parts.push(`${config.priceColumn} = :price`);
        replacements.price = data.price;
    }
    if (config.annualPriceColumn && data.annualPrice != null) {
        parts.push(`${config.annualPriceColumn} = :annualPrice`);
        replacements.annualPrice = data.annualPrice;
    }
    JSON_PRICE_FIELDS.forEach(({ column, fields }) => {
        const jsonColumn = config[column];
        const given = Object.keys(fields).filter((field) => data[field] != null);
        if (!jsonColumn || !given.length) return;
        const keys = given.map((field) => `'$.${fields[field]}', :${field}`).join(", ");
        parts.push(`${jsonColumn} = JSON_SET(COALESCE(${jsonColumn}, JSON_OBJECT()), ${keys})`);
        given.forEach((field) => {
            replacements[field] = data[field];
        });
    });
    return { parts, replacements };
};

const buildCommissionSetClause = (config, data = {}) => {
    const parts = [
        "commissionMode = :commissionMode",
        "commissionType = :commissionType",
        "commission = :commission",
        "fixedCommissionPerTransaction = :fixedCommissionPerTransaction",
        "isCommissionInclGST = :isCommissionInclGST",
        "isCommissionConfigured = :isCommissionConfigured",
    ];
    if (config.splitCommissionColumn) parts.push(`${config.splitCommissionColumn} = :splitCommission`);
    parts.push(...buildPriceUpdate(config, data).parts);
    return parts.join(",\n            ");
};

// isCommissionConfigured is always true here — reaching this at all means an admin
// explicitly saved a plan's commission through the Accounting Portal.
const buildCommissionReplacements = (config, data) => {
    const replacements = {
        commissionMode: data.commissionMode,
        commissionType: data.commissionType,
        commission: data.commission,
        fixedCommissionPerTransaction: data.fixedCommissionPerTransaction,
        isCommissionInclGST: data.isCommissionInclGST,
        isCommissionConfigured: true,
    };
    if (config.splitCommissionColumn) {
        replacements.splitCommission = data.splitCommission ? JSON.stringify(data.splitCommission) : null;
    }
    Object.assign(replacements, buildPriceUpdate(config, data).replacements);
    return replacements;
};

const updatePlanCommission = async (accessKey, planId, data) => {
    const config = getPlanEntityConfig(accessKey);
    if (!config) return null;

    const query = `
        UPDATE ${config.table}
        SET
            ${buildCommissionSetClause(config, data)}
        WHERE id = :planId
    `;

    await auditedPlanUpdate(accessKey, config, [planId], () =>
        sequelizeConfig.query(query, {
            replacements: { ...buildCommissionReplacements(config, data), planId },
            type: sequelize.QueryTypes.UPDATE,
        })
    );
    await refreshPlanCache(config);

    return true;
};

// Bulk-configure — one UPDATE across every selected plan id.
const updatePlanCommissionBulk = async (accessKey, planIds, data) => {
    const config = getPlanEntityConfig(accessKey);
    if (!config) return null;

    const query = `
        UPDATE ${config.table}
        SET
            ${buildCommissionSetClause(config)}
        WHERE id IN (:planIds)
    `;

    await auditedPlanUpdate(accessKey, config, planIds, () =>
        sequelizeConfig.query(query, {
            replacements: { ...buildCommissionReplacements(config, data), planIds },
            type: sequelize.QueryTypes.UPDATE,
        })
    );
    await refreshPlanCache(config);

    return true;
};

// isCommissionInclGST is excluded — it's a toggle with no "unset" state, so it never blocks this.
const COMMISSION_REQUIRED_FIELDS = [
    "commissionMode",
    "commissionType",
    "commission",
    "fixedCommissionPerTransaction",
];

const hasAllCommissionFields = row =>
    COMMISSION_REQUIRED_FIELDS.every((field) => row[field] !== null && row[field] !== undefined);

// A manual override for plans whose commission was genuinely set before this flag existed —
// turning it on is blocked unless the commission fields are actually there to back it up.
// Generic across every plan table via config.table, same as the read/write paths above.
const setPlanCommissionConfigured = async (accessKey, planId, value) => {
    const config = getPlanEntityConfig(accessKey);
    if (!config) return null;

    if (!value) {
        await auditedPlanUpdate(accessKey, config, [planId], () =>
            sequelizeConfig.query(`UPDATE ${config.table} SET isCommissionConfigured = false WHERE id = :planId`, {
                replacements: { planId },
                type: sequelize.QueryTypes.UPDATE,
            })
        );
        return { ok: true };
    }

    const [row] = await sequelizeConfig.query(
        `SELECT ${COMMISSION_REQUIRED_FIELDS.join(", ")} FROM ${config.table} WHERE id = :planId`,
        { replacements: { planId }, type: sequelize.QueryTypes.SELECT, raw: true }
    );
    if (!row || !hasAllCommissionFields(row)) {
        return { ok: false, reason: "MISSING_FIELDS" };
    }

    await auditedPlanUpdate(accessKey, config, [planId], () =>
        sequelizeConfig.query(`UPDATE ${config.table} SET isCommissionConfigured = true WHERE id = :planId`, {
            replacements: { planId },
            type: sequelize.QueryTypes.UPDATE,
        })
    );
    return { ok: true };
};

module.exports = {
    getPlanEntityConfig,
    findPlansForService,
    countPlansForService,
    updatePlanCommission,
    updatePlanCommissionBulk,
    setPlanCommissionConfigured,
    hasAllCommissionFields,
};
