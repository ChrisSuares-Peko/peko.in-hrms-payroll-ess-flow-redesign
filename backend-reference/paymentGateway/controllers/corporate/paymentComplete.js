const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const paymentGatewayOrders = require("../../models/entities/paymentGatewayOrders");
const { RAZORPAY_GATEWAY } = require("../../utils/razorpayGateway");
const razorpayGateway = require("./razorpayGateway");
const cashFreeGateway = require("./cashFreeGateway");

// POST /payment-gateway/complete { ORDERID } — gateway-blind entry for the pending-page
// poll: the stored order says which gateway it was created on.
exports.completeAnyPayment = asyncHandler(async (req, res, next) => {
  const paymentRefId = String(req.body.ORDERID || "");
  const orderDetails = await paymentGatewayOrders.findOne({ where: { paymentRefId }, attributes: ["paymentData"] });
  if (!orderDetails) return next(new ErrorResponse("Order details not found", 400));

  let gateway = null;
  let ownerId = null;
  try {
    const paymentData = JSON.parse(orderDetails.paymentData || "{}");
    gateway = paymentData?.gateway || null;
    ownerId = paymentData?.userId ?? null;
  } catch (_) { /* legacy row */ }
  // Orders are keyed by a timestamp; never let one corporate poll another's order.
  if (ownerId !== null && String(ownerId) !== String(req.user.id)) {
    return next(new ErrorResponse("Unauthorized", 403));
  }

  if (gateway === RAZORPAY_GATEWAY) return razorpayGateway.completePayment(req, res, next);
  return cashFreeGateway.handlePGCallback(req, res, next);
});
