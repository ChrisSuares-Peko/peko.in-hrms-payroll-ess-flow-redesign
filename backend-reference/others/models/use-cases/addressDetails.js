const asyncHandler = require("./../../middlewares/async");
const addressDetails = require("./../entities/addressDetails");
const {Op} = require('sequelize')

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

exports.findOneAddress = asyncHandler(async (params) => {
  return await addressDetails.findOne({
    where: {
      id: params.addressId,
      credentialId: params.credentialId,
    },
  });
});

exports.updateAddress = asyncHandler(async (data) => {
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
  return await addressDetails.update(data, {
    where: {
      id: data.id,
    },
  });
});

exports.deleteAddress = asyncHandler(async (params) => {
  const address = await addressDetails.findOne({
    where: {
      id: params.id,
      credentialId: params.credentialId,
    },
  });
  if (!address) {
    return null;
  }
  if (address.default == true) {
    const newDefault = await addressDetails.findOne({
      where: {
        credentialId: address.credentialId,
        id: { [Op.ne]: address.id },
      },
    });

    if (newDefault) {
      await newDefault.update({ default: true });
    }
  }
  return await addressDetails.destroy({
    where: {
      id: params.id,
      credentialId: params.credentialId,
    },
  });
});
exports.findOneDefaultAddress = asyncHandler(async (params) => {
  return await addressDetails.findOne({
    where: {
      credentialId: params.credentialId,
      default: true
    },
  });
});