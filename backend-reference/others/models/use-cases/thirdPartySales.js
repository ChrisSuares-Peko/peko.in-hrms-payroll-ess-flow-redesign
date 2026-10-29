const sequelizeConfig = require("../../configs/database/index");
const { flooredAfter, loadAccountingFloor } = require("./accountingPeriod");
const { accountScopeClause, withAccountScope } = require("./internalAccounts");
const { money } = require("./ledgerStatement");
const { istDayLabel } = require("../../utils/istRange");

const THIRD_PARTY_SALE_KINDS = { paymentLinks: "payment-links" };

const OUTCOMES = { paid: "paid", pending: "pending", failed: "failed", expired: "expired" };

const PAID_STATUSES = [
    "SUCCESS",
    "COMPLETED",
    "PAID",
    "SETTLED",
    "SETTLEMENT_SUCCESS",
    "SETTLEMENT_COMPLETED",
    "SETTLEMENT_DONE",
    "SETTLEMENT_PROCESSING",
];
const FAILED_STATUSES = ["FAILED", "FAILURE", "ERROR", "DECLINED", "REJECTED", "CANCELLED", "CANCELED", "EXPIRED"];
const SETTLED_STATUSES = ["SETTLED", "SETTLEMENT_SUCCESS", "SETTLEMENT_COMPLETED", "SETTLEMENT_DONE"];
const SETTLING_STATUS = "SETTLEMENT_PROCESSING";

const DEFAULT_CLIENT_URL = "test";

const SORTABLE_FIELDS = ["eventDate", "amount", "createdAt", "status"];

const SORT_COLUMNS = {
    eventDate: "eventDate",
    amount: "paymentLinks.amount",
    createdAt: "paymentLinks.createdAt",
    status: "outcome",
};

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const select = (sql, replacements = {}) =>
    sequelizeConfig.query(sql, { replacements, type: sequelizeConfig.QueryTypes.SELECT });

const inList = values => `(${values.map(value => `'${value}'`).join(", ")})`;

const text = column => `CONVERT(${column} USING utf8mb4)`;

const STATUS = "UPPER(COALESCE(paymentLinks.status, ''))";
const IS_PAID = `${STATUS} IN ${inList(PAID_STATUSES)}`;
const IS_FAILED = `${STATUS} IN ${inList(FAILED_STATUSES)}`;
const HAS_EXPIRED = "paymentLinks.expireDate IS NOT NULL AND paymentLinks.expireDate < NOW()";

const OUTCOME =
    `CASE WHEN ${IS_PAID} THEN '${OUTCOMES.paid}' ` +
    `WHEN ${IS_FAILED} THEN '${OUTCOMES.failed}' ` +
    `WHEN ${HAS_EXPIRED} THEN '${OUTCOMES.expired}' ` +
    `ELSE '${OUTCOMES.pending}' END`;

const OUTCOME_DATE = "COALESCE(paymentLinks.successOrFailDate, paymentLinks.updatedAt)";
const EVENT_DATE = `CASE WHEN ${IS_PAID} OR ${IS_FAILED} THEN ${OUTCOME_DATE} ELSE paymentLinks.createdAt END`;
const PAID_DATE = `CASE WHEN ${IS_PAID} THEN ${OUTCOME_DATE} END`;

const SETTLEMENT =
    `CASE WHEN paymentLinks.settledDate IS NOT NULL OR ${STATUS} IN ${inList(SETTLED_STATUSES)} THEN 'settled' ` +
    `WHEN ${STATUS} = '${SETTLING_STATUS}' THEN 'processing' END`;

const IS_ADMIN = "paymentLinks.type = 'ADMIN'";
const PAYLOAD_NAME = "JSON_UNQUOTE(JSON_EXTRACT(paymentLinks.sentPayload, '$.full_name'))";
const CORPORATE_NAME = `CASE WHEN ${IS_ADMIN} THEN ${PAYLOAD_NAME} ELSE ${text("credentials.name")} END`;
const CORPORATE_USERNAME = `CASE WHEN ${IS_ADMIN} THEN NULL ELSE ${text("credentials.username")} END`;
const CUSTOMER_NAME =
    `CASE WHEN ${IS_ADMIN} THEN NULL ` +
    `ELSE COALESCE(NULLIF(${text("paymentLinks.customerName")}, ''), ${PAYLOAD_NAME}) END`;
const LINK_ID = `COALESCE(NULLIF(${text("paymentLinks.transactionId")}, ''), ${text("paymentLinks.reference_id")})`;

const ROW_SELECT =
    "paymentLinks.id, " +
    `${LINK_ID} AS linkId, ` +
    `${text("paymentLinks.reference_id")} AS reference, ` +
    `${CORPORATE_NAME} AS corporateName, ` +
    `${CORPORATE_USERNAME} AS corporateUsername, ` +
    `${CUSTOMER_NAME} AS customerName, ` +
    `${text("paymentLinks.customerPhone")} AS customerPhone, ` +
    `${text("paymentLinks.purpose_message")} AS purpose, ` +
    `${text("paymentLinks.accessKey")} AS accessKey, ` +
    `${text("paymentLinks.type")} AS type, ` +
    `${text("paymentLinks.vendor")} AS vendor, ` +
    "paymentLinks.amount, " +
    `${OUTCOME} AS outcome, ` +
    `${SETTLEMENT} AS settlement, ` +
    "paymentLinks.createdAt, " +
    `${EVENT_DATE} AS eventDate, ` +
    `${PAID_DATE} AS paidAt, ` +
    "paymentLinks.settledDate, " +
    `${text("paymentLinks.utr")} AS utr, ` +
    `${text("paymentLinks.settlementUtr")} AS settlementUtr, ` +
    "paymentLinks.expireDate, " +
    `${text("paymentLinks.paymentLink")} AS paymentLink, ` +
    `${text("paymentLinks.client_url")} AS clientUrl`;

const sumWhen = outcome =>
    `COALESCE(SUM(CASE WHEN ${OUTCOME} = '${outcome}' THEN paymentLinks.amount ELSE 0 END), 0)`;

const TOTALS_SELECT =
    "COUNT(*) AS totalCount, " +
    `${sumWhen(OUTCOMES.paid)} AS collected, ` +
    `${sumWhen(OUTCOMES.pending)} AS pending, ` +
    `${sumWhen(OUTCOMES.failed)} AS failed, ` +
    `${sumWhen(OUTCOMES.expired)} AS expired`;

const PAYMENT_LINKS_FROM =
    "FROM paymentLinks LEFT JOIN credentials ON credentials.id = paymentLinks.credentialId";

const SEARCH_CLAUSE =
    ` AND (${LINK_ID} LIKE :searchText OR paymentLinks.reference_id LIKE :searchText ` +
    "OR paymentLinks.customerName LIKE :searchText OR paymentLinks.customerPhone LIKE :searchText " +
    "OR credentials.name LIKE :searchText OR credentials.username LIKE :searchText " +
    `OR paymentLinks.purpose_message LIKE :searchText OR ${PAYLOAD_NAME} LIKE :searchText)`;

const buildWhere = ({ range, status, searchText, accountIds }) => {
    let where = `WHERE ${flooredAfter(`DATE(${EVENT_DATE})`)}`;
    if (range) where += ` AND ${EVENT_DATE} BETWEEN :from AND :to`;
    if (status) where += ` AND ${OUTCOME} = :status`;
    if (accountIds) where += ` AND ${accountScopeClause("paymentLinks.credentialId", accountIds)}`;
    if (searchText) where += SEARCH_CLAUSE;
    return where;
};

const buildReplacements = ({ range, status, searchText, accountIds, accountingFloor }) => {
    const replacements = { accountingFloor };
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }
    if (status) replacements.status = status;
    if (searchText) replacements.searchText = `%${searchText}%`;
    return withAccountScope(replacements, accountIds);
};

const buildPaymentLinksQuery = ({ range, status, searchText, accountIds, sort, sortField }) => {
    const column = SORT_COLUMNS[SORTABLE_FIELDS.includes(sortField) ? sortField : "eventDate"];
    const direction = sort === "ASC" ? "ASC" : "DESC";
    const where = buildWhere({ range, status, searchText, accountIds });

    return (
        `SELECT ${ROW_SELECT} ${PAYMENT_LINKS_FROM} ${where} ` +
        `ORDER BY ${column} ${direction}, paymentLinks.id DESC LIMIT :limit OFFSET :offset`
    );
};

const buildPaymentLinksTotalsQuery = filters =>
    `SELECT ${TOTALS_SELECT} ${PAYMENT_LINKS_FROM} ${buildWhere(filters)}`;

const getThirdPartySalesTotals = async ({ range, accountingFloor, accountIds = null }) => {
    const filters = { range, status: OUTCOMES.paid, accountIds };
    const [row] = await select(
        buildPaymentLinksTotalsQuery(filters),
        buildReplacements({ ...filters, accountingFloor })
    );

    return {
        count: toNumber(row && row.totalCount),
        totalAmount: round2(row && row.collected),
    };
};

const listPaymentLinks = async ({ range, status, searchText, accountIds, sort, sortField, limit, offset }) => {
    const filters = { range, status, searchText, accountIds };
    const replacements = buildReplacements({
        ...filters,
        accountingFloor: await loadAccountingFloor(),
    });

    const [rows, totalsRows] = await Promise.all([
        select(buildPaymentLinksQuery({ ...filters, sort, sortField }), {
            ...replacements,
            limit,
            offset,
        }),
        select(buildPaymentLinksTotalsQuery(filters), replacements),
    ]);

    const totals = totalsRows.length ? totalsRows[0] : {};

    return {
        rows,
        count: toNumber(totals.totalCount),
        totals: {
            links: toNumber(totals.totalCount),
            collected: round2(totals.collected),
            pending: round2(totals.pending),
            failed: round2(totals.failed),
            expired: round2(totals.expired),
        },
    };
};

const PROVIDERS = { nupay: "NuPay", decentro: "Decentro" };

const linkOf = row => {
    if (row.paymentLink) return row.paymentLink;
    return row.clientUrl && row.clientUrl !== DEFAULT_CLIENT_URL ? row.clientUrl : null;
};

const serializePaymentLink = row => ({
    id: row.id,
    linkId: row.linkId || null,
    reference: row.reference || null,
    corporateName: row.corporateName || null,
    corporateUsername: row.corporateUsername || null,
    customerName: row.customerName || null,
    customerPhone: row.customerPhone || null,
    purpose: row.purpose || null,
    kind: String(row.accessKey || "").toLowerCase() === "invoice" ? "invoice" : "payment_link",
    raisedBy: String(row.type || "").toUpperCase() === "ADMIN" ? "admin" : "corporate",
    provider: String(row.vendor || "").toLowerCase() === "nupay" ? PROVIDERS.nupay : PROVIDERS.decentro,
    amount: money(row.amount),
    outcome: row.outcome || OUTCOMES.pending,
    settlement: row.settlement || null,
    createdAt: row.createdAt || null,
    eventDate: row.eventDate || null,
    paidAt: row.paidAt || null,
    settledAt: row.settledDate || null,
    utr: row.utr || null,
    settlementUtr: row.settlementUtr || null,
    expiresAt: row.expireDate || null,
    linkUrl: linkOf(row),
});

const OUTCOME_LABELS = { paid: "Paid", pending: "Pending", failed: "Failed", expired: "Expired" };
const KIND_LABELS = { payment_link: "Payment link", invoice: "Invoice link" };
const RAISED_BY_LABELS = { corporate: "Corporate", admin: "Admin" };

const paymentLinksExportColumns = () => [
    { header: "Date", value: row => istDayLabel(row.eventDate) },
    { header: "Link ID", value: row => row.linkId },
    { header: "Type", value: row => KIND_LABELS[row.kind] },
    { header: "Raised by", value: row => RAISED_BY_LABELS[row.raisedBy] },
    { header: "Corporate", value: row => row.corporateName },
    { header: "Customer", value: row => row.customerName },
    { header: "Purpose", value: row => row.purpose },
    { header: "Provider", value: row => row.provider },
    { header: "Amount", value: row => row.amount, money: true },
    { header: "Status", value: row => OUTCOME_LABELS[row.outcome] },
    { header: "Paid on", value: row => istDayLabel(row.paidAt) },
    { header: "UTR", value: row => row.utr },
    { header: "Expires", value: row => istDayLabel(row.expiresAt) },
];

const paymentLinksExportSummary = totals => [
    { label: "Links", value: totals.links },
    { label: "Collected", value: totals.collected, money: true },
    { label: "Pending", value: totals.pending, money: true },
    { label: "Failed", value: totals.failed, money: true },
    { label: "Expired", value: totals.expired, money: true },
];

const PAYMENT_LINKS_EXPORT_NOTE =
    "Totals follow the same filters as the rows. Collected adds up the links that were paid, dated by the day the payment came in; Pending, Failed and Expired add up the amounts requested on links that were not.";

const KIND_HANDLERS = {
    [THIRD_PARTY_SALE_KINDS.paymentLinks]: {
        title: "Third-Party Sales (Payment Links)",
        list: listPaymentLinks,
        serialize: serializePaymentLink,
        exportColumns: paymentLinksExportColumns,
        exportSummary: paymentLinksExportSummary,
        exportNote: PAYMENT_LINKS_EXPORT_NOTE,
    },
};

const handlerFor = kind => KIND_HANDLERS[kind] || null;

module.exports = {
    THIRD_PARTY_SALE_KINDS,
    OUTCOMES,
    SORTABLE_FIELDS,
    OUTCOME_LABELS,
    KIND_LABELS,
    RAISED_BY_LABELS,
    buildPaymentLinksQuery,
    buildPaymentLinksTotalsQuery,
    getThirdPartySalesTotals,
    listPaymentLinks,
    serializePaymentLink,
    paymentLinksExportColumns,
    paymentLinksExportSummary,
    PAYMENT_LINKS_EXPORT_NOTE,
    handlerFor,
};
