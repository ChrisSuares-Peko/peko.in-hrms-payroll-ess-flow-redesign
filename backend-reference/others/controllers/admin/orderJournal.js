const asyncHandler = require("../../middlewares/async");
const { Op, Sequelize } = require("sequelize");
const orders = require("../../models/entities/order");
const serviceOperator = require("../../models/entities/serviceOperator");
const credential = require("../../models/entities/credential");
const ErrorResponse = require("../../utils/error-response");
const { journalAccountNames } = require("../../models/use-cases/journalAccountNames");
const { journalContextFor } = require("../../models/use-cases/journalContext");
const {
    loadAccountingFloor,
    goLiveWindowStart,
    isBeforeGoLive,
} = require("../../models/use-cases/accountingPeriod");
const { findOneCredential } = require("../../models/use-cases/credential");
const {
    listFeeDetails,
    serializeFeeDetail,
    feeExportColumns,
    FEE_LABELS,
} = require("../../models/use-cases/feeDetails");
const { periodOf, sendListExport } = require("../../utils/tableExport");
const {
    JOURNAL_LABELS,
    JOURNAL_STATUS_LABELS,
    listOrderJournals,
    orderJournalExportColumns,
} = require("../../models/use-cases/orderJournals");
const {
    listSubscriptionDetails,
    serializeSubscriptionDetail,
    subscriptionExportColumns,
    BILLING_LABELS,
    PEKO_DEFAULT_PARTNER,
} = require("../../models/use-cases/subscriptionDetails");
const {
    orderPostingAttributes,
    orderPostingOfRow,
    gmvOfOrder,
    netGmvOfOrder,
    discountOfOrder,
} = require("../../models/use-cases/journalPosting");
const { dayBoundedRange } = require("../../utils/istRange");
const {
    dispatchJournalRetry,
} = require("../../utils/bull/queue/accountingQueues");
const { generateInvoiceOrReceiptPdf } = require("../../utils/pekoRecieptHelper");
const { isPdfBuffer } = require("../../utils/pdfHelper");
const { customLog } = require("../../utils/loggerHelper");
const { resolvePartnerScope } = require("../../utils/partnerScope");
const { resolveAccountIds, accountScopeLabel } = require("../../models/use-cases/internalAccounts");

const PEKO_DIRECT_CUSTOMER =
    "(`credential`.`registeredBy` IS NULL OR `credential`.`registeredBy` NOT REGEXP '^[0-9]+$')";

// True when a stored invoice/receipt payload actually has content.
const hasDocumentData = (data) =>
    !!(data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).length > 0);

// Which of pekoInvoiceDetails' fields each recipient/docType pair reads, and what the
// generated PDF is labeled — mirrors what invoiceAndReceipt.js already stores/emails.
const DOCUMENT_SOURCES = {
    "subscriber:invoice": { path: ["corporate", "invoiceData"], label: "Invoice-on-Platform-Fee", templateType: "Invoice" },
    "subscriber:planInvoice": { path: ["corporate", "planInvoiceData"], label: "Invoice", templateType: "Invoice" },
    "subscriber:receipt": { path: ["corporate", "receiptData"], label: "Receipt", templateType: "Receipt" },
    "vendor:invoice": { path: ["vendor", "invoiceData"], label: "Vendor-Invoice", templateType: "Invoice" },
    "vendor:planInvoice": { path: ["vendor", "planInvoiceData"], label: "Copy-of-Invoice", templateType: "Invoice" },
};

// Parses the order's stored pekoInvoiceDetails (JSON column — normally already an
// object via Sequelize, but defensive against a raw string just in case) and reports
// which documents actually exist for each recipient, for the Order Journal table.
const getAvailableDocuments = (pekoInvoiceDetails) => {
    let details = pekoInvoiceDetails;
    if (typeof details === "string") {
        try {
            details = JSON.parse(details);
        } catch {
            details = {};
        }
    }
    details = details || {};
    return {
        subscriber: {
            invoice: hasDocumentData(details?.corporate?.invoiceData),
            planInvoice: hasDocumentData(details?.corporate?.planInvoiceData),
            receipt: hasDocumentData(details?.corporate?.receiptData),
        },
        vendor: {
            invoice: hasDocumentData(details?.vendor?.invoiceData),
            planInvoice: hasDocumentData(details?.vendor?.planInvoiceData),
        },
    };
};

// journalKey (how we persist it on the order) -> queue event type (how the worker
// dispatches it) — mirrors JOURNAL_TYPE_TO_HANDLER in sharedServices/utils/bull/worker/accountingEventsWorker.js.
const JOURNAL_KEY_TO_EVENT_TYPE = {
    transaction: "payment",
    refund: "refund",
    cashback: "cashbackCredit",
    cashbackReversal: "cashbackReversal",
    adminRefund: "adminRefund",
};
const VALID_JOURNAL_KEYS = new Set(Object.keys(JOURNAL_KEY_TO_EVENT_TYPE));

// Day-bounded IST window for the SQL, as strings in the connection timezone. With no go-live
// date the floor sits in year 10000, which no datetime literal can express, so that case is
// an empty window rather than a malformed one.
const istDayWindow = (fromStart, toValue) =>
    fromStart.getUTCFullYear() > 9999
        ? { from: "9999-12-31 00:00:00", to: "9999-12-31 23:59:59" }
        : dayBoundedRange(fromStart, toValue);

// Every date-filtered listing windows on the IST calendar day — the bucketing the dashboard
// cards use — so a day picked on screen means that day from 00:00:00 to 23:59:59 and a card's
// drill-down lists exactly the orders the card counted. A Date here would be formatted in the
// +05:30 connection timezone, and `new Date("2026-10-20")` is 05:30 IST, not midnight, which
// dropped the 00:01 renewal orders from "today". The default window is the last month, and an
// admin can type any `from`, but nothing reaches back before the portal started counting.
const resolveDateRange = async (from, to) => {
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setMonth(defaultFrom.getMonth() - 1);
    const requestedFrom = from ? new Date(`${String(from).slice(0, 10)}T00:00:00+05:30`) : defaultFrom;

    const floorStart = goLiveWindowStart(await loadAccountingFloor());
    const fromStart = requestedFrom > floorStart ? requestedFrom : floorStart;
    return istDayWindow(fromStart, to || now);
};

// The filters shared by the Order Journals table and its export, so both always show the same rows.
const resolveOrderJournalsQuery = async (req) => {
    let { from, to, searchText, sort, sortField, journalStatus, journalKey } = req.query;

    const sortDir = sort === "ASC" ? "ASC" : "DESC";
    const orderField = sortField || "transactionDate";

    searchText = searchText || "";

    // "any" is a second sentinel alongside the 5 real keys — used only by the dashboard's
    // Failed/Skipped Entries cards, whose counts sum across every key rather than one.
    const isAnyKey = journalKey === "any";
    const activeKey = !isAnyKey && VALID_JOURNAL_KEYS.has(journalKey) ? journalKey : "transaction";
    const usesEventDate = !isAnyKey && activeKey !== "transaction";

    const { from: fromDate, to: toDate } = await resolveDateRange(from, to);
    // journalDate is stored as a plain YYYY-MM-DD string, so an event-date comparison (single
    // key, or per-branch inside the "any key" clause below) needs the days, not the datetime
    // bounds transactionDate itself is compared against.
    const fromStr = fromDate.slice(0, 10);
    const toStr = toDate.slice(0, 10);
    const txnDateBetweenLiteral = `\`orders\`.\`transactionDate\` BETWEEN '${fromDate}' AND '${toDate}'`;

    const whereClause = {
        [Op.or]: [
            { corporateTxnId: { [Op.like]: `%${searchText}%` } },
            { "$credential.username$": { [Op.like]: `%${searchText}%` } },
            {
                "$serviceOperator.serviceProvider$": {
                    [Op.like]: `%${searchText}%`,
                },
            },
        ],
    };

    const andConditions = [];

    // notRecorded: no verdict and no skip marker — the journal never even ran for this key,
    // whether or not any computed amounts were stored on the order.
    const notSkippedLiteral = (key) =>
        `COALESCE(JSON_EXTRACT(\`orders\`.\`journalData\`, '$.${key}.skipped') = true, false) = false`;
    const singleKeyStatusLiteral = (key, status) => {
        if (status === "success") return `JSON_EXTRACT(\`orders\`.\`journalRecordStatus\`, '$.${key}') = true`;
        if (status === "failed") {
            return `${notSkippedLiteral(key)} AND JSON_EXTRACT(\`orders\`.\`journalRecordStatus\`, '$.${key}') = false`;
        }
        if (status === "skipped") return `JSON_EXTRACT(\`orders\`.\`journalData\`, '$.${key}.skipped') = true`;
        if (status === "notRecorded") {
            return `JSON_EXTRACT(\`orders\`.\`journalRecordStatus\`, '$.${key}') IS NULL AND ${notSkippedLiteral(key)}`;
        }
        return null;
    };

    const NO_EVENT_DATE_STATUSES = new Set(["skipped", "notRecorded"]);

    // "Never recorded" means something on its own only for the sale itself: a refund or cashback
    // key that never ran is the normal state until that event happens, and a failed payment has
    // no journal to record. So the not-recorded view, for any key or for Sales, is the dashboard
    // card's rule — a successful order whose transaction journal never ran — and lists exactly
    // the orders the card counted.
    const notRecordedSale = journalStatus === "notRecorded" && (isAnyKey || activeKey === "transaction");

    if (notRecordedSale) {
        whereClause.transactionDate = { [Op.between]: [fromDate, toDate] };
        whereClause.status = "SUCCESS";
        andConditions.push(Sequelize.literal(singleKeyStatusLiteral("transaction", "notRecorded")));
    } else if (isAnyKey && (journalStatus === "failed" || journalStatus === "skipped")) {
        const branches = Array.from(VALID_JOURNAL_KEYS).map((key) => {
            const dateCheck =
                NO_EVENT_DATE_STATUSES.has(journalStatus) || key === "transaction"
                    ? txnDateBetweenLiteral
                    : `JSON_UNQUOTE(JSON_EXTRACT(\`orders\`.\`journalData\`, '$.${key}.journalDate')) BETWEEN '${fromStr}' AND '${toStr}'`;
            return `(${singleKeyStatusLiteral(key, journalStatus)} AND ${dateCheck})`;
        });
        andConditions.push(Sequelize.literal(`(${branches.join(" OR ")})`));
    } else if (usesEventDate) {
        andConditions.push(
            Sequelize.literal(
                `JSON_UNQUOTE(JSON_EXTRACT(\`orders\`.\`journalData\`, '$.${activeKey}.journalDate')) BETWEEN '${fromStr}' AND '${toStr}'`
            )
        );
        const statusLiteral = singleKeyStatusLiteral(activeKey, journalStatus);
        if (statusLiteral) andConditions.push(Sequelize.literal(statusLiteral));
    } else {
        // The transaction key (explicit or default), or "any" with no failed/skipped/notRecorded
        // status — there's no single clean "any key, success" filter, so this just falls back to
        // the plain date range with no extra status condition in that one edge case.
        whereClause.transactionDate = { [Op.between]: [fromDate, toDate] };
        const statusLiteral = !isAnyKey ? singleKeyStatusLiteral(activeKey, journalStatus) : null;
        if (statusLiteral) andConditions.push(Sequelize.literal(statusLiteral));
    }

    const partnerScope = resolvePartnerScope(req);
    if (partnerScope.locked || /^\d+$/.test(String(partnerScope.partnerId ?? ""))) {
        whereClause["$credential.registeredBy$"] = String(partnerScope.partnerId);
    } else if (partnerScope.partnerId === "default") {
        andConditions.push(Sequelize.literal(PEKO_DIRECT_CUSTOMER));
    }

    if (andConditions.length === 1) {
        whereClause[Op.and] = andConditions[0];
    } else if (andConditions.length > 1) {
        whereClause[Op.and] = andConditions;
    }

    const orderSort =
        orderField === "corporateTxnId"
            ? [["corporateTxnId", sortDir]]
            : [["transactionDate", sortDir]];

    return {
        where: whereClause,
        order: orderSort,
        range: { from: fromDate, to: toDate },
        journalKey: isAnyKey || VALID_JOURNAL_KEYS.has(journalKey) ? journalKey : null,
        journalStatus: JOURNAL_STATUS_LABELS[journalStatus] ? journalStatus : null,
        searchText,
        partnerScope,
    };
};

// Reshape to preserve the existing API/FE contract (row.order.*, row.serviceOperator.*, etc.).
const toOrderJournalRow = (row) => {
    let rowServiceOperator = row.serviceOperator?.id
        ? row.serviceOperator
        : null;
    if (!rowServiceOperator) {
        let orderResp = {};
        try {
            orderResp = row.orderResponse
                ? JSON.parse(row.orderResponse)
                : {};
        } catch (_) {
            orderResp = {};
        }
        const subscriptionName =
            orderResp?.serviceName ||
            orderResp?.subscriptionDetails?.name ||
            null;
        if (subscriptionName) {
            rowServiceOperator = {
                id: null,
                serviceProvider: subscriptionName,
                serviceCategory: "Subscription",
            };
        }
    }
    return {
        id: row.id,
        transactionDate: row.transactionDate,
        corporateTxnId: row.corporateTxnId,
        transactionCategory: row.optional || null,
        credentialId: row.credentialId,
        serviceOperator: rowServiceOperator,
        credential: row.credential?.id ? row.credential : null,
        order: {
            id: row.id,
            corporateTxnId: row?.corporateTxnId || null,
            amountInINR: row?.amountInINR || null,
            surcharge: row?.surcharge || null,
            paymentMode: row?.paymentMode || null,
            paymentModeResponse: row?.paymentModeResponse || null,
            status: row?.status || null,
            journalRecordStatus: row?.journalRecordStatus || null,
            journalData: row?.journalData || null,
        },
        documents: getAvailableDocuments(row.pekoInvoiceDetails),
    };
};

exports.getOrderJournals = asyncHandler(async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.itemsPerPage ? parseInt(req.query.itemsPerPage) : 20;

    const { where, order } = await resolveOrderJournalsQuery(req);
    const result = await listOrderJournals({ where, order, limit, offset: (page - 1) * limit });

    return res.status(200).json({
        status: true,
        data: {
            result: result.rows.map(toOrderJournalRow),
            totalData: result.count,
        },
        message: "Fetched order journals successfully",
        responseCode: "000",
    });
});

// A numeric partner scope is shown by name; "default" is Peko's own customers.
const partnerLabelOf = async (partnerScope) => {
    const { partnerId } = partnerScope;
    if (partnerId === "default") return "Peko (Default)";
    if (!partnerScope.locked && !/^\d+$/.test(String(partnerId ?? ""))) return null;
    const partner = await findOneCredential({ id: partnerId }, ["id", "name"]);
    return partner?.name || String(partnerId);
};

exports.exportOrderJournals = asyncHandler(async (req, res, next) => {
    const { where, order, range, journalKey, journalStatus, searchText, partnerScope } =
        await resolveOrderJournalsQuery(req);
    const partnerLabel = await partnerLabelOf(partnerScope);

    return sendListExport({
        res,
        next,
        format: req.params.format,
        list: (paging) => listOrderJournals({ where, order, ...paging }),
        serialize: toOrderJournalRow,
        columns: orderJournalExportColumns(),
        title: "Order Journals",
        period: periodOf(range.from, req.query.to),
        subtitleOf: () => [
            journalKey ? `Journal: ${JOURNAL_LABELS[journalKey] || "Any"}` : null,
            journalStatus ? `Status: ${JOURNAL_STATUS_LABELS[journalStatus]}` : null,
            partnerLabel ? `Partner: ${partnerLabel}` : null,
            searchText ? `Search: "${searchText}"` : null,
        ],
    });
});

const VALID_PAYMENT_STATUSES = new Set(["SUCCESS", "FAILURE", "REFUNDED", "PENDING"]);

// A lighter sibling of getOrderJournals for the dashboard's Transaction Entries/Transactions
// Count/GMV cards — those three are about the PAYMENT itself (status = SUCCESS), not any
// journal-key's own recorded/failed/skipped state, so this filters by the order's own payment
// status instead and drops every journal-specific field the Order Journals table needs.
exports.getTransactions = asyncHandler(async (req, res) => {
    let { page, itemsPerPage, from, to, searchText, sort, sortField, status, accounts } = req.query;

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 20;
    const offset = (page - 1) * itemsPerPage;
    const limit = itemsPerPage;
    const sortDir = sort === "ASC" ? "ASC" : "DESC";
    const orderField = sortField || "transactionDate";

    searchText = searchText || "";

    const { from: fromDate, to: toDate } = await resolveDateRange(from, to);

    const whereClause = {
        transactionDate: { [Op.between]: [fromDate, toDate] },
        [Op.or]: [
            { corporateTxnId: { [Op.like]: `%${searchText}%` } },
            { "$credential.username$": { [Op.like]: `%${searchText}%` } },
            { "$credential.name$": { [Op.like]: `%${searchText}%` } },
            {
                "$serviceOperator.serviceProvider$": {
                    [Op.like]: `%${searchText}%`,
                },
            },
        ],
    };

    // Payment status filter — the order's own `status` column, not a journal key's status.
    if (VALID_PAYMENT_STATUSES.has(status)) {
        whereClause.status = status;
    }

    const accountIds = await resolveAccountIds(accounts);
    if (accountIds) whereClause.credentialId = { [Op.in]: accountIds };

    // LEFT joins (required: false) so subscription orders (serviceOperatorId = null) are kept.
    const includeOptions = [
        {
            model: serviceOperator,
            attributes: ["id", "serviceProvider", "serviceCategory"],
            required: false,
        },
        {
            model: credential,
            attributes: ["id", "name", "username", "email"],
            required: false,
        },
    ];

    const orderSort =
        orderField === "corporateTxnId"
            ? [["corporateTxnId", sortDir]]
            : [["transactionDate", sortDir]];

    // Joins with no selected columns — a bare SUM() next to a selected join column trips
    // sql_mode=only_full_group_by.
    const totalsIncludeOptions = includeOptions.map((include) => ({ ...include, attributes: [] }));

    const [result, totalsRow] = await Promise.all([
        orders.findAndCountAll({
            include: includeOptions,
            where: whereClause,
            order: orderSort,
            limit,
            offset,
            attributes: [
                "id",
                "corporateTxnId",
                "transactionDate",
                "amountInINR",
                "paymentMode",
                "paymentModeResponse",
                "status",
                "optional",
                "orderResponse",
                "credentialId",
                "serviceOperatorId",
                "pekoInvoiceDetails",
                [Sequelize.literal(gmvOfOrder("orders")), "gmv"],
                [Sequelize.literal(discountOfOrder("orders")), "discount"],
                [Sequelize.literal(netGmvOfOrder("orders")), "netGmv"],
                ...orderPostingAttributes(),
            ],
            raw: true,
            nest: true,
            subQuery: false,
        }),
        orders.findOne({
            include: totalsIncludeOptions,
            where: whereClause,
            attributes: [
                [Sequelize.fn("SUM", Sequelize.literal(gmvOfOrder("orders"))), "totalAmount"],
                [Sequelize.fn("SUM", Sequelize.literal(discountOfOrder("orders"))), "totalDiscount"],
                [Sequelize.fn("SUM", Sequelize.literal(netGmvOfOrder("orders"))), "totalNetGmv"],
            ],
            raw: true,
            subQuery: false,
        }),
    ]);

    // Reshape to the same {order-ish row} contract Order Journals uses, minus journal fields.
    const rows = result.rows.map((row) => {
        let rowServiceOperator = row.serviceOperator?.id ? row.serviceOperator : null;
        if (!rowServiceOperator) {
            let orderResp = {};
            try {
                orderResp = row.orderResponse ? JSON.parse(row.orderResponse) : {};
            } catch (_) {
                orderResp = {};
            }
            const subscriptionName =
                orderResp?.serviceName || orderResp?.subscriptionDetails?.name || null;
            if (subscriptionName) {
                rowServiceOperator = {
                    id: null,
                    serviceProvider: subscriptionName,
                    serviceCategory: "Subscription",
                };
            }
        }
        return {
            id: row.id,
            transactionDate: row.transactionDate,
            corporateTxnId: row.corporateTxnId,
            credentialId: row.credentialId,
            serviceOperator: rowServiceOperator,
            credential: row.credential?.id ? row.credential : null,
            order: {
                id: row.id,
                corporateTxnId: row?.corporateTxnId || null,
                amountInINR: row?.amountInINR || null,
                paymentMode: row?.paymentMode || null,
                paymentModeResponse: row?.paymentModeResponse || null,
                status: row?.status || null,
                gmv: Number(row?.gmv) || 0,
                discount: Number(row?.discount) || 0,
                netGmv: Number(row?.netGmv) || 0,
            },
            posting: orderPostingOfRow(row),
            documents: getAvailableDocuments(row.pekoInvoiceDetails),
        };
    });

    return res.status(200).json({
        status: true,
        data: {
            result: rows,
            totalData: result.count,
            totals: {
                count: result.count,
                totalAmount: Number(totalsRow?.totalAmount) || 0,
                totalDiscount: Number(totalsRow?.totalDiscount) || 0,
                totalNetGmv: Number(totalsRow?.totalNetGmv) || 0,
            },
        },
        message: "Fetched transactions successfully",
        responseCode: "000",
    });
});

const VALID_FEE_TYPES = new Set(["commission", "platformFee"]);

// The filters shared by the Fee Details table and its export, so both always show the same rows.
const resolveFeeDetailsQuery = async ({ from, to, searchText, feeType, vendorId, accounts }) => ({
    feeType: VALID_FEE_TYPES.has(feeType) ? feeType : "commission",
    range: await resolveDateRange(from, to),
    searchText: searchText || "",
    vendorId: vendorId ? parseInt(vendorId) : null,
    accountIds: await resolveAccountIds(accounts),
});

// Shared drill-down for the Commission and Platform Fee dashboard cards, switched by feeType.
exports.getFeeDetails = asyncHandler(async (req, res) => {
    let { page, itemsPerPage } = req.query;

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 20;
    const offset = (page - 1) * itemsPerPage;
    const limit = itemsPerPage;

    const query = await resolveFeeDetailsQuery(req.query);
    const result = await listFeeDetails({ ...query, limit, offset });

    const rows = result.rows.map((row) => {
        const { pekoInvoiceDetails, ...fee } = serializeFeeDetail(row, query.feeType);
        return { ...fee, documents: getAvailableDocuments(pekoInvoiceDetails) };
    });

    return res.status(200).json({
        status: true,
        data: {
            result: rows,
            totalData: result.count,
        },
        message: "Fetched fee details successfully",
        responseCode: "000",
    });
});

exports.exportFeeDetails = asyncHandler(async (req, res, next) => {
    const query = await resolveFeeDetailsQuery(req.query);

    return sendListExport({
        res,
        next,
        format: req.params.format,
        list: (paging) => listFeeDetails({ ...query, ...paging }),
        serialize: (row) => serializeFeeDetail(row, query.feeType),
        columns: feeExportColumns(query.feeType),
        title: `${FEE_LABELS[query.feeType]} Details`,
        period: periodOf(query.range.from, req.query.to),
        subtitleOf: (rows) => [
            query.vendorId ? `Vendor: ${rows[0].vendorName || query.vendorId}` : null,
            accountScopeLabel(query.accountIds),
            query.searchText ? `Search: "${query.searchText}"` : null,
        ],
    });
});

const VALID_BILLING_TYPES = new Set(["MONTHLY", "ANNUALLY"]);

// The filters shared by the Subscription Details table and its export.
const resolveSubscriptionDetailsQuery = async ({ from, to, searchText, partnerId, billingType, accounts }) => ({
    range: await resolveDateRange(from, to),
    searchText: searchText || "",
    partnerId: partnerId === "default" ? "default" : partnerId ? parseInt(partnerId) : null,
    billingType: VALID_BILLING_TYPES.has(billingType) ? billingType : null,
    accountIds: await resolveAccountIds(accounts),
});

// Shared drill-down for the Subscriptions / Subscriptions (Monthly) / Subscriptions
// (Annual) dashboard cards, switched by an optional billingType query param.
exports.getSubscriptionDetails = asyncHandler(async (req, res) => {
    let { page, itemsPerPage } = req.query;

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 20;
    const offset = (page - 1) * itemsPerPage;
    const limit = itemsPerPage;

    const query = await resolveSubscriptionDetailsQuery(req.query);
    const result = await listSubscriptionDetails({ ...query, limit, offset });

    const rows = result.rows.map((row) => {
        const { pekoInvoiceDetails, ...rest } = serializeSubscriptionDetail(row);
        return { ...rest, documents: getAvailableDocuments(pekoInvoiceDetails) };
    });

    return res.status(200).json({
        status: true,
        data: {
            result: rows,
            totalData: result.count,
        },
        message: "Fetched subscription details successfully",
        responseCode: "000",
    });
});

exports.exportSubscriptionDetails = asyncHandler(async (req, res, next) => {
    const query = await resolveSubscriptionDetailsQuery(req.query);
    const { partnerId, billingType, searchText } = query;

    return sendListExport({
        res,
        next,
        format: req.params.format,
        list: (paging) => listSubscriptionDetails({ ...query, ...paging }),
        serialize: (row) => serializeSubscriptionDetail(row),
        columns: subscriptionExportColumns(),
        title: "Subscription Details",
        period: periodOf(query.range.from, req.query.to),
        subtitleOf: (rows) => [
            partnerId === "default"
                ? `Partner: ${PEKO_DEFAULT_PARTNER}`
                : partnerId
                  ? `Partner: ${rows[0].partnerName || partnerId}`
                  : null,
            billingType ? `Billing: ${BILLING_LABELS[billingType]}` : null,
            accountScopeLabel(query.accountIds),
            searchText ? `Search: "${searchText}"` : null,
        ],
    });
});

exports.resolveJournalAccounts = asyncHandler(async (req, res, next) => {
    const { accountIds, corporateTxnId } = req.body;
    if (!Array.isArray(accountIds) || accountIds.length === 0) {
        return next(
            new ErrorResponse("accountIds (non-empty array) is required", 400)
        );
    }

    return res.status(200).json({
        status: true,
        data: await journalAccountNames(accountIds, corporateTxnId),
        message: "Resolved account names successfully",
        responseCode: "000",
    });
});

// An order from before the portal started accounting must not be posted into it, however it
// is reached. The listing hides them; this is the guard for anyone holding an old id.
const refuseIfBeforeGoLive = async corporateTxnId => {
    const accountingFloor = await loadAccountingFloor();
    const order = await orders.findOne({
        where: { corporateTxnId },
        attributes: ["transactionDate"],
        raw: true,
    });
    if (!order) return;

    if (isBeforeGoLive(new Date(order.transactionDate).toISOString(), accountingFloor)) {
        throw new ErrorResponse(
            `This order is dated before the accounting go-live date, so its journal cannot be posted from here`,
            400
        );
    }
};

// Shared by the single retry endpoint, the cascade, and "retry all failed".
const performJournalRetry = async (order, journalKey, options = {}) => {
    const { editedJournalData, amount, refundAmount, totalOrderAmount, source } = options;
    const corporateTxnId = order.corporateTxnId;

    await refuseIfBeforeGoLive(corporateTxnId);

    const eventType = JOURNAL_KEY_TO_EVENT_TYPE[journalKey];
    if (!eventType) {
        return {
            ok: false,
            reason: `Invalid journalKey '${journalKey}'. Expected one of: ${Object.keys(JOURNAL_KEY_TO_EVENT_TYPE).join(", ")}`,
        };
    }

    // Eligibility guards — only for the transaction journal. Retrying a refund/adminRefund on a
    // failed order is legitimate (that's how the money gets returned), so those are never blocked.
    if (journalKey === "transaction") {
        const orderStatus = String(order.status || "").toUpperCase();
        // A FAILURE order never delivered the service, so booking its transaction journal would
        // record revenue with nothing to offset it — UNLESS a refund was already recorded, in
        // which case the original entry is needed to complete the audit trail (booked, then reversed).
        const hasSuccessfulRefund =
            order.journalRecordStatus?.refund === true ||
            order.journalRecordStatus?.adminRefund === true;
        if (orderStatus === "FAILURE" && !hasSuccessfulRefund) {
            return {
                ok: false,
                reason: "This order failed — retrying its transaction journal is not allowed. Process a refund instead if money needs to be returned.",
            };
        }
        // A PENDING order's outcome isn't settled — nothing conclusive to journal yet.
        if (orderStatus === "PENDING") {
            return {
                ok: false,
                reason: "This order is still pending — retry once it has a final status.",
            };
        }
    }

    const context = await journalContextFor(order, journalKey, {
        editedJournalData,
        amount,
        refundAmount,
        totalOrderAmount,
    });
    if (!context.ok) {
        return context.held
            ? { ok: true, result: { success: false, skipped: true, reason: context.reason } }
            : { ok: false, reason: context.reason };
    }

    try {
        const result = await dispatchJournalRetry({
            transactionRef: corporateTxnId,
            type: eventType,
            contextSnapshot: context.contextSnapshot,
            reportData: context.reportData,
            amounts: context.amounts,
            occurredAt: new Date().toISOString(),
            sourceMs: source || "others-admin-retry",
        });

        if (result?.success && context.editedJournalData) {
            const current = await orders.findOne({
                where: { corporateTxnId },
                attributes: ["journalData"],
                raw: true,
            });
            await orders.update(
                { journalData: { ...(current?.journalData || {}), ...context.editedJournalData } },
                { where: { corporateTxnId } }
            );
        }

        // The worker already persisted the reason onto journalData[journalKey].reason — read it
        // back so the admin sees WHY, instead of a bare "not recorded" with no explanation.
        let failureReason = result?.reason || null;
        if (!result?.success && !failureReason) {
            const refreshed = await orders.findOne({
                where: { corporateTxnId },
                attributes: ["journalData"],
                raw: true,
            });
            failureReason =
                refreshed?.journalData?.[journalKey]?.reason || null;
        }

        return { ok: true, result: { ...result, reason: failureReason } };
    } catch (error) {
        const refreshed = await orders.findOne({
            where: { corporateTxnId },
            attributes: ["journalData"],
            raw: true,
        });
        const failureReason =
            refreshed?.journalData?.[journalKey]?.reason || error?.message || null;

        return { ok: true, result: { success: false, reason: failureReason } };
    }
};

// Admin retry — Mode A (recompute): admin edits the flat financial numbers, we merge
// those edits into the order's journalData and re-publish through the normal queue.
// A successful Transaction retry also cascades into Refund/Admin Refund if failed.
exports.retryJournal = asyncHandler(async (req, res, next) => {
    const { corporateTxnId, journalKey } = req.params;
    const { journalData: editedJournalData, amount, refundAmount, totalOrderAmount } =
        req.body || {};

    const order = await orders.findOne({ where: { corporateTxnId }, raw: true });
    if (!order) {
        return next(new ErrorResponse("Order not found", 404));
    }

    const outcome = await performJournalRetry(order, journalKey, {
        editedJournalData,
        amount,
        refundAmount,
        totalOrderAmount,
    });
    if (!outcome.ok) {
        return next(new ErrorResponse(outcome.reason, 400));
    }

    const { result } = outcome;
    const responseData = { ...result };

    if (journalKey === "transaction" && result?.success) {
        const refreshedOrder = await orders.findOne({ where: { corporateTxnId }, raw: true });
        const cascaded = await retryKeysConcurrently(refreshedOrder, ["refund", "adminRefund"], {
            source: "others-admin-retry-cascade",
        });
        if (Object.keys(cascaded).length) {
            responseData.cascaded = cascaded;
        }
    }

    return res.status(200).json({
        status: true,
        data: responseData,
        message: result?.success
            ? "Journal retried successfully"
            : responseData.reason || "Retry ran but the journal was not recorded",
        responseCode: "000",
    });
});

// Retries whichever of `keys` are currently marked Failed, all at once (each has its
// own lock/queue slot, so running them concurrently is safe) — cuts total wait time
// vs. one-by-one, since each retry is a full DB+queue+worker+provider round trip.
const retryKeysConcurrently = async (order, keys, options = {}) => {
    const toRetry = keys.filter((key) => order?.journalRecordStatus?.[key] === false);
    if (!toRetry.length) return {};

    const outcomes = await Promise.all(
        toRetry.map((key) => performJournalRetry(order, key, options))
    );
    const results = {};
    toRetry.forEach((key, i) => {
        const outcome = outcomes[i];
        results[key] = outcome.ok ? outcome.result : { success: false, reason: outcome.reason };
    });
    return results;
};

// Retries every journal type marked Failed for an order. Transaction goes first (Refund
// and Admin Refund depend on it); everything else in each stage runs concurrently.
exports.retryAllFailed = asyncHandler(async (req, res, next) => {
    const { corporateTxnId } = req.params;

    let order = await orders.findOne({ where: { corporateTxnId }, raw: true });
    if (!order) {
        return next(new ErrorResponse("Order not found", 404));
    }

    const options = { source: "others-admin-retry-all" };
    const stage1 = await retryKeysConcurrently(
        order,
        ["transaction", "cashback", "cashbackReversal"],
        options
    );

    if (stage1.transaction) {
        order = await orders.findOne({ where: { corporateTxnId }, raw: true });
    }
    const stage2 = await retryKeysConcurrently(order, ["refund", "adminRefund"], options);

    const results = { ...stage1, ...stage2 };
    const attempted = Object.keys(results).length;
    const succeeded = Object.values(results).filter((r) => r.success).length;

    return res.status(200).json({
        status: true,
        data: { results },
        message:
            attempted === 0
                ? "Nothing was marked failed for this order."
                : `${succeeded} of ${attempted} retried successfully.`,
        responseCode: "000",
    });
});

// Admin retry — Mode B (direct line items): admin edits the debit/credit line items
// themselves, we just re-post exactly that (balance-checked) to the accounting
// provider, bypassing the builder/recompute entirely. Mirrors Peko-AE's "edit line
// items directly, Save & Retry" flow.
exports.retryJournalLineItems = asyncHandler(async (req, res, next) => {
    const { corporateTxnId, journalKey } = req.params;
    const { lineItems } = req.body || {};

    await refuseIfBeforeGoLive(corporateTxnId);

    const eventType = JOURNAL_KEY_TO_EVENT_TYPE[journalKey];
    if (!eventType) {
        return next(
            new ErrorResponse(
                `Invalid journalKey '${journalKey}'. Expected one of: ${Object.keys(JOURNAL_KEY_TO_EVENT_TYPE).join(", ")}`,
                400
            )
        );
    }

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
        return next(new ErrorResponse("lineItems (non-empty array) is required", 400));
    }

    const totalDebits = lineItems.reduce(
        (sum, item) => sum + (item.direction === "debit" ? Number(item.amount) || 0 : 0),
        0
    );
    const totalCredits = lineItems.reduce(
        (sum, item) => sum + (item.direction === "credit" ? Number(item.amount) || 0 : 0),
        0
    );
    if (Math.abs(totalDebits - totalCredits) > 0.1) {
        return next(
            new ErrorResponse(
                `Line items are not balanced (debits ${totalDebits} vs credits ${totalCredits})`,
                400
            )
        );
    }

    const order = await orders.findOne({
        where: { corporateTxnId },
        attributes: ["id"],
        raw: true,
    });
    if (!order) {
        return next(new ErrorResponse("Order not found", 404));
    }

    try {
        const result = await dispatchJournalRetry({
            transactionRef: corporateTxnId,
            type: "directRepost",
            journalKey,
            lineItems,
            notesLabel: "Journal entry",
            occurredAt: new Date().toISOString(),
            sourceMs: "others-admin-retry",
        });

        let failureReason = result?.reason || result?.error || null;
        if (!result?.success && !failureReason) {
            const refreshed = await orders.findOne({
                where: { corporateTxnId },
                attributes: ["journalData"],
                raw: true,
            });
            failureReason =
                refreshed?.journalData?.[journalKey]?.reason || null;
        }

        return res.status(200).json({
            status: true,
            data: { ...result, reason: failureReason },
            message: result?.success
                ? "Journal re-posted successfully"
                : failureReason || "Retry ran but the journal was not recorded",
            responseCode: "000",
        });
    } catch (error) {
        const refreshed = await orders.findOne({
            where: { corporateTxnId },
            attributes: ["journalData"],
            raw: true,
        });
        const failureReason =
            refreshed?.journalData?.[journalKey]?.reason || error?.message || null;

        return res.status(200).json({
            status: true,
            data: { success: false, reason: failureReason },
            message: failureReason || "Journal retry failed",
            responseCode: "001",
        });
    }
});

// Regenerates one of the documents already stored on an order's pekoInvoiceDetails
// (whatever we actually sent at payment time — no retroactive generation, unlike the
// corporate-facing download endpoint) so admins can see exactly what the subscriber
// and the vendor each received. recipient: 'subscriber' | 'vendor'; docType is one of
// 'invoice' | 'planInvoice' | 'receipt' for subscriber, or 'invoice' (the commission
// invoice) | 'planInvoice' (the copy of the plan invoice) for vendor.
exports.downloadOrderDocument = asyncHandler(async (req, res, next) => {
    const { orderId, recipient, docType } = req.params;

    const sourceKey = `${recipient}:${docType}`;
    const source = DOCUMENT_SOURCES[sourceKey];
    if (!source) {
        return next(new ErrorResponse("Invalid recipient/document type", 400));
    }

    const order = await orders.findOne({
        where: { id: orderId },
        attributes: ["id", "pekoInvoiceDetails"],
        raw: true,
    });
    if (!order) {
        return next(new ErrorResponse("Order not found", 404));
    }

    let details = order.pekoInvoiceDetails;
    if (typeof details === "string") {
        try {
            details = JSON.parse(details);
        } catch {
            details = {};
        }
    }
    const [group, field] = source.path;
    const documentData = (details || {})?.[group]?.[field];

    if (!hasDocumentData(documentData)) {
        return res.status(404).json({
            status: false,
            message: "Document not available for this order.",
            data: {},
            responseCode: "003",
        });
    }

    const contentPdf = await generateInvoiceOrReceiptPdf(documentData, source.templateType, source.label);
    const pdfBuffer = contentPdf?.content;

    if (!isPdfBuffer(pdfBuffer)) {
        customLog(req?.LogTraceId, "error", {
            message: "downloadOrderDocument: could not produce a valid PDF",
            scope: "admin-order-journal-document",
            orderId,
            recipient,
            docType,
        });
        return res.status(500).json({
            status: false,
            message: "Could not generate a valid document, please try again later.",
            data: {},
            responseCode: "003",
        });
    }

    return res.status(200).json({
        status: true,
        message: `${source.label} generated successfully.`,
        data: { pdfBuffer },
        responseCode: "000",
    });
});
