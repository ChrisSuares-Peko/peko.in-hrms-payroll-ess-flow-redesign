const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
    getGoLiveSettings,
    saveGoLiveDate,
    dayOf,
} = require("../../models/use-cases/accountingPeriod");

exports.getAccountingGoLiveDate = asyncHandler(async (req, res) => {
    const data = await getGoLiveSettings();
    return res.status(200).json({
        status: true,
        data,
        message: "Accounting go live date fetched successfully",
        responseCode: "000",
    });
});

exports.updateAccountingGoLiveDate = asyncHandler(async (req, res, next) => {
    const date = dayOf(req.body.date);
    if (date > dayOf(new Date())) {
        return next(new ErrorResponse("Go live date cannot be in the future", 400));
    }

    const saved = await saveGoLiveDate({
        date,
        reason: req.body.reason,
        actor: { id: req.user && req.user.id, name: req.user && req.user.name },
    });
    if (!saved) return next(new ErrorResponse("Failed to save the go live date", 500));

    return res.status(200).json({
        status: true,
        data: await getGoLiveSettings(),
        message: "Accounting go live date updated successfully",
        responseCode: "000",
    });
});
