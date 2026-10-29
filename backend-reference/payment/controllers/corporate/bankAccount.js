const asyncHandler = require("../../middlewares/async");
const { fetchVirtualAccounts, fetchEscrowAccounts } = require("../../utils/decentroGateway");
const { verifyBankAccount } = require("../../utils/nupayGateway");
const { customLog } = require("../../utils/loggerHelper");
const {
  create,
  findAll,
  findOne,
  findDuplicate,
  update,
  clearPrimary,
  deleteOne,
} = require("../../models/use-cases/bankAccount");

/**
 * POST /bank-account/domestic
 */
exports.addDomesticAccount = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const { accountHolderName, bankName, accountNumber, ifscCode, currency, accountType, branchName } = req.body;

  if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
    return res.status(400).json({
      status: false,
      message: "accountHolderName, bankName, accountNumber and ifscCode are required",
      responseCode: "400",
    });
  }

  const duplicate = await findDuplicate({ credentialId, accountNumber, ifscCode });
  if (duplicate) {
    return res.status(409).json({
      status: false,
      message: "A bank account with the same account number and IFSC already exists",
      responseCode: "409",
    });
  }

  let verificationData = null;
  try {
    verificationData = await verifyBankAccount({ accountNumber, ifscCode, accountName: accountHolderName });
    customLog(req?.LogTraceId, "info", { message: "NuPay bank verification result", data: verificationData });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "NuPay bank verification failed", error: error.message });
    return res.status(400).json({
      status: false,
      message: error.message || "Bank account verification failed",
      responseCode: "400",
    });
  }

  const account = await create({
    credentialId,
    accountHolderName,
    bankName,
    accountNumber,
    ifscCode,
    currency: currency || "INR",
    accountType: accountType || "SAVINGS",
    branchName,
    status: "ACTIVE",
  });

  return res.status(201).json({
    status: true,
    message: "Bank account added successfully",
    responseCode: "000",
    data: { ...account.toJSON(), verificationData },
  });
});

/**
 * GET /bank-account/domestic
 */
exports.getDomesticAccounts = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const { status } = req.query;

  const accounts = await findAll({ credentialId, status });

  return res.status(200).json({
    status: true,
    message: "Bank accounts fetched successfully",
    responseCode: "000",
    data: accounts,
  });
});

/**
 * GET /bank-account/domestic/:id
 */
exports.getDomesticAccount = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const { id } = req.params;

  const account = await findOne(id, credentialId);
  if (!account) {
    return res.status(404).json({
      status: false,
      message: "Bank account not found",
      responseCode: "404",
    });
  }

  return res.status(200).json({
    status: true,
    message: "Bank account fetched successfully",
    responseCode: "000",
    data: account,
  });
});

/**
 * PUT /bank-account/domestic/:id
 */
exports.updateDomesticAccount = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const { id } = req.params;
  const { accountHolderName, bankName, branchName, currency, accountType, status ,accountNumber,ifscCode} = req.body;

  const existing = await findOne(id, credentialId);
  if (!existing) {
    return res.status(404).json({
      status: false,
      message: "Bank account not found",
      responseCode: "404",
    });
  }

  await update(id, credentialId, { accountHolderName, bankName, branchName, currency, accountType, status, accountNumber,ifscCode });

  const updated = await findOne(id, credentialId);

  return res.status(200).json({
    status: true,
    message: "Bank account updated successfully",
    responseCode: "000",
    data: updated,
  });
});

/**
 * PUT /bank-account/domestic/:id/primary
 */
exports.setPrimaryAccount = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const { id } = req.params;

  const existing = await findOne(id, credentialId);
  if (!existing) {
    return res.status(404).json({
      status: false,
      message: "Bank account not found",
      responseCode: "404",
    });
  }

  await clearPrimary(credentialId);
  await update(id, credentialId, { isPrimary: true });

  return res.status(200).json({
    status: true,
    message: "Primary account updated successfully",
    responseCode: "000",
  });
});

/**
 * DELETE /bank-account/domestic/:id
 */
exports.deleteDomesticAccount = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const { id } = req.params;

  const existing = await findOne(id, credentialId);
  if (!existing) {
    return res.status(404).json({
      status: false,
      message: "Bank account not found",
      responseCode: "404",
    });
  }

  if (existing.isPrimary) {
    return res.status(400).json({
      status: false,
      message: "Cannot delete the primary account. Set another account as primary first.",
      responseCode: "400",
    });
  }

  await deleteOne(id, credentialId);

  return res.status(200).json({
    status: true,
    message: "Bank account deleted successfully",
    responseCode: "000",
  });
});

// ─── Virtual Accounts ────────────────────────────────────────────────────────

/**
 * GET /bank-account/virtual
 * Fetch virtual accounts from Decentro (read-only)
 */
exports.getVirtualAccounts = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const corporateUserId = req.user.corporateId;

  const decentroResponse = await fetchVirtualAccounts({ credentialId, corporateUserId });

  return res.status(200).json({
    status: true,
    message: "Virtual accounts fetched successfully",
    responseCode: "000",
    data: decentroResponse?.data || decentroResponse,
  });
});

// ─── Escrow Accounts ─────────────────────────────────────────────────────────

/**
 * GET /bank-account/escrow
 * Fetch escrow accounts from Decentro (read-only)
 */
exports.getEscrowAccounts = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const corporateUserId = req.user.corporateId;

  const decentroResponse = await fetchEscrowAccounts({ credentialId, corporateUserId });

  return res.status(200).json({
    status: true,
    message: "Escrow accounts fetched successfully",
    responseCode: "000",
    data: decentroResponse?.data || decentroResponse,
  });
});
