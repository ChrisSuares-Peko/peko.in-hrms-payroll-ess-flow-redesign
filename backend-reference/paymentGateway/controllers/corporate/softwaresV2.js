const axios = require("axios");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");
const {
  createPGTransaction,
} = require("../../utils/paymentGatewayTransaction");
const asyncHandler = require("../../middlewares/async");
// const { cancelCardTransaction } = require("./payment_gateway");
const { paymentGateWayRefundFailureEmail } = require("../../utils/emailSender");
// const { createExpense } = require("./expense");
const { createNotification } = require("../../models/use-cases/notification");
const { commonFailedTemplate } = require("../../utils/emailTemplate/common");
// const cleverTap = require("../../services/CleverTap"); // we are not using clevertap here in this service
const emailer = require("../../utils/emailer");
const {
  calculateSurcharge,
  calculateAmountWithTax,
} = require("../../utils/checkAndFetchServiceDetails");
const {
  createWalletTransaction,
  refundWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const {
  generateSubscriptionSuccessEmailV2,
} = require("../../utils/emailTemplate/softwares");
const { accessKey, checkPermission } = require("../../utils/softwareV2Helpers");
// const { recordToZohoJournal, recordRefundToZohoJournal } = require("../../utils/zohoAccountMethods");
// const { generateInvoiceAndReceipt } = require("../../services/invoiceAndReceipt");
const {
  createSubscription,
  updateSubscriptionByCorporateTxnId,
} = require("../../models/use-cases/corporateSoftwareSubscription");
const { cancelPGTransaction } = require("../../utils/cashfreeGateway");
exports.payment = asyncHandler(async (req, res, next) => {
  const transactionCategory = "Softwares";
  const {
    amount,
    plan,
    couponCode,
    // pgAmount
  } = req.body;

  const {
    id: credentialId,
    corporateId: corporateUserId,
    name,
    email: emailId,
    contactPersonName,
    country,
    mobileNo,
    registeredBy,
    // packageId,
    // accounts_id,
  } = req.user;

   customLog(req.LogTraceId, "info", {
    message: "user object from request",
    data: req.user,
  });
  const contactName = contactPersonName || name;

  // const paymentGatewayName = req.body.paymentGatewayResponse ? req.body.paymentGatewayResponse.pgVendorName : null;

  const isPGPayment = Object.prototype.hasOwnProperty.call(
    req.body,
    "paymentGatewayResponse",
  );

  const partnerDetails = req?.user?.registeredBy
    ? await fetchPartnerDetails(req.user.registeredBy)
    : await partnerLogos();

  const { API_URL, api_key, sessionId, serviceOperatorId, serviceDetails } =
    await checkPermission(req);

  const {
    commissionType,
    cashbackType,
    providerCommission,
    cashback: corporateCashback,
  } = serviceDetails;

  const surchargeWithoutTax = calculateSurcharge(
    serviceDetails.surcharge,
    serviceDetails.surchargeType,
    amount,
  );
  const surcharge = await calculateAmountWithTax(surchargeWithoutTax);
  serviceDetails.transactionReportRule = "SERVICE_WITH_DATA_IN_ITEMS_LIST"; // ONLY TEMP
  const reportData = {};

  let corporateTxnId =  req.body.corporateTxnId ? req.body.corporateTxnId.toString() : new Date().valueOf().toString();
  let transactionResponse = {};

  if (isPGPayment) {
    transactionResponse = await createPGTransaction({
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      pgAmount: req.body.pgAmount,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      pgResponse: req.body.paymentGatewayResponse,
      surcharge,
      couponCode,
      corporateUserId,
      partnerId: registeredBy,
    });
  } else {
    transactionResponse = await createWalletTransaction({
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      surcharge,
      amount,
      commissionType,
      cashbackType,
      providerCommission,
      reportData,
    });
  }
  const totalAmount = (parseFloat(amount) + parseFloat(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2);
  customLog(req.LogTraceId, "info", {
    message: "Software transactionResponse",
    data: transactionResponse,
  });
  if (
    transactionResponse &&
    Object.prototype.hasOwnProperty.call(transactionResponse, "error")
  ) {
    return next(new ErrorResponse(transactionResponse["error"], 400));
  }

  const {
    planName,
    productName,
    skuCode: planSkuId,
    webUrl,
    pricingDetails: { billingCycle },
  } = plan;

  const params = {
    planSkuId,
    productName,
    webUrl,
    planName,
    billingCycle,
    orderId: transactionResponse?.orderId,
    corporateUserId,
  };

  await createSubscription({ params });

  // await recordToZohoJournal(reportData, corporateTxnId, Number(amount) + Number(surcharge), serviceDetails.vendor, paymentGatewayName, corporateUserId, req.user.registeredBy);

  const orderResponse = {
    subscriptionDetails: plan,
  };

  const salesPayload = {
    skuCode: plan.skuCode,
    quantity: 1,
    partner: {
      name: "Peko",
      saleReference: String(corporateTxnId),
    },
    customer: {
      name: contactName,
      email: emailId,
      phone: mobileNo,
      additionalInfo: {
        company: name,
        country: country || "INDIA",
      },
    },
    payment: {
      provider: isPGPayment ? "CASHFREE" : "PEKO_WALLET",
      transactionId: String(corporateTxnId),
      amount,
      currency: "INR",
      status: "captured",
      // metadata: {
      //   source: "peko-checkout",
      //   channel: "partner-portal",
      // },
    },
  };

  const config = {
    method: "POST",
    url: `${API_URL}/sales`,
    headers: {
      Accept: "application/json",
      "X-API-Key": api_key,
      "X-Session-Id": sessionId,
    },
    data: salesPayload,
    timeout: 5000,
  };

  customLog(
    req?.LogTraceId,
    "info",
    {
      message:
        "software service - sales api from payment api controller request",
      request: config,
    },
    "VENDOR",
  );

  const handleVendorFailure = async (failureMessage) => {
    const updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: failureMessage || "No Activation Keys Available",
      registeredById: req.user.registeredBy,
    };

    if (isPGPayment) {
      const { status } = await cancelPGTransaction(corporateTxnId);
      if (status) {
        await refundWalletTransaction(updateDetails);
        // await recordRefundToZohoJournal(
        //   reportData,
        //   corporateTxnId,
        //   Number(amount) + Number(surcharge),
        //   serviceDetails.vendor,
        //   paymentGatewayName,
        //   corporateUserId,
        //   req.user.registeredBy,
        // );
      } else {
        await paymentGateWayRefundFailureEmail(req);
      }
    } else {
      await refundWalletTransaction(updateDetails);
      // await recordRefundToZohoJournal(
      //   reportData,
      //   corporateTxnId,
      //   Number(amount) + Number(surcharge),
      //   serviceDetails.vendor,
      //   paymentGatewayName,
      //   corporateUserId,
      //   req.user.registeredBy,
      // );
    }

    await updateWalletTransaction({ ...updateDetails, corporateTxnId });
    await updateSubscriptionByCorporateTxnId(corporateTxnId, {
      status: "FAILED",
    });
    // cleverTap.uploadEvent(
    //   {
    //     eventName: "transactions_payment",
    //     eventData: {
    //       status: "Payment Failure",
    //       amount: Number(amount) + Number(surcharge),
    //     },
    //     email: emailId,
    //   },
    //   partnerDetails,
    // );

    const paymentDetails = {
      transactionId: corporateTxnId,
      amount: totalAmount,
    };

    const notificationData = {
      notificationTitle: "Software Purchase - Payment unsuccessful",
      notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Software Purchase was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
      accessKey,
      action: "2",
    };
    createNotification(notificationData, credentialId);

    const subject = "Payment Failed";
    const to = emailId;
    const serviceUrl = partnerDetails.baseUrl;
    const body = commonFailedTemplate(
      name,
      "Software",
      serviceUrl,
      partnerDetails,
    );

    emailer.email({to, subject, body}, function () {
      customLog(req?.LogTraceId, "info", {
        message: "software service - payment api : Email sent to " + to,
      });
    });

    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      responseCode: "001",
    });
  };

  let response;
  try {
    response = await axios(config);
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message:
          "Error: software service - sales api from payment api controller failed",
        error: error.response.data,
        status: error.response.status,
        code: error.code,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message:
          "Error: software service - sales api from payment api controller failed",
        error: error.message,
        code: error.code,
      });
    }
    return handleVendorFailure("Vendor service unavailable");
  }

  customLog(req?.LogTraceId, "info", {
    message:
      "software service - sales api from payment api controller Response",
    response: response.data,
  });

  if (!response?.data?.success) {
    return handleVendorFailure("No Activation Keys Available");
  } else {
    const updateDetails = {
      corporateTxnId,
      providerId: response.data.data?.sale?._id || "NA",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify(orderResponse),
    };

    await updateWalletTransaction(updateDetails);
    // must use this in transaction events
    // cleverTap.uploadEvent(
    //   {
    //     eventName: "transactions_payment",
    //     eventData: {
    //       status: "Payment Success",
    //       amount: Number(amount) + Number(surcharge),
    //     },
    //     email: emailId,
    //   },
    //   partnerDetails,
    // );

    // Create a payment details object with the relevant details
    transactionResponse.datetime = new Date();
    transactionResponse.amount = amount;
    const paymentDetails = {
      products: JSON.stringify(orderResponse.subscriptionDetails),
      transactionId: corporateTxnId,
      amount: totalAmount
    };

    // Send push notification with payment details
    const notificationData = {
      notificationTitle: "Software Purchase - Payment successful",
      notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Software Purchase was successful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
      notificationCategory: "CORPORATE", // Replace with the relevant category
      notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
      accessKey,
      action: "1",
    };
    createNotification(notificationData, credentialId);

    // mail to user and notification to user --------------------
    const to = emailId;
    const subject = "Software purchase success";
    const body = generateSubscriptionSuccessEmailV2();

    // const { receiptPdf, invoicePdf } = await generateInvoiceAndReceipt({
    //   amount,
    //   surcharge,
    //   corporateTxnId,
    //   orderId: transactionResponse?.orderId,
    //   paymentType: "Software",
    //   couponCode,
    //   corporateUserId,
    //   credentialId,
    //   serviceOperatorId,
    //   registeredBy,
    //   accessKey,
    //   pgAmount,
    //   sendInvoiceToVendor: true,
    //   commissionIncludingVAT:
    //     reportData?.journalData?.commissionIncldingVAT || 0,
    //   vendor: serviceDetails?.vendor,
    // });
    emailer.emailWithMultipleAttachment(
      to,
      subject,
      body,
      [].filter(Boolean),
      async (emailErr) => {
        if (emailErr) {
          customLog(req?.LogTraceId, "error", {
            message: "software service - payment api : Error sending email",
            emailErr,
          });
        } else {
          customLog(req?.LogTraceId, "info", {
            message: "software service - payment api : Email sent to " + to,
          });
        }
      },
    );

    return res.status(200).json({
      status: true,
      data: {
        ...transactionResponse,
        corporateTxnId,
      },
      message: "payment successful",
      responseCode: "000",
    });
  }
});
