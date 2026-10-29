const axios = require("axios");
const {
  fetchServiceDetails,
  calculateSurchargeWithTax,
} = require("../../../utils/checkAndFetchServiceDetails");
const {
  createNotification,
} = require("../../../models/use-cases/notification");
const {
  createWalletTransaction,
  updateWalletTransaction,
  refundWalletTransaction,
} = require("../../../utils/walletTransaction");
const asyncHandler = require("../../../middlewares/async");
const ErrorResponse = require("../../../utils/error-response");
const {
  createPGTransaction,
} = require("../../../utils/paymentGatewayTransaction");
const wallet = require("../../../models/entities/wallet");
const emailer = require("../../../utils/emailer");
const crypto = require("crypto");

// F-PG-14: constant-time checksum comparison. Same result as `expected !== received?.toLowerCase()`
// (a missing or different checksum is rejected); only the timing no longer leaks how much matched.
const isValidJriChecksum = (expected, received) => {
  if (typeof received !== "string") return false;
  const a = Buffer.from(String(expected));
  const b = Buffer.from(received.toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const { getOneTransaction } = require("../../../models/use-cases/transaction");
const { findUserDetails } = require("../../../utils/jwtToken");
const operatorsData = require("./../../../utils/operatorsData.json");
const {
  generateMobilePaymentSuccessEmailBill,
  commonFailedTemplateforBillPayments,
} = require("../../../utils/emailTemplate/billpayments");
const { fetchPartnerDetails } = require("../../../models/use-cases/systemUser");
const { customLog } = require("../../../utils/loggerHelper");
const { cancelPGTransaction } = require("../../../utils/pgRefund");
const { isGatewayPaid, isSplitWithWallet, gatewayModeLabel } = require("../../../utils/paymentModeKind");
const { formatNumberWithLocalString } = require("../../../utils/formatter");
const { computeJournalData } = require("../../../utils/computeJournalData");
const { publishJournalEvent } = require("../../../utils/bull/queue/accountingEventsQueue");
const { generateOrderInvoiceAttachments } = require("../../../services/invoiceAndReceipt");
const { findByProviderName: findMobileRechargeProviderByName } = require("../../../models/use-cases/mobileRechargeProvider");
const { getVendorAmount, amountBeforeCommission, MARKUP_MODES, getQuoteScope } = require("../../../utils/applyCommissionMarkup");
const { resolveEmailTemplate } = require("../../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../../utils/emailTemplate/sharedLayout");

let accessKey = operatorsData["prepaid"]["accessKey"];
let transactionCategory = operatorsData["prepaid"]["category"];
const type = operatorsData["prepaid"]["type"];

// 2 call sites in this file (exports.payment and the JRI push-URL webhook handler) -
// resolveEmailTemplate needs one named helper per rule, not an inline call at each site.
// Reused key: this is the exact same admin-managed template already published for
// payment MS's own BILL_PAYMENT_SUCCESS (service BILL_PAYMENT) - both microservices
// read the same shared row. Each call site supplies its own `fallback`/`fallbackSubject`
// since their original hardcoded calls differ in shape.
async function sendBillPaymentSuccessEmail({ to, cc, serviceType, name, partnerData, fallback, fallbackSubject, registeredBy, logTraceId, files }) {
  const loginUrl = process.env.NODE_ENV === "staging" ? process.env.FRONTEND_STAGING_URL : process.env.FRONTEND_PRODUCTION_URL;
  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.BILL_PAYMENT,
    variables: {
      serviceType,
      name,
      branding: partnerData?.branding || 'Peko',
      website: partnerData?.baseUrl || 'https://peko.one/in',
      loginUrl,
      ...v2LayoutVariables(partnerData),
    },
    fallback,
    fallbackSubject,
    partnerId: registeredBy || null,
    logTraceId,
  });
  emailer.emailWithMultipleAttachment(to, resolved.subject, resolved.html, files, cc, function () {
    customLog(logTraceId, "info", { message: "Email sent to " + to });
  });
}

exports.payment = asyncHandler(async (req, res, next) => {
  
  const account = req.body.account;
  const amount = req.body.amount;
  const serviceProvider = req.body.serviceProvider;
  const location = req.body.location;
  const accessKey = req.body.accessKey;
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;
    const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;
    const subCorporateEmail = req.user.subCorporateEmail;

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
        500
      )
    );
  }
  let corporateTxnId = req.body.corporateTxnId;
  let providerId = corporateTxnId;
  let transactionId = corporateTxnId;
  const API_URL = serviceDetails.vendor.apiUrl;
  const SECURITY_KEY = serviceDetails.vendor.optional4;
  const CORPORATE_ID = serviceDetails.vendor.optional3;
  let commissionType = serviceDetails.commissionType;
  let cashbackType = serviceDetails.cashbackType;
  let providerCommission = serviceDetails.providerCommission;
  let corporateCashback = serviceDetails.cashback;
  let serviceOperatorId = serviceDetails.id;
  
  // Ensure amount is a number
  const numericAmount = parseFloat(amount);
  // Calculate surcharge with tax using common function
  const surchargeDetails = await calculateSurchargeWithTax(
    serviceDetails.surcharge,
    serviceDetails.surchargeType,
    numericAmount,
    credentialId
  );
  const surcharge = surchargeDetails.surcharge;
  
  customLog(req?.LogTraceId, "info", { 
    message: "Payment calculation", 
    originalAmount: amount, 
    numericAmount, 
    surchargeType: serviceDetails.surchargeType || 'FLAT',
    surcharge: serviceDetails.surcharge,
    surchargeWithoutTax: surchargeDetails.surchargeWithoutTax,
    calculatedSurcharge: surcharge,
    expectedTotal: numericAmount + surcharge 
  });
  
  const name = req.user.name;
  const emailId = req.user.email;

  let partnerData = await fetchPartnerDetails(req.user.registeredBy);

  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse)
      ? req.body.paymentGatewayResponse[0]
      : req.body?.paymentGatewayResponse;

  // Commission varies per provider; computeJournalData only knows serviceDetails' single flat rate.
  const rechargeProvider = await findMobileRechargeProviderByName(serviceProvider);
  const journalServiceDetails = rechargeProvider
    ? {
        ...serviceDetails,
        commissionMode: rechargeProvider.commissionMode,
        commission: rechargeProvider.commission,
        commissionType: rechargeProvider.commissionType,
        fixedCommissionPerTransaction: rechargeProvider.fixedCommissionPerTransaction,
        isCommissionInclGST: rechargeProvider.isCommissionInclGST,
        isCommissionConfigured: rechargeProvider.isCommissionConfigured,
        commissionConfigurationName: rechargeProvider.providerName,
      }
    : serviceDetails;

  const reportData = await computeJournalData({
    serviceDetails: journalServiceDetails,
    pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
    amount: numericAmount,
    paymentMethod: pgResponse?.payment_method || {},
    partnerDetails : partnerData,
    paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
    couponTotalDiscount: req.body.couponTotalDiscount,
    corporateState: req.user.state || '',
    credentialId,
  });

  // The amount was checked against the listed plans before the order was created; if that note has expired, work the plan price back out.
  const vendorAmount =
    (await getVendorAmount(amount, operatorsData["prepaid"]["accessKey"], { serviceProvider, credentialId, scope: getQuoteScope(req) })) ??
    (rechargeProvider && MARKUP_MODES.has(rechargeProvider.commissionMode?.toUpperCase())
      ? await amountBeforeCommission(rechargeProvider, amount, credentialId)
      : amount);

  var concatenatedString =
    CORPORATE_ID + account + vendorAmount + corporateTxnId + SECURITY_KEY;
  var checkSum = crypto
    .createHash("sha256")
    .update(concatenatedString)
    .digest("hex");
  let requestData = {
    Amount: vendorAmount,
    APIChecksum: checkSum.toLowerCase(),
    CorporateNumber: CORPORATE_ID,
    IsPostpaid: "N",
    Isspecial: "N",
    Location: location,
    NickName: "",
    Provider: serviceProvider,
    RechargeNumber: account,
    ServiceType: "M",
    SystemReference: corporateTxnId,
  };
  if (process.env.NODE_ENV == "staging") {
    requestData.AuthKey = req.body.authKey;
  }

  let transactionResponse = {};
  const commonParams = {
    providerId,
    corporateTxnId,
    credentialId,
    serviceOperatorId,
    corporateCashback,
    accountNo: account,
    transactionCategory,
    orderAmount: amount,
    commissionType,
    cashbackType,
    providerCommission,
    surcharge,
    reportData
  };
  if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
    transactionResponse = await createPGTransaction({
      ...commonParams,
      pgAmount: req.body.pgAmount,
      pgResponse: req.body.paymentGatewayResponse,
      couponCode: req.body.couponCode,
      corporateUserId,
      partnerId: req.user.registeredBy,
      accessKey: accessKey
    });
    transactionResponse.paymentMode = req.body.paymentMode;
  } else {
    transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });
    transactionResponse.paymentMode = "WALLET";
  }
  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
    return next(new ErrorResponse(transactionResponse["error"], 200));
  }

  if (reportData) {
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
      req?.LogTraceId
    );
  }

  let config = {
    method: "post",
    url: `${API_URL}/api/Recharge`,
    headers: {
      "Content-Type": "application/json",
    },
    data: requestData,
  };
  customLog(req?.LogTraceId, "info", { config, message: "request data for recharge api jri" });
  let result = process.env.NODE_ENV !== "production" && "9876543210" === String(account)
    ? { data: { Status: "2", Message: "Forced recharge failure (RECHARGE_FORCE_FAILURE_NUMBER)" } }
    : await axios(config);
  customLog(req?.LogTraceId, "info", { result: result.data, message: "response from recharge api jri" }, "VENDOR");

  let updateDetails = {};
  if (
    Object.prototype.hasOwnProperty.call(result, "data") &&
    Object.prototype.hasOwnProperty.call(result.data, "Status") &&
    result.data.Status == "0"
  ) {
    updateDetails = {
      corporateTxnId,
      providerId: result.data.TransactionReference
        ? result.data.TransactionReference
        : "Not Available",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify({
        billDetails: result.data,
      }),
    };
    await updateWalletTransaction(updateDetails);
  } else if (
    (Object.prototype.hasOwnProperty.call(result, "data") &&
      Object.prototype.hasOwnProperty.call(result.data, "Status") &&
      result.data.Status == "1") ||
    result.data.Status == "3"
  ) {
    updateDetails = {
      corporateTxnId,
      providerId: result.data.TransactionReference
        ? result.data.TransactionReference
        : "Not Available",
      status: "PROCESSING",
      message: result.data.Message,
      orderResponse: JSON.stringify({
        billDetails: result.data,
      }),
    };
    await updateWalletTransaction(updateDetails);
  } else {
    //failure case
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: result.data.TransactionReference,
      message: result.data.Message,
      registeredById: req.user.registeredBy,
      orderResponse: JSON.stringify({
        billDetails: result.data,
      }),
      couponId: transactionResponse.couponId
    };
    if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
      await cancelPGTransaction(corporateTxnId);
            await refundWalletTransaction(updateDetails);
    } else {
      await refundWalletTransaction(updateDetails);
    }
    if (reportData) {
      publishJournalEvent(
        {
          transactionRef: corporateTxnId,
          type: "refund",
          contextSnapshot: {
            credentialId,
            vendor: serviceDetails?.vendor || null,
            registeredBy: req?.user?.registeredBy || null,
          },
          reportData,
        },
        req?.LogTraceId
      );
    }
  }

  const paymentDetails = {
    transactionId: transactionId,
    account: account,
    amount: (parseFloat(amount) + parseFloat(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2),
  };
  const formattedServiceProvider =
    serviceProvider.toLowerCase() === "bsnl"
      ? "BSNL"
      : serviceProvider.charAt(0).toUpperCase() + serviceProvider.slice(1).toLowerCase();
  if (updateDetails.message == "Payment Successful") {
    // Create a payment details object with the relevant details
    transactionResponse.datetime = new Date();
    transactionResponse.amount = (Number(amount) + Number(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2);
    customLog(req?.LogTraceId, "info", {message: "test log for transactionResponse", transactionResponse})
    transactionResponse.paymentMode = gatewayModeLabel(req.body.paymentGatewayResponse)

    let to, cc;
    if (subCorporateEmail) {
      to = subCorporateEmail;
      cc = emailId;
    } else {
      to = emailId;
      cc = undefined; // or omit if not needed
    }
    const subject = "Recharge Successful";
    const formattedAmount =
      typeof paymentDetails.amount === "number"
        ? paymentDetails.amount.toFixed(2)
        : Number(paymentDetails.amount).toFixed(2);
    const body = generateMobilePaymentSuccessEmailBill(
      "Recharge",
      paymentDetails.transactionId,
      formattedAmount,
      paymentDetails.account,
      formattedServiceProvider,
      "Mobile number",
      name,
      partnerData,
      serviceDetails.serviceProvider
    );
    //Call email function to send email with payment details in the body
    const isPgFunded = Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse");
    const planDetails = [{
      name: formattedServiceProvider ? `${formattedServiceProvider} Mobile Recharge` : "Mobile Recharge Service",
      amount: numericAmount,
      quantity: 1,
    }];
    const invoiceAttachments = await generateOrderInvoiceAttachments({
      amount,
      surcharge,
      couponDiscount: transactionResponse.couponDiscount || 0,
      corporateTxnId,
      orderId: transactionResponse.orderId,
      paymentType: "Mobile Recharge",
      description: `${formattedServiceProvider} Mobile Recharge`,
      credentialId,
      pgAmount: isPgFunded ? req.body.pgAmount : null,
      paymentMethod: pgResponse?.payment_method,
      vendor: serviceDetails?.vendor,
      commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
      planDetails,
      commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
      traceId: req?.LogTraceId,
    });
    emailer.emailWithMultipleAttachment(to, subject, body, invoiceAttachments, cc, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    // Send push notification with payment details
    const notificationData = {
      notificationTitle: "Payment Successful",
      notificationBrief: `Recharge of ₹ ${formatNumberWithLocalString(paymentDetails.amount)} for ${formattedServiceProvider} number with transaction ID ${corporateTxnId} was successful.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    createNotification(notificationData);

    return res.status(200).json({
      status: true,
      data: {
        ...result.data,
        ...transactionResponse,
        corporateTxnId,
      },
      message: "payment successfull",
      responseCode: "000",
    });
  } else if (updateDetails.status == "PROCESSING") {
    const notificationData = {
      notificationTitle: "Payment Processing",
      notificationBrief: `Recharge of ${formattedServiceProvider} Mobile for ₹ ${formatNumberWithLocalString(paymentDetails.amount)} with transaction ID ${corporateTxnId} was pending.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    createNotification(notificationData);
    const walletDetails = await wallet.findOne({
      where: {
        credentialId,
      },
      attributes: ["balance"],
    });

    return res.status(200).json({
      status: false,
      data: {
        processing: true,
        ...result.data,
        ...transactionResponse,
        corporateFinalBalance: walletDetails["balance"],
        serviceProvider: type
      },
      message: "Payment is processing",
      responseCode: "001",
    });

  } else {
    let to, cc;
    if (subCorporateEmail) {
      to = subCorporateEmail;
      cc = emailId;
    } else {
      to = emailId;
      cc = undefined; // or omit if not needed
    } 
    const subject = "Transaction Failed"; // Set email subject
    let partnerData = await fetchPartnerDetails(req.user.registeredBy)
    const resolvedFailed = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_FAILED,
      service: EMAIL_TEMPLATE_SERVICES.BILL_PAYMENT,
      variables: {
        serviceType: transactionCategory,
        account: paymentDetails.account,
        serviceProvider: type,
        name,
        branding: partnerData?.branding || 'Peko',
        website: partnerData?.baseUrl || 'https://peko.one/in',
        logo: partnerData?.logo,
        ...v2LayoutVariables(partnerData),
      },
      fallback: () => commonFailedTemplateforBillPayments(transactionCategory, paymentDetails.account, type, name, partnerData),
      fallbackSubject: subject,
      partnerId: req.user.registeredBy || null,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedFailed.html;
    emailer.email({to,cc, subject: resolvedFailed.subject, body}, function () {
     customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    const notificationData = {
      notificationTitle: "Payment Failed",
      notificationBrief: `Recharge of ${formattedServiceProvider} Mobile for ₹ ${formatNumberWithLocalString(paymentDetails.amount)} with transaction ID ${corporateTxnId} was Failed.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    createNotification(notificationData);
    const walletDetails = await wallet.findOne({
      where: {
        credentialId,
      },
      attributes: ["balance"],
    });

    return res.status(400).json({
      status: false,
      data: {
        ...result.data,
        ...transactionResponse,
        corporateFinalBalance: walletDetails["balance"],
      },
      message: "payment failed",
      responseCode: "001",
    });
  }

});

// push url for pending transactions
exports.updateTransaction = asyncHandler(async (req, res, next) => {
  try {
    customLog(req?.LogTraceId, "info", {query: req.query, message: "webhook recieved for push url jri"}, "VENDOR")

    let corporateTxnId = req.query.SystemReference;
    const transaction = await getOneTransaction({
      transactionId: corporateTxnId,
    });

    if (!transaction) {
      return next(new ErrorResponse("transaction not found", 200));
    }

    // Idempotency: skip if transaction already reached a terminal state
    if (["SUCCESS", "FAILURE", "REFUNDED"].includes(transaction.status)) {
      customLog(req?.LogTraceId, "info", {
        message: "Push URL received for already-terminal transaction, skipping",
        corporateTxnId,
        currentStatus: transaction.status,
      });
      return res.status(200).send("ok");
    }

    req.user = await findUserDetails(transaction.credentialId);

    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
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
          500
        )
      );
    }

    const reportData = transaction.order?.journalData ? { journalData: transaction.order.journalData } : null;

    // Verify checksum: SHA256(RechargeNumber + Amount + TransactionReference + SHA256Key)
    const rechargeNumber = req.query.RechargeNumber;
    const amount = req.query.Amount;
    const transactionReference = req.query.TransactionReference;
    const securityKey = serviceDetails.vendor.optional4;

    const concatenatedString =
      rechargeNumber + amount + transactionReference + securityKey;
    const checkSum = crypto
      .createHash("sha256")
      .update(concatenatedString)
      .digest("hex")
      .toLowerCase();

    // verify checksum
    if (!isValidJriChecksum(checkSum, req.query.Checksum)) {
      customLog(req?.LogTraceId, "error", {
        message: "Invalid checksum for JRI push URL",
        received: req.query.Checksum,
        corporateTxnId,
      });
      return next(new ErrorResponse("Invalid check sum", 200));
    }

    let data = req.query;
    let updateDetails = {};
    const paymentMode = transaction.order?.paymentMode || "WALLET";
    
    if (Object.prototype.hasOwnProperty.call(data, "Status") && data.Status == "0") {
      // Success case
      updateDetails = {
        corporateTxnId,
        providerId: data.TransactionReference
          ? data.TransactionReference
          : data.OperatorTransactionId || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          billDetails: data,
        }),
      };
      await updateWalletTransaction(updateDetails);
    } else {
      // Failure case - need to refund
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: data.TransactionReference || data.OperatorTransactionId || "Not Available",
        message: data.Message || "Transaction Failed",
        registeredById: req.user.registeredBy,
        orderResponse: JSON.stringify({
          billDetails: data,
          failureReason: data.FailureReason,
        }),
      };
      
      // Check payment mode and refund accordingly
      const publishRefund = () => {
        if (reportData) {
          publishJournalEvent(
            {
              transactionRef: corporateTxnId,
              type: "refund",
              contextSnapshot: {
                credentialId,
                vendor: serviceDetails?.vendor || null,
                registeredBy: req?.user?.registeredBy || null,
              },
              reportData,
            },
            req?.LogTraceId
          );
        }
      };
      if (isGatewayPaid(paymentMode)) {
        // Refund PG transaction first
        const refundStatus = await cancelPGTransaction(corporateTxnId);
        if (refundStatus && refundStatus.status) {
          await refundWalletTransaction(updateDetails);
          publishRefund();
        } else {
          customLog(req?.LogTraceId, "error", {
            message: "PG refund failed for JRI push URL",
            corporateTxnId,
            refundStatus,
          });
          // Still refund wallet portion if it's PG + WALLET
          if (isSplitWithWallet(paymentMode)) {
            await refundWalletTransaction(updateDetails);
            publishRefund();
          }
        }
      } else {
        // Wallet only transaction
        await refundWalletTransaction(updateDetails);
        publishRefund();
      }
    }

    // sending notification and email to user
    const paymentDetails = {
      transactionId: corporateTxnId,
      account: rechargeNumber || data.RechargeNumber,
      amount: formatNumberWithLocalString(transaction?.order?.amountInINR || data.Amount),
    };
    const providerName = data.Provider ? (data.Provider.charAt(0).toUpperCase() + data.Provider.slice(1).toLowerCase()) : "Mobile";
    
    if (updateDetails.status === "SUCCESS" && updateDetails.message === "Payment Successful") {
      let partnerData;
      partnerData = await fetchPartnerDetails(req.user.registeredBy)
      const name = req.user.name;
      const to = req.user.email;
      const subject = "Recharge Successful";
      const invoiceAttachments = await generateOrderInvoiceAttachments({
        amount: transaction.order?.amountInINR,
        surcharge: transaction.order?.surcharge || 0,
        couponDiscount: 0,
        corporateTxnId,
        orderId: transaction.order?.id,
        paymentType: "Recharge",
        description: `Recharge - ${paymentDetails.account}`,
        credentialId: transaction.credentialId,
        pgAmount: null,
        paymentMethod: null,
        traceId: req?.LogTraceId,
      });
      await sendBillPaymentSuccessEmail({
        to,
        cc: undefined,
        serviceType: "Recharge",
        name,
        partnerData,
        fallback: () => generateMobilePaymentSuccessEmailBill(
          "Recharge",
          paymentDetails.transactionId,
          paymentDetails.amount,
          paymentDetails.account,
          "topup",
          "Mobile No",
          name,
          partnerData
        ),
        fallbackSubject: subject,
        registeredBy: req.user.registeredBy,
        logTraceId: req?.LogTraceId,
        files: invoiceAttachments,
      });
      // Send push notification with payment details
      const notificationData = {
        notificationTitle: "Payment Successful",
        notificationBrief: `Recharge of ${providerName} Mobile for ₹${formatNumberWithLocalString(paymentDetails.amount)} with transaction ID ${corporateTxnId} was successful.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
    } else {
      // Failure case - send failure notification
      const notificationData = {
        notificationTitle: "Payment Failed",
        notificationBrief: `Recharge of ${providerName} Mobile for ₹${paymentDetails.amount} with transaction ID ${corporateTxnId} was Failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
    }
    return res.status(200).send("ok");
  } catch (error) {
    customLog(req?.LogTraceId, "info", { message: "webhook catch for push url jri", error: error?.message ?? error?.response?.data ?? error?.respose})

    return next(
      new ErrorResponse(
        "Something went wrong while updating the transaction",
        200
      )
    );
  }
});

exports.reversePushJri = asyncHandler(async (req, res, next) => {
  try {
    customLog(req?.LogTraceId, "info", {query: req.query, message: "webhook recieved for reverse push url jri"}, "VENDOR")

    let corporateTxnId = req.query.SystemReference;
    const transaction = await getOneTransaction({
      transactionId: corporateTxnId,
    });

    if (!transaction) {
      return next(new ErrorResponse("transaction not found", 200));
    }

    // Idempotency: skip if already refunded or failed via a previous reversal callback
    if (["REFUNDED"].includes(transaction.status)) {
      customLog(req?.LogTraceId, "info", {
        message: "Reverse push URL received for already-refunded transaction, skipping",
        corporateTxnId,
        currentStatus: transaction.status,
      });
      return res.status(200).send("ok");
    }

    req.user = await findUserDetails(transaction.credentialId);

    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
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
          500
        )
      );
    }

    const reportData = transaction.order?.journalData ? { journalData: transaction.order.journalData } : null;

    // Verify checksum: SHA256(RechargeNumber + Amount + TransactionReference + SHA256Key)
    const rechargeNumber = req.query.RechargeNumber;
    const amount = req.query.Amount;
    const transactionReference = req.query.TransactionReference;
    const securityKey = serviceDetails.vendor.optional4;

    const concatenatedString =
      rechargeNumber + amount + transactionReference + securityKey;
    const checkSum = crypto
      .createHash("sha256")
      .update(concatenatedString)
      .digest("hex")
      .toLowerCase();

    // verify checksum
    if (!isValidJriChecksum(checkSum, req.query.Checksum)) {
      customLog(req?.LogTraceId, "error", {
        message: "Invalid checksum for JRI reversal push URL",
        received: req.query.Checksum,
        corporateTxnId,
      });
      return next(new ErrorResponse("Invalid check sum", 200));
    }

    let data = req.query;
    const paymentMode = transaction.order?.paymentMode || "WALLET";

    // Reversal always means the transaction failed/reversed, so we need to refund
    // Check if transaction was previously successful
    if (transaction.status === "SUCCESS" || transaction.remarks === "Payment Successful") {
      // Transaction was successful before, now reversed - need to refund
      let updateDetails = {
        corporateTxnId,
        status: "REFUNDED",
        providerId: data.TransactionReference || data.OperatorTransactionId || transaction.providerId || "Not Available",
        message: data.Message || data.FailureReason || "Transaction Reversed",
        registeredById: req.user.registeredBy,
        orderResponse: JSON.stringify({
          billDetails: data,
          failureReason: data.FailureReason,
          reversal: true,
        }),
      };
      
      // Check payment mode and refund accordingly
      const publishRefund = () => {
        if (reportData) {
          publishJournalEvent(
            {
              transactionRef: corporateTxnId,
              type: "refund",
              contextSnapshot: {
                credentialId,
                vendor: serviceDetails?.vendor || null,
                registeredBy: req?.user?.registeredBy || null,
              },
              reportData,
            },
            req?.LogTraceId
          );
        }
      };
      if (isGatewayPaid(paymentMode)) {
        // Refund PG transaction first
        const refundStatus = await cancelPGTransaction(corporateTxnId);
        if (refundStatus && refundStatus.status) {
          await refundWalletTransaction(updateDetails);
          publishRefund();
        } else {
          customLog(req?.LogTraceId, "error", {
            message: "PG refund failed for JRI reversal push URL",
            corporateTxnId,
            refundStatus,
          });
          if (isSplitWithWallet(paymentMode)) {
            await refundWalletTransaction(updateDetails);
            publishRefund();
          }
        }
      } else {
        // Wallet only transaction
        await refundWalletTransaction(updateDetails);
        publishRefund();
      }
    } else {
      // Transaction was already failed, just update the status
      let updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: data.TransactionReference || data.OperatorTransactionId || transaction.providerId || "Not Available",
        message: data.Message || data.FailureReason || "Transaction Failed",
        registeredById: req.user.registeredBy,
        orderResponse: JSON.stringify({
          billDetails: data,
          failureReason: data.FailureReason,
          reversal: true,
        }),
      };
      await updateWalletTransaction(updateDetails);
    }

    // sending notification for reversal
    const paymentDetails = {
      transactionId: corporateTxnId,
      account: data.RechargeNumber || transaction.order?.accountNo,
      amount: formatNumberWithLocalString(transaction.order?.amountInINR || data.Amount),
    };
    const providerName = data.Provider ? (data.Provider.charAt(0).toUpperCase() + data.Provider.slice(1).toLowerCase()) : "Mobile";
    
    // Reversal always means refund/failure notification
    const notificationData = {
      notificationTitle: "Transaction Reversed",
      notificationBrief: `Your recharge of ${providerName} Mobile for ₹${formatNumberWithLocalString(paymentDetails.amount)} with transaction ID ${corporateTxnId} has been reversed. Refund will be processed.`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    createNotification(notificationData);
    return res.status(200).send("ok");
  } catch (error) {
    customLog(req?.LogTraceId, "info", { message: "webhook catch for reverse push url jri", error: error?.message ?? error?.response?.data ?? error?.respose})

    return next(
      new ErrorResponse(
        "Something went wrong while updating the transaction",
        200
      )
    );
  }
});
