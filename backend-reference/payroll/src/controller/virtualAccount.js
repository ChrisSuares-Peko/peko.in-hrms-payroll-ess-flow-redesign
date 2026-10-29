const asyncHandler = require('../middleware/async');
const {
  onboardCorporateVirtualAccount,
  getCorporateVirtualAccountStatus,
  getCorporateVirtualAccountBalance,
} = require('../services/virtualAccount');

exports.onboardVirtualAccount = asyncHandler(async (req, res) => {
  const corporateUserId = req.user._id;
  const { name, pan, mobile } = req.body;

  const data = await onboardCorporateVirtualAccount({
    corporateUserId,
    name,
    pan,
    mobile,
  });

  return res.status(201).json({
    status: true,
    responseCode: '000',
    message: 'Virtual account onboarded successfully',
    data,
  });
});

exports.getVirtualAccountStatus = asyncHandler(async (req, res) => {
  const corporateUserId = req.user._id;

  const data = await getCorporateVirtualAccountStatus({ corporateUserId });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Virtual account status fetched successfully',
    data,
  });
});

exports.syncVirtualAccount = asyncHandler(async (req, res) => {
  const corporateUserId = req.user._id;
  const { virtualAccountNumber, virtualAccountIfsc, name } = req.body;

  if (!virtualAccountNumber || !virtualAccountIfsc || !name) {
    return res.status(400).json({
      status: false,
      responseCode: '001',
      message: 'virtualAccountNumber, virtualAccountIfsc and name are required',
    });
  }

  const { upsertByCorporateUser } = require('../models/use-cases/corporateVirtualAccount');
  const data = await upsertByCorporateUser(corporateUserId, {
    virtualAccountNumber: virtualAccountNumber.trim(),
    virtualAccountIfsc: virtualAccountIfsc.trim(),
    name: name.trim(),
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Virtual account synced successfully',
    data,
  });
});

exports.getVirtualAccountBalance = asyncHandler(async (req, res) => {
  const corporateUserId = req.user._id;

  const data = await getCorporateVirtualAccountBalance({ corporateUserId });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Virtual account balance fetched successfully',
    data,
  });
});
