const {
  asyncHandler,
  createPaymentLink,
  createDynamicQr,
  issueUpiCollectRequest,
  storePaymentLink,
  createPendingUnifiedTransaction,
  addPaymentQr,
  ErrorResponse,
  addUpiCollectRequest,
  logUnifiedSyncError,
  syncLedgerEntry,
} = require("./common");

exports.createPaymentLink = asyncHandler(async (req, res,next) => {
  const {
    amount,
    purpose_message,
    expiry_time,
    customerName,
    customerPhone,
    accessKey,
    invoiceId
  } = req.body;

  if(accessKey==="invoice" && !invoiceId){
    return next(ErrorResponse("invoiceId is required"))
  }

  const result = await createPaymentLink({
    amount,
    purpose_message,
    expiry_time,
  });

  const storedPaymentLink = await storePaymentLink({
    amount,
    paymentLink: result.paymentLink,
    purpose_message,
    status: result.transactionStatus,
    reference_id: result.reference_id,
    decentro_txn_id: result.decentroTxnId,
    corporateUser: req.user.id,
    expireDate: expiry_time ? Date.now() + expiry_time * 60 * 1000 : null,
    customerName,
    customerPhone,
    invoiceId,
    accessKey
  });

  try {
    await createPendingUnifiedTransaction({
      credentialId: req.user.id,
      source: "payment_link",
      sourceTxnId: result.reference_id,
      providerTxnId: result.decentroTxnId || null,
      amount,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      linkUrl: result.paymentLink || null,
      reference: result.reference_id || null,
      purposeMessage: purpose_message || null,
      createdMilestoneAt: storedPaymentLink?.createdAt || new Date(),
      rawPayload:
        result?.providerResponse && typeof result.providerResponse === "object"
          ? { providerResponse: result.providerResponse }
          : null,
    });
  } catch (unifiedSyncError) {
    await logUnifiedSyncError(req, "createPaymentLink", unifiedSyncError, {
      source: "payment_link",
      sourceTxnId: result.reference_id,
      corporateUser: req.user.id,
    });
  }

  await syncLedgerEntry(
    req,
    "createPaymentLink",
    {
      transactionId: result.decentroTxnId || null,
      type: "CREDIT",
      amount,
      source: "PAYMENT_LINK",
      status: "PENDING",
      referenceId: result.reference_id || null,
      paymentLinkId: storedPaymentLink?.id || null,
      credentialId: req.user.id,
      metadata: {
        providerResponse: result.providerResponse || null,
        paymentLink: result.paymentLink || null,
        purposeMessage: purpose_message || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
      },
    },
    {
      source: "PAYMENT_LINK",
      transactionId: result.decentroTxnId || null,
      corporateUser: req.user.id,
    }
  );

  return res.status(200).json({
    status: true,
    message: "Payment link created successfully",
    responseCode: "000",
    data: {
      paymentLink: result.paymentLink,
      reference_id: result.reference_id,
      decentro_txn_id: result.decentroTxnId,
      transaction_status: result.transactionStatus,
      providerResponse: result.providerResponse,
    },
  });
});

exports.createDynamicQr = asyncHandler(async (req, res) => {
  const { amount, purpose_message, expiry_time } = req.body;

  const result = await createDynamicQr({
    amount,
    purpose_message,
    expiry_time,
  });

  const storedPaymentQr = await addPaymentQr({
    corporateUser: req.user.id,
    amount,
    purpose_message,
    reference_id: result.reference_id,
    decentro_txn_id: result.decentro_txn_id,
    status: String(result.transaction_status || "PENDING").toUpperCase(),
    dynamic_qr_image: result.dynamic_qr_image,
    expireDate: expiry_time ? Date.now() + Number(expiry_time) * 60 * 1000 : null,
  });

  try {
    await createPendingUnifiedTransaction({
      credentialId: req.user.id,
      source: "payment_qr",
      sourceTxnId: result.reference_id,
      providerTxnId: result.decentro_txn_id || null,
      amount,
      qrImageUrl: result.dynamic_qr_image || null,
      reference: result.reference_id || null,
      purposeMessage: purpose_message || null,
      createdMilestoneAt: storedPaymentQr?.createdAt || new Date(),
      rawPayload:
        result?.providerResponse && typeof result.providerResponse === "object"
          ? { providerResponse: result.providerResponse }
          : null,
    });
  } catch (unifiedSyncError) {
    await logUnifiedSyncError(req, "createDynamicQr", unifiedSyncError, {
      source: "payment_qr",
      sourceTxnId: result.reference_id,
      corporateUser: req.user.id,
    });
  }

  await syncLedgerEntry(
    req,
    "createDynamicQr",
    {
      transactionId: result.decentro_txn_id || null,
      type: "CREDIT",
      amount,
      source: "PAYMENT_QR",
      status: "PENDING",
      referenceId: result.reference_id || null,
      credentialId: req.user.id,
      metadata: {
        providerResponse: result.providerResponse || null,
        dynamicQrImage: result.dynamic_qr_image || null,
        purposeMessage: purpose_message || null,
      },
    },
    {
      source: "PAYMENT_QR",
      transactionId: result.decentro_txn_id || null,
      corporateUser: req.user.id,
    }
  );

  return res.status(200).json({
    status: true,
    message: "Dynamic QR created successfully",
    responseCode: "000",
    data: {
      dynamic_qr_image: result.dynamic_qr_image,
      reference_id: result.reference_id,
      decentro_txn_id: result.decentro_txn_id,
      transaction_status: String(result.transaction_status || "PENDING").toUpperCase(),
      providerResponse: result.providerResponse,
    },
  });
});

exports.issueCollectRequest = asyncHandler(async (req, res) => {
  const {
    payer_upi,
    amount,
    purpose_message,
    expiry_time,
    full_name
  } = req.body;


  const result = await issueUpiCollectRequest({
    payer_upi,
    amount,
    purpose_message,
    expiry_time,
    payer_name: full_name
  });
  await addUpiCollectRequest({
    payer_upi: payer_upi,
    payer_name: full_name,
    amount: amount,
    expiry_time: expiry_time,
    reference_id: result.reference_id,
    decentro_txn_id: result.decentro_txn_id,
    corporateUser: req.user.id,
  })

  return res.status(200).json({
    status: true,
    message: "Collect request issued successfully",
    responseCode: "000",
    data: {
      reference_id: result.reference_id,
      decentro_txn_id: result.decentro_txn_id,
      transaction_status: result.status,
      response_code: result.response_code,
      message: result.message,
      providerResponse: result.providerResponse,
    },
  });
});
