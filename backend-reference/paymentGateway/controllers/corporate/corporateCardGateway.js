const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const paymentGatewayOrders = require("../../models/entities/paymentGatewayOrders");
const { ORDER_KIND } = require("../../constants/orderKind");
const {
  CORPORATE_CARD_GATEWAY,
  CORPORATE_CARD_PAYMENT_MODE,
  IN_APP_STATUS,
} = require("../../constants/corporateCardPayment");
const { inAppRedeem } = require("../../utils/corporateCardsClient");
const { resolveCardholderId } = require("../../models/use-cases/cardholder");
const { assertBbpsPayable } = require("../../utils/bbpsPreflight");
const { findOneOrder } = require("../../models/use-cases/order");
const { notifyPGPaymentConfirmed } = require("../../utils/pusherNotification");
const { dispatchServicePayment } = require("./cashFreeGateway");

const CARDHOLDER_REQUIRED = "Corporate card payments are available only to cardholders.";
const NOT_COMPLETED = "Card payment was not completed.";

/**
 * The corporate card is a payment instrument like a Cashfree checkout, so this is createOrder and
 * handlePGCallback in one request: persist the service payload, redeem on the card through corporateCard,
 * then replay the service handler with the redeem receipt as paymentGatewayResponse.
 *
 * A decline is an expected outcome, not an error: HTTP 200 with data.declined and the reason, so the FE can
 * say why instead of the generic toast. Everything after a successful redeem mirrors the Cashfree path,
 * including what happens when the service handler throws (order FAILED, 500) — the refund is the service's
 * own cancelPGTransaction call, as it is for a captured Cashfree payment.
 */
exports.pay = asyncHandler(async (req, res, next) => {
  const cardholderId = await resolveCardholderId(req);
  if (!cardholderId) return next(new ErrorResponse(CARDHOLDER_REQUIRED, 400));

  const pgAmount = Number(req.body.pgAmount);
  if (!Number.isFinite(pgAmount) || pgAmount <= 0) {
    return next(new ErrorResponse("A valid amount is required.", 400));
  }

  // Same BBPS guards the Cashfree create-order applies before taking money.
  const bbpsBlock = await assertBbpsPayable({ req, logTraceId: req?.LogTraceId });
  if (bbpsBlock) return next(new ErrorResponse(bbpsBlock.message, bbpsBlock.status));

  const paymentRefId = new Date().valueOf();
  customLog(req?.LogTraceId, "info", {
    message: "[CorporateCardGateway] Card payment requested",
    paymentRefId,
    accessKey: req.body.accessKey,
    amount: pgAmount,
    cardholderId,
    corporateId: req.user.corporateId,
    credentialId: req.user.id,
  }, "VENDOR");
  const paymentBodyData = {
    ...req.body,
    paymentRefId,
    userId: req.user.id,
    corporateId: req.user.corporateId,
    role: req.user.role || null,
    ...(req.user.role === "CORPORATE_SUB_USER" && {
      subCorporateId: req.user.subCorporateId,
      subCorporateUsername: req.user.subCorporateUsername || null,
    }),
    paymentMode: CORPORATE_CARD_PAYMENT_MODE,
  };
  await paymentGatewayOrders.create({
    paymentRefId,
    orderKind: ORDER_KIND.CORPORATE_CARD,
    status: "ORDERED",
    paymentData: JSON.stringify(paymentBodyData),
  });

  const redeem = await inAppRedeem(
    {
      paymentRefId: String(paymentRefId),
      corporateId: req.user.corporateId,
      userId: cardholderId,
      credentialId: req.user.id,
      accessKey: req.body.accessKey,
      amount: pgAmount,
    },
    { logTraceId: req?.LogTraceId, req }
  );
  const receipt = redeem.ok ? redeem.data : null;

  if (!receipt || receipt.status !== IN_APP_STATUS.REDEEMED) {
    const cardStatus = receipt?.status || IN_APP_STATUS.FAILED;
    const reason = receipt?.reason || redeem.message || NOT_COMPLETED;
    await paymentGatewayOrders.update(
      { status: "FAILED", paymentResponse: JSON.stringify(receipt || { reason: redeem.reason || null }) },
      { where: { paymentRefId } }
    );
    customLog(req?.LogTraceId, "error", {
      message: "[CorporateCardGateway] Card payment not completed",
      paymentRefId,
      accessKey: req.body.accessKey,
      cardStatus,
      reason,
      clientReason: redeem.reason || null,
    }, "VENDOR");
    return res.status(200).json({
      status: false,
      message: reason,
      responseCode: "001",
      data: { declined: true, corporateTxnId: paymentRefId, cardStatus, reason, card: receipt?.card || null },
    });
  }

  // One-element array like Cashfree's payments list: the service handlers read [0], and createPGTransaction and
  // every refund path find our marker on it. The Cashfree-named fields carry the redeem equivalents.
  const paymentGatewayResponse = [{
    gateway: CORPORATE_CARD_GATEWAY,
    ...receipt,
    payment_status: "SUCCESS",
    payment_amount: pgAmount,
    payment_group: "corporate_card",
    cf_payment_id: receipt.transactionId ?? null,
    pgAmount,
  }];
  await paymentGatewayOrders.update(
    { status: "COMPLETE", paymentResponse: JSON.stringify(paymentGatewayResponse) },
    { where: { paymentRefId } }
  );
  const orderDetails = await paymentGatewayOrders.findOne({ where: { paymentRefId } });
  customLog(req?.LogTraceId, "info", {
    message: "[CorporateCardGateway] Redeemed — handing over to the service handler",
    paymentRefId,
    accessKey: req.body.accessKey,
    transactionId: receipt.transactionId,
    batchNumber: receipt.batchNumber,
  }, "VENDOR");

  req.body = { ...paymentBodyData, corporateTxnId: paymentRefId, paymentGatewayResponse };
  try {
    await dispatchServicePayment({ req, res, next, paymentRefId, paymentBodyData, orderDetails });
  } catch (paymentError) {
    customLog(req?.LogTraceId, "error", {
      message: "[CorporateCardGateway] Error processing the service payment after redeem",
      error: paymentError?.message ?? paymentError,
      paymentRefId,
      operator: req.body.accessKey,
    }, "VENDOR");
    await paymentGatewayOrders.update(
      { status: "FAILED", paymentResponse: JSON.stringify(paymentGatewayResponse) },
      { where: { paymentRefId } }
    );
    return next(new ErrorResponse("Payment processing failed", 500));
  }

  // Same as the Cashfree webhook once the service settled the txn: the pending screen listens for it. Non-fatal.
  try {
    const settledTxn = await findOneOrder({ corporateTxnId: String(paymentRefId) });
    let settledStatus = null;
    if (settledTxn?.status === "SUCCESS") settledStatus = "SUCCESS";
    else if (["FAILURE", "FAILED", "REFUNDED"].includes(settledTxn?.status)) settledStatus = "FAILURE";
    if (settledStatus) await notifyPGPaymentConfirmed(req.user.id, null, paymentRefId, null, settledStatus);
  } catch (notifyError) {
    customLog(req?.LogTraceId, "error", { message: "[CorporateCardGateway] Pusher notify failed", paymentRefId, error: notifyError?.message }, "VENDOR");
  }
});
