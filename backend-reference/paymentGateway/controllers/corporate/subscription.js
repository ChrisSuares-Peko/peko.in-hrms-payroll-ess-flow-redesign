const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { createNotification } = require("../../models/use-cases/notification");
const { isTopTierGroupPackage } = require("../../models/use-cases/subscription");
const {
  createSubscription,
  createSubscriptionForAddOns,
} = require("../../utils/subscription");
const { cancelCashfreeSubscription } = require("./cashFreeGateway");

const { createWalletTransaction, refundWalletTransaction, updateWalletTransaction } = require("../../utils/walletTransaction");
const {
  subscriptionIndividualSuccessEmail,
  storagePurchaseSuccess,
  subscriptionPekoPlusSuccessEmail,
} = require("../../utils/emailTemplates/subscription");
const emailer = require("../../utils/emailer");
// const { paymentGateWayRefundFailureEmail } = require("../../utils/emailSender");
// const { refundGatewayTransaction } = require("./pluralGateway");
const { payrollAddOnEmployeesSuccess } = require("../../utils/emailTemplate/payroll");
const { turboAddOnFleetSuccess } = require("../../utils/emailTemplate/turbo");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { eSignAddONSuccessTemplate } = require("../../utils/emailTemplate/esr");
const { eInvoiceAddOnSuccessTemplate } = require("../../utils/emailTemplate/eInvoice");
const { formatNumberWithLocalString } = require("../../utils/formatter");
const { customLog } = require("../../utils/loggerHelper");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { findOne } = require("../../models/use-cases/package");
const operatorsData = require("../../utils/operatorsData.json");
const { findServiceOperatorByAccessKey } = require("../../utils/checkAndFetchServiceDetails");
const { fetchServiceDetails } = require("../../utils/checkAndFetchServiceDetails");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { generateSubscriptionInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { findOneOrderByTxnId } = require("../../models/use-cases/order");
const { getPackagePlanDiscount } = require("../../utils/subscriptionPricing");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");

// Single call site (exports.payment) branches between the Individual-plan and Peko+ designs;
// kept as one helper since both resolve calls belong to the same logical send.
async function resolveSubscriptionPurchaseEmail({ isPekoPlus, name, transactionId, subscription, packageDetails, partnerDetails, subject, logTraceId }) {
  const branding = partnerDetails?.branding || 'Peko';
  const website = partnerDetails?.baseUrl || 'https://peko.one/in';
  const logo = partnerDetails?.logo;
  if (isPekoPlus) {
    return resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_PEKO_PLUS_SUCCESS,
      service: EMAIL_TEMPLATE_SERVICES.SUBSCRIPTION,
      variables: { name, transactionId, branding, website, logo, ...v2LayoutVariables(partnerDetails) },
      fallback: () => subscriptionPekoPlusSuccessEmail(name, transactionId, subscription, partnerDetails),
      fallbackSubject: subject,
      logTraceId,
    });
  }
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_INDIVIDUAL_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.SUBSCRIPTION,
    variables: { name, transactionId, packageName: packageDetails?.packageName, branding, website, logo, ...v2LayoutVariables(partnerDetails) },
    fallback: () => subscriptionIndividualSuccessEmail(name, transactionId, subscription, packageDetails, partnerDetails),
    fallbackSubject: subject,
    logTraceId,
  });
}

// Shared by 3 call sites in this file (addonPayment, subscriptionAddOnsPayment, addonWalletPayment)
// that all dispatch the same "hub" add-on purchase email.
async function resolveSubscriptionStoragePurchaseSuccessEmail(quantity, name, partnerDetails, subject, logTraceId) {
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_STORAGE_PURCHASE_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.SUBSCRIPTION,
    variables: {
      quantity,
      name,
      branding: partnerDetails?.branding || 'Peko',
      website: partnerDetails?.baseUrl || 'https://peko.one/in',
      logo: partnerDetails?.logo,
      ...v2LayoutVariables(partnerDetails),
    },
    fallback: () => storagePurchaseSuccess(quantity, name, partnerDetails),
    fallbackSubject: subject,
    logTraceId,
  });
}

// Shared by the same 3 call sites (addonPayment, subscriptionAddOnsPayment, addonWalletPayment)
// for the payroll add-on. Ported from AE's own (never-resolver-wired) payrollAddOnEmployeesSuccess —
// see the SUBSCRIPTION_PAYROLL_ADDON_SUCCESS registry comment for context.
async function resolveSubscriptionPayrollAddonSuccessEmail(quantity, name, partnerDetails, pgAmount, subscription, packageDetails, logTraceId) {
  const employeeText = quantity > 1 ? 'employees' : 'employee';
  const addOnName = packageDetails?.packageName || `${quantity} ${employeeText}`;
  const subject = `${addOnName} has been added to your subscription`;
  const amount = `₹ ${formatNumberWithLocalString(pgAmount)}`;
  const effectiveDate = new Date(subscription?.subscriptionStartDate || Date.now())
    .toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.SUBSCRIPTION_PAYROLL_ADDON_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.SUBSCRIPTION,
    variables: {
      adminName: name,
      addOnName,
      amount,
      effectiveDate,
      branding: partnerDetails?.branding || 'Peko',
      website: partnerDetails?.baseUrl || 'https://peko.one/in',
      logo: partnerDetails?.logo,
      ...v2LayoutVariables(partnerDetails),
    },
    fallback: () => payrollAddOnEmployeesSuccess({ adminName: name, addOnName, amount, effectiveDate, templateDetails: partnerDetails }),
    fallbackSubject: subject,
    logTraceId,
  });
}

exports.payment = asyncHandler(async (req, res, next) => {
  if (req.body.isMandate) {
    customLog(req?.LogTraceId, 'error', {
      message: 'isMandate flag received on /payment endpoint - should use create-subscription-order',
      corporateId: req.user?.corporateId,
      body: req.body,
    });
    return next(new ErrorResponse('Something went wrong. Please try again or contact support.', 400));
  }
  const isGatewayConfirmed = req.isGatewayConfirmedPurchase === true;
  const corporateId = req.user.corporateId;
  const emailId = req.user.email;
  const companyName = req.user.name;
  const corporateTxnId = isGatewayConfirmed ? (req.body.paymentRefId || new Date().valueOf()) : new Date().valueOf();
  const data = isGatewayConfirmed
    ? req.body
    : {
        packageId: req.body.packageId,
        pgAmount: req.body.pgAmount,
        billingType: req.body.billingType,
        couponCode: req.body.couponCode,
        isOneTime: req.body.isOneTime === true,
      };
  const pgAmount = data.pgAmount;
  const subCorporateEmail = req.user.subCorporateEmail;
  const partnerId = req.user.registeredBy;
  const credentialId = req.user.id;

  if (!isGatewayConfirmed && Number(pgAmount) !== 0) {
    customLog(req?.LogTraceId, "error", {
      message: "Direct subscription payment rejected — only a fully covered (₹0) purchase may skip the payment gateway",
      action: "subscription:directPayment:nonZeroRejected",
      corporateId,
      packageId: data.packageId,
      pgAmount,
    });
    return next(new ErrorResponse("Something went wrong. Please try again or contact support.", 400));
  }

  const quotedAt = isGatewayConfirmed ? (req.body.quotedAt || req.gatewayOrderCreatedAt || null) : new Date();
  const creditCurrentGroupPlan = isGatewayConfirmed ? !!req.body.quotedAt : true;

  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  
  const subscriptionServiceDetails = await findServiceOperatorByAccessKey(
    operatorsData["subscriptionPlans"]["accessKey"]
  );

  if (Object.prototype.hasOwnProperty.call(subscriptionServiceDetails, "error")) {
    return next(new ErrorResponse(subscriptionServiceDetails["error"], 500));
  }

  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse)
      ? req.body.paymentGatewayResponse[0]
      : req.body?.paymentGatewayResponse;

  const planDiscount = getPackagePlanDiscount(await findOne({ id: data.packageId }), req.body.billingType);
  const reportData = await computeJournalData({
    serviceDetails: subscriptionServiceDetails,
    pgAmount: req.body.paymentGatewayResponse ? Number(pgAmount || 0) : 0,
    amount: Number(req.body.amount || 0) + planDiscount,
    paymentMethod: pgResponse?.payment_method || {},
    partnerDetails,
    paymentGatewayName: pgResponse?.paymentGatewayName,
    couponTotalDiscount: (req.body.couponTotalDiscount || 0) + planDiscount,
    corporateState: req.user.state,
    billingType: req.body.billingType,
    isSubscription: true,
  });

  const transactionResponse = await createSubscription({
    ...data,
    corporateId,
    corporateTxnId,
    partnerId,
    credentialId,
    isInitialPurchase: true,
    quotedAt,
    creditCurrentGroupPlan,
    reportData,
  }, req?.LogTraceId);

  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
    // if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
    //   let refundPGResponse = await refundGatewayTransaction(
    //     req,
    //     req.body.paymentGatewayResponse
    //   );
    //   if (
    //     refundPGResponse?.ppc_PinePGTxnStatus == 6 &&
    //     refundPGResponse.ppc_TxnResponseCode == 1
    //   ) {
    //     await paymentGateWayRefundFailureEmail(req);
    //   }
    // }
    if (isGatewayConfirmed) {
      await cancelPGTransaction(corporateTxnId);
    }
    
    let packageName = null;
    if (data?.packageId) {
      const packageDetails = await findOne({ id: data.packageId });
      packageName = packageDetails?.packageName;
    }
    
    const notificationData = {
      notificationTitle: "Upgrade Failed",
      notificationBrief: packageName
        ? `We regret to inform you that the ${packageName} plan upgrade failed. Please try again.`
        : "We regret to inform you that the plan upgrade failed. Please try again.",
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    createNotification(notificationData);

    // const to = emailId;
    // const subject = "Subscription Failed";
    // const body = subscriptionFailedEmail(companyName, corporateTxnId, pgAmount);
    // emailer.email(to, subject, body);
    
      return res.status(500).json({
        status: false,
        message: "Something went wrong",
        data: {
          message: transactionResponse["message"],
        },
        responseCode: "001",
      });
    
  } else {
    const { subscription, packageDetails } = transactionResponse;

    if (reportData?.journalData) {
      publishJournalEvent(
        {
          transactionRef: corporateTxnId,
          type: "payment",
          contextSnapshot: {
            credentialId,
            vendor: subscriptionServiceDetails?.vendor || null,
            registeredBy: partnerId || null,
          },
          reportData,
        },
        req?.LogTraceId
      );
    }

    // Best-effort: a one-time purchase that superseded a mandate-backed GROUP plan leaves the old Cashfree
    // mandate orphaned (its plan is now UPGRADED so the scheduler never charges it, but the mandate lingers).
    // Cancel it AFTER the subscription is committed — fire-and-forget so it can never delay or fail the
    // purchase (cancelCashfreeSubscription itself already swallows errors). Lazy require avoids the
    // cashFreeGateway ↔ subscription circular load.
    if (transactionResponse.supersededMandateId) {
      (async () => {
        try {
          const serviceDetails = await findServiceOperatorByAccessKey(operatorsData["cashFreeSubscriptions"]["accessKey"]);
          if (serviceDetails?.vendor) {
            await cancelCashfreeSubscription(serviceDetails, transactionResponse.supersededMandateId, req?.LogTraceId);
          } else {
            customLog(req?.LogTraceId, "error", { message: "Superseded-mandate cancel skipped — subscriptions merchant not configured", supersededMandateId: transactionResponse.supersededMandateId });
          }
        } catch (cancelErr) {
          customLog(req?.LogTraceId, "error", { message: "Best-effort superseded-mandate cancel failed", supersededMandateId: transactionResponse.supersededMandateId, error: cancelErr?.message ?? cancelErr });
        }
      })();
    }

    const to = [emailId, subCorporateEmail];
    let subject = `${packageDetails.packageName} Subscription Purchase Confirmation`;

    let notificationData;
    let body;
    if (packageDetails.packageType === "INDIVIDUAL") {
      notificationData = {
        notificationTitle: "Purchase Successful ",
        notificationBrief: `We are pleased to inform you that your ${packageDetails.packageName} subscription purchase has been successful with the payment of ₹ ${formatNumberWithLocalString(pgAmount)}. Your service is now active.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      const resolvedIndividual = await resolveSubscriptionPurchaseEmail({
        isPekoPlus: false,
        name: companyName,
        transactionId: corporateTxnId,
        subscription,
        packageDetails,
        partnerDetails,
        subject,
        logTraceId: req?.LogTraceId,
      });
      subject = resolvedIndividual.subject;
      body = resolvedIndividual.html;
    } else {
      const resolvedUpgrade = await resolveSubscriptionPurchaseEmail({
        isPekoPlus: await isTopTierGroupPackage(packageDetails.id),
        name: companyName,
        transactionId: corporateTxnId,
        subscription,
        packageDetails,
        partnerDetails,
        subject,
        logTraceId: req?.LogTraceId,
      });
      subject = resolvedUpgrade.subject;
      body = resolvedUpgrade.html;

      const { currentSubscription } = transactionResponse;
      notificationData = {
        notificationTitle: "Purchase Successful ",
        notificationBrief: `Thank you for upgrading your plan from ${currentSubscription?.package?.packageName} to ${packageDetails.packageName}. Your payment of ₹ ${formatNumberWithLocalString(pgAmount)} has been successfully processed, and your new plan features are now active.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
    }
    
    const subscriptionCouponDiscount = Number(transactionResponse?.couponDiscount) || 0;
    const attachments = await generateSubscriptionInvoiceAttachments({
      amount: Number(pgAmount || 0) + subscriptionCouponDiscount,
      couponDiscount: subscriptionCouponDiscount,
      corporateTxnId,
      orderId: transactionResponse?.orderId,
      paymentType: "Subscription",
      description: `${packageDetails?.packageName || "Subscription"}${subscription?.billingType === 'MONTHLY' ? ' (Monthly)' : subscription?.billingType === 'ANNUALLY' ? ' (Annually)' : ''}`,
      credentialId,
      pgAmount,
      paymentMethod: pgResponse?.payment_method,
      traceId: req?.LogTraceId,
    });
    emailer.emailWithMultipleAttachment(to, subject, body, attachments, async (emailErr) => {
       if (emailErr) {
        customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr })
       } else {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
       }
     });
    createNotification(notificationData);

    
      return res.status(200).json({
        status: true,
        data: {
          subscription: subscription,
          corporateTxnId,
        },
        message: "payment successfull",
        responseCode: "000",
      });
    }
});

exports.addonPayment = asyncHandler(async (req, res) => {
  const corporateId = req.user.corporateId;
  const emailId = req.user.email;
  const companyName = req.user.name;
  const corporateTxnId = req.body.corporateTxnId || req.body.paymentRefId || new Date().valueOf();
  const data = req.body;
  const pgAmount = req.body.pgAmount;
  const { addonsAccessKey, quantity } = data;
  const subCorporateEmail = req.user.subCorporateEmail;

  const paymentResponse = req.body.paymentGatewayResponse;
  const successPayment = Array.isArray(paymentResponse)
    ? paymentResponse.find(p => p.payment_status === 'SUCCESS')
    : paymentResponse;
  const providerId = successPayment?.cf_payment_id ?? String(corporateTxnId);

  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);

  const addonServiceDetails = await fetchServiceDetails({ credentialId: req.user.id, accessKey: addonsAccessKey, packageId: data.packageId, corporateUserId: corporateId });
  let reportData = {};
  if (!Object.prototype.hasOwnProperty.call(addonServiceDetails, 'error')) {
    const pgResp = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
    reportData = await computeJournalData({
      serviceDetails: addonServiceDetails,
      pgAmount: Number(pgAmount || 0),
      amount: Number(pgAmount || 0),
      paymentMethod: pgResp?.payment_method || {},
      partnerDetails,
      paymentGatewayName: pgResp?.paymentGatewayName || 'Cashfree',
      couponTotalDiscount: req.body.couponTotalDiscount,
      corporateState: req.user.state || '',
      isSubscription: true,
    });
  }

  const transactionResponse = await createSubscriptionForAddOns({
    ...data,
    corporateId,
    corporateTxnId,
    partnerId: req.user.registeredBy,
    providerId,
    subscriptionId: null,
    traceId: req?.LogTraceId,
    reportData,
  });

  if (reportData?.journalData) {
    publishJournalEvent(
      {
        transactionRef: corporateTxnId,
        type: "payment",
        contextSnapshot: {
          credentialId: req.user.id,
          vendor: addonServiceDetails?.vendor || null,
          registeredBy: req?.user?.registeredBy || null,
        },
        reportData,
      },
      req?.LogTraceId
    );
  }

  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
    customLog(req?.LogTraceId, 'error', {
      message: 'addonPayment: createSubscriptionForAddOns failed',
      reason: transactionResponse,
      corporateTxnId,
      corporateId,
      addonsAccessKey,
    });

    if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
      await cancelPGTransaction(corporateTxnId);
      if (reportData?.journalData) {
        publishJournalEvent(
          {
            transactionRef: corporateTxnId,
            type: "refund",
            contextSnapshot: {
              credentialId: req.user.id,
              vendor: addonServiceDetails?.vendor || null,
              registeredBy: req?.user?.registeredBy || null,
            },
            reportData,
          },
          req?.LogTraceId
        );
      }
    }

    let packageName = null;
    if (data?.packageId) {
      const packageDetails = await findOne({ id: data.packageId });
      packageName = packageDetails?.packageName;
    }

    const notificationData = {
      notificationTitle: "Upgrade Failed",
      notificationBrief: packageName
        ? `We regret to inform you that the ${packageName} plan upgrade failed. Please try again.`
        : "We regret to inform you that the plan upgrade failed. Please try again.",
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    createNotification(notificationData);

    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {
        message: transactionResponse["message"],
      },
      responseCode: "001",
    });
  } else {
    const { subscription, packageDetails, serviceOperator } = transactionResponse;

    const to = [emailId, subCorporateEmail];
    let subject;
    let notificationData;
    let body;

    if (addonsAccessKey === operatorsData['eSign']['accessKey']) {
      subject = `${quantity} E-signs purchased successfully `;
      body = eSignAddONSuccessTemplate(quantity, companyName, partnerDetails);
    } else if (addonsAccessKey === operatorsData['hub']['accessKey']) {
      subject = 'Additional storage purchased successfully ';
      const resolvedStorage = await resolveSubscriptionStoragePurchaseSuccessEmail(quantity, companyName, partnerDetails, subject, req?.LogTraceId);
      subject = resolvedStorage.subject;
      body = resolvedStorage.html;
    } else if (addonsAccessKey === operatorsData['payroll']['accessKey']) {
      subject = `${quantity} employees added to your Payroll successfully `;
      const resolvedPayroll = await resolveSubscriptionPayrollAddonSuccessEmail(quantity, companyName, partnerDetails, pgAmount, subscription, packageDetails, req?.LogTraceId);
      subject = resolvedPayroll.subject;
      body = resolvedPayroll.html;
    } else if (addonsAccessKey === operatorsData['turbo']['accessKey']) {
      subject = `${quantity} added to your Turbo fleet successfully `;
      body = turboAddOnFleetSuccess(quantity, companyName, partnerDetails);
    } else if (addonsAccessKey === operatorsData['eInvoice']['accessKey']) {
      subject = `${quantity} E-Invoice ${Number(quantity) === 1 ? 'credit' : 'credits'} purchased successfully `;
      body = eInvoiceAddOnSuccessTemplate(quantity, companyName, partnerDetails);
    }

    if (packageDetails.packageType === "INDIVIDUAL") {
      notificationData = {
        notificationTitle: "Purchase Successful",
        notificationBrief: `We are pleased to inform you that your ${packageDetails.packageName} subscription upgrade has been successful with the payment of ₹ ${formatNumberWithLocalString(pgAmount)}. Your service is now active.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
    } else {
      const serviceName = serviceOperator?.serviceProvider;
      const addonLabel = serviceName ? `Add On (${serviceName})` : `Add On`;
      notificationData = {
        notificationTitle: "Add-On Purchase Successful",
        notificationBrief: `Your add-on purchase was successful. ${addonLabel} - ${quantity} unit${quantity > 1 ? 's' : ''} for ₹${formatNumberWithLocalString(pgAmount)} has been activated on your account.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
    }

    createNotification(notificationData);

    (async () => {
      try {
        if (!body) {
          customLog(req?.LogTraceId, "info", { message: "Skipping addon email - no template for access key", addonsAccessKey });
          return;
        }
        const attachments = await generateSubscriptionInvoiceAttachments({
          amount: pgAmount,
          corporateTxnId,
          orderId: transactionResponse?.orderId,
          paymentType: "Subscription Add-On",
          description: serviceOperator?.serviceProvider
            ? `Add On (${serviceOperator.serviceProvider}) - ${quantity} unit${quantity > 1 ? 's' : ''}`
            : `${packageDetails?.packageName || 'Subscription'} Add-On`,
          credentialId: req.user.id,
          pgAmount,
          paymentMethod: successPayment?.payment_method,
          traceId: req?.LogTraceId,
        });
        emailer.emailWithMultipleAttachment(to, subject, body, attachments, (emailErr) => {
          if (emailErr) {
            customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr });
          } else {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
          }
        });
      } catch (err) {
        customLog(req?.LogTraceId, "error", { message: "addonPayment: receipt/email failed", err });
      }
    })();

    return res.status(200).json({
      status: true,
      data: {
        subscription: subscription,
        corporateTxnId,
      },
      message: "payment successfull",
      responseCode: "000",
    });
  }
});

exports.subscriptionAddOnsPayment = asyncHandler(async (req, res) => {
  const corporateId = req.user.corporateId;
  const emailId = req.user.email;
  const companyName = req.user.name;
  const corporateTxnId = req.body.paymentRefId || new Date().valueOf();
  const data = req.body;
  const pgAmount = req.body.pgAmount;
  const { addonsAccessKey, quantity } = data
  const subCorporateEmail = req.user.subCorporateEmail;

  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  const transactionResponse = await createSubscriptionForAddOns({
    ...data,
    corporateId,
    corporateTxnId,
    partnerId: req.user.registeredBy,
    traceId: req?.LogTraceId,
  });

  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
    // if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
    //   let refundPGResponse = await refundGatewayTransaction(
    //     req,
    //     req.body.paymentGatewayResponse
    //   );
    //   if (
    //     refundPGResponse?.ppc_PinePGTxnStatus == 6 &&
    //     refundPGResponse.ppc_TxnResponseCode == 1
    //   ) {
    //     await paymentGateWayRefundFailureEmail(req);
    //   }
    // }
    if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
      await cancelPGTransaction(corporateTxnId);
    } 
    
    let packageName = null;
    if (data?.packageId) {
      const packageDetails = await findOne({ id: data.packageId });
      packageName = packageDetails?.packageName;
    }
    
    const notificationData = {
      notificationTitle: "Upgrade Failed",
      notificationBrief: packageName
        ? `We regret to inform you that the ${packageName} plan upgrade failed. Please try again.`
        : "We regret to inform you that the plan upgrade failed. Please try again.",
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    createNotification(notificationData);

    // const to = emailId;
    // const subject = "Subscription Failed";
    // const body = subscriptionFailedEmail(companyName, corporateTxnId, pgAmount);
    // emailer.email(to, subject, body);

      return res.status(500).json({
        status: false,
        message: "Something went wrong",
        data: {
          message: transactionResponse["message"],
        },
        responseCode: "001",
      });
    
  } else {
    const { subscription, packageDetails, serviceOperator } = transactionResponse;

    const to = [emailId, subCorporateEmail];
    let subject;
    let notificationData;
    let body;

    if (addonsAccessKey === operatorsData['eSign']['accessKey']) {
      subject = `${quantity} E-signs purchased successfully `;
      body = eSignAddONSuccessTemplate(quantity, companyName, partnerDetails);
    } else if (addonsAccessKey === operatorsData['hub']['accessKey']) {
      subject = 'Additional storage purchased successfully ';
      const resolvedStorage = await resolveSubscriptionStoragePurchaseSuccessEmail(quantity, companyName, partnerDetails, subject, req?.LogTraceId);
      subject = resolvedStorage.subject;
      body = resolvedStorage.html;
    } else if (addonsAccessKey === operatorsData['payroll']['accessKey']) {
      subject = `${quantity} employees added to your Payroll successfully `;
      const resolvedPayroll = await resolveSubscriptionPayrollAddonSuccessEmail(quantity, companyName, partnerDetails, pgAmount, subscription, packageDetails, req?.LogTraceId);
      subject = resolvedPayroll.subject;
      body = resolvedPayroll.html;
    } else if (addonsAccessKey === operatorsData['turbo']['accessKey']) {
      subject = `${quantity} added to your Turbo fleet successfully `;
      body = turboAddOnFleetSuccess(quantity, companyName, partnerDetails);
    } else if (addonsAccessKey === operatorsData['eInvoice']['accessKey']) {
      subject = `${quantity} E-Invoice ${Number(quantity) === 1 ? 'credit' : 'credits'} purchased successfully `;
      body = eInvoiceAddOnSuccessTemplate(quantity, companyName, partnerDetails);
    }

    if (packageDetails.packageType === "INDIVIDUAL") {
      notificationData = {
        notificationTitle: "Purchase Successful",
        notificationBrief: `We are pleased to inform you that your ${packageDetails.packageName} subscription upgrade has been successful with the payment of ₹ ${formatNumberWithLocalString(pgAmount)}. Your service is now active.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
    } else {
      const serviceName = serviceOperator?.serviceProvider;
      const addonLabel = serviceName ? `Add On (${serviceName})` : `Add On`;
      notificationData = {
        notificationTitle: "Add-On Purchase Successful",
        notificationBrief: `Your add-on purchase was successful. ${addonLabel} - ${quantity} unit${quantity > 1 ? 's' : ''} for ₹${formatNumberWithLocalString(pgAmount)} has been activated on your account.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
    }

    createNotification(notificationData);

    // Fire-and-forget: receipt PDF + email run in background so the API response
    // is not blocked on puppeteer, and concurrent purchases don't pile up.
    (async () => {
      try {
        if (!body) {
          customLog(req?.LogTraceId, "info", { message: "Skipping addon email - no template for access key", addonsAccessKey });
          return;
        }
        const pgResp = Array.isArray(req.body?.paymentGatewayResponse)
          ? req.body.paymentGatewayResponse[0]
          : req.body?.paymentGatewayResponse;
        const attachments = await generateSubscriptionInvoiceAttachments({
          amount: pgAmount,
          corporateTxnId,
          orderId: transactionResponse?.orderId,
          paymentType: "Subscription Add-On",
          description: serviceOperator?.serviceProvider
            ? `Add On (${serviceOperator.serviceProvider}) - ${quantity} unit${quantity > 1 ? 's' : ''}`
            : `${packageDetails?.packageName || 'Subscription'} Add-On`,
          credentialId: req.user.id,
          pgAmount,
          paymentMethod: pgResp?.payment_method,
          traceId: req?.LogTraceId,
        });
        emailer.emailWithMultipleAttachment(to, subject, body, attachments, (emailErr) => {
          if (emailErr) {
            customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr });
          } else {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
          }
        });
      } catch (err) {
        customLog(req?.LogTraceId, "error", { message: "subscriptionAddOnsPayment: receipt/email failed", err });
      }
    })();

    return res.status(200).json({
      status: true,
      data: {
        subscription: subscription,
        corporateTxnId,
      },
      message: "payment successfull",
      responseCode: "000",
    });
  }
});

exports.addonWalletPayment = asyncHandler(async (req, res) => {
  const credentialId = req.user.id;
  const corporateId = req.user.corporateId;
  const emailId = req.user.email;
  const companyName = req.user.name;
  const subCorporateEmail = req.user.subCorporateEmail;
  const corporateTxnId = new Date().valueOf();

  const { pgAmount, addonsAccessKey, packageId, quantity } = req.body;

  if (!pgAmount || !addonsAccessKey || !quantity) {
    return res.status(400).json({ status: false, message: "Missing required fields", responseCode: "001" });
  }

  // Deduct from wallet atomically via generic utility
  const walletResult = await createWalletTransaction({
    credentialId,
    corporateTxnId,
    transactionCategory: "SUBSCRIPTION ADDON",
    amount: pgAmount,
    surcharge: 0,
    providerCommission: 0,
    commissionType: "FLAT",
    cashbackType: "FLAT",
    corporateCashback: 0,
    providerId: String(corporateTxnId),
    reportData: { optional: "SUBSCRIPTION-ADDONS" },
  });

  if (walletResult?.error === "INSUFFICIENT WALLET BALANCE") {
    return res.status(400).json({ status: false, message: "Insufficient wallet balance", responseCode: "001" });
  }
  if (walletResult?.error) {
    customLog(req?.LogTraceId, "error", { message: "addonWalletPayment: wallet deduction failed", walletResult });
    return res.status(500).json({ status: false, message: "Something went wrong", responseCode: "001" });
  }

  // Create the subscription
  const transactionResponse = await createSubscriptionForAddOns({
    corporateId,
    corporateTxnId,
    pgAmount,
    quantity,
    addonsAccessKey,
    packageId,
    partnerId: req.user.registeredBy,
    credentialId,
    providerId: String(corporateTxnId),
    paymentMode: "WALLET",
    traceId: req?.LogTraceId,
  });

  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
    // Refund wallet via generic utility
    try {
      await refundWalletTransaction({ corporateTxnId });
    } catch (refundErr) {
      customLog(req?.LogTraceId, "error", { message: "addonWalletPayment: wallet refund failed", refundErr, corporateTxnId });
    }

    let packageName = null;
    if (packageId) {
      const packageDetails = await findOne({ id: packageId });
      packageName = packageDetails?.packageName;
    }
    createNotification({
      notificationTitle: "Add-On Purchase Failed",
      notificationBrief: packageName
        ? `We regret to inform you that the ${packageName} add-on purchase failed. Please try again.`
        : "We regret to inform you that the add-on purchase failed. Please try again.",
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    });

    return res.status(500).json({ status: false, message: "Something went wrong", responseCode: "001" });
  }

  const { subscription, packageDetails, serviceOperator, addonBillingType, taxBreakdown } = transactionResponse;
  const serviceName = serviceOperator?.serviceProvider;
  const addonLabel = serviceName ? `Add On (${serviceName})` : `Add On`;

  // Update the PENDING wallet order to SUCCESS now that the subscription row is committed.
  await updateWalletTransaction({
    corporateTxnId,
    providerId: String(corporateTxnId),
    status: "SUCCESS",
    message: "Payment Successful",
    orderResponse: JSON.stringify({
      subscriptionId: subscription.id,
      serviceName: serviceName ?? null,
      quantity,
      pgAmount,
      optional: "SUBSCRIPTION-ADDONS",
      billingType: addonBillingType,
      taxableAmount: taxBreakdown?.taxableAmount,
      taxAmount: taxBreakdown?.taxAmount,
      taxRate: taxBreakdown?.taxRate,
    }),
  });

  createNotification({
    notificationTitle: "Add-On Purchase Successful",
    notificationBrief: `Your add-on purchase was successful. ${addonLabel} - ${quantity} unit${quantity > 1 ? 's' : ''} for ₹${formatNumberWithLocalString(pgAmount)} has been activated on your account.`,
    notificationTo: [req.user.username],
    notificationCategory: "CORPORATE",
    notificationBy: "ADMIN",
  });

  // Fire-and-forget: receipt PDF + email run in background so the API response
  // is not blocked on puppeteer, and concurrent purchases don't pile up.
  (async () => {
    try {
      const { addonsAccessKey: ak } = req.body;
      const partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
      let body;
      let subject = `${packageDetails.packageName} Add-On Purchase Confirmation`;
      if (ak === operatorsData['eSign']['accessKey']) {
        body = eSignAddONSuccessTemplate(quantity, companyName, partnerDetails);
      } else if (ak === operatorsData['hub']['accessKey']) {
        const resolvedStorage = await resolveSubscriptionStoragePurchaseSuccessEmail(quantity, companyName, partnerDetails, 'Additional storage purchased successfully ', req?.LogTraceId);
        subject = resolvedStorage.subject;
        body = resolvedStorage.html;
      } else if (ak === operatorsData['payroll']['accessKey']) {
        const resolvedPayroll = await resolveSubscriptionPayrollAddonSuccessEmail(quantity, companyName, partnerDetails, pgAmount, subscription, packageDetails, req?.LogTraceId);
        subject = resolvedPayroll.subject;
        body = resolvedPayroll.html;
      } else if (ak === operatorsData['turbo']['accessKey']) {
        body = turboAddOnFleetSuccess(quantity, companyName, partnerDetails);
      } else if (ak === operatorsData['eInvoice']['accessKey']) {
        body = eInvoiceAddOnSuccessTemplate(quantity, companyName, partnerDetails);
      }
      if (!body) {
        customLog(req?.LogTraceId, "info", { message: "Skipping addon email - no template for access key", ak });
        return;
      }
      // Wallet add-on order row was created by createWalletTransaction — look it up
      // so the invoice/receipt gets persisted on it.
      const walletOrder = await findOneOrderByTxnId(corporateTxnId);
      const attachments = await generateSubscriptionInvoiceAttachments({
        amount: pgAmount,
        corporateTxnId,
        orderId: walletOrder?.id,
        paymentType: "Subscription Add-On",
        description: `${addonLabel} - ${quantity} unit${quantity > 1 ? 's' : ''}`,
        credentialId,
        pgAmount: null, // wallet payment — payment mode resolves to WALLET
        traceId: req?.LogTraceId,
      });
      const to = [emailId, subCorporateEmail];
      emailer.emailWithMultipleAttachment(to, subject, body, attachments, (emailErr) => {
        if (emailErr) customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr });
      });
    } catch (emailErr) {
      customLog(req?.LogTraceId, "error", { message: "addonWalletPayment: email/receipt failed", emailErr });
    }
  })();

  return res.status(200).json({
    status: true,
    data: { subscription, corporateTxnId },
    message: "payment successfull",
    responseCode: "000",
  });
});

// Initialize the AiSensy project for a bundled WhatsApp BASIC row whose projectId
// is still the PENDING sentinel. Frontend calls this on first visit to the
// WhatsApp Business module when it detects the bundled-but-uninitialized state.
exports.initializeBundledWhatsAppProject = asyncHandler(async (req, res) => {
  const { initializeBundledWhatsAppProject } = require("../../utils/whatsappForBusiness");
  const corporateUserId = req.user.corporateId;
  const credentialId = req.user.id;
  const username = req.user.username;

  customLog(req?.LogTraceId, 'info', {
    message: '[WA-BUNDLE] /whatsapp-bundle/init controller: entry',
    corporateUserId,
    credentialId,
    username,
    reqUser: req.user,
  });

  const result = await initializeBundledWhatsAppProject({ corporateUserId, credentialId, username, traceId: req?.LogTraceId });

  customLog(req?.LogTraceId, 'info', {
    message: '[WA-BUNDLE] /whatsapp-bundle/init controller: util returned',
    corporateUserId,
    result,
  });

  if (!result) {
    // No bundled row found - nothing to init. Frontend should fall back to normal WhatsApp flow.
    customLog(req?.LogTraceId, 'info', {
      message: '[WA-BUNDLE] /whatsapp-bundle/init controller: no bundle - responding initialized:false',
      corporateUserId,
    });
    return res.status(200).json({
      status: true,
      data: { initialized: false, reason: "no_bundle" },
      message: "No bundled WhatsApp subscription found",
      responseCode: "000",
    });
  }
  if (result.error) {
    // Soft-fail: a bundle exists but AiSensy is unhappy (business not provisioned, project
    // create failed, etc.). Don't 500 here - the dashboard still renders, and the next mount
    // (or the createBusinessProfile materialization step) will retry. Return 200 with
    // responseCode '003' so the frontend's Axios interceptor doesn't fire an error toast.
    customLog(req?.LogTraceId, "error", { message: "[WA-BUNDLE] initializeBundledWhatsAppProject failed - responding 200 silent", corporateUserId, reason: result.message });
    return res.status(200).json({
      status: false,
      data: { initialized: false, reason: result.message || "init_failed" },
      message: result.message || "Failed to initialize WhatsApp project",
      responseCode: "003",
    });
  }
  customLog(req?.LogTraceId, 'info', {
    message: '[WA-BUNDLE] /whatsapp-bundle/init controller: success - responding initialized:true',
    corporateUserId,
    projectId: result.projectId,
  });
  return res.status(200).json({
    status: true,
    data: { initialized: true, ...result },
    message: "WhatsApp project ready",
    responseCode: "000",
  });
});
