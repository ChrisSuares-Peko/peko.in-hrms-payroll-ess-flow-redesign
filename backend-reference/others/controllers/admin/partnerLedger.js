const asyncHandler = require("../../middlewares/async");
const { istDay } = require("../../utils/istRange");
const ErrorResponse = require("../../utils/error-response");
const { openingBeforeGoLive } = require("../../models/use-cases/accountingPeriod");
const { dayBoundedRange } = require("../../utils/istRange");
const { uploadFileEncryptedToS3 } = require("../../utils/s3");
const { customLog } = require("../../utils/loggerHelper");
const {
    listPartners,
    findPartnerById,
    listPartnerOrders,
    serializeTransaction,
    serializeSubscription,
    getPartnerLedgerSummary,
    getPartnerLedgerSnapshot,
    serializePartner,
    buildPartnerKpis,
} = require("../../models/use-cases/partnerLedger");
const {
    PAYOUT_MODES,
    ENTRY_KINDS: PAYOUT_KINDS,
    serializePayout,
    listByPartner,
    createPayout,
    createOpeningBalance,
    findOpeningBalance,
    reversePayout,
    updatePayout,
    deletePayout,
    tagPayoutBooks,
    findFirstPayoutDate,
} = require("../../models/use-cases/partnerPayouts");
const {
    ENTRY_KINDS: PARTNER_ENTRY_KINDS,
    serializeEntry: serializeDebitNote,
    listByPartner: listEntriesByPartner,
    createEntry: createPartnerEntry,
    reverseEntry: reversePartnerEntry,
    updateEntry: updatePartnerEntry,
    deleteEntry: deletePartnerEntry,
    tagEntryBooks: tagPartnerEntryBooks,
    findFirstEntryDate: findFirstDebitNoteDate,
    findEntry: findPartnerEntry,
} = require("../../models/use-cases/partnerLedgerEntries");
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
    PARTNER_STATEMENT_CONVENTION,
    buildPartnerStatement,
    statementExcelRows,
} = require("../../models/use-cases/partnerStatement");
const {
    partnerTransactionExportColumns,
    partnerSubscriptionExportColumns,
    partnerPayoutExportColumns,
    partnerDebitNoteExportColumns,
    partnerSummaryTiles,
    partnerPaymentsTiles,
    partnerSummaryNote,
    partnerPaymentsNote,
    partnerOrderFilterNotes,
    partnerPayoutFilterNotes,
    partnerDebitNoteFilterNotes,
} = require("../../models/use-cases/partnerLedgerExport");
const { filterStatementRows, statementFilterLabel } = require("../../models/use-cases/vendorLedgerFilters");
const { periodOf, sendListExport } = require("../../utils/tableExport");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { renderPdf } = require("../../utils/puppeteerPool");
const { ledgerStatementTemplate } = require("../../utils/ledgerStatementTemplate");

const ok = (res, data, message) =>
    res.status(200).json({ status: true, data, message, responseCode: "000" });

const actorOf = req => ({ id: req.user && req.user.id, name: req.user && req.user.name });

const rangeOf = query =>
    query.from && query.to ? dayBoundedRange(query.from, query.to) : null;

const pageOf = query => ({
    limit: query.itemsPerPage,
    offset: (query.page - 1) * query.itemsPerPage,
});

const SLIP_FOLDER = "partner-ledger-slips";

const dayOf = value =>
    value instanceof Date ? istDay(value) : String(value).slice(0, 10);

// The unique index lives on a generated column covering only live rows, so a collision
// means this exact reference is already on file for this partner and still counting.
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
const refuseIfBeforeOpening = async (partnerId, date, label) => {
    const opening = await findOpeningBalance(partnerId);
    if (!opening) return;

    if (dayOf(date) <= dayOf(opening.payoutDate)) {
        throw new ErrorResponse(
            `${label} must be dated after the opening balance of ${dayOf(opening.payoutDate)}`,
            400
        );
    }
};

const slipOf = async (req, partnerId) => {
    const { slipBase64, slipName, slipFormat } = req.body;
    if (!slipBase64) return null;

    if (!slipFormat) throw new ErrorResponse("Slip file type could not be read", 400);

    const { NODE_ENV } = process.env;
    const user = req.user || {};
    const folder = `${NODE_ENV || "staging"}/system_user/${user.username || user.id}/${SLIP_FOLDER}/${partnerId}`;
    const base64 = String(slipBase64).replace(/^data:[^;]+;base64,/, "");

    const key = await uploadFileEncryptedToS3(base64, folder, slipFormat);
    customLog(req, "info", { message: "Partner ledger slip uploaded", partnerId, key });

    return { key, name: String(slipName || "slip").slice(0, 255), format: slipFormat };
};

const loadPartner = async credentialId => findPartnerById(credentialId);

const OPENING_LABEL = "Opening balance";

const payoutLabel = row => `Payout ${row.entryNumber || row.reference || ""}`.trim();

const debitNoteLabel = row => `Debit note ${row.entryNumber || row.reference}`;

const partnerAudit = (partner, labelOf) => ({
    configType: LEDGER_AUDIT_TYPES.partner,
    partnerName: partner.partnerName || null,
    labelOf: row => `${partner.partnerName} › ${labelOf(row)}`,
});

const refuseOpeningPastEntries = async (partnerId, openingId, asOfDate) => {
    const opening = await findOpeningBalance(partnerId);
    if (!opening || String(opening.id) !== String(openingId)) return;
    if (dayOf(asOfDate) <= dayOf(opening.payoutDate)) return;

    const first = earliestDate([
        await findFirstPayoutDate(partnerId),
        await findFirstDebitNoteDate(partnerId),
    ]);
    if (first && dayOf(asOfDate) >= first) {
        throw new ErrorResponse(
            `The opening balance must be dated before the first entry on this ledger, ${first}`,
            400
        );
    }
};

exports.listPartnerLedger = asyncHandler(async (req, res) => {
    const { page, itemsPerPage, searchText, sort, sortField, refresh } = req.query;

    const [snapshot, result] = await Promise.all([
        getPartnerLedgerSnapshot({ refresh }),
        listPartners({ ...pageOf(req.query), searchText, sort, sortField }),
    ]);

    const partners = result.rows.map(row =>
        serializePartner(row, snapshot.balances[row.credentialId])
    );

    return ok(
        res,
        {
            partners,
            recordsTotal: result.count,
            page,
            itemsPerPage,
            kpis: buildPartnerKpis(snapshot),
            partnershipAccountConfigured: Boolean(snapshot.partnershipAccountConfigured),
            generatedAt: snapshot.generatedAt,
            cached: Boolean(snapshot.cached),
        },
        "Partner ledger fetched successfully"
    );
});

exports.getPartnerLedger = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const [summary, gstRate] = await Promise.all([
        getPartnerLedgerSummary(partner.credentialId, rangeOf(req.query)),
        loadGstRate(),
    ]);

    return ok(
        res,
        {
            partner: serializePartner(partner, summary),
            summary,
            partnershipAccountConfigured: Boolean(summary.partnershipAccountConfigured),
            gstRate,
        },
        "Partner fetched successfully"
    );
});

// The filters shared by a partner's order tables and their exports, so both show the same rows.
const orderArgs = (req, partner, subscriptions) => ({
    partnerId: partner.credentialId,
    range: rangeOf(req.query),
    searchText: req.query.searchText,
    status: req.query.status,
    subscriptions,
});

const payoutArgs = (req, partner) => ({
    partnerCredentialId: partner.credentialId,
    range: rangeOf(req.query),
    searchText: req.query.searchText,
    status: req.query.status,
    mode: req.query.mode,
});

const debitNoteArgs = (req, partner) => ({
    partnerCredentialId: partner.credentialId,
    kind: PARTNER_ENTRY_KINDS.debitNote,
    range: rangeOf(req.query),
    searchText: req.query.searchText,
    status: req.query.status,
});

const listOrders = async (req, res, next, { subscriptions, serializer, message }) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const result = await listPartnerOrders({
        ...orderArgs(req, partner, subscriptions),
        ...pageOf(req.query),
    });

    return ok(
        res,
        {
            entries: result.rows.map(serializer),
            recordsTotal: result.count,
            page: req.query.page,
            itemsPerPage: req.query.itemsPerPage,
        },
        message
    );
};

exports.listPartnerTransactions = asyncHandler((req, res, next) =>
    listOrders(req, res, next, {
        subscriptions: false,
        serializer: serializeTransaction,
        message: "Partner transactions fetched successfully",
    })
);

exports.listPartnerSubscriptions = asyncHandler((req, res, next) =>
    listOrders(req, res, next, {
        subscriptions: true,
        serializer: serializeSubscription,
        message: "Partner subscriptions fetched successfully",
    })
);

exports.listPartnerPayouts = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const [result, summary] = await Promise.all([
        listByPartner({ ...payoutArgs(req, partner), ...pageOf(req.query) }),
        getPartnerLedgerSummary(partner.credentialId, null),
    ]);

    return ok(
        res,
        {
            entries: result.rows.map(serializePayout),
            recordsTotal: result.count,
            // The card above the table: what is still owed, and when it was last settled.
            owed: summary.owed,
            earned: summary.earned,
            paid: summary.paid,
            debitNotes: summary.debitNotes,
            opening: summary.opening,
            lastPayoutDate: summary.lastPayoutDate,
            lastPayoutAmount: summary.lastPayoutAmount,
            openingBalanceSet: summary.openingBalanceSet,
            openingBalanceAsOf: summary.openingBalanceAsOf,
            page: req.query.page,
            itemsPerPage: req.query.itemsPerPage,
        },
        "Partner payouts fetched successfully"
    );
});

exports.listPartnerDebitNotes = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const result = await listEntriesByPartner({ ...debitNoteArgs(req, partner), ...pageOf(req.query) });

    return ok(
        res,
        {
            entries: result.rows.map(serializeDebitNote),
            recordsTotal: result.count,
            page: req.query.page,
            itemsPerPage: req.query.itemsPerPage,
        },
        "Partner debit notes fetched successfully"
    );
});

const exportPeriodOf = query =>
    query.from && query.to ? periodOf(query.from, query.to) : "All dates";

// One tab's table as an Excel or PDF file: every row its current filters match, not just a page.
// `summaryOf` gives the figures the screen shows above the table, which only the PDF carries.
const exportPartnerTab = ({ label, columns, listOf, serialize, filterNotes, summaryOf }) =>
    asyncHandler(async (req, res, next) => {
        const partner = await loadPartner(req.params.partnerId);
        if (!partner) return next(new ErrorResponse("Partner not found", 404));

        const notes = filterNotes(req.query);
        const summary =
            summaryOf && req.params.format === "pdf"
                ? await summaryOf(req, partner, notes.some(Boolean))
                : null;

        return sendListExport({
            res,
            next,
            format: req.params.format,
            list: listOf(req, partner),
            serialize: row => serialize(row),
            columns: columns(),
            summaryOf: summary ? () => summary.tiles : undefined,
            note: summary ? summary.note : undefined,
            title: `${partner.partnerName} ${label}`,
            period: exportPeriodOf(req.query),
            subtitleOf: () => notes,
        });
    });

const ordersOf = subscriptions => (req, partner) => paging =>
    listPartnerOrders({ ...orderArgs(req, partner, subscriptions), ...paging });

exports.exportPartnerTransactions = exportPartnerTab({
    label: "Transactions",
    columns: partnerTransactionExportColumns,
    listOf: ordersOf(false),
    serialize: serializeTransaction,
    filterNotes: partnerOrderFilterNotes,
    // The screen's figures cover the dates asked for, so there is nothing to show without them.
    summaryOf: async (req, partner, filtered) => {
        const range = rangeOf(req.query);
        if (!range) return null;

        const summary = await getPartnerLedgerSummary(partner.credentialId, range);
        return {
            tiles: partnerSummaryTiles(summary),
            note: partnerSummaryNote(req.query, summary.openingBalanceSet, filtered),
        };
    },
});

exports.exportPartnerSubscriptions = exportPartnerTab({
    label: "Own Subscriptions",
    columns: partnerSubscriptionExportColumns,
    listOf: ordersOf(true),
    serialize: serializeSubscription,
    filterNotes: partnerOrderFilterNotes,
});

const payoutFilterNotes = query => {
    const [status, search] = partnerPayoutFilterNotes(query);
    return [status, PAYOUT_MODES.includes(query.mode) ? `Mode: ${query.mode}` : null, search];
};

exports.exportPartnerPayouts = exportPartnerTab({
    label: "Payments",
    columns: partnerPayoutExportColumns,
    listOf: (req, partner) => paging => listByPartner({ ...payoutArgs(req, partner), ...paging }),
    serialize: serializePayout,
    filterNotes: payoutFilterNotes,
    // What is still owed is the standing figure, never a window's, so the dates do not apply.
    summaryOf: async (req, partner, filtered) => {
        const summary = await getPartnerLedgerSummary(partner.credentialId, null);
        return {
            tiles: partnerPaymentsTiles(summary),
            note: partnerPaymentsNote(partner.partnerName, summary.openingBalanceSet, filtered),
        };
    },
});

exports.exportPartnerDebitNotes = exportPartnerTab({
    label: "Debit Notes",
    columns: partnerDebitNoteExportColumns,
    listOf: (req, partner) => paging =>
        listEntriesByPartner({ ...debitNoteArgs(req, partner), ...paging }),
    serialize: serializeDebitNote,
    filterNotes: partnerDebitNoteFilterNotes,
});

// What the drawer opens with. The same call the create endpoint uses to stamp
// calculatedAmount, so the suggestion on screen and the suggestion on record agree.
exports.getPartnerPayoutSuggestion = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const summary = await getPartnerLedgerSummary(partner.credentialId, null);

    return ok(
        res,
        {
            suggestedAmount: summary.owed,
            earned: summary.earned,
            paid: summary.paid,
            debitNotes: summary.debitNotes,
            lastPayoutDate: summary.lastPayoutDate,
        },
        "Suggested payout fetched successfully"
    );
});

exports.createPartnerOpeningBalance = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const refusal = await openingBeforeGoLive(req.body.asOfDate);
    if (refusal) return next(new ErrorResponse(refusal, 400));

    const slip = await slipOf(req, partner.credentialId);
    const opening = await withoutDuplicates(
        () =>
            createOpeningBalance({
                partnerCredentialId: partner.credentialId,
                ...req.body,
                slip,
                actor: actorOf(req),
            }),
        "An opening balance is already set for this partner. Reverse it before recording a new one"
    );

    return res.status(201).json({
        status: true,
        data: serializePayout(opening),
        message: "Opening balance recorded successfully",
        responseCode: "000",
    });
});

exports.createPartnerPayout = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    await refuseIfBeforeOpening(partner.credentialId, req.body.payoutDate, "A payout");

    const summary = await getPartnerLedgerSummary(partner.credentialId, null);
    const slip = await slipOf(req, partner.credentialId);

    const payout = await withoutDuplicates(
        () =>
            createPayout({
                partnerCredentialId: partner.credentialId,
                ...req.body,
                // Last, so what the ledger worked out is what gets recorded whatever the
                // client sent. Only the amount is the accounts team's to change.
                calculatedAmount: summary.owed,
                slip,
                actor: actorOf(req),
            }),
        `A payout with reference ${req.body.reference} is already recorded for this partner`
    );

    return res.status(201).json({
        status: true,
        data: serializePayout(payout),
        message: "Payout recorded successfully",
        responseCode: "000",
    });
});

exports.reversePartnerPayout = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const reversal = await reversePayout({
        id: req.params.id,
        partnerCredentialId: partner.credentialId,
        reason: req.body.reason,
        actor: actorOf(req),
    });
    if (!reversal) return next(new ErrorResponse("Payout not found or already reversed", 404));

    return ok(res, serializePayout(reversal), "Payout reversed successfully");
});

exports.updatePartnerPayout = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const { changeReason, values } = changeOf(req.body);
    await refuseIfBeforeOpening(partner.credentialId, values.payoutDate, "A payout");

    const slip = await slipOf(req, partner.credentialId);
    const result = await withoutDuplicates(
        () =>
            updatePayout({
                id: req.params.id,
                partnerCredentialId: partner.credentialId,
                entryKind: PAYOUT_KINDS.payout,
                values,
                slip,
                actor: actorOf(req),
                changeReason,
                audit: partnerAudit(partner, payoutLabel),
            }),
        `A payout with reference ${values.reference} is already recorded for this partner`
    );

    return answerLedgerChange(res, next, result, {
        noun: "Payout",
        verb: "updated",
        serialize: serializePayout,
    });
});

exports.deletePartnerPayout = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const result = await deletePayout({
        id: req.params.id,
        partnerCredentialId: partner.credentialId,
        entryKind: PAYOUT_KINDS.payout,
        actor: actorOf(req),
        changeReason: req.body.reason,
        audit: partnerAudit(partner, payoutLabel),
    });

    return answerLedgerChange(res, next, result, {
        noun: "Payout",
        verb: "deleted",
        serialize: serializePayout,
    });
});

exports.updatePartnerOpeningBalance = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const refusal = await openingBeforeGoLive(req.body.asOfDate);
    if (refusal) return next(new ErrorResponse(refusal, 400));
    await refuseOpeningPastEntries(partner.credentialId, req.params.id, req.body.asOfDate);

    const { changeReason, values } = changeOf(req.body);
    const slip = await slipOf(req, partner.credentialId);
    const result = await updatePayout({
        id: req.params.id,
        partnerCredentialId: partner.credentialId,
        entryKind: PAYOUT_KINDS.opening,
        values: { amount: values.amount, payoutDate: values.asOfDate, note: values.note },
        slip,
        actor: actorOf(req),
        changeReason,
        audit: partnerAudit(partner, () => OPENING_LABEL),
    });

    return answerLedgerChange(res, next, result, {
        noun: OPENING_LABEL,
        verb: "updated",
        serialize: serializePayout,
    });
});

exports.deletePartnerOpeningBalance = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const result = await deletePayout({
        id: req.params.id,
        partnerCredentialId: partner.credentialId,
        entryKind: PAYOUT_KINDS.opening,
        actor: actorOf(req),
        changeReason: req.body.reason,
        audit: partnerAudit(partner, () => OPENING_LABEL),
    });

    return answerLedgerChange(res, next, result, {
        noun: OPENING_LABEL,
        verb: "deleted",
        serialize: serializePayout,
    });
});

// A debit note takes back part of what the partner earned, so it is dated after the opening
// the same way a payout is: anything on or before that date is already inside the opening.
exports.createPartnerDebitNote = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    await refuseIfBeforeOpening(partner.credentialId, req.body.issueDate, "A debit note");

    const slip = await slipOf(req, partner.credentialId);
    const split = splitEntryAmount({ ...req.body, gstRate: await loadGstRate() });
    const entry = await withoutDuplicates(
        () =>
            createPartnerEntry({
                partnerCredentialId: partner.credentialId,
                kind: PARTNER_ENTRY_KINDS.debitNote,
                ...req.body,
                ...split,
                slip,
                actor: actorOf(req),
            }),
        "This debit note is already recorded for this partner"
    );

    return res.status(201).json({
        status: true,
        data: serializeDebitNote(entry),
        message: "Debit note recorded successfully",
        responseCode: "000",
    });
});

exports.reversePartnerDebitNote = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const reversal = await reversePartnerEntry({
        id: req.params.id,
        partnerCredentialId: partner.credentialId,
        kind: PARTNER_ENTRY_KINDS.debitNote,
        reason: req.body.reason,
        actor: actorOf(req),
    });
    if (!reversal) return next(new ErrorResponse("Debit note not found or already reversed", 404));

    return ok(res, serializeDebitNote(reversal), "Debit note reversed successfully");
});

exports.tagPartnerPayoutBooks = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const result = await tagPayoutBooks({
        id: req.params.id,
        partnerCredentialId: partner.credentialId,
        synced: req.body.synced,
        actor: actorOf(req),
        audit: partnerAudit(partner, row =>
            row.entryKind === "OPENING" ? OPENING_LABEL : withReversal(row, payoutLabel(row))
        ),
    });

    return answerBooksTag(res, next, result, { noun: "Entry", serialize: serializePayout });
});

exports.tagPartnerDebitNoteBooks = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const result = await tagPartnerEntryBooks({
        id: req.params.id,
        partnerCredentialId: partner.credentialId,
        kind: PARTNER_ENTRY_KINDS.debitNote,
        synced: req.body.synced,
        actor: actorOf(req),
        audit: partnerAudit(partner, row => withReversal(row, debitNoteLabel(row))),
    });

    return answerBooksTag(res, next, result, { noun: "Debit note", serialize: serializeDebitNote });
});

exports.updatePartnerDebitNote = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const { changeReason, values } = changeOf(req.body);
    await refuseIfBeforeOpening(partner.credentialId, values.issueDate, "A debit note");

    const existing = await findPartnerEntry({
        id: req.params.id,
        partnerCredentialId: partner.credentialId,
        kind: PARTNER_ENTRY_KINDS.debitNote,
    });
    const split = splitEntryAmount({
        ...values,
        gstRate: existing && existing.gstRate ? existing.gstRate : await loadGstRate(),
    });
    const slip = await slipOf(req, partner.credentialId);
    const result = await withoutDuplicates(
        () =>
            updatePartnerEntry({
                id: req.params.id,
                partnerCredentialId: partner.credentialId,
                kind: PARTNER_ENTRY_KINDS.debitNote,
                values: { ...values, ...split },
                slip,
                actor: actorOf(req),
                changeReason,
                audit: partnerAudit(partner, debitNoteLabel),
            }),
        "This debit note is already recorded for this partner"
    );

    return answerLedgerChange(res, next, result, {
        noun: "Debit note",
        verb: "updated",
        serialize: serializeDebitNote,
    });
});

exports.deletePartnerDebitNote = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const result = await deletePartnerEntry({
        id: req.params.id,
        partnerCredentialId: partner.credentialId,
        kind: PARTNER_ENTRY_KINDS.debitNote,
        actor: actorOf(req),
        changeReason: req.body.reason,
        audit: partnerAudit(partner, debitNoteLabel),
    });

    return answerLedgerChange(res, next, result, {
        noun: "Debit note",
        verb: "deleted",
        serialize: serializeDebitNote,
    });
});

const loadStatement = async (req, partner) =>
    buildPartnerStatement({ partnerId: partner.credentialId, range: rangeOf(req.query) });

// The figures and the running balance stay those of the whole period; only the lines listed
// are narrowed.
const statementFilters = req => ({ searchText: req.query.searchText, side: req.query.side });

exports.getPartnerStatement = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const statement = await loadStatement(req, partner);
    const rows = filterStatementRows(statement.rows, statementFilters(req));
    const { page, itemsPerPage } = req.query;
    const { offset, limit } = pageOf(req.query);

    return ok(
        res,
        {
            partnerName: partner.partnerName,
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
        "Partner statement fetched successfully"
    );
});

const statementFileName = (partnerName, range, extension) => {
    const safe = String(partnerName || "partner").replace(/[/\\:*?"<>|]/g, "-");
    const period = range ? `${dayOf(range.from)}_to_${dayOf(range.to)}` : "all";
    return `${safe} statement ${period}.${extension}`;
};

exports.exportPartnerStatement = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const statement = await loadStatement(req, partner);
    const range = rangeOf(req.query);
    const filterLabel = statementFilterLabel(statementFilters(req));
    const rows = filterStatementRows(statement.rows, statementFilters(req));
    if (filterLabel && !rows.length) {
        return next(new ErrorResponse("No data is available for export", 404));
    }

    // A filtered sheet lists only its matching lines: the opening and closing lines carry the
    // whole period's figures, which would not add up beside them.
    const { buffer, fileType } = await generateExcelBufferAndType(
        statementExcelRows({ ...statement, rows }, partner.partnerName, "Partner", {
            markers: !filterLabel,
        }),
        "excel"
    );

    res.setHeader("Content-Type", fileType);
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${statementFileName(partner.partnerName, range, "xlsx")}"`
    );
    return res.status(200).send(Buffer.from(buffer));
});

exports.exportPartnerStatementPdf = asyncHandler(async (req, res, next) => {
    const partner = await loadPartner(req.params.partnerId);
    if (!partner) return next(new ErrorResponse("Partner not found", 404));

    const statement = await loadStatement(req, partner);
    const range = rangeOf(req.query);
    const filterLabel = statementFilterLabel(statementFilters(req));
    const rows = filterStatementRows(statement.rows, statementFilters(req));
    if (filterLabel && !rows.length) {
        return next(new ErrorResponse("No data is available for export", 404));
    }

    const html = ledgerStatementTemplate({
        partyName: partner.partnerName,
        range,
        statement: { ...statement, rows },
        convention: PARTNER_STATEMENT_CONVENTION,
        filterLabel,
    });

    const pdf = await renderPdf(html);
    if (!pdf || !pdf.length) {
        return next(new ErrorResponse("Could not render the statement", 503));
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${statementFileName(partner.partnerName, range, "pdf")}"`
    );
    return res.status(200).send(pdf);
});
