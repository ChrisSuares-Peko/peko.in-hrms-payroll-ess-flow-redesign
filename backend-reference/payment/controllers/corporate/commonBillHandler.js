const { fetchServiceDetails, calculateSurchargeWithTax } = require("../../utils/checkAndFetchServiceDetails");
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require("../../utils/walletTransaction");
const { createPGTransaction } = require("../../utils/pamentGatewayTransaction");
const { fetchBillFromApi, paymentApi, billValidationApi, getBillerByBillerID } = require("./bbps");
const { refundGatewayTransaction } = require("./pluralGateway");
const { customLog } = require("../../utils/loggerHelper");
const ErrorResponse = require("../../utils/error-response");
const { findRecordByBillerId } = require("../../models/use-cases/billerMDM");
const { create: createBillFetchLog } = require("../../models/use-cases/billFetchLog");
const wallet = require("../../models/entities/wallet");
const emailer = require("../../utils/emailer");
const { generateMobilePaymentSuccessEmailBill, commonFailedTemplateforBillPayments } = require("../../utils/emailTemplate/billpayments");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
const { createNotification } = require("../../models/use-cases/notification");
const { formatNumberWithLocalString } = require("../../utils/formatter");
const { checkBillAvenueBalance, decrementBillAvenueBalance, notifyBillAvenueLowBalance } = require("../../utils/billAvenueWallet");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { assertBbpsChannelAmount, resolveInitChannel } = require("../../utils/billPayments_utils");
const asyncHandler = require("../../middlewares/async");

const frontendBaseUrl = process.env.NODE_ENV === "production" ? process.env.PRODUCTION_URL : process.env.FRONTEND_STAGING_URL;

const sanitizeName = (name = "") => {
  return name.replace(/[^a-zA-Z\s]/g, "").trim();
};

const CUSTOMER_PARAM_ERROR_CODES = ['BFR002'];

const CREDIT_CARD_ACCESS_KEY = 'REDACTED';

const CARD_DETAILS_ERROR_MESSAGE = "Please check the card details entered.";

const isCardCustomerParamError = (result, accessKey) =>
  accessKey === CREDIT_CARD_ACCESS_KEY &&
  CUSTOMER_PARAM_ERROR_CODES.includes(result?.data?.errorInfo?.error?.errorCode);

// Strip keys with empty/null/undefined values from billerResponse.
// BillAvenue rejects payloads where billerResponse only has empty fields (e.g. { complianceReason: "" }).
function filterBillerResponse(br) {
  if (!br || typeof br !== 'object') return null;
  const filtered = Object.fromEntries(
    Object.entries(br).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  return Object.keys(filtered).length > 0 ? filtered : null;
}

function calculateCCF1(billerData, txnAmountRupees) {
  const ccf1Info = billerData?.interchangeFeeCCF1;
  if (!ccf1Info) return null;
  const txnAmountPaisa = Math.round(parseFloat(txnAmountRupees) * 100);
  const flatFee    = parseFloat(ccf1Info.flatFee    ?? 0);
  const percentFee = parseFloat(ccf1Info.percentFee ?? 0);
  const feeMinAmt  = parseFloat(ccf1Info.feeMinAmt  ?? 0);
  const feeMaxAmt  = parseFloat(ccf1Info.feeMaxAmt  ?? Infinity);
  const calculated = flatFee + (txnAmountPaisa * percentFee / 100);
  if (calculated <= 0) return null;
  const withGST = Math.floor(calculated * 1.18);
  return String(Math.min(Math.max(withGST, feeMinAmt), feeMaxAmt));
}

const normalizeCustomerMobile = (mobile) => {
  let digits = String(mobile || "").replace(/\D/g, "");

  while (digits.length > 10) {
    if (digits.startsWith("91")) {
      digits = digits.slice(2);
      continue;
    }
    if (digits.startsWith("0")) {
      digits = digits.slice(1);
      continue;
    }
    break;
  }

  return /^\d{10}$/.test(digits) ? digits : "";
};

const coerceBooleanToken = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const candidate =
      value.value ??
      value["#text"] ??
      value._text ??
      value.text ??
      value.isAdhoc ??
      value.billerAdhoc;
    if (candidate !== undefined) return coerceBooleanToken(candidate);
  }
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/^["']+|["']+$/g, "").toLowerCase();
  if (["true", "t", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "f", "no", "n", "0"].includes(normalized)) return false;
  return null;
};

const resolveBillerAdhocFlag = (mdmValue) => {
  const fromMdm = coerceBooleanToken(mdmValue);
  if (fromMdm !== null) return fromMdm ? "true" : "false";
  return "false";
};

exports.commonBillHandler = (accessKey, transactionCategory, type) => ({
  handleFetch: asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      customLog(req?.LogTraceId, 'error', {
        action: 'handleFetch:serviceUnavailable',
        accessKey,
        credentialId,
        corporateUserId,
        packageId,
        reason: serviceDetails.error,
      });
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }

    const billerRecord = await findRecordByBillerId(req.body.billerId);
    if (!billerRecord || billerRecord.status !== 'active') {
      customLog(req?.LogTraceId, 'error', { action: 'handleFetch:billerCheck', billerId: req.body.billerId, status: billerRecord?.status });
      return next(new ErrorResponse("This biller is currently unavailable. Please try again later.", 400));
    }

    if (billerRecord?.data?.billerFetchRequiremet === 'NOT_SUPPORTED') {
      customLog(req?.LogTraceId, 'info', { action: 'handleFetch:notSupported', billerId: req.body.billerId });
      return res.status(200).json({ status: true, data: { fetchNotSupported: true }, message: "Bill fetch is not supported for this biller.", responseCode: "000" });
    }

    const optionals = serviceDetails.vendor.optionals || {};
    const agentIpAddress = optionals['ipaddress'] || "192.168.2.183";
    const agentMacAddress = optionals['macaddress'] || "01-23-45-67-89-ab";
    const customerMobile = normalizeCustomerMobile(req.user.mobileNo || req.user.mobile);
    if (!customerMobile) {
      return next(new ErrorResponse("Valid customer mobile number is required", 400));
    }

    const fetchBillRequestBody = {
      agentId: serviceDetails.vendor.optional5,
      agentDeviceInfo: {
        initChannel: accessKey === 'bbps_telecom_otme' ? "AGT" : (serviceDetails.vendor.optional6 || "INT"),
        ip: agentIpAddress,
        mac: agentMacAddress,
      },
      customerInfo: {
        customerMobile,
        //   customerEmail: "kishor.anand@avenues.info",
        //   customerAdhaar: "548550008000",
        //   customerPan: "AAAPZ1234C",
      },
      billerId: req.body.billerId,
      inputParams: req.body.customerParams,
    };

    // Best-effort audit log of the vendor fetchBill call; never breaks the request flow.
    const recordFetchLog = async (statusCode) => {
      try {
        const saved = await createBillFetchLog({
          credentialId,
          inputParams: req.body.customerParams ?? null,
          statusCode: statusCode ?? null,
        });
        customLog(req?.LogTraceId, 'info', { action: 'billFetchLog:saved', id: saved?.id, credentialId, statusCode: statusCode ?? null });
      } catch (e) {
        customLog(req?.LogTraceId, 'error', { action: 'recordFetchLog:failed', error: e.message });
      }
    };

    try {
      const result = await fetchBillFromApi(serviceDetails.vendor, fetchBillRequestBody, req?.LogTraceId);
      customLog(req?.LogTraceId, "info", { result: result.data, message: "result from  fetchBillFromApi" }, "VENDOR");
      if (!result.status) {
        await recordFetchLog(result.httpStatus);
        if (isCardCustomerParamError(result, accessKey)) {
          customLog(req?.LogTraceId, 'error', {
            action: 'billFetch:cardCustomerParamError',
            accessKey,
            billerId: req.body.billerId,
            errorCode: result?.data?.errorInfo?.error?.errorCode,
            vendorMessage: result?.data?.errorInfo?.error?.errorMessage,
          });
          return next(new ErrorResponse(CARD_DETAILS_ERROR_MESSAGE, 400));
        }
        return next(new ErrorResponse(result.message || "Something went wrong while fetching balance. Please ensure your account is active or contact support if the issue persists.", 400));
      }
      const exactness = billerRecord?.data?.billerPaymentExactness || 'Exact and above';
      let ccf1Amount = null;
      try {
        const billerData = await getBillerByBillerID(req.body.billerId, serviceDetails.vendor, req?.LogTraceId);
        ccf1Amount = calculateCCF1(billerData, result.data?.billerResponse?.billAmount ?? 0);
      } catch (e) {
        customLog(req?.LogTraceId, "error", { message: "Failed to fetch biller MDM data for CCF1", error: e.message });
      }
      const { httpStatus, ...resultResponse } = result;
      await recordFetchLog(httpStatus);
      return res.status(200).json({
        ...resultResponse,
        data: { ...result.data, exactness, ccf1Amount },
        responseCode: "000",
      });
    } catch (error) {
      customLog(req?.LogTraceId, "error", { message: "Catch from handleFetch commonBillHandler", error });
      await recordFetchLog(error?.httpStatus ?? null);
      return next(new ErrorResponse( 'Something went wrong while fetching balance. Please ensure your account is active or contact support if the issue persists.', 500))
    }
  }),

  handleBillValidation: asyncHandler(async (req, res, next) => {
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
      customLog(req?.LogTraceId, 'error', {
        action: 'handleBillValidation:serviceUnavailable',
        accessKey,
        credentialId,
        corporateUserId,
        packageId,
        reason: serviceDetails.error,
      });
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }

    const billerRecord = await findRecordByBillerId(req.body.billerId);
    if (!billerRecord || billerRecord.status !== 'active') {
      customLog(req?.LogTraceId, 'error', { action: 'handleBillValidation:billerCheck', billerId: req.body.billerId, status: billerRecord?.status });
      return next(new ErrorResponse("This biller is currently unavailable. Please try again later.", 400));
    }

    if (billerRecord?.data?.billerSupportBillValidation === 'NOT_SUPPORTED') {
      customLog(req?.LogTraceId, 'info', { action: 'handleBillValidation:notSupported', billerId: req.body.billerId });
      return res.status(200).json({ status: true, data: { validationNotSupported: true }, message: "Bill validation is not supported for this biller.", responseCode: "000" });
    }

    const billValidationRequestBody = {
      agentId: serviceDetails.vendor.optional5,
      billerId: req.body.billerId,
      inputParams: req.body.customerParams || req.body.inputParams,
    };

    try {
      const result = await billValidationApi(serviceDetails.vendor, billValidationRequestBody, req?.LogTraceId);
      if (!result.status) {
        if (isCardCustomerParamError(result, accessKey)) {
          customLog(req?.LogTraceId, 'error', {
            action: 'billValidation:cardCustomerParamError',
            accessKey,
            billerId: req.body.billerId,
            errorCode: result?.data?.errorInfo?.error?.errorCode,
            vendorMessage: result?.data?.errorInfo?.error?.errorMessage,
          });
          return next(new ErrorResponse(CARD_DETAILS_ERROR_MESSAGE, 400));
        }
        return next(new ErrorResponse(result.message || "Something went wrong while fetching balance. Please ensure your account is active or contact support if the issue persists.", 400));
      }

      const exactness = billerRecord?.data?.billerPaymentExactness || 'Exact and above';
      let ccf1Amount = null;
      try {
        const billerData = await getBillerByBillerID(req.body.billerId, serviceDetails.vendor, req?.LogTraceId);
        console.log("🚀 ~ billerData:", billerData)
        ccf1Amount = calculateCCF1(billerData, result.data?.billerResponse?.billAmount ?? 0);
      } catch (e) {
        customLog(req?.LogTraceId, "error", { message: "Failed to fetch biller MDM data for CCF1", error: e.message });
      }
      return res.status(200).json({
        ...result,
        data: { ...result.data, exactness, ccf1Amount },
        responseCode: "000",
      });
    } catch (error) {
      customLog(req?.LogTraceId, "error", { message: "Catch from handleBillValidation commonBillHandler", error });
      return next(new ErrorResponse("Something went wrong while fetching balance. Please ensure your account is active or contact support if the issue persists.", 500));
    }
  }),

  payment: asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId
    const name = req.user.name

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      customLog(req?.LogTraceId, 'error', {
        action: 'payment:serviceUnavailable',
        accessKey,
        credentialId,
        corporateUserId,
        packageId,
        reason: serviceDetails.error,
      });
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }
    const { billerId, customerParams, requestId, amount, billerResponse, billerName, additionalInfo, planDetails, quickPay: reqQuickPay } = req.body;
    const filteredBillerResponse = filterBillerResponse(billerResponse);


    if (billerResponse && typeof billerResponse === 'object' && billerResponse.billAmount !== undefined && billerResponse.billAmount !== null) {
      const reqAmount = Number(amount);
      const normalizeAmt = (val) => Math.round((Number(val) + Number.EPSILON) * 100) / 100;
      const fetchedBillAmount = normalizeAmt(billerResponse.billAmount);
      const enteredAmount = normalizeAmt(reqAmount);
      const billerRecord = await findRecordByBillerId(billerId);
      if (!billerRecord) {
        customLog(req?.LogTraceId, "error", {
          message: "BBPS biller MDM record not found during amount validation",
          accessKey,
          billerId,
        });
        return next(new ErrorResponse("Something went wrong. Please try again later or contact support if the issue persists.", 400));
      }
      // Normalize MDM value to survive whitespace/casing drift from the upstream MDM feed.
      const rawExactness = String(billerRecord?.data?.billerPaymentExactness || '').trim();
      const exactness = (rawExactness || 'any').toLowerCase();

      let isAmountValid = false;
      if (exactness === 'any') {
        isAmountValid = true;
      } else if (exactness === 'exact and above') {
        isAmountValid = enteredAmount >= fetchedBillAmount;
      } else if (exactness === 'exact and below') {
        isAmountValid = enteredAmount <= fetchedBillAmount;
      } else {
        // 'exact' or unrecognized — must match exactly
        isAmountValid = enteredAmount === fetchedBillAmount;
      }

      if (!isAmountValid) {
        customLog(req?.LogTraceId, "error", {
          message: "BBPS billerResponse.billAmount mismatch",
          accessKey,
          exactness,
          amount: reqAmount,
          billAmount: Number(billerResponse.billAmount),
        });
        return next(new ErrorResponse("Amount mismatch", 400));
      }
    }
    let commissionType = serviceDetails.commissionType
    let cashbackType = serviceDetails.cashbackType
    let providerCommission = serviceDetails.providerCommission
    let corporateCashback = serviceDetails.cashback
    let serviceOperatorId = serviceDetails.id

    const account = Array.isArray(req.body?.customerParams?.input)
      ? req.body.customerParams?.input[0]?.paramValue
      : req.body?.customerParams?.input?.paramValue ?? "N/A";
    const payCashback = req.body.payCashback || false
    let providerId = requestId;
    const emailId = req.user.email;

    const isTelecom = accessKey === 'bbps_telecom_otme';
    const initChannel = resolveInitChannel(accessKey, serviceDetails.vendor);

    // Fetch biller MDM data early — needed for fetch/validation support flags, billerAdhoc, and CCF1
    let ccf1Amount = null;
    let billerData = null;
    try {
      billerData = await getBillerByBillerID(billerId, serviceDetails.vendor, req?.LogTraceId);
      customLog(req?.LogTraceId, "info", { message: "biller MDM data", billerId, billerData }, "VENDOR");
      ccf1Amount = calculateCCF1(billerData, amount);
    } catch (e) {
      customLog(req?.LogTraceId, "error", { message: "Failed to fetch biller MDM data", error: e.message });
    }
    const normalizedBillerAdhoc = resolveBillerAdhocFlag(billerData?.billerAdhoc);
    customLog(req?.LogTraceId, "info", { message: "BBPS request normalization", billerId, mdmBillerAdhoc: billerData?.billerAdhoc, resolvedBillerAdhoc: normalizedBillerAdhoc, initChannel }, "VENDOR");

    const channelLimitMessage = await assertBbpsChannelAmount({
      billerData,
      accessKey,
      vendor: serviceDetails.vendor,
      amount,
      ccf1Amount,
      billerId,
      logTraceId: req?.LogTraceId,
    });
    if (channelLimitMessage) {
      return next(new ErrorResponse(channelLimitMessage, 400));
    }

    const fetchNotSupported = billerData?.billerFetchRequiremet === 'NOT_SUPPORTED';
    const validationNotSupported = billerData?.billerSupportBillValidation === 'NOT_SUPPORTED';
    const quickPayValue = isTelecom ? 'N' : ((fetchNotSupported && validationNotSupported) || reqQuickPay === 'Y' ? 'Y' : 'N');
    const prevReqId = quickPayValue === 'N' ? requestId : undefined;

    // Always use user-entered amount as the base — billerResponse.billAmount reflects the original
    // fetched bill and may differ when the user pays more (e.g. "Exact and above" billers).
    const baseAmount = parseFloat(amount);
    const ccf1Rupees = parseFloat(ccf1Amount ?? 0) / 100;
    const amountWithCCF1 = (baseAmount + ccf1Rupees).toFixed(2);

    // Surcharge is calculated on (bill amount + CCF1) — the true transaction amount
    const surchargeDetails = await calculateSurchargeWithTax(
      serviceDetails.surcharge,
      serviceDetails.surchargeType,
      parseFloat(amountWithCCF1),
      credentialId
    );
    const surcharge = surchargeDetails.surcharge;

    const partnerData = await fetchPartnerDetails(req.user.registeredBy);
    const reportData = await computeJournalData({
      serviceDetails,
      amount: parseFloat(amountWithCCF1),
      paymentMethod: "WALLET",
      partnerDetails: partnerData,
      paymentGatewayName: "WALLET",
      couponTotalDiscount: req.body.couponTotalDiscount,
      corporateState: req.user.state || '',
      credentialId,
    });

    // first we will  do transaction

    let corporateTxnId = new Date().valueOf()
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
    let transactionResponse = {}
    const commonParams = {
      providerId,
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      accountNo: account,
      transactionCategory,
      orderAmount: amountWithCCF1,
      commissionType,
      cashbackType,
      providerCommission,
      payCashback,
      surcharge,
      reportData
    };
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
      transactionResponse = await createPGTransaction({
        ...commonParams,
        pgAmount: req.body.pgAmount,
        pgResponse: req.body.paymentGatewayResponse
      });
    } else {
      transactionResponse = await createWalletTransaction({
        ...commonParams,
        amount: amountWithCCF1
      });
    }
    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
      return next(new ErrorResponse(transactionResponse['error'], 500))
    }

    publishJournal("payment");

    const customerMobile = normalizeCustomerMobile(req.user.mobileNo || req.user.mobile);
    if (!customerMobile) {
      return next(new ErrorResponse("Valid customer mobile number is required", 400));
    }
    const optionals = serviceDetails.vendor.optionals || {};
    const agentIpAddress = optionals['ipaddress'] || "192.168.2.183";
    const agentMacAddress = optionals['macaddress'] || "01-23-45-67-89-ab";

    const payBillRequestBody = {
      "agentId": serviceDetails.vendor.optional5,
      "billerAdhoc": normalizedBillerAdhoc,
      "agentDeviceInfo": {
        initChannel,
        ip: agentIpAddress,
        mac: agentMacAddress,
      },
      "customerInfo": {
        "REMITTER_NAME": sanitizeName(
          req.user?.name || req.user?.contactPersonName || "Peko Platforms"
        ),
        "customerMobile": customerMobile,
      },
      "billerId": billerId,
      "inputParams": customerParams,
      // billerResponse and additionalInfo are only included for quickPay=N flows (after
      // a mandatory Bill Fetch or Bill Validation step). For quickPay=Y, BillAvenue
      // requires a clean payment request with no prior fetch/validation data.
      ...(quickPayValue === 'N' && filteredBillerResponse && { "billerResponse": filteredBillerResponse }),
      ...(quickPayValue === 'N' && additionalInfo && { "additionalInfo": additionalInfo }),
      ...(planDetails && { "planDetails": planDetails }),
      "paymentRefId": corporateTxnId.toString(),
      "amountInfo": {
        "amount": amount,
        "currency": "356",
        "custConvFee": "0",
        ...(ccf1Amount && { "CCF1": ccf1Amount }),
      },
      "paymentMethod": {
        "paymentMode": isTelecom ? "Cash" : "Wallet",
        "quickPay": quickPayValue,
        "splitPay": "N"
      },
      "paymentInfo": {
        "info": {
          "infoName": "Payment Account Info",
          "infoValue": isTelecom ? "Received" : `Peko Wallet|${customerMobile}`
        }
      }
    };
    // paymentMode is Peko Wallet because this controller is specifically for wallet payments only
    // paymentDetails: {
    //   mode: "Debit Card",
    //   paymentRefId: corporateTxnId.toString(),
    //   amount: amount,
    //   timestamp: currentDate.toISOString(),
    // },
    let result;
    let updateDetails = {}
    try {
      // Hard block: never attempt a BillAvenue payment we can't fund. On insufficient vendor balance we
      // skip the vendor call and let the FAILURE branch below refund the customer (wallet or PG).
      const vendorCheck = await checkBillAvenueBalance(parseFloat(amountWithCCF1), req?.LogTraceId);
      if (!vendorCheck.sufficient) {
        customLog(req?.LogTraceId, "error", { message: "BBPS blocked: insufficient BillAvenue vendor wallet balance", required: amountWithCCF1, available: vendorCheck.balance, corporateTxnId }, "VENDOR");
        notifyBillAvenueLowBalance(vendorCheck, { required: amountWithCCF1, corporateTxnId }, req?.LogTraceId);
        result = { status: false, data: { message: "Service is temporarily unavailable. Please try again later." } };
      } else {
        // Clone to prevent paymentApi from mutating amountInfo.amount (×100) and billerResponse
        customLog(req?.LogTraceId, "info", { message: "paymentApi call", prevReqId, payload: payBillRequestBody }, "VENDOR");
        result = await paymentApi(serviceDetails.vendor, JSON.parse(JSON.stringify(payBillRequestBody)), prevReqId, req?.LogTraceId);
        customLog(req?.LogTraceId, "info", { message: "paymentApi result", result: result.data }, "VENDOR");
      }
    } catch (error) {
      result = { status: false, data: { message: 'Payment Failed! ' + error.message } };
      customLog(req?.LogTraceId, "error", { message: "paymentApi threw error", error: error.message, payload: payBillRequestBody }, "VENDOR");
    }

    // BLR007: "Successful Validation API is mandatory before executing Payment Request for this Biller."
    // E204:   "Request Id is already been used."
    // Re-validate to get a fresh requestId and retry the payment once.
    // The requestId from a previous attempt (expired, already consumed, or missing) causes these errors.
    const REVALIDATION_ERROR_CODES = ['BLR007', 'E204'];
    if (!result.status && REVALIDATION_ERROR_CODES.includes(result?.data?.errorInfo?.error?.errorCode)) {
      customLog(req?.LogTraceId, 'error', { message: 're-validating and retrying payment', errorCode: result?.data?.errorInfo?.error?.errorCode, billerId, prevReqId, payload: payBillRequestBody });
      try {
        const revalidationResult = await billValidationApi(serviceDetails.vendor, {
          agentId: serviceDetails.vendor.optional5,
          billerId,
          inputParams: customerParams,
          ...(filteredBillerResponse && { billerResponse: filteredBillerResponse }),
        }, req?.LogTraceId);
        customLog(req?.LogTraceId, 'info', { message: 'BLR007 re-validation result', status: revalidationResult.status, data: revalidationResult.data });
        if (revalidationResult.status) {
          const freshReqId = revalidationResult.data?.requestId;
          // Use fresh billerResponse from re-validation if provided
          if (revalidationResult.data?.billerResponse) {
            payBillRequestBody.billerResponse = revalidationResult.data.billerResponse;
          }
          customLog(req?.LogTraceId, 'info', { message: 'BLR007 retry paymentApi call', freshReqId, payload: payBillRequestBody }, 'VENDOR');
          result = await paymentApi(serviceDetails.vendor, JSON.parse(JSON.stringify(payBillRequestBody)), freshReqId, req?.LogTraceId);
          customLog(req?.LogTraceId, 'info', { message: 'BLR007 retry result', freshReqId, result: result.data }, 'VENDOR');
        } else {
          customLog(req?.LogTraceId, 'error', { message: 'BLR007: re-validation failed, original failure stands', revalidationResult });
        }
      } catch (retryErr) {
        customLog(req?.LogTraceId, 'error', { message: 'BLR007: retry threw error', error: retryErr.message });
      }
    }
    if (result.status) {
      updateDetails = {
        corporateTxnId,
        providerId: result?.data?.txnRefId ?? requestId,
        status: "SUCCESS",
        message: "Payment Successful",
        orderResponse: JSON.stringify(result.data),
      };
    } else if (result.awaited) {
      // Payment is awaiting biller confirmation — do NOT refund; scheduler will resolve it later
      updateDetails = {
        corporateTxnId,
        providerId: result?.data?.txnRefId ?? requestId,
        status: "AWAITED",
        message: "Payment Awaited",
        orderResponse: JSON.stringify(result.data),
      };
      await updateWalletTransaction(updateDetails);
      return res.status(200).json({
        status: true,
        data: { corporateTxnId, serviceProvider: type },
        message: "Payment is being processed. You will be notified once confirmed.",
        responseCode: "002",
      });
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.txnRefId ?? requestId,
        message: 'Payment Failed!',
        registeredById: req.user.registeredBy,
        orderResponse: JSON.stringify(result.data)
      }
      if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        let refundPGResponse = await refundGatewayTransaction(req, req.body.paymentGatewayResponse)
        if (refundPGResponse?.ppc_PinePGTxnStatus == 6 && refundPGResponse.ppc_TxnResponseCode == 1) {
          await refundWalletTransaction(updateDetails)
          publishJournal("refund");
        }
      } else {
        await refundWalletTransaction(updateDetails)
        publishJournal("refund");
      }
    }

    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date()
      transactionResponse.amount = (Number(amount) + ccf1Rupees + Number(surcharge)).toFixed(2)
      const paymentDetails = {
        transactionId: corporateTxnId,
        account: account,
        amount: (Number(amount) + ccf1Rupees + Number(surcharge)).toFixed(2),
      };
      const to = emailId;
      // Credit Card bill payments get a clearer subject than the generic "Financial Services Successful".
      const subject = `${serviceDetails.serviceProvider || transactionCategory} Payments Successful`;
      const loginUrl = `${frontendBaseUrl}/auth/login`;
      const resolvedBillSuccess = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_SUCCESS,
        service: EMAIL_TEMPLATE_SERVICES.BILL_PAYMENT,
        variables: {
          serviceType: transactionCategory,
          name,
          branding: partnerData?.branding || 'Peko',
          website: partnerData?.website || 'https://www.peko.one',
          loginUrl,
          ...v2LayoutVariables(partnerData),
        },
        fallback: () => generateMobilePaymentSuccessEmailBill(transactionCategory, name, partnerData, loginUrl),
        fallbackSubject: subject,
        partnerId: req.user.registeredBy || null,
        logTraceId: req?.LogTraceId,
      });
        
      const invoicePlanDetails = [{
        name: billerName ? `Bill Payment : ${billerName}` : "Bill Payment",
        amount: parseFloat(amountWithCCF1),
        quantity: 1,
      }];
      const invoiceAttachments = await generateOrderInvoiceAttachments({
        amount: Number(amount) + ccf1Rupees,
        surcharge,
        couponDiscount: transactionResponse?.couponDiscount || 0,
        corporateTxnId,
        orderId: transactionResponse?.orderId,
        paymentType: transactionCategory,
        credentialId: req.user.id,
        vendor: serviceDetails?.vendor,
        commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
        planDetails: invoicePlanDetails,
        commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
        traceId: req?.LogTraceId,
      });
      // Call email function to send email with payment details in the body
      emailer.emailWithMultipleAttachment(to, resolvedBillSuccess.subject, resolvedBillSuccess.html, invoiceAttachments, undefined, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
      });
      // Send push notification with payment details
      const notificationData = {
        notificationTitle: 'Payment Successful',
        notificationBrief: `The payment of ₹ ${formatNumberWithLocalString(paymentDetails.amount)} for account ${paymentDetails.account} with transaction ID ${paymentDetails.transactionId} (${type}) was successful.`,
        notificationTo: [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN'
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails)
      // Track the vendor wallet (bill + CCF1) on confirmed success — fire-and-forget. Balance tracking
      // is best-effort and must never delay or fail the customer's already-successful payment.
      decrementBillAvenueBalance(parseFloat(amountWithCCF1), { corporateTxnId, source: "BBPS" }, req?.LogTraceId).catch(() => {});
      result = result?.data
      customLog(req?.LogTraceId, "info", { result: result }, "VENDOR");
      return res.status(200).json({
        'status': true,
        'data': {
          ...result.data,
          ...transactionResponse,
          corporateTxnId,
          serviceProvider: type
        },
        message: 'Payment Successful',
        responseCode: '000'
      })
    } else {
      const paymentDetails = {
        transactionId: corporateTxnId,
        account: account,
        amount: (Number(amount) + ccf1Rupees + Number(surcharge)).toFixed(2),
      };
      // Send push notification with payment details
      const to = emailId; // Set recipient email address
      const subject = "Transaction Failed"; // Set email subject
      let partnerData = await fetchPartnerDetails(req.user.registeredBy);
      const resolvedBillFailed = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_FAILED,
        service: EMAIL_TEMPLATE_SERVICES.BILL_PAYMENT,
        variables: {
          serviceType: transactionCategory,
          account: paymentDetails.account,
          serviceProvider: billerName,
          name,
          branding: partnerData?.branding || 'Peko',
          website: partnerData?.website || 'https://www.peko.one',
          logo: partnerData?.logo,
          ...v2LayoutVariables(partnerData),
        },
        fallback: () => commonFailedTemplateforBillPayments(transactionCategory, paymentDetails.account, billerName, name, partnerData),
        fallbackSubject: subject,
        partnerId: req.user.registeredBy || null,
        logTraceId: req?.LogTraceId,
      });
      emailer.email(to, resolvedBillFailed.subject, resolvedBillFailed.html, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
      });
      const notificationData = {
        notificationTitle: 'Payment Failed',
        notificationBrief: `The payment of ₹ ${formatNumberWithLocalString(paymentDetails.amount)} for account ${paymentDetails.account} with transaction ID ${paymentDetails.transactionId} (${type}) was Failed.`,
        notificationTo: [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN'
      };
      createNotification(notificationData);
      const walletDetails = await wallet.findOne({
        where: {
          credentialId
        },
        attributes: ['balance']
      })
      return res.status(500).json({
        'status': false,
        'data': {
          ...result.data,
          corporateFinalBalance: walletDetails['balance']
        },
        message: 'Payment Failed',
        responseCode: '001'
      })
    }
  }),
});
