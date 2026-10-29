const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");

const { findSoftwares, findOne,update: updateSoftwareProduct } = require("../../models/use-cases/softwares");
const { findAllPlans, findOnePlan } = require("../../models/use-cases/software_plan");
const { findAllTransactions } = require("../../models/use-cases/transaction");
const { findOneDefaultAddress } = require("../../models/use-cases/addressDetails");
const { createNotification } = require("../../models/use-cases/notification");
const { fetchServiceDetails, calculateSurcharge, calculateAmountWithTax } = require("../../utils/checkAndFetchServiceDetails");
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require("../../utils/walletTransaction");
const { createPGTransaction, createPaytmTransaction } = require("../../utils/pamentGatewayTransaction");
const wallet = require("../../models/entities/wallet");
const emailer = require("../../utils/emailer");
const { generateSubscriptionSuccessEmail, commonFailedTemplate, generateSubscriptionSuccessEmailToVendor, generateSubscriptionSuccessEmailToInternals } = require("../../utils/emailTemplate/softwares");
const operatorsData = require("../../utils/operatorsData.json");
const { refundGatewayTransaction } = require("./pluralGateway");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { findOneOrderByTxnId } = require("../../models/use-cases/order");
const { customLog } = require("../../utils/loggerHelper");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
let accessKey = operatorsData["subscription"]["accessKey"];

exports.findAllSoftwares = asyncHandler(async (req, res, next) => {
  let categories = req.query.catIds && req.query.catIds != "" ? req.query.catIds.split(",") : [];
  const softwareAttributes = ["id", "image", "name", "discount", "description"];
  let result = await findSoftwares(req.query, softwareAttributes, categories);
  if (!result || result.length < 1) {
    return next(new ErrorResponse(`Something went wrong while fetching softwares`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "All softwares fetched successfully",
      data: result,
      responseCode: "000",
    });
  }
});

exports.findDetails = asyncHandler(async (req, res, next) => {
  let productCode = req.query.productId;
  const attributes = ["id", "name", "description", "image", "typeOfOrder", "features", "discount"];
  let result = await findOne({ productCode }, attributes);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching details`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Details fetched successfully",
      data: { data: result },
      responseCode: "000",
    });
  }
});

exports.findAllPlansAndCount = asyncHandler(async (req, res, next) => {
  let planAttribute = ["id", "name", "price", "features", "validity", "noOfUsers"];
  let productAttribute = ["id", "name"];
  const planDatas = await findAllPlans(req.query.productId, planAttribute, productAttribute);
  if (!planDatas) {
    return next(new ErrorResponse(`Something went wrong while fetching plans`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "All softwares plans are fetched successfully",
      data: { planDatas },
      responseCode: "000",
    });
  }
});

exports.findPlanDetails = asyncHandler(async (req, res, next) => {
  let params = req.query;
  let planAttribute = ["id", "name", "price", "validity", "features"];
  let productAttributes = ["typeOfOrder"];
  const result = await findOnePlan(params, planAttribute, productAttributes);
  if (!result) {
    return next(new ErrorResponse(`Something went wrong while fetching details`, 500));
  } else {
    return res.status(200).json({
      status: true,
      message: "Details fetched successfully",
      data: { data: result },
      responseCode: "000",
    });
  }
});

exports.findAllAssignedSubscriptions = asyncHandler(async (req, res, next) => {
  let { from, to, searchText, page, itemsPerPage } = req.query;
  let corporateId = req.user.id;

  const sort = req.query.sort && req.query.sort === "DESC" ? "DESC" : "ASC";
  const filter = req.query.filter || undefined;

  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
  let limit = itemsPerPage;

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  let categoryName = "Softwares";
  let sortField = "transactionDate";

  let serviceAttribute = [];
  let credentialAttribute = [];
  let transactionAttribute = [];
  let orderAttribute = [
    "id",
    "amountInINR",
    "paymentMode",
    "status",
    "orderResponse",
    "ecomOrderStatus",
    "transactionDate",
    "corporateTxnId",
  ];

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
  };

  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
    params.subCorporateUserId = req.user.subCorporateId;
  }
  const transactionsData = await findAllTransactions(params);
  if (!transactionsData) {
    return next(new ErrorResponse(`Something went wrong while getting all corporate from DB`, 500));
  } else {
    return res.status(200).json({
      status: true,
      data: {
        result: transactionsData.rows,
        totalData: transactionsData.count,
      },
      message: "fetched transactions successfully!!",
      responseCode: "000",
    });
  }
});

exports.findCorporateDetails = asyncHandler(async (req, res) => {
  let params = {
    credentialId: req.user.id,
    default: true,
  };
  let result = await findOneDefaultAddress(params);

  if (!result) {
    let data = {
      addressId: "",
      addressLine1: "",
      addressLine2: "",
      userName: req.user.name,
      userEmail: req.user.email,
      userCountry: req.user.country,
      mobileNo: req.user.mobile,
    };
    return res.status(200).json({
      status: true,
      message: "Details fetched successfully",
      data: data,
      responseCode: "002",
    });
  } else {
    let data = {
      addressId: result.id,
      addressLine1: result.addressLine1,
      addressLine2: result.addressLine2,
      userName: req.user.name,
      userEmail: req.user.email,
      userCountry: req.user.country,
      mobileNo: req.user.mobile,
    };
    return res.status(200).json({
      status: true,
      message: "Details fetched successfully",
      data: data,
      responseCode: "000",
    });
  }
});

exports.payment = asyncHandler(async (req, res, next) => {
  //check disableService?
  let transactionCategory = "Softwares";
  const transactionId = new Date().valueOf();
  let providerId = transactionId;
  const account = req.body.account;
  const amount = req.body.amount;
  const formDetails = req.body.formDetails;
  const payCashback = req.body.payCashback;
  const credentialId = req.user.id; //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const name = req.user.name;
  const emailId = req.user.email;
  const planId = req.body.planId;
  const planData = await findOnePlan({ id: planId });
  const vendorEmail = planData.software.vendor.vendorEmail;
  const emailToVendor = planData.software.sendVendorMail;
  const internalEmails = planData.software.pekoEmail;
  const emailToPekoInternal = planData.software.sendMail;
  const corporateUserId = req.user.corporateId
  const contactNo = req.user.mobileNo

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId
  });
  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails["error"], 200));
  }
  let commissionType = serviceDetails.commissionType;
  let cashbackType = serviceDetails.cashbackType;
  let providerCommission = serviceDetails.providerCommission;
  let corporateCashback = serviceDetails.cashback;
  let serviceOperatorId = serviceDetails.id;
  const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
  const surcharge = await calculateAmountWithTax(surchargeWithoutTax)  // first we will  do transaction
  // let partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  serviceDetails.transactionReportRule = "SERVICE_WITH_DATA_IN_ITEMS_LIST" // ONLY TEMP
  const reportData = {};
  let corporateTxnId = new Date().valueOf();
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
  };
  if (Object.prototype.hasOwnProperty.call("paymentGatewayResponse")) {
    transactionResponse = await createPGTransaction({
      ...commonParams,
      pgAmount: req.body.pgAmount,
      pgResponse: req.body.paymentGatewayResponse,
    });
  } else if (Object.prototype.hasOwnProperty.call("paytmResponse")) {
    transactionResponse = await createPaytmTransaction({
      ...commonParams,
      paytmAmount: req.body.paytmAmount,
      paytmResponse: req.body.paytmResponse,
    });
  } else {
    transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount,
      reportData
    });
  }
  if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, "error")) {
    return next(new ErrorResponse(transactionResponse["error"], 500));
  }

  let subcriptionResponse = true; //for now if payment success, it is successfull order

  let updateDetails = {};
  if (!subcriptionResponse) {
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: "No Activation Keys Available",
      registeredById: req.user.registeredBy,
    };
    if (Object.prototype.hasOwnProperty.call("paymentGatewayResponse")) {
      let refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
      if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
        await refundWalletTransaction(updateDetails);
      }
    } else {
      await refundWalletTransaction(updateDetails);
    }
  } else {
    updateDetails = {
      corporateTxnId,
      providerId: "Not Available",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify({
        subscriptionDetails: planData,
        formDetails,
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
    let templateDetails;
    templateDetails = await fetchPartnerDetails(req.user.registeredBy)
    const to = emailId; // Set recipient email address
    const subject = "Software purchase successful"; // Set email subject
    const resolvedSoftwareSuccess = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.SOFTWARE_PURCHASE_SUCCESS,
      service: EMAIL_TEMPLATE_SERVICES.SOFTWARE,
      variables: {
        name,
        transactionId: paymentDetails.transactionId,
        amount: paymentDetails.amount,
        softwareName: planData?.software?.name,
        planName: planData?.name,
        branding: templateDetails?.branding || 'Peko',
        website: templateDetails?.website || 'https://www.peko.one',
        ...v2LayoutVariables(templateDetails),
      },
      fallback: () => generateSubscriptionSuccessEmail(name, paymentDetails.transactionId, paymentDetails.amount, planData, templateDetails),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedSoftwareSuccess.html;
    if (emailToVendor) {
      const toVendor = vendorEmail;
      const vendorOrderId = transactionResponse.orderId;
      const resolvedVendor = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.SOFTWARE_ORDER_VENDOR,
        service: EMAIL_TEMPLATE_SERVICES.SOFTWARE,
        variables: {
          name: planData.software.vendor.vendorName,
          orderId: vendorOrderId,
          customerName: name,
          emailId,
          contactNo: contactNo || '',
          branding: templateDetails?.branding || 'Peko',
          website: templateDetails?.website || 'https://www.peko.one',
          ...v2LayoutVariables(templateDetails),
        },
        fallback: () => generateSubscriptionSuccessEmailToVendor(planData.software.vendor.vendorName, planData, vendorOrderId, name, emailId, contactNo, templateDetails),
        fallbackSubject: `Order placed for ${planData.software.name}. Order ID: ${vendorOrderId}`,
        logTraceId: req?.LogTraceId,
      });
      emailer.email(toVendor, resolvedVendor.subject, resolvedVendor.html, function () { });
  }
  if (emailToPekoInternal) {
      const toInternal = internalEmails;
      const resolvedInternal = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.SOFTWARE_ORDER_INTERNAL,
        service: EMAIL_TEMPLATE_SERVICES.SOFTWARE,
        variables: {
          name: "Admin",
          transactionId: paymentDetails.transactionId,
          amount: paymentDetails.amount,
          branding: templateDetails?.branding || 'Peko',
          website: templateDetails?.website || 'https://www.peko.one',
          ...v2LayoutVariables(templateDetails),
        },
        fallback: () => generateSubscriptionSuccessEmailToInternals("Admin", paymentDetails.transactionId, paymentDetails.amount, planData, templateDetails),
        fallbackSubject: `Order placed for ${planData.software.name}. Order ID: ${transactionResponse.orderId}`,
        logTraceId: req?.LogTraceId,
      });
      emailer.email(toInternal, resolvedInternal.subject, resolvedInternal.html, function () { });
  }
    // Call email function to send email with payment details in the body
    // Send push notification with payment details
    const notificationData = {
      notificationTitle: "Software Purchase - Payment Successful",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Softwares Purchase was successful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
      notificationCategory: "CORPORATE", // Replace with the relevant category
      notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
    };
    if (req.body.role === 'CORPORATE_SUB_USER' && req.body.subCorporateId) {
      const subcorporateUsername = req.body.subCorporateUsername
      if (subcorporateUsername) {
          notificationData.notificationTo.push(subcorporateUsername);
      }
  }

  const invoiceAttachments = await generateOrderInvoiceAttachments({
    amount: amount,
    surcharge: surcharge || 0,
    couponDiscount: transactionResponse?.couponDiscount || 0,
    corporateTxnId,
    orderId:
      transactionResponse?.orderId ||
      (await findOneOrderByTxnId(corporateTxnId))?.id,
    paymentType: "Software Purchase",
    credentialId,
    pgAmount: Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")
      ? req.body.pgAmount
      : null,
    vendor: serviceDetails?.vendor,
    commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
    traceId: req?.LogTraceId,
  });

  emailer.emailWithMultipleAttachment(to, subject, body, invoiceAttachments, async (emailErr) => {
      if (emailErr) {
          customLog(req?.LogTraceId, "error", { message: "Email error", emailErr })
      } else {
        console.log("--------------------------------------------consoler printed")
          customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      }
  });
    createNotification(notificationData);
    updateSoftwareProduct({ id: planData.softwareId }, { sold_quantity: 1 }, req.user)
  }
  await updateWalletTransaction(updateDetails);
  if (updateDetails.message !== "Payment Successful") {
    const paymentDetails = {
      transactionId: corporateTxnId,
      account: account,
      amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
    };
    let templateDetails;
    templateDetails = await fetchPartnerDetails(req.user.registeredBy)
    const serviceUrl = templateDetails?.baseUrl;
    const to = emailId; // Set recipient email address
    const subject = "Transaction Failed"; // Set email subject
    const resolvedSoftwareFailed = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.SOFTWARE_PAYMENT_FAILED,
      service: EMAIL_TEMPLATE_SERVICES.SOFTWARE,
      variables: {
        name,
        serviceName: "Software",
        retryUrl: serviceUrl || `${templateDetails?.baseUrl}/payments`,
        branding: templateDetails?.branding || 'Peko',
        website: templateDetails?.website || 'https://www.peko.one',
        ...v2LayoutVariables(templateDetails),
      },
      fallback: () => commonFailedTemplate(name, "Software", serviceUrl, templateDetails),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedSoftwareFailed.html;
    emailer.email(to, resolvedSoftwareFailed.subject, body, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
    });
    const notificationData = {
      notificationTitle: "Software Purchase - Payment unsuccessful",
      notificationBrief: `The payment of ₹ ${paymentDetails.amount} for Softwares Purchase was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    if (req.body.role === 'CORPORATE_SUB_USER' && req.body.subCorporateId) {
      const subcorporateUsername = req.body.subCorporateUsername
      if (subcorporateUsername) {
          notificationData.notificationTo.push(subcorporateUsername);
      }
  }
    createNotification(notificationData);
    //return next(new ErrorResponse([updateDetails.message], 200))
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
