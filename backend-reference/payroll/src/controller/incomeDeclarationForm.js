// controllers/incomeDeclarationFormController.js

const asyncHandler = require("../middleware/async");
const { createIncomeDeclarationForm, getIncomeDeclarationForm } = require('../models/use-cases/incomeDeclarationForm');
const ErrorResponse = require("../utils/error-response");
const { isEmployeeOfCorporate, sanitizeBody } = require('../utils/tenantScope');

exports.createIncomeDeclarationForm = asyncHandler(async (req, res, next) => {
  const corporateUserID = req.user._id;
  const { employee } = req.body;

  if (!(await isEmployeeOfCorporate(employee, corporateUserID))) {
    return next(new ErrorResponse('Employee not found', 404));
  }

  const data = {
    ...sanitizeBody(req.body),
    employee,
    corporateUser: corporateUserID,
  };

  const result = await createIncomeDeclarationForm(data);

  return res.status(201).json({
    status: true,
    responseCode: '000',
    message: 'Income Declaration Form submitted successfully',
    data: result,
  });
});


exports.getIncomeDeclarationForm = asyncHandler(async (req, res, next) => {
  const corporateUserID = req.user._id;
  const { employee, financialYear } = req.query;

  if (!employee || !financialYear) {
    return next(new ErrorResponse('employeeId and financialYear are required', 400));
  }

  const params = {
    corporateUserID,
    employee,
    financialYear,
  };

  const result = await getIncomeDeclarationForm(params);

if (!result || (Array.isArray(result) && result.length === 0)) {
    return res.status(200).json({
      status: true,
      responseCode: '001',
      message:
        'No income declaration found for the selected user. Please add income details.',
      data: null,
    });
  }

  return res.status(200).json({
    status: true,
    responseCode: '000',
    message: 'Income declaration form fetched successfully.',
    data: result,
  });
});