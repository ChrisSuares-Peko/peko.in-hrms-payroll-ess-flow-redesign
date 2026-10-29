const asyncHandler = require("../../middlewares/async");
const Package = require("../entities/package");

exports.findOne = asyncHandler(async (params) => {
  return await Package.findOne({
    where: params,
  });
});