const sequelizeConfig = require("../../configs/database/index");
const PaymentLinkOnboarding = require("../entities/paymentLinkOnboarding");
const { getASetting, upsertSetting } = require("./setting");
const { auditSettingChange } = require("../../utils/auditHooks");
const { PAYMENT_LINK_CHARGE_AUDIT } = require("../../utils/auditedModels");

const DEFAULT_CHARGE_SETTING = "paymentLinkCharge";

const DEFAULT_CHARGE_LABEL = "Default payment link charge";

const CHARGE_SCOPES = { all: "all", custom: "custom" };

const CHARGE_SOURCES = { custom: "custom", default: "default", none: "none" };

const SORTABLE_FIELDS = ["corporate", "status", "updatedAt"];

const CHARGE_COLUMN = "onboarding.accountingCharge";

const SORT_COLUMNS = {
    corporate: "credentials.name",
    status: "onboarding.status",
    updatedAt: `JSON_UNQUOTE(JSON_EXTRACT(${CHARGE_COLUMN}, '$.setAt'))`,
};

const toNumber = value => Number(value) || 0;

const round = (value, places) => {
    const factor = 10 ** places;
    return Math.round((toNumber(value) + Number.EPSILON) * factor) / factor;
};

const select = (sql, replacements = {}) =>
    sequelizeConfig.query(sql, { replacements, type: sequelizeConfig.QueryTypes.SELECT });

const parseCharge = value => {
    if (!value) return null;
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
};

const serializeCharge = value => {
    const stored = parseCharge(value);
    if (!stored || stored.percentage === undefined || stored.fixed === undefined) return null;
    return {
        percentage: round(stored.percentage, 4),
        fixed: round(stored.fixed, 2),
        updatedAt: stored.setAt || null,
        recordedByName: stored.setBy || null,
    };
};

const storedCharge = ({ percentage, fixed }, actor = {}) => ({
    percentage: round(percentage, 4),
    fixed: round(fixed, 2),
    setBy: actor.name || null,
    setById: actor.id || null,
    setAt: new Date().toISOString(),
});

const trackedKeys = value => {
    const stored = parseCharge(value) || {};
    return { percentage: stored.percentage, fixed: stored.fixed };
};

const getDefaultCharge = async () => serializeCharge(await getASetting(DEFAULT_CHARGE_SETTING));

const setDefaultCharge = async (terms, actor) => {
    const before = await getASetting(DEFAULT_CHARGE_SETTING);
    const after = storedCharge(terms, actor);
    const saved = await upsertSetting(DEFAULT_CHARGE_SETTING, after);
    if (!saved) return null;
    const [row] = await select("SELECT id FROM settings WHERE name = :name LIMIT 1", { name: DEFAULT_CHARGE_SETTING });
    await auditSettingChange({
        sequelize: sequelizeConfig,
        spec: PAYMENT_LINK_CHARGE_AUDIT,
        id: row ? row.id : null,
        accessKey: null,
        name: DEFAULT_CHARGE_LABEL,
        before: trackedKeys(before),
        after: trackedKeys(after),
    });
    return serializeCharge(after);
};

const corporateOf = row => ({
    name: row.name || null,
    username: row.username || null,
    partnerId: row.registeredBy || null,
});

const latestOnboardingOf = credentialId =>
    PaymentLinkOnboarding.findOne({ where: { credentialId }, order: [["id", "DESC"]], raw: true });

const findCorporate = async credentialId => {
    const [row] = await select(
        "SELECT id, name, username, registeredBy FROM credentials WHERE id = :credentialId LIMIT 1",
        { credentialId }
    );
    return row || null;
};

const setCorporateCharge = async (credentialId, terms, actor) => {
    const onboarding = await latestOnboardingOf(credentialId);
    if (!onboarding) return null;
    const charge = storedCharge(terms, actor);
    await PaymentLinkOnboarding.update({ accountingCharge: charge }, { where: { id: onboarding.id } });
    const corporate = await findCorporate(credentialId);
    return {
        credentialId: Number(credentialId),
        corporate: corporate ? corporateOf(corporate) : null,
        charge: serializeCharge(charge),
    };
};

const removeCorporateCharge = async credentialId => {
    const onboarding = await latestOnboardingOf(credentialId);
    if (!onboarding || !parseCharge(onboarding.accountingCharge)) return false;
    await PaymentLinkOnboarding.update({ accountingCharge: null }, { where: { id: onboarding.id } });
    return true;
};

const LATEST_ONBOARDING = "onboarding.id IN (SELECT MAX(id) FROM paymentLinkOnboardings GROUP BY credentialId)";

const ONBOARDING_FROM =
    "FROM paymentLinkOnboardings onboarding " +
    "INNER JOIN credentials ON credentials.id = onboarding.credentialId";

const ROW_SELECT =
    "SELECT credentials.id AS credentialId, credentials.name, credentials.username, credentials.registeredBy, " +
    "onboarding.status AS onboardingStatus, onboarding.vendor AS provider, onboarding.activatedAt, " +
    `${CHARGE_COLUMN} AS accountingCharge`;

const SEARCH_CLAUSE = " AND (credentials.name LIKE :searchText OR credentials.username LIKE :searchText)";

const buildWhere = ({ scope, searchText }) => {
    let where = `WHERE ${LATEST_ONBOARDING}`;
    if (scope === CHARGE_SCOPES.custom) where += ` AND ${CHARGE_COLUMN} IS NOT NULL`;
    if (searchText) where += SEARCH_CLAUSE;
    return where;
};

const buildReplacements = ({ searchText, limit, offset }) => ({
    ...(searchText ? { searchText: `%${searchText}%` } : {}),
    ...(limit !== undefined ? { limit, offset: offset || 0 } : {}),
});

const orderClause = (sortField, sort) => {
    const column = SORT_COLUMNS[sortField] || SORT_COLUMNS.corporate;
    const direction = sort === "DESC" ? "DESC" : "ASC";
    return `ORDER BY (${CHARGE_COLUMN} IS NULL) ASC, ${column} ${direction}, credentials.id ASC`;
};

const buildListQuery = ({ scope, searchText, sort, sortField, limit }) =>
    `${ROW_SELECT} ${ONBOARDING_FROM} ${buildWhere({ scope, searchText })} ${orderClause(sortField, sort)}` +
    (limit !== undefined ? " LIMIT :limit OFFSET :offset" : "");

const buildCountQuery = ({ scope, searchText }) =>
    `SELECT COUNT(*) AS total, SUM(CASE WHEN ${CHARGE_COLUMN} IS NULL THEN 0 ELSE 1 END) AS customTotal ` +
    `${ONBOARDING_FROM} ${buildWhere({ scope, searchText })}`;

const effectiveOf = (charge, defaultCharge) => {
    if (charge) return { percentage: charge.percentage, fixed: charge.fixed, source: CHARGE_SOURCES.custom };
    if (defaultCharge)
        return { percentage: defaultCharge.percentage, fixed: defaultCharge.fixed, source: CHARGE_SOURCES.default };
    return { percentage: null, fixed: null, source: CHARGE_SOURCES.none };
};

const serializeCorporate = (row, defaultCharge) => {
    const charge = serializeCharge(row.accountingCharge);
    return {
        credentialId: Number(row.credentialId),
        corporate: corporateOf(row),
        onboarding: {
            status: row.onboardingStatus || null,
            provider: row.provider || null,
            activatedAt: row.activatedAt || null,
        },
        charge,
        effective: effectiveOf(charge, defaultCharge),
    };
};

const listPaymentLinkCorporates = async ({ scope, searchText, sort, sortField, limit, offset }) => {
    const [defaultCharge, rows, [counts]] = await Promise.all([
        getDefaultCharge(),
        select(
            buildListQuery({ scope, searchText, sort, sortField, limit }),
            buildReplacements({ searchText, limit, offset })
        ),
        select(buildCountQuery({ scope, searchText }), buildReplacements({ searchText })),
    ]);
    return {
        defaultCharge,
        rows: rows.map(row => serializeCorporate(row, defaultCharge)),
        count: Number(counts && counts.total) || 0,
        customCount: Number(counts && counts.customTotal) || 0,
    };
};

module.exports = {
    DEFAULT_CHARGE_SETTING,
    CHARGE_SCOPES,
    CHARGE_SOURCES,
    SORTABLE_FIELDS,
    buildListQuery,
    buildCountQuery,
    effectiveOf,
    serializeCharge,
    serializeCorporate,
    getDefaultCharge,
    setDefaultCharge,
    setCorporateCharge,
    removeCorporateCharge,
    listPaymentLinkCorporates,
};
