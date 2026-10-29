const { Op } = require("sequelize");
const sequelizeConfig = require("../../configs/database/index");
const serviceOperator = require("../entities/serviceOperator");
const systemUser = require("../entities/systemUser");
const roleAndPermissions = require("../entities/roleAndPermissions");
const credential = require("../entities/credential");
const chartOfAccount = require("../entities/chartOfAccount");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const { customLog } = require("../../utils/loggerHelper");
const { istDayRange, istMonthToDateRange } = require("../../utils/istRange");
const {
    DASHBOARD_CACHE_KEY,
    accountingFloorOf,
    flooredAfter,
    loadGoLiveDate,
} = require("./accountingPeriod");
const { findAwaitingApprovals } = require("./serviceApprovalTree");
const { getApprovalGateSettings } = require("./serviceApprovalGate");
const { getServicesTypeConfig, isCommissionConfigured } = require("./accountingServices");
const { getOtherSalesTotals } = require("./otherSales");
const { getThirdPartySalesTotals } = require("./thirdPartySales");
const { getAccountingRankings } = require("./accountingRankings");
const { PLAN_CATALOGUES, accessKeyExpressionOf } = require("./planCatalogues");
const { loadAddOnCounts } = require("./accountingAddOns");
const { countEntriesNotInBooks, listEntriesNotInBooks } = require("./ledgerBooks");
const { isOneTimeItemOrder, withOneTimeItemKeys } = require("./oneTimeItems");
const {
    gmvOfOrder,
    netGmvOfOrder,
    discountOfOrder,
    SKIP_NOTES,
    SKIP_NOTE_PREFIXES,
    UNPREPARED_NOTE,
} = require("./journalPosting");
const finders = require("./dashboardAlertFinders");
const { loadInternalAccountIds, accountScopeClause, withAccountScope } = require("./internalAccounts");

const CACHE_KEY = DASHBOARD_CACHE_KEY;
const CACHE_TTL_SECONDS = 300;
const ALERT_ITEMS_LIMIT = 50;

const JOURNAL_KEYS = ["transaction", "refund", "cashback", "cashbackReversal", "adminRefund"];

const JOURNAL_LABELS = {
    transaction: "Transaction",
    refund: "Refund",
    cashback: "Cashback",
    cashbackReversal: "Cashback Reversal",
    adminRefund: "Admin Refund",
};

const ENTRY_METRICS = {
    transaction: "transactionEntries",
    refund: "refundEntries",
    cashback: "cashbackEntries",
    cashbackReversal: "cashbackReversalEntries",
    adminRefund: "adminRefundEntries",
};

const jsonAmount = field => `CAST(JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.${field}')) AS DECIMAL(14, 4))`;

const SUBSCRIPTION_INCOME = `CASE WHEN ${isOneTimeItemOrder("orders.serviceOperatorId")} THEN 0 ELSE ${jsonAmount("netSubscriptionIncome")} END`;

const AMOUNT_METRICS = {
    commission: jsonAmount("commissionExcludingGST"),
    platformFee: jsonAmount("platformFeeExcludingGST"),
    subscriptions: SUBSCRIPTION_INCOME,
};

const METRIC_KEYS = [
    "journalEntries",
    ...Object.values(ENTRY_METRICS),
    "failedEntries",
    "skippedEntries",
    "notRecordedEntries",
    "transactionsCount",
    "gmv",
    "discounts",
    "netGmv",
    ...Object.keys(AMOUNT_METRICS),
    "subscriptionsMonthly",
    "subscriptionsAnnually",
];

const REQUIRED_ACCOUNT_NAMES = [
    "Transaction Processing Fees",
    "Output CGST",
    "Output SGST",
    "Output IGST",
    "Input CGST",
    "Input SGST",
    "Input IGST",
    "Coupon Discount Expense",
    "Platform Fees",
    "Commission",
    "Sales",
    "Subscription Fees",
    "Deferred Revenue",
    "Physical Card Sales",
    "Partnership Fees",
    "Rounding Off Account",
    "Internal Purchases Temporary Account",
    "Vendor Payable Temporary Account",
    "Cashback Expense",
    "Vendor Deposits",
    "Subscribers Wallet",
    "Partnership Fee Payable",
];

const FAILED_SYNC_STATUSES = ["CREATE_FAILED", "UPDATE_FAILED"];

const ASSET_ACCOUNT_TYPES = [
    "other_current_asset",
    "other_asset",
    "cash",
    "bank",
    "fixed_asset",
    "stock",
    "payment_clearing",
    "accounts_receivable",
];

const LIABILITY_ACCOUNT_TYPES = [
    "other_current_liability",
    "other_liability",
    "long_term_liability",
    "credit_card",
    "accounts_payable",
];

// Peko prepays each vendor and every fulfilled order draws that advance down, so the
// shared deposits account is an asset. Classifying it as a liability leaves the portal
// arithmetic looking right while the general ledger reads with the opposite sign.
const EXPECTED_ACCOUNT_SIDE = {
    "Vendor Deposits": "asset",
    "Subscribers Wallet": "asset",
    "Partnership Fee Payable": "liability",
};

const sideOfAccountType = accountType => {
    const type = String(accountType || "").toLowerCase();
    if (ASSET_ACCOUNT_TYPES.includes(type)) return "asset";
    if (LIABILITY_ACCOUNT_TYPES.includes(type)) return "liability";
    return null;
};

const findMisclassifiedAccounts = rows =>
    rows
        .filter(row => {
            const expected = EXPECTED_ACCOUNT_SIDE[row.account_name];
            if (!expected) return false;
            const actual = sideOfAccountType(row.account_type);
            return Boolean(actual) && actual !== expected;
        })
        .map(row => ({ accountName: row.account_name, accountType: row.account_type }));

// A dedicated flag rather than a nullability check on commissionType, since several plan
// tables default that column to a non-null value — a brand-new row would otherwise read as
// already configured before anyone in Accounting ever reviewed it.
const COMMISSION_NOT_CONFIGURED = "isCommissionConfigured = 0";

const toNumber = value => Number(value) || 0;

const recorded = key => `JSON_EXTRACT(journalRecordStatus, '$.${key}') = true`;
const skipped = key => `JSON_EXTRACT(journalData, '$.${key}.skipped') = true`;
const notSkipped = key => `COALESCE(${skipped(key)}, false) = false`;
const failed = key => `${notSkipped(key)} AND JSON_EXTRACT(journalRecordStatus, '$.${key}') = false`;
// No verdict and no skip marker: the journal never ran for this order, whether or not the
// computed amounts were stored on it.
const notRecorded = key => `JSON_EXTRACT(journalRecordStatus, '$.${key}') IS NULL AND ${notSkipped(key)}`;

const countWhere = condition => `COALESCE(SUM(CASE WHEN ${condition} THEN 1 ELSE 0 END), 0)`;
const countAcrossKeys = (predicate, andDateFor = () => "") =>
    `COALESCE(SUM(${JOURNAL_KEYS.map(key => `(CASE WHEN ${predicate(key)}${andDateFor(key)} THEN 1 ELSE 0 END)`).join(" + ")}), 0)`;
const sumForSuccess = (expression, andDate = "") =>
    `COALESCE(SUM(CASE WHEN status = 'SUCCESS'${andDate} THEN ${expression} ELSE 0 END), 0)`;

const BILLING_TYPE = "JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.billingType'))";
const sumForSuccessByBilling = (expression, billingType, andDate = "") =>
    `COALESCE(SUM(CASE WHEN status = 'SUCCESS' AND ${BILLING_TYPE} = '${billingType}'${andDate} THEN ${expression} ELSE 0 END), 0)`;

const journalEventDate = key =>
    `CAST(JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.${key}.journalDate')) AS DATE)`;

const buildJournalKpisQuery = (range, accountIds = null) => {
    const txnDateInRange = range ? "transactionDate BETWEEN :from AND :to" : null;
    const andTxnDateInRange = txnDateInRange ? ` AND ${txnDateInRange}` : "";

    const eventDateInRange = key => {
        if (!range) return null;
        if (key === "transaction") return txnDateInRange;
        return `${journalEventDate(key)} BETWEEN :from AND :to`;
    };
    const andEventDateInRange = key => {
        const condition = eventDateInRange(key);
        return condition ? ` AND ${condition}` : "";
    };

    const columns = [
        ...JOURNAL_KEYS.map(
            key => `${countWhere(`${recorded(key)}${andEventDateInRange(key)}`)} AS ${ENTRY_METRICS[key]}`
        ),
        `${countAcrossKeys(failed, andEventDateInRange)} AS failedEntries`,
        `${countAcrossKeys(skipped, () => andTxnDateInRange)} AS skippedEntries`,
        `${countWhere(`status = 'SUCCESS' AND ${notRecorded("transaction")}${andTxnDateInRange}`)} AS notRecordedEntries`,
        `${countWhere(`status = 'SUCCESS'${andTxnDateInRange}`)} AS transactionsCount`,
        `${sumForSuccess(gmvOfOrder(), andTxnDateInRange)} AS gmv`,
        `${sumForSuccess(discountOfOrder(), andTxnDateInRange)} AS discounts`,
        `${sumForSuccess(netGmvOfOrder(), andTxnDateInRange)} AS netGmv`,
        ...Object.entries(AMOUNT_METRICS).map(
            ([metric, expression]) => `${sumForSuccess(expression, andTxnDateInRange)} AS ${metric}`
        ),
        // Subscriptions' own breakdown. Same transaction-date window as the Total Subscriptions
        // card, or an order outside the window with a refund posted inside it would land here
        // and not there, and Monthly plus Annual would stop adding up to the total.
        `${sumForSuccessByBilling(SUBSCRIPTION_INCOME, "MONTHLY", andTxnDateInRange)} AS subscriptionsMonthly`,
        `${sumForSuccessByBilling(SUBSCRIPTION_INCOME, "ANNUALLY", andTxnDateInRange)} AS subscriptionsAnnually`,
    ];
    // The floor is unconditional. Without a range this built an unbounded scan of every
    // order ever placed, and even the month-to-date window reaches back before the cut-off
    // on go-live day itself.
    const clauses = [flooredAfter("DATE(transactionDate)")];
    if (accountIds) clauses.push(accountScopeClause("credentialId", accountIds));
    if (range) {
        const rangeClauses = [
            txnDateInRange,
            ...JOURNAL_KEYS.filter(key => key !== "transaction").map(
                key => `${journalEventDate(key)} BETWEEN :from AND :to`
            ),
        ];
        clauses.push(`(${rangeClauses.join(" OR ")})`);
    }
    return `SELECT ${columns.join(", ")} FROM orders WHERE ${clauses.join(" AND ")}`;
};

const getJournalKpis = async (range, accountingFloor, accountIds = null) => {
    const options = {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: withAccountScope(withOneTimeItemKeys({ accountingFloor }), accountIds),
    };
    if (range) {
        options.replacements.from = range.from;
        options.replacements.to = range.to;
    }

    const [row] = await sequelizeConfig.query(buildJournalKpisQuery(range, accountIds), options);

    const metrics = {};
    METRIC_KEYS.forEach(key => {
        metrics[key] = toNumber(row && row[key]);
    });
    metrics.journalEntries = Object.values(ENTRY_METRICS).reduce((sum, key) => sum + metrics[key], 0);
    return metrics;
};

const findServicesWithoutCommission = async () => {
    const config = await getServicesTypeConfig();
    if (!config.service_without_plans.length) return [];

    const rows = await serviceOperator.findAll({
        where: { serviceStatus: true, accessKey: { [Op.in]: config.service_without_plans } },
        attributes: [
            "serviceProvider",
            "accessKey",
            "commissionType",
            "providerCommission",
            "fixedCommissionPerTransaction",
            "isCommissionConfigured",
        ],
        order: [["serviceProvider", "ASC"]],
        raw: true,
    });

    return rows
        .filter(row => !isCommissionConfigured(row))
        .map(row => ({ label: row.serviceProvider, accessKey: row.accessKey }));
};

const findPartnersMissing = async missing => {
    const rows = await systemUser.findAll({
        where: { ...missing, brandingStatus: true },
        attributes: ["id", "registeredBy"],
        include: [
            { model: roleAndPermissions, attributes: [], where: { roleName: "partner" } },
            { model: credential, attributes: ["name"] },
        ],
        order: [["registeredBy", "ASC"]],
        raw: true,
        nest: true,
    });

    return rows
        .map(row => ({
            label: (row.credential && row.credential.name) || row.registeredBy,
            partnerId: row.registeredBy,
        }))
        .filter(row => Boolean(row.label));
};

const findPartnersWithoutShare = () => findPartnersMissing({ sharePercentage: null });

const findPartnersWithoutGatewayCharge = () => findPartnersMissing({ gatewayCharge: null });

const findChartOfAccountIssues = async () => {
    const unsyncedWhere = {
        [Op.or]: [{ syncStatus: { [Op.in]: FAILED_SYNC_STATUSES } }, { provider_account_id: null }],
    };

    const [requiredRows, unsyncedCount, unsyncedRows] = await Promise.all([
        chartOfAccount.findAll({
            where: { account_name: { [Op.in]: REQUIRED_ACCOUNT_NAMES } },
            attributes: ["account_name", "account_type"],
            raw: true,
        }),
        chartOfAccount.count({ where: unsyncedWhere }),
        chartOfAccount.findAll({
            where: unsyncedWhere,
            attributes: ["account_name", "syncStatus"],
            order: [["updatedAt", "DESC"]],
            limit: ALERT_ITEMS_LIMIT,
            raw: true,
        }),
    ]);

    const present = new Set(requiredRows.map(row => row.account_name));
    return {
        missing: REQUIRED_ACCOUNT_NAMES.filter(name => !present.has(name)),
        unsynced: {
            count: toNumber(unsyncedCount),
            items: unsyncedRows.map(row => ({
                accountName: row.account_name,
                syncStatus: row.syncStatus || null,
            })),
        },
        misclassified: findMisclassifiedAccounts(requiredRows),
    };
};

const PLAN_SERVICE_FILTER = table => `${accessKeyExpressionOf(table)} IN (:planServiceKeys)`;

const plansMissingCommissionSelects = columns =>
    PLAN_CATALOGUES.map(({ table, name, extraWhere }) => {
        const where = ["status = 1", COMMISSION_NOT_CONFIGURED, extraWhere, PLAN_SERVICE_FILTER(table)]
            .filter(Boolean)
            .join(" AND ");
        return `SELECT ${columns(table, name)} FROM ${table} WHERE ${where}`;
    });

const buildPlansMissingCommissionQuery = () => {
    const selects = plansMissingCommissionSelects((table, name) => `'${table}' AS catalogue, ${name} AS name`);
    return (
        "SELECT catalogue, COUNT(*) AS total " +
        `FROM (${selects.join(" UNION ALL ")}) AS missing GROUP BY catalogue`
    );
};

const buildPlansMissingCommissionRowsQuery = () => {
    const selects = plansMissingCommissionSelects(
        (table, name) =>
            `'${table}' AS catalogue, id AS planId, ${name} AS name, ${accessKeyExpressionOf(table)} AS accessKey`
    );
    return (
        "SELECT catalogue, planId, name, accessKey " +
        `FROM (${selects.join(" UNION ALL ")}) AS missing ORDER BY name, catalogue LIMIT ${ALERT_ITEMS_LIMIT}`
    );
};

// Add-ons are settings rows, so they are listed under that table's name next to the plan tables.
const ADD_ON_CATALOGUE = "settings";

const findPlansMissingCommission = async () => {
    const config = await getServicesTypeConfig();
    const planServiceKeys = config.service_with_plans;
    if (!planServiceKeys.length) return { total: 0, catalogues: {}, items: [] };

    const options = { type: sequelizeConfig.QueryTypes.SELECT, replacements: { planServiceKeys } };
    const [rows, planRows, addOnCounts] = await Promise.all([
        sequelizeConfig.query(buildPlansMissingCommissionQuery(), options),
        sequelizeConfig.query(buildPlansMissingCommissionRowsQuery(), options),
        loadAddOnCounts(planServiceKeys),
    ]);

    const catalogues = {};
    let total = 0;
    rows.forEach(row => {
        const count = toNumber(row.total);
        catalogues[row.catalogue] = count;
        total += count;
    });

    const items = (planRows || [])
        .filter(row => row && row.name)
        .map(row => ({
            label: row.name,
            catalogue: row.catalogue,
            planId: row.planId,
            accessKey: row.accessKey || null,
        }));

    const addOnItems = [...addOnCounts].flatMap(([accessKey, { notConfigured }]) =>
        notConfigured.map(addOn => ({ label: addOn.name, catalogue: ADD_ON_CATALOGUE, planId: addOn.id, accessKey }))
    );
    if (addOnItems.length) {
        catalogues[ADD_ON_CATALOGUE] = addOnItems.length;
        total += addOnItems.length;
    }

    return { total, catalogues, items: [...items, ...addOnItems].slice(0, ALERT_ITEMS_LIMIT) };
};

const orderIssueColumns =
    "corporateTxnId, serviceOperatorId, amountInINR, transactionDate, DATE_FORMAT(transactionDate, '%Y-%m-%d') AS orderDate";

const reasonOf = key => `JSON_UNQUOTE(JSON_EXTRACT(journalData, '$.${key}.reason'))`;
const ORDER_FLOOR = flooredAfter("DATE(transactionDate)");
const WAITING_FOR_SALE_REASON = "Transaction journal has not been recorded successfully yet";
const REFUND_LIKE_KEYS = ["refund", "adminRefund", "cashbackReversal"];
const REPEATED_REASON_MIN = 3;

const failedSelects = () =>
    JOURNAL_KEYS.map(key => {
        const eventDate = key === "transaction" ? "transactionDate" : journalEventDate(key);
        return (
            `SELECT ${orderIssueColumns}, '${key}' AS journalKey, ${reasonOf(key)} AS reason, ${eventDate} AS eventDate ` +
            `FROM orders WHERE ${ORDER_FLOOR} AND ${failed(key)} AND ${eventDate} BETWEEN :from AND :to`
        );
    });

const skippedSelects = () =>
    JOURNAL_KEYS.map(
        key =>
            `SELECT ${orderIssueColumns}, '${key}' AS journalKey, ${reasonOf(key)} AS reason ` +
            `FROM orders WHERE ${ORDER_FLOOR} AND ${skipped(key)} AND transactionDate BETWEEN :from AND :to`
    );

const waitingSelects = () =>
    REFUND_LIKE_KEYS.map(
        key =>
            `SELECT ${orderIssueColumns}, '${key}' AS journalKey FROM orders ` +
            `WHERE ${ORDER_FLOOR} AND ${skipped(key)} AND ${reasonOf(key)} = :waitingReason`
    );

const buildFailedJournalsQuery = () =>
    `SELECT * FROM (${failedSelects().join(" UNION ALL ")}) AS failures ORDER BY eventDate DESC LIMIT ${ALERT_ITEMS_LIMIT}`;

const buildFailureReasonsQuery = () =>
    `SELECT reason, COUNT(*) AS total FROM (${failedSelects().join(" UNION ALL ")}) AS failureReasons ` +
    "GROUP BY reason ORDER BY total DESC";

const buildSkippedJournalsQuery = () =>
    `SELECT * FROM (${skippedSelects().join(" UNION ALL ")}) AS skips ORDER BY transactionDate DESC LIMIT ${ALERT_ITEMS_LIMIT}`;

const buildSkipReasonsQuery = () =>
    `SELECT reason, COUNT(*) AS total FROM (${skippedSelects().join(" UNION ALL ")}) AS skipReasons ` +
    "GROUP BY reason ORDER BY total DESC";

const buildNotRecordedJournalsQuery = () =>
    `SELECT ${orderIssueColumns} FROM orders WHERE ${ORDER_FLOOR} ` +
    `AND status = 'SUCCESS' AND ${notRecorded("transaction")} AND transactionDate BETWEEN :from AND :to ` +
    `ORDER BY transactionDate DESC LIMIT ${ALERT_ITEMS_LIMIT}`;

const buildRefundsWaitingQuery = ({ count = false } = {}) =>
    count
        ? `SELECT COUNT(*) AS total FROM (${waitingSelects().join(" UNION ALL ")}) AS waiting`
        : `SELECT * FROM (${waitingSelects().join(" UNION ALL ")}) AS waiting ORDER BY transactionDate DESC LIMIT ${ALERT_ITEMS_LIMIT}`;

const skipNoteOf = reason => {
    if (SKIP_NOTES[reason]) return SKIP_NOTES[reason];
    const match = SKIP_NOTE_PREFIXES.find(([prefix]) => typeof reason === "string" && reason.startsWith(prefix));
    return match ? match[1] : UNPREPARED_NOTE;
};

const planTypeOf = (accessKey, config) => {
    if (!config) return null;
    if ((config.service_with_plans || []).includes(accessKey)) return "with_plans";
    if ((config.service_without_plans || []).includes(accessKey)) return "without_plans";
    return null;
};

const serviceDetailsOf = async (rows, config) => {
    const ids = [...new Set(rows.map(row => row.serviceOperatorId).filter(Boolean))];
    if (!ids.length) return new Map();
    const operators = await serviceOperator.findAll({
        where: { id: { [Op.in]: ids } },
        attributes: ["id", "serviceProvider", "accessKey"],
        raw: true,
    });
    return new Map(
        (operators || []).map(row => [
            String(row.id),
            { service: row.serviceProvider, accessKey: row.accessKey, planType: planTypeOf(row.accessKey, config) },
        ])
    );
};

const findJournalIssues = async (range, accountingFloor, config = null) => {
    const options = {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: { accountingFloor, from: range.from, to: range.to },
    };
    const waitingOptions = {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements: { accountingFloor, waitingReason: WAITING_FOR_SALE_REASON },
    };
    const [failedRows, notRecordedRows, skippedRows, failureReasonRows, skipReasonRows, waitingCountRows, waitingRows] =
        await Promise.all([
            sequelizeConfig.query(buildFailedJournalsQuery(), options),
            sequelizeConfig.query(buildNotRecordedJournalsQuery(), options),
            sequelizeConfig.query(buildSkippedJournalsQuery(), options),
            sequelizeConfig.query(buildFailureReasonsQuery(), options),
            sequelizeConfig.query(buildSkipReasonsQuery(), options),
            sequelizeConfig.query(buildRefundsWaitingQuery({ count: true }), waitingOptions),
            sequelizeConfig.query(buildRefundsWaitingQuery(), waitingOptions),
        ]);
    const withTxn = rows => (rows || []).filter(row => row && row.corporateTxnId);
    const failedOrders = withTxn(failedRows);
    const notRecordedOrders = withTxn(notRecordedRows);
    const skippedOrders = withTxn(skippedRows);
    const waitingOrders = withTxn(waitingRows);
    const details = await serviceDetailsOf(
        [...failedOrders, ...notRecordedOrders, ...skippedOrders, ...waitingOrders],
        config
    );
    const orderOf = row => {
        const detail = details.get(String(row.serviceOperatorId)) || {};
        return {
            label: row.corporateTxnId,
            corporateTxnId: row.corporateTxnId,
            service: detail.service || null,
            accessKey: detail.accessKey || null,
            planType: detail.planType || null,
            amount: toNumber(row.amountInINR),
            orderDate: row.orderDate || null,
        };
    };
    const withKey = row => ({
        ...orderOf(row),
        journalKey: row.journalKey,
        journalLabel: JOURNAL_LABELS[row.journalKey] || row.journalKey,
    });
    const reasons = rows =>
        (rows || [])
            .filter(row => row && toNumber(row.total) > 0)
            .map(row => ({ reason: row.reason || null, count: toNumber(row.total) }));
    const skipNotes = {};
    reasons(skipReasonRows).forEach(({ reason, count }) => {
        const note = skipNoteOf(reason);
        skipNotes[note] = (skipNotes[note] || 0) + count;
    });

    return {
        failed: failedOrders.map(row => ({ ...withKey(row), reason: row.reason || null })),
        notRecorded: notRecordedOrders.map(orderOf),
        skipped: skippedOrders.map(row => ({ ...withKey(row), reason: row.reason || null, note: skipNoteOf(row.reason) })),
        failedReasons: reasons(failureReasonRows),
        skipNotes: Object.entries(skipNotes)
            .map(([note, count]) => ({ note, count }))
            .sort((a, b) => b.count - a.count),
        refundsWaiting: {
            count: toNumber(waitingCountRows && waitingCountRows[0] && waitingCountRows[0].total),
            items: waitingOrders.map(withKey),
        },
    };
};


const PLATFORM_FEE_LINK_FROM =
    "FROM cashbacks c INNER JOIN packages p ON p.id = c.packageId " +
    "INNER JOIN serviceOperators so ON so.id = c.serviceOperatorId " +
    "LEFT JOIN credentials cr ON cr.id = p.partnerId";

const PLATFORM_FEE_LINK_WHERE =
    "c.serviceStatus = 1 AND p.status = 1 AND COALESCE(c.isSurchargeConfigured, 0) = 0 " +
    "AND so.serviceStatus = 1 AND so.accessKey IN (:accessKeys)";

const buildPlatformFeeMissingCountQuery = () =>
    `SELECT COUNT(*) AS total, COUNT(DISTINCT so.id) AS services ${PLATFORM_FEE_LINK_FROM} WHERE ${PLATFORM_FEE_LINK_WHERE}`;

const buildPlatformFeeMissingRowsQuery = () =>
    "SELECT c.id, so.serviceProvider, so.accessKey, p.packageName, p.partnerId, cr.name AS partnerName " +
    `${PLATFORM_FEE_LINK_FROM} WHERE ${PLATFORM_FEE_LINK_WHERE} ` +
    `ORDER BY so.serviceProvider, p.packageName, c.id LIMIT ${ALERT_ITEMS_LIMIT}`;

const loadPlatformFeeMissing = async (accessKeys, planType) => {
    if (!accessKeys.length) return { count: 0, services: 0, items: [] };
    const options = { type: sequelizeConfig.QueryTypes.SELECT, replacements: { accessKeys } };
    const [countRows, rows] = await Promise.all([
        sequelizeConfig.query(buildPlatformFeeMissingCountQuery(), options),
        sequelizeConfig.query(buildPlatformFeeMissingRowsQuery(), options),
    ]);
    const counts = (countRows && countRows[0]) || {};
    return {
        count: toNumber(counts.total),
        services: toNumber(counts.services),
        items: (rows || [])
            .filter(row => row && row.serviceProvider)
            .map(row => ({
                label: `${row.serviceProvider} · ${row.packageName || "Package"}`,
                planType,
                accessKey: row.accessKey,
                service: row.serviceProvider,
                packageName: row.packageName || null,
                partnerId: row.partnerId ? String(row.partnerId) : null,
                partnerName: row.partnerName || null,
            })),
    };
};

const findPlatformFeeMissing = async () => {
    const config = await getServicesTypeConfig();
    const [withoutPlans, withPlans] = await Promise.all([
        loadPlatformFeeMissing(config.service_without_plans, "without_plans"),
        loadPlatformFeeMissing(config.service_with_plans, "with_plans"),
    ]);
    return { without_plans: withoutPlans, with_plans: withPlans };
};

const safely = async (label, task) => {
    try {
        return await task();
    } catch (error) {
        customLog(null, "error", {
            message: `Accounting dashboard read "${label}" failed`,
            error: error && error.message,
        });
        return null;
    }
};

const groupOf = group => (group && toNumber(group.count) > 0 ? group : null);

const buildAlerts = ({
    today,
    journals,
    goLiveConfigured,
    recording,
    services,
    platformFees,
    partners,
    partnersCharge,
    vendorsGst,
    coa,
    coaPending,
    plans,
    packages,
    approvals,
    gate,
    drifted,
    vendorBalances,
    partnersOverdue,
    gatewayShortfalls,
    openings,
}) => {
    const alerts = [];
    const push = (type, severity, count, items, meta) => {
        const alert = { type, severity, count, items: (items || []).slice(0, ALERT_ITEMS_LIMIT) };
        if (meta) alert.meta = meta;
        alerts.push(alert);
    };
    const pushGroup = (type, group, { severity = "warning", meta } = {}) => {
        const found = groupOf(group);
        if (!found) return;
        push(type, severity, toNumber(found.count), found.items, meta === undefined ? found.meta : meta);
    };
    const platformFeeMeta = planType => ({
        services: toNumber(platformFees && platformFees[planType] && platformFees[planType].services),
    });
    const journalItems = key => ((journals && journals[key]) || []).slice(0, ALERT_ITEMS_LIMIT);

    if (goLiveConfigured === false) push("go_live_not_set", "error", 1, []);

    if (recording && toNumber(recording.count) > 0) {
        const paused = Boolean(recording.meta && recording.meta.paused);
        push("journal_recording_off", paused ? "error" : "warning", toNumber(recording.count), recording.items, recording.meta);
    }

    if (today.failedEntries > 0) push("failed_journals_today", "error", today.failedEntries, journalItems("failed"));

    const failedReasons = (journals && journals.failedReasons) || [];
    const failedTotal = failedReasons.reduce((sum, entry) => sum + toNumber(entry.count), 0);
    const topReason = failedReasons[0];
    if (topReason && toNumber(topReason.count) >= REPEATED_REASON_MIN && toNumber(topReason.count) * 2 >= failedTotal) {
        push(
            "failures_share_reason",
            "error",
            toNumber(topReason.count),
            failedReasons.slice(0, 5).map(entry => ({
                label: entry.reason || "No reason given",
                reason: entry.reason || null,
                count: toNumber(entry.count),
            })),
            { total: failedTotal, share: Math.round((toNumber(topReason.count) / failedTotal) * 100) }
        );
    }

    if (today.notRecordedEntries > 0) {
        push("journals_not_recorded", "warning", today.notRecordedEntries, journalItems("notRecorded"));
    }

    if (today.skippedEntries > 0) {
        push("journals_held_back_today", "warning", today.skippedEntries, journalItems("skipped"), {
            notes: (journals && journals.skipNotes) || [],
        });
    }

    pushGroup("refunds_waiting_for_sale", journals && journals.refundsWaiting);

    if (services && services.length) push("services_without_commission", "warning", services.length, services);

    pushGroup("platform_fee_missing_without_plans", platformFees && platformFees.without_plans, {
        meta: platformFeeMeta("without_plans"),
    });

    if (partners && partners.length) push("partners_without_share", "warning", partners.length, partners);

    if (partnersCharge && partnersCharge.length) {
        push("partners_without_gateway_charge", "warning", partnersCharge.length, partnersCharge);
    }

    pushGroup("vendors_without_gst", vendorsGst);

    if (coa) {
        const misclassified = coa.misclassified || [];
        const count = coa.missing.length + coa.unsynced.count + misclassified.length;
        if (count > 0) {
            const items = [
                ...coa.missing.map(accountName => ({ label: accountName, issue: "missing", accountName })),
                ...coa.unsynced.items.map(item =>
                    typeof item === "string"
                        ? { label: item, issue: "unsynced", accountName: item, syncStatus: null }
                        : { label: item.accountName, issue: "unsynced", ...item }
                ),
                ...misclassified.map(item =>
                    typeof item === "string"
                        ? { label: item, issue: "misclassified", accountName: item, accountType: null }
                        : { label: `${item.accountName} (${item.accountType})`, issue: "misclassified", ...item }
                ),
            ];
            push("chart_of_accounts_issues", misclassified.length ? "error" : "warning", count, items, {
                missing: coa.missing.length,
                unsynced: coa.unsynced.count,
                misclassified: misclassified.length,
            });
        }
    }

    pushGroup("chart_of_accounts_pending", coaPending);

    if (plans && plans.total > 0) {
        push("plans_missing_commission", "warning", plans.total, plans.items, { catalogues: plans.catalogues });
    }

    pushGroup("platform_fee_missing_with_plans", platformFees && platformFees.with_plans, {
        meta: platformFeeMeta("with_plans"),
    });
    pushGroup("peko_packages_without_pricing", packages);

    if (gate && gate.enabled === false) {
        push("approval_gate_off", "error", 1, [], { setByName: gate.setByName || null, setAt: gate.setAt || null });
    }

    if (approvals && approvals.count > 0) {
        push("services_awaiting_approval", "warning", approvals.count, approvals.items, {
            undecided: approvals.undecided,
            rejected: approvals.rejected,
            partners: approvals.partners,
        });
    }

    pushGroup("approvals_drifted", drifted);

    pushGroup("vendor_balance_low", vendorBalances, {
        severity: vendorBalances && vendorBalances.meta && toNumber(vendorBalances.meta.negative) > 0 ? "error" : "warning",
    });
    pushGroup("partner_payable_overdue", partnersOverdue);
    pushGroup("gateway_settlements_short", gatewayShortfalls);
    pushGroup("opening_balances_missing", openings);

    return alerts;
};


const EMPTY_SERVICES_CONFIG = {
    service_with_plans: [],
    service_without_plans: [],
    peko_service_subscriptions: [],
    peko_subscription_vendors: [],
};

const metricsOf = (kpis, otherSales, thirdPartySales) => ({
    ...kpis,
    otherSales: otherSales.totalAmount,
    otherSalesCount: otherSales.count,
    thirdPartySales: thirdPartySales.totalAmount,
    thirdPartySalesCount: thirdPartySales.count,
});

const buildAccountingDashboard = async (now = new Date()) => {
    const goLiveDate = await loadGoLiveDate();
    const accountingFloor = accountingFloorOf(goLiveDate);
    const todayRange = istDayRange(now);
    const monthlyRange = istMonthToDateRange(now);
    const config = (await safely("services_type_config", getServicesTypeConfig)) || EMPTY_SERVICES_CONFIG;
    const internalAccountIds = (await safely("internal_accounts", loadInternalAccountIds)) || [];

    const [
        todayKpis,
        monthlyKpis,
        journals,
        todayOtherSales,
        monthlyOtherSales,
        todayThirdPartySales,
        monthlyThirdPartySales,
        todayInternalKpis,
        monthlyInternalKpis,
        todayInternalOtherSales,
        monthlyInternalOtherSales,
        todayInternalThirdPartySales,
        monthlyInternalThirdPartySales,
        services,
        platformFees,
        partners,
        partnersCharge,
        coa,
        plans,
        approvals,
        gate,
        rankings,
        recording,
        vendorsGst,
        coaPending,
        packages,
        drifted,
        vendorBalances,
        partnersOverdue,
        gatewayShortfalls,
        openings,
    ] = await Promise.all([
        getJournalKpis(todayRange, accountingFloor),
        getJournalKpis(monthlyRange, accountingFloor),
        safely("journal_issues_today", () => findJournalIssues(todayRange, accountingFloor, config)),
        getOtherSalesTotals({ range: todayRange, accountingFloor }),
        getOtherSalesTotals({ range: monthlyRange, accountingFloor }),
        getThirdPartySalesTotals({ range: todayRange, accountingFloor }),
        getThirdPartySalesTotals({ range: monthlyRange, accountingFloor }),
        getJournalKpis(todayRange, accountingFloor, internalAccountIds),
        getJournalKpis(monthlyRange, accountingFloor, internalAccountIds),
        getOtherSalesTotals({ range: todayRange, accountingFloor, accountIds: internalAccountIds }),
        getOtherSalesTotals({ range: monthlyRange, accountingFloor, accountIds: internalAccountIds }),
        getThirdPartySalesTotals({ range: todayRange, accountingFloor, accountIds: internalAccountIds }),
        getThirdPartySalesTotals({ range: monthlyRange, accountingFloor, accountIds: internalAccountIds }),
        safely("services_without_commission", findServicesWithoutCommission),
        safely("platform_fee_missing", findPlatformFeeMissing),
        safely("partners_without_share", findPartnersWithoutShare),
        safely("partners_without_gateway_charge", findPartnersWithoutGatewayCharge),
        safely("chart_of_accounts_issues", findChartOfAccountIssues),
        safely("plans_missing_commission", findPlansMissingCommission),
        safely("services_awaiting_approval", findAwaitingApprovals),
        safely("approval_gate_off", getApprovalGateSettings),
        safely("rankings", () => getAccountingRankings({ range: monthlyRange, accountingFloor })),
        safely("journal_recording_off", () => finders.findJournalRecordingOff(config)),
        safely("vendors_without_gst", () => finders.findVendorsWithoutGstDetails(config)),
        safely("chart_of_accounts_pending", () => finders.findChartOfAccountsPending(now)),
        safely("peko_packages_without_pricing", () => finders.findPekoPackagesWithoutPricing(config)),
        safely("approvals_drifted", finders.findDriftedApprovals),
        safely("vendor_balance_low", finders.findVendorBalanceIssues),
        safely("partner_payable_overdue", () => finders.findPartnersOverdue({ now, accountingFloor })),
        safely("gateway_settlements_short", finders.findGatewayShortfalls),
        safely("opening_balances_missing", () => finders.findOpeningBalancesMissing({ accountingFloor, config })),
    ]);

    const today = {
        ...metricsOf(todayKpis, todayOtherSales, todayThirdPartySales),
        internal: metricsOf(todayInternalKpis, todayInternalOtherSales, todayInternalThirdPartySales),
    };
    const monthly = {
        ...metricsOf(monthlyKpis, monthlyOtherSales, monthlyThirdPartySales),
        internal: metricsOf(monthlyInternalKpis, monthlyInternalOtherSales, monthlyInternalThirdPartySales),
    };
    const goLiveConfigured = Boolean(goLiveDate);

    return {
        generatedAt: now.toISOString(),
        // Every figure below rests on this, so the screen says what it is rather than
        // leaving a reader to wonder why the numbers look small.
        goLiveDate,
        goLiveConfigured,
        sections: {
            today: { ...today, range: todayRange },
            monthly: { ...monthly, range: monthlyRange },
        },
        alerts: buildAlerts({
            today,
            journals,
            goLiveConfigured,
            recording,
            services,
            platformFees,
            partners,
            partnersCharge,
            vendorsGst,
            coa,
            coaPending,
            plans,
            packages,
            approvals,
            gate,
            drifted,
            vendorBalances,
            partnersOverdue,
            gatewayShortfalls,
            openings,
        }),
        rankings,
    };
};


const readCache = async () => {
    try {
        const raw = await getValue(CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        customLog(null, "error", {
            message: "Accounting dashboard cache read failed",
            error: error && error.message,
        });
        return null;
    }
};

const writeCache = async payload => {
    try {
        await setValue(CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(payload));
    } catch (error) {
        customLog(null, "error", {
            message: "Accounting dashboard cache write failed",
            error: error && error.message,
        });
    }
};

const BOOKS_ALERT_TYPE = "ledger_entries_not_in_books";

const ENTRY_KIND_LABELS = {
    deposit: "Deposit",
    opening: "Opening balance",
    credit_note: "Credit note",
    commission: "Commission",
    payout: "Payout",
    debit_note: "Debit note",
    receipt: "Receipt",
    fee: "Fee",
};

const booksItemOf = entry => ({
    label: `${ENTRY_KIND_LABELS[entry.entryKind] || "Entry"} · ${entry.profileName || entry.profileId || "Unknown"}`,
    ...entry,
});

const booksAlertOf = (books, entries = []) =>
    books && books.total > 0
        ? {
              type: BOOKS_ALERT_TYPE,
              severity: "warning",
              count: books.total,
              items: (entries || []).slice(0, ALERT_ITEMS_LIMIT).map(booksItemOf),
              meta: {
                  vendors: books.vendors,
                  partners: books.partners,
                  gateways: books.gateways,
                  deleted: books.deleted,
              },
          }
        : null;

const withBooksAlert = async payload => {
    const books = await safely(BOOKS_ALERT_TYPE, countEntriesNotInBooks);
    const entries =
        books && books.total > 0
            ? await safely(`${BOOKS_ALERT_TYPE}_items`, () => listEntriesNotInBooks(ALERT_ITEMS_LIMIT))
            : [];
    const alert = booksAlertOf(books, entries);
    const alerts = payload.alerts || [];
    const others = alerts.filter(item => item.type !== BOOKS_ALERT_TYPE);
    if (!alert && others.length === alerts.length) return payload;
    return { ...payload, alerts: alert ? [...others, alert] : others };
};

const getAccountingDashboard = async ({ refresh = false } = {}) => {
    if (!refresh) {
        const cached = await readCache();
        if (cached) return { ...(await withBooksAlert(cached)), cached: true };
    }

    const payload = await buildAccountingDashboard();
    await writeCache(payload);
    return { ...(await withBooksAlert(payload)), cached: false };
};

module.exports = {
    CACHE_KEY,
    CACHE_TTL_SECONDS,
    ALERT_ITEMS_LIMIT,
    JOURNAL_KEYS,
    METRIC_KEYS,
    REQUIRED_ACCOUNT_NAMES,
    PLAN_CATALOGUES,
    COMMISSION_NOT_CONFIGURED,
    recorded,
    failed,
    skipped,
    notSkipped,
    notRecorded,
    buildJournalKpisQuery,
    getJournalKpis,
    findServicesWithoutCommission,
    findPartnersWithoutShare,
    findPartnersWithoutGatewayCharge,
    findChartOfAccountIssues,
    buildPlansMissingCommissionQuery,
    buildPlansMissingCommissionRowsQuery,
    findPlansMissingCommission,
    buildFailedJournalsQuery,
    buildFailureReasonsQuery,
    buildSkippedJournalsQuery,
    buildSkipReasonsQuery,
    buildNotRecordedJournalsQuery,
    buildRefundsWaitingQuery,
    REPEATED_REASON_MIN,
    findJournalIssues,
    buildPlatformFeeMissingCountQuery,
    buildPlatformFeeMissingRowsQuery,
    findPlatformFeeMissing,
    buildAlerts,
    BOOKS_ALERT_TYPE,
    booksAlertOf,
    buildAccountingDashboard,
    getAccountingDashboard,
};
