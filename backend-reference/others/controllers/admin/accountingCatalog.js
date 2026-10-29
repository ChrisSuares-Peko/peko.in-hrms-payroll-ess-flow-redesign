const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { updatePackagePricing, updatePackagePricingBulk } = require("../../models/use-cases/package");
const { updatePartnerShare } = require("../../models/use-cases/systemUser");
const { getServicesTypeConfig } = require("../../models/use-cases/accountingServices");
const { listSubscriptionPackages: listPackages } = require("../../models/use-cases/subscriptionPackages");

const pekoServiceKeys = async () => (await getServicesTypeConfig()).peko_service_subscriptions;

const ok = (res, data, message) =>
    res.status(200).json({ status: true, data, message, responseCode: "000" });

exports.updateSubscriptionPricing = asyncHandler(async (req, res, next) => {
    const result = await updatePackagePricing(req.params.id, req.body, {
        serviceAccessCodes: await pekoServiceKeys(),
    });
    if (!result) return next(new ErrorResponse("Package not found", 404));
    return ok(res, result, "Package pricing updated successfully");
});

exports.updateSubscriptionPricingBulk = asyncHandler(async (req, res, next) => {
    const { ids, ...data } = req.body;
    const result = await updatePackagePricingBulk(ids, data, { serviceAccessCodes: await pekoServiceKeys() });
    if (!result) return next(new ErrorResponse("Something went wrong while updating pricing", 500));
    return ok(res, result, "Package pricing updated successfully");
});

exports.listSubscriptionPackages = asyncHandler(async (req, res) => {
    const { searchText, page, itemsPerPage, partnerId, sort, sortField } = req.query;
    const result = await listPackages({
        serviceAccessCodes: await pekoServiceKeys(),
        searchText,
        partnerId,
        sort,
        sortField,
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
    });
    return ok(
        res,
        { recordsTotal: result.count, recordsFiltered: result.count, data: result.rows },
        "Subscription packages fetched successfully"
    );
});

exports.updateWhitelabelShare = asyncHandler(async (req, res, next) => {
    const { sharePercentage, gatewayCharge } = req.body;
    const fields = {
        ...(sharePercentage !== undefined && { sharePercentage }),
        ...(gatewayCharge !== undefined && { gatewayCharge }),
    };
    const result = await updatePartnerShare(req.params.id, fields);
    if (!result) return next(new ErrorResponse("Partner not found", 404));
    return ok(res, result, "Partner configuration updated successfully");
});
