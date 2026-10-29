const { Op } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const credential = require("../entities/credential");
const wallet = require("../entities/wallet");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const { customLog } = require("../../utils/loggerHelper");
const { istMonthToDateRange } = require("../../utils/istRange");
const { toNumber, round2, isPresent, money } = require("./ledgerStatement");
const { loadAccountingFloor, flooredAfter } = require("./accountingPeriod");
const {
    orderPostingOfJournal,
    saleReachedBooksOfJournal,
    SALE_REACHED_BOOKS,
    ORDER_STATUS_FILTERS,
    gmvOfOrder,
} = require("./journalPosting");
const { pekoDirectClause } = require("../../utils/partnerScope");

const KPIS_CACHE_KEY = "accounting:subscriber-balances:v2";
const KPIS_CACHE_TTL_SECONDS = 300;

const SORTABLE_FIELDS = ["name", "username", "walletBalance", "isActive", "createdAt"];

const DISPLAY_NAME_SQL =
    "COALESCE(corporateUsers.name, corporateUsers.contactPersonName, credentials.username)";

const SORT_COLUMNS = {
    name: DISPLAY_NAME_SQL,
    username: "credentials.username",
    walletBalance: "walletBalance",
    isActive: "isActive",
    createdAt: "credentials.createdAt",
};

const FUNDING_CATEGORIES = {
    topUp: "RECHARGE WALLET",
    adminCredit: "FUND TRANSFER",
    adminWithdrawal: "FUND REVERSAL",
};

const parseJson = value => {
    if (!isPresent(value)) return null;
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const select = (sql, replacements = {}) =>
    sequelizeConfig.query(sql, { replacements, type: sequelizeConfig.QueryTypes.SELECT });

const IS_SUBSCRIBER = "credentials.role = 'CORPORATE'";

const IS_FUNDING = `COALESCE(transactions.transactionCategory, '') IN ('${Object.values(FUNDING_CATEGORIES).join("', '")}')`;

const IS_ORDER_ROW = `NOT (${IS_FUNDING})`;

const positive = column => `GREATEST(COALESCE(transactions.${column}, 0), 0)`;
const negative = column => `GREATEST(-COALESCE(transactions.${column}, 0), 0)`;

const sumWhen = (condition, expression, alias) =>
    `COALESCE(SUM(CASE WHEN ${condition} THEN ${expression} ELSE 0 END), 0) AS ${alias}`;

const POSITION_SELECT = [
    sumWhen(IS_FUNDING, `${positive("creditAmount")} + ${negative("debitAmount")}`, "topUps"),
    sumWhen(IS_FUNDING, `${positive("debitAmount")} + ${negative("creditAmount")}`, "withdrawals"),
    sumWhen(IS_ORDER_ROW, positive("debitAmount"), "purchases"),
    sumWhen(IS_ORDER_ROW, negative("debitAmount"), "refunds"),
    sumWhen(IS_ORDER_ROW, positive("creditAmount"), "cashbackEarned"),
    sumWhen(IS_ORDER_ROW, negative("creditAmount"), "cashbackReversed"),
    "COALESCE(SUM(COALESCE(transactions.creditAmount, 0) - COALESCE(transactions.debitAmount, 0)), 0) AS net",
].join(", ");

const jsonAmount = path =>
    `CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${path}')) AS DECIMAL(16, 4))`;

const SUCCESSFUL_ORDER = "orders.status = 'SUCCESS'";

// The platform fee is the order's surcharge when the journal did not split it. What went
// through the gateway is only known from the journal.
const PLATFORM_FEE_OF_ORDER = `COALESCE(${jsonAmount("platformFeeIncludingGST")}, orders.surcharge)`;

const ORDER_TOTALS_SELECT =
    `COALESCE(SUM(CASE WHEN ${SALE_REACHED_BOOKS} THEN ${jsonAmount("paymentThroughGateway")} END), 0) AS paidViaGateway, ` +
    `COALESCE(SUM(CASE WHEN ${SALE_REACHED_BOOKS} THEN ${PLATFORM_FEE_OF_ORDER} END), 0) AS platformFee`;

const SERVICE_NAME_FALLBACK =
    "CASE WHEN JSON_VALID(orders.orderResponse) THEN JSON_UNQUOTE(JSON_EXTRACT(orders.orderResponse, '$.serviceName')) END";

const SERVICE_NAME_SQL = `COALESCE(CONVERT(serviceOperators.serviceProvider USING utf8mb4), ${SERVICE_NAME_FALLBACK})`;

const SERVICE_SELECT = `${SERVICE_NAME_SQL} AS service`;

const ORDER_SELECT =
    "orders.id, orders.corporateTxnId, orders.transactionDate, orders.amountInINR, orders.status, " +
    "orders.paymentMode, orders.optional, orders.journalData, orders.journalRecordStatus, " +
    "orders.surcharge, orders.paymentModeResponse, " +
    SERVICE_SELECT;

const ORDER_FROM =
    "FROM orders LEFT JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId";

const ORDER_SORT = "orders.transactionDate DESC, orders.id DESC";

const BILL_KINDS = { invoice: "invoice", platformFeeInvoice: "platformFeeInvoice" };

const BILL_LABELS = {
    [BILL_KINDS.invoice]: "Invoice",
    [BILL_KINDS.platformFeeInvoice]: "Platform Fee Invoice",
};

const PLATFORM_FEE_LINE = /^platform fee\b/i;

const isPlatformFeeOnly = data =>
    Array.isArray(data.items) &&
    data.items.length > 0 &&
    data.items.every(item => PLATFORM_FEE_LINE.test(String((item && item.description) || "")));

const billKindOf = (document, data) =>
    document === "pekoInvoice" && isPlatformFeeOnly(data) ? BILL_KINDS.platformFeeInvoice : BILL_KINDS.invoice;

const pekoInvoiceFileLabel = data => BILL_LABELS[billKindOf("pekoInvoice", data)].replace(/ /g, "-");

const SUBSCRIBER_ORDER_DOCUMENTS = {
    receipt: { field: "receiptData", type: "Receipt", label: "Receipt", name: "receipt" },
    fullInvoice: { field: "planInvoiceData", type: "Invoice", label: "Invoice", name: "invoice" },
    pekoInvoice: { field: "invoiceData", type: "Invoice", labelOf: pekoInvoiceFileLabel, name: "invoice" },
};

const hasOrderDocument = (field, section = "corporate") => {
    const path = `JSON_EXTRACT(orders.pekoInvoiceDetails, '$.${section}.${field}')`;
    return (
        "CASE WHEN JSON_VALID(orders.pekoInvoiceDetails) THEN " +
        `(CASE WHEN JSON_TYPE(${path}) = 'OBJECT' AND JSON_LENGTH(${path}) > 0 THEN 1 ELSE 0 END) ` +
        "ELSE 0 END"
    );
};

const TRANSACTION_SELECT = `${ORDER_SELECT}, (${hasOrderDocument("receiptData")}) AS hasReceipt`;

const BILL_SELECT = `orders.id, orders.corporateTxnId, orders.transactionDate, ${SERVICE_SELECT}`;

const BILL_SOURCES = [
    { document: "fullInvoice", rank: 1, numberPath: "invoiceNumber" },
    { document: "pekoInvoice", rank: 2, numberPath: "invoiceNumber" },
];

const corporateDocument = field => `JSON_EXTRACT(orders.pekoInvoiceDetails, '$.corporate.${field}')`;

const billSearch = (field, numberPath) =>
    `(orders.corporateTxnId LIKE :searchText OR ${SERVICE_NAME_SQL} LIKE :searchText ` +
    `OR JSON_UNQUOTE(JSON_EXTRACT(${corporateDocument(field)}, '$.${numberPath}')) LIKE :searchText)`;

const LEDGER_FROM =
    "FROM transactions " +
    "LEFT JOIN orders ON orders.corporateTxnId = transactions.corporateTxnId " +
    "LEFT JOIN serviceOperators ON serviceOperators.id = COALESCE(transactions.serviceOperatorId, orders.serviceOperatorId)";

const SUBSCRIBER_SELECT =
    "credentials.id AS credentialId, credentials.username, credentials.email, " +
    "credentials.registeredBy, credentials.createdAt, corporateUsers.id AS corporateUserId, " +
    "corporateUsers.name, corporateUsers.contactPersonName, corporateUsers.kycStatus, " +
    "corporateUsers.packageId, COALESCE(corporateUsers.isActive, 1) AS isActive, " +
    "packages.packageName AS planName, COALESCE(wallets.balance, 0) AS walletBalance";

const SUBSCRIBER_FROM =
    "FROM credentials " +
    "LEFT JOIN corporateUsers ON corporateUsers.credentialId = credentials.id " +
    "LEFT JOIN wallets ON wallets.credentialId = credentials.id " +
    "LEFT JOIN packages ON packages.id = corporateUsers.packageId";

const subscriberSearchClause = searchText =>
    searchText
        ? " AND (corporateUsers.name LIKE :searchText OR corporateUsers.contactPersonName LIKE :searchText " +
          "OR credentials.username LIKE :searchText OR credentials.email LIKE :searchText)"
        : "";

const subscriberPartnerClause = partnerId => {
    if (partnerId === "default") return ` AND ${pekoDirectClause()}`;
    return partnerId ? " AND credentials.registeredBy = :partnerId" : "";
};

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

const listSubscribers = async ({ limit, offset, searchText, sort, sortField, partnerId }) => {
    const column = SORT_COLUMNS[SORTABLE_FIELDS.includes(sortField) ? sortField : "name"];
    const direction = sort === "DESC" ? "DESC" : "ASC";
    const where = `WHERE ${IS_SUBSCRIBER}${subscriberSearchClause(searchText)}${subscriberPartnerClause(partnerId)}`;
    const replacements = {
        limit,
        offset,
        searchText: `%${searchText || ""}%`,
        ...(partnerId && partnerId !== "default" ? { partnerId: String(partnerId) } : {}),
    };

    const [rows, countRows] = await Promise.all([
        select(
            `SELECT ${SUBSCRIBER_SELECT} ${SUBSCRIBER_FROM} ${where} ` +
                `ORDER BY ${column} ${direction}, credentials.id ASC LIMIT :limit OFFSET :offset`,
            replacements
        ),
        select(`SELECT COUNT(*) AS totalCount ${SUBSCRIBER_FROM} ${where}`, replacements),
    ]);

    return {
        rows: await withPartnerNames(rows),
        count: countRows.length ? toNumber(countRows[0].totalCount) : 0,
    };
};

const findSubscriberByCredentialId = async credentialId => {
    const rows = await select(
        `SELECT ${SUBSCRIBER_SELECT} ${SUBSCRIBER_FROM} WHERE ${IS_SUBSCRIBER} AND credentials.id = :credentialId LIMIT 1`,
        { credentialId }
    );
    if (!rows.length) return null;

    const [row] = await withPartnerNames(rows);
    return row;
};

const positionOf = row => ({
    topUps: round2(row && row.topUps),
    withdrawals: round2(row && row.withdrawals),
    purchases: round2(row && row.purchases),
    refunds: round2(row && row.refunds),
    cashbackEarned: round2(row && row.cashbackEarned),
    cashbackReversed: round2(row && row.cashbackReversed),
    net: round2(row && row.net),
});

const loadWalletPosition = async ({ credentialId, range = null }) => {
    const where = ["transactions.credentialId = :credentialId"];
    const replacements = { credentialId };
    if (range) {
        where.push("transactions.transactionDate BETWEEN :from AND :to");
        replacements.from = range.from;
        replacements.to = range.to;
    }

    const rows = await select(
        `SELECT ${POSITION_SELECT} FROM transactions WHERE ${where.join(" AND ")}`,
        replacements
    );
    return positionOf(rows[0]);
};

// The wallet side of this ledger is a running balance with no date column, so it stays whole
// and the order side floors at go-live. The screens say which figure is on which basis.
const sumOrderTotals = async ({ credentialId, range = null }) => {
    const where = [
        "orders.credentialId = :credentialId",
        SUCCESSFUL_ORDER,
        flooredAfter("DATE(orders.transactionDate)"),
    ];
    const replacements = { credentialId, accountingFloor: await loadAccountingFloor() };
    if (range) {
        where.push("orders.transactionDate BETWEEN :from AND :to");
        replacements.from = range.from;
        replacements.to = range.to;
    }

    const rows = await select(
        `SELECT ${ORDER_TOTALS_SELECT} FROM orders WHERE ${where.join(" AND ")}`,
        replacements
    );
    return {
        paidViaGateway: round2(rows[0] && rows[0].paidViaGateway),
        platformFee: round2(rows[0] && rows[0].platformFee),
    };
};

const findWalletBalance = async credentialId => {
    const row = await wallet.findOne({ where: { credentialId }, attributes: ["balance"], raw: true });
    return row ? round2(row.balance) : 0;
};

const buildSummary = ({ standing, period, orders, walletBalance }) => ({
    topUps: period.topUps,
    withdrawals: period.withdrawals,
    spent: round2(period.purchases - period.refunds),
    paidViaGateway: orders.paidViaGateway,
    platformFee: orders.platformFee,
    cashback: round2(period.cashbackEarned - period.cashbackReversed),
    walletBalance: round2(walletBalance),
    ledgerBalance: standing.net,
    walletDifference: round2(walletBalance - standing.net),
});

const getSubscriberLedgerSummary = async (subscriber, range = null) => {
    const credentialId = subscriber.credentialId;
    const [standing, period, orders, walletBalance] = await Promise.all([
        loadWalletPosition({ credentialId }),
        range ? loadWalletPosition({ credentialId, range }) : null,
        sumOrderTotals({ credentialId, range }),
        findWalletBalance(credentialId),
    ]);

    return buildSummary({ standing, period: period || standing, orders, walletBalance });
};

const subscriberDisplayName = row =>
    row.name || row.contactPersonName || row.username || "";

const serializeSubscriber = (row, summary = null) => ({
    id: toNumber(row.credentialId),
    credentialId: toNumber(row.credentialId),
    corporateUserId: row.corporateUserId ? toNumber(row.corporateUserId) : null,
    name: row.name || null,
    contactPersonName: row.contactPersonName || null,
    username: row.username || null,
    email: row.email || null,
    partnerName: row.partnerName || null,
    planName: row.planName || null,
    kycStatus: row.kycStatus || null,
    isActive: Boolean(toNumber(row.isActive)),
    walletBalance: round2(summary ? summary.walletBalance : row.walletBalance),
});

const buildSubscriberKpis = async (now = new Date()) => {
    const monthRange = istMonthToDateRange(now);
    const replacements = {
        from: monthRange.from,
        to: monthRange.to,
        accountingFloor: await loadAccountingFloor(),
    };

    const [baseRows, monthRows, orderRows] = await Promise.all([
        select(
            "SELECT COUNT(*) AS totalSubscribers, " +
                "COALESCE(SUM(COALESCE(wallets.balance, 0)), 0) AS walletBalancesHeld, " +
                "COALESCE(SUM(CASE WHEN wallets.balance > 0 THEN 1 ELSE 0 END), 0) AS subscribersWithBalance " +
                `FROM credentials LEFT JOIN wallets ON wallets.credentialId = credentials.id WHERE ${IS_SUBSCRIBER}`
        ),
        select(
            `SELECT ${POSITION_SELECT} FROM transactions ` +
                `INNER JOIN credentials ON credentials.id = transactions.credentialId AND ${IS_SUBSCRIBER} ` +
                "WHERE transactions.transactionDate BETWEEN :from AND :to",
            replacements
        ),
        select(
            `SELECT ${ORDER_TOTALS_SELECT}, COALESCE(SUM(${gmvOfOrder("orders")}), 0) AS gmv FROM orders ` +
                `INNER JOIN credentials ON credentials.id = orders.credentialId AND ${IS_SUBSCRIBER} ` +
                `WHERE ${SUCCESSFUL_ORDER} AND orders.transactionDate BETWEEN :from AND :to ` +
                `AND ${flooredAfter("DATE(orders.transactionDate)")}`,
            replacements
        ),
    ]);

    const base = baseRows[0] || {};
    const month = positionOf(monthRows[0]);

    return {
        generatedAt: now.toISOString(),
        kpis: {
            totalSubscribers: toNumber(base.totalSubscribers),
            walletBalancesHeld: round2(base.walletBalancesHeld),
            subscribersWithBalance: toNumber(base.subscribersWithBalance),
            gmvThisMonth: round2(orderRows[0] && orderRows[0].gmv),
            spentThisMonth: round2(month.purchases - month.refunds),
            platformFeeThisMonth: round2(orderRows[0] && orderRows[0].platformFee),
            cashbackThisMonth: round2(month.cashbackEarned - month.cashbackReversed),
        },
    };
};

const getSubscriberLedgerSnapshot = async ({ refresh = false } = {}) => {
    if (!refresh) {
        try {
            const cached = await getValue(KPIS_CACHE_KEY);
            if (cached) return { ...JSON.parse(cached), cached: true };
        } catch (error) {
            customLog(null, "error", {
                message: "Subscriber balances cache read failed",
                error: error && error.message,
            });
        }
    }

    const payload = await buildSubscriberKpis();
    try {
        await setValue(KPIS_CACHE_KEY, KPIS_CACHE_TTL_SECONDS, JSON.stringify(payload));
    } catch (error) {
        customLog(null, "error", {
            message: "Subscriber balances cache write failed",
            error: error && error.message,
        });
    }
    return { ...payload, cached: false };
};

const listPaged = async ({ selectSql, fromSql, where, orderBy, replacements, limit, offset }) => {
    const whereSql = `WHERE ${where.join(" AND ")}`;
    const [rows, countRows] = await Promise.all([
        select(`SELECT ${selectSql} ${fromSql} ${whereSql} ORDER BY ${orderBy} LIMIT :limit OFFSET :offset`, {
            ...replacements,
            limit,
            offset,
        }),
        select(`SELECT COUNT(*) AS totalCount ${fromSql} ${whereSql}`, replacements),
    ]);

    return { rows, count: countRows.length ? toNumber(countRows[0].totalCount) : 0 };
};

const orderWhere = async ({ credentialId, range, searchText, status, extra = [] }) => {
    const where = [
        "orders.credentialId = :credentialId",
        flooredAfter("DATE(orders.transactionDate)"),
        ...extra,
    ];
    if (Object.hasOwn(ORDER_STATUS_FILTERS, status)) where.push(ORDER_STATUS_FILTERS[status]);
    const replacements = { credentialId, accountingFloor: await loadAccountingFloor() };
    if (range) {
        where.push("orders.transactionDate BETWEEN :from AND :to");
        replacements.from = range.from;
        replacements.to = range.to;
    }
    if (searchText) {
        where.push(
            `(orders.corporateTxnId LIKE :searchText OR orders.status LIKE :searchText OR ${SERVICE_NAME_SQL} LIKE :searchText)`
        );
        replacements.searchText = `%${searchText}%`;
    }
    return { where, replacements };
};

const listSubscriberOrders = async ({ credentialId, range, searchText, status, limit, offset }) => {
    const { where, replacements } = await orderWhere({ credentialId, range, searchText, status });
    return listPaged({
        selectSql: TRANSACTION_SELECT,
        fromSql: ORDER_FROM,
        where,
        orderBy: ORDER_SORT,
        replacements,
        limit,
        offset,
    });
};

const billBranch = (source, where, searchText) => {
    const { field } = SUBSCRIBER_ORDER_DOCUMENTS[source.document];
    const clauses = [...where, `(${hasOrderDocument(field)}) = 1`];
    if (searchText) clauses.push(billSearch(field, source.numberPath));
    const tail = `${ORDER_FROM} WHERE ${clauses.join(" AND ")}`;
    return {
        list:
            `SELECT ${BILL_SELECT}, '${source.document}' AS document, ${source.rank} AS documentRank, ` +
            `${corporateDocument(field)} AS documentData ${tail}`,
        count: `SELECT orders.id ${tail}`,
    };
};

const listSubscriberBills = async ({ credentialId, range, searchText, limit, offset }) => {
    const { where, replacements } = await orderWhere({ credentialId, range });
    if (searchText) replacements.searchText = `%${searchText}%`;
    const branches = BILL_SOURCES.map(source => billBranch(source, where, searchText));

    const [rows, countRows] = await Promise.all([
        select(
            `${branches.map(branch => branch.list).join(" UNION ALL ")} ` +
                "ORDER BY transactionDate DESC, id DESC, documentRank ASC LIMIT :limit OFFSET :offset",
            { ...replacements, limit, offset }
        ),
        select(
            `SELECT COUNT(*) AS totalCount FROM (${branches.map(branch => branch.count).join(" UNION ALL ")}) AS bills`,
            replacements
        ),
    ]);

    return { rows, count: countRows.length ? toNumber(countRows[0].totalCount) : 0 };
};

const journalOf = row => parseJson(row.journalData) || {};

const subscriberAmountsFromJournal = (journalData, amountInINR) => {
    const journal = journalData || {};
    return {
        orderAmount: isPresent(journal.totalTransactionAmount)
            ? round2(journal.totalTransactionAmount)
            : round2(amountInINR),
        discount: money(journal.couponTotalDiscount),
        paidFromWallet: money(journal.paymentThroughWallet),
        paidViaGateway: money(journal.paymentThroughGateway),
    };
};

// The payment response stored on the order names what went through the gateway, as an
// object on most flows and as a one-element array on the subscription ones.
const gatewayAmountOf = paymentModeResponse => {
    const parsed = parseJson(paymentModeResponse);
    const response = Array.isArray(parsed) ? parsed[0] : parsed;
    const amount = response && Number(response.pgAmount);
    return Number.isFinite(amount) && amount > 0 ? round2(amount) : null;
};

const RAW_SUBSCRIBER_AMOUNTS = { discount: null, paidFromWallet: null, paidViaGateway: null };

const gatewayFigure = (derived, amounts, row) => {
    if (!derived) return null;
    return isPresent(amounts.paidViaGateway) ? amounts.paidViaGateway : gatewayAmountOf(row.paymentModeResponse);
};

const serializeTransaction = row => {
    const derived = saleReachedBooksOfJournal(row);
    const amounts = derived
        ? subscriberAmountsFromJournal(journalOf(row), row.amountInINR)
        : { orderAmount: null, ...RAW_SUBSCRIBER_AMOUNTS };
    return {
        id: row.id,
        corporateTxnId: row.corporateTxnId,
        transactionDate: row.transactionDate,
        service: row.service || null,
        ...amounts,
        paidViaGateway: gatewayFigure(derived, amounts, row),
        status: row.status,
        paymentMode: row.paymentMode,
        receiptAvailable: Boolean(Number(row.hasReceipt)),
        posting: orderPostingOfJournal(row),
    };
};

const gstOfDocument = data =>
    Array.isArray(data.taxLines) && data.taxLines.length
        ? round2(data.taxLines.reduce((sum, line) => sum + toNumber(line && line.amount), 0))
        : null;

const billFiguresOf = data => ({
    documentNumber: data.invoiceNumber,
    issuedDate: data.issuedDate,
    taxable: money(data.subtotal),
    gst: gstOfDocument(data),
    total: money(data.total),
});

const serializeBill = row => {
    const data = parseJson(row.documentData) || {};
    const kind = billKindOf(row.document, data);
    const figures = billFiguresOf(data);
    return {
        id: `${row.id}:${row.document}`,
        orderId: row.id,
        corporateTxnId: row.corporateTxnId,
        transactionDate: row.transactionDate,
        service: row.service || null,
        document: row.document,
        kind,
        label: BILL_LABELS[kind],
        documentNumber: figures.documentNumber ? String(figures.documentNumber) : null,
        issuedDate: figures.issuedDate || null,
        taxable: figures.taxable,
        gst: figures.gst,
        total: figures.total,
    };
};

const isDocumentData = value =>
    Boolean(value) && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;

const findSubscriberOrderDocument = async ({ credentialId, orderId, kind }) => {
    const document = SUBSCRIBER_ORDER_DOCUMENTS[kind];
    const id = Number(orderId);
    if (!document || !Number.isInteger(id) || id <= 0) return null;

    const rows = await select(
        "SELECT orders.id, orders.corporateTxnId, orders.pekoInvoiceDetails FROM orders " +
            "WHERE orders.id = :orderId AND orders.credentialId = :credentialId LIMIT 1",
        { orderId: id, credentialId }
    );
    if (!rows.length) return null;

    const details = parseJson(rows[0].pekoInvoiceDetails) || {};
    const documents = details[document.section || "corporate"];
    const data = documents ? documents[document.field] : null;
    if (!isDocumentData(data)) return null;

    return {
        corporateTxnId: rows[0].corporateTxnId,
        data,
        type: document.type,
        label: document.labelOf ? document.labelOf(data) : document.label,
    };
};

module.exports = {
    KPIS_CACHE_KEY,
    KPIS_CACHE_TTL_SECONDS,
    SORTABLE_FIELDS,
    FUNDING_CATEGORIES,
    SUBSCRIBER_ORDER_DOCUMENTS,
    BILL_KINDS,
    BILL_LABELS,
    IS_FUNDING,
    PLATFORM_FEE_OF_ORDER,
    ORDER_STATUS_FILTERS,
    gatewayAmountOf,
    POSITION_SELECT,
    SERVICE_NAME_FALLBACK,
    SERVICE_NAME_SQL,
    SERVICE_SELECT,
    LEDGER_FROM,
    listSubscribers,
    findSubscriberByCredentialId,
    loadWalletPosition,
    sumOrderTotals,
    findWalletBalance,
    buildSummary,
    getSubscriberLedgerSummary,
    subscriberDisplayName,
    serializeSubscriber,
    buildSubscriberKpis,
    getSubscriberLedgerSnapshot,
    listSubscriberOrders,
    listSubscriberBills,
    findSubscriberOrderDocument,
    subscriberAmountsFromJournal,
    serializeTransaction,
    serializeBill,
};
