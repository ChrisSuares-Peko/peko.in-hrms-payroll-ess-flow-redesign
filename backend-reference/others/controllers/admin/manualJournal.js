const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const orders = require("../../models/entities/order");
const { customLog } = require("../../utils/loggerHelper");
const { dispatchJournalRetry } = require("../../utils/bull/queue/accountingQueues");
const { dropAccountingCaches } = require("../../models/use-cases/accountingPeriod");
const { journalContextFor } = require("../../models/use-cases/journalContext");
const { withAccountNames } = require("../../models/use-cases/journalAccountNames");
const { suggestJournalLines } = require("../../models/use-cases/journalSuggestion");
const { splitTemplateFor } = require("../../models/use-cases/manualJournalSetup");
const {
    MANUAL_KEYS,
    PAUSED_REASON,
    journalDateProblem,
    buildLookup,
    listPostableAccounts,
    recordAdjustment,
    serializeAdjustment,
} = require("../../models/use-cases/manualJournal");

const ok = (res, data, message) =>
    res.status(200).json({ status: true, data, message, responseCode: "000" });

const actorOf = req => ({ id: req.user && req.user.id, name: req.user && req.user.name });

const PENDING_REASON = "Still posting — refresh in a moment to see the outcome";

const eventOf = (lookup, journalKey) => lookup.events.find(event => event.key === journalKey);

exports.getManualJournal = asyncHandler(async (req, res, next) => {
    const lookup = await buildLookup(req.params.corporateTxnId);
    if (!lookup) return next(new ErrorResponse("Order not found", 404));
    return ok(res, lookup, "Fetched order journals successfully");
});

exports.listManualJournalAccounts = asyncHandler(async (req, res) =>
    ok(res, { accounts: await listPostableAccounts() }, "Fetched accounts successfully")
);

// The split figures for an order whose breakdown was never worked out, from how the accounts
// team says it was sold. Only the sale entry is set up this way; the other events read the
// figures the sale stored.
exports.generateManualJournalSplit = asyncHandler(async (req, res, next) => {
    const { corporateTxnId, journalKey } = req.params;
    if (journalKey !== "transaction") return next(new ErrorResponse("Only the sale entry is set up this way", 400));

    const lookup = await buildLookup(corporateTxnId);
    if (!lookup) return next(new ErrorResponse("Order not found", 404));
    if (!lookup.setup) return next(new ErrorResponse("This order already carries a split", 409));

    const order = await orders.findOne({ where: { corporateTxnId }, raw: true });
    const template = await splitTemplateFor({
        order,
        customerState: (lookup.order.customer && lookup.order.customer.state) || null,
        partnerId: lookup.order.partnerId,
        setup: req.body,
    });
    return ok(res, template, "Split figures worked out");
});

exports.previewManualJournal = asyncHandler(async (req, res, next) => {
    const { corporateTxnId, journalKey } = req.params;
    if (!MANUAL_KEYS.includes(journalKey)) return next(new ErrorResponse("Unknown journal event", 400));

    const order = await orders.findOne({ where: { corporateTxnId }, raw: true });
    if (!order) return next(new ErrorResponse("Order not found", 404));

    const lookup = await buildLookup(corporateTxnId);
    const defaults = eventOf(lookup, journalKey).defaults;
    const body = req.body || {};
    const context = await journalContextFor(order, journalKey, {
        editedJournalData: body.journalData,
        amount: body.amount ?? defaults.amount,
        refundAmount: body.refundAmount ?? defaults.refundAmount,
        totalOrderAmount: body.totalOrderAmount ?? defaults.totalOrderAmount,
    });
    if (!context.ok) return next(new ErrorResponse(context.reason, 400));

    let preview;
    try {
        preview = await dispatchJournalRetry({
            transactionRef: corporateTxnId,
            type: "journalPreview",
            journalKey,
            reportData: context.reportData,
            amounts: context.amounts,
            contextSnapshot: context.contextSnapshot,
            sourceMs: "others-manual-operations",
        });
    } catch (error) {
        return next(new ErrorResponse(error?.message || "The preview did not come back in time", 504));
    }

    if (!preview?.ok || !(preview.lineItems && preview.lineItems.length)) {
        const suggestion = await suggestJournalLines({
            journalKey,
            order,
            lookupOrder: lookup.order,
            amount: body.amount ?? defaults.amount,
            refundAmount: body.refundAmount ?? defaults.refundAmount,
        });
        return ok(
            res,
            {
                ok: false,
                suggested: true,
                lineItems: suggestion.lineItems,
                split: suggestion.split,
                journalAccountIds: null,
                balanced: false,
                reason: preview?.reason || null,
            },
            preview?.reason || "The lines could not be worked out"
        );
    }

    return ok(
        res,
        {
            ok: true,
            lineItems: await withAccountNames(preview.lineItems, corporateTxnId),
            journalAccountIds: preview.journalAccountIds || null,
            balanced: preview.balanced !== false,
            reason: preview.reason || null,
        },
        "Lines worked out successfully"
    );
});

exports.recordManualJournal = asyncHandler(async (req, res, next) => {
    const { corporateTxnId, journalKey } = req.params;
    if (!MANUAL_KEYS.includes(journalKey)) return next(new ErrorResponse("Unknown journal event", 400));

    const lookup = await buildLookup(corporateTxnId);
    if (!lookup) return next(new ErrorResponse("Order not found", 404));

    const event = eventOf(lookup, journalKey);
    if (!event.eligibility.canRecord) {
        return next(new ErrorResponse(event.eligibility.reasons[0] || "Not allowed", 400));
    }
    if (lookup.recordingPaused) return next(new ErrorResponse(PAUSED_REASON, 409));

    const dateProblem = journalDateProblem(req.body.journalDate, lookup.accountingFloor);
    if (dateProblem) return next(new ErrorResponse(dateProblem, 400));

    const actor = actorOf(req);
    const before = { split: lookup.split, lineItems: null };
    const after = {
        split: { ...lookup.split, ...(req.body.journalData || {}) },
        lineItems: req.body.lineItems,
    };

    let result;
    try {
        result = await dispatchJournalRetry({
            transactionRef: corporateTxnId,
            type: "manualJournal",
            journalKey,
            lineItems: req.body.lineItems,
            journalDate: req.body.journalDate,
            journalData: req.body.journalData || undefined,
            journalAccountIds: req.body.journalAccountIds || undefined,
            actor,
            reason: req.body.reason,
            sourceMs: "others-manual-operations",
        });
    } catch (error) {
        customLog(req, "warn", {
            message: "[manualJournal] dispatch did not return",
            corporateTxnId,
            journalKey,
            error: error?.message,
        });
        return ok(res, { success: false, pending: true, reason: PENDING_REASON }, PENDING_REASON);
    }

    let history = null;
    if (result && result.action) {
        const row = await recordAdjustment({
            corporateTxnId,
            journalKey,
            result,
            before,
            after,
            journalDate: req.body.journalDate,
            reason: req.body.reason,
            actor,
        });
        history = serializeAdjustment(row);
    }
    if (result && result.success) await dropAccountingCaches();

    return ok(
        res,
        { ...result, history },
        result && result.success ? "Journal posted to the books" : (result && result.reason) || "The journal was not posted"
    );
});
