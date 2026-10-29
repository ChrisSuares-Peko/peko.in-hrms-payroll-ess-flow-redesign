const asyncHandler = require("../../middlewares/async");
const { getASetting, upsertSetting } = require("../../models/use-cases/setting");
const ErrorResponse = require("../../utils/error-response");

const settingName = "popular_domain_tlds";
const DEFAULT_TLDS = ["com", "in", "net", "org", "io", "co"];

exports.getDomainTlds = asyncHandler(async (req, res) => {
    let result = await getASetting(settingName);
    if (!result || (Array.isArray(result) && result.length === 0)) {
        result = await upsertSetting(settingName, DEFAULT_TLDS);
    }
    return res.status(200).json({
        status: true,
        message: "Domain TLDs fetched successfully.",
        data: result,
        responseCode: "000",
    });
});

exports.updateDomainTlds = asyncHandler(async (req, res, next) => {
    const { tlds } = req.body;

    if (!Array.isArray(tlds)) {
        return next(new ErrorResponse("TLDs must be an array", 400));
    }
    if (tlds.length === 0) {
        return next(new ErrorResponse("At least one TLD is required", 400));
    }
    if (tlds.length > 6) {
        return next(new ErrorResponse("You can only add up to 6 TLDs", 400));
    }

    const invalid = tlds.some(t => typeof t !== "string" || !/^[a-z0-9.]+$/.test(t) || t.length === 0);
    if (invalid) {
        return next(new ErrorResponse("Each TLD must be a non-empty lowercase string (letters, numbers, dots only)", 400));
    }

    if (new Set(tlds).size !== tlds.length) {
        return next(new ErrorResponse("Duplicate TLD values are not allowed", 400));
    }

    const result = await upsertSetting(settingName, tlds);
    if (!result) {
        return next(new ErrorResponse("Something went wrong while updating TLDs", 400));
    }
    return res.status(200).json({
        status: true,
        message: "Domain TLDs updated successfully.",
        data: result,
        responseCode: "000",
    });
});
