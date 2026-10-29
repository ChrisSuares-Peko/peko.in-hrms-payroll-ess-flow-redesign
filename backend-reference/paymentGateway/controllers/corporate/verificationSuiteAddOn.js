const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require("../../utils/walletTransaction");
const { createPGTransaction } = require("../../utils/paymentGatewayTransaction");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { createNotification } = require("../../models/use-cases/notification");
const { computeAddonEndDate, findActivePaidGroupSubscription } = require("../../utils/subscriptionPricing");
const operatorsData = require("../../utils/operatorsData.json");
const wallet = require("../../models/entities/wallet");
const { customLog } = require("../../utils/loggerHelper");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { generateSubscriptionInvoiceAttachments } = require("../../services/invoiceAndReceipt");

const VERIFICATION_SUITE_ACCESS_KEY = operatorsData.verificationSuite.accessKey;
// Must match VERIFICATION_ADDON_CATEGORY in officeAndBusiness/models/use-cases/verificationAddon.js -
// that's how officeAndBusiness sums a corporate's purchased add-on quantity back out of this same order/transaction table.
const VERIFICATION_ADDON_CATEGORY = "Verification Suite Addon";

// Mirrors govtServices.payment (paymentGateway/controllers/corporate/govtServices.js): a card/UPI
// payment (paymentGatewayResponse present) goes through createPGTransaction, which only touches the
// wallet for whatever pgAmount doesn't cover - when pgAmount pays the full order, debitAmount is 0 and
// no real wallet transaction happens. No paymentGatewayResponse falls back to a pure wallet debit.
exports.purchaseVerificationSuiteAddOn = asyncHandler(async (req, res, next) => {
  const { quantity } = req.body;
  const credentialId = req.user.id;
  const corporateUserId = req.user.corporateId;
  const packageId = req.user.packageId;
  const payCashback = req.body.payCashback;

  if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
    return next(new ErrorResponse("A valid quantity is required", 400));
  }

  // Add-ons are a paid-plan perk only — Peko Free corporates must upgrade before buying extra
  // verifications, they can't stack add-ons on top of the free plan.
  const paidGroupPlan = await findActivePaidGroupSubscription(corporateUserId);
  if (!paidGroupPlan) {
    return next(new ErrorResponse("Add-ons are only available on a paid plan. Please upgrade your plan to purchase additional verifications.", 400));
  }

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey: VERIFICATION_SUITE_ACCESS_KEY,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
    return next(new ErrorResponse(serviceDetails.error, 400));
  }

  const commissionType = serviceDetails.commissionType;
  const cashbackType = serviceDetails.cashbackType;
  const providerCommission = serviceDetails.providerCommission;
  const corporateCashback = serviceDetails.cashback;
  const serviceOperatorId = serviceDetails.id;
  const surcharge = serviceDetails.surcharge;
  // Same GST-inclusive quote as the add-on pricing API (required here: cashFreeGateway requires this file).
  const { computeAddonQuote } = require("./cashFreeGateway");
  const quote = await computeAddonQuote(quantity, VERIFICATION_SUITE_ACCESS_KEY, req.user.registeredBy, corporateUserId);
  if (quote?.error) {
    return next(new ErrorResponse(quote.message, 400));
  }
  const unitPrice = quote.originalUnitPrice;
  const amount = Number(quote.expectedPaymentAmount).toFixed(2);
  // handlePGCallback/handlePendingTransactions reconstruct req.body with corporateTxnId already
  // pinned to the Cashfree order's paymentRefId - reuse it so this settles the same order/transaction
  // row that was created when the Cashfree order was opened, instead of starting a new one.
  const corporateTxnId = req.body.corporateTxnId ?? new Date().valueOf();

  const partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

  const isPgFunded = Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse');
  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse)
        ? req.body.paymentGatewayResponse[0]
        : req.body?.paymentGatewayResponse;
  const reportData = await computeJournalData({
    serviceDetails,
    pgAmount: isPgFunded ? Number(req.body.pgAmount || 0) : 0,
    amount: Number(amount),
    paymentMethod: pgResponse?.payment_method || {},
    partnerDetails,
    paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
    couponTotalDiscount: req.body.couponTotalDiscount,
    corporateState: req.user.state || '',
    isSubscription: true,
  });

  const publishJournal = (type) => {
    if (!reportData?.journalData) return;
    publishJournalEvent(
      {
        transactionRef: corporateTxnId,
        type,
        contextSnapshot: {
          credentialId,
          vendor: serviceDetails?.vendor || null,
          registeredBy: req?.user?.registeredBy || null,
        },
        reportData,
      },
      req?.LogTraceId
    );
  };

  const commonParams = {
    providerId: corporateTxnId,
    corporateTxnId,
    credentialId,
    serviceOperatorId,
    corporateCashback,
    transactionCategory: VERIFICATION_ADDON_CATEGORY,
    orderAmount: amount,
    commissionType,
    cashbackType,
    providerCommission,
    payCashback,
    surcharge,
    reportData,
  };

  let transactionResponse;
  if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
    transactionResponse = await createPGTransaction({
      ...commonParams,
      pgAmount: req.body.pgAmount,
      pgResponse: req.body.paymentGatewayResponse,
      couponCode: req.body.couponCode,
      corporateUserId,
      partnerId: req.user.registeredBy,
      accessKey: VERIFICATION_SUITE_ACCESS_KEY,
    });
  } else {
    transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });
  }

  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
    return next(new ErrorResponse(transactionResponse.error, 500));
  }

  publishJournal("payment");

  // The money has already moved at this point (wallet debited / PG captured by the calls above) - if
  // computing the addon's expiry throws, updateDetails falls back to a FAILURE shape instead of a
  // SUCCESS one, so the branch below refunds it rather than silently keeping the charge with no
  // addon granted.
  let updateDetails;
  try {
    // No individual package for verification suite (same as eSign/payroll/turbo), so this addon always
    // expires with the corporate's GROUP plan cycle (or +30 days on Peko Free) - never a fixed offset.
    const expiresAt = await computeAddonEndDate(corporateUserId, new Date(), null);

    updateDetails = {
      corporateTxnId,
      providerId: String(corporateTxnId),
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify({
        accessKey: VERIFICATION_SUITE_ACCESS_KEY,
        quantity,
        unitPrice,
        amountCharged: amount,
        Result: { quantity, expiresAt },
      }),
    };
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Verification suite add-on purchase failed after payment", error: error?.message, corporateTxnId });
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: "Add-on purchase failed",
      errorCode: "Unknown",
      registeredById: req.user.registeredBy,
    };
  }

  await updateWalletTransaction(updateDetails);

  if (updateDetails.message === "Payment Successful") {
    createNotification({
      notificationTitle: "Add-On Purchase Successful",
      notificationBrief: `Your Verification Suite add-on purchase was successful. ${quantity} unit${quantity > 1 ? 's' : ''} for ₹${amount} has been added to your account.`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    });

    await generateSubscriptionInvoiceAttachments({
        amount,
        surcharge,
        couponDiscount: transactionResponse?.couponDiscount || 0,
        corporateTxnId,
        orderId: transactionResponse?.orderId,
        paymentType: "Subscription Add-On",
        credentialId,
        pgAmount: isPgFunded ? req.body.pgAmount : null,
        paymentMethod: pgResponse?.payment_method,
        traceId: req?.LogTraceId,
      });

    return res.status(200).json({
      status: true,
      message: "Add-on purchased successfully",
      data: {
        ...transactionResponse,
        corporateTxnId,
        quantity,
        unitPrice,
        amountCharged: amount,
        expiresAt: JSON.parse(updateDetails.orderResponse).Result.expiresAt,
      },
      responseCode: "000",
    });
  } else {
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
      await cancelPGTransaction(corporateTxnId);
      publishJournal("refund");
    } else {
      try {
        await refundWalletTransaction({ corporateTxnId });
        publishJournal("refund");
      } catch (refundErr) {
        customLog(req?.LogTraceId, "error", { message: "Verification suite add-on refund failed", refundErr: refundErr?.message, corporateTxnId });
      }
    }

    createNotification({
      notificationTitle: "Add-On Purchase Failed",
      notificationBrief: `Your Verification Suite add-on purchase for ₹${amount} could not be completed and has been refunded.`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    });

    const walletDetails = await wallet.findOne({ where: { credentialId }, attributes: ["balance"] });

    return res.status(500).json({
      status: false,
      data: { corporateFinalBalance: walletDetails["balance"] },
      message: "Add-on purchase failed. Amount has been refunded.",
      responseCode: "001",
    });
  }
});
