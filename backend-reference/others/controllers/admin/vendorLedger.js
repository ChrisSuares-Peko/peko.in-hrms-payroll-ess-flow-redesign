const asyncHandler = require("../../middlewares/async");
const { istDay } = require("../../utils/istRange");
const ErrorResponse = require("../../utils/error-response");
const { openingBeforeGoLive } = require("../../models/use-cases/accountingPeriod");
const { dayBoundedRange } = require("../../utils/istRange");
const { uploadFileEncryptedToS3 } = require("../../utils/s3");
const { customLog } = require("../../utils/loggerHelper");
const {
    getLowBalanceThreshold,
    listVendorsWithServices,
    findVendorById,
    getVendorDepositAccounts,
    accountIdsForVendor,
    ledgerAccountIdsForVendor,
    listVendorOrders,
    listVendorCommissions: listCommissionRows,
    listCommissionReversals,
    serializeTransaction,
    serializeCommission,
    getVendorLedgerSummary,
    getVendorLedgerSnapshot,
    serializeVendor,
    buildVendorKpis,
} = require("../../models/use-cases/vendorLedger");
const {
    serializeDeposit,
    DEPOSIT_MODES,
    ENTRY_TYPES: DEPOSIT_ENTRY_TYPES,
    listByVendor: listDeposits,
    findOpeningBalance,
    createDeposit,
    createOpeningBalance,
    reverseDeposit,
    updateDeposit,
    deleteDeposit,
    tagDepositBooks,
    findFirstEntryDate: findFirstDepositDate,
} = require("../../models/use-cases/vendorDeposits");
const {
    ENTRY_KINDS,
    serializeEntry,
    listAllByVendor: listManualEntries,
    createEntry,
    reverseEntry,
    updateEntry,
    deleteEntry,
    tagEntryBooks,
    findFirstEntryDate: findFirstManualEntryDate,
    findEntry: findManualEntry,
} = require("../../models/use-cases/vendorLedgerEntries");
const { loadGstRate, splitEntryAmount } = require("../../models/use-cases/ledgerGst");
const { earliestDate } = require("../../models/use-cases/ledgerEntryChanges");
const { LEDGER_AUDIT_TYPES } = require("../../utils/auditedModels");
const {
    answerLedgerChange,
    answerBooksTag,
    changeOf,
    withReversal,
} = require("../../utils/ledgerChangeResponse");
const {
    orderInvoiceDocument,
    orderCreditNoteDocument,
    manualEntryDocument,
    documentFileName,
} = require("../../models/use-cases/vendorTaxDocuments");
const {
    buildVendorStatement,
    statementExcelRows,
} = require("../../models/use-cases/vendorStatement");
const {
    vendorTransactionExportColumns,
    vendorCommissionExportColumns,
    vendorDepositExportColumns,
    vendorCreditNoteExportColumns,
    vendorCostOfSalesExportColumns,
    vendorDebitNoteExportColumns,
    vendorSummaryTiles,
    vendorSummaryNote,
    VENDOR_ORDER_STATUS_LABELS,
    VENDOR_COMMISSION_STATUS_LABELS,
    VENDOR_DEPOSIT_STATUS_LABELS,
    VENDOR_CREDIT_NOTE_STATUS_LABELS,
    VENDOR_COST_OF_SALES_STATUS_LABELS,
    VENDOR_DEBIT_NOTE_STATUS_LABELS,
} = require("../../models/use-cases/vendorLedgerExport");
const {
    filterCreditNotes,
    filterStatementRows,
    statementFilterLabel,
} = require("../../models/use-cases/vendorLedgerFilters");
const { periodOf, sendListExport } = require("../../utils/tableExport");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { renderPdf } = require("../../utils/puppeteerPool");
const { vendorStatementTemplate } = require("../../utils/vendorStatementTemplate");
const { taxInvoiceTemplate } = require("../../utils/invoiceTemplate");
const { isPdfBuffer } = require("../../utils/pdfHelper");

const ok = (res, data, message) =>
    res.status(200).json({ status: true, data, message, responseCode: "000" });

const actorOf = req => ({ id: req.user && req.user.id, name: req.user && req.user.name });

const rangeOf = query =>
    query.from && query.to ? dayBoundedRange(query.from, query.to) : null;

const pageOf = query => ({
    limit: query.itemsPerPage,
    offset: (query.page - 1) * query.itemsPerPage,
});

const SLIP_FOLDER = "vendor-ledger-slips";

const dayOf = value =>
    value instanceof Date ? istDay(value) : String(value).slice(0, 10);

// An opening figure already contains everything up to its own date, so anything dated on
// or before it would be counted twice.
const refuseIfBeforeOpening = async (vendorId, date, label) => {
    const opening = await findOpeningBalance(vendorId);
    if (!opening) return;

    if (dayOf(date) <= dayOf(opening.depositDate)) {
        throw new ErrorResponse(
            `${label} must be dated after the opening balance of ${dayOf(opening.depositDate)}`,
            400
        );
    }
};

// The unique index lives on a generated column covering only live rows, so a collision
// means this exact reference is already on file for this vendor and still counting.
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

const slipOf = async (req, vendorId) => {
    const { slipBase64, slipName, slipFormat } = req.body;
    if (!slipBase64) return null;

    if (!slipFormat) throw new ErrorResponse("Slip file type could not be read", 400);

    const { NODE_ENV } = process.env;
    const user = req.user || {};
    const folder = `${NODE_ENV || "staging"}/system_user/${user.username || user.id}/${SLIP_FOLDER}/${vendorId}`;
    const base64 = String(slipBase64).replace(/^data:[^;]+;base64,/, "");

    const key = await uploadFileEncryptedToS3(base64, folder, slipFormat);
    customLog(req, "info", { message: "Vendor ledger slip uploaded", vendorId, key });

    return { key, name: String(slipName || "slip").slice(0, 255), format: slipFormat };
};

const OPENING_LABEL = "Opening balance";

const depositLabel = row => `Deposit ${row.entryNumber || row.reference || ""}`.trim();

const vendorAudit = (loaded, labelOf) => ({
    configType: LEDGER_AUDIT_TYPES.vendor,
    partnerName: null,
    labelOf: row => `${loaded.row.vendorName} › ${labelOf(row)}`,
});

const refuseOpeningPastEntries = async (vendorId, openingId, asOfDate) => {
    const opening = await findOpeningBalance(vendorId);
    if (!opening || String(opening.id) !== String(openingId)) return;
    if (dayOf(asOfDate) <= dayOf(opening.depositDate)) return;

    const first = earliestDate([
        await findFirstDepositDate(vendorId),
        await findFirstManualEntryDate(vendorId),
    ]);
    if (first && dayOf(asOfDate) >= first) {
        throw new ErrorResponse(
            `The opening balance must be dated before the first entry on this ledger, ${first}`,
            400
        );
    }
};

const loadVendor = async vendorId => {
    const row = await findVendorById(vendorId);
    if (!row) return null;
    const accounts = await getVendorDepositAccounts();
    return {
        row,
        accountIds: accountIdsForVendor(accounts, row.id),
        ledgerAccountIds: ledgerAccountIdsForVendor(accounts, row.id),
        sharedAccountId: accounts.sharedAccountId,
    };
};

exports.listVendorLedger = asyncHandler(async (req, res) => {
    const { page, itemsPerPage, searchText, sort, sortField, refresh } = req.query;

    const [threshold, snapshot, result] = await Promise.all([
        getLowBalanceThreshold(),
        getVendorLedgerSnapshot({ refresh }),
        listVendorsWithServices({ ...pageOf(req.query), searchText, sort, sortField }),
    ]);

    const vendors = result.rows.map(row =>
        serializeVendor(row, snapshot.balances[row.id], threshold)
    );

    return ok(
        res,
        {
            vendors,
            recordsTotal: result.count,
            page,
            itemsPerPage,
            kpis: buildVendorKpis(snapshot, threshold),
            vendorDepositsAccountConfigured: Boolean(snapshot.vendorDepositsAccountConfigured),
            generatedAt: snapshot.generatedAt,
            cached: Boolean(snapshot.cached),
        },
        "Vendor ledger fetched successfully"
    );
});

exports.getVendorLedger = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const [threshold, summary, gstRate] = await Promise.all([
        getLowBalanceThreshold(),
        getVendorLedgerSummary(
            loaded.row,
            loaded.accountIds,
            rangeOf(req.query),
            loaded.ledgerAccountIds
        ),
        loadGstRate(),
    ]);

    return ok(
        res,
        {
            vendor: serializeVendor(loaded.row, summary, threshold),
            summary,
            vendorDepositsAccountConfigured: Boolean(loaded.sharedAccountId),
            gstRate,
        },
        "Vendor fetched successfully"
    );
});

// The filters shared by the Transactions table and its export, so both show the same rows.
const transactionArgs = (req, loaded) => ({
    vendorId: loaded.row.id,
    ledgerAccountIds: loaded.ledgerAccountIds,
    range: rangeOf(req.query),
    searchText: req.query.searchText,
    status: req.query.status,
});

exports.listVendorTransactions = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const result = await listVendorOrders({ ...transactionArgs(req, loaded), ...pageOf(req.query) });

    return ok(
        res,
        {
            entries: result.rows.map(serializeTransaction),
            recordsTotal: result.count,
            page: req.query.page,
            itemsPerPage: req.query.itemsPerPage,
        },
        "Vendor transactions fetched successfully"
    );
});

// The filters shared by the Commissions table and its export, so both show the same rows.
const commissionArgs = (req, loaded) => ({
    vendorId: loaded.row.id,
    accountIds: loaded.accountIds,
    ledgerAccountIds: loaded.ledgerAccountIds,
    range: rangeOf(req.query),
    searchText: req.query.searchText,
    status: req.query.status,
});

exports.listVendorCommissions = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const result = await listCommissionRows({ ...commissionArgs(req, loaded), ...pageOf(req.query) });

    return ok(
        res,
        {
            entries: result.rows.map(serializeCommission),
            recordsTotal: result.count,
            page: req.query.page,
            itemsPerPage: req.query.itemsPerPage,
        },
        "Vendor commissions fetched successfully"
    );
});

const exportPeriodOf = query =>
    query.from && query.to ? periodOf(query.from, query.to) : "All dates";

exports.exportVendorTransactions = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const filters = transactionArgs(req, loaded);
    const { range, searchText, status } = filters;

    // Only the PDF carries the figures the screen shows above the table.
    const summary =
        req.params.format === "pdf" && range
            ? await getVendorLedgerSummary(
                  loaded.row,
                  loaded.accountIds,
                  range,
                  loaded.ledgerAccountIds
              )
            : null;

    return sendListExport({
        res,
        next,
        format: req.params.format,
        list: paging => listVendorOrders({ ...filters, ...paging }),
        serialize: row => serializeTransaction(row),
        columns: vendorTransactionExportColumns(),
        summaryOf: summary ? () => vendorSummaryTiles(summary) : undefined,
        note: summary
            ? vendorSummaryNote(req.query, summary.openingBalanceSet, Boolean(searchText || status))
            : undefined,
        title: `${loaded.row.vendorName} Transactions`,
        period: exportPeriodOf(req.query),
        subtitleOf: () => [
            status ? `Status: ${VENDOR_ORDER_STATUS_LABELS[status]}` : null,
            searchText ? `Search: "${searchText}"` : null,
        ],
    });
});

exports.exportVendorCommissions = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const filters = commissionArgs(req, loaded);
    const { searchText, status } = filters;

    return sendListExport({
        res,
        next,
        format: req.params.format,
        list: paging => listCommissionRows({ ...filters, ...paging }),
        serialize: row => serializeCommission(row),
        columns: vendorCommissionExportColumns(),
        title: `${loaded.row.vendorName} Commissions`,
        period: exportPeriodOf(req.query),
        subtitleOf: () => [
            VENDOR_COMMISSION_STATUS_LABELS[status] ? `Status: ${VENDOR_COMMISSION_STATUS_LABELS[status]}` : null,
            searchText ? `Search: "${searchText}"` : null,
        ],
    });
});

const loadStatement = async (req, loaded) => {
    const opening = await findOpeningBalance(loaded.row.id);

    return buildVendorStatement({
        vendorId: loaded.row.id,
        accountIds: loaded.accountIds,
        range: rangeOf(req.query),
        openingAsOf: opening ? opening.depositDate : null,
    });
};

// The statement's own search and Debit / Credit filter. The figures and the running balance
// stay those of the whole period; only the lines listed are narrowed.
const statementFilters = req => ({ searchText: req.query.searchText, side: req.query.side });

exports.getVendorStatement = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const statement = await loadStatement(req, loaded);
    const rows = filterStatementRows(statement.rows, statementFilters(req));
    const { page, itemsPerPage } = req.query;
    const { offset, limit } = pageOf(req.query);

    return ok(
        res,
        {
            vendorName: loaded.row.vendorName,
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
        "Vendor statement fetched successfully"
    );
});

const statementFileName = (vendorName, range, extension) => {
    const safe = String(vendorName || "vendor").replace(/[/\\:*?"<>|]/g, "-");
    const period = range ? `${dayOf(range.from)}_to_${dayOf(range.to)}` : "all";
    return `${safe} statement ${period}.${extension}`;
};

exports.exportVendorStatement = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const statement = await loadStatement(req, loaded);
    const range = rangeOf(req.query);
    const filterLabel = statementFilterLabel(statementFilters(req));
    const rows = filterStatementRows(statement.rows, statementFilters(req));
    if (filterLabel && !rows.length) {
        return next(new ErrorResponse("No data is available for export", 404));
    }

    // A filtered sheet lists only its matching lines: the opening and closing lines carry the
    // whole period's figures, which would not add up beside them.
    const { buffer, fileType } = await generateExcelBufferAndType(
        statementExcelRows({ ...statement, rows }, loaded.row.vendorName, "Vendor", {
            markers: !filterLabel,
        }),
        "excel"
    );

    res.setHeader("Content-Type", fileType);
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${statementFileName(loaded.row.vendorName, range, "xlsx")}"`
    );
    return res.status(200).send(Buffer.from(buffer));
});

exports.exportVendorStatementPdf = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const statement = await loadStatement(req, loaded);
    const range = rangeOf(req.query);
    const filterLabel = statementFilterLabel(statementFilters(req));
    const rows = filterStatementRows(statement.rows, statementFilters(req));
    if (filterLabel && !rows.length) {
        return next(new ErrorResponse("No data is available for export", 404));
    }

    const html = vendorStatementTemplate({
        vendorName: loaded.row.vendorName,
        range,
        statement: { ...statement, rows },
        filterLabel,
    });

    const pdf = await renderPdf(html);
    if (!pdf || !pdf.length) {
        return next(new ErrorResponse("Could not render the statement", 503));
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${statementFileName(loaded.row.vendorName, range, "pdf")}"`
    );
    return res.status(200).send(pdf);
});

// The filters shared by the Deposits table and its export, so both show the same rows.
const depositArgs = (req, loaded) => ({
    vendorId: loaded.row.id,
    range: rangeOf(req.query),
    searchText: req.query.searchText,
    status: req.query.status,
    mode: req.query.mode,
});

exports.listVendorDeposits = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const result = await listDeposits({ ...depositArgs(req, loaded), ...pageOf(req.query) });

    return ok(
        res,
        {
            entries: result.rows.map(serializeDeposit),
            recordsTotal: result.count,
            page: req.query.page,
            itemsPerPage: req.query.itemsPerPage,
        },
        "Vendor deposits fetched successfully"
    );
});

exports.exportVendorDeposits = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const filters = depositArgs(req, loaded);
    const { searchText, status, mode } = filters;

    return sendListExport({
        res,
        next,
        format: req.params.format,
        list: paging => listDeposits({ ...filters, ...paging }),
        serialize: row => serializeDeposit(row),
        columns: vendorDepositExportColumns(),
        title: `${loaded.row.vendorName} Deposits`,
        period: exportPeriodOf(req.query),
        subtitleOf: () => [
            VENDOR_DEPOSIT_STATUS_LABELS[status] ? `Status: ${VENDOR_DEPOSIT_STATUS_LABELS[status]}` : null,
            DEPOSIT_MODES.includes(mode) ? `Mode: ${mode}` : null,
            searchText ? `Search: "${searchText}"` : null,
        ],
    });
});

exports.createVendorDeposit = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    await refuseIfBeforeOpening(loaded.row.id, req.body.depositDate, "A deposit");

    const slip = await slipOf(req, loaded.row.id);
    const deposit = await withoutDuplicates(
        () => createDeposit({ vendorId: loaded.row.id, ...req.body, slip, actor: actorOf(req) }),
        `A deposit with reference ${req.body.reference} is already recorded for this vendor`
    );

    return res.status(201).json({
        status: true,
        data: serializeDeposit(deposit),
        message: "Deposit recorded successfully",
        responseCode: "000",
    });
});

exports.createVendorOpeningBalance = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const refusal = await openingBeforeGoLive(req.body.asOfDate);
    if (refusal) return next(new ErrorResponse(refusal, 400));

    const slip = await slipOf(req, loaded.row.id);
    const opening = await withoutDuplicates(
        () => createOpeningBalance({ vendorId: loaded.row.id, ...req.body, slip, actor: actorOf(req) }),
        "An opening balance is already set for this vendor. Reverse it before recording a new one"
    );

    return res.status(201).json({
        status: true,
        data: serializeDeposit(opening),
        message: "Opening balance recorded successfully",
        responseCode: "000",
    });
});

exports.reverseVendorDeposit = asyncHandler(async (req, res, next) => {
    const reversal = await reverseDeposit({
        id: req.params.id,
        vendorId: req.params.vendorId,
        reason: req.body.reason,
        actor: actorOf(req),
    });
    if (!reversal) return next(new ErrorResponse("Entry not found or already reversed", 404));

    return ok(res, serializeDeposit(reversal), "Entry reversed successfully");
});

exports.updateVendorDeposit = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const { changeReason, values } = changeOf(req.body);
    await refuseIfBeforeOpening(loaded.row.id, values.depositDate, "A deposit");

    const slip = await slipOf(req, loaded.row.id);
    const result = await withoutDuplicates(
        () =>
            updateDeposit({
                id: req.params.id,
                vendorId: loaded.row.id,
                entryType: DEPOSIT_ENTRY_TYPES.deposit,
                values,
                slip,
                actor: actorOf(req),
                changeReason,
                audit: vendorAudit(loaded, depositLabel),
            }),
        `A deposit with reference ${values.reference} is already recorded for this vendor`
    );

    return answerLedgerChange(res, next, result, {
        noun: "Deposit",
        verb: "updated",
        serialize: serializeDeposit,
    });
});

exports.deleteVendorDeposit = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const result = await deleteDeposit({
        id: req.params.id,
        vendorId: loaded.row.id,
        entryType: DEPOSIT_ENTRY_TYPES.deposit,
        actor: actorOf(req),
        changeReason: req.body.reason,
        audit: vendorAudit(loaded, depositLabel),
    });

    return answerLedgerChange(res, next, result, {
        noun: "Deposit",
        verb: "deleted",
        serialize: serializeDeposit,
    });
});

exports.updateVendorOpeningBalance = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const refusal = await openingBeforeGoLive(req.body.asOfDate);
    if (refusal) return next(new ErrorResponse(refusal, 400));
    await refuseOpeningPastEntries(loaded.row.id, req.params.id, req.body.asOfDate);

    const { changeReason, values } = changeOf(req.body);
    const slip = await slipOf(req, loaded.row.id);
    const result = await updateDeposit({
        id: req.params.id,
        vendorId: loaded.row.id,
        entryType: DEPOSIT_ENTRY_TYPES.opening,
        values: { amount: values.amount, depositDate: values.asOfDate, note: values.note },
        slip,
        actor: actorOf(req),
        changeReason,
        audit: vendorAudit(loaded, () => OPENING_LABEL),
    });

    return answerLedgerChange(res, next, result, {
        noun: OPENING_LABEL,
        verb: "updated",
        serialize: serializeDeposit,
    });
});

const depositRowLabel = row =>
    row.entryType === "OPENING" ? OPENING_LABEL : withReversal(row, depositLabel(row));

exports.tagVendorDepositBooks = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const result = await tagDepositBooks({
        id: req.params.id,
        vendorId: loaded.row.id,
        synced: req.body.synced,
        actor: actorOf(req),
        audit: vendorAudit(loaded, depositRowLabel),
    });

    return answerBooksTag(res, next, result, { noun: "Entry", serialize: serializeDeposit });
});

exports.deleteVendorOpeningBalance = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const result = await deleteDeposit({
        id: req.params.id,
        vendorId: loaded.row.id,
        entryType: DEPOSIT_ENTRY_TYPES.opening,
        actor: actorOf(req),
        changeReason: req.body.reason,
        audit: vendorAudit(loaded, () => OPENING_LABEL),
    });

    return answerLedgerChange(res, next, result, {
        noun: OPENING_LABEL,
        verb: "deleted",
        serialize: serializeDeposit,
    });
});

const byNewestFirst = (a, b) => {
    const left = `${dayOf(a.issueDate)}|${String(a.id || 0).padStart(12, "0")}`;
    const right = `${dayOf(b.issueDate)}|${String(b.id || 0).padStart(12, "0")}`;
    return left < right ? 1 : left > right ? -1 : 0;
};

// The manual notes are rows and the commission reversals are read off the journal, so the
// page is cut after the two are merged rather than in SQL.
// The filters shared by the Credit Notes table and its export, so both show the same rows.
const creditNoteFilters = req => ({
    searchText: req.query.searchText,
    status: req.query.status,
});

const mergeEntries = async (range, loaded, kind, withReversals, filters) => {
    const [manual, derived] = await Promise.all([
        listManualEntries({ vendorId: loaded.row.id, kind, range }),
        withReversals
            ? listCommissionReversals({
                  vendorId: loaded.row.id,
                  accountIds: loaded.accountIds,
                  range,
              })
            : [],
    ]);

    return filterCreditNotes([...manual.map(serializeEntry), ...derived].sort(byNewestFirst), filters);
};

const listMergedEntries = async (req, loaded, kind, withReversals) => {
    const merged = await mergeEntries(
        rangeOf(req.query),
        loaded,
        kind,
        withReversals,
        creditNoteFilters(req)
    );
    const { offset, limit } = pageOf(req.query);

    return {
        entries: merged.slice(offset, offset + limit),
        recordsTotal: merged.length,
        page: req.query.page,
        itemsPerPage: req.query.itemsPerPage,
    };
};

exports.listVendorCreditNotes = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    return ok(
        res,
        await listMergedEntries(req, loaded, ENTRY_KINDS.creditNote, true),
        "Vendor credit notes fetched successfully"
    );
});

exports.exportVendorCreditNotes = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const range = rangeOf(req.query);
    const filters = creditNoteFilters(req);
    const { searchText, status } = filters;

    return sendListExport({
        res,
        next,
        format: req.params.format,
        list: async ({ limit, offset }) => {
            const merged = await mergeEntries(range, loaded, ENTRY_KINDS.creditNote, true, filters);
            return { rows: merged.slice(offset, offset + limit), count: merged.length };
        },
        serialize: row => row,
        columns: vendorCreditNoteExportColumns(),
        title: `${loaded.row.vendorName} Credit Notes`,
        period: exportPeriodOf(req.query),
        subtitleOf: () => [
            VENDOR_CREDIT_NOTE_STATUS_LABELS[status]
                ? `Status: ${VENDOR_CREDIT_NOTE_STATUS_LABELS[status]}`
                : null,
            searchText ? `Search: "${searchText}"` : null,
        ],
    });
});

// Cost of sales has no derived rows and no tax document: the tab is the hand-recorded entries
// alone, filtered and paged the same way as credit notes.
exports.listVendorCostOfSales = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    return ok(
        res,
        await listMergedEntries(req, loaded, ENTRY_KINDS.costOfSales, false),
        "Vendor cost of sales fetched successfully"
    );
});

exports.exportVendorCostOfSales = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const range = rangeOf(req.query);
    const filters = creditNoteFilters(req);
    const { searchText, status } = filters;

    return sendListExport({
        res,
        next,
        format: req.params.format,
        list: async ({ limit, offset }) => {
            const merged = await mergeEntries(range, loaded, ENTRY_KINDS.costOfSales, false, filters);
            return { rows: merged.slice(offset, offset + limit), count: merged.length };
        },
        serialize: row => row,
        columns: vendorCostOfSalesExportColumns(),
        title: `${loaded.row.vendorName} Cost of Sales`,
        period: exportPeriodOf(req.query),
        subtitleOf: () => [
            VENDOR_COST_OF_SALES_STATUS_LABELS[status]
                ? `Status: ${VENDOR_COST_OF_SALES_STATUS_LABELS[status]}`
                : null,
            searchText ? `Search: "${searchText}"` : null,
        ],
    });
});

exports.listVendorDebitNotes = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    return ok(
        res,
        await listMergedEntries(req, loaded, ENTRY_KINDS.debitNote, false),
        "Vendor debit notes fetched successfully"
    );
});

exports.exportVendorDebitNotes = asyncHandler(async (req, res, next) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const range = rangeOf(req.query);
    const filters = creditNoteFilters(req);
    const { searchText, status } = filters;

    return sendListExport({
        res,
        next,
        format: req.params.format,
        list: async ({ limit, offset }) => {
            const merged = await mergeEntries(range, loaded, ENTRY_KINDS.debitNote, false, filters);
            return { rows: merged.slice(offset, offset + limit), count: merged.length };
        },
        serialize: row => row,
        columns: vendorDebitNoteExportColumns(),
        title: `${loaded.row.vendorName} Debit Notes`,
        period: exportPeriodOf(req.query),
        subtitleOf: () => [
            VENDOR_DEBIT_NOTE_STATUS_LABELS[status]
                ? `Status: ${VENDOR_DEBIT_NOTE_STATUS_LABELS[status]}`
                : null,
            searchText ? `Search: "${searchText}"` : null,
        ],
    });
});

const createManualEntry = async (req, res, next, { kind, label }) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    await refuseIfBeforeOpening(loaded.row.id, req.body.issueDate, label);

    const slip = await slipOf(req, loaded.row.id);
    const split = splitEntryAmount({ ...req.body, gstRate: await loadGstRate() });
    const entry = await withoutDuplicates(
        () =>
            createEntry({
                vendorId: loaded.row.id,
                kind,
                ...req.body,
                ...split,
                slip,
                actor: actorOf(req),
            }),
        `${label} is already recorded for this vendor`
    );

    return res.status(201).json({
        status: true,
        data: serializeEntry(entry),
        message: `${label} recorded successfully`,
        responseCode: "000",
    });
};

const reverseManualEntry = async (req, res, next, { kind, label }) => {
    const entry = await reverseEntry({
        id: req.params.id,
        vendorId: req.params.vendorId,
        kind,
        reason: req.body.reason,
        actor: actorOf(req),
    });
    if (!entry) return next(new ErrorResponse(`${label} not found or already reversed`, 404));

    return ok(res, serializeEntry(entry), `${label} reversed successfully`);
};

const updateManualEntry = async (req, res, next, { kind, label }) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const { changeReason, values } = changeOf(req.body);
    await refuseIfBeforeOpening(loaded.row.id, values.issueDate, label);

    const existing = await findManualEntry({ id: req.params.id, vendorId: loaded.row.id, kind });
    const split = splitEntryAmount({
        ...values,
        gstRate: existing && existing.gstRate ? existing.gstRate : await loadGstRate(),
    });
    const slip = await slipOf(req, loaded.row.id);
    const result = await withoutDuplicates(
        () =>
            updateEntry({
                id: req.params.id,
                vendorId: loaded.row.id,
                kind,
                values: { ...values, ...split },
                slip,
                actor: actorOf(req),
                changeReason,
                audit: vendorAudit(loaded, row => `${label} ${row.entryNumber || row.reference}`),
            }),
        `${label} is already recorded for this vendor`
    );

    return answerLedgerChange(res, next, result, {
        noun: label,
        verb: "updated",
        serialize: serializeEntry,
    });
};

const deleteManualEntry = async (req, res, next, { kind, label }) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const result = await deleteEntry({
        id: req.params.id,
        vendorId: loaded.row.id,
        kind,
        actor: actorOf(req),
        changeReason: req.body.reason,
        audit: vendorAudit(loaded, row => `${label} ${row.entryNumber || row.reference}`),
    });

    return answerLedgerChange(res, next, result, {
        noun: label,
        verb: "deleted",
        serialize: serializeEntry,
    });
};

exports.createVendorCreditNote = asyncHandler((req, res, next) =>
    createManualEntry(req, res, next, {
        kind: ENTRY_KINDS.creditNote,
        label: "Credit note",
    })
);

exports.reverseVendorCreditNote = asyncHandler((req, res, next) =>
    reverseManualEntry(req, res, next, { kind: ENTRY_KINDS.creditNote, label: "Credit note" })
);

exports.createVendorCommission = asyncHandler((req, res, next) =>
    createManualEntry(req, res, next, {
        kind: ENTRY_KINDS.commission,
        label: "Commission",
    })
);

exports.reverseVendorCommission = asyncHandler((req, res, next) =>
    reverseManualEntry(req, res, next, { kind: ENTRY_KINDS.commission, label: "Commission" })
);

exports.createVendorCostOfSales = asyncHandler((req, res, next) =>
    createManualEntry(req, res, next, {
        kind: ENTRY_KINDS.costOfSales,
        label: "Cost of sales",
    })
);

exports.reverseVendorCostOfSales = asyncHandler((req, res, next) =>
    reverseManualEntry(req, res, next, { kind: ENTRY_KINDS.costOfSales, label: "Cost of sales" })
);

exports.createVendorDebitNote = asyncHandler((req, res, next) =>
    createManualEntry(req, res, next, {
        kind: ENTRY_KINDS.debitNote,
        label: "Debit note",
    })
);

exports.reverseVendorDebitNote = asyncHandler((req, res, next) =>
    reverseManualEntry(req, res, next, { kind: ENTRY_KINDS.debitNote, label: "Debit note" })
);

const tagManualEntryBooks = async (req, res, next, { kind, label }) => {
    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) return next(new ErrorResponse("Vendor not found", 404));

    const result = await tagEntryBooks({
        id: req.params.id,
        vendorId: loaded.row.id,
        kind,
        synced: req.body.synced,
        actor: actorOf(req),
        audit: vendorAudit(loaded, row => withReversal(row, `${label} ${row.entryNumber || row.reference}`)),
    });

    return answerBooksTag(res, next, result, { noun: label, serialize: serializeEntry });
};

exports.tagVendorCreditNoteBooks = asyncHandler((req, res, next) =>
    tagManualEntryBooks(req, res, next, { kind: ENTRY_KINDS.creditNote, label: "Credit note" })
);

exports.tagVendorCommissionBooks = asyncHandler((req, res, next) =>
    tagManualEntryBooks(req, res, next, { kind: ENTRY_KINDS.commission, label: "Commission" })
);

exports.tagVendorCostOfSalesBooks = asyncHandler((req, res, next) =>
    tagManualEntryBooks(req, res, next, { kind: ENTRY_KINDS.costOfSales, label: "Cost of sales" })
);

exports.tagVendorDebitNoteBooks = asyncHandler((req, res, next) =>
    tagManualEntryBooks(req, res, next, { kind: ENTRY_KINDS.debitNote, label: "Debit note" })
);

exports.updateVendorCreditNote = asyncHandler((req, res, next) =>
    updateManualEntry(req, res, next, {
        kind: ENTRY_KINDS.creditNote,
        label: "Credit note",
    })
);

exports.deleteVendorCreditNote = asyncHandler((req, res, next) =>
    deleteManualEntry(req, res, next, { kind: ENTRY_KINDS.creditNote, label: "Credit note" })
);

exports.updateVendorCommission = asyncHandler((req, res, next) =>
    updateManualEntry(req, res, next, {
        kind: ENTRY_KINDS.commission,
        label: "Commission",
    })
);

exports.deleteVendorCommission = asyncHandler((req, res, next) =>
    deleteManualEntry(req, res, next, { kind: ENTRY_KINDS.commission, label: "Commission" })
);

exports.updateVendorCostOfSales = asyncHandler((req, res, next) =>
    updateManualEntry(req, res, next, {
        kind: ENTRY_KINDS.costOfSales,
        label: "Cost of sales",
    })
);

exports.deleteVendorCostOfSales = asyncHandler((req, res, next) =>
    deleteManualEntry(req, res, next, { kind: ENTRY_KINDS.costOfSales, label: "Cost of sales" })
);

exports.updateVendorDebitNote = asyncHandler((req, res, next) =>
    updateManualEntry(req, res, next, {
        kind: ENTRY_KINDS.debitNote,
        label: "Debit note",
    })
);

exports.deleteVendorDebitNote = asyncHandler((req, res, next) =>
    deleteManualEntry(req, res, next, { kind: ENTRY_KINDS.debitNote, label: "Debit note" })
);

const INVOICE_SOURCES = ["order", "manual"];
const CREDIT_NOTE_SOURCES = ["auto", "manual"];

const streamTaxDocument = async (res, next, document, vendorName) => {
    if (!document) {
        return next(new ErrorResponse("Document not available for this entry", 404));
    }

    const pdf = await renderPdf(taxInvoiceTemplate(document.payload));
    if (!isPdfBuffer(pdf)) {
        return next(new ErrorResponse("Could not render the document", 503));
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${documentFileName(vendorName, document.payload)}"`
    );
    return res.status(200).send(pdf);
};

const loadForDocument = async (req, res, next, sources) => {
    if (!sources.includes(req.params.source)) {
        next(new ErrorResponse("Invalid document source", 400));
        return null;
    }

    const loaded = await loadVendor(req.params.vendorId);
    if (!loaded) {
        next(new ErrorResponse("Vendor not found", 404));
        return null;
    }
    return loaded;
};

exports.downloadVendorCommissionInvoice = asyncHandler(async (req, res, next) => {
    const loaded = await loadForDocument(req, res, next, INVOICE_SOURCES);
    if (!loaded) return undefined;

    const { source, id } = req.params;
    const document =
        source === "manual"
            ? await manualEntryDocument({
                  vendorId: loaded.row.id,
                  id,
                  kind: ENTRY_KINDS.commission,
              })
            : await orderInvoiceDocument({
                  vendorId: loaded.row.id,
                  corporateTxnId: id,
                  ledgerAccountIds: loaded.ledgerAccountIds,
              });

    return streamTaxDocument(res, next, document, loaded.row.vendorName);
});

exports.downloadVendorCreditNote = asyncHandler(async (req, res, next) => {
    const loaded = await loadForDocument(req, res, next, CREDIT_NOTE_SOURCES);
    if (!loaded) return undefined;

    const { source, id } = req.params;
    const document =
        source === "manual"
            ? await manualEntryDocument({
                  vendorId: loaded.row.id,
                  id,
                  kind: ENTRY_KINDS.creditNote,
              })
            : await orderCreditNoteDocument({
                  vendorId: loaded.row.id,
                  corporateTxnId: id,
                  accountIds: loaded.accountIds,
              });

    return streamTaxDocument(res, next, document, loaded.row.vendorName);
});
