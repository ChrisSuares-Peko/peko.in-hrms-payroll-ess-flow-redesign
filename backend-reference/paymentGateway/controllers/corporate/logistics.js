/* eslint-disable no-undef */
/* eslint-disable no-prototype-builtins */

const axios = require("axios");
const asyncHandler = require("../../middlewares/async");
const {
  fetchServiceDetails,
  calculateSurchargeWithTax,
} = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
const {
  createWalletTransaction,
  refundWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const operatorsData = require("../../utils/operatorsData.json");
let accessKey = operatorsData["logistics"]["accessKey"];
let transactionCategory = operatorsData["logistics"]["category"];

const { createRazorPayTransaction } = require("../../utils/dapiTransaction");
const {
  createPGTransaction,
} = require("../../utils/paymentGatewayTransaction");
const { createNotification } = require("../../models/use-cases/notification");
const wallet = require("../../models/entities/wallet");
const emailer = require("../../utils/emailer");
const {
  generatePaymentSuccessEmailLogistics,
  commonFailedTemplate,
} = require("../../utils/emailTemplate/logistics");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { customLog } = require("../../utils/loggerHelper");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");


exports.payment = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id; //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const corporateUserId = req.user.corporateId;
  const account = req.body.resultId;
  const amount = parseFloat(req.body.orderAmount);
  const payCashback = req.body.payCashback;
  const emailId = req.user.email;
  const data = req.body;
  const name = req.user.name;
  const senderAddress = data.senderAddress;
  delete data.accessKey;
  delete data.senderAddress;
  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  const host = partnerDetails?.baseUrl;
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId
  });
  const API_URL = serviceDetails.vendor.apiUrl;
  const token = serviceDetails.vendor.optional1;
  const merchantUsername = serviceDetails.vendor.optional2;
  if (serviceDetails.hasOwnProperty("error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        400
      )
    );
  }
  let commissionType = serviceDetails.commissionType;
  let cashbackType = serviceDetails.cashbackType;
  let providerCommission = serviceDetails.providerCommission;
  let corporateCashback = serviceDetails.cashback;
  let serviceOperatorId = serviceDetails.id;
  
  // Ensure amount is a number (already parsed in this file)
  const numericAmount = amount;
  // Calculate surcharge with tax using common function
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
  let corporateTxnId = req.body.corporateTxnId;
  let transactionResponse = {};
  const commonParams = {
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
    payCashback,
    surcharge,
    subCorporateUserId,
  };
  if (req.body.hasOwnProperty("razorPay")) {
    transactionResponse = await createRazorPayTransaction({
      ...commonParams,
      razorPayAmount: req.body.razorPayAmount,
      razorPayResponse: req.body.razorPay,
    });
  } else if (req.body.hasOwnProperty("paymentGatewayResponse")) {
    transactionResponse = await createPGTransaction({
      ...commonParams,
      pgAmount: req.body.pgAmount,
      pgResponse: req.body.paymentGatewayResponse,
      couponCode: req.body.couponCode,
      corporateUserId,
      partnerId: req.user.registeredBy
    });
  } else {
    transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });
  }
  if (transactionResponse && transactionResponse.hasOwnProperty("error")) {
    customLog(req?.LogTraceId, "info", { message: "🚀 ~ exports.payment=asyncHandler ~ transactionResponse:", transactionResponse })
    return next(new ErrorResponse("Something went wrong", 400));
  }
  let updateDetails = {};
  let response;
  data.merchant_orderid = corporateTxnId;
  data.orderType = "PREPAID";
  data.merchant = merchantUsername;
  data.profileById = true;

  let formData = new URLSearchParams();

  for (let key in data) {
    formData.append(key, data[key]);
  }

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: `${API_URL}merchant/v1/merchantApi/createOutsideOrder`,
    headers: {
      Authorization: token,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: formData.toString(),
  };
  const paymentDetails = {
    transactionId: corporateTxnId,
    account: account,
    amount: (parseFloat(amount) + parseFloat(surcharge) - transactionResponse.couponDiscount).toFixed(2),
  };
  try {
    response = await axios.request(config);
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "🚀 ~ exports.payment=asyncHandler ~ error:", error })
    response = { data: { responseCode: "001" }, message: "Payment Failed" };
  }
  if (response && response.data && response.data.responseCode === "000") {
    const AWBNumber = response.data.responseData.AWB_NO;
    updateDetails = {
      corporateTxnId,
      providerId: AWBNumber ? AWBNumber : "Not Available",
      status: "SUCCESS",
      orderResponse: JSON.stringify({
        ...data,
        senderAddress: senderAddress,
      }),
      message: "Payment Successful",
    };
  } else {
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: "Payment Failed!",
      registeredById: req.user.registeredBy,
      orderResponse: JSON.stringify(response.data),
      couponId: transactionResponse.couponId
    };
    if (req.body.hasOwnProperty("paymentGatewayResponse")) {
      await cancelPGTransaction(corporateTxnId);
      await refundWalletTransaction(updateDetails);
    } else {
      await refundWalletTransaction(updateDetails);
    }
  }
  if (updateDetails.message == "Payment Successful") {
    // here we need to send mail also
    const notificationData = {
      notificationTitle: "Payment Successful",
      notificationBrief: `Shipment is created on the amount ₹ ${paymentDetails.amount}  was successful`,
      notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
      notificationCategory: "CORPORATE", // Replace with the relevant category
      notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
    };
    if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
      const subcorporateUsername = req.user.subCorporateUsername;
      if (subcorporateUsername) {
        notificationData.notificationTo.push(subcorporateUsername);
      }
    }
    const to = emailId;
    const subject = "Shipment Successful";
    const body = generatePaymentSuccessEmailLogistics({
      name: req.user.name,
      transactionId: corporateTxnId,
      speedOrNormal: data.serviceType,
      sender: senderAddress,
      receiver: {
        name:data.customerName,
        City: data.customerCity,
        Line1: data.customerAddress,
        Line2: data.customerCity,
        Line3:data.customerMobileNo,
        PostCode: data.customerPinCode,
      },
      trackingNo: updateDetails.providerId,
      amount,
      qunatity: data.orderWeight,
      host,
      partnerDetails
    });
    // Call email function to send email with payment details in the body
    const isPgFunded =
      Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse") ||
      Object.prototype.hasOwnProperty.call(req.body, "razorPay");
    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
    const invoiceAttachments = await generateOrderInvoiceAttachments({
      amount,
      surcharge,
      couponDiscount: transactionResponse.couponDiscount || 0,
      corporateTxnId,
      orderId: transactionResponse.orderId,
      paymentType: "Logistics",
      description: "Shipment",
      credentialId,
      pgAmount: isPgFunded ? (req.body.pgAmount || req.body.razorPayAmount) : null,
      paymentMethod: pgResponse?.payment_method,
      traceId: req?.LogTraceId,
    });
    emailer.emailWithMultipleAttachment(to, subject, body, invoiceAttachments, undefined, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    createNotification(notificationData);
    await updateWalletTransaction(updateDetails);
    
      return res.status(200).json({
        status: true,
        data: { AWBNumber: updateDetails.providerId },
        message: "Order created successfully",
        responseCode: "000",
      });
    
  } else {
    const walletDetails = await wallet.findOne({
      where: {
        credentialId,
      },
      attributes: ["balance"],
    });
   
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: "Not Available",
        message: "shipment not created",
        registeredById: req.user.registeredBy ?? null,
        couponId: transactionResponse.couponId
      };
      const to = emailId; // Set recipient email address
      const subject = "Transaction Failed"; // Set email subject
      const serviceUrl = `${partnerDetails?.baseUrl}/logistics`;
      const body = commonFailedTemplate(name, "Logistics", serviceUrl,partnerDetails);
      emailer.email({to, subject, body}, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      });
      const notificationData = {
        notificationTitle: "Payment Failed",
        notificationBrief: `Shipment creation on the amount ₹ ${paymentDetails.amount} was failed`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
        const subcorporateUsername = req.user.subCorporateUsername;
        if (subcorporateUsername) {
          notificationData.notificationTo.push(subcorporateUsername);
        }
      }
      createNotification(notificationData);
      return res.status(400).json({
        status: false,
        data: {
          ...response?.data,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Payment failed",
        responseCode: "001",
      });
  }
});
