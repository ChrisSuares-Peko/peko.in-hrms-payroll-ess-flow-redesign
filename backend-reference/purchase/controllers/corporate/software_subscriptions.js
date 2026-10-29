/* eslint-disable no-prototype-builtins */
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { findAll, findOne, update: updateProduct } = require("../../models/use-cases/softwares_subscriptions");
const fs = require('fs');
const path = require('path');
const { findAllPlans, findOne: findOnePlan } = require("../../models/use-cases/softwares_subscriptions_plans");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");
const { PLAN_COMMISSION, removeCommissionFields } = require("../../utils/configuredFlag");
const { fetchServiceDetails, calculateSurcharge, calculateAmountWithTax } = require("../../utils/checkAndFetchServiceDetails");
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require("../../utils/walletTransaction");
const {
  generateEmailDomainSuccessEmailToVendor,
  generateEmailDomainSuccessEmailToInternals,
  generateEmailDomainSuccessEmail,
} = require("../../utils/emailTemplate/emailDomain");
const emailer = require("../../utils/emailer");
const { createLeanTransaction } = require("../../utils/leanTransaction");
const { cancelCardTransaction } = require("./payment_gateway");
const { paymentGateWayRefundFailureEmail, leanRefundFailureEmail } = require("../../utils/emailSender");
const { createLeanPayoutRequest } = require("./lean");
const { commonFailedTemplate } = require("../../utils/emailTemplate/common");
const { createNotification } = require("../../models/use-cases/notification");
const { findAllTransactions } = require("../../models/use-cases/transaction");
const wallet = require("../../models/entities/wallet");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { findOneOrderByTxnId } = require("../../models/use-cases/order");
const { customLog } = require("../../utils/loggerHelper");
const { uploadFile } = require("../../utils/commonUploadFile");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");

const accessKey = "email_domain_service";

exports.findAllSoftwareSubscriptionsAndCount = asyncHandler(async (req, res, next) => {

  let { searchText, page, itemsPerPage } = req.query;

  const sort = req.query.sort && req.query.sort === "DESC" ? "DESC" : "ASC";
  let sortField = req.query.sortField || "displayOrder";

  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage;

  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  let params = {
    limit,
    offset,
    searchText,
    sort,
    sortField,
  };

  const status = true;
  const attributes = ["id", "name", "offersText", "image"];
  const productData = await findAll(params, status, attributes);
  if (!productData) {
    return next(new ErrorResponse(`Something went wrong while getting all Business Emails`, 400));
  } else {
    return res.status(200).json({
      status: true,
      data: {
        recordsTotal: productData ? productData.count : 0,
        recordsFiltered: productData ? productData.count : 0,
        data: productData ? productData.rows : 0,
      },
      message: "All Business Emails fetched successfully",
      responseCode: "000",
    });
  }
});

exports.findAllPlansAndDetails = asyncHandler(async (req, res, next) => {

  const productId = req.query.productId;
  const planAttributes = ["id", "name", "features", "monthlyPrice", "yearlyPrice", "features", "descriptions", "image_url", ...PLAN_COMMISSION.fields];
  const productAttribute = ["name", "peko_key", "id"];
  const productData = await findOne({ id: productId }, productAttribute);
  const planDatas = await findAllPlans({ softwaresSubscriptionId: productId, status: true }, planAttributes);
  if (!planDatas) {
    return next(new ErrorResponse(`Something went wrong while fetching plans`, 400));
  } else {
    await applyCommissionMarkup(planDatas, "monthlyPrice", req.user.id);
    await applyCommissionMarkup(planDatas, "yearlyPrice", req.user.id);
    removeCommissionFields(planDatas);
    return res.status(200).json({
      status: true,
      message: "All software subscription plans are fetched successfully",
      data: { planDatas, productData },
      responseCode: "000",
    });
  }
});

exports.payment = asyncHandler(async (req, res, next) => {


  //check disableService?
  let transactionCategory = "Business Emails";
  const transactionId = `${new Date().valueOf()}${Math.floor(Math.random() * 90000 + 10000)}`;
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
  const planId = req.body.planId;
  const contactNo = req.user.mobileNo;
  // const accounts_id = req.user.accounts_id;

  // // zoho credentials
  // const customer_id = req.user.zoho_id;

  const planData = await findOnePlan({ id: planId }, credentialId);
  const billingType = req.body.billingType;
  const vendorEmail = planData.softwares_subscription.vendor.vendorEmail;
  const emailToVendor = planData.softwares_subscription.sendVendorMail;
  const internalEmails = planData.softwares_subscription.pekoEmail;
  const emailToPekoInternal = planData.softwares_subscription.sendInternalMail;
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
  const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
  const surcharge = await calculateAmountWithTax(surchargeWithoutTax)  // first we will  do transaction 
  //  serviceDetails.transactionReportRule = "SERVICE_WITH_INVOICE_AND_SURCHARGE" //ONLY TEMP
  const partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  const planDetails = [{
    name: planData.name ? `Business Email : ${planData.name}` : "Business Email Service",
    commissionMode: planData.commissionMode,
    commissionType: planData.commissionType,
    commission: planData.commission,
    fixedCommissionPerTransaction: planData.fixedCommissionPerTransaction,
    isCommissionInclGST: planData.isCommissionInclGST,
    amount: billingType === "MONTHLY" ? planData.monthlyPrice : planData.yearlyPrice,
    quantity: Number(formDetails?.numberOfUsers ?? 1),
  }];

  const reportData = await computeJournalData({
    serviceDetails,
    amount,
    paymentMethod: "WALLET",
    partnerDetails,
    paymentGatewayName: "WALLET",
    couponTotalDiscount: req.body.couponTotalDiscount,
    planDetails,
    corporateState: req.user.state,
    credentialId,
  });
  let corporateTxnId = new Date().valueOf();
  const publishJournal = (type) =>
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
  let transactionResponse = {};
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
      reportData
    });
  }
  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
    return next(new ErrorResponse(transactionResponse["error"], 400));
  }

  publishJournal("payment");

  const numberOfUsers = formDetails.numberOfUsers
  const actualAmount = billingType === "MONTHLY" ? planData.monthlyPrice * numberOfUsers : planData.yearlyPrice * numberOfUsers;
  let result = {
    data: {},
  };
  if (amount != actualAmount) {
    customLog(req?.LogTraceId, "error", { message: "Found Mismatched amount in software subscription controlelr", amount, actualAmount })

    result.data.errorcode = "001";
  }

  let updateDetails = {};
  if (!result || (result.hasOwnProperty("data") && result.data.hasOwnProperty("errorcode")) || result.data.hasOwnProperty("errorCode")) {
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: "Something went wrong",
      registeredById: req.user.registeredBy,
    };
    if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
      let refundPGResponse = await cancelCardTransaction(req, req.body.paymentGatewayResponse);
      if (refundPGResponse?.state == "REVERSED") {
        await refundWalletTransaction(updateDetails);
        publishJournal("refund");
      } else {
        await paymentGateWayRefundFailureEmail(req);
      }
    } else if (Object.prototype.hasOwnProperty.call(req.body, "leanResponse")) {
      const { status, message } = await createLeanPayoutRequest(
        req.body.leanAmount,
        req.user.id,
        transactionResponse.orderId,
        updateDetails
      );
      if (!status) {
        await leanRefundFailureEmail(req, message);
      }
      /**
       * in true case the refundWalletTransaction is needed to be called after the lean authorization.
       * this called after the webhook from lean.
       */
    } else {
      await refundWalletTransaction(updateDetails);
      publishJournal("refund");
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
    const paymentDetails = {
      products: JSON.stringify(orderResponse.subscriptionDetails),
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
    };

    if (emailToVendor) {
      const toVendor = vendorEmail;
      let templateDetails;
      req.user.registeredBy ?
      templateDetails = await fetchPartnerDetails(req.user.registeredBy)
       :
       templateDetails = await partnerLogos()
        const vendorOrderId = transactionResponse.orderId;
      const resolvedVendor = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.EMAILDOMAIN_ORDER_VENDOR,
        service: EMAIL_TEMPLATE_SERVICES.EMAILDOMAIN,
        variables: {
          name: planData.softwares_subscription.vendor.vendorName,
          orderId: vendorOrderId,
          customerName: name,
          emailId,
          contactNo: contactNo || '',
          softwareName: planData?.softwares_subscription?.name,
          priceText: `${Number(planData?.price)}/${billingType?.toLowerCase()}`,
          branding: templateDetails?.branding || 'Peko',
          website: templateDetails?.website || 'https://www.peko.one',
          ...v2LayoutVariables(templateDetails),
        },
        fallback: () => generateEmailDomainSuccessEmailToVendor(planData.softwares_subscription.vendor.vendorName, planData, vendorOrderId, name, emailId, contactNo, billingType, formDetails, templateDetails),
        fallbackSubject: `Order placed for ${planData.softwares_subscription.name}. Order ID: ${vendorOrderId}`,
        logTraceId: req?.LogTraceId,
      });
      emailer.email(
        toVendor,
        resolvedVendor.subject,
        resolvedVendor.html,
        function () { }
      );
    }
    if (emailToPekoInternal) {
      const toInternal = internalEmails;
      let templateDetails;
      req.user.registeredBy ?
      templateDetails = await fetchPartnerDetails(req.user.registeredBy)
       :
       templateDetails = await partnerLogos()
        const resolvedInternal = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.EMAILDOMAIN_ORDER_INTERNAL,
        service: EMAIL_TEMPLATE_SERVICES.EMAILDOMAIN,
        variables: {
          name: "Admin",
          transactionId: paymentDetails.transactionId,
          amount: paymentDetails.amount,
          softwareName: planData?.softwares_subscription?.name,
          priceText: `${Number(planData?.price)}/${billingType?.toLowerCase()}`,
          branding: templateDetails?.branding || 'Peko',
          website: templateDetails?.website || 'https://www.peko.one',
          ...v2LayoutVariables(templateDetails),
        },
        fallback: () => generateEmailDomainSuccessEmailToInternals("Admin", paymentDetails.transactionId, paymentDetails.amount, planData, billingType, formDetails, templateDetails),
        fallbackSubject: `Order placed for ${planData.softwares_subscription.name}. Order ID: ${transactionResponse.orderId}`,
        logTraceId: req?.LogTraceId,
      });
      emailer.email(
        toInternal,
        resolvedInternal.subject,
        resolvedInternal.html,
        function () { }
      );
    }
    // Send push notification with payment details
    const notificationData = {
      notificationTitle: " Business Emails Purchase - Payment Successful",
      notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Business Emails was successful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
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
    const to = emailId; // Set recipient email address
    let templateDetails;
             templateDetails = await fetchPartnerDetails(req.user.registeredBy)
    const subject = "Business Emails purchase successful"; // Set email subject
    const resolvedDomainSuccess = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.EMAILDOMAIN_PURCHASE_SUCCESS,
      service: EMAIL_TEMPLATE_SERVICES.EMAILDOMAIN,
      variables: {
        name,
        transactionId: paymentDetails.transactionId,
        amount: paymentDetails.amount,
        billingType,
        branding: templateDetails?.branding || 'Peko',
        website: templateDetails?.website || 'https://www.peko.one',
        ...v2LayoutVariables(templateDetails),
      },
      fallback: () => generateEmailDomainSuccessEmail(name, paymentDetails.transactionId, paymentDetails.amount, planData, billingType, templateDetails, softwareImage),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedDomainSuccess.html;

    const invoiceAttachments = await generateOrderInvoiceAttachments({
      amount,
      surcharge: surcharge || 0,
      couponDiscount: transactionResponse?.couponDiscount || 0,
      corporateTxnId,
      orderId:
        transactionResponse?.orderId ||
        (await findOneOrderByTxnId(corporateTxnId))?.id,
      paymentType: "Business Emails",
      credentialId,
      vendor: serviceDetails?.vendor,
      commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
      planDetails,
      commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
      traceId: req?.LogTraceId,
    });
    emailer.emailWithMultipleAttachment(to, resolvedDomainSuccess.subject, body, invoiceAttachments, async (emailErr) => {
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
      amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
    };
    const notificationData = {
      notificationTitle: " Business Emails Purchase - Payment unsuccessful",
      notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Business Emails Purchase was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    createNotification(notificationData);
    //return next(new ErrorResponse([updateDetails.message], 200))
    const subject = "Payment Failed";
    const to = emailId;
    let templateDetails;
    req.user.registeredBy ?
             templateDetails = await fetchPartnerDetails(req.user.registeredBy)
              :
              templateDetails = await partnerLogos()
      const serviceUrl = templateDetails?.baseUrl ||
      (process.env.NODE_ENV === "staging" ? process.env.STAGING_FRONT_END_URL : process.env.PRODUCTION_FRONT_END_URL);
    const resolvedDomainFailed = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.EMAILDOMAIN_PAYMENT_FAILED,
      service: EMAIL_TEMPLATE_SERVICES.EMAILDOMAIN,
      variables: {
        name,
        serviceName: "Business Emails",
        retryUrl: serviceUrl || `${templateDetails?.baseUrl}/payments`,
        branding: templateDetails?.branding || 'Peko',
        website: templateDetails?.website || 'https://www.peko.one',
        ...v2LayoutVariables(templateDetails),
      },
      fallback: () => commonFailedTemplate(name, "Business Emails", serviceUrl, templateDetails),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedDomainFailed.html;

    emailer.email(to, resolvedDomainFailed.subject, body, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    const walletDetails = await wallet.findOne({
      where: {
        credentialId,
      },
      attributes: ["balance"],
    });
    if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
      res.redirect(`${req.body.pageAddress}?status="failure"&transactionId=${corporateTxnId}`);
    } else
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
    if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
      res.redirect(`${req.body.pageAddress}?status="success"&transactionId=${corporateTxnId}`);
    } else
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

exports.findAllSoftwareSubscriptionTransactionsAndCount = asyncHandler(async (req, res, next) => {

  let { from, to, searchText, page, itemsPerPage, productId } = req.query;
  let corporateId = req.user.id;

  const sort = req.query.sort && req.query.sort === "DESC" ? "DESC" : "ASC";
  const filter = req.query.filter || undefined;

  // Parse page and itemsPerPage to integers
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage;

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  let categoryName = "Business Emails";
  let sortField = "transactionDate";

  let serviceAttribute = [];
  let credentialAttribute = [];
  let transactionAttribute = ['corporateTxnId'];
  let orderAttribute = ["id", "amountInINR", "paymentMode", "status", "orderResponse", "transactionDate", "corporateTxnId"];

  let params = {
    from,
    to,
    categoryName,
    searchText,
    sort,
    filter,
    limit,
    offset,
    corporateId,
    serviceAttribute,
    credentialAttribute,
    transactionAttribute,
    orderAttribute,
    sortField,
    productId
  };

  if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
    params.subCorporateUserId = req.user.subCorporateId;
  }
  let productName = ''
  if (productId) {
    const productData = await findOne({ id: productId }, ['name']);
    productName = productData.name
  }
  const TransactionsData = await findAllTransactions(params);
  if (!TransactionsData) {
    return next(new ErrorResponse(`Something went wrong while fetching Business Emails transactions from DB`, 400));
  } else {
    return res.status(200).json({
      status: true,
      data: {
        result: TransactionsData.rows,
        totalData: TransactionsData.count,
        productName
      },
      message: "Business Emails transactions fetched successfully!",
      responseCode: "000",
    });
  }
});
