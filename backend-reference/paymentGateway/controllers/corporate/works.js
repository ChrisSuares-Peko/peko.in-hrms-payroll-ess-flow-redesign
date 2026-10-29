const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
  createWalletTransaction,
  refundWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const emailer = require("../../utils/emailer");
const { createNotification } = require("../../models/use-cases/notification");
const wallet = require("../../models/entities/wallet");
const {
  fetchServiceDetails,
  calculateSurchargeWithTax,
} = require("../../utils/checkAndFetchServiceDetails");
const { findOnePlanDetails } = require("../../models/use-cases/works_plan");
const { createRazorPayTransaction } = require("../../utils/dapiTransaction");

const { worksPurchaseEmail } = require("../../utils/emailTemplate/works");
const { commonFailedTemplate } = require("../../utils/emailTemplate/common");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { customLog } = require("../../utils/loggerHelper");
const { createPGTransaction } = require("../../utils/paymentGatewayTransaction");
const { computeJournalData } = require("../../utils/computeJournalData");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
const { formatNumberWithLocalString } = require("../../utils/formatter");
const accessKey = "peko_works";

exports.payment = asyncHandler(async (req, res, next) => {
  //check disableService?
  let transactionCategory = "Other";
  const transactionId = req.body.corporateTxnId || new Date().valueOf();
  let providerId = transactionId;
  const account = req.body.account;
  const amount = req.body.amount;
  const payCashback = req.body.payCashback;
  const credentialId = req.user.id; //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const corporateUserId = req.user.corporateId;
  const name = req.user.name
  const planId = req.body.planId;
  const pocName = req.body.pocName;
  const email = req.user.email;
  const requirement = req.body.requirement;
  const subCorporateEmail = req.user.subCorporateEmail;
  const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;

  const planData = await findOnePlanDetails({ id: planId, credentialId });
  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails["error"], 200));
  }
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


  const workPlan = planData?.data || planData;
  const journalPlanDetails = [{
    name: workPlan.name,
    commissionMode: workPlan.commissionMode,
    commissionType: workPlan.commissionType,
    commission: workPlan.commission,
    fixedCommissionPerTransaction: workPlan.fixedCommissionPerTransaction,
    isCommissionInclGST: workPlan.isCommissionInclGST,
    isCommissionConfigured: workPlan.isCommissionConfigured,
    amount: Number(workPlan.price),
    quantity: 1,
  }];

  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
  const reportData = await computeJournalData({
    serviceDetails,
    pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
    amount: numericAmount,
    paymentMethod: pgResponse?.payment_method || {},
    partnerDetails,
    paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
    couponTotalDiscount: req.body.couponTotalDiscount,
    planDetails: journalPlanDetails,
    corporateState: req.user.state,
    credentialId,
  });

  // first we will  do transaction
  const corporateTxnId = req.body.corporateTxnId;
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
    reportData
  };
  if (Object.prototype.hasOwnProperty.call(req.body, "razorPay")) {
    transactionResponse = await createRazorPayTransaction({
      ...commonParams,
      razorPayAmount: req.body.razorPayAmount,
      razorPayResponse: req.body.razorPay,
    });
  } else if (
    Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")
  ) {
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

  if (
    transactionResponse &&
    Object.prototype.hasOwnProperty.call(transactionResponse, "error")
  ) {
    return next(new ErrorResponse(transactionResponse["error"], 500));
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

  let worksResponse = true; //for now if payment success, it is successfull order

  let updateDetails = {};
  if (!worksResponse) {
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: "No Activation Keys Available",
      registeredById: req.user.registeredBy,
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
  } else {
    updateDetails = {
      corporateTxnId,
      providerId: "Not Available",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify({
        planDetails: planData,
        pocName,
        email,
        requirement,
      }),
    };
  }

  if (updateDetails.message == "Payment Successful") {
    const orderResponse = JSON.parse(updateDetails.orderResponse);
    // Create a payment details object with the relevant details
    transactionResponse.datetime = new Date();
    transactionResponse.amount = (Number(amount) + Number(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2);
    const paymentDetails = {
      products: JSON.stringify(orderResponse.planDetails),
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(amount) + parseFloat(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2),
    };
    let to, cc;
    if (subCorporateEmail) {
      to = subCorporateEmail;
      cc = email;
    } else {
      to = email;
      cc = undefined; // or omit if not needed
    } 
    const name = pocName;
    const subject = "Peko Works Successful"; // Set email subject
    const resolvedWorksSuccess = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.WORKS_PURCHASE_SUCCESS,
      service: EMAIL_TEMPLATE_SERVICES.WORKS,
      variables: {
        name,
        amount: formatNumberWithLocalString(amount),
        transactionId: corporateTxnId,
        workName: planData?.work?.name,
        planName: planData?.name,
        planPrice: formatNumberWithLocalString(planData?.price),
        branding: partnerDetails?.branding || 'Peko',
        website: partnerDetails?.baseUrl || 'https://peko.one/in',
        logo: partnerDetails?.logo,
        ...v2LayoutVariables(partnerDetails),
      },
      fallback: () => worksPurchaseEmail(
        name,
        amount,
        planData,
        corporateTxnId,
        partnerDetails
      ),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedWorksSuccess.html;
    // Call email function to send email with payment details in the body
    emailer.email({to,cc, subject: resolvedWorksSuccess.subject, body}, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    // Send push notification with payment details
    const notificationData = {
      notificationTitle: "Peko Works - Payment successful",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Peko Works was successful. Transaction ID: ${paymentDetails?.transactionId}.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: "CORPORATE", // Replace with the relevant category
      notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
    };
    
    createNotification(notificationData);
  }
  await updateWalletTransaction(updateDetails);
  if (updateDetails.message !== "Payment Successful") {
    const paymentDetails = {
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(amount) + parseFloat(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2),
    };
    let to, cc;
    if (subCorporateEmail) {
      to = subCorporateEmail;
      cc = email;
    } else {
      to = email;
      cc = undefined; // or omit if not needed
    }
    const subject = "Transaction Failed"; // Set email subject
    const serviceUrl = partnerDetails?.baseUrl;
    const body = commonFailedTemplate(name, "Peko Works", serviceUrl, partnerDetails);
    emailer.email({to,cc, subject, body}, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    const notificationData = {
      notificationTitle: "Peko Works - Payment unsuccessful",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Peko Works was unsuccessful. Transaction ID: ${paymentDetails?.transactionId}.`,
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
