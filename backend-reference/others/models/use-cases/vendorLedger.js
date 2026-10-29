const { Op, literal } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const vendor = require("../entities/vendor");
const serviceOperator = require("../entities/serviceOperator");
const order = require("../entities/order");
const credential = require("../entities/credential");
const {
    findByAccountName,
    findGenericAccountByName,
    findAccountIdsByName,
    findLegacyVendorDepositAccounts,
} = require("./chartOfAccount");
const { getASetting } = require("./setting");
const {
    sumActiveDeposits,
    sumActiveDepositsByVendor,
    sumDepositsInRange,
    listVendorsWithOpeningBalance,
    findOpeningBalance,
} = require("./vendorDeposits");
const {
    ENTRY_KINDS,
    sumManualEntries,
    sumManualEntriesByVendor,
    sumManualEntriesInRange,
    countOpenEntries,
} = require("./vendorLedgerEntries");
const { gstFieldsOf } = require("./ledgerGst");
const {
    MIXED,
    AGENT_MARKUP,
    OWN_REVENUE,
    MARKUP_MODES,
    commissionModeSql,
    commissionModeOfJournal,
    sellingModeSql,
    sellingModeOf,
} = require("./sellingMode");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const { customLog } = require("../../utils/loggerHelper");
const { istMonthToDateRange } = require("../../utils/istRange");
const { loadAccountingFloor, dayOf } = require("./accountingPeriod");
const { isVendorService, isListedVendorService } = require("./classifiedServices");
const {
    NOT_APPLICABLE,
    postingSelect,
    noPostingSelect,
    factsOfRow,
    salePosting,
    eventPostingOfRow,
    orderPostingOfJournal,
    reachedBooks,
    reachedBooksSql,
    saleReachedBooksOfJournal,
    SALE_REACHED_BOOKS,
} = require("./journalPosting");
const { booksFieldsOf } = require("./ledgerEntryChanges");

const JOURNAL_KEYS = ["transaction", "refund", "adminRefund", "cashback", "cashbackReversal"];

const REFUND_KEYS = ["refund", "adminRefund"];

const VENDOR_DEPOSITS_ACCOUNT = "Vendor Deposits";

const COMMISSION_ACCOUNT = "Commission";

// Principal markup means Peko bought and resold rather than acting for the vendor, so the
// journal books the whole order to Sales and posts nothing to Vendor Deposits or to
// Commission. The order is still the vendor's business: it is listed on the profile at the
// vendor's price, with Peko's markup shown beside it, but it earns no commission and takes
// nothing out of the advance.
const PRINCIPAL_MARKUP = "PRINCIPAL_MARKUP";

const LOW_BALANCE_SETTING = "vendorLowBalanceThreshold";
const DEFAULT_LOW_BALANCE = 25000;

const BALANCES_CACHE_KEY = "accounting:vendor-balances:v5";
const BALANCES_CACHE_TTL_SECONDS = 300;

const SORTABLE_FIELDS = ["vendorName", "type", "isActive", "createdAt"];

const VENDOR_ATTRIBUTES = ["id", "vendorName", "type", "isActive", "gstNo", "createdAt"];

// An order the gateway never answered on never happened as far as the vendor is
// concerned, so it is absent from every tab, the statement and the balance.
const UNANSWERED_STATUS = "PENDING";

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const isPresent = value => value !== undefined && value !== null;

const getSharedDepositsAccountId = async () => {
    const generic = await findGenericAccountByName(VENDOR_DEPOSITS_ACCOUNT, [
        "provider_account_id",
    ]);
    const account = generic || (await findByAccountName(VENDOR_DEPOSITS_ACCOUNT));
    return (account && account.provider_account_id) || null;
};

// The journal picks its income accounts out of findAllByAccountNames, which matches on the
// name alone, so this does the same rather than preferring the one row with no entity id.
const getCommissionAccountIds = async () => findAccountIdsByName(COMMISSION_ACCOUNT);

const getVendorDepositAccounts = async () => {
    const [sharedAccountId, legacyRows, commissionAccountIds] = await Promise.all([
        getSharedDepositsAccountId(),
        findLegacyVendorDepositAccounts(),
        getCommissionAccountIds(),
    ]);

    const legacyByVendorId = {};
    (legacyRows || []).forEach(row => {
        if (!row.provider_account_id) return;
        if (!legacyByVendorId[row.vendorId]) legacyByVendorId[row.vendorId] = [];
        legacyByVendorId[row.vendorId].push(row.provider_account_id);
    });

    return { sharedAccountId, legacyByVendorId, commissionAccountIds };
};

const accountIdsForVendor = (accounts, vendorId) =>
    [accounts.sharedAccountId, ...((accounts.legacyByVendorId || {})[vendorId] || [])].filter(
        Boolean
    );

// What the money had to touch for the order to belong to this vendor at all. Wider than
// accountIdsForVendor, which stays deposits-only because the balance is built from it: a
// service where Peko keeps the whole fee owes the vendor nothing and posts commission
// without a deposit line, and that is still the vendor's commission.
const ledgerAccountIdsForVendor = (accounts, vendorId) => [
    ...accountIdsForVendor(accounts, vendorId),
    ...((accounts.commissionAccountIds || []).filter(Boolean)),
];

const allAccountIds = accounts =>
    [
        accounts.sharedAccountId,
        ...Object.values(accounts.legacyByVendorId || {}).flat(),
    ].filter(Boolean);

const allLedgerAccountIds = accounts => [
    ...allAccountIds(accounts),
    ...((accounts.commissionAccountIds || []).filter(Boolean)),
];

const getLowBalanceThreshold = async () => {
    const details = await getASetting(LOW_BALANCE_SETTING);
    const amount = details && Number(details.amount);
    return amount > 0 ? amount : DEFAULT_LOW_BALANCE;
};

const VENDOR_SERVICE = isVendorService();

const LISTED_VENDOR_SERVICE = isListedVendorService();

const SERVICE_SEPARATOR = "||";

const VENDORS_WITH_SERVICES_FROM =
    "FROM vendors INNER JOIN serviceOperators ON serviceOperators.vendorId = vendors.id";

const vendorSearchClause = searchText =>
    searchText
        ? " AND (vendors.vendorName LIKE :searchText OR vendors.type LIKE :searchText OR vendors.gstNo LIKE :searchText)"
        : "";

const listVendorsWithServices = async ({ limit, offset, searchText, sort, sortField }) => {
    const field = SORTABLE_FIELDS.includes(sortField) ? sortField : "vendorName";
    const direction = sort === "DESC" ? "DESC" : "ASC";
    const where = `WHERE ${LISTED_VENDOR_SERVICE}${vendorSearchClause(searchText)}`;
    const replacements = { limit, offset, searchText: `%${searchText || ""}%` };

    const dataQuery =
        "SELECT vendors.id, vendors.vendorName, vendors.type, vendors.gstNo, vendors.isActive, " +
        `GROUP_CONCAT(DISTINCT serviceOperators.serviceProvider ORDER BY serviceOperators.serviceProvider SEPARATOR '${SERVICE_SEPARATOR}') AS services ` +
        `${VENDORS_WITH_SERVICES_FROM} ${where} GROUP BY vendors.id ` +
        `ORDER BY vendors.${field} ${direction} LIMIT :limit OFFSET :offset`;

    const countQuery =
        `SELECT COUNT(*) AS totalCount FROM (SELECT vendors.id ${VENDORS_WITH_SERVICES_FROM} ${where} GROUP BY vendors.id) AS listed`;

    const [rows, countRows] = await Promise.all([
        sequelizeConfig.query(dataQuery, { replacements, type: sequelizeConfig.QueryTypes.SELECT }),
        sequelizeConfig.query(countQuery, { replacements, type: sequelizeConfig.QueryTypes.SELECT }),
    ]);

    return { rows, count: countRows.length ? toNumber(countRows[0].totalCount) : 0 };
};

const findVendorById = async vendorId => {
    const row = await vendor.findOne({ attributes: VENDOR_ATTRIBUTES, where: { id: vendorId } });
    if (!row) return null;

    const operators = await serviceOperator.findAll({
        attributes: ["serviceProvider"],
        where: { vendorId: row.id, [Op.and]: [literal(isListedVendorService("accessKey"))] },
        raw: true,
    });

    return {
        ...row.get({ plain: true }),
        services: operators.map(item => item.serviceProvider).filter(Boolean),
    };
};

const JOURNAL_LINES_TABLE = key => `CROSS JOIN JSON_TABLE(
                COALESCE(JSON_EXTRACT(orders.journalData, '$.${key}.lineItems'), JSON_ARRAY()),
                '$[*]' COLUMNS (
                    accountId VARCHAR(64) PATH '$.accountId',
                    direction VARCHAR(10) PATH '$.direction',
                    amount DECIMAL(16, 4) PATH '$.amount'
                )
            ) AS journalLines`;

// An opening balance already contains everything up to its own date, and the portal counts
// nothing before go-live. The floor is joined rather than passed in, so the list page — which
// positions every vendor in one query — floors per vendor exactly as the detail page does.
const VENDOR_OPENING_FLOOR_JOIN =
    "LEFT JOIN (SELECT vendorId, MAX(depositDate) AS floorDate FROM vendorDeposits " +
    "WHERE entryType = 'OPENING' AND status = 'ACTIVE' AND deletedAt IS NULL GROUP BY vendorId) AS openingFloor " +
    "ON openingFloor.vendorId = serviceOperators.vendorId";

const VENDOR_FLOOR = dateExpression =>
    `${dateExpression} > GREATEST(COALESCE(openingFloor.floorDate, :accountingFloor), :accountingFloor)`;

// The same floor as the join, resolved to one date for the reads that already know which
// vendor they are about and cannot carry a join.
const loadVendorFloor = async vendorId => {
    const [opening, accountingFloor] = await Promise.all([
        findOpeningBalance(vendorId),
        loadAccountingFloor(),
    ]);
    const openingFloor = opening ? dayOf(opening.depositDate) : null;

    return openingFloor && openingFloor > accountingFloor ? openingFloor : accountingFloor;
};

const buildVendorMovementQuery = ({ range, vendorId }) => {
    const where = [
        "orders.journalData IS NOT NULL",
        "serviceOperators.vendorId IS NOT NULL",
        VENDOR_SERVICE,
        "journalLines.accountId IN (:accountIds)",
        VENDOR_FLOOR("DATE(orders.transactionDate)"),
    ];
    if (range) where.push("orders.transactionDate BETWEEN :from AND :to");
    if (vendorId) where.push("serviceOperators.vendorId = :vendorId");
    where.push(notMarkupSale("serviceOperators"));

    const selects = JOURNAL_KEYS.map(
        key => `SELECT serviceOperators.vendorId AS vendorId, journalLines.direction AS direction, journalLines.amount AS amount
            FROM orders
            INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId
            ${JOURNAL_LINES_TABLE(key)}
            ${VENDOR_OPENING_FLOOR_JOIN}
            WHERE ${where.join(" AND ")} AND ${reachedBooksSql(key)}`
    );

    return (
        "SELECT vendorId, " +
        "COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0) AS netAmount " +
        `FROM (${selects.join(" UNION ALL ")}) AS movements GROUP BY vendorId`
    );
};

const sumVendorMovements = async ({ accountIds, range, vendorId, accountingFloor }) => {
    if (!accountIds || !accountIds.length) return {};

    const replacements = { accountIds };
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }
    if (vendorId) replacements.vendorId = vendorId;
    replacements.accountingFloor = accountingFloor;

    const rows = await sequelizeConfig.query(
        buildVendorMovementQuery({ range, vendorId }),
        {
            replacements,
            type: sequelizeConfig.QueryTypes.SELECT,
        }
    );

    const map = {};
    rows.forEach(row => {
        map[row.vendorId] = round2(row.netAmount);
    });
    return map;
};

const jsonAmount = path =>
    `CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${path}')) AS DECIMAL(16, 4))`;

// An event written before journalDate existed falls back to the order's own date, so it
// still lands in a period rather than dropping out of every ranged figure.
const eventDate = key =>
    `COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(orders.journalData, '$.${key}.journalDate')) AS DATE), DATE(orders.transactionDate))`;

// Whether a commission tax invoice was actually raised at payment time. A json null is
// stored when the gateway skipped one, so the type is tested as well as the presence.
const VENDOR_INVOICE_PRESENT =
    "(JSON_EXTRACT(orders.pekoInvoiceDetails, '$.vendor.invoiceData') IS NOT NULL " +
    "AND JSON_TYPE(JSON_EXTRACT(orders.pekoInvoiceDetails, '$.vendor.invoiceData')) <> 'NULL' " +
    "AND JSON_LENGTH(JSON_EXTRACT(orders.pekoInvoiceDetails, '$.vendor.invoiceData')) > 0)";

const TRANSACTION_LINE_ITEMS =
    "COALESCE(JSON_EXTRACT(orders.journalData, '$.transaction.lineItems'), JSON_ARRAY())";

// The mode an order was sold under, read the same way Other Sales reads it so the two
// screens agree on what each order is.
const commissionModeOf = operatorAlias => commissionModeSql(operatorAlias);

const notPrincipalMarkup = operatorAlias =>
    `${commissionModeOf(operatorAlias)} <> '${PRINCIPAL_MARKUP}'`;

const notOwnRevenue = operatorAlias =>
    `${commissionModeOf(operatorAlias)} <> '${OWN_REVENUE}'`;

const soldAsPrincipal = operatorAlias =>
    `${commissionModeOf(operatorAlias)} IN ('${PRINCIPAL_MARKUP}', '${MIXED}')`;

// A sale on a markup basis, agent or principal, is listed on the profile but never comes out
// of the advance: the vendor bills Peko for it and the bill is recorded as cost of sales.
const notMarkupSale = operatorAlias =>
    `${sellingModeSql(operatorAlias)} NOT IN (${MARKUP_MODES.map(mode => `'${mode}'`).join(", ")})`;

const touchedLedgerAccounts = accountIdList => `EXISTS (
            SELECT 1 FROM JSON_TABLE(
                ${TRANSACTION_LINE_ITEMS},
                '$[*]' COLUMNS (accountId VARCHAR(64) PATH '$.accountId')
            ) AS ledgerAccountLines
            WHERE ledgerAccountLines.accountId IN (${accountIdList})
        )`;

const NO_TRANSACTION_LINES = `JSON_LENGTH(${TRANSACTION_LINE_ITEMS}) = 0`;

// Whether an order is the vendor's business at all. The journal answers: money landed on one
// of this vendor's deposit accounts or on Commission, or the order was sold as principal in
// whole or in part, which posts to Sales alone and is still a purchase from this vendor. A
// sale on Peko's own account recorded by hand is neither. An order whose journal was skipped,
// failed or never ran has no lines to read, so it stays listed with its amounts dashed rather
// than disappearing unexplained.
const vendorLedgerOrderClause = (accountIdList, operatorAlias = "serviceOperators") =>
    accountIdList
        ? `(${touchedLedgerAccounts(accountIdList)} OR ${NO_TRANSACTION_LINES} OR ${soldAsPrincipal(operatorAlias)})`
        : notOwnRevenue(operatorAlias);

const vendorCommissionOrderClause = (accountIdList, operatorAlias = "serviceOperators") =>
    accountIdList
        ? `(${touchedLedgerAccounts(accountIdList)} OR (${NO_TRANSACTION_LINES} AND ${notPrincipalMarkup(operatorAlias)}))`
        : notPrincipalMarkup(operatorAlias);

const LEDGER_ACCOUNTS_BINDING = ":ledgerAccountIds";

// The same rule as vendorCommissionOrderClause, for the places that already hold the whole
// journal and would otherwise have to ask the database again. Kept beside it so the two
// cannot drift.
const earnsVendorCommission = (journalData, ledgerAccountIds, operatorCommissionMode = null) => {
    const event = journalData && journalData.transaction;
    const items = event && Array.isArray(event.lineItems) ? event.lineItems : [];
    const ids = new Set((ledgerAccountIds || []).map(String));

    if (!items.length || !ids.size) {
        return commissionModeOfJournal(journalData, operatorCommissionMode) !== PRINCIPAL_MARKUP;
    }
    return items.some(item => ids.has(String(item.accountId)));
};

const VENDOR_SPLIT_SELECT = `COALESCE(SUM(${jsonAmount("commissionIncludingGST")}), 0) AS commission`;

const buildVendorSplitQuery = ({ range, vendorId, hasLedgerAccounts }) => {
    const where = [
        "orders.journalData IS NOT NULL",
        "serviceOperators.vendorId IS NOT NULL",
        VENDOR_SERVICE,
        SALE_REACHED_BOOKS,
        vendorLedgerOrderClause(hasLedgerAccounts ? LEDGER_ACCOUNTS_BINDING : null),
        VENDOR_FLOOR("DATE(orders.transactionDate)"),
    ];
    if (range) where.push("orders.transactionDate BETWEEN :from AND :to");
    if (vendorId) where.push("serviceOperators.vendorId = :vendorId");

    return (
        `SELECT serviceOperators.vendorId AS vendorId, ${VENDOR_SPLIT_SELECT} ` +
        "FROM orders INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId " +
        `${VENDOR_OPENING_FLOOR_JOIN} ` +
        `WHERE ${where.join(" AND ")} GROUP BY serviceOperators.vendorId`
    );
};

// What came back is the only figure a refund restates, so the share of the commission
// that came back with it is that amount over what originally reached the vendor.
const buildVendorReversalQuery = ({ range, vendorId }) => {
    const selects = REFUND_KEYS.map(key => {
        const where = [
            "orders.journalData IS NOT NULL",
            "serviceOperators.vendorId IS NOT NULL",
            VENDOR_SERVICE,
            "journalLines.accountId IN (:accountIds)",
            "journalLines.direction = 'debit'",
            `${jsonAmount("vendorPayable")} > 0`,
        ];
        where.push(VENDOR_FLOOR(eventDate(key)), reachedBooksSql(key));
        if (range) where.push(`${eventDate(key)} BETWEEN :from AND :to`);
        if (vendorId) where.push("serviceOperators.vendorId = :vendorId");

        return `SELECT serviceOperators.vendorId AS vendorId,
                journalLines.amount / ${jsonAmount("vendorPayable")} AS ratio,
                ${jsonAmount("commissionIncludingGST")} AS commission
            FROM orders
            INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId
            ${JOURNAL_LINES_TABLE(key)}
            ${VENDOR_OPENING_FLOOR_JOIN}
            WHERE ${where.join(" AND ")}`;
    });

    return (
        "SELECT vendorId, " +
        "COALESCE(SUM(commission * ratio), 0) AS commission " +
        `FROM (${selects.join(" UNION ALL ")}) AS reversals GROUP BY vendorId`
    );
};

const runSplitQuery = async (sql, replacements) => {
    const rows = await sequelizeConfig.query(sql, {
        replacements,
        type: sequelizeConfig.QueryTypes.SELECT,
    });

    const map = {};
    rows.forEach(row => {
        map[row.vendorId] = { commission: round2(row.commission) };
    });
    return map;
};

const sumVendorSplitTotals = async ({
    range = null,
    vendorId = null,
    accountingFloor = null,
    accountIds = null,
    ledgerAccountIds = null,
} = {}) => {
    const replacements = {};
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }
    if (vendorId) replacements.vendorId = vendorId;
    replacements.accountingFloor = accountingFloor;

    const hasLedgerAccounts = Boolean(ledgerAccountIds && ledgerAccountIds.length);
    const gross = await runSplitQuery(
        buildVendorSplitQuery({ range, vendorId, hasLedgerAccounts }),
        hasLedgerAccounts ? { ...replacements, ledgerAccountIds } : replacements
    );

    if (!accountIds || !accountIds.length) return gross;

    const reversed = await runSplitQuery(
        buildVendorReversalQuery({ range, vendorId }),
        { ...replacements, accountIds }
    );

    const map = {};
    new Set([...Object.keys(gross), ...Object.keys(reversed)]).forEach(id => {
        const earned = gross[id] || { commission: 0 };
        const back = reversed[id] || { commission: 0 };
        map[id] = { commission: round2(earned.commission - back.commission) };
    });
    return map;
};

const EMPTY_VENDOR_AMOUNTS = {
    vendorAmount: null,
    commission: null,
    markup: null,
    receivable: null,
};

const principalMarkupOf = (journalData, wholly) =>
    round2(
        (wholly ? toNumber(journalData.commissionExcludingGST) : 0) +
            toNumber(journalData.principalCommissionExcludingGST)
    );

const vendorAmountsFromJournal = (journalData, operatorMode = null) => {
    const hasSplit =
        Boolean(journalData) &&
        (isPresent(journalData.vendorPayable) ||
            isPresent(journalData.commissionIncludingGST) ||
            isPresent(journalData.principalSalesPayable));
    if (!hasSplit) return { ...EMPTY_VENDOR_AMOUNTS };

    const mode = sellingModeOf(journalData, operatorMode);
    const receivable = round2(journalData.vendorPayable);
    const commission = round2(journalData.commissionIncludingGST);
    const vendorPrice = round2(journalData.principalSalesPayable);

    if (mode === PRINCIPAL_MARKUP) {
        return {
            vendorAmount: round2(receivable + vendorPrice),
            commission: null,
            markup: principalMarkupOf(journalData, true),
            receivable: null,
        };
    }

    if (mode === AGENT_MARKUP) {
        return {
            vendorAmount: receivable,
            commission: null,
            markup: round2(journalData.commissionExcludingGST),
            receivable: null,
        };
    }

    const mixed = mode === MIXED;

    return {
        vendorAmount: round2(receivable + commission + (mixed ? vendorPrice : 0)),
        commission,
        markup: mixed ? principalMarkupOf(journalData, false) : null,
        receivable,
    };
};

const orderCommission = journalData => ({
    excludingGST: round2(journalData && journalData.commissionExcludingGST),
    includingGST: round2(journalData && journalData.commissionIncludingGST),
});

const refundEventsOf = journalData =>
    REFUND_KEYS.map(key => journalData && journalData[key]).filter(
        event => event && Array.isArray(event.lineItems) && event.lineItems.length
    );

const isRefunded = journalData => refundEventsOf(journalData).length > 0;

// The same ratio the statement and the cards use, read straight off the order rather than
// through SQL, because the list already holds the whole journal.
const refundedAmount = (journalData, accountIds) => {
    const ids = new Set((accountIds || []).map(String));
    if (!ids.size) return 0;

    return round2(
        refundEventsOf(journalData).reduce(
            (total, event) =>
                total +
                event.lineItems.reduce(
                    (sum, item) =>
                        ids.has(String(item.accountId)) && item.direction === "debit"
                            ? sum + toNumber(item.amount)
                            : sum,
                    0
                ),
            0
        )
    );
};

const refundRatio = (journalData, accountIds) => {
    const receivable = round2(journalData && journalData.vendorPayable);
    if (!receivable) return 0;
    return refundedAmount(journalData, accountIds) / receivable;
};

// The account list is spelled into the literal rather than bound, because findAndCountAll
// issues its own COUNT query and a binding would have to reach both. Every id is escaped.
const escapedAccountList = accountIds =>
    accountIds && accountIds.length
        ? accountIds.map(id => sequelizeConfig.escape(String(id))).join(", ")
        : null;

// An order counts as refunded when its journal holds a refund event with lines, the same test
// isRefunded makes, or when the provider's own status already says so.
const REFUNDED_IN_JOURNAL = `(${REFUND_KEYS.map(
    key =>
        `COALESCE(JSON_TYPE(JSON_EXTRACT(orders.journalData, '$.${key}.lineItems')) = 'ARRAY' ` +
        `AND JSON_LENGTH(JSON_EXTRACT(orders.journalData, '$.${key}.lineItems')) > 0, 0) = 1`
).join(" OR ")})`;

// What the Status pill reads: a refund wins over whatever the provider's status says.
const ORDER_STATUS_FILTERS = {
    refunded: `(${REFUNDED_IN_JOURNAL} OR orders.status IN ('REFUND', 'REFUNDED'))`,
    success: `(NOT ${REFUNDED_IN_JOURNAL} AND orders.status IN ('SUCCESS', 'ORDERED'))`,
    failed: `(NOT ${REFUNDED_IN_JOURNAL} AND orders.status IN ('FAILED', 'FAILURE'))`,
};

const buildOrderWhere = ({ vendorId, range, searchText, status, ledgerAccountIds, floorDate }) => {
    const where = {
        "$serviceOperator.vendorId$": vendorId,
        status: { [Op.ne]: UNANSWERED_STATUS },
        [Op.and]: [
            literal(vendorLedgerOrderClause(escapedAccountList(ledgerAccountIds), "serviceOperator")),
            literal(isVendorService("serviceOperator.accessKey")),
            literal(
                `DATE(orders.transactionDate) > ${sequelizeConfig.escape(String(floorDate))}`
            ),
            ...(Object.hasOwn(ORDER_STATUS_FILTERS, status)
                ? [literal(ORDER_STATUS_FILTERS[status])]
                : []),
        ],
    };
    if (range) where.transactionDate = { [Op.between]: [range.from, range.to] };
    if (searchText) {
        const like = { [Op.like]: `%${searchText}%` };
        where[Op.or] = [
            { corporateTxnId: like },
            { status: like },
            { "$serviceOperator.serviceProvider$": like },
            { "$credential.username$": like },
        ];
    }
    return where;
};

const ORDER_INCLUDE = [
    {
        model: serviceOperator,
        attributes: ["id", "serviceProvider", "accessKey", "commissionMode"],
        required: true,
    },
    {
        model: credential,
        attributes: ["id", "name", "username"],
        required: false,
    },
];

const listVendorOrders = async ({
    vendorId,
    range,
    searchText,
    status,
    ledgerAccountIds,
    limit,
    offset,
}) => {
    const floorDate = await loadVendorFloor(vendorId);

    return order.findAndCountAll({
        attributes: [
            "id",
            "corporateTxnId",
            "transactionDate",
            "amountInINR",
            "status",
            "paymentMode",
            "journalData",
            "journalRecordStatus",
        ],
        where: buildOrderWhere({ vendorId, range, searchText, status, ledgerAccountIds, floorDate }),
        include: ORDER_INCLUDE,
        order: [["transactionDate", "DESC"]],
        limit,
        offset,
        subQuery: false,
        raw: true,
        nest: true,
    });
};

const serializeTransaction = row => ({
    id: row.id,
    corporateTxnId: row.corporateTxnId,
    transactionDate: row.transactionDate,
    service: row.serviceOperator ? row.serviceOperator.serviceProvider : null,
    customer: row.credential ? row.credential.username : null,
    ...(saleReachedBooksOfJournal(row)
        ? vendorAmountsFromJournal(row.journalData, row.serviceOperator && row.serviceOperator.commissionMode)
        : { ...EMPTY_VENDOR_AMOUNTS }),
    commissionMode: sellingModeOf(
        row.journalData,
        row.serviceOperator ? row.serviceOperator.commissionMode : null
    ),
    status: row.status,
    refunded: isRefunded(row.journalData),
    paymentMode: row.paymentMode,
    posting: orderPostingOfJournal(row),
});

// How much of each order came back, as its own derived table, so the commission listing
// can carry a reversed column without re-reading the whole journal per row.
const REFUNDED_PER_ORDER = `(
    SELECT orderId, SUM(amount) AS refunded FROM (
        ${REFUND_KEYS.map(
            key => `SELECT orders.id AS orderId, journalLines.amount AS amount
                FROM orders
                ${JOURNAL_LINES_TABLE(key)}
                WHERE journalLines.accountId IN (:accountIds) AND journalLines.direction = 'debit' AND ${reachedBooksSql(key)}`
        ).join(" UNION ALL ")}
    ) AS refundLines GROUP BY orderId
) AS refunds`;

// The legacy tables are latin1 and the entries table is utf8mb4, so every text column
// crossing the union is converted or MySQL refuses the mixed collation outright.
const COMMISSION_ORDER_SELECT = `SELECT
        'ORDER' AS source,
        orders.id AS id,
        CONVERT(orders.corporateTxnId USING utf8mb4) AS reference,
        CONVERT(NULL USING utf8mb4) AS entryNumber,
        DATE(orders.transactionDate) AS entryDate,
        CONVERT(serviceOperators.serviceProvider USING utf8mb4) AS service,
        CONVERT(NULL USING utf8mb4) AS reason,
        CONVERT(NULL USING utf8mb4) AS againstOrder,
        NULL AS booksSynced,
        NULL AS booksSyncedAt,
        CONVERT(NULL USING utf8mb4) AS booksSyncedByName,
        NULL AS deletedAt,
        CONVERT(NULL USING utf8mb4) AS deletedByName,
        CONVERT(NULL USING utf8mb4) AS deleteReason,
        CONVERT(NULL USING utf8mb4) AS status,
        CONVERT(NULL USING utf8mb4) AS entryType,
        CONVERT(NULL USING utf8mb4) AS recordedByName,
        CONVERT(NULL USING utf8mb4) AS ipAddress,
        ${jsonAmount("vendorPayable")} AS vendorPayable,
        ${jsonAmount("commissionExcludingGST")} AS commissionExcludingGST,
        ${jsonAmount("commissionIncludingGST")} AS commissionIncludingGST,
        ${jsonAmount("principalSalesPayable")} AS principalSalesPayable,
        ${jsonAmount("principalCommissionExcludingGST")} AS principalCommissionExcludingGST,
        ${jsonAmount("outputGSTonPrincipalCommission")} AS outputGSTonPrincipalCommission,
        COALESCE(refunds.refunded, 0) AS refunded,
        CONVERT(orders.status USING utf8mb4) AS orderStatus,
        ${postingSelect("transaction")},
        ${VENDOR_INVOICE_PRESENT} AS hasDocument,
        NULL AS gstInclusive,
        NULL AS gstRate,
        NULL AS taxableAmount,
        NULL AS gstAmount`;

const COMMISSION_MANUAL_SELECT = `SELECT
        'MANUAL' AS source,
        vendorLedgerEntries.id AS id,
        CONVERT(vendorLedgerEntries.reference USING utf8mb4) AS reference,
        CONVERT(vendorLedgerEntries.entryNumber USING utf8mb4) AS entryNumber,
        vendorLedgerEntries.issueDate AS entryDate,
        CONVERT(NULL USING utf8mb4) AS service,
        CONVERT(vendorLedgerEntries.reason USING utf8mb4) AS reason,
        CONVERT(vendorLedgerEntries.againstCorporateTxnId USING utf8mb4) AS againstOrder,
        vendorLedgerEntries.booksSynced AS booksSynced,
        vendorLedgerEntries.booksSyncedAt AS booksSyncedAt,
        CONVERT(vendorLedgerEntries.booksSyncedByName USING utf8mb4) AS booksSyncedByName,
        vendorLedgerEntries.deletedAt AS deletedAt,
        CONVERT(vendorLedgerEntries.deletedByName USING utf8mb4) AS deletedByName,
        CONVERT(vendorLedgerEntries.deleteReason USING utf8mb4) AS deleteReason,
        CONVERT(vendorLedgerEntries.status USING utf8mb4) AS status,
        CONVERT(vendorLedgerEntries.entryType USING utf8mb4) AS entryType,
        CONVERT(vendorLedgerEntries.recordedByName USING utf8mb4) AS recordedByName,
        CONVERT(vendorLedgerEntries.ipAddress USING utf8mb4) AS ipAddress,
        0 AS vendorPayable,
        COALESCE(vendorLedgerEntries.taxableAmount, vendorLedgerEntries.amount) AS commissionExcludingGST,
        vendorLedgerEntries.amount AS commissionIncludingGST,
        0 AS principalSalesPayable,
        0 AS principalCommissionExcludingGST,
        0 AS outputGSTonPrincipalCommission,
        0 AS refunded,
        CONVERT(NULL USING utf8mb4) AS orderStatus,
        ${noPostingSelect("transaction")},
        1 AS hasDocument,
        vendorLedgerEntries.gstInclusive AS gstInclusive,
        vendorLedgerEntries.gstRate AS gstRate,
        vendorLedgerEntries.taxableAmount AS taxableAmount,
        vendorLedgerEntries.gstAmount AS gstAmount`;

// What the Status pill reads on a commission row, worked out on the merged rows: an order is
// Refunded when part of its commission came back with a refund, as serializeCommission works it
// out, and a manual entry is a Reversal, Reversed or Active by its own type and status.
const COMMISSION_REFUNDED = `(COALESCE((source = 'ORDER' ` +
    `AND (vendorPayable IS NOT NULL OR commissionIncludingGST IS NOT NULL) ` +
    `AND ROUND(COALESCE(vendorPayable, 0), 2) <> 0 ` +
    `AND ROUND(ROUND(COALESCE(commissionIncludingGST, 0), 2) * (ROUND(refunded, 2) / ROUND(vendorPayable, 2)), 2) > 0), 0) = 1)`;

const COMMISSION_STATUS_FILTERS = {
    earned: `(source = 'ORDER' AND NOT ${COMMISSION_REFUNDED})`,
    refunded: COMMISSION_REFUNDED,
    active: "(source = 'MANUAL' AND entryType <> 'REVERSAL' AND status <> 'VOIDED' AND deletedAt IS NULL)",
    reversal: "(source = 'MANUAL' AND entryType = 'REVERSAL' AND deletedAt IS NULL)",
    reversed: "(source = 'MANUAL' AND entryType <> 'REVERSAL' AND status = 'VOIDED' AND deletedAt IS NULL)",
    deleted: "(source = 'MANUAL' AND deletedAt IS NOT NULL)",
};

const buildVendorCommissionQuery = ({ range, searchText, status, countOnly, hasLedgerAccounts }) => {
    const orderWhere = [
        "serviceOperators.vendorId = :vendorId",
        VENDOR_SERVICE,
        `orders.status <> '${UNANSWERED_STATUS}'`,
        vendorCommissionOrderClause(hasLedgerAccounts ? LEDGER_ACCOUNTS_BINDING : null),
        VENDOR_FLOOR("DATE(orders.transactionDate)"),
    ];
    const manualWhere = [
        "vendorLedgerEntries.vendorId = :vendorId",
        `vendorLedgerEntries.kind = '${ENTRY_KINDS.commission}'`,
        "vendorLedgerEntries.issueDate > :accountingFloor",
    ];
    if (range) {
        orderWhere.push("orders.transactionDate BETWEEN :from AND :to");
        manualWhere.push("vendorLedgerEntries.issueDate BETWEEN :from AND :to");
    }
    if (searchText) {
        orderWhere.push(
            "(orders.corporateTxnId LIKE :searchText OR serviceOperators.serviceProvider LIKE :searchText)"
        );
        manualWhere.push(
            "(vendorLedgerEntries.entryNumber LIKE :searchText OR vendorLedgerEntries.reference LIKE :searchText OR vendorLedgerEntries.reason LIKE :searchText)"
        );
    }

    const union =
        `${COMMISSION_ORDER_SELECT}
            FROM orders
            INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId
            LEFT JOIN ${REFUNDED_PER_ORDER} ON refunds.orderId = orders.id
            ${VENDOR_OPENING_FLOOR_JOIN}
            WHERE ${orderWhere.join(" AND ")}
        UNION ALL
        ${COMMISSION_MANUAL_SELECT}
            FROM vendorLedgerEntries
            WHERE ${manualWhere.join(" AND ")}`;

    const statusWhere = Object.hasOwn(COMMISSION_STATUS_FILTERS, status)
        ? ` WHERE ${COMMISSION_STATUS_FILTERS[status]}`
        : "";

    if (countOnly) {
        return `SELECT COUNT(*) AS totalCount FROM (${union}) AS commissions${statusWhere}`;
    }

    return `SELECT * FROM (${union}) AS commissions${statusWhere} ORDER BY entryDate DESC, id DESC LIMIT :limit OFFSET :offset`;
};

const listVendorCommissions = async ({
    vendorId,
    accountIds,
    ledgerAccountIds,
    range,
    searchText,
    status,
    limit,
    offset,
}) => {
    const hasLedgerAccounts = Boolean(ledgerAccountIds && ledgerAccountIds.length);
    const replacements = {
        vendorId,
        accountIds: accountIds && accountIds.length ? accountIds : [""],
        accountingFloor: await loadAccountingFloor(),
    };
    if (hasLedgerAccounts) replacements.ledgerAccountIds = ledgerAccountIds;
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }
    if (searchText) replacements.searchText = `%${searchText}%`;

    const [rows, countRows] = await Promise.all([
        sequelizeConfig.query(buildVendorCommissionQuery({ range, searchText, status, hasLedgerAccounts }), {
            replacements: { ...replacements, limit, offset },
            type: sequelizeConfig.QueryTypes.SELECT,
        }),
        sequelizeConfig.query(
            buildVendorCommissionQuery({ range, searchText, status, countOnly: true, hasLedgerAccounts }),
            {
                replacements,
                type: sequelizeConfig.QueryTypes.SELECT,
            }
        ),
    ]);

    return { rows, count: countRows.length ? toNumber(countRows[0].totalCount) : 0 };
};

// A commission recorded by hand keeps its GST on the row; an order's is the difference between
// its two commission figures, since the journal carries no separate GST amount for it.
const commissionGstOf = (row, { manual, hasSplit, includingGST }) => {
    if (!hasSplit) return null;
    if (manual) return isPresent(row.gstAmount) ? round2(row.gstAmount) : null;
    return round2(includingGST - round2(row.commissionExcludingGST));
};

const serializeCommission = row => {
    const manual = row.source === "MANUAL";
    // An order whose journal never derived a split has no commission to report, so every
    // figure that rests on it stays null rather than reading as a zero commission.
    const hasSplit =
        manual ||
        (reachedBooks(factsOfRow(row, "transaction")) &&
            (isPresent(row.vendorPayable) || isPresent(row.commissionIncludingGST)));
    const receivable = round2(row.vendorPayable);
    const includingGST = hasSplit ? round2(row.commissionIncludingGST) : null;
    const ratio = receivable ? round2(row.refunded) / receivable : 0;
    const reversed = manual || !hasSplit ? 0 : round2(includingGST * ratio);
    // An order sold both ways: its margin items earn the commission above, its principal items this markup.
    const principalMarkup = manual || !hasSplit ? 0 : round2(toNumber(row.principalCommissionExcludingGST));

    return {
        id: row.id,
        source: row.source,
        entryNumber: manual ? row.entryNumber || null : null,
        corporateTxnId: manual ? null : row.reference,
        reference: manual ? row.reference : null,
        transactionDate: row.entryDate,
        service: row.service || null,
        reason: row.reason || null,
        againstCorporateTxnId: manual ? row.againstOrder || null : null,
        orderAmount:
            manual || !hasSplit
                ? null
                : round2(receivable + includingGST + round2(row.principalSalesPayable)),
        commissionExcludingGST: hasSplit ? round2(row.commissionExcludingGST) : null,
        commissionIncludingGST: includingGST,
        commissionGST: commissionGstOf(row, { manual, hasSplit, includingGST }),
        principalMarkup: principalMarkup > 0 ? principalMarkup : null,
        commissionReversed: hasSplit ? reversed : null,
        commissionNet: hasSplit ? round2(includingGST - reversed) : null,
        refunded: reversed > 0,
        posting: manual ? NOT_APPLICABLE : salePosting(row.orderStatus, factsOfRow(row, "transaction")),
        status: row.status || null,
        entryType: row.entryType || null,
        recordedByName: row.recordedByName || null,
        ipAddress: row.ipAddress || null,
        hasDocument: Boolean(Number(row.hasDocument)),
        ...(manual ? { ...booksFieldsOf(row), ...gstFieldsOf(row) } : {}),
    };
};

// The commission that came back with a refund, read off the journal rather than stored,
// so a repost or a second partial refund corrects itself.
const buildCommissionReversalListQuery = ({ range }) => {
    const selects = REFUND_KEYS.map(key => {
        const where = [
            "orders.journalData IS NOT NULL",
            "serviceOperators.vendorId = :vendorId",
            VENDOR_SERVICE,
            "journalLines.accountId IN (:accountIds)",
            "journalLines.direction = 'debit'",
            `${jsonAmount("vendorPayable")} > 0`,
            `${jsonAmount("commissionIncludingGST")} > 0`,
            VENDOR_FLOOR(eventDate(key)),
        ];
        if (range) where.push(`${eventDate(key)} BETWEEN :from AND :to`);

        return `SELECT
                '${key}' AS eventKey,
                orders.corporateTxnId AS reference,
                ${eventDate(key)} AS issueDate,
                CONVERT(serviceOperators.serviceProvider USING utf8mb4) AS service,
                journalLines.amount / ${jsonAmount("vendorPayable")} AS ratio,
                ${jsonAmount("commissionIncludingGST")} AS commission,
                ${postingSelect(key, { prefix: "event" })},
                ${VENDOR_INVOICE_PRESENT} AS hasDocument
            FROM orders
            INNER JOIN serviceOperators ON serviceOperators.id = orders.serviceOperatorId
            ${JOURNAL_LINES_TABLE(key)}
            ${VENDOR_OPENING_FLOOR_JOIN}
            WHERE ${where.join(" AND ")}`;
    });

    return `SELECT * FROM (${selects.join(" UNION ALL ")}) AS reversals ORDER BY issueDate DESC, reference DESC`;
};

const listCommissionReversals = async ({ vendorId, accountIds, range }) => {
    if (!accountIds || !accountIds.length) return [];

    const replacements = { vendorId, accountIds, accountingFloor: await loadAccountingFloor() };
    if (range) {
        replacements.from = range.from;
        replacements.to = range.to;
    }

    const rows = await sequelizeConfig.query(buildCommissionReversalListQuery({ range }), {
        replacements,
        type: sequelizeConfig.QueryTypes.SELECT,
    });

    return rows.map(row => ({
        id: null,
        kind: ENTRY_KINDS.commission,
        source: "AUTO",
        entryNumber: null,
        reference: row.reference,
        amount: round2(toNumber(row.commission) * toNumber(row.ratio)),
        hasDocument: Boolean(Number(row.hasDocument)),
        issueDate: row.issueDate,
        reason: `Commission reversed on ${row.service || "order"}`,
        againstCorporateTxnId: row.reference,
        status: "OPEN",
        posting: eventPostingOfRow(row),
        entryType: "REVERSAL",
        reversesId: null,
        slipKey: null,
        slipName: null,
        slipFormat: null,
        recordedByName: null,
        ipAddress: null,
        voidedByName: null,
        voidedAt: null,
        voidReason: null,
        createdAt: null,
    }));
};

const buildPosition = ({
    deposited,
    creditNotes,
    manualCommission,
    costOfSales = 0,
    debitNotes = 0,
    receivableNet,
    split,
}) => {
    const receivable = round2(receivableNet);
    const earned = round2(manualCommission) + round2(split && split.commission);
    const commission = round2(earned);
    const used = round2(receivable + commission);

    // Debits raise the advance held with the vendor and credits consume it: deposits,
    // commissions and debit notes are debits; the order value, credit notes and cost of sales
    // are credits.
    return {
        deposited: round2(deposited),
        creditNotes: round2(creditNotes),
        manualCommission: round2(manualCommission),
        costOfSales: round2(costOfSales),
        debitNotes: round2(debitNotes),
        used,
        commission,
        available: round2(
            round2(deposited) +
                round2(manualCommission) +
                round2(debitNotes) -
                round2(creditNotes) -
                round2(costOfSales) -
                receivable
        ),
    };
};

const loadVendorPosition = async ({
    vendorId,
    accountIds,
    ledgerAccountIds,
    range,
    accountingFloor,
}) => {
    const [deposited, creditNotes, manualCommission, costOfSales, debitNotes, movements, splits] =
        await Promise.all([
            sumActiveDeposits(vendorId, range, accountingFloor),
            sumManualEntries(vendorId, ENTRY_KINDS.creditNote, range, accountingFloor),
            sumManualEntries(vendorId, ENTRY_KINDS.commission, range, accountingFloor),
            sumManualEntries(vendorId, ENTRY_KINDS.costOfSales, range, accountingFloor),
            sumManualEntries(vendorId, ENTRY_KINDS.debitNote, range, accountingFloor),
            sumVendorMovements({ accountIds, range, vendorId, accountingFloor }),
            sumVendorSplitTotals({ vendorId, range, accountingFloor, accountIds, ledgerAccountIds }),
        ]);

    return buildPosition({
        deposited,
        creditNotes,
        manualCommission,
        costOfSales,
        debitNotes,
        receivableNet: movements[vendorId],
        split: splits[vendorId],
    });
};

const getVendorLedgerSummary = async (vendorRow, accountIds, range = null, ledgerAccountIds = null) => {
    const vendorId = vendorRow.id;
    // The per-vendor opening is applied inside the SQL now, so the detail page and the list
    // page reach the same figure from the same floor rather than from two code paths.
    const [opening, accountingFloor] = await Promise.all([
        findOpeningBalance(vendorId),
        loadAccountingFloor(),
    ]);

    const openingPeriod = range && range.from
        ? {
              from: "1970-01-01",
              to: (() => {
                  const date = new Date(`${dayOf(range.from)}T00:00:00.000Z`);
                  date.setUTCDate(date.getUTCDate() - 1);
                  return date.toISOString().slice(0, 10);
              })(),
          }
        : null;

    const [scoped, prior] = await Promise.all([
        loadVendorPosition({ vendorId, accountIds, ledgerAccountIds, range, accountingFloor }),
        openingPeriod
            ? loadVendorPosition({
                  vendorId,
                  accountIds,
                  ledgerAccountIds,
                  range: openingPeriod,
                  accountingFloor,
              })
            : null,
    ]);

    const openingBalance = prior ? prior.available : 0;
    const totalTransaction = round2(
        scoped.used -
            scoped.manualCommission +
            scoped.creditNotes +
            scoped.costOfSales -
            scoped.debitNotes
    );
    return {
        ...scoped,
        openingBalance,
        totalTransaction,
        available: round2(
            openingBalance +
                scoped.deposited -
                totalTransaction +
                scoped.commission
        ),
        openingBalanceSet: Boolean(opening),
        openingBalanceAsOf: opening ? opening.depositDate : null,
    };
};

const sumSplitTotals = splits =>
    Object.values(splits).reduce(
        (acc, split) => ({
            commission: acc.commission + toNumber(split.commission),
        }),
        { commission: 0 }
    );

const buildVendorLedgerSnapshot = async (now = new Date()) => {
    const vendors = await sequelizeConfig.query(
        `SELECT vendors.id, vendors.vendorName ${VENDORS_WITH_SERVICES_FROM} GROUP BY vendors.id`,
        { type: sequelizeConfig.QueryTypes.SELECT }
    );

    const accounts = await getVendorDepositAccounts();
    const accountIds = allAccountIds(accounts);
    const ledgerAccountIds = allLedgerAccountIds(accounts);
    // The same floor the detail page uses, so the two agree rather than being computed by
    // two paths that only happened to match before an opening balance existed.
    const accountingFloor = await loadAccountingFloor();
    const monthRange = istMonthToDateRange(now);
    const depositMonthRange = { from: monthRange.from.slice(0, 10), to: monthRange.to.slice(0, 10) };

    const [
        movements,
        monthMovements,
        splits,
        monthSplits,
        deposits,
        creditNotes,
        manualCommissions,
        costOfSalesByVendor,
        debitNotesByVendor,
        depositedMtd,
        manualCommissionMtd,
        costOfSalesMtd,
        debitNotesMtd,
        openCreditNotes,
        openingVendorIds,
    ] = await Promise.all([
        sumVendorMovements({ accountIds, range: null, accountingFloor }),
        sumVendorMovements({ accountIds, range: monthRange, accountingFloor }),
        sumVendorSplitTotals({ accountIds, ledgerAccountIds, accountingFloor }),
        sumVendorSplitTotals({ range: monthRange, accountIds, ledgerAccountIds, accountingFloor }),
        sumActiveDepositsByVendor(accountingFloor),
        sumManualEntriesByVendor(ENTRY_KINDS.creditNote, accountingFloor),
        sumManualEntriesByVendor(ENTRY_KINDS.commission, accountingFloor),
        sumManualEntriesByVendor(ENTRY_KINDS.costOfSales, accountingFloor),
        sumManualEntriesByVendor(ENTRY_KINDS.debitNote, accountingFloor),
        sumDepositsInRange(depositMonthRange, accountingFloor),
        sumManualEntriesInRange(ENTRY_KINDS.commission, depositMonthRange, accountingFloor),
        sumManualEntriesInRange(ENTRY_KINDS.costOfSales, depositMonthRange, accountingFloor),
        sumManualEntriesInRange(ENTRY_KINDS.debitNote, depositMonthRange, accountingFloor),
        countOpenEntries(ENTRY_KINDS.creditNote),
        listVendorsWithOpeningBalance(),
    ]);

    const withOpening = new Set((openingVendorIds || []).map(String));
    const balances = {};
    vendors.forEach(row => {
        balances[row.id] = {
            ...buildPosition({
                deposited: deposits[row.id],
                creditNotes: creditNotes[row.id],
                manualCommission: manualCommissions[row.id],
                costOfSales: costOfSalesByVendor[row.id],
                debitNotes: debitNotesByVendor[row.id],
                receivableNet: movements[row.id],
                split: splits[row.id],
            }),
            openingBalanceSet: withOpening.has(String(row.id)),
        };
    });

    const monthSplitTotals = sumSplitTotals(monthSplits);
    const receivableMtd = Object.values(monthMovements).reduce(
        (sum, amount) => sum + toNumber(amount),
        0
    );
    const commissionMtd = round2(monthSplitTotals.commission + toNumber(manualCommissionMtd));
    const transactionAmountMtd = round2(
        receivableMtd + monthSplitTotals.commission
    );

    return {
        generatedAt: now.toISOString(),
        vendorDepositsAccountConfigured: Boolean(accounts.sharedAccountId),
        balances,
        monthly: {
            deposited: depositedMtd,
            used: round2(
                transactionAmountMtd - commissionMtd + toNumber(costOfSalesMtd) - toNumber(debitNotesMtd)
            ),
            commission: commissionMtd,
        },
        openCreditNotes: toNumber(openCreditNotes),
    };
};

const getVendorLedgerSnapshot = async ({ refresh = false } = {}) => {
    if (!refresh) {
        try {
            const cached = await getValue(BALANCES_CACHE_KEY);
            if (cached) return { ...JSON.parse(cached), cached: true };
        } catch (error) {
            customLog(null, "error", {
                message: "Vendor balances cache read failed",
                error: error && error.message,
            });
        }
    }

    const payload = await buildVendorLedgerSnapshot();
    try {
        await setValue(BALANCES_CACHE_KEY, BALANCES_CACHE_TTL_SECONDS, JSON.stringify(payload));
    } catch (error) {
        customLog(null, "error", {
            message: "Vendor balances cache write failed",
            error: error && error.message,
        });
    }
    return { ...payload, cached: false };
};

const serviceNames = row => {
    if (Array.isArray(row.services)) return row.services;
    return typeof row.services === "string" && row.services
        ? row.services.split(SERVICE_SEPARATOR)
        : [];
};

const EMPTY_POSITION = {
    deposited: 0,
    creditNotes: 0,
    manualCommission: 0,
    costOfSales: 0,
    debitNotes: 0,
    used: 0,
    commission: 0,
    available: 0,
    openingBalanceSet: false,
};

const serializeVendor = (row, balance, threshold) => {
    const plain = row && typeof row.get === "function" ? row.get({ plain: true }) : row;
    const services = serviceNames(plain);
    const position = balance || EMPTY_POSITION;
    return {
        id: plain.id,
        vendorName: plain.vendorName,
        type: plain.type,
        gstNo: plain.gstNo,
        isActive: Boolean(plain.isActive),
        services,
        serviceCount: services.length,
        ...position,
        lowBalance: position.available < threshold,
    };
};

const buildVendorKpis = (snapshot, threshold) => {
    const balances = Object.values(snapshot.balances || {});
    const totals = balances.reduce(
        (acc, position) => {
            acc.depositsHeld += position.available;
            if (position.available < threshold) acc.lowBalance += 1;
            return acc;
        },
        { depositsHeld: 0, lowBalance: 0 }
    );

    return {
        totalVendors: balances.length,
        depositsHeld: round2(totals.depositsHeld),
        lowBalanceVendors: totals.lowBalance,
        depositedThisMonth: round2(snapshot.monthly && snapshot.monthly.deposited),
        usedThisMonth: round2(snapshot.monthly && snapshot.monthly.used),
        commissionThisMonth: round2(snapshot.monthly && snapshot.monthly.commission),
        openCreditNotes: toNumber(snapshot.openCreditNotes),
        lowBalanceThreshold: threshold,
    };
};

module.exports = {
    JOURNAL_KEYS,
    REFUND_KEYS,
    ORDER_STATUS_FILTERS,
    COMMISSION_STATUS_FILTERS,
    SORTABLE_FIELDS,
    BALANCES_CACHE_KEY,
    BALANCES_CACHE_TTL_SECONDS,
    DEFAULT_LOW_BALANCE,
    VENDOR_DEPOSITS_ACCOUNT,
    VENDOR_INVOICE_PRESENT,
    UNANSWERED_STATUS,
    getVendorDepositAccounts,
    accountIdsForVendor,
    ledgerAccountIdsForVendor,
    allAccountIds,
    allLedgerAccountIds,
    commissionModeOf,
    notPrincipalMarkup,
    soldAsPrincipal,
    notMarkupSale,
    vendorLedgerOrderClause,
    vendorCommissionOrderClause,
    earnsVendorCommission,
    getLowBalanceThreshold,
    listVendorsWithServices,
    findVendorById,
    buildVendorMovementQuery,
    sumVendorMovements,
    buildVendorSplitQuery,
    buildVendorReversalQuery,
    sumVendorSplitTotals,
    vendorAmountsFromJournal,
    orderCommission,
    isRefunded,
    refundedAmount,
    refundRatio,
    listVendorOrders,
    buildVendorCommissionQuery,
    listVendorCommissions,
    buildCommissionReversalListQuery,
    listCommissionReversals,
    serializeTransaction,
    serializeCommission,
    buildPosition,
    loadVendorPosition,
    getVendorLedgerSummary,
    buildVendorLedgerSnapshot,
    getVendorLedgerSnapshot,
    serializeVendor,
    buildVendorKpis,
};
