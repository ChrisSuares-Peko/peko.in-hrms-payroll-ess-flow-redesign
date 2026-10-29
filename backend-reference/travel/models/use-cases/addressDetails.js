const asyncHandler = require("../../middlewares/async");
const addressDetails = require("../entities/addressDetails");

exports.createAddress = asyncHandler(async (data) => {
  if (data.default === true) {
    await addressDetails.update(
      { default: false },
      {
        where: {
          credentialId: data.credentialId,
        },
      }
    );
  }
  return await addressDetails.create(data);
});

exports.findStoredAddress = asyncHandler(async (params) => {
  return await addressDetails.findOne({
    where: params,
  });
});

exports.updateAddress = asyncHandler(async (id, credentialId, data) => {
  const [rowsUpdated] = await addressDetails.update(data, {
    where: { id, credentialId },
  });
  return rowsUpdated > 0;
});

exports.deleteAddress = asyncHandler(async (id, credentialId) => {
  const rowsDeleted = await addressDetails.destroy({
    where: { id, credentialId },
  });
  return rowsDeleted > 0;
});

exports.setDefaultAddress = asyncHandler(async (id, credentialId) => {
  await addressDetails.update({ default: false }, { where: { credentialId } });
  const [rowsUpdated] = await addressDetails.update(
    { default: true },
    { where: { id, credentialId } }
  );
  return rowsUpdated > 0;
});

