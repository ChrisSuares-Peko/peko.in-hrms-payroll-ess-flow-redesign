const {
  asyncHandler,
  getVirtualAccountBalanceV2,
  getVirtualAccountStatementV2,
  findOnboardingByCredential,
  deactivateVirtualAccount: deactivateVAOnDecentro,
  suspendOnboarding,
  loadUnloadVirtualAccount: loadUnloadVAOnDecentro,
  updateVirtualAccount: updateVAOnDecentro,
  updateOnboardingProfile,
  findCorporateUserByCredentialId,
} = require("./common");
const { generateExcelBufferAndType } = require("../../../utils/generateExcelBufferAndType");

const normalizeStatementProviderData = (providerData = {}) => {
  const rawRows = Array.isArray(providerData?.transactions)
    ? providerData.transactions
    : Array.isArray(providerData?.statement)
    ? providerData.statement
    : Array.isArray(providerData?.entries)
    ? providerData.entries
    : [];

  const transactions = rawRows.map((row) => ({
    ...row,
    transaction_id:
      row?.transaction_id ||
      row?.utr ||
      row?.reference_number ||
      row?.txn_id ||
      null,
    transaction_date:
      row?.transaction_date ||
      row?.date_time ||
      row?.timestamp ||
      row?.transactionTime ||
      row?.created_at ||
      null,
    transaction_amount:
      row?.transaction_amount ?? row?.amount ?? row?.value ?? null,
    transaction_type:
      row?.transaction_type || row?.type || row?.entry_type || null,
    transaction_remarks:
      row?.transaction_remarks ||
      row?.narration ||
      row?.description ||
      row?.remarks ||
      null,
    payment_mode: row?.payment_mode || row?.mode || null,
    payer_name: row?.payer_name || row?.remitter_name || null,
    payer_account_number:
      row?.payer_account_number || row?.remitter_account || null,
    payer_ifsc: row?.payer_ifsc || row?.remitter_ifsc || null,
    transfer_type: row?.transfer_type || row?.transfer_mode || null,
    customer_reference_number:
      row?.customer_reference_number ||
      row?.utr ||
      row?.reference_number ||
      null,
  }));

  return {
    ...providerData,
    transactions,
    total_amount_paid:
      providerData?.total_amount_paid ??
      providerData?.summary?.total_amount_paid ??
      providerData?.totalAmountPaid ??
      0,
    total_amount_received:
      providerData?.total_amount_received ??
      providerData?.summary?.total_amount_received ??
      providerData?.totalAmountReceived ??
      0,
    total_transactions:
      providerData?.total_transactions ??
      providerData?.summary?.total_transactions ??
      providerData?.totalTransactions ??
      transactions.length,
  };
};

exports.getVirtualAccountBalance = asyncHandler(async (req, res) => {
  const credentialId = req.user?.id;
  if (!credentialId) {
    return res.status(400).json({
      status: false,
      message: "Credential (user) id missing",
      responseCode: "001",
      data: {},
    });
  }

  const onboarding = await findOnboardingByCredential(credentialId);
  if (!onboarding) {
    return res.status(400).json({
      status: false,
      message: "Payment links onboarding record not found",
      responseCode: "001",
      data: {},
    });
  }

  if (!onboarding.virtualAccountNumber) {
    return res.status(400).json({
      status: false,
      message: "Virtual account number is not available yet",
      responseCode: "001",
      data: {},
    });
  }

  const providerResponse = await getVirtualAccountBalanceV2({
    accountNumber: onboarding.virtualAccountNumber,
    customerId: String(credentialId),
  });
  console.log(providerResponse)
  const providerData = providerResponse || {};
  const balance =
    providerData?.presentBalance != null
      ? Number(providerData?.presentBalance)
      : providerData?.current_balance != null
      ? Number(providerData.current_balance)
      : 0;

  return res.status(200).json({
    status: true,
    message: "Virtual account balance fetched successfully",
    responseCode: "000",
    data: {
      virtualAccountNumber: onboarding.virtualAccountNumber,
      accountName: onboarding.businessName || null,
      ifsc: onboarding.virtualIfsc || null,
      balance,
      providerData,
    },
  });
});

exports.getVirtualAccountDetails = asyncHandler(async (req, res) => {
  const credentialId = req.user?.id;
  if (!credentialId)
    return res.status(400).json({ status: false, message: 'Credential id missing', responseCode: '001', data: null });

  const onboarding = await findOnboardingByCredential(credentialId);
  if (!onboarding)
    return res.status(400).json({ status: false, message: 'Onboarding record not found', responseCode: '001', data: null });

  const profile = await findCorporateUserByCredentialId(credentialId);

  const email = onboarding.email || profile?.email || null;
  const mobile = onboarding.phone || profile?.mobileNo || null;
  // Bug 26046: previously fell back to `[city, state, country].join(', ')`
  // which surfaced the state (e.g. "Kerala") in the Address field.
  // profileAddress only uses real address inputs; if none exist we return null
  // and the frontend renders "—".
  const profileAddress = onboarding.address || null;
  const address = profileAddress;

  return res.status(200).json({
    status: true,
    message: 'Virtual account details fetched successfully',
    responseCode: '000',
    data: {
      name: onboarding.businessName || null,
      pan: onboarding.pan || null,
      mobile,
      email,
      address,
      profileAddress,
      virtualAccountNumber: onboarding.virtualAccountNumber || null,
      activatedAt: onboarding.createdAt || null,
    },
  });
});

exports.getVirtualAccountStatement = asyncHandler(async (req, res) => {
  const credentialId = req.user?.id;
  if (!credentialId) {
    return res.status(400).json({
      status: false,
      message: "Credential (user) id missing",
      responseCode: "001",
      data: {},
    });
  }

  const { from, to, page, limit } = req.query;

  const onboarding = await findOnboardingByCredential(credentialId);
  if (!onboarding) {
    return res.status(400).json({
      status: false,
      message: "Payment links onboarding record not found",
      responseCode: "001",
      data: {},
    });
  }

  if (!onboarding.virtualAccountNumber) {
    return res.status(400).json({
      status: false,
      message: "Virtual account number is not available yet",
      responseCode: "001",
      data: {},
    });
  }

  const accountDetails = {
    accountName: onboarding.businessName || null,
    virtualAccountNumber: onboarding.virtualAccountNumber,
    ifsc: onboarding.virtualIfsc || null,
  };

  const providerResponse = await getVirtualAccountStatementV2({
    accountNumber: onboarding.virtualAccountNumber,
    customerId: String(credentialId),
    // mobileNumber: onboarding.phone || undefined,
    from,
    to,
    page,
    limit,
  });

  const providerData = normalizeStatementProviderData(providerResponse?.data || {});

  const summary = {
    totalAmountPaid:
      Number(
        providerData?.total_amount_paid ??
          providerData?.summary?.total_amount_paid ??
          0
      ) || 0,
    totalAmountReceived:
      Number(
        providerData?.total_amount_received ??
          providerData?.summary?.total_amount_received ??
          0
      ) || 0,
    totalTransactions:
      Number(
        providerData?.total_transactions ??
          providerData?.summary?.total_transactions ??
          0
      ) || 0,
  };

  const rawRows = Array.isArray(providerData?.transactions)
    ? providerData.transactions
    : Array.isArray(providerData?.statement)
    ? providerData.statement
    : [];

  const rows = rawRows.map((row, index) => ({
    key:
      row?.transaction_id ||
      row?.utr ||
      row?.customer_reference_number ||
      String(index),
    dateTime:
      row?.transaction_date || row?.date_time || row?.timestamp || null,
    transactionId:
      row?.transaction_id || row?.decentro_txn_id || row?.utr || null,
    description:
      row?.transaction_remarks || row?.narration || row?.description || null,
    type: row?.transaction_type || null,
    amount:
      row?.transaction_amount != null ? Number(row.transaction_amount) : null,
    paymentMode: row?.payment_mode || null,
    payerName: row?.payer_name || null,
    payerAccountNumber: row?.payer_account_number || null,
    payerIfsc: row?.payer_ifsc || null,
    transferType: row?.transfer_type || null,
    customerReferenceNumber:
      row?.customer_reference_number || row?.utr || null,
    raw: row,
  }));

  return res.status(200).json({
    status: true,
    message: "Virtual account statement fetched successfully",
    responseCode: "000",
    data: {
      accountDetails,
      summary,
      statement: {
        from,
        to,
        page,
        rows,
      },
    },
  });
});

exports.exportVirtualAccountStatement = asyncHandler(async (req, res) => {
  const credentialId = req.user?.id;
  if (!credentialId) {
    return res.status(400).json({ status: false, message: "Credential (user) id missing", responseCode: "001", data: {} });
  }

  const { from, to } = req.query;

  const onboarding = await findOnboardingByCredential(credentialId);
  if (!onboarding) {
    return res.status(400).json({ status: false, message: "Payment links onboarding record not found", responseCode: "001", data: {} });
  }
  if (!onboarding.virtualAccountNumber) {
    return res.status(400).json({ status: false, message: "Virtual account number is not available yet", responseCode: "001", data: {} });
  }

  const providerResponse = await getVirtualAccountStatementV2({
    accountNumber: onboarding.virtualAccountNumber,
    customerId: String(credentialId),
    from,
    to,
  });

  const providerData = normalizeStatementProviderData(providerResponse?.data || {});
  const rawRows = Array.isArray(providerData?.transactions)
    ? providerData.transactions
    : Array.isArray(providerData?.statement)
    ? providerData.statement
    : [];

  if (!rawRows.length) {
    return res.status(400).json({ status: false, message: "No statement data available for the selected date range", responseCode: "001", data: {} });
  }

  const data = rawRows.map((row) => ({
    "Date & Time": row?.transaction_date || row?.date_time || row?.timestamp || "",
    "Transaction ID": row?.transaction_id || row?.decentro_txn_id || row?.utr || "",
    "Description": row?.transaction_remarks || row?.narration || row?.description || "",
    "Type": row?.transaction_type || "",
    "Amount": row?.transaction_amount != null ? Number(row.transaction_amount) : "",
    "Payment Mode": row?.payment_mode || "",
    "Payer Name": row?.payer_name || "",
    "Payer Account": row?.payer_account_number || "",
    "Payer IFSC": row?.payer_ifsc || "",
    "Transfer Type": row?.transfer_type || "",
    "Reference Number": row?.customer_reference_number || row?.utr || "",
  }));

  const { buffer, fileType } = await generateExcelBufferAndType(data, "excel");

  return res.status(200).json({
    status: true,
    message: "Statement exported successfully",
    responseCode: "000",
    data: { buffer, fileType },
  });
});

exports.normalizeStatementProviderData = normalizeStatementProviderData;

exports.loadUnloadVirtualAccount = asyncHandler(async (req, res) => {
  const credentialId = req.user?.id;
  const corporateUserId = req.user?.corporateId;

  if (!credentialId) {
    return res.status(400).json({ status: false, message: 'Credential id missing', responseCode: '001', data: null });
  }

  const { action, purpose, amount, bankReferenceNumber, transferType } = req.body;

  if (!['Credit', 'Debit'].includes(action)) {
    return res.status(400).json({ status: false, message: "action must be 'Credit' or 'Debit'", responseCode: '001', data: null });
  }
  if (!purpose || !amount || !bankReferenceNumber || !transferType) {
    return res.status(400).json({ status: false, message: 'purpose, amount, bankReferenceNumber and transferType are required', responseCode: '001', data: null });
  }

  const onboarding = await findOnboardingByCredential(credentialId);
  if (!onboarding?.virtualAccountNumber) {
    return res.status(400).json({ status: false, message: 'Virtual account not available', responseCode: '001', data: null });
  }

  const referenceId = `va-load-${credentialId}-${Date.now()}`;

  const providerResponse = await loadUnloadVAOnDecentro({
    credentialId,
    corporateUserId,
    referenceId,
    action,
    purpose,
    accountNumber: onboarding.virtualAccountNumber,
    amount,
    bankReferenceNumber,
    transferType,
  });

  return res.status(200).json({
    status: true,
    message: action === 'Credit' ? 'Funds loaded successfully' : 'Funds unloaded successfully',
    responseCode: '000',
    data: {
      referenceId,
      action,
      amount,
      virtualAccountNumber: onboarding.virtualAccountNumber,
      providerResponse,
    },
  });
});

exports.deactivateVirtualAccount = asyncHandler(async (req, res) => {
  const credentialId = req.user?.id;
  if (!credentialId) {
    return res.status(400).json({ status: false, message: 'Credential id missing', responseCode: '001', data: null });
  }

  const onboarding = await findOnboardingByCredential(credentialId);
  if (!onboarding) {
    return res.status(400).json({ status: false, message: 'Onboarding record not found', responseCode: '001', data: null });
  }
  if (!onboarding.virtualAccountNumber) {
    return res.status(400).json({ status: false, message: 'Virtual account number not available', responseCode: '001', data: null });
  }

  await deactivateVAOnDecentro({
    vaNumber: onboarding.virtualAccountNumber,
    name: onboarding.businessName || onboarding.accountHolderName || 'Account Holder',
    pan: onboarding.pan,
  });

  await suspendOnboarding({ credentialId });

  return res.status(200).json({
    status: true,
    message: 'Virtual account deactivated successfully',
    responseCode: '000',
    data: { virtualAccountNumber: onboarding.virtualAccountNumber },
  });
});

exports.updateVirtualAccount = asyncHandler(async (req, res) => {
  const credentialId = req.user?.id;
  if (!credentialId)
    return res.status(400).json({ status: false, message: 'Credential id missing', responseCode: '001', data: null });

  const onboarding = await findOnboardingByCredential(credentialId);
  if (!onboarding)
    return res.status(400).json({ status: false, message: 'Onboarding record not found', responseCode: '001', data: null });
  if (!onboarding.virtualAccountNumber)
    return res.status(400).json({ status: false, message: 'Virtual account not found', responseCode: '001', data: null });

  const { name, pan, email, mobile, address } = req.body;

  const providerResponse = await updateVAOnDecentro({
    vaNumber: onboarding.virtualAccountNumber,
    name, pan, email, mobile, address,
  });

  await updateOnboardingProfile({ credentialId, businessName: name, phone: mobile, email, address });

  return res.status(200).json({
    status: true,
    message: 'Virtual account updated successfully',
    responseCode: '000',
    data: {
      virtualAccountNumber: onboarding.virtualAccountNumber,
      providerResponse,
    },
  });
});
