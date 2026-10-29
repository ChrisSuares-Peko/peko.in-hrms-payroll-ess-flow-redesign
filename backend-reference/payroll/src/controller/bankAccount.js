const asyncHandler = require('../middleware/async');
const {
  verifyAndSaveBankAccount,
  getCorporateBankAccount,
} = require('../services/bankAccount');

exports.verifyBankAccount = asyncHandler(async (req, res) => {
  const corporateUserId = req.user._id;
  const { accountHolderName, accountNumber, ifscCode, branch } = req.body;

  const data = await verifyAndSaveBankAccount({
    corporateUserId,
    accountHolderName,
    accountNumber,
    ifscCode,
    branch,
  });

  return res.status(201).json({
    status: true,
    responseCode: '000',
    message: 'Bank account verified successfully',
    data,
  });
});

exports.getBankAccountStatus = asyncHandler(async (req, res) => {
  const corporateUserId = req.user._id;

  const data = await getCorporateBankAccount({ corporateUserId });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Bank account status fetched successfully',
    data,
  });
});
