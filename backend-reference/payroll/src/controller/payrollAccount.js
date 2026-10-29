const asyncHandler = require('../middleware/async');
const { getPayrollAccountStatus } = require('../services/payrollAccount');

exports.getPayrollAccountStatus = asyncHandler(async (req, res) => {
  const corporateUserId = req.user._id;

  const data = await getPayrollAccountStatus({ corporateUserId });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Payroll account status fetched successfully',
    data,
  });
});
