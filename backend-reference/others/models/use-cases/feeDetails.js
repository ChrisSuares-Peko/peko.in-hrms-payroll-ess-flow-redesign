const moment = require("moment");
const sequelizeConfig = require("../../configs/database/index");
const { flooredAfter, loadAccountingFloor } = require("./accountingPeriod");
const { accountScopeClause, withAccountScope } = require("./internalAccounts");
const { getVendorDepositAccounts, allAccountIds, REFUND_KEYS } = require("./vendorLedger");
const { ORDER_POSTING_SELECT, orderPostingOfRow, postingLabel } = require("./journalPosting");

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const select = (sql, replacements = {}) =>
    sequelizeConfig.query(sql, { replacements, type: sequelizeConfig.QueryTypes.SELECT });

const jsonAmount = path =>
    `CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${path}')) AS DECIMAL(16, 4))`;

const jsonPresent = path =>
    `(JSON_EXTRACT(orders.journalData, '$.${path}') IS NOT NULL AND JSON_TYPE(JSON_EXTRACT(orders.journalData, '$.${path}')) <> 'NULL')`;

const FEE_FIELDS = {
    commission: { excl: "commissionExcludingGST", incl: "commissionIncludingGST" },
    platformFee: { excl: "platformFeeExcludingGST", incl: "platformFeeIncludingGST" },
};

const FEE_LABELS = { commission: "Commission", platformFee: "Platform Fee" };

const FROM =
    "FROM orders " +
    "LEFT JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId " +
    "LEFT JOIN vendors ON vendors.id = serviceOperators.vendorId";

const JOURNAL_LINES_TABLE = key => `CROSS JOIN JSON_TABLE(
        COALESCE(JSON_EXTRACT(orders.journalData, '$.${key}.lineItems'), JSON_ARRAY()),
        '$[*]' COLUMNS (
            accountId VARCHAR(64) PATH '$.accountId',
            direction VARCHAR(10) PATH '$.direction',
            amount DECIMAL(16, 4) PATH '$.amount'
        )
    ) AS journalLines`;

// How much of each order's vendor-payable came back on a refund, as its own derived table —
// mirrors vendorLedger.js's own REFUNDED_PER_ORDER so the two never disagree on the ratio.
const REFUNDED_PER_ORDER = `(
    SELECT orderId, SUM(amount) AS refunded FROM (
        ${REFUND_KEYS.map(
            key => `SELECT orders.id AS orderId, journalLines.amount AS amount
                FROM orders
                ${JOURNAL_LINES_TABLE(key)}
                WHERE journalLines.accountId IN (:accountIds) AND journalLines.direction = 'debit'`
        ).join(" UNION ALL ")}
    ) AS refundLines GROUP BY orderId
) AS refunds`;

const SEARCH_CLAUSE =
    " AND (orders.corporateTxnId LIKE :searchText OR serviceOperators.serviceProvider LIKE :searchText " +
    "OR vendors.vendorName LIKE :searchText)";

// Matches accountingDashboard.js's sumForSuccess exactly: status = SUCCESS, no journal-posted
// or commissionMode check — those broke the list vs. the card's own count before.
const buildWhere = ({ feeType, range, searchText, vendorId, accountIds }) => {
    const fields = FEE_FIELDS[feeType];
    const eligibility = ["orders.status = 'SUCCESS'", jsonPresent(fields.incl), flooredAfter("DATE(orders.transactionDate)")];

    let where = `WHERE ${eligibility.join(" AND ")}`;
    if (range) where += " AND orders.transactionDate BETWEEN :from AND :to";
    if (vendorId) where += " AND serviceOperators.vendorId = :vendorId";
    if (accountIds) where += ` AND ${accountScopeClause("orders.credentialId", accountIds)}`;
    if (searchText) where += SEARCH_CLAUSE;
    return where;
};

const buildReplacements = ({ range, searchText, vendorId, accountIds, accountingFloor }) => {
    const replacements = { accountingFloor };
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }
    if (vendorId) replacements.vendorId = vendorId;
    if (searchText) replacements.searchText = `%${searchText}%`;
    return withAccountScope(replacements, accountIds);
};

const ROW_SELECT = feeType => {
    const fields = FEE_FIELDS[feeType];
    const reversalColumns =
        feeType === "commission"
            ? `${jsonAmount("vendorPayable")} AS vendorPayable, COALESCE(refunds.refunded, 0) AS refunded,`
            : "";
    return (
        "orders.id, CONVERT(orders.corporateTxnId USING utf8mb4) AS corporateTxnId, " +
        "orders.transactionDate, CONVERT(serviceOperators.serviceProvider USING utf8mb4) AS service, " +
        "CONVERT(vendors.vendorName USING utf8mb4) AS vendorName, orders.amountInINR AS orderValue, " +
        "orders.pekoInvoiceDetails, CONVERT(orders.status USING utf8mb4) AS status, " +
        `${reversalColumns} ` +
        `${jsonAmount(fields.excl)} AS feeExcludingGST, ${jsonAmount(fields.incl)} AS feeIncludingGST, ` +
        ORDER_POSTING_SELECT
    );
};

const buildRowsQuery = ({ feeType, range, searchText, vendorId, accountIds }) => {
    const reversalJoin =
        feeType === "commission" ? `LEFT JOIN ${REFUNDED_PER_ORDER} ON refunds.orderId = orders.id` : "";

    return (
        `SELECT ${ROW_SELECT(feeType)} ${FROM} ${reversalJoin} ${buildWhere({ feeType, range, searchText, vendorId, accountIds })} ` +
        "ORDER BY orders.transactionDate DESC, orders.id DESC LIMIT :limit OFFSET :offset"
    );
};

const buildCountQuery = ({ feeType, range, searchText, vendorId, accountIds }) =>
    `SELECT COUNT(*) AS totalCount ${FROM} ${buildWhere({ feeType, range, searchText, vendorId, accountIds })}`;

const listFeeDetails = async ({ feeType, range, searchText, vendorId, accountIds, limit, offset }) => {
    const replacements = buildReplacements({
        range,
        searchText,
        vendorId,
        accountIds,
        accountingFloor: await loadAccountingFloor(),
    });

    if (feeType === "commission") {
        const accounts = await getVendorDepositAccounts();
        const accountIds = allAccountIds(accounts);
        replacements.accountIds = accountIds.length ? accountIds : [""];
    }

    const [rows, countRows] = await Promise.all([
        select(buildRowsQuery({ feeType, range, searchText, vendorId, accountIds }), { ...replacements, limit, offset }),
        select(buildCountQuery({ feeType, range, searchText, vendorId, accountIds }), replacements),
    ]);

    return { rows, count: countRows.length ? toNumber(countRows[0].totalCount) : 0 };
};

const serializeFeeDetail = (row, feeType) => {
    const feeIncludingGST = round2(row.feeIncludingGST);
    const base = {
        id: row.id,
        corporateTxnId: row.corporateTxnId,
        transactionDate: row.transactionDate,
        service: row.service || null,
        vendorName: row.vendorName || null,
        orderValue: round2(row.orderValue),
        feeExcludingGST: round2(row.feeExcludingGST),
        feeIncludingGST,
        pekoInvoiceDetails: row.pekoInvoiceDetails,
        posting: orderPostingOfRow(row),
    };

    if (feeType !== "commission") return base;

    const vendorPayable = round2(row.vendorPayable);
    const ratio = vendorPayable ? round2(row.refunded) / vendorPayable : 0;
    const feeReversed = round2(feeIncludingGST * ratio);

    return { ...base, feeReversed, feeNet: round2(feeIncludingGST - feeReversed) };
};

// The table's columns, in the table's order, minus the invoice button.
const feeExportColumns = feeType => {
    const label = FEE_LABELS[feeType];
    return [
        {
            header: "Date",
            value: row =>
                row.transactionDate
                    ? moment(row.transactionDate).utcOffset("+05:30").format("DD MMM YYYY, hh:mm A")
                    : "",
        },
        { header: "Order Ref", value: row => row.corporateTxnId },
        { header: "Service", value: row => row.service },
        { header: "Vendor", value: row => row.vendorName },
        { header: "Order Value", value: row => row.orderValue, money: true },
        { header: `${label} (excl. GST)`, value: row => row.feeExcludingGST, money: true },
        { header: `${label} (incl. GST)`, value: row => row.feeIncludingGST, money: true },
        ...(feeType === "commission"
            ? [
                  { header: "Reversed", value: row => row.feeReversed, money: true },
                  { header: "Net", value: row => row.feeNet, money: true },
              ]
            : []),
        { header: "Posted", value: row => postingLabel(row.posting) },
    ];
};

module.exports = {
    FEE_FIELDS,
    FEE_LABELS,
    buildWhere,
    buildRowsQuery,
    buildCountQuery,
    listFeeDetails,
    serializeFeeDetail,
    feeExportColumns,
};
