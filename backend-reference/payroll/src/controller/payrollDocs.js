const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/error-response");
const { fetchPayrollTemplatesFromOthers } = require("../services/payrollDocs");

exports.getPayrollTemplates = asyncHandler(async (req, res, next) => {
  const corporateId = req.user?.corporateId || req.user?._id;

  if (!corporateId) {
    return next(new ErrorResponse("Corporate user not found", 400));
  }

  try {
    const result = await fetchPayrollTemplatesFromOthers({
      corporateId,
      headers: req.headers,
    });

    return res.status(200).json(result);
  } catch (error) {
    return next(
      new ErrorResponse(
        error?.response?.data?.message || "Failed to fetch payroll templates",
        error?.response?.status || 500
      )
    );
  }
});
