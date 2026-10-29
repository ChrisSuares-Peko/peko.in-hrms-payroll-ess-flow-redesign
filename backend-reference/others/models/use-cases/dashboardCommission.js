const sequelizeConfig = require("../../configs/database/index");
const { istDay } = require("../../utils/istRange");

const JOURNAL_COMMISSION =
    "CAST(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(o.journalData, '$.commissionExcludingGST')), 'null') AS DECIMAL(14, 4))";

const COUNTED_ROWS = "status NOT IN ('REFUND', 'REFUNDED')";

const PARTNER_CORPORATES =
    "credentialId IN (SELECT id FROM credentials WHERE registeredBy <=> :registeredBy AND subPartnerId <=> :subPartnerId)";

const toNumber = value => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const dayKey = value =>
    value instanceof Date ? istDay(value) : String(value ?? "").slice(0, 10);

const rowFilter = ({ range, scope }) =>
    [
        COUNTED_ROWS,
        range ? "transactionDate BETWEEN :from AND :to" : null,
        scope.credentialIds ? "credentialId IN (:credentialIds)" : null,
        scope.partner ? PARTNER_CORPORATES : null,
    ]
        .filter(Boolean)
        .join(" AND ");

const buildCommissionQuery = ({ range = null, scope = {}, byDay = false } = {}) => {
    const orderDay = byDay ? "DATE_FORMAT(MIN(transactionDate), '%Y-%m-%d') AS orderDate, " : "";
    const perOrder =
        `SELECT corporateTxnId, ${orderDay}SUM(totalCashback) AS storedCommission ` +
        `FROM reportAll WHERE ${rowFilter({ range, scope })} GROUP BY corporateTxnId`;
    const commission = `COALESCE(SUM(COALESCE(${JOURNAL_COMMISSION}, r.storedCommission)), 0) AS commission`;
    const source = `FROM (${perOrder}) AS r LEFT JOIN orders AS o ON o.corporateTxnId = r.corporateTxnId`;
    return byDay
        ? `SELECT r.orderDate AS day, ${commission} ${source} GROUP BY r.orderDate ORDER BY r.orderDate`
        : `SELECT ${commission} ${source}`;
};

const commissionReplacements = ({ range = null, scope = {} } = {}) => ({
    ...(range ? { from: range.from, to: range.to } : {}),
    ...(scope.credentialIds ? { credentialIds: scope.credentialIds } : {}),
    ...(scope.partner
        ? {
              registeredBy: scope.partner.registeredBy ?? null,
              subPartnerId: scope.partner.subPartnerId ?? null,
          }
        : {}),
});

const hasNoCorporates = scope => Boolean(scope && scope.credentialIds && !scope.credentialIds.length);

const selectRows = async (sql, replacements) =>
    (await sequelizeConfig.query(sql, { type: sequelizeConfig.QueryTypes.SELECT, replacements })) || [];

const getCommissionTotal = async ({ range = null, scope = {} } = {}) => {
    if (hasNoCorporates(scope)) return 0;
    const [row] = await selectRows(buildCommissionQuery({ range, scope }), commissionReplacements({ range, scope }));
    return round2(row && row.commission);
};

const getCommissionByDay = async ({ range = null, scope = {} } = {}) => {
    if (hasNoCorporates(scope)) return {};
    const rows = await selectRows(
        buildCommissionQuery({ range, scope, byDay: true }),
        commissionReplacements({ range, scope })
    );
    return Object.fromEntries(rows.map(row => [dayKey(row.day), round2(row.commission)]));
};

const networkShareOf = (amount, percentage) => {
    const share = Number(percentage);
    if (!Number.isFinite(share)) return 0;
    return round2((toNumber(amount) * share) / 100);
};

module.exports = {
    JOURNAL_COMMISSION,
    COUNTED_ROWS,
    PARTNER_CORPORATES,
    dayKey,
    buildCommissionQuery,
    commissionReplacements,
    getCommissionTotal,
    getCommissionByDay,
    networkShareOf,
};
