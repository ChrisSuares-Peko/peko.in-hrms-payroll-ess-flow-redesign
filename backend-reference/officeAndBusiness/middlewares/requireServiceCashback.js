const { fetchServiceDetails } = require("../utils/checkAndFetchServiceDetails");
const asyncHandler = require("./async");
const ErrorResponse = require("../utils/error-response");

/**
 * Route-group gate (factory). Before any operation runs, resolves the service
 * operator for `accessKey` and confirms cashback is configured for the corporate
 * user's active package via fetchServiceDetails — the same check other services
 * run before their operations. Blocks with the service's error message if the
 * service is unavailable/disabled or no cashback is set up for the package.
 *
 * On success the resolved service + cashback details are attached to
 * req.serviceDetails for downstream handlers.
 *
 * Apply with: router.use(requireServiceCashback('<accessKey>'))
 */
exports.requireServiceCashback = (accessKey) =>
    asyncHandler(async (req, res, next) => {
        const serviceDetails = await fetchServiceDetails({
            credentialId: req.user?.id,
            accessKey,
            packageId: req.user?.packageId,
            corporateUserId: req.user?.corporateId,
        });

        if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
            return next(new ErrorResponse(serviceDetails?.error || "Service not available", 400));
        }

        req.serviceDetails = serviceDetails;
        return next();
    });
