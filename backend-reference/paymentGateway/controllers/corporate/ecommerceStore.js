const { createNotification } = require("../../models/use-cases/notification");
const { paymentGateWayRefundFailureEmail } = require("../../utils/emailSender");
const emailer = require("../../utils/emailer");
const { refundCashfreeDirect } = require("../../utils/pgRefund");
const asyncHandler = require("../../middlewares/async");
const { formatNumberWithLocalString } = require("../../utils/formatter");
const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const cleverTap = require("../../services/CleverTap");
const { createEcommerceStoreSubscription } = require("../../utils/ecommerceStoreSubscription");
const { computeUpgradeCredit } = require("../../utils/upgradeCredit");
const { createExpense } = require("./expense");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { customLog } = require("../../utils/loggerHelper");
const ErrorResponse = require("../../utils/error-response");
const { generateSubscriptionInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { generateEcommerceStorePaymentSuccessEmail } = require("../../utils/emailTemplates/ecommerceStore");
const { computeJournalData } = require("../../utils/computeJournalData");
const { journalBillingType, ecommerceStoreInvoiceDescription } = require("../../utils/billingCycle");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { findOne: findPackage } = require("../../models/use-cases/package");
const { findActiveByAccessCode } = require("../../models/use-cases/serviceSubscription");

const accessKey = "ecommerce_store";

// Commission lives on the specific package (Starter/Growth/Advanced), not the shared
// ecommerce_store service operator — each plan can price and commission differently.
// planCommissions carries a per-duration override; same shape as WhatsApp's own
// getWaCommissionFields in cashFreeGateway.js.
const getPackageCommissionFields = (pkg, duration) => {
  const override = duration && pkg?.planCommissions?.[duration.toLowerCase()];
  return {
    ...(override || {
      commissionMode: pkg?.commissionMode,
      commissionType: pkg?.commissionType,
      commission: pkg?.commission,
      fixedCommissionPerTransaction: pkg?.fixedCommissionPerTransaction,
      isCommissionInclGST: pkg?.isCommissionInclGST,
    }),
    isCommissionConfigured: pkg?.isCommissionConfigured,
  };
};

exports.payment = asyncHandler(async (req, res, next) => {
  const corporateId = req.user.corporateId;
  const credentialId = req.user.id;
  const emailId = req.user.email;
  const subCorporateEmail = req.user.subCorporateEmail;
  const companyName = req.user.name;
  const corporateTxnId = req.body.paymentRefId || req.body.corporateTxnId || new Date().valueOf();
  const data = req.body;
  const pgAmount = req.body.pgAmount;
  const amount = Number(req.body.amount);
  const packageId = req.user.packageId;
  const hasPgResponse = Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse");

  const corporateUserId = req.user.corporateId;

  let partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        400
      )
    );
  }
  const serviceOperatorId = serviceDetails.id;

  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse)
      ? req.body.paymentGatewayResponse[0]
      : req.body?.paymentGatewayResponse;

  const purchasedPackage = await findPackage({ id: req.body.packageId });
  const durationKey = (req.body.subscriptionDuration || "").toLowerCase();
  const commFields = getPackageCommissionFields(purchasedPackage, durationKey);
  const previousActiveSubscription = await findActiveByAccessCode(credentialId, accessKey);
  const creditAmount = computeUpgradeCredit(previousActiveSubscription);
  const listPrice = Number(purchasedPackage?.packagePrices?.[durationKey] || 0);
  const planDiscount = Number(purchasedPackage?.discount?.[durationKey] || 0);
  const planDiscountTaken = listPrice ? Math.min(planDiscount, listPrice) : 0;
  const payablePlanAmount = listPrice ? listPrice - planDiscountTaken : amount;
  const planAmount = Math.max(0, payablePlanAmount - creditAmount);
  const planDetails = [{
    name: purchasedPackage?.packageName ? `Service Package : ${purchasedPackage.packageName}` : "Service Package",
    commissionMode: commFields.commissionMode,
    commissionType: commFields.commissionType,
    commission: commFields.commission,
    fixedCommissionPerTransaction: commFields.fixedCommissionPerTransaction,
    isCommissionInclGST: commFields.isCommissionInclGST,
    isCommissionConfigured: commFields.isCommissionConfigured,
    amount: planAmount,
  }];

  const reportData = await computeJournalData({
    serviceDetails,
    pgAmount,
    amount: amount + planDiscountTaken,
    paymentMethod: pgResponse?.payment_method || {},
    partnerDetails,
    paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
    couponTotalDiscount: (req.body.couponTotalDiscount || 0) + planDiscountTaken,
    planDetails,
    corporateState: req.user.state || "",
    billingType: journalBillingType(req.body.subscriptionDuration),
    isSubscription: true,
  });

  const transactionResponse = await createEcommerceStoreSubscription({
    ...data,
    corporateId,
    credentialId,
    corporateTxnId,
    serviceOperatorId,
    reportData,
    partnerId: req.user.registeredBy,
    couponCode: req.body.couponCode,
  });

    if (reportData?.journalData) {
        publishJournalEvent(
            {
                transactionRef: corporateTxnId,
                type: "payment",
                contextSnapshot: {
                    credentialId,
                    vendor: serviceDetails?.vendor || null,
                    registeredBy: req.user.registeredBy || null,
                },
                reportData,
            },
            req?.LogTraceId
        );
    }

  if (
    transactionResponse &&
    Object.prototype.hasOwnProperty.call(transactionResponse, "error")
  ) {
    if (hasPgResponse) {
      const refundPGResponse = await refundCashfreeDirect({
        req,
        reason: "Peko Commerce subscription creation failed",
        serviceType: "Peko Commerce",
        logTraceId: req?.LogTraceId,
      });
      if (!refundPGResponse?.status) {
        await paymentGateWayRefundFailureEmail(req, "Peko Commerce", "Subscription");
      }
      if (reportData?.journalData) {
        publishJournalEvent(
          {
            transactionRef: corporateTxnId,
            type: "refund",
            contextSnapshot: {
              credentialId,
              vendor: serviceDetails?.vendor || null,
              registeredBy: req.user.registeredBy || null,
            },
            reportData,
          },
          req?.LogTraceId
        );
      }
    }

    cleverTap.uploadEvent({
      eventName: "transactions_payment",
      eventData: {
        status: "Payment Failure",
        amount
      },
      email: emailId,
    });

    const failureNotification = {
      notificationTitle: "Peko Commerce Plan purchase Failed",
      notificationBrief:
        "We regret to inform you that the plan purchase failed. Please try again.",
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
      accessKey,
      action: "2",
    };
    createNotification(failureNotification);

    const failTo = [emailId, subCorporateEmail].filter(Boolean);
    const failSubject = "Peko Commerce Plan purchase Failed";
    const failBody = "We regret to inform you that the plan purchase failed. Please try again.";
    emailer.email({ to: failTo, subject: failSubject, body: failBody }, function () {});

    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {
        message: transactionResponse["message"],
      },
      responseCode: "001",
    });
  }

  cleverTap.uploadEvent({
    eventName: "transactions_payment",
    eventData: {
      status: "Payment Success",
      amount,
    },
    email: emailId,
  });

  const { subscription, packageDetails: createdPackageDetails } = transactionResponse;

  const to = [emailId, subCorporateEmail].filter(Boolean);
  const subject = `${createdPackageDetails.packageName} Plan Purchase Confirmation`;

  const successNotification = {
    notificationTitle: "Purchase Successful ",
    notificationBrief: `We are pleased to inform you that your Peko Commerce ${createdPackageDetails.packageName} plan purchase has been successful with the payment of ₹ ${formatNumberWithLocalString(
      pgAmount
    )}. Your service is now active.`,
    notificationTo: [req.user.username],
    notificationCategory: "CORPORATE",
    notificationBy: "ADMIN",
    accessKey,
    action: "2",
  };

  const body = generateEcommerceStorePaymentSuccessEmail(
    companyName,
    corporateTxnId,
    pgAmount,
    createdPackageDetails.packageName,
    partnerDetails
  );

  createExpense(
    {
      credentialId,
      packageId,
      corporateUserId,
    },
    {
      accounts_id: null,
      amount: parseFloat(amount).toFixed(2),
      payment_method: transactionResponse?.paymentMode,
      credentialId: req.user.id,
      category: serviceDetails?.serviceCategory,
      merchant: serviceDetails?.vendor?.vendorName,
    }
  );

  const couponDiscount = Number(req.body.couponTotalDiscount) || 0;
  const attachments = await generateSubscriptionInvoiceAttachments({
    amount: Number(pgAmount || 0) + couponDiscount,
    couponDiscount,
    corporateTxnId,
    orderId: transactionResponse?.orderId,
    paymentType: "Peko Commerce",
    description: ecommerceStoreInvoiceDescription(createdPackageDetails?.packageName, req.body.subscriptionDuration),
    credentialId,
    pgAmount,
    paymentMethod: pgResponse?.payment_method,
    traceId: req?.LogTraceId,
  });

  emailer.emailWithMultipleAttachment(
    to,
    subject,
    body,
    attachments,
    undefined,
    async (emailErr) => {
      if (emailErr) {
        customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr });
      } else {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
      }
    }
  );

  createNotification(successNotification);

  return res.status(200).json({
    status: true,
    data: {
      subscription,
      corporateTxnId,
    },
    message: "payment successfull",
    responseCode: "000",
  });
});
