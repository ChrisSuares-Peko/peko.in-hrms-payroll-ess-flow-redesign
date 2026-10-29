const asyncHandler = require("../../middlewares/async");
const { onboardMerchant, getMerchantList, getWalletBalance, initiateNupayTransfer, getNupayTransactionStatus } = require("../../utils/nupayGateway");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const operatorsData = require("../../utils/operatorsData.json");
const { decryptCredential, fetchNupayCredentials, encryptCredential } = require("../../utils/nupayCredentialsVault");
const {
  create: createOnboarding,
  findByCorporateId,
  updateByNupayRefNo,
} = require("../../models/use-cases/nupayMerchantOnboarding");
const { findById: findNupayBeneficiaryById } = require("../../models/use-cases/nupayBeneficiary");
const { create: createTransaction, updateStatus, findOne: findOneTransaction } = require("../../models/use-cases/payoutTransaction");
const { createEntry: createLedgerEntry } = require("../../models/use-cases/transactionLedger");
const { v4: uuidv4 } = require("uuid");

const accessKey = operatorsData.payout.accessKey;

const REQUIRED_PAYOUT_FIELDS = [
  "merchant_name", "contact_number", "official_email", "city", "state", "pincode",
  "bank_account_number", "ifsc_code",
];

const findOnboardingRecord = async (req) => {
  const paramsCorporateId = parseInt(req.params.corporateId);
  const jwtCorporateId = req.user.corporateId;
  let record = paramsCorporateId ? await findByCorporateId(paramsCorporateId) : null;
  if (!record && jwtCorporateId && jwtCorporateId !== paramsCorporateId) {
    record = await findByCorporateId(jwtCorporateId);
  }
  return record;
};

const getBaseUrl = () => {
  const env = process.env.NODE_ENV;
  if (env === "production") return process.env.PRODUCTION_URL;
  return process.env.STAGING_URL;
};

const nupayCodeToStatus = (code) => {
  if (code === "NP2000") return "SUCCESS";
  if (code === "NP5000") return "FAILED";
  if (code === "NP6000") return "ON_HOLD";
  return "PENDING";
};

exports.onboardMerchantHandler = asyncHandler(async (req, res, next) => {
  try {
    const corporateId = parseInt(req.params.corporateId) || req.user.corporateId;
    const baseUrl = getBaseUrl();
    const fields = {
      ...req.body,
      mid: req.user.username,
      client_reference_id: String(corporateId),
      product_type: "payout",
      credit_webhook_url: `${baseUrl}/api/v1/webhook/nupay/payment/wallet/credit`,
      debit_webhook_url: `${baseUrl}/api/v1/webhook/nupay/payment/payout/update`,
      refund_webhook_url: `${baseUrl}/api/v1/webhook/nupay/payment/refund`,
      onboarding_webhook_url: `${baseUrl}/api/v1/webhook/nupay/payment/onboarding-status`,
    };

    for (const field of REQUIRED_PAYOUT_FIELDS) {
      if (!fields[field]) {
        return next(new ErrorResponse(`${field} is required`, 400));
      }
    }

    const files = {};
    if (req.file) {
      files.cancelled_cheque = req.file.buffer.toString("base64");
    }

    if (!files.cancelled_cheque) {
      return next(new ErrorResponse("cancelled_cheque is required", 400));
    }

    const result = await onboardMerchant({ fields, files });

    // F-PAY-10: don't log the full onboard response — it carries vendor credentials/VA details.
    customLog(req?.LogTraceId, "info", { message: "NuPay onboardMerchant response", accessKey, success: !!result });

    const onboardingData = {
      corporateId: corporateId,
      mid: req.user.username,
      nupayRefNo: result?.nupay_ref_no || null,
      status: nupayCodeToStatus(result?.code),
      credentialsLink: result?.credentials_link || null,
      productType: result?.product_type || "payout",
      onboardedAt: result?.onboarded_at ? new Date(result.onboarded_at) : null,
      merchantName: fields.merchant_name || null,
      contactNumber: fields.contact_number || null,
      officialEmail: fields.official_email || null,
      city: fields.city || null,
      state: fields.state || null,
      pincode: fields.pincode || null,
    };

    await createOnboarding(onboardingData);

    customLog(req?.LogTraceId, "info", { message: "NuPay onboarding record saved to DB", data: onboardingData });

    return res.status(200).json({
      status: true,
      data: result,
      message: result?.message || "Merchant onboarding initiated",
      responseCode: "000",
    });
  } catch (error) {
    const nupayErrDetail = error.nupayError || error?.response?.data || error.message;
    customLog(req?.LogTraceId, "error", { message: "NuPay onboardMerchant error", error: nupayErrDetail });
    return next(new ErrorResponse(error.message || "Merchant onboarding failed", 400));
  }
});

exports.getMerchantListHandler = asyncHandler(async (req, res, next) => {
  try {
    const { start_date, end_date, offset, limit } = req.query;

    const formatDate = (d) => d.toISOString().split("T")[0];

    const result = await getMerchantList({
      startDate: start_date || "2024-01-01",
      endDate: end_date || formatDate(new Date()),
      offset: offset ? parseInt(offset) : 0,
      limit: limit ? parseInt(limit) : 100,
      mid: req.user.username,
    });

    customLog(req?.LogTraceId, "info", { message: "NuPay getMerchantList response", accessKey, data: result });

    return res.status(200).json({
      status: true,
      data: result,
      message: "Merchant list fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "NuPay getMerchantList error", error: error.message });
    return next(new ErrorResponse(error.message || "Failed to fetch merchant list", 400));
  }
});

exports.getWalletBalanceHandler = asyncHandler(async (req, res, next) => {
  try {
    const record = await findOnboardingRecord(req);
    if (!record) return next(new ErrorResponse("No onboarding record found", 404));
    if (record.status !== "SUCCESS") return next(new ErrorResponse("Merchant onboarding not completed", 400));
    if (!record.encryptedAccessKey || !record.walletAccountId) {
      return next(new ErrorResponse("Merchant credentials not available", 400));
    }

    const accessKey = decryptCredential(record.encryptedAccessKey);
    const accessSecret = decryptCredential(record.encryptedAccessSecret);

    const result = await getWalletBalance({ walletAccountId: record.walletAccountId, accessKey, accessSecret });

    customLog(req?.LogTraceId, "info", { message: "NuPay getWalletBalance response", data: result });

    return res.status(200).json({
      status: true,
      data: {
        walletAccountId: result.id,
        availableBalance: result.available_balance,
        totalBalance: result.total_balance,
        vaAccountNumber: result.va_account_number,
        vaIfscCode: result.va_ifsc_code,
      },
      message: "Wallet balance fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "NuPay getWalletBalance error", error: error.message });
    return next(new ErrorResponse(error.message || "Failed to fetch wallet balance", 400));
  }
});

const nupayStatusToTxn = (status) => {
  if (!status) return "PENDING";
  const s = status.toLowerCase();
  if (s === "success" || s === "completed") return "COMPLETED";
  if (s === "failed" || s === "failure") return "FAILED";
  return "PENDING";
};

exports.initiateNupayPayoutHandler = asyncHandler(async (req, res, next) => {
  try {
    const corporateId = parseInt(req.params.corporateId) || req.user.corporateId;
    const { beneficiaryId, amount, transferType, category, remarks } = req.body;

    if (!beneficiaryId || !amount || !category) {
      return next(new ErrorResponse("beneficiaryId, amount and category are required", 400));
    }

    // F-PAY-15: reject non-numeric / non-positive payout amounts before the vendor call and ledger write.
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return next(new ErrorResponse("A valid positive amount is required", 400));
    }

    const beneficiary = await findNupayBeneficiaryById(beneficiaryId, corporateId);
    customLog(req?.LogTraceId, "info", { message: "NuPay initiateNupayPayout beneficiary lookup", beneficiaryId, corporateId, beneficiaryFound: !!beneficiary });
    if (!beneficiary) return next(new ErrorResponse("Beneficiary not found", 404));

    customLog(req?.LogTraceId, "info", { message: "NuPay beneficiary verification status check", beneficiaryId, verificationStatus: beneficiary.verificationStatus });
    // if (beneficiary.verificationStatus !== "VERIFIED") {
    //   return next(new ErrorResponse("Beneficiary bank account is not verified", 400));
    // }

    let record = await findOnboardingRecord(req);
    if (!record) return next(new ErrorResponse("No NuPay onboarding record found", 404));
    if (record.status !== "SUCCESS") return next(new ErrorResponse("Merchant onboarding not completed", 400));

    // F-PAY-10: log only identifiers — the record holds the encrypted access key / wallet account.
    customLog(req?.LogTraceId, "info", { message: "NuPay initiateNupayPayout record", recordId: record?.id, status: record?.status });

    if (!record.encryptedAccessKey || !record.walletAccountId) {
      if (!record.credentialsLink || !record.contactNumber) {
        return next(new ErrorResponse("Merchant credentials not available", 400));
      }
      try {
        customLog(req?.LogTraceId, "info", { message: "NuPay credentials missing, fetching from vault", nupayRefNo: record.nupayRefNo });
        const { accessKey: ak, accessSecret: as_, providerId, walletAccountId, vaNumber, vaIfsc } = await fetchNupayCredentials(record.credentialsLink, record.contactNumber);
        const credUpdateData = {};
        if (ak) credUpdateData.encryptedAccessKey = encryptCredential(ak);
        if (as_) credUpdateData.encryptedAccessSecret = encryptCredential(as_);
        if (providerId) credUpdateData.providerId = providerId;
        if (walletAccountId) credUpdateData.walletAccountId = walletAccountId;
        if (vaNumber) credUpdateData.vaNumber = vaNumber;
        if (vaIfsc) credUpdateData.vaIfsc = vaIfsc;
        await updateByNupayRefNo(record.nupayRefNo, credUpdateData);
        record = await findOnboardingRecord(req);
      } catch (err) {
        customLog(req?.LogTraceId, "error", { message: "NuPay failed to fetch credentials from vault", error: err.message });
        return next(new ErrorResponse("Merchant credentials not available", 400));
      }
    }

    if (!record.encryptedAccessKey || !record.walletAccountId) {
      return next(new ErrorResponse("Merchant credentials not available after vault fetch", 400));
    }

    const accessKey = decryptCredential(record.encryptedAccessKey);
    const accessSecret = decryptCredential(record.encryptedAccessSecret);

    const referenceId = `PAY${uuidv4().replace(/-/g, "").slice(0, 13).toUpperCase()}`;

    const transaction = await createTransaction({
      credentialId: corporateId,
      payoutBeneficiaryId: null,
      category,
      amount,
      payeeName: beneficiary.fullName,
      remarks,
      referenceId,
      transferType: transferType || "IMPS",
      status: "PENDING",
      transactionDate: new Date(),
    });

    await createLedgerEntry({
      credentialId: corporateId,
      transactionId: referenceId,
      type: "DEBIT",
      amount,
      source: "PAYOUT",
      status: "PENDING",
      referenceId,
      payoutTransactionId: transaction.id,
      remarks: remarks || `Payout to ${beneficiary.fullName}`,
    });

    customLog(req?.LogTraceId, "info", { message: "NuPay initiating transfer", referenceId, amount, beneficiaryId, walletAccountId: record.walletAccountId });

    let nupayResponse;
    try {
      nupayResponse = await initiateNupayTransfer({
        walletAccountId: record.walletAccountId,
        accessKey,
        accessSecret,
        amount,
        transferType: transferType || "IMPS",
        referenceId,
        remarks: remarks || `Payout to ${beneficiary.fullName}`,
        beneficiary,
      });
    } catch (err) {
      await updateStatus(transaction.id, "FAILED", null);
      customLog(req?.LogTraceId, "error", { message: "NuPay transfer failed", error: err.message });
      return next(new ErrorResponse(err.message || "Payout initiation failed", 400));
    }

    const nupayTxnId = nupayResponse?.id || nupayResponse?.transaction_id || null;
    const finalStatus = nupayStatusToTxn(nupayResponse?.status);

    await updateStatus(transaction.id, finalStatus, nupayTxnId);

    customLog(req?.LogTraceId, "info", { message: "NuPay payout response", data: nupayResponse });

    return res.status(200).json({
      status: true,
      message: "Payout initiated successfully",
      responseCode: "000",
      data: {
        transactionId: transaction.id,
        referenceId,
        nupayTransactionId: nupayTxnId,
        transactionStatus: finalStatus,
        nupayResponse,
      },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "NuPay initiatePayout error", error: error.message });
    return next(new ErrorResponse(error.message || "Payout failed", 400));
  }
});

exports.getNupayPayoutStatusHandler = asyncHandler(async (req, res, next) => {
  try {
    const corporateId = parseInt(req.params.corporateId) || req.user.corporateId;
    const { id } = req.params;
    const transaction = await findOneTransaction(id, corporateId);
    if (!transaction) return next(new ErrorResponse("Transaction not found", 404));

    if (transaction.status !== "PENDING") {
      return res.status(200).json({
        status: true,
        message: "Transaction status fetched",
        responseCode: "000",
        data: { transactionStatus: transaction.status, nupayTransactionId: transaction.decentroTxnId },
      });
    }

    if (!transaction.decentroTxnId) {
      return res.status(200).json({
        status: true,
        message: "Transaction status fetched",
        responseCode: "000",
        data: { transactionStatus: "PENDING", nupayTransactionId: null },
      });
    }

    const record = await findOnboardingRecord(req);
    if (!record || !record.encryptedAccessKey) return next(new ErrorResponse("Merchant credentials not available", 400));

    const accessKey = decryptCredential(record.encryptedAccessKey);
    const accessSecret = decryptCredential(record.encryptedAccessSecret);

    const statusResult = await getNupayTransactionStatus({
      walletAccountId: record.walletAccountId,
      accessKey,
      accessSecret,
      nupayTransactionId: transaction.decentroTxnId,
    });

    const finalStatus = nupayStatusToTxn(statusResult?.status);
    if (finalStatus !== "PENDING") {
      await updateStatus(transaction.id, finalStatus, transaction.decentroTxnId);
    }

    customLog(req?.LogTraceId, "info", { message: "NuPay transaction status", data: statusResult });

    return res.status(200).json({
      status: true,
      message: "Transaction status fetched",
      responseCode: "000",
      data: { transactionStatus: finalStatus, nupayTransactionId: transaction.decentroTxnId },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "NuPay getPayoutStatus error", error: error.message });
    return next(new ErrorResponse(error.message || "Failed to fetch transaction status", 400));
  }
});

exports.getOnboardingStatusHandler = asyncHandler(async (req, res, next) => {
  try {
    const paramsCorporateId = parseInt(req.params.corporateId);
    const jwtCorporateId = req.user.corporateId;
    const record = await findOnboardingRecord(req);
    customLog(req?.LogTraceId, "info", {
      message: "NuPay getOnboardingStatus lookup",
      paramsCorporateId,
      jwtCorporateId,
      recordFound: !!record,
      recordCorporateId: record?.corporateId || null,
      recordStatus: record?.status || null,
      hasCredentials: !!record?.encryptedAccessKey,
      hasAccessSecret: !!record?.encryptedAccessSecret,
      hasWalletAccountId: !!record?.walletAccountId,
      hasVaNumber: !!record?.vaNumber,
      hasProviderId: !!record?.providerId,
      hasCredentialsLink: !!record?.credentialsLink,
      hasContactNumber: !!record?.contactNumber,
      mid: record?.mid || null,
      nupayRefNo: record?.nupayRefNo || null,
    });

    if (!record) {
      return res.status(200).json({
        status: true,
        data: null,
        message: "No onboarding record found",
        responseCode: "000",
      });
    }

    return res.status(200).json({
      status: true,
      data: {
        mid: record.mid,
        nupayRefNo: record.nupayRefNo,
        onboardingStatus: record.status,
        credentialsLink: record.credentialsLink,
        productType: record.productType,
        onboardedAt: record.onboardedAt,
        createdAt: record.createdAt,
        vaNumber: record.vaNumber || null,
        vaIfsc: record.vaIfsc || null,
        ...(record.status === "FAILED" || record.status === "ON_HOLD" ? { rejectionReason: record.rejectionReason } : {}),
      },
      message: "Onboarding status fetched successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "NuPay getOnboardingStatus error", error: error.message });
    return next(new ErrorResponse(error.message || "Failed to fetch onboarding status", 400));
  }
});
