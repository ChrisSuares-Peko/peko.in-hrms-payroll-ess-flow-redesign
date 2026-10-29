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

/**
 * Check whether an address with the same core fields already exists for this
 * user — prevents duplicates when the same delivery address is used across
 * multiple checkouts.
 */
exports.findAddressByFields = asyncHandler(async ({ credentialId, addressLine1, zipCode }) => {
  return await addressDetails.findOne({
    where: {
      credentialId,
      addressLine1,
      ...(zipCode ? { zipCode } : {}),
    },
  });
});

/**
 * Create a new saved address. If this is the user's first address the
 * beforeCreate hook on the model will auto-flag it as the default.
 */
exports.createAddress = asyncHandler(async (data) => {
  if (data.default === true) {
    await addressDetails.update(
      { default: false },
      { where: { credentialId: data.credentialId } }
    );
  }
  return await addressDetails.create(data);
});