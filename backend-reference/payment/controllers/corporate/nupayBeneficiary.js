const asyncHandler = require("../../middlewares/async");
const { verifyBankAccount } = require("../../utils/nupayGateway");
const { create, findAllByCorporateId, findDuplicate, findById, updateById, deleteById } = require("../../models/use-cases/nupayBeneficiary");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");

exports.addBeneficiaryHandler = asyncHandler(async (req, res, next) => {
  try {
    const corporateId = parseInt(req.params.corporateId) || req.user.corporateId;
    const {
      type, beneficiaryType, paymentCategory,
      name, fullName,
      email,
      mobile, phoneNumber,
      accountNumber, ifscCode, bankName, branchName, upiId, pan, address,
    } = req.body;

    const resolvedName = fullName || name;
    const resolvedType = beneficiaryType || type;
    const resolvedPhone = phoneNumber || mobile;

    if (!resolvedName) return next(new ErrorResponse("name is required", 400));
    if (!accountNumber) return next(new ErrorResponse("accountNumber is required", 400));
    if (!ifscCode) return next(new ErrorResponse("ifscCode is required", 400));

    const duplicate = await findDuplicate(corporateId, accountNumber, ifscCode);
    if (duplicate) return next(new ErrorResponse("Beneficiary with this account number and IFSC already exists", 400));

    const verificationResult = await verifyBankAccount({ accountNumber, ifscCode, accountName: resolvedName });

    customLog(req?.LogTraceId, "info", { message: "NuPay bank verification result", data: verificationResult });

    const isVerified = verificationResult?.status === true || verificationResult?.Status === true;

    const beneficiary = await create({
      corporateId: corporateId,
      beneficiaryType: resolvedType || "INDIVIDUAL",
      paymentCategory: paymentCategory || null,
      fullName: resolvedName,
      email: email || null,
      phoneNumber: resolvedPhone || null,
      accountNumber,
      ifscCode,
      bankName: bankName || null,
      branchName: branchName || null,
      upiId: upiId || null,
      pan: pan || null,
      address: address || null,
      verificationStatus: isVerified ? "VERIFIED" : "FAILED",
      verifiedAt: isVerified ? new Date() : null,
    });

    return res.status(200).json({
      status: true,
      data: beneficiary,
      message: isVerified ? "Beneficiary added and verified successfully" : "Beneficiary added but verification failed",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "NuPay addBeneficiary error", error: error.message });
    return next(new ErrorResponse(error.message || "Failed to add beneficiary", 400));
  }
});

exports.getBeneficiariesHandler = asyncHandler(async (req, res, next) => {
  try {
    const corporateId = parseInt(req.params.corporateId) || req.user.corporateId;
    const beneficiaries = await findAllByCorporateId(corporateId);

    return res.status(200).json({
      status: true,
      data: beneficiaries,
      message: "Beneficiaries fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "NuPay getBeneficiaries error", error: error.message });
    return next(new ErrorResponse(error.message || "Failed to fetch beneficiaries", 400));
  }
});

exports.updateBeneficiaryHandler = asyncHandler(async (req, res, next) => {
  try {
    const corporateId = parseInt(req.params.corporateId) || req.user.corporateId;
    const { id } = req.params;
    const { fullName, name, email, phoneNumber, mobile, bankName, branchName, paymentCategory, address, panNumber, upiId } = req.body;
    const resolvedName = fullName || name;
    const resolvedPhone = phoneNumber || mobile;

    const existing = await findById(id, corporateId);
    if (!existing) return next(new ErrorResponse("Beneficiary not found", 404));

    await updateById(id, corporateId, { fullName: resolvedName, email, phoneNumber: resolvedPhone, bankName, branchName, paymentCategory, address, panNumber, upiId });

    return res.status(200).json({ status: true, message: "Beneficiary updated successfully", responseCode: "000" });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "NuPay updateBeneficiary error", error: error.message });
    return next(new ErrorResponse(error.message || "Failed to update beneficiary", 400));
  }
});

exports.deleteBeneficiaryHandler = asyncHandler(async (req, res, next) => {
  try {
    const corporateId = parseInt(req.params.corporateId) || req.user.corporateId;
    const { id } = req.params;

    const existing = await findById(id, corporateId);
    if (!existing) return next(new ErrorResponse("Beneficiary not found", 404));

    await deleteById(id, corporateId);

    return res.status(200).json({ status: true, message: "Beneficiary deleted successfully", responseCode: "000" });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "NuPay deleteBeneficiary error", error: error.message });
    return next(new ErrorResponse(error.message || "Failed to delete beneficiary", 400));
  }
});
