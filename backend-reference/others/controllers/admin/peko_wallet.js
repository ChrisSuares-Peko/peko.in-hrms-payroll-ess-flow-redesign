const asyncHandler = require("../../middlewares/async");
const { getASetting, upsertSetting } = require("../../models/use-cases/setting");
const ErrorResponse = require("../../utils/error-response");
const settingName = "predefined_wallet_denominations";

exports.updateWalletDenominations = asyncHandler(async (req, res, next) => {
  const { denominations } = req.body;

  if (!Array.isArray(denominations)) {
    return next(new ErrorResponse("Denominations must be an array", 400));
  }

  if (denominations.length === 0) {
    return next(new ErrorResponse("At least one denomination is required", 400));
  }

  if (denominations.length > 6) {
    return next(new ErrorResponse("You can only add up to 6 denominations", 400));
  }

  const invalid = denominations.some(
    (d) => typeof d !== "number" || !Number.isInteger(d) || d <= 0
  );
  if (invalid) {
    return next(new ErrorResponse("Each denomination must be a positive integer", 400));
  }

  if (new Set(denominations).size !== denominations.length) {
    return next(new ErrorResponse("Duplicate denomination values are not allowed", 400));
  }

  const result = await upsertSetting(settingName, denominations);
  if (!result) {
    return next(new ErrorResponse("Something went wrong while updating denominations", 400));
  }
  return res.status(200).json({
    status: true,
    message: "Wallet denomination updated successfully.",
    data: result,
    responseCode: "000",
  });
});

exports.getWalletDenominations = asyncHandler(async (req, res) => {
  let result;
  result = await getASetting(settingName);
  if (!result || (Array.isArray(result) && result.length === 0)) {
    result = await upsertSetting(settingName, [500, 1000, 1500, 2000, 2500, 3000]);
  }
  return res.status(200).json({
    status: true,
    message: "Wallet denomination fetched successfully.",
    data: result,
    responseCode: "000",
  });
});
