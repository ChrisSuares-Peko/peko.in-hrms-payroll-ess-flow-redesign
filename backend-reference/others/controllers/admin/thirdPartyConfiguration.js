const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
    listPaymentLinkCorporates,
    setDefaultCharge,
    setCorporateCharge,
    removeCorporateCharge,
} = require("../../models/use-cases/paymentLinkCharges");

const ok = (res, data, message) =>
    res.status(200).json({ status: true, data, message, responseCode: "000" });

const actorOf = req => ({ id: req.user && req.user.id, name: req.user && req.user.name });

exports.listPaymentLinkCharges = asyncHandler(async (req, res) => {
    const { page, itemsPerPage, searchText, scope, sort, sortField } = req.query;
    const result = await listPaymentLinkCorporates({
        scope,
        searchText,
        sort,
        sortField,
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
    });

    return ok(
        res,
        {
            defaultCharge: result.defaultCharge,
            corporates: result.rows,
            recordsTotal: result.count,
            customTotal: result.customCount,
            page,
            itemsPerPage,
        },
        "Payment link charges fetched successfully"
    );
});

exports.updateDefaultPaymentLinkCharge = asyncHandler(async (req, res, next) => {
    const charge = await setDefaultCharge(req.body, actorOf(req));
    if (!charge) return next(new ErrorResponse("The default payment link charge could not be saved", 500));
    return ok(res, { defaultCharge: charge }, "Default payment link charge saved");
});

exports.updateCorporatePaymentLinkCharge = asyncHandler(async (req, res, next) => {
    const result = await setCorporateCharge(req.params.credentialId, req.body, actorOf(req));
    if (!result) return next(new ErrorResponse("This corporate is not onboarded for payment links", 404));
    return ok(res, result, "Payment link charge saved for the corporate");
});

exports.removeCorporatePaymentLinkCharge = asyncHandler(async (req, res, next) => {
    const removed = await removeCorporateCharge(req.params.credentialId);
    if (!removed) return next(new ErrorResponse("No custom charge is recorded for this corporate", 404));
    return ok(res, { credentialId: req.params.credentialId }, "The corporate now follows the default charge");
});
