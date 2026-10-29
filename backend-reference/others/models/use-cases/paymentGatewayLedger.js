const sequelizeConfig = require("../../configs/database/index");
const { istDay } = require("../../utils/istRange");
const {
    sumReceivedFromGateway,
    sumFeesForGateway,
    sumOpeningForGateway,
    sumSettledByGateway,
    sumReceivedInRange,
    findLastReceipt,
    findOpeningBalance,
    listGatewaysWithOpening,
} = require("./paymentGatewaySettlements");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const { customLog } = require("../../utils/loggerHelper");
const { istMonthToDateRange } = require("../../utils/istRange");
const { loadAccountingFloor, flooredAfter } = require("./accountingPeriod");
const { money } = require("./ledgerStatement");
const {
    ORDER_POSTING_SELECT,
    orderPostingOfRow,
    saleReachedBooksOfRow,
    reachedBooksSql,
    SALE_REACHED_BOOKS,
    ORDER_STATUS_FILTERS,
} = require("./journalPosting");

const JOURNAL_KEYS = ["transaction", "refund", "adminRefund", "cashback", "cashbackReversal"];

const BALANCES_CACHE_KEY = "accounting:payment-gateway-balances:v1";
const BALANCES_CACHE_TTL_SECONDS = 300;

const SORTABLE_FIELDS = ["gatewayName", "createdAt"];

const SORT_COLUMNS = {
    gatewayName: "chartOfAccounts.account_name",
    createdAt: "chartOfAccounts.createdAt",
};

// An order the gateway never answered on never happened, the same rule the vendor, partner
// and other-sales screens apply.
const UNANSWERED_STATUS = "PENDING";

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const select = (sql, replacements = {}) =>
    sequelizeConfig.query(sql, { replacements, type: sequelizeConfig.QueryTypes.SELECT });

const jsonAmount = path =>
    `CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${path}')) AS DECIMAL(16, 4))`;

const eventDate = key =>
    `COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${key}.journalDate')) AS DATE), DATE(orders.transactionDate))`;

const JOURNAL_LINES_TABLE = key => `CROSS JOIN JSON_TABLE(
                COALESCE(JSON_EXTRACT(orders.journalData, '$.${key}.lineItems'), JSON_ARRAY()),
                '$[*]' COLUMNS (
                    accountId VARCHAR(64) PATH '$.accountId',
                    direction VARCHAR(10) PATH '$.direction',
                    amount DECIMAL(16, 4) PATH '$.amount'
                )
            ) AS journalLines`;

// There is no gateway master table. The journal debits a chart-of-accounts row named after
// the gateway and stores that row's provider id on the order, so the account is the identity.
const GATEWAY_OF_ORDER =
    "JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.journalAccountIds.paymentGateway'))";

const HAS_GATEWAY_LEG = `${GATEWAY_OF_ORDER} IS NOT NULL`;

// An order whose journal never ran still names its gateway: the payment response stored on
// the order carries the name, as an object on most flows and as a one-element array on the
// subscription ones. The name is turned into the account id the same way the journal does
// it, through the chart-of-accounts row of that name.
const RESPONSE_GATEWAY_NAME =
    "CASE WHEN JSON_VALID(orders.paymentModeResponse) THEN COALESCE(" +
    "JSON_UNQUOTE(JSON_EXTRACT(orders.paymentModeResponse, '$.paymentGatewayName')), " +
    "JSON_UNQUOTE(JSON_EXTRACT(orders.paymentModeResponse, '$[0].paymentGatewayName'))) END";

const GATEWAY_NAME_OF_ORDER =
    "COALESCE(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.paymentGatewayName')), " +
    `${RESPONSE_GATEWAY_NAME})`;

const NAMED_GATEWAY_JOIN =
    "LEFT JOIN (SELECT CONVERT(account_name USING utf8mb4) AS accountName, " +
    "MIN(CONVERT(provider_account_id USING utf8mb4)) AS gatewayAccountId FROM chartOfAccounts " +
    "WHERE provider_account_id IS NOT NULL GROUP BY account_name) AS namedGateway " +
    `ON namedGateway.accountName = CONVERT(${GATEWAY_NAME_OF_ORDER} USING utf8mb4)`;

const EFFECTIVE_GATEWAY_OF_ORDER =
    `CONVERT(COALESCE(${GATEWAY_OF_ORDER}, namedGateway.gatewayAccountId) USING utf8mb4)`;

const RESPONSE_PG_AMOUNT =
    "CASE WHEN JSON_VALID(orders.paymentModeResponse) THEN CAST(COALESCE(" +
    "JSON_UNQUOTE(JSON_EXTRACT(orders.paymentModeResponse, '$.pgAmount')), " +
    "JSON_UNQUOTE(JSON_EXTRACT(orders.paymentModeResponse, '$[0].pgAmount'))) AS DECIMAL(16, 4)) END";

// What went through the gateway: the journal's figure, else the amount the payment response
// recorded. A wallet-only order can still carry a gateway name from the callers' default, so
// it is this amount being above zero, not the name, that makes an order a gateway one.
const GATEWAY_AMOUNT_OF_ORDER =
    `COALESCE(${jsonAmount("paymentThroughGateway")}, ${RESPONSE_PG_AMOUNT})`;

const GATEWAY_MATCH = `${GATEWAY_OF_ORDER} = :gatewayAccountId`;

const EFFECTIVE_GATEWAY_MATCH = `${EFFECTIVE_GATEWAY_OF_ORDER} = :gatewayAccountId`;

// An opening figure already contains everything up to its own date, so movements before it
// must not be counted a second time. The floor is joined rather than passed in, because the
// list snapshot positions every gateway in one query and each carries its own date.
// Both sides of the join are converted, because the settlements table and a string pulled
// out of JSON do not share a collation and MySQL refuses to compare them otherwise.
const OPENING_FLOOR_JOIN =
    "LEFT JOIN (SELECT CONVERT(gatewayAccountId USING utf8mb4) AS gatewayAccountId, " +
    "MAX(entryDate) AS floorDate " +
    "FROM paymentGatewaySettlements " +
    "WHERE entryKind = 'OPENING' AND entryType = 'ENTRY' AND status = 'ACTIVE' AND deletedAt IS NULL " +
    "GROUP BY gatewayAccountId) AS openingFloor";

const floorJoinOn = column =>
    `${OPENING_FLOOR_JOIN} ON openingFloor.gatewayAccountId = CONVERT(${column} USING utf8mb4)`;

// Strictly after, so an order dated on the as-of date is inside the opening figure too. Where
// a gateway has no opening the portal's go-live floor applies instead, and where it has one
// reconciled after go-live its own date governs.
const AFTER_FLOOR = key =>
    `${key} > GREATEST(COALESCE(openingFloor.floorDate, :accountingFloor), :accountingFloor)`;

const AFTER_FLOOR_DAY = "orders.transactionDate >= DATE_ADD(:accountingFloor, INTERVAL 1 DAY)";

const ORDER_SOURCE = `(orders.journalData IS NOT NULL OR ${AFTER_FLOOR_DAY})`;

// What a gateway is holding is the net debit the journal posted to its own account. A refund
// posts the mirror credit, already proportional on a partial admin refund, so the money going
// back out needs no arithmetic of our own.
const buildCollectedQuery = ({ range, gatewayAccountId }) => {
    const selects = JOURNAL_KEYS.map(key => {
        const where = [
            "orders.journalData IS NOT NULL",
            `orders.status <> '${UNANSWERED_STATUS}'`,
            "journalLines.accountId IS NOT NULL",
            reachedBooksSql(key),
        ];
        if (range) where.push(`${eventDate(key)} BETWEEN :from AND :to`);
        if (gatewayAccountId) where.push("journalLines.accountId = :gatewayAccountId");
        else where.push(`journalLines.accountId = ${GATEWAY_OF_ORDER}`);

        where.push(AFTER_FLOOR(eventDate(key)));

        return `SELECT CONVERT(journalLines.accountId USING utf8mb4) AS gatewayAccountId,
                journalLines.direction AS direction,
                journalLines.amount AS amount
            FROM orders
            ${JOURNAL_LINES_TABLE(key)}
            ${floorJoinOn("journalLines.accountId")}
            WHERE ${where.join(" AND ")}`;
    });

    return (
        "SELECT gatewayAccountId, " +
        "COALESCE(SUM(CASE WHEN direction = 'debit' THEN amount ELSE -amount END), 0) AS collected " +
        `FROM (${selects.join(" UNION ALL ")}) AS movements GROUP BY gatewayAccountId`
    );
};

const sumCollected = async ({ range, gatewayAccountId } = {}) => {
    const replacements = { accountingFloor: await loadAccountingFloor() };
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }
    if (gatewayAccountId) replacements.gatewayAccountId = String(gatewayAccountId);

    const rows = await select(buildCollectedQuery({ range, gatewayAccountId }), replacements);

    const map = {};
    rows.forEach(row => {
        map[row.gatewayAccountId] = round2(row.collected);
    });
    return map;
};

// The roster is every account the journal has actually debited as a gateway, so a gateway
// appears the moment it transacts and there is no list to keep in step by hand.
const GATEWAY_FROM =
    "FROM chartOfAccounts " +
    "INNER JOIN (SELECT DISTINCT " +
    `${GATEWAY_OF_ORDER} AS gatewayAccountId FROM orders ` +
    `WHERE orders.journalData IS NOT NULL AND ${HAS_GATEWAY_LEG}` +
    ") AS seen ON seen.gatewayAccountId = chartOfAccounts.provider_account_id";

const GATEWAY_SELECT =
    "CONVERT(chartOfAccounts.provider_account_id USING utf8mb4) AS gatewayAccountId, " +
    "CONVERT(chartOfAccounts.account_name USING utf8mb4) AS gatewayName, " +
    "CONVERT(chartOfAccounts.account_type USING utf8mb4) AS accountType, " +
    "chartOfAccounts.createdAt";

const gatewaySearchClause = searchText =>
    searchText
        ? " AND (chartOfAccounts.account_name LIKE :searchText " +
          "OR chartOfAccounts.provider_account_id LIKE :searchText)"
        : "";

const listGateways = async ({ limit, offset, searchText, sort, sortField }) => {
    const column = SORT_COLUMNS[SORTABLE_FIELDS.includes(sortField) ? sortField : "gatewayName"];
    const direction = sort === "DESC" ? "DESC" : "ASC";
    const where = `WHERE 1 = 1${gatewaySearchClause(searchText)}`;
    const replacements = { limit, offset, searchText: `%${searchText || ""}%` };

    const [rows, countRows] = await Promise.all([
        select(
            `SELECT ${GATEWAY_SELECT} ${GATEWAY_FROM} ${where} ` +
                `ORDER BY ${column} ${direction}, chartOfAccounts.provider_account_id ASC ` +
                "LIMIT :limit OFFSET :offset",
            replacements
        ),
        select(`SELECT COUNT(*) AS totalCount ${GATEWAY_FROM} ${where}`, replacements),
    ]);

    return { rows, count: countRows.length ? toNumber(countRows[0].totalCount) : 0 };
};

const findGatewayById = async gatewayAccountId => {
    const rows = await select(
        `SELECT ${GATEWAY_SELECT} ${GATEWAY_FROM} ` +
            "WHERE chartOfAccounts.provider_account_id = :gatewayAccountId LIMIT 1",
        { gatewayAccountId: String(gatewayAccountId) }
    );
    return rows.length ? rows[0] : null;
};

// Subscription orders carry serviceOperatorId NULL, so the plan name has to come through the
// subscriptions join. Reaching the service through serviceOperators alone would drop them all.
const SUBSCRIPTION_JOIN =
    "LEFT JOIN (" +
    "SELECT corporateTxnId, packageId, billingType, status FROM (" +
    "SELECT corporateTxnId, packageId, billingType, status, " +
    "ROW_NUMBER() OVER (PARTITION BY corporateTxnId ORDER BY id DESC) AS latestFirst " +
    "FROM subscriptions WHERE corporateTxnId IS NOT NULL" +
    ") AS ranked WHERE latestFirst = 1" +
    ") AS planSubscription ON planSubscription.corporateTxnId = orders.corporateTxnId " +
    "LEFT JOIN packages ON packages.id = planSubscription.packageId";

const ORDER_FROM =
    "FROM orders " +
    "INNER JOIN credentials customer ON customer.id = orders.credentialId " +
    "LEFT JOIN corporateUsers ON corporateUsers.credentialId = customer.id " +
    "LEFT JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId " +
    SUBSCRIPTION_JOIN;

// A subscription emits no totalTransactionAmount, so the order's own charged figure stands in
// for it rather than the row reading as blank.
const TRANSACTION_SELECT =
    "orders.id, CONVERT(orders.corporateTxnId USING utf8mb4) AS corporateTxnId, " +
    "orders.transactionDate, CONVERT(orders.status USING utf8mb4) AS status, " +
    "CONVERT(orders.paymentMode USING utf8mb4) AS paymentMode, " +
    "COALESCE(CONVERT(corporateUsers.name USING utf8mb4), " +
    "CONVERT(corporateUsers.contactPersonName USING utf8mb4), " +
    "CONVERT(customer.username USING utf8mb4)) AS subscriberName, " +
    "COALESCE(CONVERT(serviceOperators.serviceProvider USING utf8mb4), " +
    "CONVERT(packages.packageName USING utf8mb4)) AS service, " +
    `COALESCE(${jsonAmount("totalTransactionAmount")}, orders.amountInINR) AS totalAmount, ` +
    `${GATEWAY_AMOUNT_OF_ORDER} AS gatewayAmount, ` +
    ORDER_POSTING_SELECT;

const LISTED_ORDER_FROM = `${ORDER_FROM} ${NAMED_GATEWAY_JOIN}`;

const orderWhere = ({
    searchText,
    status,
    gatewayClause = EFFECTIVE_GATEWAY_MATCH,
    leading = [],
} = {}) => {
    const clauses = [
        ...leading,
        `orders.status <> '${UNANSWERED_STATUS}'`,
        // The gateway's own opening does not floor this tab — the older orders stay on it as
        // history. The portal's go live date does, because nothing before it belongs here.
        AFTER_FLOOR_DAY,
        flooredAfter("DATE(orders.transactionDate)"),
        gatewayClause,
        `COALESCE(${GATEWAY_AMOUNT_OF_ORDER}, 0) > 0`,
    ];
    // The Status pill reads only the order's own status, so the filter does too.
    if (Object.hasOwn(ORDER_STATUS_FILTERS, status)) clauses.push(ORDER_STATUS_FILTERS[status]);
    if (searchText) {
        clauses.push(
            "(orders.corporateTxnId LIKE :searchText OR corporateUsers.name LIKE :searchText " +
                "OR corporateUsers.contactPersonName LIKE :searchText OR customer.username LIKE :searchText " +
                "OR serviceOperators.serviceProvider LIKE :searchText " +
                "OR packages.packageName LIKE :searchText)"
        );
    }
    return `WHERE ${clauses.join(" AND ")}`;
};

const listGatewayOrders = async ({ gatewayAccountId, range, searchText, status, limit, offset }) => {
    const clauses = [orderWhere({ searchText, status })];
    if (range) clauses.push("AND DATE(orders.transactionDate) BETWEEN :from AND :to");
    const where = clauses.join(" ");

    const replacements = {
        gatewayAccountId: String(gatewayAccountId),
        searchText: `%${searchText || ""}%`,
        accountingFloor: await loadAccountingFloor(),
        limit,
        offset,
    };
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }

    const [rows, countRows] = await Promise.all([
        select(
            `SELECT ${TRANSACTION_SELECT} ${LISTED_ORDER_FROM} ${where} ` +
                "ORDER BY orders.transactionDate DESC, orders.id DESC LIMIT :limit OFFSET :offset",
            replacements
        ),
        select(`SELECT COUNT(*) AS totalCount ${LISTED_ORDER_FROM} ${where}`, replacements),
    ]);

    return { rows, count: countRows.length ? toNumber(countRows[0].totalCount) : 0 };
};

// The card counts what is still to be settled, so it stops at the opening the way the
// balance does. The tab itself keeps listing the older orders as history.
// The card counts against the balance, and the balance is built from journal lines, so only
// orders the journal placed on the gateway are counted here; the tab may list more.
const countGatewayOrders = async gatewayAccountId => {
    const rows = await select(
        `SELECT COUNT(*) AS totalCount ${ORDER_FROM} ` +
            `${floorJoinOn(GATEWAY_OF_ORDER)} ` +
            `${orderWhere({ gatewayClause: GATEWAY_MATCH, leading: ["orders.journalData IS NOT NULL"] })} ` +
            `AND ${SALE_REACHED_BOOKS} ` +
            `AND ${AFTER_FLOOR("DATE(orders.transactionDate)")}`,
        {
            gatewayAccountId: String(gatewayAccountId),
            accountingFloor: await loadAccountingFloor(),
        }
    );
    return rows.length ? toNumber(rows[0].totalCount) : 0;
};

const dayOf = value =>
    value instanceof Date ? istDay(value) : String(value).slice(0, 10);

// The orders before the opening stay listed as history, so the row says which side of the
// line it falls on rather than quietly disagreeing with the card above it.
const serializeTransaction = (row, openingAsOf = null) => {
    const derived = saleReachedBooksOfRow(row);
    return {
    id: row.id,
    corporateTxnId: row.corporateTxnId,
    transactionDate: row.transactionDate,
    subscriberName: row.subscriberName || null,
    service: row.service || null,
    paymentMode: row.paymentMode || null,
    totalAmount: derived ? round2(row.totalAmount) : null,
    gatewayAmount: derived ? money(row.gatewayAmount) : null,
    beforeOpening: Boolean(openingAsOf) && dayOf(row.transactionDate) <= dayOf(openingAsOf),
    status: row.status || null,
    posting: orderPostingOfRow(row),
    };
};

const buildPosition = ({ collected, received, fees, opening }) => {
    const collectedTotal = round2(collected);
    const receivedTotal = round2(received);
    const feesTotal = round2(fees);
    const openingTotal = round2(opening);

    // The gateway is a receivable: collecting raises what it owes Peko, and it settles that
    // either by handing money over or by keeping its charge. Both sides therefore reduce it.
    // The opening is what it already owed before any of this was recorded.
    return {
        collected: collectedTotal,
        received: receivedTotal,
        fees: feesTotal,
        opening: openingTotal,
        outstanding: round2(openingTotal + collectedTotal - receivedTotal - feesTotal),
    };
};

const getPaymentGatewayLedgerSummary = async (gatewayAccountId, range = null) => {
    const [
        standingCollected,
        standingReceived,
        standingFees,
        opening,
        periodCollected,
        periodReceived,
        periodFees,
        lastReceipt,
        openingRow,
        transactionCount,
    ] = await Promise.all([
        sumCollected({ range: null, gatewayAccountId }),
        sumReceivedFromGateway(gatewayAccountId, null),
        sumFeesForGateway(gatewayAccountId, null),
        sumOpeningForGateway(gatewayAccountId),
        range ? sumCollected({ range, gatewayAccountId }) : null,
        range ? sumReceivedFromGateway(gatewayAccountId, range) : null,
        range ? sumFeesForGateway(gatewayAccountId, range) : null,
        findLastReceipt(gatewayAccountId),
        findOpeningBalance(gatewayAccountId),
        countGatewayOrders(gatewayAccountId),
    ]);

    const standing = buildPosition({
        collected: standingCollected[gatewayAccountId],
        received: standingReceived,
        fees: standingFees,
        opening,
    });
    const period = range
        ? buildPosition({
              collected: periodCollected[gatewayAccountId],
              received: periodReceived,
              fees: periodFees,
              // The opening belongs to the standing position, not to a window inside it.
              opening: 0,
          })
        : null;
    const scoped = period || standing;

    return {
        ...scoped,
        // What is still to come is always the standing figure, never the window's, because a
        // date filter scopes the cards and not the debt.
        outstanding: standing.outstanding,
        opening: standing.opening,
        transactionCount,
        lastReceiptDate: lastReceipt ? lastReceipt.entryDate : null,
        lastReceiptAmount: lastReceipt ? round2(lastReceipt.amount) : null,
        openingBalanceSet: Boolean(openingRow),
        openingBalanceAsOf: openingRow ? openingRow.entryDate : null,
    };
};

const buildPaymentGatewayLedgerSnapshot = async (now = new Date()) => {
    const monthRange = istMonthToDateRange(now);
    const receiptMonthRange = {
        from: monthRange.from.slice(0, 10),
        to: monthRange.to.slice(0, 10),
    };

    const [gateways, collected, monthCollected, settledByGateway, receivedMtd, openings] =
        await Promise.all([
            select(`SELECT ${GATEWAY_SELECT} ${GATEWAY_FROM}`),
            sumCollected({ range: null }),
            sumCollected({ range: monthRange }),
            sumSettledByGateway(),
            sumReceivedInRange(receiptMonthRange),
            listGatewaysWithOpening(),
        ]);

    const balances = {};
    gateways.forEach(row => {
        const settled = settledByGateway[row.gatewayAccountId] || {
            received: 0,
            fees: 0,
            opening: 0,
        };
        balances[row.gatewayAccountId] = {
            ...buildPosition({
                collected: collected[row.gatewayAccountId],
                received: settled.received,
                fees: settled.fees,
                opening: settled.opening,
            }),
            openingBalanceSet: Boolean(openings[row.gatewayAccountId]),
            openingBalanceAsOf: openings[row.gatewayAccountId] || null,
        };
    });

    const totals = Object.values(balances).reduce(
        (acc, position) => {
            acc.outstanding += position.outstanding;
            if (position.outstanding > 0) acc.awaitingSettlement += 1;
            return acc;
        },
        { outstanding: 0, awaitingSettlement: 0 }
    );

    return {
        generatedAt: now.toISOString(),
        balances,
        totalGateways: gateways.length,
        outstandingTotal: round2(totals.outstanding),
        awaitingSettlement: totals.awaitingSettlement,
        monthly: {
            collected: round2(
                Object.values(monthCollected).reduce((sum, amount) => sum + toNumber(amount), 0)
            ),
            received: round2(receivedMtd),
        },
    };
};

const getPaymentGatewayLedgerSnapshot = async ({ refresh = false } = {}) => {
    if (!refresh) {
        try {
            const cached = await getValue(BALANCES_CACHE_KEY);
            if (cached) return { ...JSON.parse(cached), cached: true };
        } catch (error) {
            customLog(null, "error", {
                message: "Payment gateway balances cache read failed",
                error: error && error.message,
            });
        }
    }

    const payload = await buildPaymentGatewayLedgerSnapshot();
    try {
        await setValue(BALANCES_CACHE_KEY, BALANCES_CACHE_TTL_SECONDS, JSON.stringify(payload));
    } catch (error) {
        customLog(null, "error", {
            message: "Payment gateway balances cache write failed",
            error: error && error.message,
        });
    }
    return { ...payload, cached: false };
};

const EMPTY_POSITION = {
    collected: 0,
    received: 0,
    fees: 0,
    opening: 0,
    outstanding: 0,
    openingBalanceSet: false,
    openingBalanceAsOf: null,
};

const serializeGateway = (row, position) => ({
    gatewayAccountId: row.gatewayAccountId,
    gatewayName: row.gatewayName,
    accountType: row.accountType || null,
    ...(position || EMPTY_POSITION),
});

const buildPaymentGatewayKpis = snapshot => ({
    totalGateways: toNumber(snapshot.totalGateways),
    outstandingTotal: round2(snapshot.outstandingTotal),
    awaitingSettlement: toNumber(snapshot.awaitingSettlement),
    collectedThisMonth: round2(snapshot.monthly && snapshot.monthly.collected),
    receivedThisMonth: round2(snapshot.monthly && snapshot.monthly.received),
});

module.exports = {
    JOURNAL_KEYS,
    BALANCES_CACHE_KEY,
    BALANCES_CACHE_TTL_SECONDS,
    SORTABLE_FIELDS,
    UNANSWERED_STATUS,
    GATEWAY_OF_ORDER,
    GATEWAY_NAME_OF_ORDER,
    EFFECTIVE_GATEWAY_OF_ORDER,
    GATEWAY_AMOUNT_OF_ORDER,
    GATEWAY_MATCH,
    EFFECTIVE_GATEWAY_MATCH,
    LISTED_ORDER_FROM,
    OPENING_FLOOR_JOIN,
    AFTER_FLOOR,
    AFTER_FLOOR_DAY,
    ORDER_SOURCE,
    buildCollectedQuery,
    sumCollected,
    listGateways,
    findGatewayById,
    listGatewayOrders,
    countGatewayOrders,
    serializeTransaction,
    buildPosition,
    getPaymentGatewayLedgerSummary,
    buildPaymentGatewayLedgerSnapshot,
    getPaymentGatewayLedgerSnapshot,
    serializeGateway,
    buildPaymentGatewayKpis,
};
