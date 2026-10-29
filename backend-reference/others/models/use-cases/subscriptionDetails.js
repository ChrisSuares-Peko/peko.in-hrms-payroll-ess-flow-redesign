const moment = require("moment");
const { Op } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("../entities/credential");
const { flooredAfter, loadAccountingFloor } = require("./accountingPeriod");
const { accountScopeClause, withAccountScope } = require("./internalAccounts");
const {
    ORDER_POSTING_SELECT,
    orderPostingOfRow,
    postingLabel,
    saleReachedBooksOfRow,
} = require("./journalPosting");
const { money } = require("./ledgerStatement");
const { isPekoOwnService } = require("./classifiedServices");
const { isOneTimeItemOperator, withOneTimeItemKeys } = require("./oneTimeItems");

const toNumber = value => Number(value) || 0;


const select = (sql, replacements = {}) =>
    sequelizeConfig.query(sql, { replacements, type: sequelizeConfig.QueryTypes.SELECT });

const jsonAmount = path =>
    `CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${path}')) AS DECIMAL(16, 4))`;

const jsonPresent = path =>
    `(JSON_EXTRACT(orders.journalData, '$.${path}') IS NOT NULL AND JSON_TYPE(JSON_EXTRACT(orders.journalData, '$.${path}')) <> 'NULL')`;

// The cycle the dashboard's Monthly/Annual split reads (accountingDashboard.js) first, else the
// cycle the order itself was placed on, so a row whose entry carries none still says which it is.
const ORDER_BILLING_TYPE =
    "CASE WHEN JSON_VALID(orders.orderResponse) THEN JSON_UNQUOTE(JSON_EXTRACT(orders.orderResponse, '$.billingType')) END";
const BILLING_TYPE = `COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.billingType')), ${ORDER_BILLING_TYPE})`;

const SERVICE_NAME_FALLBACK =
    "CASE WHEN JSON_VALID(orders.orderResponse) THEN JSON_UNQUOTE(JSON_EXTRACT(orders.orderResponse, '$.serviceName')) END";

const IS_PEKO_OWN_SERVICE = isPekoOwnService();

const PLAN =
    `COALESCE(packages.packageName, CASE WHEN ${IS_PEKO_OWN_SERVICE} THEN ${SERVICE_NAME_FALLBACK} END, ` +
    `CONVERT(serviceOperators.serviceProvider USING utf8mb4), ${SERVICE_NAME_FALLBACK})`;

const PLAN_SELECT = `${PLAN} AS plan`;

// The latest subscriptions row per order, portal-wide (mirrors subscriberLedger.js's own
// per-subscriber join minus the corporateUserId scoping).
const FROM =
    "FROM orders " +
    "LEFT JOIN credentials ON credentials.id = orders.credentialId " +
    "LEFT JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId " +
    "LEFT JOIN (" +
    "SELECT corporateTxnId, packageId, serviceOperatorId FROM (" +
    "SELECT corporateTxnId, packageId, serviceOperatorId, " +
    "ROW_NUMBER() OVER (PARTITION BY corporateTxnId ORDER BY id DESC) AS latestFirst " +
    "FROM subscriptions WHERE corporateTxnId IS NOT NULL" +
    ") AS ranked WHERE latestFirst = 1" +
    ") AS planSubscription ON planSubscription.corporateTxnId = orders.corporateTxnId " +
    "LEFT JOIN packages ON packages.id = planSubscription.packageId";

const SEARCH_CLAUSE =
    " AND (orders.corporateTxnId LIKE :searchText OR credentials.username LIKE :searchText " +
    "OR credentials.name LIKE :searchText " +
    `OR LOWER(CONVERT(${PLAN} USING utf8mb4)) LIKE LOWER(:searchText))`;

// The dropdown's "Default" option — a subscriber with no referring partner.
const NO_PARTNER = "(credentials.registeredBy IS NULL OR credentials.registeredBy = '')";

// A Peko plan or add-on payment, read off the order's own tag the way the partner ledger
// reads it, so a subscription whose entry was never worked out is still listed.
const ORDER_TAG = "COALESCE(orders.optional, '')";

const IS_PEKO_SUBSCRIPTION =
    `(${ORDER_TAG} = 'SUBSCRIPTION' ` +
    `OR (${ORDER_TAG} = 'SUBSCRIPTION-ADDONS' AND planSubscription.serviceOperatorId IS NULL))`;

// The dashboard's subscriptions KPI adds up status = SUCCESS orders with the figure present;
// the list also carries the tagged ones without it, with their amounts dashed.
const buildWhere = ({ range, searchText, partnerId, billingType, accountIds }) => {
    const eligibility = [
        "orders.status = 'SUCCESS'",
        `(${jsonPresent("netSubscriptionIncome")} OR ${IS_PEKO_SUBSCRIPTION} OR ${IS_PEKO_OWN_SERVICE})`,
        `NOT ${isOneTimeItemOperator("serviceOperators.accessKey")}`,
        flooredAfter("DATE(orders.transactionDate)"),
    ];

    let where = `WHERE ${eligibility.join(" AND ")}`;
    if (range) where += " AND orders.transactionDate BETWEEN :from AND :to";
    if (partnerId === "default") where += ` AND ${NO_PARTNER}`;
    else if (partnerId) where += " AND credentials.registeredBy = :partnerId";
    if (accountIds) where += ` AND ${accountScopeClause("orders.credentialId", accountIds)}`;
    if (billingType) where += ` AND ${BILLING_TYPE} = :billingType`;
    if (searchText) where += SEARCH_CLAUSE;
    return where;
};

const buildReplacements = ({ range, searchText, partnerId, billingType, accountIds, accountingFloor }) => {
    const replacements = withOneTimeItemKeys({ accountingFloor });
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }
    if (partnerId && partnerId !== "default") replacements.partnerId = String(partnerId);
    if (billingType) replacements.billingType = billingType;
    if (searchText) replacements.searchText = `%${searchText}%`;
    return withAccountScope(replacements, accountIds);
};

const ROW_SELECT =
    "orders.id, CONVERT(orders.corporateTxnId USING utf8mb4) AS corporateTxnId, orders.transactionDate, " +
    "CONVERT(credentials.username USING utf8mb4) AS subscriberUsername, " +
    "CONVERT(credentials.name USING utf8mb4) AS subscriberName, " +
    "CONVERT(credentials.registeredBy USING utf8mb4) AS registeredBy, " +
    `${PLAN_SELECT}, ${BILLING_TYPE} AS billingType, orders.amountInINR AS orderValue, ` +
    `${jsonAmount("netSubscriptionIncome")} AS netRevenue, orders.pekoInvoiceDetails, ` +
    `CONVERT(orders.status USING utf8mb4) AS status, ${ORDER_POSTING_SELECT}`;

const buildRowsQuery = ({ range, searchText, partnerId, billingType, accountIds }) =>
    `SELECT ${ROW_SELECT} ${FROM} ${buildWhere({ range, searchText, partnerId, billingType, accountIds })} ` +
    "ORDER BY orders.transactionDate DESC, orders.id DESC LIMIT :limit OFFSET :offset";

const buildCountQuery = ({ range, searchText, partnerId, billingType, accountIds }) =>
    `SELECT COUNT(*) AS totalCount ${FROM} ${buildWhere({ range, searchText, partnerId, billingType, accountIds })}`;

// registeredBy is a string column holding another credential's id — mirrors otherSales.js.
const withPartnerNames = async rows => {
    const ids = [
        ...new Set(rows.map(row => String(row.registeredBy || "")).filter(id => /^\d+$/.test(id))),
    ];
    if (!ids.length) return rows.map(row => ({ ...row, partnerName: null }));

    const partners = await credential.findAll({
        where: { id: { [Op.in]: ids } },
        attributes: ["id", "name"],
        raw: true,
    });
    const names = {};
    partners.forEach(partner => {
        names[String(partner.id)] = partner.name;
    });

    return rows.map(row => ({ ...row, partnerName: names[String(row.registeredBy)] || null }));
};

const listSubscriptionDetails = async ({ range, searchText, partnerId, billingType, accountIds, limit, offset }) => {
    const replacements = buildReplacements({
        range,
        searchText,
        partnerId,
        billingType,
        accountIds,
        accountingFloor: await loadAccountingFloor(),
    });

    const [rows, countRows] = await Promise.all([
        select(buildRowsQuery({ range, searchText, partnerId, billingType, accountIds }), { ...replacements, limit, offset }),
        select(buildCountQuery({ range, searchText, partnerId, billingType, accountIds }), replacements),
    ]);

    return { rows: await withPartnerNames(rows), count: countRows.length ? toNumber(countRows[0].totalCount) : 0 };
};

// A subscription whose entry never reached the books is listed with both amounts dashed, the
// order value included, the same rule every ledger applies.
const serializeSubscriptionDetail = row => {
    const derived = saleReachedBooksOfRow(row);
    return {
        id: row.id,
        corporateTxnId: row.corporateTxnId,
        transactionDate: row.transactionDate,
        subscriberUsername: row.subscriberUsername || null,
        subscriberName: row.subscriberName || null,
        partnerName: row.partnerName || null,
        plan: row.plan || null,
        billingType: row.billingType || null,
        orderValue: derived ? money(row.orderValue) : null,
        netRevenue: derived ? money(row.netRevenue) : null,
        pekoInvoiceDetails: row.pekoInvoiceDetails,
        posting: orderPostingOfRow(row),
    };
};

const BILLING_LABELS = { MONTHLY: "Monthly", ANNUALLY: "Annually" };

const PEKO_DEFAULT_PARTNER = "Peko (Default)";

// The table's columns, in the table's order, minus the invoice button.
const subscriptionExportColumns = () => [
    {
        header: "Date",
        value: row =>
            row.transactionDate
                ? moment(row.transactionDate).utcOffset("+05:30").format("DD MMM YYYY, hh:mm A")
                : "",
    },
    { header: "Order Ref", value: row => row.corporateTxnId },
    { header: "Subscriber", value: row => row.subscriberUsername },
    { header: "Subscriber Name", value: row => row.subscriberName },
    { header: "Partner", value: row => row.partnerName || PEKO_DEFAULT_PARTNER },
    { header: "Plan", value: row => row.plan },
    { header: "Billing", value: row => BILLING_LABELS[row.billingType] || "" },
    { header: "Order Value", value: row => row.orderValue, money: true },
    { header: "Net Revenue (excl. GST)", value: row => row.netRevenue, money: true },
    { header: "Posted", value: row => postingLabel(row.posting) },
];

module.exports = {
    BILLING_LABELS,
    PEKO_DEFAULT_PARTNER,
    buildWhere,
    buildRowsQuery,
    buildCountQuery,
    listSubscriptionDetails,
    serializeSubscriptionDetail,
    subscriptionExportColumns,
};
