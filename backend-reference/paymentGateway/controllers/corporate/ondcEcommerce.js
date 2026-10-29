const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
  fetchServiceDetails,
  calculateSurchargeWithTax,
} = require("../../utils/checkAndFetchServiceDetails");
const { createNotification } = require("../../models/use-cases/notification");
const {
  refundWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const { createPGTransaction } = require("../../utils/paymentGatewayTransaction");
const wallet = require("../../models/entities/wallet");
const operatorsData = require("../../utils/operatorsData.json");
const accessKey = operatorsData["e-commerce"]["accessKey"];
const transactionCategory = operatorsData["e-commerce"]["category"];
const { customLog } = require("../../utils/loggerHelper");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { dispatchCheckoutConfirms } = require("../../services/ondcConfirmDispatch");
/** Easy Split / settlement logs (existing). */
const FLOW = "ondcEasySplit";
/** Confirm-after-payment spine — filter VENDOR by this to debug placing-order. */
const FLOW_CONFIRM = "ondcPgDirectConfirm";

/**
 * Settle a Cashfree capture for an ONDC Office Supplies checkout.
 *
 * Records the wallet/PG txn SUCCESS, responds immediately, then sends every seller
 * its BPP /confirm and records each answer (services/ondcConfirmDispatch.js).
 * purchase takes it from those same tables — on_confirm, the 5-minute timeout, the
 * refund of whatever no seller placed, cancelling a late confirm — with no call
 * between the two services.
 */
exports.payment = asyncHandler(async (req, res, next) => {
  const transactionId = req.body.transactionId;
  const providerId = transactionId;
  const account = req.body.account;
  const amount = req.body.amount;
  const payCashback = req.body.payCashback;
  const corporateTxnId = req.body.corporateTxnId;
  const logTraceId = req?.LogTraceId;

  const credentialId = req.user.id;
  const corporateUserId = req.user.corporateId;
  const packageId = req.user.packageId;
  const isSubCorporateUser =
    req.user.role === "CORPORATE_SUB_USER" &&
    req.user.subCorporateId &&
    req.user.subCorporateUsername;

  customLog(logTraceId, "info", {
    flow: FLOW_CONFIRM,
    step: "payment-start",
    message: "ONDC Office Supplies: payment handler entered (isOndc path)",
    corporateTxnId,
    paymentRef: corporateTxnId ? String(corporateTxnId) : null,
    credentialId,
    corporateUserId,
    amount,
    pgAmount: req.body.pgAmount,
    cartId: req.body.cartId || null,
    ondcGroupCount: Array.isArray(req.body.ondcGroups) ? req.body.ondcGroups.length : 0,
    hasSuccessUrl: Boolean(req.body.successUrl),
  }, "VENDOR");

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    customLog(logTraceId, "error", {
      flow: FLOW_CONFIRM,
      step: "service-details",
      message: "ONDC Office Supplies: service unavailable — aborting payment handler",
      corporateTxnId,
      error: serviceDetails.error,
    }, "VENDOR");
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        500
      )
    );
  }

  const numericAmount = parseFloat(amount);
  const surchargeDetails = await calculateSurchargeWithTax(
    serviceDetails.surcharge,
    serviceDetails.surchargeType,
    numericAmount,
    credentialId
  );
  const surcharge = surchargeDetails.surcharge;

  let subCorporateUserId;
  if (req.user.role === "CORPORATE_SUB_USER") {
    subCorporateUserId = req.user.subCorporateId;
  }

  customLog(logTraceId, "info", {
    flow: FLOW,
    step: "create-pg-txn",
    message: "ONDC Office Supplies: recording PG/wallet transaction",
    corporateTxnId,
    numericAmount,
    surcharge,
    pgAmount: req.body.pgAmount,
  }, "VENDOR");

    let partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse)
        ? req.body.paymentGatewayResponse[0]
        : req.body?.paymentGatewayResponse;
    const reportData = await computeJournalData({
        serviceDetails,
        pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
        amount,
        paymentMethod: pgResponse?.payment_method || {},
        partnerDetails,
        paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
        couponTotalDiscount: req.body.couponTotalDiscount,
        corporateState: req.user.state || '',
        credentialId,
    });

  const transactionResponse = await createPGTransaction({
    providerId,
    corporateTxnId,
    credentialId,
    serviceOperatorId: serviceDetails.id,
    corporateCashback: serviceDetails.cashback,
    accountNo: account,
    transactionCategory,
    orderAmount: amount,
    commissionType: serviceDetails.commissionType,
    cashbackType: serviceDetails.cashbackType,
    providerCommission: serviceDetails.providerCommission,
    payCashback,
    surcharge,
    subCorporateUserId,
    pgAmount: req.body.pgAmount,
    pgResponse: req.body.paymentGatewayResponse,
    couponCode: req.body.couponCode,
    corporateUserId,
    partnerId: req.user.registeredBy,
    accessKey,
    reportData,
  });

  if (
    transactionResponse &&
    Object.prototype.hasOwnProperty.call(transactionResponse, "error")
  ) {
    customLog(logTraceId, "error", {
      flow: FLOW,
      step: "create-pg-txn",
      message: "ONDC Office Supplies: failed to record the payment transaction — cancelling capture",
      corporateTxnId,
      error: transactionResponse["error"],
    }, "VENDOR");
    await cancelPGTransaction(corporateTxnId);
    await refundWalletTransaction({
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: transactionResponse["error"],
      registeredById: req.user.registeredBy,
      couponId: transactionResponse.couponId,
    });

    // NOTE: a payment-failed email used to go out here (spec template 3, its
    // `reversed` variant — the charge succeeded and we reversed it because the
    // transaction could not be recorded). The 2026-08-24 spec revision deleted
    // that template outright, so a failed or reversed payment now sends no email.
    // The 402 below is the only signal the buyer gets.

    const walletDetails = await wallet.findOne({
      where: { credentialId },
      attributes: ["balance"],
    });
    return res.status(402).json({
      status: false,
      data: {
        corporateFinalBalance: walletDetails ? walletDetails["balance"] : null,
      },
      message:
        "Payment failed. Please check your payment information and try again.",
      responseCode: "001",
    });
  }

  publishJournalEvent(
    {
      transactionRef: corporateTxnId,
      type: "payment",
      contextSnapshot: {
        credentialId,
        vendor: serviceDetails?.vendor || null,
        registeredBy: req?.user?.registeredBy || null,
      },
      reportData,
    },
    logTraceId
  );

  await generateOrderInvoiceAttachments({
    amount,
    surcharge,
    couponDiscount: transactionResponse.couponDiscount || 0,
    corporateTxnId,
    orderId: transactionResponse.orderId,
    paymentType: "Office Supplies",
    description: "ONDC Office Supplies order",
    credentialId,
    pgAmount: req.body.paymentGatewayResponse ? req.body.pgAmount : null,
    paymentMethod: pgResponse?.payment_method,
    vendor: serviceDetails?.vendor,
    commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
    commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
    sendInvoiceToVendor: false,
    traceId: logTraceId,
  });

  const ondcGroups = Array.isArray(req.body.ondcGroups) ? req.body.ondcGroups : [];

  await updateWalletTransaction({
    corporateTxnId,
    providerId: "ONDC",
    status: "SUCCESS",
    message: "Payment Successful",
    orderResponse: JSON.stringify({
      ondc: true,
      address: req.body.address,
      cartId: req.body.cartId,
    }),
  });

  createNotification({
    notificationTitle: "Office Supplies - Payment successful",
    notificationBrief: `The payment of ₹ ${(
      parseFloat(req.body.pgAmount) || numericAmount
    ).toFixed(2)} for Office Supplies was successful. Transaction ID: ${corporateTxnId}. We are placing your order with the seller(s).`,
    notificationTo: isSubCorporateUser
      ? [req.user.subCorporateUsername]
      : [req.user.username],
    notificationCategory: "CORPORATE",
    notificationBy: "ADMIN",
  });

  // NOTE: a payment-receipt email used to go out here (spec template 2). The
  // 2026-08-24 spec revision deleted that template and folded its four lines
  // (amount, method, transaction id, date) into the Order Confirmation mail, which
  // purchase sends once the sellers confirm. The in-app notification above is
  // still the immediate acknowledgement.

  if (!ondcGroups.length) {
    // Still recorded below: purchase refunds a capture with nothing to confirm.
    customLog(logTraceId, "error", {
      flow: FLOW_CONFIRM,
      step: "missing-groups",
      message:
        "ONDC checkout has no ondcGroups (FE create-order must send them) — purchase will refund it",
      corporateTxnId,
      paymentRef: String(corporateTxnId),
      paymentDataKeys: Object.keys(req.body || {}),
    }, "VENDOR");
  }

  customLog(logTraceId, "info", {
    flow: FLOW_CONFIRM,
    step: "payment-done",
    message:
      "ONDC Office Supplies: payment capture complete — BPP /confirm dispatched in the background",
    corporateTxnId,
    paymentRef: String(corporateTxnId),
    amount: numericAmount,
    surcharge,
    ondcGroupCount: ondcGroups.length,
    successUrl: req.body.successUrl || null,
  }, "VENDOR");

  // Answer the capture callback NOW, then place the orders. The seller /confirm
  // calls used to run inline here: serially, one 30s-timeout HTTP call per group,
  // so a 2-seller checkout could hold this response for 60s+ — past both the
  // ~29s API-gateway integration limit and the checkout page's poll budget, and
  // the buyer saw "we're still finalising your order" on a captured payment.
  // The page learns the outcome by polling purchase's /ondc/checkout-result,
  // never from this body, so nothing here needs to wait for the sellers.
  const response = res.status(200).json({
    status: true,
    message: "Payment completed successfully. Thank you!",
    data: {
      ...transactionResponse,
      corporateTxnId,
      confirm: {
        dispatched: true,
        groupCount: ondcGroups.length,
      },
      successUrl: req.body.successUrl,
    },
    responseCode: "000",
  });

  // Place the orders AFTER answering. Each seller's /confirm and its answer are
  // recorded; purchase settles the rest from those rows. Never throws.
  setImmediate(() => {
    dispatchCheckoutConfirms({
      paymentRef: String(corporateTxnId),
      ondcGroups,
      user: req.user,
      pgResponse: req.body.paymentGatewayResponse,
      pgAmount: req.body.pgAmount,
      logTraceId,
    }).catch(() => {});
  });

  return response;
});
