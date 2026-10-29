"use strict";
const { customLog } = require("./loggerHelper");
const { getABiller } = require("../controllers/corporate/commonBillHandler");
const { assertBbpsChannelAmount } = require("./billPayments_utils");
const { checkBillAvenueBalance, notifyBillAvenueLowBalance } = require("./billAvenueWallet");

/**
 * The two BBPS checks the Cashfree create-order runs before taking money: the biller's channel amount limit, and
 * whether BillAvenue holds enough float to settle the bill. Taking the money first and refunding later is the
 * failure these prevent, and a corporate card redeem moves money just as a Cashfree capture does.
 * Resolves to null when the payment may proceed, else { message, status }.
 */
const assertBbpsPayable = async ({ req, logTraceId }) => {
  const billerId = req.body?.billerId;
  if (!billerId) return null;

  const billerData = await getABiller({
    credentialId: req.user.id,
    packageId: req.user.packageId,
    corporateUserId: req.user.corporateId,
    billerId,
    logTraceId,
  }) || null;

  const channelLimitMessage = await assertBbpsChannelAmount({
    billerData,
    accessKey: req.body.accessKey,
    amount: req.body.amount,
    ccf1Amount: req.body.ccf1Amount,
    billerId,
    logTraceId,
  });
  if (channelLimitMessage) return { message: channelLimitMessage, status: 400 };

  const billAvenueAmount = parseFloat(req.body.amount) + parseFloat(req.body.ccf1Amount ?? 0) / 100;
  if (Number.isFinite(billAvenueAmount) && billAvenueAmount > 0) {
    const vendorCheck = await checkBillAvenueBalance(billAvenueAmount, logTraceId);
    if (!vendorCheck.sufficient) {
      customLog(logTraceId, "error", {
        message: "BBPS corporate card payment blocked: insufficient BillAvenue vendor wallet balance",
        required: billAvenueAmount,
        available: vendorCheck.balance,
        billerId,
      }, "VENDOR");
      await notifyBillAvenueLowBalance(vendorCheck, { required: billAvenueAmount, billerId }, logTraceId);
      return { message: "This service is temporarily unavailable. Please try again later.", status: 503 };
    }
  }
  return null;
};

module.exports = { assertBbpsPayable };
