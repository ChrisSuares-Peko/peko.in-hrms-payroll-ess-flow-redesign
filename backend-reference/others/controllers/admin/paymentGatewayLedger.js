const asyncHandler = require("../../middlewares/async");
const { istDay } = require("../../utils/istRange");
const ErrorResponse = require("../../utils/error-response");
const { openingBeforeGoLive } = require("../../models/use-cases/accountingPeriod");
const { dayBoundedRange } = require("../../utils/istRange");
const { uploadFileEncryptedToS3 } = require("../../utils/s3");
const { customLog } = require("../../utils/loggerHelper");
const {
    listGateways,
    findGatewayById,
    listGatewayOrders,
    serializeTransaction,
    getPaymentGatewayLedgerSummary,
    getPaymentGatewayLedgerSnapshot,
    serializeGateway,
    buildPaymentGatewayKpis,
} = require("../../models/use-cases/paymentGatewayLedger");
const {
    SETTLEMENT_MODES,
    ENTRY_KINDS,
    RECEIVED_TABLE_KINDS,
    serializeSettlement,
    listByGateway,
    createReceipt,
    createFee,
    createOpeningBalance,
    findOpeningBalance,
    reverseSettlement,
    updateSettlement,
    deleteSettlement,
    tagSettlementBooks,
    findFirstEntryDate,
} = require("../../models/use-cases/paymentGatewaySettlements");
const { earliestDate } = require("../../models/use-cases/ledgerEntryChanges");
const { LEDGER_AUDIT_TYPES } = require("../../utils/auditedModels");
const {
    answerLedgerChange,
    answerBooksTag,
    changeOf,
    withReversal,
} = require("../../utils/ledgerChangeResponse");
const {
    PAYMENT_GATEWAY_STATEMENT_CONVENTION,
    buildPaymentGatewayStatement,
    statementExcelRows,
} = require("../../models/use-cases/paymentGatewayStatement");
const {
    paymentGatewayTransactionExportColumns,
    paymentGatewayReceiptExportColumns,
    paymentGatewayFeeExportColumns,
    paymentGatewaySummaryTiles,
    paymentGatewaySummaryNote,
    gatewayTransactionFilterNotes,
    gatewayReceiptFilterNotes,
    gatewayFeeFilterNotes,
} = require("../../models/use-cases/paymentGatewayLedgerExport");
const { filterStatementRows, statementFilterLabel } = require("../../models/use-cases/vendorLedgerFilters");
const { periodOf, sendListExport } = require("../../utils/tableExport");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { renderPdf } = require("../../utils/puppeteerPool");
const { ledgerStatementTemplate } = require("../../utils/ledgerStatementTemplate");

const ok = (res, data, message) =>
    res.status(200).json({ status: true, data, message, responseCode: "000" });

const actorOf = req => ({ id: req.user && req.user.id, name: req.user && req.user.name });

const rangeOf = query => (query.from && query.to ? dayBoundedRange(query.from, query.to) : null);

const pageOf = query => ({
    limit: query.itemsPerPage,
    offset: (query.page - 1) * query.itemsPerPage,
});

const SLIP_FOLDER = "payment-gateway-ledger-slips";

const SETTLEMENT_PAGE_SIZE = 5;

const toNumber = value => Number(value) || 0;

const round2 = value => Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;

const dayOf = value =>
    value instanceof Date ? istDay(value) : String(value).slice(0, 10);

// The unique index lives on a generated column covering only live receipts, so a collision
// means this exact reference is already on file for this gateway and still counting.
const withoutDuplicates = async (create, message) => {
    try {
        return await create();
    } catch (error) {
        if (error && error.name === "SequelizeUniqueConstraintError") {
            throw new ErrorResponse(message, 409);
        }
        throw error;
    }
};

// An opening figure already contains everything up to its own date, so anything dated on or
// before it would be counted twice.
const refuseIfBeforeOpening = async (gatewayAccountId, date, label) => {
    const opening = await findOpeningBalance(gatewayAccountId);
    if (!opening) return;

    if (dayOf(date) <= dayOf(opening.entryDate)) {
        throw new ErrorResponse(
            `${label} must be dated after the opening balance of ${dayOf(opening.entryDate)}`,
            400
        );
    }
};

const slipOf = async (req, gatewayAccountId) => {
    const { slipBase64, slipName, slipFormat } = req.body;
    if (!slipBase64) return null;

    if (!slipFormat) throw new ErrorResponse("Slip file type could not be read", 400);

    const { NODE_ENV } = process.env;
    const user = req.user || {};
    const folder = `${NODE_ENV || "staging"}/system_user/${user.username || user.id}/${SLIP_FOLDER}/${gatewayAccountId}`;
    const base64 = String(slipBase64).replace(/^data:[^;]+;base64,/, "");

    const key = await uploadFileEncryptedToS3(base64, folder, slipFormat);
    customLog(req, "info", {
        message: "Payment gateway settlement slip uploaded",
        gatewayAccountId,
        key,
    });

    return { key, name: String(slipName || "slip").slice(0, 255), format: slipFormat };
};

const loadGateway = async gatewayAccountId => findGatewayById(gatewayAccountId);

const OPENING_LABEL = "Opening balance";

const ENTRY_CHANGES = {
    receipt: {
        entryKind: ENTRY_KINDS.receipt,
        noun: "Receipt",
        duplicate: reference => `A receipt with reference ${reference} is already recorded for this gateway`,
    },
    fee: {
        entryKind: ENTRY_KINDS.fee,
        noun: "Fee",
        duplicate: reference => `A fee with reference ${reference} is already recorded for this gateway`,
    },
};

const gatewayAudit = (gateway, labelOf) => ({
    configType: LEDGER_AUDIT_TYPES.gateway,
    partnerName: null,
    labelOf: row => `${gateway.gatewayName} › ${labelOf(row)}`,
});

const entryLabelOf = noun => row => `${noun} ${row.entryNumber || row.reference || ""}`.trim();

const refuseOpeningPastEntries = async (gatewayAccountId, openingId, asOfDate) => {
    const opening = await findOpeningBalance(gatewayAccountId);
    if (!opening || String(opening.id) !== String(openingId)) return;
    if (dayOf(asOfDate) <= dayOf(opening.entryDate)) return;

    const first = earliestDate([await findFirstEntryDate(gatewayAccountId)]);
    if (first && dayOf(asOfDate) >= first) {
        throw new ErrorResponse(
            `The opening balance must be dated before the first entry on this ledger, ${first}`,
            400
        );
    }
};

exports.listPaymentGatewayLedger = asyncHandler(async (req, res) => {
    const { page, itemsPerPage, searchText, sort, sortField, refresh } = req.query;

    const [snapshot, result] = await Promise.all([
        getPaymentGatewayLedgerSnapshot({ refresh }),
        listGateways({ ...pageOf(req.query), searchText, sort, sortField }),
    ]);

    const gateways = result.rows.map(row =>
        serializeGateway(row, snapshot.balances[row.gatewayAccountId])
    );

    return ok(
        res,
        {
            gateways,
            recordsTotal: result.count,
            page,
            itemsPerPage,
            kpis: buildPaymentGatewayKpis(snapshot),
            generatedAt: snapshot.generatedAt,
            cached: Boolean(snapshot.cached),
        },
        "Payment gateway ledger fetched successfully"
    );
});

exports.getPaymentGatewayLedger = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const summary = await getPaymentGatewayLedgerSummary(
        gateway.gatewayAccountId,
        rangeOf(req.query)
    );

    return ok(
        res,
        { gateway: serializeGateway(gateway, summary), summary },
        "Payment gateway fetched successfully"
    );
});

// The filters shared by each of the gateway's tables and its export, so both show the same rows.
const transactionArgs = (req, gateway) => ({
    gatewayAccountId: gateway.gatewayAccountId,
    range: rangeOf(req.query),
    searchText: req.query.searchText,
    status: req.query.status,
});

// The opening sits in the received table too: it is the position the receipts work down.
const receivedArgs = (gateway, range, { searchText, status, mode } = {}) => ({
    gatewayAccountId: gateway.gatewayAccountId,
    entryKind: RECEIVED_TABLE_KINDS,
    range,
    searchText,
    status,
    mode,
});

const feeArgs = (gateway, range, { searchText, status } = {}) => ({
    gatewayAccountId: gateway.gatewayAccountId,
    entryKind: ENTRY_KINDS.fee,
    range,
    searchText,
    status,
});

exports.listPaymentGatewayTransactions = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const [result, opening] = await Promise.all([
        listGatewayOrders({ ...transactionArgs(req, gateway), ...pageOf(req.query) }),
        findOpeningBalance(gateway.gatewayAccountId),
    ]);
    const openingAsOf = opening ? opening.entryDate : null;

    return ok(
        res,
        {
            // The older orders stay listed as history; the row says which side of the
            // opening it falls on so it never quietly disagrees with the card.
            entries: result.rows.map(row => serializeTransaction(row, openingAsOf)),
            openingBalanceAsOf: openingAsOf,
            recordsTotal: result.count,
            page: req.query.page,
            itemsPerPage: req.query.itemsPerPage,
        },
        "Payment gateway transactions fetched successfully"
    );
});

// Both tables in one call, each on its own five-row page, alongside the card above them.
exports.listPaymentGatewaySettlements = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const range = rangeOf(req.query);
    const receiptPage = toNumber(req.query.page) || 1;
    const feePage = toNumber(req.query.feePage) || 1;

    const paging = page => ({
        limit: SETTLEMENT_PAGE_SIZE,
        offset: (page - 1) * SETTLEMENT_PAGE_SIZE,
    });

    const { searchText, status, mode, feeSearchText, feeStatus } = req.query;

    const [receipts, fees, summary] = await Promise.all([
        listByGateway({
            ...receivedArgs(gateway, range, { searchText, status, mode }),
            ...paging(receiptPage),
        }),
        listByGateway({
            ...feeArgs(gateway, range, { searchText: feeSearchText, status: feeStatus }),
            ...paging(feePage),
        }),
        getPaymentGatewayLedgerSummary(gateway.gatewayAccountId, null),
    ]);

    return ok(
        res,
        {
            entries: receipts.rows.map(serializeSettlement),
            recordsTotal: receipts.count,
            feeEntries: fees.rows.map(serializeSettlement),
            feeRecordsTotal: fees.count,
            // The card above the tables: how much the gateway is still holding, over how
            // many transactions, and when it last settled.
            outstanding: summary.outstanding,
            collected: summary.collected,
            received: summary.received,
            fees: summary.fees,
            opening: summary.opening,
            transactionCount: summary.transactionCount,
            lastReceiptDate: summary.lastReceiptDate,
            lastReceiptAmount: summary.lastReceiptAmount,
            openingBalanceSet: summary.openingBalanceSet,
            openingBalanceAsOf: summary.openingBalanceAsOf,
            page: receiptPage,
            feePage,
            itemsPerPage: SETTLEMENT_PAGE_SIZE,
        },
        "Payment gateway settlements fetched successfully"
    );
});

const exportPeriodOf = query =>
    query.from && query.to ? periodOf(query.from, query.to) : "All dates";

// One table as an Excel or PDF file: every row its current filters match, not just a page.
const sendGatewayExport = async (req, res, next, gateway, { label, columns, ...rest }) =>
    sendListExport({
        res,
        next,
        format: req.params.format,
        columns: columns(),
        title: `${gateway.gatewayName} ${label}`,
        period: exportPeriodOf(req.query),
        subtitleOf: () => [],
        ...rest,
    });

exports.exportPaymentGatewayTransactions = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const range = rangeOf(req.query);
    const notes = gatewayTransactionFilterNotes(req.query);
    const opening = await findOpeningBalance(gateway.gatewayAccountId);
    const openingAsOf = opening ? opening.entryDate : null;

    // Only the PDF carries the figures the screen shows above the table.
    const summary =
        req.params.format === "pdf" && range
            ? await getPaymentGatewayLedgerSummary(gateway.gatewayAccountId, range)
            : null;

    return sendGatewayExport(req, res, next, gateway, {
        label: "Transactions",
        columns: paymentGatewayTransactionExportColumns,
        list: paging => listGatewayOrders({ ...transactionArgs(req, gateway), ...paging }),
        serialize: row => serializeTransaction(row, openingAsOf),
        summaryOf: summary ? () => paymentGatewaySummaryTiles(summary) : undefined,
        note: summary
            ? paymentGatewaySummaryNote(req.query, summary.openingBalanceSet, notes.some(Boolean))
            : undefined,
        subtitleOf: () => notes,
    });
});

const receivedFilterNotes = query => {
    const [status, search] = gatewayReceiptFilterNotes(query);
    return [status, SETTLEMENT_MODES.includes(query.mode) ? `Mode: ${query.mode}` : null, search];
};

exports.exportPaymentGatewayReceipts = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    return sendGatewayExport(req, res, next, gateway, {
        label: "Received",
        columns: paymentGatewayReceiptExportColumns,
        list: paging =>
            listByGateway({ ...receivedArgs(gateway, rangeOf(req.query), req.query), ...paging }),
        serialize: row => serializeSettlement(row),
        subtitleOf: () => receivedFilterNotes(req.query),
    });
});

exports.exportPaymentGatewayFees = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    return sendGatewayExport(req, res, next, gateway, {
        label: "Fees Charged",
        columns: paymentGatewayFeeExportColumns,
        list: paging =>
            listByGateway({ ...feeArgs(gateway, rangeOf(req.query), req.query), ...paging }),
        serialize: row => serializeSettlement(row),
        subtitleOf: () => gatewayFeeFilterNotes(req.query),
    });
});

exports.createPaymentGatewayOpeningBalance = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const refusal = await openingBeforeGoLive(req.body.asOfDate);
    if (refusal) return next(new ErrorResponse(refusal, 400));

    const slip = await slipOf(req, gateway.gatewayAccountId);
    const opening = await withoutDuplicates(
        () =>
            createOpeningBalance({
                gatewayAccountId: gateway.gatewayAccountId,
                ...req.body,
                slip,
                actor: actorOf(req),
            }),
        "An opening balance is already set for this gateway. Reverse it before recording a new one"
    );

    return res.status(201).json({
        status: true,
        data: serializeSettlement(opening),
        message: "Opening balance recorded successfully",
        responseCode: "000",
    });
});

exports.getPaymentGatewaySettlementSuggestion = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const summary = await getPaymentGatewayLedgerSummary(gateway.gatewayAccountId, null);

    return ok(
        res,
        {
            suggestedAmount: summary.outstanding,
            collected: summary.collected,
            received: summary.received,
            fees: summary.fees,
            transactionCount: summary.transactionCount,
            lastReceiptDate: summary.lastReceiptDate,
        },
        "Suggested settlement fetched successfully"
    );
});

exports.createPaymentGatewaySettlement = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    await refuseIfBeforeOpening(gateway.gatewayAccountId, req.body.entryDate, "A settlement");

    const slip = await slipOf(req, gateway.gatewayAccountId);
    const amount = round2(req.body.amount);

    const receipt = await withoutDuplicates(
        () =>
            createReceipt({
                gatewayAccountId: gateway.gatewayAccountId,
                amount,
                entryDate: req.body.entryDate,
                reference: req.body.reference,
                mode: req.body.mode,
                note: req.body.note,
                slip,
                actor: actorOf(req),
            }),
        `A settlement with reference ${req.body.reference} is already recorded for this gateway`
    );

    return res.status(201).json({
        status: true,
        data: { receipt: serializeSettlement(receipt) },
        message: "Settlement recorded successfully",
        responseCode: "000",
    });
});

exports.createPaymentGatewayFee = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    await refuseIfBeforeOpening(gateway.gatewayAccountId, req.body.entryDate, "A fee");

    const slip = await slipOf(req, gateway.gatewayAccountId);
    const amount = round2(req.body.amount);

    const fee = await withoutDuplicates(
        () =>
            createFee({
                gatewayAccountId: gateway.gatewayAccountId,
                amount,
                entryDate: req.body.entryDate,
                reference: req.body.reference,
                mode: req.body.mode,
                note: req.body.note,
                slip,
                actor: actorOf(req),
            }),
        `A fee with reference ${req.body.reference} is already recorded for this gateway`
    );

    return res.status(201).json({
        status: true,
        data: { fee: serializeSettlement(fee) },
        message: "Fee recorded successfully",
        responseCode: "000",
    });
});

exports.reversePaymentGatewayFee = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const reversals = await reverseSettlement({
        id: req.params.id,
        gatewayAccountId: gateway.gatewayAccountId,
        reason: req.body.reason,
        actor: actorOf(req),
    });
    if (!reversals || !reversals.length) {
        return next(new ErrorResponse("Fee not found or already reversed", 404));
    }

    return ok(res, reversals.map(serializeSettlement), "Fee reversed successfully");
});

exports.reversePaymentGatewaySettlement = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const reversals = await reverseSettlement({
        id: req.params.id,
        gatewayAccountId: gateway.gatewayAccountId,
        reason: req.body.reason,
        actor: actorOf(req),
    });
    if (!reversals || !reversals.length) {
        return next(new ErrorResponse("Settlement not found or already reversed", 404));
    }

    return ok(res, reversals.map(serializeSettlement), "Settlement reversed successfully");
});

const updateGatewayEntry = async (req, res, next, { entryKind, noun, duplicate }) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const { changeReason, values } = changeOf(req.body);
    await refuseIfBeforeOpening(gateway.gatewayAccountId, values.entryDate, `A ${noun.toLowerCase()}`);

    const slip = await slipOf(req, gateway.gatewayAccountId);
    const result = await withoutDuplicates(
        () =>
            updateSettlement({
                id: req.params.id,
                gatewayAccountId: gateway.gatewayAccountId,
                entryKind,
                values: { ...values, amount: round2(values.amount) },
                slip,
                actor: actorOf(req),
                changeReason,
                audit: gatewayAudit(gateway, entryLabelOf(noun)),
            }),
        duplicate(values.reference)
    );

    return answerLedgerChange(res, next, result, {
        noun,
        verb: "updated",
        serialize: serializeSettlement,
    });
};

const deleteGatewayEntry = async (req, res, next, { entryKind, noun }) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const result = await deleteSettlement({
        id: req.params.id,
        gatewayAccountId: gateway.gatewayAccountId,
        entryKind,
        actor: actorOf(req),
        changeReason: req.body.reason,
        audit: gatewayAudit(gateway, noun === OPENING_LABEL ? () => OPENING_LABEL : entryLabelOf(noun)),
    });

    return answerLedgerChange(res, next, result, {
        noun,
        verb: "deleted",
        serialize: serializeSettlement,
    });
};

exports.updatePaymentGatewaySettlement = asyncHandler((req, res, next) =>
    updateGatewayEntry(req, res, next, ENTRY_CHANGES.receipt)
);

exports.deletePaymentGatewaySettlement = asyncHandler((req, res, next) =>
    deleteGatewayEntry(req, res, next, ENTRY_CHANGES.receipt)
);

exports.updatePaymentGatewayFee = asyncHandler((req, res, next) =>
    updateGatewayEntry(req, res, next, ENTRY_CHANGES.fee)
);

exports.deletePaymentGatewayFee = asyncHandler((req, res, next) =>
    deleteGatewayEntry(req, res, next, ENTRY_CHANGES.fee)
);

const settlementRowLabel = row => {
    if (row.entryKind === ENTRY_KINDS.opening) return OPENING_LABEL;
    const noun = row.entryKind === ENTRY_KINDS.fee ? "Fee" : "Receipt";
    return withReversal(row, entryLabelOf(noun)(row));
};

const tagGatewayEntryBooks = async (req, res, next, { entryKinds, noun }) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const result = await tagSettlementBooks({
        id: req.params.id,
        gatewayAccountId: gateway.gatewayAccountId,
        entryKinds,
        synced: req.body.synced,
        actor: actorOf(req),
        audit: gatewayAudit(gateway, settlementRowLabel),
    });

    return answerBooksTag(res, next, result, { noun, serialize: serializeSettlement });
};

exports.tagPaymentGatewaySettlementBooks = asyncHandler((req, res, next) =>
    tagGatewayEntryBooks(req, res, next, { entryKinds: RECEIVED_TABLE_KINDS, noun: "Entry" })
);

exports.tagPaymentGatewayFeeBooks = asyncHandler((req, res, next) =>
    tagGatewayEntryBooks(req, res, next, { entryKinds: [ENTRY_KINDS.fee], noun: "Fee" })
);

exports.updatePaymentGatewayOpeningBalance = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const refusal = await openingBeforeGoLive(req.body.asOfDate);
    if (refusal) return next(new ErrorResponse(refusal, 400));
    await refuseOpeningPastEntries(gateway.gatewayAccountId, req.params.id, req.body.asOfDate);

    const { changeReason, values } = changeOf(req.body);
    const slip = await slipOf(req, gateway.gatewayAccountId);
    const result = await updateSettlement({
        id: req.params.id,
        gatewayAccountId: gateway.gatewayAccountId,
        entryKind: ENTRY_KINDS.opening,
        values: { amount: values.amount, entryDate: values.asOfDate, note: values.note },
        slip,
        actor: actorOf(req),
        changeReason,
        audit: gatewayAudit(gateway, () => OPENING_LABEL),
    });

    return answerLedgerChange(res, next, result, {
        noun: OPENING_LABEL,
        verb: "updated",
        serialize: serializeSettlement,
    });
});

exports.deletePaymentGatewayOpeningBalance = asyncHandler((req, res, next) =>
    deleteGatewayEntry(req, res, next, { entryKind: ENTRY_KINDS.opening, noun: OPENING_LABEL })
);

const loadStatement = async (req, gateway) =>
    buildPaymentGatewayStatement({
        gatewayAccountId: gateway.gatewayAccountId,
        range: rangeOf(req.query),
    });

// The figures and the running balance stay those of the whole period; only the lines listed
// are narrowed.
const statementFilters = req => ({ searchText: req.query.searchText, side: req.query.side });

exports.getPaymentGatewayStatement = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const statement = await loadStatement(req, gateway);
    const rows = filterStatementRows(statement.rows, statementFilters(req));
    const { page, itemsPerPage } = req.query;
    const { offset, limit } = pageOf(req.query);

    return ok(
        res,
        {
            gatewayName: gateway.gatewayName,
            openingBalance: statement.openingBalance,
            totalDebit: statement.totalDebit,
            totalCredit: statement.totalCredit,
            closingBalance: statement.closingBalance,
            entries: rows.slice(offset, offset + limit),
            recordsTotal: rows.length,
            truncated: statement.truncated,
            page,
            itemsPerPage,
        },
        "Payment gateway statement fetched successfully"
    );
});

const statementFileName = (gatewayName, range, extension) => {
    const safe = String(gatewayName || "gateway").replace(/[/\\:*?"<>|]/g, "-");
    const period = range ? `${dayOf(range.from)}_to_${dayOf(range.to)}` : "all";
    return `${safe} statement ${period}.${extension}`;
};

exports.exportPaymentGatewayStatement = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const statement = await loadStatement(req, gateway);
    const range = rangeOf(req.query);
    const filterLabel = statementFilterLabel(statementFilters(req));
    const rows = filterStatementRows(statement.rows, statementFilters(req));
    if (filterLabel && !rows.length) {
        return next(new ErrorResponse("No data is available for export", 404));
    }

    // A filtered sheet lists only its matching lines: the opening and closing lines carry the
    // whole period's figures, which would not add up beside them.
    const { buffer, fileType } = await generateExcelBufferAndType(
        statementExcelRows({ ...statement, rows }, gateway.gatewayName, "Gateway", {
            markers: !filterLabel,
        }),
        "excel"
    );

    res.setHeader("Content-Type", fileType);
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${statementFileName(gateway.gatewayName, range, "xlsx")}"`
    );
    return res.status(200).send(Buffer.from(buffer));
});

exports.exportPaymentGatewayStatementPdf = asyncHandler(async (req, res, next) => {
    const gateway = await loadGateway(req.params.gatewayId);
    if (!gateway) return next(new ErrorResponse("Payment gateway not found", 404));

    const statement = await loadStatement(req, gateway);
    const range = rangeOf(req.query);
    const filterLabel = statementFilterLabel(statementFilters(req));
    const rows = filterStatementRows(statement.rows, statementFilters(req));
    if (filterLabel && !rows.length) {
        return next(new ErrorResponse("No data is available for export", 404));
    }

    const html = ledgerStatementTemplate({
        partyName: gateway.gatewayName,
        range,
        statement: { ...statement, rows },
        convention: PAYMENT_GATEWAY_STATEMENT_CONVENTION,
        filterLabel,
    });

    const pdf = await renderPdf(html);
    if (!pdf || !pdf.length) {
        return next(new ErrorResponse("Could not render the statement", 503));
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${statementFileName(gateway.gatewayName, range, "pdf")}"`
    );
    return res.status(200).send(pdf);
});
