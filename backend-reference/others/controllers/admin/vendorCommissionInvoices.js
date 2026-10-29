const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
    findVendorById,
    getVendorDepositAccounts,
    ledgerAccountIdsForVendor,
} = require("../../models/use-cases/vendorLedger");
const {
    SOURCES,
    OUTCOMES,
    searchCommissionInvoices,
    loadCommissionInvoice,
    previewCommissionInvoice,
    saveBilledTo,
    sendInvoice,
} = require("../../models/use-cases/vendorCommissionInvoices");

const ok = (res, data, message) =>
    res.status(200).json({ status: true, data, message, responseCode: "000" });

const actorOf = req => ({ id: req.user && req.user.id, name: req.user && req.user.name });

const loadTarget = async (req, next) => {
    const { vendorId, source, id } = req.params;
    if (!Object.values(SOURCES).includes(source)) {
        next(new ErrorResponse("Invalid document source", 400));
        return null;
    }
    const row = await findVendorById(vendorId);
    if (!row) {
        next(new ErrorResponse("Vendor not found", 404));
        return null;
    }
    const accounts = await getVendorDepositAccounts();
    return {
        vendorId: row.id,
        source,
        id,
        ledgerAccountIds: ledgerAccountIdsForVendor(accounts, row.id),
    };
};

exports.searchCommissionInvoices = asyncHandler(async (req, res) =>
    ok(
        res,
        { matches: await searchCommissionInvoices(req.query.search) },
        "Commission invoices fetched successfully"
    )
);

exports.getCommissionInvoice = asyncHandler(async (req, res, next) => {
    const target = await loadTarget(req, next);
    if (!target) return undefined;

    const invoice = await loadCommissionInvoice(target);
    if (!invoice) return next(new ErrorResponse("Invoice not available for this entry", 404));

    return ok(res, invoice, "Commission invoice fetched successfully");
});

exports.previewCommissionInvoice = asyncHandler(async (req, res, next) => {
    const target = await loadTarget(req, next);
    if (!target) return undefined;

    const preview = await previewCommissionInvoice({ ...target, billedTo: req.body.billedTo });
    if (!preview) return next(new ErrorResponse("Invoice not available for this entry", 404));

    return ok(res, preview, "Commission invoice preview rendered successfully");
});

exports.updateCommissionInvoiceBilledTo = asyncHandler(async (req, res, next) => {
    const target = await loadTarget(req, next);
    if (!target) return undefined;

    const result = await saveBilledTo({ ...target, billedTo: req.body, actor: actorOf(req) });
    if (result.outcome === OUTCOMES.missing) {
        return next(new ErrorResponse("Invoice not available for this entry", 404));
    }

    return ok(
        res,
        result.invoice,
        result.outcome === OUTCOMES.unchanged
            ? "Nothing changed on the invoice"
            : "Invoice billed-to updated successfully"
    );
});

exports.sendCommissionInvoice = asyncHandler(async (req, res, next) => {
    const target = await loadTarget(req, next);
    if (!target) return undefined;

    const result = await sendInvoice({ ...target, to: req.body.to, actor: actorOf(req) });
    if (result.outcome === OUTCOMES.missing) {
        return next(new ErrorResponse("Invoice not available for this entry", 404));
    }
    if (result.outcome === OUTCOMES.renderFailed) {
        return next(new ErrorResponse("Could not render the invoice", 503));
    }
    if (result.outcome === OUTCOMES.sendFailed) {
        return next(new ErrorResponse(`Could not send the invoice: ${result.reason}`, 502));
    }

    return ok(res, result.invoice, `Invoice sent to ${result.recipients.join(", ")}`);
});
