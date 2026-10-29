const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { dayBoundedRange } = require("../../utils/istRange");
const {
    listSubscribers,
    findSubscriberByCredentialId,
    getSubscriberLedgerSummary,
    getSubscriberLedgerSnapshot,
    subscriberDisplayName,
    serializeSubscriber,
    listSubscriberOrders,
    listSubscriberBills,
    findSubscriberOrderDocument,
    SUBSCRIBER_ORDER_DOCUMENTS,
    serializeTransaction,
    serializeBill,
} = require("../../models/use-cases/subscriberLedger");
const {
    listWalletMovements,
    serializeWalletMovement,
} = require("../../models/use-cases/subscriberWallet");
const {
    subscriberTransactionExportColumns,
    subscriberWalletExportColumns,
    subscriberBillExportColumns,
    subscriberSummaryTiles,
    subscriberSummaryNote,
    transactionFilterNotes,
    walletFilterNotes,
    billFilterNotes,
} = require("../../models/use-cases/subscriberLedgerExport");
const { periodOf, sendListExport } = require("../../utils/tableExport");
const { generateInvoiceOrReceiptPdf } = require("../../utils/pekoRecieptHelper");
const { isPdfBuffer } = require("../../utils/pdfHelper");

const NOT_FOUND = "Subscriber not found";

const UNSAFE_FILE_CHARACTERS = /[/\\:*?"<>|]/g;

const ok = (res, data, message) =>
    res.status(200).json({ status: true, data, message, responseCode: "000" });

const rangeOf = query =>
    query.from && query.to ? dayBoundedRange(query.from, query.to) : null;

const pageOf = query => ({
    limit: query.itemsPerPage,
    offset: (query.page - 1) * query.itemsPerPage,
});

const credentialIdOf = req => {
    const id = Number(req.params.credentialId);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const loadSubscriber = async req => {
    const credentialId = credentialIdOf(req);
    return credentialId ? findSubscriberByCredentialId(credentialId) : null;
};

const tabArgs = (req, subscriber) => ({
    credentialId: subscriber.credentialId,
    range: rangeOf(req.query),
    searchText: req.query.searchText,
    status: req.query.status,
    type: req.query.type,
    side: req.query.side,
    ...pageOf(req.query),
});

const paged = (req, result, serialize) => ({
    entries: result.rows.map(serialize),
    recordsTotal: result.count,
    page: req.query.page,
    itemsPerPage: req.query.itemsPerPage,
});

exports.listSubscriberLedger = asyncHandler(async (req, res) => {
    const { page, itemsPerPage, searchText, sort, sortField, partnerId, refresh } = req.query;

    const [snapshot, result] = await Promise.all([
        getSubscriberLedgerSnapshot({ refresh }),
        listSubscribers({ ...pageOf(req.query), searchText, sort, sortField, partnerId }),
    ]);

    return ok(
        res,
        {
            subscribers: result.rows.map(row => serializeSubscriber(row)),
            recordsTotal: result.count,
            page,
            itemsPerPage,
            kpis: snapshot.kpis,
            generatedAt: snapshot.generatedAt,
            cached: Boolean(snapshot.cached),
        },
        "Subscriber ledger fetched successfully"
    );
});

exports.getSubscriberLedger = asyncHandler(async (req, res, next) => {
    const subscriber = await loadSubscriber(req);
    if (!subscriber) return next(new ErrorResponse(NOT_FOUND, 404));

    const summary = await getSubscriberLedgerSummary(subscriber, rangeOf(req.query));

    return ok(
        res,
        { subscriber: serializeSubscriber(subscriber, summary), summary },
        "Subscriber fetched successfully"
    );
});

exports.listSubscriberTransactions = asyncHandler(async (req, res, next) => {
    const subscriber = await loadSubscriber(req);
    if (!subscriber) return next(new ErrorResponse(NOT_FOUND, 404));

    const result = await listSubscriberOrders(tabArgs(req, subscriber));

    return ok(res, paged(req, result, serializeTransaction), "Subscriber transactions fetched successfully");
});

exports.listSubscriberWallet = asyncHandler(async (req, res, next) => {
    const subscriber = await loadSubscriber(req);
    if (!subscriber) return next(new ErrorResponse(NOT_FOUND, 404));

    const result = await listWalletMovements(tabArgs(req, subscriber));

    return ok(res, paged(req, result, serializeWalletMovement), "Subscriber wallet entries fetched successfully");
});

exports.listSubscriberBills = asyncHandler(async (req, res, next) => {
    const subscriber = await loadSubscriber(req);
    if (!subscriber) return next(new ErrorResponse(NOT_FOUND, 404));

    const result = await listSubscriberBills(tabArgs(req, subscriber));

    return ok(res, paged(req, result, serializeBill), "Subscriber bills fetched successfully");
});

const subscriberName = subscriber => subscriberDisplayName(subscriber);

const exportPeriodOf = query =>
    query.from && query.to ? periodOf(query.from, query.to) : "All dates";

// One tab's table as an Excel or PDF file: every row its current filters match, not just a page.
// Only the Transactions PDF carries the figures its screen shows above the table.
const exportSubscriberTab = ({ label, columns, list, serialize, filterNotes, withSummary }) =>
    asyncHandler(async (req, res, next) => {
        const subscriber = await loadSubscriber(req);
        if (!subscriber) return next(new ErrorResponse(NOT_FOUND, 404));

        const args = tabArgs(req, subscriber);
        const notes = filterNotes(args);
        const summary =
            withSummary && req.params.format === "pdf" && args.range
                ? await getSubscriberLedgerSummary(subscriber, args.range)
                : null;

        return sendListExport({
            res,
            next,
            format: req.params.format,
            list: paging => list({ ...args, ...paging }),
            serialize: row => serialize(row),
            columns: columns(),
            summaryOf: summary ? () => subscriberSummaryTiles(summary) : undefined,
            note: summary ? subscriberSummaryNote(req.query, summary, notes.some(Boolean)) : undefined,
            title: `${subscriberName(subscriber)} ${label}`,
            period: exportPeriodOf(req.query),
            subtitleOf: () => notes,
        });
    });

exports.exportSubscriberTransactions = exportSubscriberTab({
    label: "Transactions",
    columns: subscriberTransactionExportColumns,
    list: listSubscriberOrders,
    serialize: serializeTransaction,
    filterNotes: transactionFilterNotes,
    withSummary: true,
});

exports.exportSubscriberWallet = exportSubscriberTab({
    label: "Cashbacks & Rewards",
    columns: subscriberWalletExportColumns,
    list: listWalletMovements,
    serialize: serializeWalletMovement,
    filterNotes: walletFilterNotes,
    withSummary: false,
});

exports.exportSubscriberBills = exportSubscriberTab({
    label: "Bills",
    columns: subscriberBillExportColumns,
    list: listSubscriberBills,
    serialize: serializeBill,
    filterNotes: billFilterNotes,
    withSummary: false,
});

const streamOrderDocument = kind =>
    asyncHandler(async (req, res, next) => {
        const subscriber = await loadSubscriber(req);
        if (!subscriber) return next(new ErrorResponse(NOT_FOUND, 404));

        const { name } = SUBSCRIBER_ORDER_DOCUMENTS[kind];
        const document = await findSubscriberOrderDocument({
            credentialId: subscriber.credentialId,
            orderId: req.params.orderId,
            kind,
        });
        if (!document) {
            return next(new ErrorResponse(`No ${name} was issued for this order`, 404));
        }

        const { content } = await generateInvoiceOrReceiptPdf(document.data, document.type, document.label);
        if (!isPdfBuffer(content)) {
            return next(new ErrorResponse(`Could not render the ${name}`, 503));
        }

        const reference = String(document.corporateTxnId || req.params.orderId).replace(UNSAFE_FILE_CHARACTERS, "-");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${document.label}-${reference}.pdf"`);
        return res.status(200).send(content);
    });

exports.downloadSubscriberReceipt = streamOrderDocument("receipt");

exports.downloadSubscriberFullInvoice = streamOrderDocument("fullInvoice");

exports.downloadSubscriberPekoInvoice = streamOrderDocument("pekoInvoice");
