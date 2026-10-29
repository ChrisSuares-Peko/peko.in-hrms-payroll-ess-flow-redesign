const payouts = require("./../entities/payout");
const asyncHandler = require("./../../middlewares/async");

exports.createLeanPayout = asyncHandler(async (params) => {
  return await payouts.create(params);
});