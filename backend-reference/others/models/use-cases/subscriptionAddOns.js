const sequelizeConfig = require("../../configs/database/index");
const { isOneTimeItemOperator, withOneTimeItemKeys } = require("./oneTimeItems");

const toNumber = value => Number(value) || 0;

const select = (sql, replacements = {}) =>
    sequelizeConfig.query(sql, { replacements, type: sequelizeConfig.QueryTypes.SELECT });

const SEARCH_CLAUSE =
    " AND (packages.packageName LIKE :searchText OR serviceOperators.serviceProvider LIKE :searchText)";

// Only services that are also sold as their own standalone package (eSign, Payroll, Turbo, …) —
// excludes services (e.g. "A and G Registration") that only ever appear bundled inside a
// multi-service plan like Basic/CS+/CS Go, since those aren't "Peko Subscriptions" themselves.
const STANDALONE_SERVICE_FILTER =
    "serviceOperators.accessKey IN (SELECT accessCode FROM packages WHERE type = '1' AND accessCode <> '')";

const ADD_ON_KINDS = { addOns: "addons", others: "others" };

const normaliseKind = kind => (kind === ADD_ON_KINDS.others ? ADD_ON_KINDS.others : ADD_ON_KINDS.addOns);

// Shared by both halves of the union below.
const buildWhere = ({ partnerId, searchText, kind }) => {
    const oneTimeItem = isOneTimeItemOperator();
    let where = `WHERE packages.type = '1' AND ${STANDALONE_SERVICE_FILTER}`;
    where += normaliseKind(kind) === ADD_ON_KINDS.others ? ` AND ${oneTimeItem}` : ` AND NOT ${oneTimeItem}`;
    if (partnerId === "default") where += " AND packages.partnerId IS NULL";
    else if (partnerId) where += " AND packages.partnerId = :partnerId";
    if (searchText) where += SEARCH_CLAUSE;
    return where;
};

const buildReplacements = ({ partnerId, searchText }) => {
    const replacements = withOneTimeItemKeys();
    if (partnerId && partnerId !== "default") replacements.partnerId = partnerId;
    if (searchText) replacements.searchText = `%${searchText}%`;
    return replacements;
};

// cashback/surcharge fields are echoed back on save so Settings' config isn't overwritten.
const ROW_SELECT =
    "packages.id AS packageId, CONVERT(packages.packageName USING utf8mb4) AS packageName, " +
    "packages.partnerId, CONVERT(credentials.name USING utf8mb4) AS partnerName, " +
    "serviceOperators.id AS serviceOperatorId, " +
    "CONVERT(serviceOperators.serviceProvider USING utf8mb4) AS serviceProvider, " +
    "serviceOperators.accessKey AS accessKey, ";

// A package can bundle several services, each priced separately — one row per
// already-configured (package, service) pair, e.g. a plan pricing eSign and DSC differently.
const CONFIGURED_HALF =
    `SELECT ${ROW_SELECT} cashbacks.id AS cashbackId, cashbacks.unitPrice, cashbacks.baseLimit, ` +
    "cashbacks.cashbackType, cashbacks.cashback, cashbacks.surchargeType, cashbacks.surcharge " +
    "FROM cashbacks " +
    "INNER JOIN packages ON cashbacks.packageId = packages.id " +
    "INNER JOIN serviceOperators ON cashbacks.serviceOperatorId = serviceOperators.id " +
    "LEFT JOIN credentials ON packages.partnerId = credentials.id ";

// A package's own single-service line, not yet configured — still shown, with null pricing.
const UNCONFIGURED_OWN_HALF =
    `SELECT ${ROW_SELECT} NULL AS cashbackId, NULL AS unitPrice, NULL AS baseLimit, ` +
    "NULL AS cashbackType, NULL AS cashback, NULL AS surchargeType, NULL AS surcharge " +
    "FROM packages " +
    "INNER JOIN serviceOperators ON serviceOperators.accessKey = packages.accessCode " +
    "LEFT JOIN credentials ON packages.partnerId = credentials.id " +
    "LEFT JOIN cashbacks ON cashbacks.packageId = packages.id AND cashbacks.serviceOperatorId = serviceOperators.id ";

const buildUnion = filters => {
    const where = buildWhere(filters);
    const configured = `${CONFIGURED_HALF}${where}`;
    const unconfiguredOwn = `${UNCONFIGURED_OWN_HALF}${where} AND packages.accessCode <> '' AND cashbacks.id IS NULL`;
    return `${configured} UNION ALL ${unconfiguredOwn}`;
};

const buildRowsQuery = filters =>
    `SELECT * FROM (${buildUnion(filters)}) AS addOns ` +
    "ORDER BY packageName ASC, serviceProvider ASC, packageId ASC LIMIT :limit OFFSET :offset";

const buildCountQuery = filters => `SELECT COUNT(*) AS totalCount FROM (${buildUnion(filters)}) AS addOns`;

const listSubscriptionAddOns = async ({ partnerId, searchText, kind, limit, offset }) => {
    const replacements = buildReplacements({ partnerId, searchText });

    const [rows, countRows] = await Promise.all([
        select(buildRowsQuery({ partnerId, searchText, kind }), { ...replacements, limit, offset }),
        select(buildCountQuery({ partnerId, searchText, kind }), replacements),
    ]);

    return { rows, count: countRows.length ? toNumber(countRows[0].totalCount) : 0 };
};

const serializeSubscriptionAddOn = row => ({
    packageId: row.packageId,
    cashbackId: row.cashbackId ?? null,
    packageName: row.packageName || null,
    serviceProvider: row.serviceProvider || null,
    accessKey: row.accessKey || null,
    serviceOperatorId: row.serviceOperatorId,
    partnerId: row.partnerId ?? null,
    partnerName: row.partnerName || null,
    unitPrice: row.unitPrice ?? null,
    baseLimit: row.baseLimit ?? null,
    // Echoed back unchanged on save, not shown in this tab.
    cashbackType: row.cashbackType ?? null,
    cashback: row.cashback ?? null,
    surchargeType: row.surchargeType ?? null,
    surcharge: row.surcharge ?? null,
});

module.exports = {
    ADD_ON_KINDS,
    normaliseKind,
    buildWhere,
    buildRowsQuery,
    listSubscriptionAddOns,
    serializeSubscriptionAddOn,
};
