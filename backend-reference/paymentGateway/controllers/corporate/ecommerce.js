const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
  fetchServiceDetails,
  calculateSurchargeWithTax,
} = require("../../utils/checkAndFetchServiceDetails");
const { createNotification } = require("../../models/use-cases/notification");
const { createRazorPayTransaction } = require("../../utils/dapiTransaction");
const {
  createWalletTransaction,
  refundWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const {
  createPGTransaction,
} = require("../../utils/paymentGatewayTransaction");
const wallet = require("../../models/entities/wallet");
const { deleteCartAndUpdateProducts } = require("../../models/use-cases/cart");

const emailer = require("../../utils/emailer");
const operatorsData = require("../../utils/operatorsData.json");
const {
  generatePaymentSuccessEmail,
  commonFailedTemplate,
} = require("../../utils/emailTemplate/ecommerce");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const accessKey = operatorsData["e-commerce"]["accessKey"];
const transactionCategory = operatorsData["e-commerce"]["category"];
const { customLog } = require("../../utils/loggerHelper");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
const { formatNumberWithLocalString } = require("../../utils/formatter");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");


exports.payment = asyncHandler(async (req, res, next) => {
  //check disableService?
  //search for package,cashback,serviceOperator,vendor?
  //userBalance
  //Entry for payment
  //API call
  //update the payment
  const transactionId = req.body.transactionId;
  let providerId = transactionId;
  const account = req.body.account;
  const amount = req.body.amount;
  const payCashback = req.body.payCashback;
  const subCorporateEmail = req.user.subCorporateEmail;

  // const cartId = req.body.cartId
  const credentialId = req.user.id; //will come from userObject
  const corporateUserId = req.user.corporateId; //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const name = req.user.name;
  const emailId = req.user.email;
  const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;

  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
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
  // let token = serviceDetails.vendor.optional1
  // let URL = serviceDetails.vendor.apiUrl
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
  
  let subCorporateUserId;

  if (req.user.role === "CORPORATE_SUB_USER") {
    subCorporateUserId = req.user.subCorporateId;
  }
  let corporateTxnId = req.body.corporateTxnId;
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
    payCashback,
    surcharge,
    subCorporateUserId,
  };
  if (Object.prototype.hasOwnProperty.call(req.body, "razorPay")) {
    transactionResponse = await createRazorPayTransaction({
      ...commonParams,
      razorPayAmount: req.body.razorPayAmount,
      razorPayResponse: req.body.razorPay,
    });
  } else if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
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
  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
    return next(new ErrorResponse(transactionResponse["error"], 402));
  }
  let orderResponse = await deleteCartAndUpdateProducts(corporateUserId);
  let updateDetails = {};
  if (orderResponse && Array.isArray(orderResponse)) {
    updateDetails = {
      corporateTxnId,
      providerId: "Not Available",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify({
        products: orderResponse,
        address: req.body.address,
      }),
    };
    if (updateDetails.message == "Payment Successful") {
      const orderResponse = JSON.parse(updateDetails.orderResponse);
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = amount;
      const paymentDetails = {
        products: JSON.stringify(orderResponse.products),
        address: req.body.address,
        transactionId: transactionId,
        account: account,
        amount: (parseFloat(amount) - transactionResponse.couponDiscount).toFixed(2),
      };
      let to, cc;
      if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = emailId;
      } else {
        to = emailId;
        cc = undefined; // or omit if not needed
      }
      const subject = "Order Successful"; // Set email subject
      const orderSuccessAmount = Number(paymentDetails.amount);
      const orderSuccessItemCount = orderResponse.products?.length || 0;
      const orderSuccessSubtotal = orderSuccessAmount >= 100 ? orderSuccessAmount : orderSuccessAmount - 15;
      const orderSuccessShipping = orderSuccessAmount >= 100 ? 0 : 15;
      const resolvedOrderSuccess = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.ECOM_ORDER_SUCCESS,
        service: EMAIL_TEMPLATE_SERVICES.ECOM,
        variables: {
          name,
          transactionId: paymentDetails.transactionId,
          deliveryAddress: paymentDetails.address?.address || 'Not provided',
          phoneNumber: paymentDetails.address?.phoneNumber || 'Not provided',
          itemCount: orderSuccessItemCount,
          subtotal: formatNumberWithLocalString(orderSuccessSubtotal),
          shipping: formatNumberWithLocalString(orderSuccessShipping),
          orderTotal: formatNumberWithLocalString(orderSuccessAmount),
          ...v2LayoutVariables(partnerDetails),
        },
        fallback: () => generatePaymentSuccessEmail(
          name,
          paymentDetails.transactionId,
          paymentDetails.amount,
          paymentDetails.address,
          paymentDetails.products,
          partnerDetails
        ),
        fallbackSubject: subject,
        logTraceId: req?.LogTraceId,
      });
      const body = resolvedOrderSuccess.html;
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
        paymentType: "Office Supplies",
        description: "Office Supplies order",
        credentialId,
        pgAmount: isPgFunded ? (req.body.pgAmount || req.body.razorPayAmount) : null,
        paymentMethod: pgResponse?.payment_method,
        traceId: req?.LogTraceId,
      });
      emailer.emailWithMultipleAttachment(to, resolvedOrderSuccess.subject, body, invoiceAttachments, cc, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      });
      // Send push notification with payment details
      const notificationData = {
        notificationTitle: "Office Supplies - Payment successful",
        notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Office Supplies was successful. Transaction ID: ${paymentDetails.transactionId}. `,
        notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
        notificationCategory: "CORPORATE", // Replace with the relevant category
        notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
      };

      createNotification(notificationData);
    }
    await updateWalletTransaction(updateDetails);
  } else {
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: "Product not Available",
      registeredById: req.user.registeredBy,
      couponId: transactionResponse.couponId
    };
    if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
      await cancelPGTransaction(corporateTxnId);
      await refundWalletTransaction(updateDetails);
    } else {
      await refundWalletTransaction(updateDetails);
    }
  }
  if (updateDetails.message !== "Payment Successful") {
    const paymentDetails = {
      transactionId: transactionId,
      account: account,
      amount: (parseFloat(amount) - transactionResponse.couponDiscount).toFixed(2),
    };
    let to, cc;
    if (subCorporateEmail) {
      to = subCorporateEmail;
      cc = emailId;
    } else {
      to = emailId;
      cc = undefined; // or omit if not needed
    }
    const subject = "Transaction Failed"; // Set email subject
    const serviceUrl = partnerDetails?.baseUrl;
    const resolvedPaymentFailed = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.ECOM_PAYMENT_FAILED,
      service: EMAIL_TEMPLATE_SERVICES.ECOM,
      variables: {
        name,
        serviceName: 'Office supplies',
        retryUrl: serviceUrl || `${partnerDetails?.baseUrl}/payments`,
        ...v2LayoutVariables(partnerDetails),
      },
      fallback: () => commonFailedTemplate(name, 'Office supplies', serviceUrl, partnerDetails),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedPaymentFailed.html;
    emailer.email({to,cc, subject: resolvedPaymentFailed.subject, body}, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    const notificationData = {
      notificationTitle: "Office Supplies - Payment unsuccessful",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Office Supplies was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };

    createNotification(notificationData);
    //return next(new ErrorResponse([updateDetails.message], 200))
    const walletDetails = await wallet.findOne({
      where: {
        credentialId,
      },
      attributes: ["balance"],
    });
    
      return res.status(402).json({
        status: false,
        data: {
          ...{},
          corporateFinalBalance: walletDetails["balance"],
        },
        message:
          "Payment failed. Please check your payment information and try again.",
        responseCode: "001",
      });
  } else {
      return res.status(200).json({
        status: true,
        message: "Payment completed successfully. Thank you!",
        data: {
          ...{},
          ...transactionResponse,
          corporateTxnId,
        },
        responseCode: "000",
      });
  }
});
