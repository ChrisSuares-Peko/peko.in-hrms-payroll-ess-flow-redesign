const moment = require("moment");
const { Op } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("../entities/credential");
const { flooredAfter, loadAccountingFloor } = require("./accountingPeriod");
const { accountScopeClause, withAccountScope } = require("./internalAccounts");
const { pekoDirectClause } = require("../../utils/partnerScope");
const { money } = require("./ledgerStatement");
const { MIXED, OWN_REVENUE, commissionModeSql, principalShareSql } = require("./sellingMode");
const { isOneTimeItemOperator, withOneTimeItemKeys } = require("./oneTimeItems");
const {
    ORDER_POSTING_SELECT,
    SALE_REACHED_BOOKS,
    orderPostingOfRow,
    saleReachedBooksOfRow,
    postingLabel,
    orderStatusLabel,
} = require("./journalPosting");

// Principal markup means Peko bought and resold rather than acting for the vendor, so the
// journal books the whole order to Sales. These are those orders, and nothing else.
const PRINCIPAL_MARKUP = "PRINCIPAL_MARKUP";

// An order the gateway never answered on never happened, the same rule the vendor profile
// applies.
const UNANSWERED_STATUS = "PENDING";

const SORTABLE_FIELDS = ["transactionDate", "corporateTxnId", "service", "vendorName", "totalAmount", "status"];

const SORT_COLUMNS = {
    transactionDate: "orders.transactionDate",
    corporateTxnId: "orders.corporateTxnId",
    service: "serviceOperators.serviceProvider",
    vendorName: "vendors.vendorName",
    totalAmount: "totalAmount",
    status: "orders.status",
};

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const select = (sql, replacements = {}) =>
    sequelizeConfig.query(sql, { replacements, type: sequelizeConfig.QueryTypes.SELECT });

const jsonAmount = path =>
    `CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${path}')) AS DECIMAL(16, 4))`;

// The mode an order was sold under: what the journal recorded, else what its own breakdown
// shows, else the operator's current setting, else the default. An order with no journal still
// lands on exactly one of this screen and the vendor's tabs, decided the same way on both sides.
const EFFECTIVE_COMMISSION_MODE = commissionModeSql("serviceOperators");

// A mixed order is listed here for its principal items only; the margin items are the
// vendor's business and sit on the vendor's profile. A row is the whole order otherwise.
const OTHER_SALES_SHARE =
    `CASE WHEN ${EFFECTIVE_COMMISSION_MODE} = '${MIXED}' THEN ${principalShareSql("serviceOperators")} ELSE 1 END`;

const shared = expression => `(${expression}) * ${OTHER_SALES_SHARE}`;

// Peko's margin on the sale, including GST. The pipeline keeps a margin item's commission and
// a principal item's commission in separate figures, so both are read; a row with neither
// worked out stays blank rather than reading as zero.
const MARGIN_MARKUP =
    `CASE WHEN ${EFFECTIVE_COMMISSION_MODE} = '${MIXED}' THEN 0 ELSE COALESCE(${jsonAmount("commissionIncludingGST")}, 0) END`;

// A sale on Peko's own account carries no markup at all, whatever figures sit on the order.
const MARKUP_SELECT =
    `CASE WHEN ${EFFECTIVE_COMMISSION_MODE} = '${OWN_REVENUE}' THEN NULL ` +
    `WHEN ${jsonAmount("commissionIncludingGST")} IS NULL ` +
    `AND ${jsonAmount("principalCommissionExcludingGST")} IS NULL ` +
    `AND ${jsonAmount("outputGSTonPrincipalCommission")} IS NULL THEN NULL ` +
    `ELSE ${MARGIN_MARKUP} ` +
    `+ COALESCE(${jsonAmount("principalCommissionExcludingGST")}, 0) ` +
    `+ COALESCE(${jsonAmount("outputGSTonPrincipalCommission")}, 0) END`;

const IS_OTHER_SALE =
    `(${EFFECTIVE_COMMISSION_MODE} IN ('${PRINCIPAL_MARKUP}', '${MIXED}') ` +
    `OR ${isOneTimeItemOperator()}) ` +
    `AND orders.status <> '${UNANSWERED_STATUS}'`;

// The legacy tables are latin1 while anything read out of the JSON is utf8mb4, so every
// text column that meets one of them is converted rather than left to MySQL to reconcile.
const AMOUNT_SELECT =
    `${shared(`COALESCE(${jsonAmount("totalTransactionAmount")}, orders.amountInINR)`)} AS totalAmount, ` +
    `${shared(jsonAmount("platformFeeIncludingGST"))} AS platformFee, ` +
    `${MARKUP_SELECT} AS markup, ` +
    `${shared(jsonAmount("couponTotalDiscount"))} AS couponDiscount`;

const ROW_SELECT =
    "orders.id, CONVERT(orders.corporateTxnId USING utf8mb4) AS corporateTxnId, " +
    "orders.transactionDate, CONVERT(orders.status USING utf8mb4) AS status, " +
    "CONVERT(serviceOperators.serviceProvider USING utf8mb4) AS service, " +
    "serviceOperators.vendorId, CONVERT(vendors.vendorName USING utf8mb4) AS vendorName, " +
    "CONVERT(credentials.registeredBy USING utf8mb4) AS registeredBy, " +
    `${AMOUNT_SELECT}, ` +
    ORDER_POSTING_SELECT;

// Every row is listed, but a sale whose entry was skipped or never recorded adds nothing to
// the figures above the table, the same rule the ledgers apply.
const reachedBooksSum = expression =>
    `COALESCE(SUM(CASE WHEN ${SALE_REACHED_BOOKS} THEN ${expression} END), 0)`;

const TOTALS_SELECT =
    "COUNT(*) AS totalCount, " +
    `${reachedBooksSum(shared(`COALESCE(${jsonAmount("totalTransactionAmount")}, orders.amountInINR)`))} AS totalAmount, ` +
    `${reachedBooksSum(shared(jsonAmount("platformFeeIncludingGST")))} AS platformFee, ` +
    `${reachedBooksSum(MARKUP_SELECT)} AS markup, ` +
    `${reachedBooksSum(shared(jsonAmount("couponTotalDiscount")))} AS couponDiscount`;

const OTHER_SALES_FROM =
    "FROM orders " +
    "INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId " +
    "LEFT JOIN vendors ON vendors.id = serviceOperators.vendorId " +
    "LEFT JOIN credentials ON credentials.id = orders.credentialId";

const SEARCH_CLAUSE =
    " AND (orders.corporateTxnId LIKE :searchText OR serviceOperators.serviceProvider LIKE :searchText " +
    "OR vendors.vendorName LIKE :searchText)";

// The floor is unconditional: without it a page load with no date range listed and totalled
// every principal-markup order ever placed, including years from before the portal existed.
const buildWhere = ({ range, vendorId, partnerId, searchText, accountIds }) => {
    let where = `WHERE ${IS_OTHER_SALE} AND ${flooredAfter("DATE(orders.transactionDate)")}`;
    if (range) where += " AND orders.transactionDate BETWEEN :from AND :to";
    if (vendorId) where += " AND serviceOperators.vendorId = :vendorId";
    if (partnerId === "default") where += ` AND ${pekoDirectClause()}`;
    else if (partnerId) where += " AND credentials.registeredBy = :partnerId";
    if (accountIds) where += ` AND ${accountScopeClause("orders.credentialId", accountIds)}`;
    if (searchText) where += SEARCH_CLAUSE;
    return where;
};

const buildReplacements = ({ range, vendorId, partnerId, searchText, accountIds, accountingFloor }) => {
    const replacements = withOneTimeItemKeys({ accountingFloor });
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }
    if (vendorId) replacements.vendorId = vendorId;
    if (partnerId && partnerId !== "default") replacements.partnerId = String(partnerId);
    if (searchText) replacements.searchText = `%${searchText}%`;
    return withAccountScope(replacements, accountIds);
};

const buildOtherSalesQuery = ({ range, vendorId, partnerId, searchText, accountIds, sort, sortField }) => {
    const column = SORT_COLUMNS[SORTABLE_FIELDS.includes(sortField) ? sortField : "transactionDate"];
    const direction = sort === "ASC" ? "ASC" : "DESC";
    const where = buildWhere({ range, vendorId, partnerId, searchText, accountIds });

    return (
        `SELECT ${ROW_SELECT} ${OTHER_SALES_FROM} ${where} ` +
        `ORDER BY ${column} ${direction}, orders.id DESC LIMIT :limit OFFSET :offset`
    );
};

const buildOtherSalesTotalsQuery = filters =>
    `SELECT ${TOTALS_SELECT} ${OTHER_SALES_FROM} ${buildWhere(filters)}`;

const getOtherSalesTotals = async ({ range, accountingFloor, accountIds = null }) => {
    const filters = { range, accountIds };
    const [row] = await select(
        buildOtherSalesTotalsQuery(filters),
        buildReplacements({ ...filters, accountingFloor })
    );

    return {
        count: toNumber(row && row.totalCount),
        totalAmount: round2(row && row.totalAmount),
    };
};

// registeredBy is a string column holding another credential's id, so the names are looked
// up separately rather than self-joined into the listing.
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

const listOtherSales = async ({
    range,
    vendorId,
    partnerId,
    searchText,
    accountIds,
    sort,
    sortField,
    limit,
    offset,
}) => {
    const filters = { range, vendorId, partnerId, searchText, accountIds };
    const replacements = buildReplacements({
        ...filters,
        accountingFloor: await loadAccountingFloor(),
    });

    const [rows, totalsRows] = await Promise.all([
        select(buildOtherSalesQuery({ ...filters, sort, sortField }), {
            ...replacements,
            limit,
            offset,
        }),
        select(buildOtherSalesTotalsQuery(filters), replacements),
    ]);

    const totals = totalsRows.length ? totalsRows[0] : {};

    return {
        rows: await withPartnerNames(rows),
        count: toNumber(totals.totalCount),
        totals: {
            totalAmount: round2(totals.totalAmount),
            platformFee: round2(totals.platformFee),
            markup: round2(totals.markup),
            couponDiscount: round2(totals.couponDiscount),
        },
    };
};

// A sale whose entry never reached the books is listed with every amount dashed, the full
// amount included, so nothing from it is carried onto the screen until it is posted.
const serializeOtherSale = row => {
    const derived = saleReachedBooksOfRow(row);
    const figure = value => (derived ? money(value) : null);
    return {
        id: row.id,
        corporateTxnId: row.corporateTxnId,
        transactionDate: row.transactionDate,
        service: row.service || null,
        vendorId: row.vendorId || null,
        vendorName: row.vendorName || null,
        partnerName: row.partnerName || null,
        totalAmount: figure(row.totalAmount),
        platformFee: figure(row.platformFee),
        markup: figure(row.markup),
        couponDiscount: figure(row.couponDiscount),
        status: row.status || null,
        posting: orderPostingOfRow(row),
    };
};

const PEKO_DEFAULT_PARTNER = "Peko (Default)";

// The table's columns, in the table's order.
const otherSalesExportColumns = () => [
    {
        header: "Date",
        value: row => (row.transactionDate ? moment(row.transactionDate).utcOffset("+05:30").format("DD MMM YYYY") : ""),
    },
    { header: "Txn ID", value: row => row.corporateTxnId },
    { header: "Service", value: row => row.service },
    { header: "Vendor", value: row => row.vendorName },
    { header: "Partner", value: row => row.partnerName || PEKO_DEFAULT_PARTNER },
    { header: "Full Amount", value: row => row.totalAmount, money: true },
    { header: "Platform Fee", value: row => row.platformFee, money: true },
    { header: "Markup", value: row => row.markup, money: true },
    { header: "Coupon", value: row => row.couponDiscount, money: true },
    { header: "Status", value: row => orderStatusLabel(row.status) },
    { header: "Posted", value: row => postingLabel(row.posting) },
];

// The totals the screen shows above its table, for the PDF.
const otherSalesExportSummary = totals => [
    { label: "Full Amount", value: totals.totalAmount, money: true },
    { label: "Platform Fee", value: totals.platformFee, money: true },
    { label: "Markup", value: totals.markup, money: true },
    { label: "Coupon", value: totals.couponDiscount, money: true },
];

const OTHER_SALES_EXPORT_NOTE =
    "Totals follow the same filters as the rows and add up only the sales whose entry reached the books. Full Amount is what the sale was worth in total, before any coupon, and it already contains the platform fee and the markup.";

module.exports = {
    PRINCIPAL_MARKUP,
    UNANSWERED_STATUS,
    SORTABLE_FIELDS,
    PEKO_DEFAULT_PARTNER,
    buildOtherSalesQuery,
    buildOtherSalesTotalsQuery,
    getOtherSalesTotals,
    listOtherSales,
    serializeOtherSale,
    otherSalesExportColumns,
    otherSalesExportSummary,
    OTHER_SALES_EXPORT_NOTE,
};
