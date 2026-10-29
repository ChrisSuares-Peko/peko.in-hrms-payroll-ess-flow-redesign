const order = require("../models/entities/order");
const paymentGatewayOrders = require("../models/entities/paymentGatewayOrders");
const { customLog } = require("./loggerHelper");
const emailer = require("./emailer");
const { refundInitiated, refundFailure } = require("./emailTemplates/common");
const { findByName } = require("../models/use-cases/setting");
const { refundAirpay } = require("./airpayGateway");

// Same emails the Cashfree refund helpers send
const notifyOpsRefundFailed = async ({ amount, transactionId, serviceProvider, typeOfService }) => {
  const setting = await findByName({ name: "pekoWebsite" });
  const body = refundFailure({ name: "Admin", amount, transactionId, serviceProvider, typeOfService });
  await emailer.email({ to: setting.emails, subject: "Refund Failed", body });
};

const notifyCustomerRefundInitiated = async ({ user, amount, transactionId, serviceProvider, typeOfService }) => {
  if (!user?.email) return;
  const body = refundInitiated({ name: user.name || user.username || "Corporate", amount, transactionId, serviceProvider, typeOfService });
  await emailer.email({ to: user.email, subject: "Refund Initiated", body });
};

// Airpay branch of cancelPGTransaction (orders row exists): same paymentModeResponse writes and emails.
exports.refundAirpayOrder = async ({ corporateTxnId, orderDetails, paymentBodyData, refundAmount, serviceProvider, serviceCategory }) => {
  try {
    const refund = await refundAirpay({ apTransactionId: paymentBodyData.cf_payment_id, amount: refundAmount });
    paymentBodyData.refundStatus = "INITIATED";
    paymentBodyData.refundResults = [refund];
    await order.update({ paymentModeResponse: JSON.stringify(paymentBodyData) }, { where: { corporateTxnId: String(corporateTxnId) } });
    await notifyCustomerRefundInitiated({
      user: orderDetails?.credential,
      amount: refundAmount,
      transactionId: corporateTxnId,
      serviceProvider,
      typeOfService: serviceCategory,
    }).catch((error) => customLog(null, "error", { message: "Airpay refund initiated email failed", error: error?.message }));
    return { status: true, refundStatus: "INITIATED", message: "Refund initiated" };
  } catch (error) {
    customLog(null, "error", { message: "Airpay refund failed", corporateTxnId, error: error?.response?.data ?? error?.message }, "VENDOR");
    paymentBodyData.refundStatus = "Refund failed";
    paymentBodyData.refundResults = [error?.response?.data ?? { message: error?.message }];
    await order.update({ paymentModeResponse: JSON.stringify(paymentBodyData) }, { where: { corporateTxnId: String(corporateTxnId) } }).catch(() => {});
    await notifyOpsRefundFailed({ amount: refundAmount, transactionId: corporateTxnId, serviceProvider, typeOfService: serviceCategory })
      .catch((emailError) => customLog(null, "error", { message: "Airpay refund failed email failed", error: emailError?.message }));
    return { status: false, message: "Something went wrong", error: error?.response?.data };
  }
};

// Airpay branch of refundCashfreeDirect (early exit, no orders row): writes the same earlyExitRefund marker /complete reads.
exports.refundAirpayEarlyExit = async ({ pgResp, corporateTxnId, reason, serviceType, logTraceId }) => {
  const refundAmount = Number(pgResp?.payment_amount || 0);
  let refundResult;
  try {
    if (!pgResp?.cf_payment_id) throw new Error("Airpay transaction id missing");
    if (!(refundAmount > 0)) throw new Error("Invalid refund amount");
    const refund = await refundAirpay({ apTransactionId: pgResp.cf_payment_id, amount: refundAmount, logTraceId });
    refundResult = { status: true, refundStatus: "INITIATED", message: "Refund initiated", data: refund };
  } catch (error) {
    customLog(logTraceId, "error", { message: "Direct Airpay refund failed", corporateTxnId, error: error?.response?.data ?? error?.message }, "VENDOR");
    await notifyOpsRefundFailed({
      amount: refundAmount,
      transactionId: corporateTxnId,
      serviceProvider: reason || "Early-exit refund",
      typeOfService: serviceType || "Early-exit refund",
    }).catch((emailError) => customLog(logTraceId, "error", { message: "Airpay refund failed email failed", error: emailError?.message }));
    refundResult = { status: false, message: "Refund failed", error: error?.response?.data ?? error?.message };
  }

  if (corporateTxnId) {
    try {
      const paymentRefId = String(corporateTxnId);
      const existing = await paymentGatewayOrders.findOne({ where: { paymentRefId } });
      let wrapper = {};
      try {
        const parsed = JSON.parse(existing?.paymentResponse || "{}");
        wrapper = Array.isArray(parsed) ? { airpayPaymentResponse: parsed } : parsed || {};
      } catch (_) { /* start fresh */ }
      wrapper.earlyExitRefund = {
        reason: reason || null,
        initiatedAt: new Date().toISOString(),
        refundStatus: refundResult.status ? "INITIATED" : "FAILED",
        refundAmount,
        response: refundResult.data ?? refundResult.error ?? null,
      };
      await paymentGatewayOrders.update({ paymentResponse: JSON.stringify(wrapper) }, { where: { paymentRefId } });
    } catch (writeError) {
      customLog(logTraceId, "error", { message: "Failed to write Airpay earlyExitRefund marker", corporateTxnId, error: writeError?.message }, "VENDOR");
    }
  }
  return refundResult;
};
