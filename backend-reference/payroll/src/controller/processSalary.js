const asyncHandler = require('../middleware/async');
const {
  getProcessSalaryDetails,
  getProcessSalaryEmployees,
  processSalaryPayouts,
  refreshProcessSalaryStatus,
} = require('../services/processSalary');

exports.getProcessSalaryDetails = asyncHandler(async (req, res) => {
  const data = await getProcessSalaryDetails({
    corporateUserId: req.user._id,
    month: req.query.month,
    year: req.query.year,
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Process salary details fetched successfully',
    data,
  });
});

exports.getProcessSalaryEmployees = asyncHandler(async (req, res) => {
  const data = await getProcessSalaryEmployees({
    corporateUserId: req.user._id,
    month: req.query.month,
    year: req.query.year,
    page: req.query.page,
    limit: req.query.limit,
    searchText: req.query.searchText,
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Process salary employees fetched successfully',
    data,
  });
});

exports.processSalary = asyncHandler(async (req, res) => {
  const data = await processSalaryPayouts({
    corporateUserId: req.user._id,
    month: req.body.month,
    year: req.body.year,
    salaryIds: req.body.salaryIds,
    remarks: req.body.remarks,
    rawRequest: req.body,
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Salary processing initiated successfully',
    data,
  });
});

exports.getProcessSalaryStatus = asyncHandler(async (req, res) => {
  const data = await refreshProcessSalaryStatus({
    corporateUserId: req.user._id,
    batchReferenceId: req.params.batchReferenceId,
  });

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Salary payout status fetched successfully',
    data,
  });
});
