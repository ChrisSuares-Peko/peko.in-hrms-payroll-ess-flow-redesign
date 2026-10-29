const asyncHandler = require('../middleware/async');
const {
  createVirtualAccountWithdrawal,
  listVirtualAccountWithdrawals,
  refreshVirtualAccountWithdrawalStatus,
} = require('../services/virtualAccountWithdrawal');

exports.createRemoveFundsRequest = asyncHandler(async (req, res) => {
  const data = await createVirtualAccountWithdrawal({
    corporateUserId: req.user._id,
    amount: req.body.amount,
    transferType: req.body.transferType,
    remarks: req.body.remarks,
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Remove funds request initiated successfully',
    data,
  });
});

exports.getRemoveFundsRequests = asyncHandler(async (req, res) => {
  const data = await listVirtualAccountWithdrawals({
    corporateUserId: req.user._id,
    page: req.query.page,
    limit: req.query.limit,
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Remove funds requests fetched successfully',
    data,
  });
});

exports.getRemoveFundsRequestStatus = asyncHandler(async (req, res) => {
  const data = await refreshVirtualAccountWithdrawalStatus({
    corporateUserId: req.user._id,
    referenceId: req.params.referenceId,
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Remove funds request status fetched successfully',
    data,
  });
});
