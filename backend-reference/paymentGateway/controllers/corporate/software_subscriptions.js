const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { update: updateProduct } = require("../../models/use-cases/softwares_subscriptions");
const { findOne: findOnePlan } = require("../../models/use-cases/softwares_subscriptions_plans");
const { fetchServiceDetails, calculateSurchargeWithTax } = require("../../utils/checkAndFetchServiceDetails");
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require("../../utils/walletTransaction");
const fs = require('fs');
const path = require('path');
const {
  generateEmailDomainSuccessEmailToVendor,
  generateEmailDomainSuccessEmailToInternals,
  generateEmailDomainSuccessEmail,
} = require("../../utils/emailTemplate/emailDomain");
const emailer = require("../../utils/emailer");
const { createLeanTransaction } = require("../../utils/leanTransaction");
const { createNotification } = require("../../models/use-cases/notification");
const { commonFailedTemplate } = require("../../utils/emailTemplates");
const { createPGTransaction } = require("../../utils/paymentGatewayTransaction");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { customLog } = require("../../utils/loggerHelper");
const { cancelPGTransaction } = require("../../utils/pgRefund");
const wallet = require("../../models/entities/wallet");
const { uploadFile } = require("../../utils/commonUploadFile");
const { createBusinessEmailSubscription } = require("../../utils/businessEmailSubscription");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");

const accessKey = "email_domain_service";

exports.payment = asyncHandler(async (req, res, next) => {
  //check disableService?
  const data = req.body; 
  let transactionCategory = "Business Emails";
  const transactionId = req.body.corporateTxnId || `${new Date().valueOf()}${Math.floor(Math.random() * 90000 + 10000)}`;
  let providerId = transactionId;
  const account = req.body.account;
  const amount = req.body.amount;
  const formDetails = req.body.formDetails;
  const payCashback = req.body.payCashback;
  const credentialId = req.user.id; //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const corporateUserId = req.user.corporateId; //will come from userObject
  const name = req.user.name;
  const emailId = req.user.email;
  const subCorporateEmail = req.user.subCorporateEmail;
  const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;
  const planId = req.body.planId;
  const contactNo = req.user.mobileNo;

  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  const { data: planData } = await findOnePlan({ params: { id: planId }, productAttribute: null, credentialId });
  const billingType = req.body.billingType;
  const vendorEmail = planData.softwares_subscription.vendor.vendorEmail;
  const emailToVendor = planData.softwares_subscription.sendVendorMail;
  const internalEmails = planData.softwares_subscription.pekoEmail;
  const emailToPekoInternal = planData.softwares_subscription.sendInternalMail;
  const isMicrosoftSubscription = planData.softwares_subscription.peko_key === "microsoft_365"
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails["error"], 400));
  }
  let commissionType = serviceDetails.commissionType;
  let cashbackType = serviceDetails.cashbackType;
  let providerCommission = serviceDetails.providerCommission;
  let corporateCashback = serviceDetails.cashback;
  let serviceOperatorId = serviceDetails.id;

  const { surcharge } = await calculateSurchargeWithTax(
      serviceDetails.surcharge,
      serviceDetails.surchargeType,
      amount,
      credentialId
  );

  const planDetails = [{
    name: planData.name ? `Business Email : ${planData.name}` : "Business Email Service",
    commissionMode: planData.commissionMode,
    commissionType: planData.commissionType,
    commission: planData.commission,
    fixedCommissionPerTransaction: planData.fixedCommissionPerTransaction,
    isCommissionInclGST: planData.isCommissionInclGST,
    isCommissionConfigured: planData.isCommissionConfigured,
    amount: billingType === 'MONTHLY' ? planData.monthlyPrice : planData.yearlyPrice,
    quantity: Number(formDetails?.numberOfUsers ?? 1),
  }];

  const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
  const reportData = await computeJournalData({
    serviceDetails,
    pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
    amount,
    paymentMethod: pgResponse?.payment_method || {},
    partnerDetails,
    paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
    couponTotalDiscount: req.body.couponTotalDiscount,
    planDetails,
    corporateState: req.user.state,
    credentialId,
  });

  const corporateTxnId = req.body.corporateTxnId;
  const pgAmount = (parseFloat(amount) + parseFloat(surcharge)).toFixed(2)
  let transactionResponse = {};
  if (isMicrosoftSubscription) {
      if (Object.prototype.hasOwnProperty.call(req.body, "leanResponse")) {
          transactionResponse = await createLeanTransaction({
              providerId,
              corporateTxnId,
              credentialId,
              serviceOperatorId,
              corporateCashback,
              accountNo: account,
              leanAmount: req.body.leanAmount,
              transactionCategory,
              orderAmount: amount,
              commissionType,
              cashbackType,
              providerCommission,
              payCashback,
              leanResponse: req.body.leanResponse,
              surcharge,
          });
      } else if (
          Object.prototype.hasOwnProperty.call(
              req.body,
              "paymentGatewayResponse"
          )
      ) {
          transactionResponse = await createPGTransaction({
              providerId,
              corporateTxnId,
              credentialId,
              serviceOperatorId,
              corporateCashback,
              accountNo: account,
              pgAmount: req.body.pgAmount,
              transactionCategory,
              orderAmount: amount,
              commissionType,
              cashbackType,
              providerCommission,
              payCashback,
              pgResponse: req.body.paymentGatewayResponse,
              surcharge,
              couponCode: req.body.couponCode,
              corporateUserId,
              partnerId: req.user.registeredBy,
              reportData,
          });
      } else {
          transactionResponse = await createWalletTransaction({
              providerId,
              corporateTxnId,
              credentialId,
              serviceOperatorId,
              corporateCashback,
              transactionCategory,
              surcharge,
              accountNo: account,
              amount,
              commissionType,
              cashbackType,
              providerCommission,
              payCashback,
              reportData,
          });
      }
  } else {
      let updatedData = {
          emailDomainsDetails: planData,
          billingType: billingType,
          softwaresSubscriptionsPlanId: planId,
          status: "PENDING",
          subscriptionStartDate: null,
          subscriptionEndDate: null,
          corporateUserId,
          noOfEmails: formDetails.numberOfUsers,
          isCustom: req.body.isAddOn,
      };
      const serviceOperatorId = serviceDetails.id;
      transactionResponse = await createBusinessEmailSubscription({
          updatedData,
          corporateTxnId,
          credentialId,
          pgAmount,
          paymentGatewayResponse: data.paymentGatewayResponse,
          surcharge,
          reportData,
          planData,
          serviceOperatorId,
      });
  }

  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
    return next(new ErrorResponse(transactionResponse["error"], 400));
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

  const numberOfUsers = formDetails.numberOfUsers
  const actualAmount = billingType === "MONTHLY" ? planData.monthlyPrice * numberOfUsers : planData.yearlyPrice * numberOfUsers;
  let result = {
    data: {},
  };
  if (amount != actualAmount) {
    customLog(req?.LogTraceId, "info", { message: "Found Mismatched amount" })
    result.data.errorcode = "001";
  }

  let updateDetails = {};
  if (!result || (Object.prototype.hasOwnProperty.call(result, "data") && Object.prototype.hasOwnProperty.call(result.data, "errorcode")) || Object.prototype.hasOwnProperty.call(result.data, "errorCode")) {
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: "Something went wrong",
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
        emailDomainsDetails: planData,
        formDetails,
        mobileNo: contactNo,
        billingType
      }),
    };
  }

  if (updateDetails.message == "Payment Successful") {
    const orderResponse = JSON.parse(updateDetails.orderResponse);

    // Create a payment details object with the relevant details
    transactionResponse.datetime = new Date();
    transactionResponse.amount = amount;
    transactionResponse.paymentMode = "PAYMENT GATEWAY"
    const paymentDetails = {
      products: JSON.stringify(orderResponse.subscriptionDetails),
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(amount) + parseFloat(surcharge)- transactionResponse.couponDiscount).toFixed(2),
    };

    if (emailToVendor) {
      const toVendor = vendorEmail;
      const resolvedVendor = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.EMAILDOMAIN_ORDER_VENDOR,
        service: EMAIL_TEMPLATE_SERVICES.EMAILDOMAIN,
        variables: {
          name: planData.softwares_subscription.vendor.vendorName,
          orderId: transactionResponse.orderId,
          customerName: name,
          emailId,
          contactNo: contactNo || '',
          softwareName: planData?.softwares_subscription?.name,
          priceText: `${Number(planData?.price)}/${billingType?.toLowerCase()}`,
          branding: partnerDetails?.branding || 'Peko',
          website: partnerDetails?.baseUrl || 'https://peko.one/in',
          ...v2LayoutVariables(partnerDetails),
        },
        fallback: () => generateEmailDomainSuccessEmailToVendor(
          planData.softwares_subscription.vendor.vendorName,
          planData,
          transactionResponse.orderId,
          name,
          emailId,
          contactNo,
          billingType,
          formDetails,
          partnerDetails
        ),
        fallbackSubject: `Order placed for ${planData.softwares_subscription.name}. Order ID: ${transactionResponse.orderId}`,
        logTraceId: req?.LogTraceId,
      });
      emailer.email(
        {to:toVendor,
        subject:resolvedVendor.subject,
        body:resolvedVendor.html},
        function () { }
      );
    }
    if (emailToPekoInternal) {
      const toInternal = internalEmails;
      const resolvedInternal = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.EMAILDOMAIN_ORDER_INTERNAL,
        service: EMAIL_TEMPLATE_SERVICES.EMAILDOMAIN,
        variables: {
          name: "Admin",
          transactionId: paymentDetails.transactionId,
          amount: paymentDetails.amount,
          softwareName: planData?.softwares_subscription?.name,
          priceText: `${Number(planData?.price)}/${billingType?.toLowerCase()}`,
          branding: partnerDetails?.branding || 'Peko',
          website: partnerDetails?.baseUrl || 'https://peko.one/in',
          ...v2LayoutVariables(partnerDetails),
        },
        fallback: () => generateEmailDomainSuccessEmailToInternals(
          "Admin",
          paymentDetails.transactionId,
          paymentDetails.amount,
          planData,
          billingType,
          formDetails,
          partnerDetails
        ),
        fallbackSubject: `Order placed for ${planData.softwares_subscription.name}. Order ID: ${transactionResponse.orderId}`,
        logTraceId: req?.LogTraceId,
      });
      emailer.email(
      {  to:toInternal,
        subject:resolvedInternal.subject,
        body:resolvedInternal.html},
        function () { }
      );
    }
    // Send push notification with payment details
    const notificationData = {
      notificationTitle: " Business Emails Purchase - Payment Successful",
      notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Business Emails was successful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: "CORPORATE", // Replace with the relevant category
      notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
    };
   
    createNotification(notificationData);
    const imageName = planData.softwares_subscription.name === 'Google Workspace' ? 'googleworkspace.png' : 'microsoft365.png';
    const imagePath = path.join(__dirname, '..', '..', 'public', 'assets', 'images', 'businessEmail', imageName);

    // Read and convert the image to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Define S3 file path and format
    const filePath = `businessEmail`; // Use NODE_ENV or fallback to "staging"
    const format = 'png';

    // Upload to S3 and get the URL
    const softwareImage = await uploadFile(base64Image, filePath, format);
    let to, cc;
    if (subCorporateEmail) {
      to = subCorporateEmail;
      cc = emailId;
    } else {
      to = emailId;
      cc = undefined; // or omit if not needed
    }
    const subject = "Business Emails purchase successful"; // Set email subject
    const resolvedDomainSuccess = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.EMAILDOMAIN_PURCHASE_SUCCESS,
      service: EMAIL_TEMPLATE_SERVICES.EMAILDOMAIN,
      variables: {
        name,
        transactionId: paymentDetails.transactionId,
        amount: paymentDetails.amount,
        billingType,
        branding: partnerDetails?.branding || 'Peko',
        website: partnerDetails?.baseUrl || 'https://peko.one/in',
        ...v2LayoutVariables(partnerDetails),
      },
      fallback: () => generateEmailDomainSuccessEmail(name, paymentDetails.transactionId, paymentDetails.amount, planData, billingType, partnerDetails, softwareImage),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedDomainSuccess.html;

    const invoiceAttachments = await generateOrderInvoiceAttachments({
      amount,
      surcharge,
      couponDiscount: transactionResponse.couponDiscount,
      corporateTxnId,
      orderId: transactionResponse.orderId,
      paymentType: "Business Emails",
      description: planData?.softwares_subscription?.name,
      credentialId,
      pgAmount: Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse") ? req.body.pgAmount : null,
      paymentMethod: pgResponse?.payment_method,
      vendor: serviceDetails?.vendor,
      commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
      planDetails,
      commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
      traceId: req?.LogTraceId,
    })
    emailer.emailWithMultipleAttachment(to, resolvedDomainSuccess.subject, body, invoiceAttachments,cc, async (emailErr) => {
      if (emailErr) {
        customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr })
      } else {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      }
    });
    updateProduct({ id: planData.softwaresSubscriptionId }, { sold_quantity: 1 });
  }
  await updateWalletTransaction(updateDetails);
  if (updateDetails.message !== "Payment Successful") {

    const paymentDetails = {
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(amount) + parseFloat(surcharge)- transactionResponse.couponDiscount).toFixed(2),
    };
    const notificationData = {
      notificationTitle: " Business Emails Purchase - Payment unsuccessful",
      notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Business Emails Purchase was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
   
    createNotification(notificationData);
    //return next(new ErrorResponse([updateDetails.message], 200))
    const subject = "Payment Failed";
    let to, cc;
    if (subCorporateEmail) {
      to = subCorporateEmail;
      cc = emailId;
    } else {
      to = emailId;
      cc = undefined; // or omit if not needed
    }
    const serviceUrl = partnerDetails?.baseUrl ||
      (process.env.NODE_ENV === "staging" ? process.env.STAGING_FRONT_END_URL : process.env.PRODUCTION_FRONT_END_URL);
    const resolvedDomainFailed = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.EMAILDOMAIN_PAYMENT_FAILED,
      service: EMAIL_TEMPLATE_SERVICES.EMAILDOMAIN,
      variables: {
        name,
        serviceName: "Business Emails",
        retryUrl: serviceUrl || `${partnerDetails?.baseUrl}/payments`,
        branding: partnerDetails?.branding || 'Peko',
        website: partnerDetails?.baseUrl || 'https://peko.one/in',
        ...v2LayoutVariables(partnerDetails),
      },
      fallback: () => commonFailedTemplate(name, "Business Emails", serviceUrl, partnerDetails),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedDomainFailed.html;

    emailer.email({to,cc, subject: resolvedDomainFailed.subject, body}, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    const walletDetails = await wallet.findOne({
      where: {
        credentialId,
      },
      attributes: ["balance"],
    });
      return res.status(500).json({
        status: false,
        message: "Something went wrong",
        data: {
          ...{},
          corporateFinalBalance: walletDetails["balance"],
        },
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