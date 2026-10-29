const asyncHandler = require("../middlewares/async");
const {
  findOneWithCredentialId,
} = require("../models/use-cases/corporateUser");
const ErrorResponse = require("../utils/error-response");

exports.payrollAuthentication = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;
  const corporateUser = await findOneWithCredentialId(userId);

  if (!corporateUser) {
    return next(new ErrorResponse(`User not found`, 404));
  }
  const companyDetails = {
    companyName: corporateUser?.companyName,
    logo: corporateUser?.logo,
    country: corporateUser?.country,
    city: corporateUser?.city,
    mobileNo: corporateUser?.mobileNo,
    website: corporateUser?.website,
    email: corporateUser?.email,
  };
  res.status(200).json({
    status: true,
    message: "Authentication successful",
    data: { ...companyDetails, userId },
    responseCode: "000",
  });
});
