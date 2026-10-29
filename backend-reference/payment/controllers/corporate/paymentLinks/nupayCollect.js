const asyncHandler = require("../../../middlewares/async");
const { customLog } = require("../../../utils/loggerHelper");
const { createCollectRequest } = require("../../../services/nupayGateway");
const {
  storePaymentLink,
  createPendingUnifiedTransaction,
} = require("../../../models/use-cases/paymentLink");

// POST /payment/payment-links/nupay/collect
// Creates a payment link via NuPay Collection 360 (initiate_transaction) using the merchant's
// own credentials. Kept separate from the Decentro createPaymentLink controller.
exports.createNupayCollectRequest = asyncHandler(async (req, res) => {
  const {
    amount,
    purpose_message: purposeMessage,
    customerName,
    customerEmail,
    customerPhone,
    accessKey,
    invoiceId,
  } = req.body;

  // Invoice payment links must carry the invoiceId so the collection webhook can mark it PAID.
  if (accessKey === "invoice" && !invoiceId) {
    return res.status(400).json({
      status: false,
      message: "invoiceId is required for invoice payment links",
      responseCode: "400",
      data: {},
    });
  }

  const result = await createCollectRequest({
    amount,
    purpose_message: purposeMessage,
    payer_name: customerName,
    payer_email: customerEmail,
    payer_mobile_no: customerPhone,
    credentialId: req.user.id,
  });

  const storedPaymentLink = await storePaymentLink({
    amount,
    paymentLink: result.paymentLink,
    purpose_message: purposeMessage,
    status: result.transactionStatus,
    reference_id: result.reference_id,
    decentro_txn_id: result.nupayTxnId,
    vendor: "nupay",
    corporateUser: req.user.id,
    expireDate: result.expiresAt || null,
    customerName,
    customerPhone,
    accessKey,
    invoiceId,
  });

  try {
    await createPendingUnifiedTransaction({
      credentialId: req.user.id,
      source: "payment_link",
      sourceTxnId: result.reference_id,
      providerTxnId: result.nupayTxnId || null,
      amount,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      linkUrl: result.paymentLink || null,
      reference: result.reference_id || null,
      purposeMessage: purposeMessage || null,
      createdMilestoneAt: storedPaymentLink?.createdAt || new Date(),
      rawPayload:
        result?.providerResponse && typeof result.providerResponse === "object"
          ? { providerResponse: result.providerResponse }
          : null,
    });
  } catch (unifiedSyncError) {
    customLog(req?.LogTraceId, "error", {
      message: "NuPay collect unified transaction sync failed",
      reference_id: result.reference_id,
      error: unifiedSyncError?.message,
    }, "VENDOR");
  }

  return res.status(200).json({
    status: true,
    message: "Payment link created successfully",
    responseCode: "000",
    data: {
      paymentLink: result.paymentLink,
      reference_id: result.reference_id,
      nupayTxnId: result.nupayTxnId,
      transactionStatus: result.transactionStatus,
      transaction_status: result.transactionStatus,
      payeeVpa: result.payeeVpa,
      requestAmount: result.requestAmount,
      totalAmount: result.totalAmount,
      expiresAt: result.expiresAt,
      providerResponse: result.providerResponse,
    },
  });
});
