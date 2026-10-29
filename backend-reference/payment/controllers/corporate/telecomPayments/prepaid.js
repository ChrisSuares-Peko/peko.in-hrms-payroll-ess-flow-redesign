/* eslint-disable no-undef */
/* eslint-disable no-prototype-builtins */
const axios = require("axios");
const { fetchServiceDetails, calculateSurchargeWithTax } = require("../../../utils/checkAndFetchServiceDetails");
const { createNotification } = require("../../../models/use-cases/notification");
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require("../../../utils/walletTransaction");
const asyncHandler = require("../../../middlewares/async");
const ErrorResponse = require("../../../utils/error-response");
const { createPGTransaction, createPaytmTransaction } = require("../../../utils/pamentGatewayTransaction");
const wallet = require("../../../models/entities/wallet");
const emailer = require("../../../utils/emailer");
const { generateOrderInvoiceAttachments } = require("../../../services/invoiceAndReceipt");
const crypto = require("crypto");
const { getOneTransaction } = require("../../../models/use-cases/transaction");
const { findUserDetails } = require("../../../utils/jwtToken");
const { refundGatewayTransaction } = require("../pluralGateway");
const { queryStringIntoBase64 } = require("../../../utils/encryptionUtils");
const operatorsData = require("./../../../utils/operatorsData.json");
const { generateMobilePaymentSuccessEmailBill, commonFailedTemplateforBillPayments } = require("../../../utils/emailTemplate/billpayments");
const { fetchPartnerDetails } = require("../../../models/use-cases/systemUser");
const { resolveEmailTemplate } = require("../../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../../utils/emailTemplate/sharedLayout");
const { customLog } = require("../../../utils/loggerHelper");
const { setValue, getValue } = require("../../../utils/cacheDataMethods");
const { formatNumberWithLocalString } = require("../../../utils/formatter");
const { computeJournalData } = require("../../../utils/computeJournalData");
const { publishJournalEvent } = require("../../../utils/bull/queue/accountingEventsQueue");
const { findByProviderName: findMobileRechargeProviderByName } = require("../../../models/use-cases/mobileRechargeProvider");
const { applyServiceCommission, getVendorAmount, getQuoteScope } = require("../../../utils/applyCommissionMarkup");
// const { findByEmail } = require("../../../models/use-cases/settings");
// const { BalanceEmailTemplate } = require("../../../utils/emailTemplate/mobilePrepaid");
let accessKey = operatorsData["prepaid"]["accessKey"];
let transactionCategory = operatorsData["prepaid"]["category"];
let type = operatorsData["prepaid"]["type"];
const { NODE_ENV } = process.env;
const frontendBaseUrl = NODE_ENV === "production" ? process.env.PRODUCTION_URL : process.env.FRONTEND_STAGING_URL;

// Vi and Airtel plan listings are served by the 121 vendor; every other provider uses the default plan API.
const PLAN121_PROVIDERS = ["VI", "AIRTEL"];

// A refund that comes after the order was created (vendor push, status check) is journalled from the
// journal data stored on the order.
const publishStoredRefundJournal = ({ req, transaction, corporateTxnId, credentialId, serviceDetails }) => {
  if (!transaction?.order?.journalData) return;
  publishJournalEvent(
    {
      transactionRef: corporateTxnId,
      type: "refund",
      contextSnapshot: {
        credentialId,
        vendor: serviceDetails?.vendor || null,
        registeredBy: req?.user?.registeredBy || null,
      },
      reportData: { journalData: transaction.order.journalData },
    },
    req?.LogTraceId
  );
};

exports.login = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id; //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
  }

  let loginUrl = serviceDetails.vendor.apiUrl;
  let password = serviceDetails.vendor.optional2;
  let corporateNumber = serviceDetails.vendor.optional3;
  let securityKey = serviceDetails.vendor.optional4;
  const concat = corporateNumber + password + securityKey;
  const chkSum = crypto.createHash("sha256").update(concat).digest("hex");
  let loginDetails = {
    CorporateNumber: corporateNumber,
    Password: password,
    ApiCheckSum: chkSum.toLowerCase(),
  };
  let config = {
    method: "post",
    url: `${loginUrl}/api/Login`,
    headers: {
      "Content-Type": "application/json",
    },
    data: loginDetails,
  };
  customLog(req?.LogTraceId, "info", { message: "Calling login API", url: config.url, method: config.method, data: config.data }, "VENDOR");
  let result = await axios(config);
  customLog(req?.LogTraceId, "info", { message: "Response from login API", url: config.url, result: result?.data }, "VENDOR");

  if (!result || result.data.hasOwnProperty("error") || result.data.Status === "2") {
    return next(new ErrorResponse(`Something went wrong while login`, 401));
  } else {
    const authKey = result.data.AuthenticationKey;
    await setValue("authKey", 86400, authKey);

    return res.status(200).json({
      status: true,
      data: result.data,
      message: "Login Successful!!",
      responseCode: "000",
    });
  }
});

exports.getconnectiondetails = asyncHandler(async (req, res, next) => {
  const mobileNumber = req.query.number;
  
  // Early validation - check mobile number before any async operations
  if (!mobileNumber) {
    return next(new ErrorResponse("Mobile number is required.", 400));
  }

  // Check cache first - fastest path
  const cacheKey = `connection_details_${mobileNumber}`;
  const cachedData = await getValue(cacheKey);
  if (cachedData) {
    return res.status(200).json({
      status: true,
      data: JSON.parse(cachedData),
      message: "Connection details fetched from cache",
      responseCode: "000",
    });
  }

  // Fetch service details and prepare API call in parallel
  const corporateUserId = req.user.corporateId;
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
  }

  const MD5 = serviceDetails.vendor.optional6;
  const corporateNumber = serviceDetails.vendor.optional1;
  const optionals = serviceDetails.vendor.optionals;
  const url = optionals['MNP_URL'];

  if (!url && NODE_ENV !== "staging") {
    return next(new ErrorResponse("Service configuration error.", 500));
  }

  // Generate checksum
  const systemReferenceNo = new Date().valueOf();
  const concat = corporateNumber + mobileNumber + systemReferenceNo + MD5;
  const chkSum = crypto.createHash("md5").update(concat).digest("hex").toLowerCase();

  // Make API call with timeout to prevent hanging
  const config = {
    method: "post",
    url: url,
    data: {
      CorporateNo: corporateNumber,
      MobileNo: mobileNumber,
      SystemReferenceNo: systemReferenceNo,
      APIChecksum: chkSum,
    },
  };

  customLog(req?.LogTraceId, "info", { message: "Calling connection details API", url: config.url, method: config.method, data: config.data }, "VENDOR");
  try {
    let result;
    if (NODE_ENV === "staging") {
      result = {
        data: {
          MobileNo: mobileNumber,
          SystemReferenceNo: String(systemReferenceNo),
          CorpRefNo: "AMNP0716731115",
          CurrentOperator: "Airtel",
          CurrentLocation: "All",
          PreviousOperator: "",
          PreviousLocation: "",
          Ported: null,
          Charged: "0.0800",
          Error: "",
        },
      };
    } else {
      result = await axios(config);
    }
    customLog(req?.LogTraceId, "info", { message: "Response from connection details API", url: config.url, result: result?.data }, "VENDOR");

    if (result.data && result.data.Error === "") {
      // Store in cache asynchronously (don't wait for it)
      setValue(cacheKey, 86400, JSON.stringify(result.data)).catch(err => {
        customLog(req?.LogTraceId, "error", { message: "Failed to cache connection details", error: err });
      });

      return res.status(200).json({
        status: true,
        data: result.data,
        message: "Connection details fetched successfully",
        responseCode: "000",
      });
    } else {
      return res.status(500).json({
        status: false,
        data: {},
        message: "Failed to retrieve service provider and circle information. Please try again later.",
        responseCode: "003",
      });
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return next(new ErrorResponse("Request timeout. Please try again.", 408));
    }
    customLog(req?.LogTraceId, "error", { message: "Error fetching connection details", error: error.message });
    return next(new ErrorResponse("Unable to fetch service provider and circle.", 400));
  }
});

exports.plans = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id; //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
  }

  // Vi and Airtel plans come from the 121 vendor; route them there and return the same normalized shape.
  if (PLAN121_PROVIDERS.includes(String(req.body.serviceProvider || "").toUpperCase())) {
    return getPlans121(req, res, next, serviceDetails);
  }

  let apiUrl = serviceDetails.vendor.optional5; //optional 5 is holding api url for plan details
  let config = {
    method: "post",
    url: apiUrl,
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      ServiceName: "M",
      ServiceProviderName: req.body.serviceProvider,
      LocationName: req.body.location,
    },
  };
  let result;
  customLog(req?.LogTraceId, "info", { message: "Calling plans API", url: config.url, method: config.method, data: config.data }, "VENDOR");
  if (NODE_ENV === "staging") {
    result = {
      data: [
        {
          Amount: 648,
          Description:
            "Get 100 min incoming + 500 MB Data + 100 SMS+ 100 min Local calls or calls to India (Covered Countries - UAE, Saudi Arabia, Oman, Kuwait, Bahrain, Qatar, Iran, Iraq, Russia).",
          LocationName: "Kolkata",
          PlanName: "International Roaming",
          ServiceId: 1,
          ServiceProviderId: 2,
          ServiceProviderName: req.body.serviceProvider,
          Talktime: 0,
          Validity: "1 Day",
        },
        {
          Amount: 10,
          Description: "10 rs Talktime",
          LocationName: "Kolkata",
          PlanName: "Topup",
          ServiceId: 1,
          ServiceProviderId: 2,
          ServiceProviderName: req.body.serviceProvider,
          Talktime: 8.23,
          Validity: "30 Day",
        },
        {
          Amount: 50,
          Description: "42.1 rs Talktime",
          LocationName: "Kolkata",
          PlanName: "Topup",
          ServiceId: 1,
          ServiceProviderId: 2,
          ServiceProviderName: req.body.serviceProvider,
          Talktime: 42.1,
          Validity: "NA",
        },
      ],
    };
  } else {
    result = await axios(config);
  }
  customLog(req?.LogTraceId, "info", { message: "Response from plans API", url: config.url, result: result?.data }, "VENDOR");
  if (!result.data || result.data.length < 1) {
    return res.status(501).json({
      status: false,
      data: {},
      message: "Unable to fetch Plan details",
      responseCode: "003",
    });
  } else {
    await applyServiceCommission(result.data, "Amount", accessKey, {
      serviceProvider: req.body.serviceProvider,
      credentialId,
      scope: getQuoteScope(req),
    });
    // Use the map method to extract all PlanName values
    const allPlanNames = result.data.map((item) => item.PlanName);
    // Use a Set to ensure uniqueness and convert it back to an array
    const planCategory = Array.from(new Set(allPlanNames));
    return res.status(200).json({
      status: true,
      data: { plans: result.data, planCategory: planCategory },
      responseCode: "000",
      message: "Plans fetched successfully!!",
    });
  }
});

// Fetches prepaid plans from the 121 vendor (Vi/Airtel) and normalizes them into the same
// MobilePlan shape returned by the default plans API, so the frontend renders both identically.
const getPlans121 = async (req, res, next, serviceDetails) => {
  try {
    const optionals = serviceDetails.vendor.optionals;
    const shaSecretKey = optionals["PLAN121_SECRET_KEY"];
    const plan121Url = optionals["PLAN121_URL"];
    const corporateNumber = optionals["PLAN121_CORPORATE_NO"];

    if (!plan121Url && NODE_ENV !== "staging") {
      return next(new ErrorResponse("Service configuration error.", 500));
    }

    const { mobileNumber, serviceProvider: provider } = req.body;
    if (!mobileNumber || !provider) {
      return next(new ErrorResponse("Mobile number and provider are required.", 400));
    }

    const systemReference = new Date().valueOf().toString();
    const concat = corporateNumber + mobileNumber + systemReference + shaSecretKey;
    const checksum = crypto.createHash("sha256").update(concat).digest("hex").toLowerCase();

    const config = {
      method: "post",
      url: plan121Url,
      headers: { "Content-Type": "application/json" },
      data: {
        CorporateNumber: corporateNumber,
        MobileNumber: mobileNumber,
        Provider: provider,
        SystemReference: systemReference,
        APIChecksum: checksum,
      },
    };

    let result;
    customLog(req?.LogTraceId, "info", { message: "Calling 121 plans API", url: config.url, method: config.method, data: config.data }, "VENDOR");

    if (NODE_ENV === "staging") {
      result = { data: { Status: "0", Plans: MOCK_121_PLANS } };
    } else {
      try {
        result = await axios(config);
      } catch (axiosError) {
        customLog(req?.LogTraceId, "error", { message: "Axios error calling 121 plans API", url: config.url, error: axiosError.message, data: axiosError?.response?.data }, "VENDOR");
        return next(new ErrorResponse("Unable to reach plans service.", 502));
      }
    }

    customLog(req?.LogTraceId, "info", { message: "Response from 121 plans API", url: config.url, result: result?.data }, "VENDOR");

    if (!result.data || result.data.Status === "2" || !result.data.Plans || !Array.isArray(result.data.Plans) || result.data.Plans.length < 1) {
      return res.status(501).json({
        status: false,
        data: {},
        message: result.data?.FailureReason || "Unable to fetch Plan details",
        responseCode: "003",
      });
    }

    // Normalize the 121 plan shape into the common MobilePlan shape used by the default plans API.
    const plans = result.data.Plans.map((item, index) => ({
      Amount: parseFloat(item.amount),
      Description: item.plan_description,
      LocationName: req.body.location || "",
      PlanName: item.plan_category_name,
      ServiceId: index,
      ServiceProviderId: 0,
      ServiceProviderName: provider,
      Talktime: item.talktime && item.talktime !== "NA" ? parseFloat(item.talktime) : 0,
      Validity: item.plan_validity || item.validity || "NA",
      planId: item.planid,
      billerId: item.billerid,
    }));
    await applyServiceCommission(plans, "Amount", accessKey, { serviceProvider: provider, credentialId: req.user.id, scope: getQuoteScope(req) });
    const planCategory = Array.from(new Set(plans.map((item) => item.PlanName)));

    return res.status(200).json({
      status: true,
      data: { plans, planCategory },
      responseCode: "000",
      message: "Plans fetched successfully!!",
    });
  } catch (error) {
    customLog(
      req?.LogTraceId,
      "error",
      { data: error?.response?.data ?? error?.response, error: error.message, message: "catch from 121 plans" },
      "VENDOR"
    );
    return next(new ErrorResponse("Internal Server Error", 400));
  }
};

exports.balanceCheck = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id; //will come from userObject
  const packageId = req.user.packageId; //will come from userObject
  const corporateUserId = req.user.corporateId;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
  }
  let apiUrl = serviceDetails.vendor.apiUrl;
  let password = serviceDetails.vendor.optional2;
  let corporateNumber = serviceDetails.vendor.optional3;
  let config = {
    method: "post",
    url: `${apiUrl}/api/Balance`,
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      CorporateNumber: corporateNumber,
      Password: password,
    },
  };
  customLog(req?.LogTraceId, "info", { message: "Calling balance check API", url: config.url, method: config.method, data: config.data }, "VENDOR");
  let result = {};
  if (process.env.NODE_ENV == "staging") {
    result.data = {
      Status: "0",
      Balance: "1000",
    };
  } else {
    result = await axios(config);
  }
  customLog(req?.LogTraceId, "info", { message: "Response from balance check API", url: config.url, result: result?.data }, "VENDOR");
  // let templateDetails;
  // templateDetails = await fetchPartnerDetails(req.user.registeredBy);
  // const fieldname = "balanceCheck";
  // const resp = await findByEmail({ name: fieldname });
  // const minBalance = resp.details.minBalance;
  // if (result.data.Balance < minBalance) {
  //   const to = resp.details.emails;
  //   const body = BalanceEmailTemplate(result.data, templateDetails);
  //   const subject = "Peko India | Mobile Prepaid balance reminder";
  //   emailer.email(to, subject, body, function () {
  //     customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
  //   });
  // }

  // The vendor is recharged the listed plan price, not the marked-up amount the customer pays.
  const vendorAmount =
    (await getVendorAmount(req.body.amount, accessKey, { serviceProvider: req.body.serviceProvider, credentialId, scope: getQuoteScope(req) })) ??
    req.body.amount;
  if (!result.data || parseFloat(result.data.Balance) < vendorAmount) {
    return next(new ErrorResponse("Prepaid Recharge unavailable at this moment", 503));
  }
  return res.status(200).json({
    status: true,
    data: result.data,
    message: "Balance checked successfully!!",
    responseCode: "000",
  });
});

exports.payment = asyncHandler(async (req, res, next) => {
  const account = req.body.account;
  const amount = req.body.amount;
  const serviceProvider = req.body.serviceProvider;
  const location = req.body.location;
  const payCashback = req.body.payCashback;
  const accessKey = req.body.accessKey;
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;
  const name = req.user.name;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (serviceDetails.hasOwnProperty("error")) {
    return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
  }
  const vendorAmount = await getVendorAmount(amount, operatorsData["prepaid"]["accessKey"], { serviceProvider, credentialId, scope: getQuoteScope(req) });
  if (vendorAmount === null) {
    return next(new ErrorResponse("Plan prices have changed. Please reload the plans.", 400));
  }
  let corporateTxnId = new Date().valueOf();
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
  // const name = req.user.name;
  const emailId = req.user.email;
  var concatenatedString = CORPORATE_ID + account + vendorAmount + corporateTxnId + SECURITY_KEY;
  var checkSum = crypto.createHash("sha256").update(concatenatedString).digest("hex");
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

  // Ensure amount is a number
  const numericAmount = parseFloat(amount);
  // Calculate surcharge with tax using common function
  const surchargeDetails = await calculateSurchargeWithTax(
    serviceDetails.surcharge,
    serviceDetails.surchargeType,
    numericAmount,
    credentialId
  );
  const numericSurcharge = surchargeDetails.surcharge;
  
  customLog(req?.LogTraceId, "info", { 
    message: "Payment calculation", 
    originalAmount: amount, 
    numericAmount, 
    surchargeType: serviceDetails.surchargeType || 'FLAT',
    surcharge: serviceDetails.surcharge,
    surchargeWithoutTax: surchargeDetails.surchargeWithoutTax,
    calculatedSurcharge: numericSurcharge,
    expectedTotal: numericAmount + numericSurcharge 
  });

  const partnerData = await fetchPartnerDetails(req.user.registeredBy);

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
      }
    : serviceDetails;

  const reportData = await computeJournalData({
    serviceDetails: journalServiceDetails,
    amount: numericAmount,
    paymentMethod: "WALLET",
    partnerDetails: partnerData,
    paymentGatewayName: "WALLET",
    couponTotalDiscount: req.body.couponTotalDiscount,
    corporateState: req.user.state || '',
    credentialId,
  });
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
  const commonParams = {
    providerId,
    corporateTxnId,
    credentialId,
    serviceOperatorId,
    corporateCashback,
    accountNo: account,
    transactionCategory,
    orderAmount: numericAmount,
    commissionType,
    cashbackType,
    providerCommission,
    payCashback,
    surcharge: numericSurcharge,
    reportData
  };
  if (req.body.hasOwnProperty("paymentGatewayResponse")) {
    transactionResponse = await createPGTransaction({
      ...commonParams,
      pgAmount: req.body.pgAmount,
      pgResponse: req.body.paymentGatewayResponse,
    });
    transactionResponse.paymentMode = req.body.paymentMode;
  } else if (req.body.hasOwnProperty("paytmResponse")) {
    transactionResponse = await createPaytmTransaction({
      ...commonParams,
      paytmAmount: req.body.paytmAmount,
      paytmResponse: req.body.paytmResponse,
    });
  } else {
    transactionResponse = await createWalletTransaction({
      ...commonParams,
      amount: numericAmount, // Use numeric amount explicitly
    });
    transactionResponse.paymentMode = "WALLET";
  }
  if (transactionResponse && transactionResponse.hasOwnProperty("error")) {
    return next(new ErrorResponse(transactionResponse["error"], 400));
  }

  publishJournal("payment");

  let config = {
    method: "post",
    url: `${API_URL}/api/Recharge`,
    headers: {
      "Content-Type": "application/json",
    },
    data: requestData,
  };
  customLog(req?.LogTraceId, "info", { message: "Calling recharge API", config }, "VENDOR");
  // const sessionId=req.headers.sessionid
  // const token= req.headers.authorization
  // const id= req.user.id
  // const dummyConfig={
  //   method: "POST",
  //   url: `https://api-gateway-4rt7hbmkfq-el.a.run.app/api/v1/corporate/${id}/payment/bbps/proxy-api`,
  //   headers: { "sessionid":sessionId,"Authorization":token },
  //   data: config,
  // }
  // const response=await axios(dummyConfig)
  // const result={data:response.data.data.response}
  let result = await axios(config);
  customLog(req?.LogTraceId, "info", { message: "Response from recharge API", url: config.url, result: result?.data }, "VENDOR");

  let updateDetails = {};
  if (result.hasOwnProperty("data") && result.data.hasOwnProperty("Status") && result.data.Status == "0") {
    updateDetails = {
      corporateTxnId,
      providerId: result.data.TransactionReference ? result.data.TransactionReference : "Not Available",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify({
        billDetails: result.data,
      }),
    };
    await updateWalletTransaction(updateDetails);
  } else if (
    (result.hasOwnProperty("data") && result.data.hasOwnProperty("Status") && result.data.Status == "1") ||
    result.data.Status == "3"
  ) {
    updateDetails = {
      corporateTxnId,
      providerId: result.data.TransactionReference ? result.data.TransactionReference : "Not Available",
      status: "PROCESSING",
      message: result.data.Message,
      orderResponse: JSON.stringify({
        billDetails: result.data,
      }),
    };
    await updateWalletTransaction(updateDetails);
  } else if (!result?.data || !result.data.hasOwnProperty("Status")) {
    // Blank or malformed response — treat as inprocess per JRI SRS recommendation
    customLog(req?.LogTraceId, "info", { message: "Blank or unexpected response from recharge API, treating as PROCESSING", result: result?.data }, "VENDOR");
    updateDetails = {
      corporateTxnId,
      providerId: "Not Available",
      status: "PROCESSING",
      message: "Unclear response from vendor",
      orderResponse: JSON.stringify({ billDetails: result?.data ?? {} }),
    };
    await updateWalletTransaction(updateDetails);
  } else {
    // Confirmed failure — Status "2"
    updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: result.data.TransactionReference,
      message: result.data.Message,
      registeredById: req.user.registeredBy,
      orderResponse: JSON.stringify({
        billDetails: result.data,
      }),
    };
    if (req.body.hasOwnProperty("paymentGatewayResponse")) {
      let refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse);
      if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
        await refundWalletTransaction(updateDetails);
        publishJournal("refund");
      }
    } else {
      await refundWalletTransaction(updateDetails);
      publishJournal("refund");
    }
  }

  const totalAmount = numericAmount + numericSurcharge;
  
  const paymentDetails = {
    transactionId: transactionId,
    account: account,
    amount: totalAmount, 
  };
  
  // Additional debug logging
  customLog(req?.LogTraceId, "info", { 
    message: "Payment details calculation", 
    numericAmount, 
    numericSurcharge, 
    totalAmount,
    paymentDetailsAmount: paymentDetails.amount 
  });
  const formattedServiceProvider =
    serviceProvider.toLowerCase() === "bsnl" ? "BSNL" : serviceProvider.charAt(0).toUpperCase() + serviceProvider.slice(1).toLowerCase();
  if (updateDetails.message == "Payment Successful") {
    // Create a payment details object with the relevant details
    transactionResponse.datetime = new Date();
    transactionResponse.amount = amount;
    const to = emailId;
    const subject = "Recharge Successful";
    const loginUrl = `${frontendBaseUrl}/auth/login`;
    customLog(req?.LogTraceId, "info", { message: "Generate Email", data: { paymentDetails } });
    const resolvedRechargeSuccess1 = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_SUCCESS,
      service: EMAIL_TEMPLATE_SERVICES.BILL_PAYMENT,
      variables: {
        serviceType: "Recharge",
        name,
        branding: partnerData?.branding || 'Peko',
        website: partnerData?.website || 'https://www.peko.one',
        loginUrl,
        ...v2LayoutVariables(partnerData),
      },
      fallback: () => generateMobilePaymentSuccessEmailBill("Recharge", name, partnerData, loginUrl),
      fallbackSubject: subject,
      partnerId: req.user.registeredBy || null,
      logTraceId: req?.LogTraceId,
    });

    const planDetails = [{
      name: formattedServiceProvider ? `${formattedServiceProvider} Mobile Recharge` : "Mobile Recharge Service",
      amount: numericAmount,
      quantity: 1,
    }];
    const invoiceAttachments = await generateOrderInvoiceAttachments({
      amount: numericAmount,
      surcharge: numericSurcharge,
      couponDiscount: transactionResponse?.couponDiscount || 0,
      corporateTxnId,
      orderId: transactionResponse?.orderId,
      paymentType: "Mobile Recharge",
      credentialId: req.user.id,
      vendor: serviceDetails?.vendor,
      commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
      planDetails,
      commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
      traceId: req?.LogTraceId,
    });
    //Call email function to send email with payment details in the body
    emailer.emailWithMultipleAttachment(to, resolvedRechargeSuccess1.subject, resolvedRechargeSuccess1.html, invoiceAttachments, undefined, function () {});
    // Send push notification with payment details
    const notificationData = {
      notificationTitle: "Payment Successful",
      notificationBrief: `Recharge of ₹ ${formatNumberWithLocalString(
        paymentDetails.amount
      )} for ${formattedServiceProvider} number with transaction ID ${corporateTxnId} was successful.`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
    };
    createNotification(notificationData);
    if (req.body.hasOwnProperty("paymentGatewayResponse")) {
      const encodedQueryParams = queryStringIntoBase64("success", corporateTxnId);
      res.redirect(`${req.body.pageAddress}?${encodedQueryParams}`);
    } else {
      return res.status(200).json({
        status: true,
        data: {
          ...result.data,
          ...transactionResponse,
          corporateTxnId,
          serviceProvider: type,
        },
        message: "payment successfull!!",
        responseCode: "000",
      });
    }
  } else if (updateDetails.status == "PROCESSING") {
    const notificationData = {
      notificationTitle: "Payment Processing",
      notificationBrief: `Recharge of ${formattedServiceProvider} Mobile for ₹ ${formatNumberWithLocalString(
        paymentDetails.amount
      )} with transaction ID ${corporateTxnId} was pending.`,
      notificationTo: [req.user.username],
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
      },
      message: "Payment is processing",
      responseCode: "001",
    });
  } else {
    const to = emailId; // Set recipient email address
    const subject = "Transaction Failed"; // Set email subject
    let partnerData = await fetchPartnerDetails(req.user.registeredBy);
    const resolvedPrepaidFailed = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_FAILED,
      service: EMAIL_TEMPLATE_SERVICES.BILL_PAYMENT,
      variables: {
        serviceType: type,
        account: paymentDetails.account,
        serviceProvider: transactionCategory,
        name,
        branding: partnerData?.branding || 'Peko',
        website: partnerData?.website || 'https://www.peko.one',
        logo: partnerData?.logo,
        ...v2LayoutVariables(partnerData),
      },
      fallback: () => commonFailedTemplateforBillPayments(type, paymentDetails.account, transactionCategory, name, partnerData),
      fallbackSubject: subject,
      partnerId: req.user.registeredBy || null,
      logTraceId: req?.LogTraceId,
    });
    emailer.email(to, resolvedPrepaidFailed.subject, resolvedPrepaidFailed.html, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
    });
    const notificationData = {
      notificationTitle: "Payment Failed",
      notificationBrief: `Recharge of ${formattedServiceProvider} Mobile for ₹ ${formatNumberWithLocalString(paymentDetails.amount)} with transaction ID ${corporateTxnId} was Failed.`,
      notificationTo: [req.user.username],
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
    if (req.body.hasOwnProperty("paymentGatewayResponse")) {
      const encodedQueryParams = queryStringIntoBase64("failure", corporateTxnId);
      res.redirect(`${req.body.pageAddress}?${encodedQueryParams}`);
    } else {
      return res.status(400).json({
        status: false,
        data: {
          ...result.data,
          ...transactionResponse,
          corporateFinalBalance: walletDetails["balance"],
        },
        message: "Something went wrong",
        responseCode: "001",
      });
    }
  }
});

// push url for pending transactions
exports.updateTransaction = asyncHandler(async (req, res, next) => {
  try {
    let corporateTxnId = req.query.SystemReference;
    const transaction = await getOneTransaction({ transactionId: corporateTxnId });

    if (!transaction) {
      return next(new ErrorResponse("transaction not found", 400));
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
    const name = req.user.name;

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (serviceDetails.hasOwnProperty("error")) {
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }
    const rechargeNumber = transaction.order.accountNo;
    const amount = transaction.order.baseAmount;
    const transactionReference = transaction.providerId;
    const securityKey = serviceDetails.vendor.optional4;

    const concatenatedString = rechargeNumber + amount + transactionReference + securityKey;
    const checkSum = crypto.createHash("sha256").update(concatenatedString).digest("hex");
    // verify checksum
    if (checkSum != req.query.Checksum) {
      return next(new ErrorResponse("Invalid check sum", 500));
    }
    let data = req.query;
    let updateDetails = {};
    if (data.hasOwnProperty("Status") && data.Status == "0") {
      updateDetails = {
        corporateTxnId,
        providerId: data.TransactionReference ? data.TransactionReference : "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({
          billDetails: data,
        }),
      };
      await updateWalletTransaction(updateDetails);
    } else {
      const isReversal = data.FailureReason && (
        data.FailureReason.includes("Reversed Transaction") ||
        data.FailureReason.includes("Transaction Reversal Record")
      );
      customLog(req?.LogTraceId, "info", { message: isReversal ? "Reversal push received" : "Failure push received", corporateTxnId, status: data.Status, failureReason: data.FailureReason }, "VENDOR");
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: data.TransactionReference,
        message: isReversal ? "Transaction Reversed" : data.Message,
        registeredById: req.user.registeredBy,
      };
      await refundWalletTransaction(updateDetails);
      publishStoredRefundJournal({ req, transaction, corporateTxnId, credentialId, serviceDetails });
    }

    // sending notification and email to user
    const paymentDetails = {
      transactionId: corporateTxnId,
      account: rechargeNumber,
      amount: Math.round(amount),
    };
    if (updateDetails.message == "Payment Successful") {
      let partnerData;
      partnerData = await fetchPartnerDetails(req.user.registeredBy);
      const to = req.user.email;
      const subject = "Recharge Successful";
      const loginUrl = `${frontendBaseUrl}/auth/login`;
      const resolvedRechargeSuccess2 = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_SUCCESS,
        service: EMAIL_TEMPLATE_SERVICES.BILL_PAYMENT,
        variables: {
          serviceType: "Recharge",
          name,
          branding: partnerData?.branding || 'Peko',
          website: partnerData?.website || 'https://www.peko.one',
          loginUrl,
          ...v2LayoutVariables(partnerData),
        },
        fallback: () => generateMobilePaymentSuccessEmailBill("Recharge", name, partnerData, loginUrl),
        fallbackSubject: subject,
        partnerId: req.user.registeredBy || null,
        logTraceId: req?.LogTraceId,
      });
      emailer.email(to, resolvedRechargeSuccess2.subject, resolvedRechargeSuccess2.html, function () {});
      // Send push notification with payment details
      const providerName = data.Provider
        ? data.Provider.charAt(0).toUpperCase() + data.Provider.slice(1).toLowerCase()
        : "Mobile";
      const notificationData = {
        notificationTitle: "Payment Successful",
        notificationBrief: `Recharge of ${providerName} Mobile for ₹ ${formatNumberWithLocalString(paymentDetails.amount)} with transaction ID ${corporateTxnId} was successful.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
    } else {
      const providerName = data.Provider
        ? data.Provider.charAt(0).toUpperCase() + data.Provider.slice(1).toLowerCase()
        : "Mobile";
      const notificationData = {
        notificationTitle: "Payment Failed",
        notificationBrief: `Recharge of ${providerName} Mobile for ₹ ${formatNumberWithLocalString(paymentDetails.amount)} with transaction ID ${corporateTxnId} was Failed.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      };
      createNotification(notificationData);
    }
    return res.status(200).send("ok");
  } catch (error) {
    return next(new ErrorResponse("Something went wrong while updating the transaction", 500));
  }
});

function generateChecksum(corporateNumber, systemReference, shaSecretKey) {
  const data = corporateNumber + systemReference + shaSecretKey;
  return crypto.createHash("sha256").update(data).digest("hex"); // Lowercase SHA-256 hash
}

exports.rechargeValidation = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
    const systemReferenceNo = new Date().valueOf().toString();
    const amount = typeof req.body.amount === "string" ? req.body.amount : req.body.amount.toString();
    const vendorAmount = await getVendorAmount(amount, accessKey, {
      serviceProvider: req.body.serviceProvider,
      credentialId,
      scope: getQuoteScope(req),
    });
    if (vendorAmount === null) {
      return next(new ErrorResponse("Plan prices have changed. Please reload the plans.", 400));
    }
    // Fetch service details
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });

    if (serviceDetails.hasOwnProperty("error")) {
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }
    // const optionals = serviceDetails.vendor.optionals
    
    const corporateNumber = serviceDetails.vendor.optional3;
    const securityKey = serviceDetails.vendor.optional4;
    let systemReference = systemReferenceNo;
    const optionals = serviceDetails.vendor.optionals;
    const rechargeValidationURL = optionals['VALIDATION_URL'];
    
    // Generate checksum
    let checksum = generateChecksum(corporateNumber, systemReference, securityKey);

    // Prepare API request
    let config = {
      method: "post",
      url: `${rechargeValidationURL}/api/Validation`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        CorporateNumber: corporateNumber,
        SystemReference: systemReference,
        ServiceProvider: req.body.serviceProvider, // Default value if not provided
        MobileDTHNumber: req.body.mobileNo,
        Amount: String(vendorAmount),
        Location: "",
        ServiceType: "M",
        Checksum: checksum.toLowerCase(),
        IsPostPaid: "N",
        AuthKey: undefined,
      },
    };
    customLog(req?.LogTraceId, "info", { message: "Calling recharge validation API", url: config.url, method: config.method, data: config.data }, "VENDOR");

    // Call the API
    let result = await axios(config);
    customLog(req?.LogTraceId, "info", { message: "Response from recharge validation API", url: config.url, result: result?.data }, "VENDOR");

    if (!result.data) {
      return next(new ErrorResponse("Invalid response from vendor", 400));
    }

    // Handle different status codes from API response
    let { Status, StatusCode, ValidationRefNo } = result.data;

    if (StatusCode === "1" || StatusCode === "2" || StatusCode === "3" || StatusCode === "4") {
      const messages = {
        "1": "Error in Validation. Please try again.",
        "2": "Validation Failed.",
      };
      return res.status(500).json({
        status: false,
        data: {},
        message: messages[StatusCode] || "Something went wrong. Please try again.",
        responseCode: "003",
      });
    }

    return res.status(200).json({
      status: true,
      data: result.data,
      validationReference: ValidationRefNo,
      message: Status || "Validation Successful",
      responseCode: "000",
    });
  } catch (error) {
    customLog(
      req?.LogTraceId,
      "error",
      { data: error?.response?.data ?? error?.response, error: error.message, message: "catch from recharge validation" },
      "VENDOR"
    );
    if (error.code === 'ECONNABORTED') {
      return next(new ErrorResponse("Request timeout. Please try again.", 408));
    }
    return next(new ErrorResponse("Internal Server Error", 400));
  }
});

// Poll JRI for the current status of a pending transaction
// Doc: call after 15 min if no push URL response received, then every 30 min
exports.rechargeStatus = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
    const { systemReference } = req.query;

    if (!systemReference) {
      return next(new ErrorResponse("systemReference is required.", 400));
    }

    // Idempotency: if already resolved, return current status without hitting vendor
    const existingTransaction = await getOneTransaction({ transactionId: systemReference });
    if (existingTransaction && ["SUCCESS", "FAILURE", "REFUNDED"].includes(existingTransaction.status)) {
      return res.status(200).json({
        status: existingTransaction.status === "SUCCESS",
        data: { Status: existingTransaction.status },
        message: existingTransaction.remarks || existingTransaction.status,
        responseCode: existingTransaction.status === "SUCCESS" ? "000" : "001",
      });
    }

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });

    if (serviceDetails.hasOwnProperty("error")) {
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }

    const statusApiUrl = serviceDetails.vendor.optionals?.["STATUS_URL"];
    const corporateNumber = serviceDetails.vendor.optional3;

    if (!statusApiUrl) {
      return next(new ErrorResponse("Status API URL not configured.", 500));
    }

    const config = {
      method: "post",
      url: `${statusApiUrl}/api/RechargeStatus`,
      headers: { "Content-Type": "application/json" },
      data: {
        CorporateNumber: corporateNumber,
        SystemReference: systemReference,
      },
    };

    customLog(req?.LogTraceId, "info", { message: "Calling recharge status API", url: config.url, method: config.method, data: config.data }, "VENDOR");
    const result = await axios(config);
    customLog(req?.LogTraceId, "info", { message: "Response from recharge status API", url: config.url, result: result?.data }, "VENDOR");

    if (!result?.data) {
      return next(new ErrorResponse("Invalid response from vendor", 400));
    }

    const { Status, Message, TransactionReference } = result.data;

    // Per JRI SRS Table 3.2:
    // 0 = Successful, 1/4/5 = Inprocess, 2 = Unsuccessful, 6 = Inprocess/Unsuccessful
    if (Status === "0") {
      // Fetch transaction to get account/amount for email & notification
      const transaction = await getOneTransaction({ transactionId: systemReference });
      if (!transaction) {
        return next(new ErrorResponse("Transaction not found", 400));
      }

      const updateDetails = {
        corporateTxnId: systemReference,
        providerId: TransactionReference || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify({ billDetails: result.data }),
      };
      await updateWalletTransaction(updateDetails);

      const baseAmount = transaction.order.baseAmount;
      const providerName = result.data.Provider
        ? result.data.Provider.charAt(0).toUpperCase() + result.data.Provider.slice(1).toLowerCase()
        : "Mobile";

      let partnerData;
      req.user.registeredBy
        ? (partnerData = await fetchPartnerDetails(req.user.registeredBy))
        : (partnerData = await partnerLogos());

      const loginUrl = `${frontendBaseUrl}/auth/login`;
      const resolvedRechargeSuccess3 = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_SUCCESS,
        service: EMAIL_TEMPLATE_SERVICES.BILL_PAYMENT,
        variables: {
          serviceType: "Recharge",
          name: req.user.name,
          branding: partnerData?.branding || 'Peko',
          website: partnerData?.website || 'https://www.peko.one',
          loginUrl,
          ...v2LayoutVariables(partnerData),
        },
        fallback: () => generateMobilePaymentSuccessEmailBill("Recharge", req.user.name, partnerData, loginUrl),
        fallbackSubject: "Recharge Successful",
        partnerId: req.user.registeredBy || null,
        logTraceId: req?.LogTraceId,
      });
      emailer.email(req.user.email, resolvedRechargeSuccess3.subject, resolvedRechargeSuccess3.html, function () {});

      createNotification({
        notificationTitle: "Payment Successful",
        notificationBrief: `Recharge of ${providerName} Mobile for ₹ ${formatNumberWithLocalString(baseAmount)} with transaction ID ${systemReference} was successful.`,
        notificationTo: [req.user.username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
      });

      return res.status(200).json({
        status: true,
        data: result.data,
        message: "Recharge Successful",
        responseCode: "000",
      });
    } else if (Status === "2") {
      const transaction = await getOneTransaction({ transactionId: systemReference });
      const updateDetails = {
        corporateTxnId: systemReference,
        status: "FAILURE",
        providerId: TransactionReference || "Not Available",
        message: Message,
        registeredById: req.user.registeredBy,
        orderResponse: JSON.stringify({ billDetails: result.data }),
      };
      await refundWalletTransaction(updateDetails);
      publishStoredRefundJournal({ req, transaction, corporateTxnId: systemReference, credentialId, serviceDetails });

      if (transaction) {
        createNotification({
          notificationTitle: "Payment Failed",
          notificationBrief: `Recharge for ₹ ${formatNumberWithLocalString(transaction.order.baseAmount)} with transaction ID ${systemReference} has failed.`,
          notificationTo: [req.user.username],
          notificationCategory: "CORPORATE",
          notificationBy: "ADMIN",
        });
      }

      return res.status(200).json({
        status: false,
        data: result.data,
        message: Message || "Recharge Failed",
        responseCode: "001",
      });
    }

    // Still inprocess (Status 1, 4, 5, 6)
    return res.status(200).json({
      status: true,
      data: result.data,
      message: Message || "Transaction is still processing",
      responseCode: "000",
    });
  } catch (error) {
    customLog(
      req?.LogTraceId,
      "error",
      { data: error?.response?.data ?? error?.response, error: error.message, message: "catch from recharge status" },
      "VENDOR"
    );
    return next(new ErrorResponse("Internal Server Error", 400));
  }
});

const MOCK_121_PLANS = [
  // ── Recommended Packs ────────────────────────────────────────────────────
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL199", talktime: "NA", amount: "199.00", validity: "28 day",
    plan_description: "Calls : Unlimited | Data : 2GB | SMS : 100/day | Validity : 28 days ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Recommended Packs", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL349", talktime: "NA", amount: "349.00", validity: "28 day",
    plan_description: "Calls : Unlimited | Data : Unlimited 5G + 2GB/day | SMS : 100/day | Validity : 28 days | Added benefit : Apple Music upto 6 Months and Unlimited 5G available. Better choice over Rs. 199, Rs. 219, Rs. 249, Rs. 299, Rs. 319, Rs. 579, Rs. 619 & Rs. 799 pack ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Apple Music : Stream over 100 million songs ad-free, once in lifetime free claim",
    plan_status: "ACTIVE", plan_category_name: "Recommended Packs", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL299", talktime: "NA", amount: "299.00", validity: "28 day",
    plan_description: "Calls : Unlimited | Data : 1.5GB/day | SMS : 100/day | Validity : 28 days | Details : Better choice over Rs. 199, Rs. 219 & Rs. 469 pack ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Recommended Packs", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL489", talktime: "NA", amount: "489.00", validity: "77 day",
    plan_description: "Calls : Unlimited | Data : 6GB | SMS : 600 | Validity : 77 days ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Recommended Packs", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "77 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL219", talktime: "NA", amount: "219.00", validity: "28 day",
    plan_description: "Calls : Unlimited | Data : 3GB | SMS : 300 | Validity : 28 days ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Recommended Packs", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL399", talktime: "NA", amount: "399.00", validity: "28 day",
    plan_description: "Calls : Unlimited | Data : Unlimited 5G + 2.5GB/day | SMS : 100/day | Validity : 28 days | Added Benefit : JioHotstar Mobile Subscription for 28 Days, Unlimited 5G available & Best plan for RC398 customers. Better choice over Rs. 199, Rs. 219, Rs. 299, Rs. 319, Rs. 349, Rs. 379, Rs. 398, Rs. 579, Rs. 619, Rs. 649, Rs. 799, Rs. 859 & Rs. 929 pack ; JioHotstar Mobile for 28 days : Watch Live Sports, Movies, Exclusive Hotstar Specials & more ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Recommended Packs", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL899", talktime: "NA", amount: "899.00", validity: "84 day",
    plan_description: "Calls : Unlimited | Data : Unlimited 5G + 2GB/day | SMS : 100/day | Validity : 84 days | Added benefit : Unlimited 5G available. Best pack to switch from Rs. 859 & Rs. 799 ; Free hellotunes for you : Set any one tune every 30 days for free ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only",
    plan_status: "ACTIVE", plan_category_name: "Recommended Packs", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "84 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL2249", talktime: "NA", amount: "2249.00", validity: "365 day",
    plan_description: "Calls : Unlimited | Data : 30GB | SMS : 3600 | Validity : 365 days ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Recommended Packs", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "365 day",
  },
  // ── Talktime (top up voucher) ─────────────────────────────────────────────
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL10", talktime: "7.47", amount: "10.00", validity: "NA",
    plan_description: "Talktime : Rs 7.47",
    plan_status: "ACTIVE", plan_category_name: "Talktime (top up voucher)", top_plan: "N",
    plan_subcategory: "Talktime", plan_validity: "NA",
  },
  // ── International Roaming ─────────────────────────────────────────────────
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL4999", talktime: "NA", amount: "4999.00", validity: "365 day",
    plan_description: "Details : Benefits abroad - 7GB, 100mins IC+OG (IN+Local), 200 outgoing SMS & Free incoming SMS abroad; Benefits in India - 2.5GB/day, unlimited calls & 100SMS/day | Revised price for Rs. 4000 pack; Rs. 4999 pack is a better choice than Rs. 118 (revised price for Rs. 98) pack for long stays abroad. | Know more, www.airtel.in/IR ; Unlimited 5G Data in India : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only",
    plan_status: "ACTIVE", plan_category_name: "International Roaming", top_plan: "N",
    plan_subcategory: "International Roaming", plan_validity: "365 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL1198", talktime: "NA", amount: "1198.00", validity: "10 day",
    plan_description: "Details : 6GB, 200mins IC+OG (IN+Local), 20 SMS (USA, Europe, Gulf, Asia, Africa & more) | Get 2X data with this pack. Limited time offer. | Revised price for Rs. 1098 pack; Extra Data and IR Validity than Rs. 898 (revised price for Rs. 798) pack | Know more, www.airtel.in/IR",
    plan_status: "ACTIVE", plan_category_name: "International Roaming", top_plan: "N",
    plan_subcategory: "International Roaming", plan_validity: "10 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL898", talktime: "NA", amount: "898.00", validity: "5 day",
    plan_description: "Details : 4GB, 150mins IC+OG (IN+Local), 20 SMS (USA, Europe, Gulf, Asia, Africa & more) | Get 2X data with this pack. Limited time offer. | Revised price for Rs. 798 pack | Know more, www.airtel.in/IR",
    plan_status: "ACTIVE", plan_category_name: "International Roaming", top_plan: "N",
    plan_subcategory: "International Roaming", plan_validity: "5 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL2998", talktime: "NA", amount: "2998.00", validity: "30 day",
    plan_description: "Details : 10GB, 300mins IC+OG (IN+Local), 20 SMS (USA, Europe, Gulf, Asia, Africa & more) | Know more, www.airtel.in/IR ",
    plan_status: "ACTIVE", plan_category_name: "International Roaming", top_plan: "N",
    plan_subcategory: "International Roaming", plan_validity: "30 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL698", talktime: "NA", amount: "698.00", validity: "1 Day",
    plan_description: "Details : 1GB, 100mins IC+OG (IN+Local), 10 SMS (USA, Europe, Gulf, Asia, Africa & more) | Revised price for Rs. 648 pack | Know more, www.airtel.in/IR ",
    plan_status: "ACTIVE", plan_category_name: "International Roaming", top_plan: "N",
    plan_subcategory: "International Roaming", plan_validity: "1 Day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL699", talktime: "NA", amount: "699.00", validity: "NA",
    plan_description: "Details : 2GB (USA, Europe, Gulf, Asia, Africa & more) | Know more, www.airtel.in/IR",
    plan_status: "ACTIVE", plan_category_name: "International Roaming", top_plan: "N",
    plan_subcategory: "International Roaming", plan_validity: "NA",
  },
  // ── Inflight Roaming packs ────────────────────────────────────────────────
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL595", talktime: "NA", amount: "595.00", validity: "1 Day",
    plan_description: "Details : In-Flight - 1 GB, 100mins OG, No incoming calls, 100 SMS (selected Intl flights) | For covered flights, visit www.airtel.in/IR",
    plan_status: "ACTIVE", plan_category_name: "Inflight Roaming packs", top_plan: "N",
    plan_subcategory: "Inflight Roaming packs", plan_validity: "1 Day",
  },
  // ── Unlimited Cricket ─────────────────────────────────────────────────────
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL399", talktime: "NA", amount: "399.00", validity: "28 day",
    plan_description: "Calls : Unlimited | Data : Unlimited 5G + 2.5GB/day | SMS : 100/day | Validity : 28 days | Added Benefit : JioHotstar Mobile Subscription for 28 Days, Unlimited 5G available & Best plan for RC398 customers. Better choice over Rs. 199, Rs. 219, Rs. 299, Rs. 319, Rs. 349, Rs. 379, Rs. 398, Rs. 579, Rs. 619, Rs. 649, Rs. 799, Rs. 859 & Rs. 929 pack ; JioHotstar Mobile for 28 days : Watch Live Sports, Movies, Exclusive Hotstar Specials & more ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Unlimited Cricket", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL449", talktime: "NA", amount: "449.00", validity: "28 day",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 4 GB/day | SMS : 100/day | Details : Google One Cloud Storage of 30GB for 28 Days. JioHotstar mobile subscription for 28 days. Airtel Xstream Play Premium for 28 days. Free Apple Music for up to 6 months. UNLIMITED 5G data (over & above plan limit). | Details: Best upgrade pack for Rs. 299 , Rs. 349 , Rs. 379 , Rs. 409 , & Rs. 429 packs. ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; JioHotstar Mobile for 28 days : Watch Live Sports, Movies, Exclusive Hotstar Specials & more ; Google One : Get 30 GB cloud storage till your pack validity. ; SonyLIV + 20 OTTs as part of Airtel Xstream Play Subscription : Enjoy 28 days full access to 20+ OTTs such as Sony LIV, Lionsgate Play, Aha, Chaupal, SunNxt and more on Airtel Xstream Play Premium. ; Apple Music : Stream over 100 million songs ad-free, once in lifetime free claim ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Unlimited Cricket", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL1029", talktime: "NA", amount: "1029.00", validity: "84 day",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 2GB/day | SMS : 100/Day | Details : JioHotstar Mobile subscription for 3 months, UNLIMITED 5G data (over & above plan limit), Best Upgrade Pack for Rs. 929 & Rs. 979 packs ; JioHotstar Mobile for 3 months : Subscription worth Rs 149. Watch Live Sports, Movies, Exclusive Hotstar Specials & more ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Unlimited Cricket", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "84 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL598", talktime: "NA", amount: "598.00", validity: "28 day",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 2GB/day | SMS : 100 SMS/day | Details : JioHotstar subscription for 1 month, Netflix Basic, Zee5 & Airtel Xstream Play for 28 days, UNLIMITED 5G data (over & above plan limit) ; Netflix Basic : Included in your Airtel entertainment recharge of 598 ; JioHotstar Super : Included in your Airtel entertainment recharge of 598 ; ZEE5 Premium : Included in your Airtel entertainment recharge of 598 ; Xstream Play Premium : Included in your Airtel entertainment recharge of 598 ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Unlimited Cricket", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL1729", talktime: "NA", amount: "1729.00", validity: "84 day",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 2GB/day | SMS : 100 SMS/day | Details : JioHotstar subscription for 3 months, Netflix Basic, Zee5 & Airtel Xstream Play for 84 days, UNLIMITED 5G data (over & above plan limit) ; Netflix Basic : Included in your Airtel entertainment recharge of 1729 ; JioHotstar Super : Included in your Airtel entertainment recharge of 1729 ; ZEE5 Premium : Included in your Airtel entertainment recharge of 1729 ; Xstream Play Premium : Included in your Airtel entertainment recharge of 1729 ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Unlimited Cricket", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "84 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL3999", talktime: "NA", amount: "3999.00", validity: "365 day",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 2.5GB/day | SMS : 100SMS/day | Details : JioHotstar Mobile subscription for 3 months, UNLIMITED 5G data (over & above plan limit), Best Upgrade Packs for Rs. 1849 , Rs. 2249 & Rs. 3599 packs ; JioHotstar Mobile for 3 months : Subscription worth Rs 499. Watch Live Sports, Movies, Exclusive Hotstar Specials & more ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Unlimited Cricket", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "365 day",
  },
  // ── Truly Unlimited ───────────────────────────────────────────────────────
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL3599", talktime: "NA", amount: "3599.00", validity: "365 day",
    plan_description: "Calls : Unlimited local STD & Roaming | Data : Unlimited 5G + 2GB/day | SMS : 100SMS/day | Details : UNLIMITED 5G data (over & above plan limit), Revised price for Rs 2999 pack, Best Upgrade Pack for Rs. 1849 & Rs. 2249 packs ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "365 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL3999", talktime: "NA", amount: "3999.00", validity: "365 day",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 2.5GB/day | SMS : 100SMS/day | Details : JioHotstar Mobile subscription for 3 months, UNLIMITED 5G data (over & above plan limit), Best Upgrade Packs for Rs. 1849 , Rs. 2249 & Rs. 3599 packs ; JioHotstar Mobile for 3 months : Subscription worth Rs 499. Watch Live Sports, Movies, Exclusive Hotstar Specials & more ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "365 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL1199", talktime: "NA", amount: "1199.00", validity: "84 day",
    plan_description: "Calls : Unlimited Local, STD & Roaming | Data : Unlimited 5G + 2.5GB/day | SMS : 100 per day | Details : Amazon Prime Lite 84 days, Airtel Xstream play for 84 days, UNLIMITED 5G data (over & above plan limit) ; Amazon Prime Lite : Enjoy Prime Video and Free 1 day delivery for 84 days included with your plan ; SonyLIV + 20 OTTs as part of Airtel Xstream Play Subscription : Enjoy 84 days full access to 20+ OTTs such as Sony LIV, Lionsgate Play, Aha, Chaupal, SunNxt and more on Airtel Xstream Play Premium. ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "84 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL979", talktime: "NA", amount: "979.00", validity: "84 day",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 2GB/day | SMS : 100/Day | Details : Airtel Xstream Play subscription for 84 days, UNLIMITED 5G data (over & above plan limit), Revised price for Rs 839 pack, Best Upgrade Pack for Rs. 548 , Rs. 799 , Rs. 859 & Rs. 929 packs ; SonyLIV + 20 OTTs as part of Airtel Xstream Play Subscription : Enjoy 84 days full access to 20+ OTTs such as Sony LIV, Lionsgate Play, Aha, Chaupal, SunNxt and more on Airtel Xstream Play Premium. ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "84 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL838", talktime: "NA", amount: "838.00", validity: "56 day",
    plan_description: "Calls : Unlimited local STD & Roaming | Data : Unlimited 5G + 3GB/day | SMS : 100/Day | Details : 56 days Amazon Prime Lite subscription, Airtel Xstream Play subscription for 56 days, UNLIMITED 5G data (over & above plan limit) ; Amazon Prime Lite : Enjoy Prime Video and Free 1 day delivery for 56 days included with your plan ; SonyLIV + 20 OTTs as part of Airtel Xstream Play Subscription : Enjoy 56 days full access to 20+ OTTs such as Sony LIV, Lionsgate Play, Aha, Chaupal, SunNxt and more on Airtel Xstream Play Premium. ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "56 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL649", talktime: "NA", amount: "649.00", validity: "56 day",
    plan_description: "Calls : Unlimited | Data : Unlimited 5G + 2GB/day | SMS : 100/day | Validity : 56 days | Details : Unlimited 5G available ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "56 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL619", talktime: "NA", amount: "619.00", validity: "60 day",
    plan_description: "Calls : Unlimited local STD & Roaming | Data : 1.5GB/Day | SMS : 100/Day ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "60 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL579", talktime: "NA", amount: "579.00", validity: "56 day",
    plan_description: "Calls : Unlimited local STD & Roaming | Data : 1.5GB/Day | SMS : 100/Day ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "56 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL449", talktime: "NA", amount: "449.00", validity: "28 day",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 4 GB/day | SMS : 100/day | Details : Google One Cloud Storage of 30GB for 28 Days. JioHotstar mobile subscription for 28 days. Airtel Xstream Play Premium for 28 days. Free Apple Music for up to 6 months. UNLIMITED 5G data (over & above plan limit). | Details: Best upgrade pack for Rs. 299 , Rs. 349 , Rs. 379 , Rs. 409 , & Rs. 429 packs. ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; JioHotstar Mobile for 28 days : Watch Live Sports, Movies, Exclusive Hotstar Specials & more ; Google One : Get 30 GB cloud storage till your pack validity. ; SonyLIV + 20 OTTs as part of Airtel Xstream Play Subscription : Enjoy 28 days full access to 20+ OTTs such as Sony LIV, Lionsgate Play, Aha, Chaupal, SunNxt and more on Airtel Xstream Play Premium. ; Apple Music : Stream over 100 million songs ad-free, once in lifetime free claim ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL429", talktime: "5", amount: "429.00", validity: "1 MONTH",
    plan_description: "Calls : Unlimited local STD & Roaming | Data : Unlimited 5G + 2.5GB/day | SMS : 100/Day | Talktime : Rs 5 | Details : UNLIMITED 5G data (over & above plan limit), Revised price for Rs 359 pack; Rs. 429 pack is the better choice over Rs. 349, Rs. 379, Rs. 398, Rs. 409 in our unlimited 5G packs (UL) ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "1 MONTH",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL379", talktime: "NA", amount: "379.00", validity: "1 Month",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 2 GB/day | SMS : 100/day | Details : Google One Cloud Storage of 30GB for 1 month. Free Apple Music for up to 6 months. UNLIMITED 5G data (over & above plan limit) ; Google One : Get 30 GB cloud storage till your pack validity. ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Apple Music : Stream over 100 million songs ad-free, once in lifetime free claim ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "1 Month",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL349", talktime: "NA", amount: "349.00", validity: "28 day",
    plan_description: "Calls : Unlimited | Data : Unlimited 5G + 2GB/day | SMS : 100/day | Validity : 28 days | Added benefit : Apple Music upto 6 Months and Unlimited 5G available. Better choice over Rs. 199, Rs. 219, Rs. 249, Rs. 299, Rs. 319, Rs. 579, Rs. 619 & Rs. 799 pack ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Apple Music : Stream over 100 million songs ad-free, once in lifetime free claim",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL355", talktime: "5", amount: "355.00", validity: "30 day",
    plan_description: "Calls : Unlimited local STD & Roaming | Data : 25GB | SMS : 300 | Talktime : Rs. 5 ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "30 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL299", talktime: "NA", amount: "299.00", validity: "28 day",
    plan_description: "Calls : Unlimited | Data : 1.5GB/day | SMS : 100/day | Validity : 28 days | Details : Better choice over Rs. 199, Rs. 219 & Rs. 469 pack ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL199", talktime: "NA", amount: "199.00", validity: "28 day",
    plan_description: "Calls : Unlimited | Data : 2GB | SMS : 100/day | Validity : 28 days ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL219", talktime: "NA", amount: "219.00", validity: "28 day",
    plan_description: "Calls : Unlimited | Data : 3GB | SMS : 300 | Validity : 28 days ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL2249", talktime: "NA", amount: "2249.00", validity: "365 day",
    plan_description: "Calls : Unlimited | Data : 30GB | SMS : 3600 | Validity : 365 days ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "365 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL1798", talktime: "NA", amount: "1798.00", validity: "84 day",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 3GB/day | SMS : 100/Day | Details : Netflix Basic subscription for 84 days, UNLIMITED 5G data (over & above plan limit), Revised price for Rs 1499 pack ; Netflix Basic : All device access, Unlimited entertainment ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "84 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL1729", talktime: "NA", amount: "1729.00", validity: "84 day",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 2GB/day | SMS : 100 SMS/day | Details : JioHotstar subscription for 3 months, Netflix Basic, Zee5 & Airtel Xstream Play for 84 days, UNLIMITED 5G data (over & above plan limit) ; Netflix Basic : Included in your Airtel entertainment recharge of 1729 ; JioHotstar Super : Included in your Airtel entertainment recharge of 1729 ; ZEE5 Premium : Included in your Airtel entertainment recharge of 1729 ; Xstream Play Premium : Included in your Airtel entertainment recharge of 1729 ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "84 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL1029", talktime: "NA", amount: "1029.00", validity: "84 day",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 2GB/day | SMS : 100/Day | Details : JioHotstar Mobile subscription for 3 months, UNLIMITED 5G data (over & above plan limit), Best Upgrade Pack for Rs. 929 & Rs. 979 packs ; JioHotstar Mobile for 3 months : Subscription worth Rs 149. Watch Live Sports, Movies, Exclusive Hotstar Specials & more ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "84 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL899", talktime: "NA", amount: "899.00", validity: "84 day",
    plan_description: "Calls : Unlimited | Data : Unlimited 5G + 2GB/day | SMS : 100/day | Validity : 84 days | Added benefit : Unlimited 5G available. Best pack to switch from Rs. 859 & Rs. 799 ; Free hellotunes for you : Set any one tune every 30 days for free ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "84 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL609", talktime: "NA", amount: "609.00", validity: "1 month",
    plan_description: "Calls : Unlimited local STD & Roaming | Data : 60GB | SMS : 300 | Details: Revised price for Rs 509 pack ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "1 month",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL598", talktime: "NA", amount: "598.00", validity: "28 day",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 2GB/day | SMS : 100 SMS/day | Details : JioHotstar subscription for 1 month, Netflix Basic, Zee5 & Airtel Xstream Play for 28 days, UNLIMITED 5G data (over & above plan limit) ; Netflix Basic : Included in your Airtel entertainment recharge of 598 ; JioHotstar Super : Included in your Airtel entertainment recharge of 598 ; ZEE5 Premium : Included in your Airtel entertainment recharge of 598 ; Xstream Play Premium : Included in your Airtel entertainment recharge of 598 ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL589", talktime: "NA", amount: "589.00", validity: "30 day",
    plan_description: "Calls : Unlimited local STD & Roaming | Data : 50GB | SMS : 300 | Details: Revised price for Rs 489 pack ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "30 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL548", talktime: "NA", amount: "548.00", validity: "84 day",
    plan_description: "Calls : Unlimited local STD & Roaming | Data : 7 GB | SMS : 900 ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "84 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL489", talktime: "NA", amount: "489.00", validity: "77 day",
    plan_description: "Calls : Unlimited | Data : 6GB | SMS : 600 | Validity : 77 days ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "77 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL409", talktime: "5", amount: "409.00", validity: "28 day",
    plan_description: "Calls : Unlimited local STD & Roaming | Data : Unlimited 5G + 2.5GB/day | SMS : 100/Day | Talktime : Rs 5 | Details : Airtel Xstream Play subscription for 28 days, UNLIMITED 5G data (over & above plan limit); Rs. 409 pack is the better choice over Rs. 349, Rs. 379, Rs. 398 in our unlimited 5G packs (UL) ; SonyLIV + 20 OTTs as part of Airtel Xstream Play Subscription : Enjoy 28 days full access to 20+ OTTs such as Sony LIV, Lionsgate Play, Aha, Chaupal, SunNxt and more on Airtel Xstream Play Premium. ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL399", talktime: "NA", amount: "399.00", validity: "28 day",
    plan_description: "Calls : Unlimited | Data : Unlimited 5G + 2.5GB/day | SMS : 100/day | Validity : 28 days | Added Benefit : JioHotstar Mobile Subscription for 28 Days, Unlimited 5G available & Best plan for RC398 customers. Better choice over Rs. 199, Rs. 219, Rs. 299, Rs. 319, Rs. 349, Rs. 379, Rs. 398, Rs. 579, Rs. 619, Rs. 649, Rs. 799, Rs. 859 & Rs. 929 pack ; JioHotstar Mobile for 28 days : Watch Live Sports, Movies, Exclusive Hotstar Specials & more ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "28 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL319", talktime: "NA", amount: "319.00", validity: "1 Month",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : 1.5 GB/day | SMS : 100/day | Details : Google One Cloud Storage of 30GB for 1 month. Free Apple Music for up to 6 months. ; Google One : Get 30 GB cloud storage till your pack validity. ; Apple Music : Stream over 100 million songs ad-free, once in lifetime free claim ; Adobe Express Premium : 12 Months free benefit worth 4k ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Truly Unlimited", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "1 Month",
  },
  // ── Plan Vouchers ─────────────────────────────────────────────────────────
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL3599", talktime: "NA", amount: "3599.00", validity: "365 day",
    plan_description: "Calls : Unlimited local STD & Roaming | Data : Unlimited 5G + 2GB/day | SMS : 100SMS/day | Details : UNLIMITED 5G data (over & above plan limit), Revised price for Rs 2999 pack, Best Upgrade Pack for Rs. 1849 & Rs. 2249 packs ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free ; Airtel Xstream Play (Free content) : Access to free content movies, shows & LIVE TV channels.(OTTs included -SonyLiv (Free version), Amazon mx player, Chana jor, Runn tv) ",
    plan_status: "ACTIVE", plan_category_name: "Plan Vouchers", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "365 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL3999", talktime: "NA", amount: "3999.00", validity: "365 day",
    plan_description: "Calls : Unlimited local, STD & Roaming | Data : Unlimited 5G + 2.5GB/day | SMS : 100SMS/day | Details : JioHotstar Mobile subscription for 3 months, UNLIMITED 5G data (over & above plan limit), Best Upgrade Packs for Rs. 1849 , Rs. 2249 & Rs. 3599 packs ; JioHotstar Mobile for 3 months : Subscription worth Rs 499. Watch Live Sports, Movies, Exclusive Hotstar Specials & more ; Unlimited 5G Data : Unlimited 5G Data is over and above your plan limit and can be used in 5G Network areas only ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Plan Vouchers", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "365 day",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL609", talktime: "NA", amount: "609.00", validity: "1 month",
    plan_description: "Calls : Unlimited local STD & Roaming | Data : 60GB | SMS : 300 | Details: Revised price for Rs 509 pack ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Plan Vouchers", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "1 month",
  },
  {
    objectid: "plan", billerid: "AIRTELPRE", biller_category: "Mobile Prepaid", biller_name: "Airtel Prepaid",
    planid: "BDATL589", talktime: "NA", amount: "589.00", validity: "30 day",
    plan_description: "Calls : Unlimited local STD & Roaming | Data : 50GB | SMS : 300 | Details: Revised price for Rs 489 pack ; Adobe Express Premium : 12 Months free benefit worth 4k ; The Safe Network : Get fraud link blocking and real-time alerts on SPAM calls, SMS & suspicious bank OTPs ; Free hellotunes for you : Set any one tune every 30 days for free",
    plan_status: "ACTIVE", plan_category_name: "Plan Vouchers", top_plan: "N",
    plan_subcategory: "Unlimited Packs", plan_validity: "30 day",
  },
];
