const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
  fetchServiceDetails,
  calculateSurchargeWithTax,
} = require("../../utils/checkAndFetchServiceDetails");
const { createNotification } = require("../../models/use-cases/notification");
const {
  createPGTransaction,
} = require("../../utils/paymentGatewayTransaction");
const {
  createWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const wallet = require("../../models/entities/wallet");

const emailer = require("../../utils/emailer");
const schedule = require("node-schedule");
const operatorsData = require("../../utils/operatorsData.json");
const accessKey = operatorsData["workspace"]["accessKey"];
const { fetchSinglePlan } = require("../../models/use-cases/plans");
const { commonFailedTemplate } = require("../../utils/emailTemplate/common");
const { generatePaymentSuccessEmailWorkspaces, workspaceReminder } = require("../../utils/emailTemplate/workspace");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { customLog } = require("../../utils/loggerHelper");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
const { formatNumberWithLocalString } = require("../../utils/formatter");

exports.payment = asyncHandler(async (req, res, next) => {
  //check disableService?
  //search for package,cashback,serviceOperator,vendor?
  //userBalance
  //Entry for payment
  //API call
  //update the payment

  let transactionCategory = "Office Address";
  const transactionId = req.body.transactionId;
  const providerId = transactionId;
  const account = req.body.account;
  const amount = req.body.amount;
  const planId = req.body.planId;
  const planData = await fetchSinglePlan(planId, credentialId);
  const planDetails = planData;
  let bookDetails = req.body.bookDetails;
  const payCashback = req.body.payCashback;
  const credentialId = req.user.id; //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const corporateUserId = req.user.corporateId; //will come from userObject
  const name = req.user.name;
  const emailId = req.user.email;
  const subCorporateEmail = req.user.subCorporateEmail;
  const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;
console.log("🚀 ~ file: workspace.js:70 ~ payment ~ isSubCorporateUser:", req.user);
  let partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    console.log(
      "🚀 ~ file: workspace.js:70 ~ payment ~ serviceDetails:",
      serviceDetails
    );
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        500
      )
    );
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
  
  // first we will  do transaction
  let corporateTxnId = req.body.corporateTxnId;

  let { userDetails } = req.body;

  let { tradeLicenseUrl, ownerVisUrl, initialApprovalUrl } =
    userDetails.fileUploadData;
  if (userDetails.licenseType === "new") {
    bookDetails = {
      ...bookDetails,
      licenseType: "new",
      initialApprovalUrl,
      tradeName: userDetails?.tradeName,
    };
  } else if (userDetails.licenseType === "existing") {
    bookDetails = {
      ...bookDetails,
      licenseType: "existing",
      tradeLicenseUrl: userDetails.tradeLicenseUrl
        ? userDetails.tradeLicenseUrl
        : tradeLicenseUrl,
      ownerVisUrl,
      companyName: userDetails?.companyName,
      expiryDate: userDetails?.expiryDate,
    };
  }

  const journalPlanDetails = [{
    name: planData.name ? `Workspace : ${planData.name}` : "Workspace Service",
    commissionMode: planData.commissionMode,
    commissionType: planData.commissionType,
    commission: planData.commission,
    fixedCommissionPerTransaction: planData.fixedCommissionPerTransaction,
    isCommissionInclGST: planData.isCommissionInclGST,
    isCommissionConfigured: planData.isCommissionConfigured,
    amount: Number(planData.price),
    quantity: 1,
  }];

  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse)
      ? req.body.paymentGatewayResponse[0]
      : req.body?.paymentGatewayResponse;
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

  let subCorporateUserId;
  if (req.user.role === "CORPORATE_SUB_USER") {
    subCorporateUserId = req.user.subCorporateId;
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
    payCashback,
    surcharge,
    subCorporateUserId,
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
    });
  } else {
    transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
    });
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

  let updateDetails = {};
  if (transactionResponse) {
    updateDetails = {
      corporateTxnId,
      providerId: "Not Available",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify({
        planDetails: planDetails,
        bookingDetails: bookDetails,
      }),
    };
    if (updateDetails.message == "Payment Successful") {
      const orderResponse = JSON.parse(updateDetails.orderResponse);
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date();
      transactionResponse.amount = (Number(amount) + Number(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2);
      const paymentDetails = {
        planDetails: JSON.stringify(orderResponse.planDetails),
        transactionId: transactionId,
        account: account,
        amount: (Number(amount) + Number(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2),
      };
      let to, cc;
      if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = emailId;
      } else {
        to = emailId;
        cc = undefined; // or omit if not needed
      }
        const subject = "Booking Successful"; // Set email subject
        const resolvedBooking = await resolveEmailTemplate({
          key: EMAIL_TEMPLATE_KEYS.WORKSPACE_PAYMENT_SUCCESS,
          service: EMAIL_TEMPLATE_SERVICES.WORKSPACE,
          variables: {
            name,
            transactionId: paymentDetails.transactionId,
            amount: Number.parseFloat(paymentDetails.amount).toFixed(2),
            planName: orderResponse.planDetails?.name,
            planPrice: formatNumberWithLocalString(orderResponse.planDetails?.price),
            planBillingCycle: orderResponse.planDetails?.billingCycle === 'MONTHLY' ? 'month' : 'yr',
            planDescription: orderResponse.planDetails?.description,
            workspaceName: orderResponse.bookingDetails?.name,
            placedOn: new Date().toLocaleString(),
            branding: partnerDetails?.branding || 'Peko',
            website: partnerDetails?.baseUrl || 'https://peko.one/in',
            logo: partnerDetails?.logo,
            ...v2LayoutVariables(partnerDetails),
          },
          fallback: () => generatePaymentSuccessEmailWorkspaces(name, paymentDetails.transactionId, paymentDetails.amount, orderResponse, partnerDetails),
          fallbackSubject: subject,
          logTraceId: req?.LogTraceId,
        });
        const body = resolvedBooking.html;
      // Call email function to send email with payment details in the body
      const isPgFunded = Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse");
      const invoiceAttachments = await generateOrderInvoiceAttachments({
        amount,
        surcharge,
        couponDiscount: transactionResponse.couponDiscount || 0,
        corporateTxnId,
        orderId: transactionResponse.orderId,
        paymentType: "Workspace",
        description: "Workspace booking",
        credentialId,
        pgAmount: isPgFunded ? req.body.pgAmount : null,
        paymentMethod: pgResponse?.payment_method,
        vendor: serviceDetails?.vendor,
        commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
        planDetails: journalPlanDetails,
        commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
        traceId: req?.LogTraceId,
      });
      emailer.emailWithMultipleAttachment(to, resolvedBooking.subject, body, invoiceAttachments, cc, function () { });

      //reminder code starts
      let expireDate = new Date();
      if (orderResponse.planDetails.billingCycle === "MONTHLY") {
        expireDate.setMonth(expireDate.getMonth() + 1);
        // reminderDate.setMinutes(reminderDate.getMinutes() + 5);
      } else {
        expireDate.setFullYear(expireDate.getFullYear() + 1);
      }
      let reminderDate = new Date(expireDate);
      reminderDate.setDate(reminderDate.getDate() - 5);
      const host = partnerDetails?.baseUrl;

      schedule.scheduleJob(reminderDate, async function () {
        const url = `${host}/office-address`;
        let to, cc;

        if (subCorporateEmail) {
          to = subCorporateEmail;
          cc = emailId;
        } else {
          to = emailId;
          cc = undefined; // or omit if not needed
        }
        const subject = "Workspace Renewal Reminder"; // Set email subject
        const resolvedReminder = await resolveEmailTemplate({
          key: EMAIL_TEMPLATE_KEYS.WORKSPACE_REMINDER,
          service: EMAIL_TEMPLATE_SERVICES.WORKSPACE,
          variables: {
            url,
            expireDate: new Date(expireDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            name,
            branding: partnerDetails?.branding || 'Peko',
            website: partnerDetails?.baseUrl || 'https://peko.one/in',
            logo: partnerDetails?.logo,
            ...v2LayoutVariables(partnerDetails),
          },
          fallback: () => workspaceReminder(url, expireDate, name, partnerDetails),
          fallbackSubject: subject,
          logTraceId: req?.LogTraceId,
        });
        const body = resolvedReminder.html;
        // Call email function to send email with payment details in the body
        emailer.email({to,cc, subject: resolvedReminder.subject, body}, function () { });
      });

      // Send push notification with payment details
      const notificationData = {
        notificationTitle: "Workspace - Payment successful",
        notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Workspace was successful. Transaction ID: ${paymentDetails?.transactionId}.`,
        notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
        notificationCategory: "CORPORATE", // Replace with the relevant category
        notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
      };
     
      createNotification(notificationData);
    }
    await updateWalletTransaction(updateDetails);
  }
  if (updateDetails.message !== "Payment Successful") {
    const paymentDetails = {
      transactionId: transactionId,
      account: account,
      amount: (Number(amount) + Number(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2),
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
    const body = commonFailedTemplate(name, "Workspace", serviceUrl, partnerDetails);
    emailer.email({to,cc, subject, body}, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    const notificationData = {
      notificationTitle: "Workspace - Payment unsuccessful",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Workspace was unsuccessful. Transaction ID: ${paymentDetails?.transactionId}.`,
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
          ...{},
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "payment failed",
        responseCode: "001",
      });
  } else {
      return res.status(200).json({
        status: true,
        data: {
          ...{},
          ...transactionResponse,
          corporateTxnId,
        },
        message: "payment successfull",
        responseCode: "000",
      });
  }
});
