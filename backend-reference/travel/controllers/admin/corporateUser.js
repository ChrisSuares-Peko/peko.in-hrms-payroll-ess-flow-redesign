const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");

const addressDetails = require("../../models/entities/addressDetails");
const { Op } = require('sequelize');
require("async");
const { createAddress, findStoredAddress, updateAddress: updateAddressUseCase, deleteAddress: deleteAddressUseCase, setDefaultAddress: setDefaultAddressUseCase } = require("../../models/use-cases/addressDetails");


exports.addAddress = asyncHandler(async (req, res, next) => {
  let data = req.body;
  data.credentialId = req.user.id
  let addressData = data
  delete addressData.default
  
  let exist = await findStoredAddress(addressData)
  if (exist) {
    return res.status(200).json({
      status: true,
      message: 'Address added successfully',
      responseCode: '000',
      data: {}
    })
  }
  let result = await createAddress(data);
  if (result) {
    return res.status(200).json({
      status: true,
      message: 'Address added successfully',
      responseCode: '000',
      data: result
    })
  } else {
    return next(new ErrorResponse(`Something went wrong while adding address`, 200));
  }
});


exports.findAllAddress = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const searchText = req.query.q;
  const isReceiver = req.query.isReceiver === 'true';
  let whereClause = {
    credentialId: credentialId,
    isReceiver: isReceiver
  };
  if (searchText) {
    whereClause[Op.or] = [
      {
        nickname: {
          [Op.like]: `%${searchText}%`
        }
      },
      {
        name: {
          [Op.like]: `%${searchText}%`
        }
      }
    ];
  }
  const result = await addressDetails.findAll({
    where: whereClause,
    nest: true,
    raw: true,
  });
  if (!result) {
    const addressDetails = {
      nickname: "Not available",
      addressLine1: "Not available",
      addressLine2: "Not available",
      phoneNumber: "Not available",
    };
    return res.status(200).json({
      status: true,
      data: addressDetails,
      message: 'fetch address successfull',
      responseCode: '000'
    });
  } else {
    return res.status(200).json({
      status: true,
      data: result,
      message: 'fetch address successfull',
      responseCode: '000'
    });
  }
});

exports.updateAddress = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const id = req.params.id;
  const updated = await updateAddressUseCase(id, credentialId, req.body);
  if (!updated) {
    return next(new ErrorResponse('Address not found', 404));
  }
  return res.status(200).json({
    status: true,
    message: 'Address updated successfully',
    responseCode: '000',
  });
});

exports.deleteAddress = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const id = req.params.id;
  const deleted = await deleteAddressUseCase(id, credentialId);
  if (!deleted) {
    return next(new ErrorResponse('Address not found', 404));
  }
  return res.status(200).json({
    status: true,
    message: 'Address deleted successfully',
    responseCode: '000',
  });
});

exports.setDefaultAddress = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const id = req.params.id;
  const updated = await setDefaultAddressUseCase(id, credentialId);
  if (!updated) {
    return next(new ErrorResponse('Address not found', 404));
  }
  return res.status(200).json({
    status: true,
    message: 'Default address updated successfully',
    responseCode: '000',
  });
});
