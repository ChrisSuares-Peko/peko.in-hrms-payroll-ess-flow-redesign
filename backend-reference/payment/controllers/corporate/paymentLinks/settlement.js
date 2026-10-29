const {
  asyncHandler,
  getVirtualAccountBalance,
  findOnboardingByCredential,
  initiateTransfer,
  createSettlementRequest,
  findSettlementRequestsByCredential,
  syncLedgerEntry,
  v4,
  ErrorResponse,
  customLog,
  PAYMENT_SUCCESS_STATUSES,
  PAYMENT_FAILED_STATUSES,
} = require("./common");

exports.createSettlementRequest = asyncHandler(async (req, res, next) => {
  const credentialId = req.user?.id;
  const { amount, transferType = "IMPS", remarks = "" } = req.body;

  const onboarding = await findOnboardingByCredential(credentialId);

  if (!onboarding || onboarding.status !== "active") {
    return res.status(400).json({
      status: false,
      message: "Payment links onboarding is not active",
      responseCode: "001",
      data: {},
    });
  }

  if (!onboarding.virtualAccountNumber) {
    return res.status(400).json({
      status: false,
      message: "Virtual account not set up yet",
      responseCode: "001",
      data: {},
    });
  }

  if (!onboarding.accountNumber || !onboarding.ifsc) {
    return res.status(400).json({
      status: false,
      message: "Settlement bank account details are missing from onboarding",
      responseCode: "001",
      data: {},
    });
  }

  // Fetch available balance from Decentro
  let availableBalance = null;
  try {
    const balanceResponse = await getVirtualAccountBalance({
      virtualAccountNumber: onboarding.virtualAccountNumber,
    });
    const providerData = balanceResponse?.data || {};
    availableBalance =
      providerData?.account_balance?.current_balance != null
        ? Number(providerData.account_balance.current_balance)
        : providerData?.current_balance != null
        ? Number(providerData.current_balance)
        : null;
  } catch (balanceErr) {
    customLog(req?.LogTraceId, "error", { message: "Error fetching virtual account balance in createSettlementRequest", error: balanceErr?.message });
    return res.status(502).json({
      status: false,
      message: "Could not fetch virtual account balance. Please try again.",
      responseCode: "502",
      data: {},
    });
  }

  if (availableBalance === null) {
    return res.status(502).json({
      status: false,
      message: "Virtual account balance is unavailable. Please try again.",
      responseCode: "502",
      data: {},
    });
  }

  if (amount > availableBalance) {
    return res.status(400).json({
      status: false,
      message: `Requested amount (${amount}) exceeds available balance (${availableBalance})`,
      responseCode: "400",
      data: { availableBalance },
    });
  }

  const referenceId = v4();

  // Initiate transfer via Decentro
  let transferResult = null;
  try {
    transferResult = await initiateTransfer({
      referenceId,
      amount,
      transferType,
      beneficiaryDetails: {
        name: onboarding.accountHolderName || onboarding.businessName,
        accountNumber: onboarding.accountNumber,
        ifscCode: onboarding.ifsc,
        mobile: onboarding.phone || null,
      },
    });
  } catch (transferError) {
    customLog(req?.LogTraceId, "error", { message: "Error initiating settlement transfer", error: transferError?.message });
    return next(new ErrorResponse(
      transferError?.message || "Settlement transfer initiation failed",
      502
    ));
  }

  const decentroTxnId = transferResult?.data?.decentro_txn_id || transferResult?.decentro_txn_id || null;
  const providerStatus = String(
    transferResult?.data?.transaction_status || transferResult?.transaction_status || "PENDING"
  ).toUpperCase();

  const settlementStatus = PAYMENT_SUCCESS_STATUSES.has(providerStatus)
    ? "SUCCESS"
    : PAYMENT_FAILED_STATUSES.has(providerStatus)
    ? "FAILED"
    : "PENDING";

  const settledAt = settlementStatus === "SUCCESS" ? new Date() : null;

  // Persist settlement request record
  const record = await createSettlementRequest({
    credentialId,
    amount,
    transferType,
    referenceId,
    decentroTxnId,
    status: settlementStatus,
    beneficiaryName: onboarding.accountHolderName || onboarding.businessName || null,
    beneficiaryAccountNumber: onboarding.accountNumber,
    beneficiaryIfsc: onboarding.ifsc,
    settledAt,
    metadata: {
      providerResponse: transferResult || null,
      virtualAccountNumber: onboarding.virtualAccountNumber,
      remarks: remarks || null,
    },
  });

  // Create ledger DEBIT entry (money leaving the virtual account)
  await syncLedgerEntry(
    req,
    "createSettlementRequest",
    {
      transactionId: decentroTxnId || referenceId,
      type: "DEBIT",
      amount,
      source: "PAYOUT",
      status: settlementStatus,
      referenceId: referenceId,
      credentialId,
      metadata: {
        providerResponse: transferResult || null,
        transferType,
        beneficiaryAccountNumber: onboarding.accountNumber,
        beneficiaryIfsc: onboarding.ifsc,
      },
    },
    {
      source: "PAYOUT",
      transactionId: decentroTxnId || referenceId,
      corporateUser: credentialId,
    }
  );

  return res.status(200).json({
    status: true,
    message: "Settlement request initiated successfully",
    responseCode: "000",
    data: {
      id: record.id,
      referenceId,
      decentroTxnId,
      amount,
      transferType,
      status: settlementStatus,
      settledAt,
      availableBalance,
      providerResponse: transferResult,
    },
  });
});

exports.getSettlementRequests = asyncHandler(async (req, res) => {
  const credentialId = req.user?.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 10);

  const { count, rows } = await findSettlementRequestsByCredential({
    credentialId,
    page: page - 1,
    limit,
  });

  return res.status(200).json({
    status: true,
    message: "Settlement requests fetched successfully",
    responseCode: "000",
    data: {
      rows,
      count,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  });
});
