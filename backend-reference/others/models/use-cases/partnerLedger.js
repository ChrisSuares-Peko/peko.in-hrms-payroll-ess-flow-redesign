const sequelizeConfig = require("../../configs/database/index");
const { findByAccountName, findGenericAccountByName } = require("./chartOfAccount");
const {
    sumPaidToPartner,
    sumOpeningForPartner,
    sumByPartnerAndKind,
    sumPaidInRange,
    findLastPayout,
    findOpeningBalance,
    listPartnersWithOpening,
} = require("./partnerPayouts");
const {
    ENTRY_KINDS: PARTNER_ENTRY_KINDS,
    sumEntries: sumPartnerEntries,
    sumEntriesByPartner,
} = require("./partnerLedgerEntries");
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
    ORDER_STATUS_FILTERS,
    gmvOfOrder,
} = require("./journalPosting");

const JOURNAL_KEYS = ["transaction", "refund", "adminRefund", "cashback", "cashbackReversal"];

const PARTNERSHIP_PAYABLE_ACCOUNT = "Partnership Fee Payable";

const BALANCES_CACHE_KEY = "accounting:partner-balances:v3";
const BALANCES_CACHE_TTL_SECONDS = 300;

const SORTABLE_FIELDS = ["partnerName", "sharePercentage", "brandingStatus", "createdAt"];

const SORT_COLUMNS = {
    partnerName: "partnerCredential.name",
    sharePercentage: "systemUsers.sharePercentage",
    brandingStatus: "systemUsers.brandingStatus",
    createdAt: "systemUsers.createdAt",
};

// An order the gateway never answered on never happened, the same rule the vendor and
// other-sales screens apply.
const UNANSWERED_STATUS = "PENDING";

const PEKO_PLAN_TAG = "SUBSCRIPTION";
const PEKO_ADDON_TAG = "SUBSCRIPTION-ADDONS";

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

// A partner's own credential points at itself, so it would otherwise turn up as its own
// customer. registeredBy is a VARCHAR that can hold 'null', so it is matched numerically.
const CUSTOMER_JOIN =
    "INNER JOIN credentials customer ON customer.id = orders.credentialId";

const IS_PARTNER_CUSTOMER =
    "customer.registeredBy REGEXP '^[0-9]+$' AND CAST(customer.registeredBy AS UNSIGNED) <> customer.id";

const PARTNER_OF_ORDER = "CAST(customer.registeredBy AS UNSIGNED)";

// An opening figure already contains everything up to its own date, so movements before it
// must not be counted a second time. The floor is joined rather than passed in, because the
// list snapshot positions every partner in one query and each carries its own date.
const OPENING_FLOOR_JOIN =
    "LEFT JOIN (SELECT partnerCredentialId, MAX(payoutDate) AS floorDate " +
    "FROM partnerPayouts " +
    "WHERE entryKind = 'OPENING' AND entryType = 'PAYOUT' AND status = 'ACTIVE' AND deletedAt IS NULL " +
    `GROUP BY partnerCredentialId) AS openingFloor ON openingFloor.partnerCredentialId = ${PARTNER_OF_ORDER}`;

// Strictly after, so an order dated on the as-of date is inside the opening figure too. Where
// a partner has no opening the portal's go-live floor applies instead, and where it has one
// reconciled after go-live its own date governs.
const AFTER_FLOOR = key =>
    `${key} > GREATEST(COALESCE(openingFloor.floorDate, :accountingFloor), :accountingFloor)`;

const getPartnershipPayableAccountId = async () => {
    const generic = await findGenericAccountByName(PARTNERSHIP_PAYABLE_ACCOUNT, [
        "provider_account_id",
    ]);
    const account = generic || (await findByAccountName(PARTNERSHIP_PAYABLE_ACCOUNT));
    return (account && account.provider_account_id) || null;
};

// What a partner has earned is the net credit the journal posted to Partnership Fee Payable
// against that partner's orders. A refund posts the mirror debit, already proportional on a
// partial admin refund, so the clawback needs no arithmetic of our own.
const buildEarnedQuery = ({ range, partnerId }) => {
    const selects = JOURNAL_KEYS.map(key => {
        const where = [
            "orders.journalData IS NOT NULL",
            IS_PARTNER_CUSTOMER,
            "journalLines.accountId = :payableAccountId",
            reachedBooksSql(key),
        ];
        if (range) where.push(`${eventDate(key)} BETWEEN :from AND :to`);
        if (partnerId) where.push("customer.registeredBy = :partnerId");
        where.push(AFTER_FLOOR(eventDate(key)));

        return `SELECT ${PARTNER_OF_ORDER} AS partnerCredentialId,
                journalLines.direction AS direction,
                journalLines.amount AS amount
            FROM orders
            ${CUSTOMER_JOIN}
            ${JOURNAL_LINES_TABLE(key)}
            ${OPENING_FLOOR_JOIN}
            WHERE ${where.join(" AND ")}`;
    });

    return (
        "SELECT partnerCredentialId, " +
        "COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0) AS earned " +
        `FROM (${selects.join(" UNION ALL ")}) AS movements GROUP BY partnerCredentialId`
    );
};

const sumEarned = async ({ payableAccountId, range, partnerId }) => {
    if (!payableAccountId) return {};

    const replacements = { payableAccountId, accountingFloor: await loadAccountingFloor() };
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }
    if (partnerId) replacements.partnerId = String(partnerId);

    const rows = await select(buildEarnedQuery({ range, partnerId }), replacements);

    const map = {};
    rows.forEach(row => {
        map[row.partnerCredentialId] = round2(row.earned);
    });
    return map;
};

const buildPartnerGmvQuery = ({ range, partnerId }) => {
    const where = [
        "orders.status = 'SUCCESS'",
        IS_PARTNER_CUSTOMER,
        flooredAfter("DATE(orders.transactionDate)"),
    ];
    if (range) where.push("orders.transactionDate BETWEEN :from AND :to");
    if (partnerId) where.push("customer.registeredBy = :partnerId");

    return (
        "SELECT customer.registeredBy AS partnerCredentialId, " +
        `COALESCE(SUM(${gmvOfOrder("orders")}), 0) AS gmv ` +
        `FROM orders ${CUSTOMER_JOIN} WHERE ${where.join(" AND ")} ` +
        "GROUP BY customer.registeredBy"
    );
};

const sumPartnerGmv = async ({ partnerId, range }) => {
    const replacements = { accountingFloor: await loadAccountingFloor() };
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }
    if (partnerId) replacements.partnerId = String(partnerId);

    const rows = await select(buildPartnerGmvQuery({ range, partnerId }), replacements);
    return round2(rows.reduce((total, row) => total + toNumber(row.gmv), 0));
};

const PARTNER_FROM =
    "FROM systemUsers " +
    "INNER JOIN roleAndPermissions ON roleAndPermissions.id = systemUsers.roleAndPermissionId " +
    "AND roleAndPermissions.roleName = 'partner' " +
    "INNER JOIN credentials partnerCredential ON partnerCredential.id = systemUsers.credentialId";

const PARTNER_SELECT =
    "partnerCredential.id AS credentialId, CONVERT(partnerCredential.name USING utf8mb4) AS partnerName, " +
    "systemUsers.id AS systemUserId, systemUsers.sharePercentage, " +
    "CONVERT(systemUsers.branding USING utf8mb4) AS branding, " +
    "CONVERT(systemUsers.portalUrl USING utf8mb4) AS portalUrl, " +
    "systemUsers.brandingStatus, systemUsers.createdAt";

const partnerSearchClause = searchText =>
    searchText
        ? " AND (partnerCredential.name LIKE :searchText OR systemUsers.branding LIKE :searchText " +
          "OR systemUsers.portalUrl LIKE :searchText)"
        : "";

const listPartners = async ({ limit, offset, searchText, sort, sortField }) => {
    const column = SORT_COLUMNS[SORTABLE_FIELDS.includes(sortField) ? sortField : "partnerName"];
    const direction = sort === "DESC" ? "DESC" : "ASC";
    const where = `WHERE 1 = 1${partnerSearchClause(searchText)}`;
    const replacements = { limit, offset, searchText: `%${searchText || ""}%` };

    const [rows, countRows] = await Promise.all([
        select(
            `SELECT ${PARTNER_SELECT} ${PARTNER_FROM} ${where} ` +
                `ORDER BY ${column} ${direction}, partnerCredential.id ASC LIMIT :limit OFFSET :offset`,
            replacements
        ),
        select(`SELECT COUNT(*) AS totalCount ${PARTNER_FROM} ${where}`, replacements),
    ]);

    return { rows, count: countRows.length ? toNumber(countRows[0].totalCount) : 0 };
};

const findPartnerById = async credentialId => {
    const rows = await select(
        `SELECT ${PARTNER_SELECT} ${PARTNER_FROM} WHERE partnerCredential.id = :credentialId LIMIT 1`,
        { credentialId }
    );
    return rows.length ? rows[0] : null;
};

// orders.optional is NULL on an ordinary order, and NOT NULL is NULL rather than true, so
// the tag is coalesced before it is compared. Without this the negation drops every row.
const ORDER_TAG = "COALESCE(orders.optional, '')";

const IS_PEKO_SUBSCRIPTION =
    `(${ORDER_TAG} = '${PEKO_PLAN_TAG}' ` +
    `OR (${ORDER_TAG} = '${PEKO_ADDON_TAG}' AND planSubscription.serviceOperatorId IS NULL))`;

// The plan name join, deliberately not scoped to one corporate the way the subscriber
// ledger scopes it, because a partner's tab spans every corporate under it.
const SUBSCRIPTION_JOIN =
    "LEFT JOIN (" +
    "SELECT corporateTxnId, packageId, billingType, serviceOperatorId, status FROM (" +
    "SELECT corporateTxnId, packageId, billingType, serviceOperatorId, status, " +
    "ROW_NUMBER() OVER (PARTITION BY corporateTxnId ORDER BY id DESC) AS latestFirst " +
    "FROM subscriptions WHERE corporateTxnId IS NOT NULL" +
    ") AS ranked WHERE latestFirst = 1" +
    ") AS planSubscription ON planSubscription.corporateTxnId = orders.corporateTxnId " +
    "LEFT JOIN packages ON packages.id = planSubscription.packageId";

const ORDER_FROM =
    "FROM orders " +
    CUSTOMER_JOIN +
    " LEFT JOIN corporateUsers ON corporateUsers.credentialId = customer.id " +
    " LEFT JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId " +
    SUBSCRIPTION_JOIN;

// A partner's percentage changes over time and the journal never stored the rate, only the
// money. The fee is a flat percentage of a base that is stored, so the rate that actually
// applied is recovered by dividing one by the other. NULLIF keeps a zero base out of the
// division: nothing to share means no rate to report, not a rate of zero.
const GATEWAY_CHARGE = `COALESCE(${jsonAmount("gatewayCharge")}, 0)`;

// The pipeline shares the subscription income net of GST (gateway amount with its GST taken
// out, plus the discount Peko bore), so the base here reads that figure; the gross fallback
// only serves an entry written before netSubscriptionIncome existed.
const SUBSCRIPTION_SHARE_BASE =
    `GREATEST(COALESCE(${jsonAmount("netSubscriptionIncome")}, ` +
    `${jsonAmount("paymentThroughGateway")} + ${jsonAmount("couponTotalDiscount")}) - ${GATEWAY_CHARGE}, 0)`;

// Peko's own earnings on the order, whichever way its items were sold: the pipeline shares
// the margin commission, the principal commission and the platform fee alike, less the
// gateway charge the partner bears.
const ORDER_SHARE_BASE =
    `GREATEST(${jsonAmount("commissionExcludingGST")} + COALESCE(${jsonAmount("principalCommissionExcludingGST")}, 0) ` +
    `+ ${jsonAmount("platformFeeExcludingGST")} - ${GATEWAY_CHARGE}, 0)`;

const NET_COMMISSION =
    `CASE WHEN ${jsonAmount("commissionExcludingGST")} IS NULL AND ${jsonAmount("principalCommissionExcludingGST")} IS NULL THEN NULL ` +
    `ELSE COALESCE(${jsonAmount("commissionExcludingGST")}, 0) + COALESCE(${jsonAmount("principalCommissionExcludingGST")}, 0) END`;

const shareSelect = base =>
    `${jsonAmount("partnerShipFee")} AS shareExcludingGST, ` +
    `${jsonAmount("inputGSTonPartnerShipFee")} AS shareGST, ` +
    `${jsonAmount("partnerPayable")} AS partnerShare, ` +
    `${jsonAmount("gatewayCharge")} AS gatewayCharge, ` +
    `${base} AS shareBase, ` +
    `(${jsonAmount("partnerShipFee")} / NULLIF(${base}, 0)) * 100 AS sharePercentageApplied`;

const COUPON_SELECT = `${jsonAmount("couponTotalDiscount")} AS couponTotal`;

const ROW_HEAD_SELECT =
    "orders.id, CONVERT(orders.corporateTxnId USING utf8mb4) AS corporateTxnId, " +
    "orders.transactionDate, CONVERT(orders.status USING utf8mb4) AS status, " +
    "CONVERT(orders.optional USING utf8mb4) AS optional, " +
    "COALESCE(CONVERT(corporateUsers.name USING utf8mb4), " +
    "CONVERT(corporateUsers.contactPersonName USING utf8mb4), " +
    "CONVERT(customer.username USING utf8mb4)) AS subscriberName, " +
    ORDER_POSTING_SELECT;

const TRANSACTION_SELECT =
    `${ROW_HEAD_SELECT}, ` +
    "CONVERT(serviceOperators.serviceProvider USING utf8mb4) AS service, " +
    `COALESCE(${jsonAmount("totalTransactionAmount")}, orders.amountInINR) AS totalAmount, ` +
    `${jsonAmount("platformFeeExcludingGST")} AS netPlatformFee, ` +
    `${NET_COMMISSION} AS netCommission, ` +
    `${COUPON_SELECT}, ` +
    shareSelect(ORDER_SHARE_BASE);

const SUBSCRIPTION_SELECT =
    `${ROW_HEAD_SELECT}, ` +
    "CONVERT(packages.packageName USING utf8mb4) AS planName, " +
    "CONVERT(planSubscription.billingType USING utf8mb4) AS billingType, " +
    "CONVERT(planSubscription.status USING utf8mb4) AS subscriptionStatus, " +
    "orders.amountInINR AS totalAmount, " +
    `${jsonAmount("netSubscriptionIncome")} AS netRevenue, ` +
    `${COUPON_SELECT}, ` +
    shareSelect(SUBSCRIPTION_SHARE_BASE);

// What the table names the order by: the service on Transactions, the plan on Own
// Subscriptions, which have no service operator.
const orderNameOf = subscriptions =>
    subscriptions ? "packages.packageName" : "serviceOperators.serviceProvider";

const orderWhere = ({ range, searchText, status, subscriptions }) => {
    const where = [
        IS_PARTNER_CUSTOMER,
        "customer.registeredBy = :partnerId",
        `orders.status <> '${UNANSWERED_STATUS}'`,
        subscriptions ? IS_PEKO_SUBSCRIPTION : `NOT ${IS_PEKO_SUBSCRIPTION}`,
        // The partner's own opening does not floor this tab — the older orders stay on it as
        // history. The portal's go live date does, because nothing before it belongs here.
        flooredAfter("DATE(orders.transactionDate)"),
    ];
    if (range) where.push("orders.transactionDate BETWEEN :from AND :to");
    if (Object.hasOwn(ORDER_STATUS_FILTERS, status)) where.push(ORDER_STATUS_FILTERS[status]);
    if (searchText) {
        where.push(
            `(orders.corporateTxnId LIKE :searchText OR ${orderNameOf(subscriptions)} LIKE :searchText ` +
                "OR corporateUsers.name LIKE :searchText OR corporateUsers.contactPersonName LIKE :searchText " +
                "OR customer.username LIKE :searchText)"
        );
    }
    return `WHERE ${where.join(" AND ")}`;
};

const listPartnerOrders = async ({
    partnerId,
    range,
    searchText,
    status,
    subscriptions,
    limit,
    offset,
}) => {
    const where = orderWhere({ range, searchText, status, subscriptions });
    const replacements = {
        partnerId: String(partnerId),
        accountingFloor: await loadAccountingFloor(),
    };
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }
    if (searchText) replacements.searchText = `%${searchText}%`;

    const selectList = subscriptions ? SUBSCRIPTION_SELECT : TRANSACTION_SELECT;

    const [rows, countRows] = await Promise.all([
        select(
            `SELECT ${selectList} ${ORDER_FROM} ${where} ` +
                "ORDER BY orders.transactionDate DESC, orders.id DESC LIMIT :limit OFFSET :offset",
            { ...replacements, limit, offset }
        ),
        select(`SELECT COUNT(*) AS totalCount ${ORDER_FROM} ${where}`, replacements),
    ]);

    return { rows, count: countRows.length ? toNumber(countRows[0].totalCount) : 0 };
};

const percentOrNull = value =>
    value === null || value === undefined ? null : Math.round(toNumber(value) * 100) / 100;

const derivedFigure = (row, value) => (saleReachedBooksOfRow(row) ? money(value) : null);

const serializeTransaction = row => {
    const derived = saleReachedBooksOfRow(row);
    const figure = value => (derived ? money(value) : null);
    return {
        id: row.id,
        corporateTxnId: row.corporateTxnId,
        transactionDate: row.transactionDate,
        subscriberName: row.subscriberName || null,
        service: row.service || null,
        totalAmount: derived ? round2(row.totalAmount) : null,
        netPlatformFee: figure(row.netPlatformFee),
        netCommission: figure(row.netCommission),
        couponTotal: figure(row.couponTotal),
        gatewayCharge: figure(row.gatewayCharge),
        shareBase: figure(row.shareBase),
        shareExcludingGST: figure(row.shareExcludingGST),
        shareGST: figure(row.shareGST),
        partnerShare: figure(row.partnerShare),
        sharePercentageApplied: derived ? percentOrNull(row.sharePercentageApplied) : null,
        status: row.status || null,
        posting: orderPostingOfRow(row),
    };
};

const serializeSubscription = row => ({
    id: row.id,
    corporateTxnId: row.corporateTxnId,
    transactionDate: row.transactionDate,
    subscriberName: row.subscriberName || null,
    planName: row.planName || null,
    billingType: row.billingType || null,
    subscriptionStatus: row.subscriptionStatus || null,
    addOn: row.optional === PEKO_ADDON_TAG,
    totalAmount: derivedFigure(row, row.totalAmount),
    netRevenue: derivedFigure(row, row.netRevenue),
    couponTotal: derivedFigure(row, row.couponTotal),
    gatewayCharge: derivedFigure(row, row.gatewayCharge),
    shareBase: derivedFigure(row, row.shareBase),
    shareExcludingGST: derivedFigure(row, row.shareExcludingGST),
    shareGST: derivedFigure(row, row.shareGST),
    partnerShare: derivedFigure(row, row.partnerShare),
    sharePercentageApplied: saleReachedBooksOfRow(row) ? percentOrNull(row.sharePercentageApplied) : null,
    status: row.status || null,
    posting: orderPostingOfRow(row),
});

const buildPosition = ({ earned, paid, opening, debitNotes }) => {
    const earnedTotal = round2(earned);
    const paidTotal = round2(paid);
    const openingTotal = round2(opening);
    const debitNotesTotal = round2(debitNotes);

    // The partner is a payable: earning raises what Peko owes, and a payout or a debit note
    // settles it. An underpayment therefore stays owed instead of being written off at the
    // payout date. The opening is what Peko already owed before any of this was recorded.
    return {
        earned: earnedTotal,
        paid: paidTotal,
        debitNotes: debitNotesTotal,
        opening: openingTotal,
        owed: round2(openingTotal + earnedTotal - paidTotal - debitNotesTotal),
    };
};

const getPartnerLedgerSummary = async (partnerId, range = null) => {
    const payableAccountId = await getPartnershipPayableAccountId();

    const [
        standingEarned,
        standingPaid,
        standingDebitNotes,
        opening,
        periodEarned,
        periodPaid,
        periodDebitNotes,
        lastPayout,
        openingRow,
        gmv,
    ] = await Promise.all([
            sumEarned({ payableAccountId, range: null, partnerId }),
            sumPaidToPartner(partnerId, null),
            sumPartnerEntries(partnerId, PARTNER_ENTRY_KINDS.debitNote, null),
            sumOpeningForPartner(partnerId),
            range ? sumEarned({ payableAccountId, range, partnerId }) : null,
            range ? sumPaidToPartner(partnerId, range) : null,
            range ? sumPartnerEntries(partnerId, PARTNER_ENTRY_KINDS.debitNote, range) : null,
            findLastPayout(partnerId),
            findOpeningBalance(partnerId),
            sumPartnerGmv({ partnerId, range }),
        ]);

    const standing = buildPosition({
        earned: standingEarned[partnerId],
        paid: standingPaid,
        debitNotes: standingDebitNotes,
        opening,
    });
    const period = range
        ? buildPosition({
              earned: periodEarned[partnerId],
              paid: periodPaid,
              debitNotes: periodDebitNotes,
              // The opening belongs to the standing position, not to a window inside it.
              opening: 0,
          })
        : null;
    const scoped = period || standing;

    return {
        ...scoped,
        // What is still owed is always the standing figure, never the window's, because a
        // date filter scopes the cards and not the debt.
        owed: standing.owed,
        opening: standing.opening,
        gmv,
        lastPayoutDate: lastPayout ? lastPayout.payoutDate : null,
        lastPayoutAmount: lastPayout ? round2(lastPayout.amount) : null,
        openingBalanceSet: Boolean(openingRow),
        openingBalanceAsOf: openingRow ? openingRow.payoutDate : null,
        partnershipAccountConfigured: Boolean(payableAccountId),
    };
};

const buildPartnerLedgerSnapshot = async (now = new Date()) => {
    const payableAccountId = await getPartnershipPayableAccountId();
    const monthRange = istMonthToDateRange(now);
    const payoutMonthRange = {
        from: monthRange.from.slice(0, 10),
        to: monthRange.to.slice(0, 10),
    };

    const [
        partners,
        earned,
        monthEarned,
        monthGmv,
        settledByPartner,
        debitNotesByPartner,
        paidMtd,
        openings,
    ] = await Promise.all([
        select(`SELECT ${PARTNER_SELECT} ${PARTNER_FROM}`),
        sumEarned({ payableAccountId, range: null }),
        sumEarned({ payableAccountId, range: monthRange }),
        sumPartnerGmv({ range: monthRange }),
        sumByPartnerAndKind(),
        sumEntriesByPartner(PARTNER_ENTRY_KINDS.debitNote),
        sumPaidInRange(payoutMonthRange),
        listPartnersWithOpening(),
    ]);

    const balances = {};
    partners.forEach(row => {
        const settled = settledByPartner[row.credentialId] || { paid: 0, opening: 0 };
        balances[row.credentialId] = {
            ...buildPosition({
                earned: earned[row.credentialId],
                paid: settled.paid,
                debitNotes: debitNotesByPartner[row.credentialId],
                opening: settled.opening,
            }),
            openingBalanceSet: Boolean(openings[row.credentialId]),
            openingBalanceAsOf: openings[row.credentialId] || null,
        };
    });

    const totals = Object.values(balances).reduce(
        (acc, position) => {
            acc.owed += position.owed;
            if (position.owed > 0) acc.awaitingPayout += 1;
            return acc;
        },
        { owed: 0, awaitingPayout: 0 }
    );

    return {
        generatedAt: now.toISOString(),
        partnershipAccountConfigured: Boolean(payableAccountId),
        balances,
        totalPartners: partners.length,
        partnersWithoutShare: partners.filter(
            row => row.sharePercentage === null || row.sharePercentage === undefined
        ).length,
        owedTotal: round2(totals.owed),
        awaitingPayout: totals.awaitingPayout,
        monthly: {
            earned: round2(
                Object.values(monthEarned).reduce((sum, amount) => sum + toNumber(amount), 0)
            ),
            paid: round2(paidMtd),
            gmv: monthGmv,
        },
    };
};

const getPartnerLedgerSnapshot = async ({ refresh = false } = {}) => {
    if (!refresh) {
        try {
            const cached = await getValue(BALANCES_CACHE_KEY);
            if (cached) return { ...JSON.parse(cached), cached: true };
        } catch (error) {
            customLog(null, "error", {
                message: "Partner balances cache read failed",
                error: error && error.message,
            });
        }
    }

    const payload = await buildPartnerLedgerSnapshot();
    try {
        await setValue(BALANCES_CACHE_KEY, BALANCES_CACHE_TTL_SECONDS, JSON.stringify(payload));
    } catch (error) {
        customLog(null, "error", {
            message: "Partner balances cache write failed",
            error: error && error.message,
        });
    }
    return { ...payload, cached: false };
};

const EMPTY_POSITION = {
    earned: 0,
    paid: 0,
    debitNotes: 0,
    opening: 0,
    owed: 0,
    openingBalanceSet: false,
    openingBalanceAsOf: null,
};

const serializePartner = (row, position) => {
    const balance = position || EMPTY_POSITION;
    return {
        credentialId: row.credentialId,
        systemUserId: row.systemUserId,
        partnerName: row.partnerName,
        branding: row.branding || null,
        portalUrl: row.portalUrl || null,
        sharePercentage:
            row.sharePercentage === null || row.sharePercentage === undefined
                ? null
                : round2(row.sharePercentage),
        isActive: Boolean(row.brandingStatus),
        ...balance,
    };
};

const buildPartnerKpis = snapshot => ({
    totalPartners: toNumber(snapshot.totalPartners),
    owedTotal: round2(snapshot.owedTotal),
    awaitingPayout: toNumber(snapshot.awaitingPayout),
    partnersWithoutShare: toNumber(snapshot.partnersWithoutShare),
    earnedThisMonth: round2(snapshot.monthly && snapshot.monthly.earned),
    paidThisMonth: round2(snapshot.monthly && snapshot.monthly.paid),
    gmvThisMonth: round2(snapshot.monthly && snapshot.monthly.gmv),
});

module.exports = {
    JOURNAL_KEYS,
    PARTNERSHIP_PAYABLE_ACCOUNT,
    BALANCES_CACHE_KEY,
    BALANCES_CACHE_TTL_SECONDS,
    SORTABLE_FIELDS,
    UNANSWERED_STATUS,
    IS_PEKO_SUBSCRIPTION,
    OPENING_FLOOR_JOIN,
    AFTER_FLOOR,
    getPartnershipPayableAccountId,
    buildEarnedQuery,
    sumEarned,
    buildPartnerGmvQuery,
    sumPartnerGmv,
    listPartners,
    findPartnerById,
    listPartnerOrders,
    serializeTransaction,
    serializeSubscription,
    buildPosition,
    getPartnerLedgerSummary,
    buildPartnerLedgerSnapshot,
    getPartnerLedgerSnapshot,
    serializePartner,
    buildPartnerKpis,
};
