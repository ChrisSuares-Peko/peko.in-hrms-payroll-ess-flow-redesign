const asyncHandler = require("./../../middlewares/async");
const addressDetails = require("./../entities/addressDetails");

exports.findOneDefaultAddress = asyncHandler(async (params) => {
  return await addressDetails.findOne({
    where: {
      default: params.default,
      credentialId: params.credentialId,
    },
  });
});