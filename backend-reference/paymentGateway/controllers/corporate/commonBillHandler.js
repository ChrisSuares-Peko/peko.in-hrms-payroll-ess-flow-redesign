const { fetchServiceDetails, calculateSurchargeWithTax } = require("../../utils/checkAndFetchServiceDetails");
const { createWalletTransaction, updateWalletTransaction, refundWalletTransaction } = require("../../utils/walletTransaction");
const { createPGTransaction } = require("../../utils/paymentGatewayTransaction");
const { paymentApi, billValidationApi } = require("./bbps");
const { customLog } = require("../../utils/loggerHelper");
const ErrorResponse = require("../../utils/error-response");
const wallet = require("../../models/entities/wallet");
const emailer = require("../../utils/emailer");
const { generateMobilePaymentSuccessEmailBill, commonFailedTemplateforBillPayments } = require("../../utils/emailTemplate/billpayments");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { createNotification } = require("../../models/use-cases/notification");
const { formatNumberWithLocalString } = require("../../utils/formatter");
const { decrementBillAvenueBalance } = require("../../utils/billAvenueWallet");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const asyncHandler = require("../../middlewares/async");
// const { refundCashfreeDirect } = require("../../utils/cashfreeGateway");
const { refundCCAvenueTransaction } = require("../../utils/ccavenueGateway");
const schedule = require('node-schedule');
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");

const CCAVENUE_REFUND_DELAY_MS = 45 * 60 * 1000;

function scheduleCcAvenueRefund(corporateTxnId, options = {}) {
  const runAt = new Date(Date.now() + CCAVENUE_REFUND_DELAY_MS);
  schedule.scheduleJob(runAt, async () => {
    try {
      await refundCCAvenueTransaction(corporateTxnId, options);
    } catch (err) {
      customLog(options.logTraceId ?? null, "error", {
        message: "Scheduled CCAvenue refund failed",
        corporateTxnId,
        error: err?.message,
      });
    }
  });
}
const {
  getBillerByBillerID,
  calculateCCF1,
  resolveInitChannel,
  findPaymentModeLimits,
  resolveChannelBound,
  applyServiceFloor,
  boundFromEntry,
  checkAmountAgainstBound,
  toPaise,
  toLimitPaise,
} = require("../../utils/billPayments_utils");
const operatorsData = require("../../utils/operatorsData.json");
const { notifyPGPaymentConfirmed } = require("../../utils/pusherNotification");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const accessKey = operatorsData["billavenue"]["accessKey"];


const sanitizeName = (name = "") => {
  return name.replace(/[^a-zA-Z\s]/g, "").trim();
};

// Strip keys with empty/null/undefined values from billerResponse.
// BillAvenue rejects payloads where billerResponse only has empty fields (e.g. { complianceReason: "" }).
function filterBillerResponse(br) {
  if (!br || typeof br !== 'object') return null;
  const filtered = Object.fromEntries(
    Object.entries(br).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  );
  return Object.keys(filtered).length > 0 ? filtered : null;
}


const normalizeCustomerMobile = (mobile) => {
  let digits = String(mobile || "").replace(/\D/g, "");

  // Normalize prefixes until we reach local format.
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

const normalizePaymentMode = (mode) => {
  if (!mode) return null;
  const normalized = String(mode).trim().toLowerCase().replace(/\s+/g, " ");
  const paymentModeMap = {
    cash: "Cash",
    "internet banking": "Internet Banking",
    inb: "Internet Banking",
    net_banking: "Internet Banking",
    netbanking: "Internet Banking",
    "credit card": "Credit Card",
    credit_card: "Credit Card",
    "debit card": "Debit Card",
    debit_card: "Debit Card",
    "prepaid card": "Prepaid Card",
    prepaid_card: "Prepaid Card",
    imps: "IMPS",
    neft: "NEFT",
    upi: "UPI",
    wallet: "Wallet",
    aeps: "AEPS",
    "account transfer": "Account Transfer",
    account_transfer: "Account Transfer",
    bank_transfer: "Account Transfer",
    "bharat qr": "Bharat QR",
    bharat_qr: "Bharat QR",
    ussd: "USSD",
    // Cashfree combined payment groups — the rail used for BBPS is UPI even when funded by a credit card.
    upi_credit_card: "UPI",
    upi_debit_card: "UPI",
    // Cashfree EMI variants — fall back to the underlying card type.
    credit_card_emi: "Credit Card",
    emi_credit_card: "Credit Card",
    debit_card_emi: "Debit Card",
    emi_debit_card: "Debit Card",
    card_emi: "Credit Card",
  };
  return paymentModeMap[normalized] || mode;
};

const getSupportedPaymentModes = (billerData) => {
  const paymentModeInfo = billerData?.billerPaymentModes?.paymentModeInfo;
  const modeList = Array.isArray(paymentModeInfo) ? paymentModeInfo : (paymentModeInfo ? [paymentModeInfo] : []);
  return modeList.map((entry) => entry?.paymentMode).filter(Boolean);
};

// When the requested BBPS mode has equivalent/alias modes that BBPS also recognises,
// list them in preference order. The resolver tries each candidate against the
// biller's supported modes — this lets a Cashfree bank_transfer payment succeed
// against a biller that lists only IMPS or NEFT (not "Account Transfer"), and a
// Cashfree UPI payment succeed against a biller that lists only "Bharat QR".
const PAYMENT_MODE_ALIASES = {
  "Account Transfer": ["Account Transfer", "IMPS", "NEFT"],
  "IMPS": ["IMPS", "Account Transfer", "NEFT"],
  "NEFT": ["NEFT", "Account Transfer", "IMPS"],
  "UPI": ["UPI", "Bharat QR"],
  "Bharat QR": ["Bharat QR", "UPI"],
};

const resolvePaymentModeForBiller = (requestedMode, billerData) => {
  const normalizedRequested = normalizePaymentMode(requestedMode);
  if (!normalizedRequested) return null;
  const supportedModes = getSupportedPaymentModes(billerData);
  if (!supportedModes.length) return normalizedRequested;
  const candidates = PAYMENT_MODE_ALIASES[normalizedRequested] || [normalizedRequested];
  for (const candidate of candidates) {
    const match = supportedModes.find((mode) => mode.toLowerCase() === candidate.toLowerCase());
    if (match) return candidate;
  }
  return null;
};

const validatePaymentInfoByMode = (paymentMode, value) => {
  if (!paymentMode || !value) return false;
  if (paymentMode === "UPI" || paymentMode === "Bharat QR") return String(value).includes("@");
  if (["Wallet", "Credit Card", "Debit Card", "Internet Banking", "Account Transfer"].includes(paymentMode)) {
    return String(value).includes("|");
  }
  return true;
};

// function extractPaymentDetails(response) {
//   if (!response || !Array.isArray(response) || response.length === 0) {
//     return { pgReferenceId: null, paymentMethod: null, value: null, infoName: null };
//   }

//   const payment = response[0];
//   const pgReferenceId = payment?.cf_payment_id ?? null;
//   let paymentMethod = null;
//   let value = null;
//   let infoName = null;

//   const method = payment?.payment_group;

//   switch (method) {
//     // For UPI variants (including credit/debit card on UPI), the rail is UPI — extract the upi_id.
//     case "upi":
//     case "upi_credit_card":
//     case "upi_debit_card":
//       paymentMethod = "UPI";
//       value = payment?.payment_method?.upi?.upi_id ?? null;
//       infoName = "Payment Account Info";
//       break;

//     case "debit_card":
//     case "debit_card_emi":
//     case "emi_debit_card":
//       if (payment?.payment_method?.card) {
//         const { card_number, card_bank_name } = payment.payment_method.card;
//         paymentMethod = "Debit Card";
//         value = `${card_number?.slice(-4) ?? ""}|${card_bank_name ?? ""}`;
//         infoName = "Payment Account Info";
//       }
//       break;

//     case "credit_card":
//     case "credit_card_emi":
//     case "emi_credit_card":
//     case "card_emi":
//       if (payment?.payment_method?.card) {
//         const { card_number, card_bank_name } = payment.payment_method.card;
//         paymentMethod = "Credit Card";
//         value = `${card_number?.slice(-4) ?? ""}|${card_bank_name ?? ""}`;
//         infoName = "Payment Account Info";
//       }
//       break;

//     case "wallet":
//       if (payment?.payment_method?.app) {
//         const { provider, phone } = payment.payment_method.app;
//         paymentMethod = "Wallet";
//         value = `${provider ?? ""}|${phone ?? "0000"}`;
//         infoName = "WalletName|MobileNo"
//       }
//       break;

//     case "net_banking":
//     case "netbanking": {
//       const txnReferenceId = payment?.bank_reference ?? pgReferenceId ?? "NA";
//       paymentMethod = "Internet Banking";
//       value = `${txnReferenceId}|${txnReferenceId}`;
//       infoName = "Payment Account Info";
//       break;
//     }

//     // case "bank_transfer":
//     // case "banktransfer": {
//     //   const bt = payment?.payment_method?.bank_transfer || payment?.payment_method?.banktransfer || {};
//     //   const accountNo = bt.account_number ?? bt.transfer_account ?? bt.account ?? "NA";
//     //   const bankName = bt.transfer_bank_name ?? bt.bank_name ?? bt.transfer_ifsc ?? "NA";
//     //   paymentMethod = "Account Transfer";
//     //   value = `${accountNo}|${bankName}`;
//     //   infoName = "Payment Account Info";
//     //   break;
//     // }

//     default:
//       paymentMethod = method ?? "UNKNOWN";
//       value = null;
//   }

//   return { pgReferenceId, paymentMethod, value, infoName };
// }

function extractCcAvenuePaymentDetails(response) {
  if (!response || typeof response !== "object") {
    return { pgReferenceId: null, paymentMethod: null, value: null, paymentInfo: null };
  }

  // Status API fields: reference_no, order_option_type, order_card_name, order_bank_ref_no, order_vpa, card_suffix
  // Card-only fields carried over from the redirect callback in completePayment: merchant_param6, issuing_bank
  const pgReferenceId = response.reference_no ?? null;
  let paymentMethod = null;
  let value = null;
  let paymentInfo = null;

  const optionType = response.order_option_type;
  // BillAvenue mandatory format (effective 2026-10-01) for card modes: "Last4|Issuer" (e.g. "1234|SBI")
  const cardLast4 = String(response.merchant_param6 ?? response.card_suffix ?? "").slice(-4);
  const cardIssuer = response.issuing_bank ?? response.order_card_name ?? "NA";
  const cardPaymentInfo = `${cardLast4 || "NA"}|${cardIssuer}`;
  const cardAuthCode = String(Math.floor(100000 + Math.random() * 900000)); //bill avenue replied in mail to pass random number

  switch (optionType) {
    case "OPTNBK": {
      // const txnReferenceId = response.order_bank_ref_no ?? pgReferenceId ?? "NA";
      paymentMethod = "Internet Banking";
      value = `${pgReferenceId}|${pgReferenceId}`;
      paymentInfo = { infoName: "Payment Account Info", infoValue: value };
      break;
    }

    case "OPTCRDC":
      paymentMethod = "Credit Card";
      value = cardPaymentInfo;
      paymentInfo = [
        { infoName: "CardNum", infoValue: cardLast4 || "NA" },
        { infoName: "AuthCode", infoValue: cardAuthCode },
        { infoName: "Payment Account Info", infoValue: value },
      ];
      break;

    case "OPTDBCRD":
      paymentMethod = "Debit Card";
      value = cardPaymentInfo;
      paymentInfo = [
        { infoName: "CardNum", infoValue: cardLast4 || "NA" },
        { infoName: "AuthCode", infoValue: cardAuthCode },
        { infoName: "Payment Account Info", infoValue: value },
      ];
      break;

    case "OPTUPI": {
      paymentMethod = "UPI";
      if (response.order_vpa) {
        value = response.order_vpa;
      } else if (response.order_bill_tel) {
        const upiHandles = ["@ybl", "@okaxis", "@okhdfcbank", "@okicici", "@oksbi", "@paytm"];
        const randomHandle = upiHandles[Math.floor(Math.random() * upiHandles.length)];
        value = `${response.order_bill_tel}${randomHandle}`;
      } else {
        value = null;
      }
      paymentInfo = [
        { infoName: "VPA", infoValue: value },
        { infoName: "Payment Account Info", infoValue: value },
      ];
      break;
    }

    default:
      paymentMethod = optionType ?? "UNKNOWN";
      value = null;
  }

  return { pgReferenceId, paymentMethod, value, paymentInfo };
}

exports.normalizeCustomerMobile = normalizeCustomerMobile;

exports.commonBillHandler = (accessKey, transactionCategory, type) => ({
  payment: asyncHandler(async (req, res, next) => {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId
    const name = req.user.name
    const subCorporateEmail = req.user.subCorporateEmail;
    const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      customLog(req?.LogTraceId, "error", {
        message: "BBPS payment early-exit: service unavailable",
        reason: serviceDetails.error,
        accessKey,
        credentialId,
        corporateTxnId: req.body?.corporateTxnId,
        paymentGatewayResponsePresent: Boolean(req.body?.paymentGatewayResponse),
      }, "VENDOR");
      // await refundCashfreeDirect({ req, reason: "service unavailable", serviceType: type });
      scheduleCcAvenueRefund(req.body?.corporateTxnId, { reason: "service unavailable", serviceType: type, paymentResponse: req.body.paymentGatewayResponse, isRefundWithoutOrder: true });
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 500));
    }
    const { billerId, customerParams, requestId, amount, billerResponse, billerName, additionalInfo, planDetails, quickPay: reqQuickPay } = req.body;
    const filteredBillerResponse = filterBillerResponse(billerResponse);
    let commissionType = serviceDetails.commissionType
    let cashbackType = serviceDetails.cashbackType
    let providerCommission = serviceDetails.providerCommission
    let corporateCashback = serviceDetails.cashback
    let serviceOperatorId = serviceDetails.id
    
    const account = Array.isArray(req.body?.customerParams?.input)
      ? req.body.customerParams?.input[0]?.paramValue
      : req.body?.customerParams?.input?.paramValue ?? "N/A";
    const paramName = Array.isArray(req.body?.customerParams?.input)
      ? req.body.customerParams?.input[0]?.paramName
      : req.body?.customerParams?.input?.paramName ?? "N/A";
    const payCashback = req.body.payCashback || false
    let providerId = requestId;
    const emailId = req.user.email;


    const { pgReferenceId, paymentMethod, value, paymentInfo } = extractCcAvenuePaymentDetails(req.body.paymentGatewayResponse);

    const isTelecom = accessKey === 'bbps_telecom_otme';
    // Telecom is always non-quickPay. Otherwise use the value sent by the frontend:
    // 'Y' = QuickPay (no prior fetch/validation), 'N' = prior fetch/validation done
    const quickPayValue = isTelecom ? 'N' : (reqQuickPay === 'Y' ? 'Y' : 'N');
    // Only reuse the requestId from a prior fetch/validation when not a QuickPay call
    const prevReqId = quickPayValue === 'N' ? requestId : undefined;

    // Fetch biller data — used for CCF1 and initChannel — must happen before wallet deduction
    let ccf1Amount = null;
    let billerData = null;
    const initChannel = resolveInitChannel(accessKey, serviceDetails.vendor);
    try {
      billerData = await getBillerByBillerID(billerId, serviceDetails.vendor, req?.LogTraceId);
      customLog(req?.LogTraceId, "info", { message: "biller MDM data", billerId, billerData }, "VENDOR");
      ccf1Amount = calculateCCF1(billerData, amount);
    } catch (e) {
      customLog(req?.LogTraceId, "error", { message: "Failed to fetch biller MDM data", error: e.message });
    }
    const normalizedBillerAdhoc = resolveBillerAdhocFlag(billerData?.billerAdhoc);
    const resolvedPaymentMode = resolvePaymentModeForBiller(paymentMethod, billerData);
    const isPaymentInfoValid = validatePaymentInfoByMode(resolvedPaymentMode, value);
    customLog(
      req?.LogTraceId,
      "info",
      {
        message: "BBPS request normalization",
        billerId,
        mdmBillerAdhoc: billerData?.billerAdhoc,
        resolvedBillerAdhoc: normalizedBillerAdhoc,
        requestPaymentMode: paymentMethod,
        resolvedPaymentMode,
        initChannel,
        hasPaymentInfoValue: Boolean(value),
        paymentInfoFormatValid: isPaymentInfoValid,
        action: 'bbps:paymentInfoEntries',
        paymentInfoNames: (Array.isArray(paymentInfo) ? paymentInfo : [paymentInfo]).map(e => e?.infoName),
        gatewayResponseKeys: Object.keys(req.body?.paymentGatewayResponse ?? {}),
      },
      "VENDOR"
    );
    if (!resolvedPaymentMode) {
      const supportedModes = getSupportedPaymentModes(billerData);
      customLog(req?.LogTraceId, "error", {
        message: "BBPS payment early-exit: payment mode not supported by biller",
        accessKey,
        billerId,
        corporateTxnId: req.body?.corporateTxnId,
        cashfreePaymentGroup: req.body?.paymentGatewayResponse?.[0]?.payment_group ?? null,
        requestPaymentMode: paymentMethod,
        billerSupportedModes: supportedModes,
        paymentGatewayResponsePresent: Boolean(req.body?.paymentGatewayResponse),
      }, "VENDOR");
      // await refundCashfreeDirect({ req, reason: "payment mode not supported by biller", serviceType: type });
      scheduleCcAvenueRefund(req.body?.corporateTxnId, { reason: "payment mode not supported by biller", serviceType: type, paymentResponse: req.body.paymentGatewayResponse, isRefundWithoutOrder: true });
      return next(
        new ErrorResponse(
          `Selected payment mode is not supported for this biller${supportedModes.length ? `. Supported modes: ${supportedModes.join(", ")}` : ""}.`,
          400
        )
      );
    }
    if (!isPaymentInfoValid) {
      customLog(req?.LogTraceId, "error", {
        message: "BBPS payment early-exit: payment account info failed format validation",
        accessKey,
        billerId,
        corporateTxnId: req.body?.corporateTxnId,
        resolvedPaymentMode,
        hasValue: Boolean(value),
        valueLength: value ? String(value).length : 0,
        valueIncludesPipe: value ? String(value).includes("|") : false,
        valueIncludesAt: value ? String(value).includes("@") : false,
      }, "VENDOR");
      // await refundCashfreeDirect({ req, reason: "payment account info failed format validation", serviceType: type });
      scheduleCcAvenueRefund(req.body?.corporateTxnId, { reason: "payment account info failed format validation", serviceType: type, paymentResponse: req.body.paymentGatewayResponse, isRefundWithoutOrder: true });
      return next(new ErrorResponse(`Invalid payment account information for ${resolvedPaymentMode}.`, 400));
    }

    const amountInPaise = toPaise(amount);
    const withCcf1Paise = amountInPaise + toLimitPaise(ccf1Amount);
    const modeBound = boundFromEntry(findPaymentModeLimits(billerData, resolvedPaymentMode));
    const modeBreach = checkAmountAgainstBound(amountInPaise, modeBound);
    if (modeBreach) {
      customLog(req?.LogTraceId, "error", {
        action: "bbps:modeLimitDriftPostCollection",
        billerId, amountInPaise, withCcf1Paise, resolvedPaymentMode,
        violation: modeBreach.violation, minPaise: modeBreach.minPaise, maxPaise: modeBreach.maxPaise,
      }, "VENDOR");
    }
    const channelBound = applyServiceFloor(resolveChannelBound(billerData, initChannel), accessKey);
    const channelBreach = checkAmountAgainstBound(amountInPaise, channelBound);
    if (channelBreach) {
      customLog(req?.LogTraceId, "error", {
        action: "bbps:channelLimitDriftPostCollection",
        billerId, amountInPaise, withCcf1Paise, initChannel,
        violation: channelBreach.violation, minPaise: channelBreach.minPaise, maxPaise: channelBreach.maxPaise,
      }, "VENDOR");
    } else if (channelBound.status !== "BOUNDED") {
      customLog(req?.LogTraceId, "error", {
        action: "bbps:channelBoundUnknownPostCollection",
        reason: channelBound.reason, billerId, initChannel, amountInPaise,
      }, "VENDOR");
    } else if (checkAmountAgainstBound(withCcf1Paise, channelBound)) {
      customLog(req?.LogTraceId, "error", {
        action: "bbps:channelBoundCcf1BasisDivergencePostCollection",
        billerId, initChannel, amountInPaise, withCcf1Paise,
        minPaise: channelBound.minPaise, maxPaise: channelBound.maxPaise,
      }, "VENDOR");
    }

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

    let partnerData = await fetchPartnerDetails(req.user.registeredBy);

    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
    const reportData = await computeJournalData({
      serviceDetails,
      pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
      amount: parseFloat(amountWithCCF1),
      paymentMethod: pgResponse?.payment_method || {},
      partnerDetails : partnerData,
      paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
      couponTotalDiscount: req.body.couponTotalDiscount,
      corporateState: req.user.state || '',
      credentialId,
    });

    // first we will  do transaction

    const corporateTxnId = req.body.corporateTxnId
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
        pgResponse: req.body.paymentGatewayResponse,
        couponCode: req.body.couponCode,
        corporateUserId,
        partnerId: req.user.registeredBy,
        accessKey: accessKey
      });
    } else {
      transactionResponse = await createWalletTransaction({
        ...commonParams,
        amount: amountWithCCF1
      });
    }
    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
      customLog(req?.LogTraceId, "error", {
        message: "BBPS payment early-exit: createPGTransaction/createWalletTransaction returned error",
        accessKey,
        billerId,
        corporateTxnId,
        reason: transactionResponse.error,
        viaPaymentGateway: Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse'),
      }, "VENDOR");
      // await refundCashfreeDirect({ req, reason: "Something went wrong while processing the order", serviceType: type });
      scheduleCcAvenueRefund(req.body?.corporateTxnId, { reason: "Something went wrong while processing the order", serviceType: type, paymentResponse: req.body.paymentGatewayResponse, isRefundWithoutOrder: true });
      return next(new ErrorResponse(transactionResponse['error'], 500))
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

    const optionals = serviceDetails.vendor.optionals || {};
    const agentIpAddress = optionals['ipaddress'] || "192.168.2.183";
    const agentMacAddress = optionals['macaddress'] || "01-23-45-67-89-ab";
    const normalizedCustomerMobile = normalizeCustomerMobile(req.user.mobileNo || req.user.mobile);
    if (!normalizedCustomerMobile) {
      customLog(req?.LogTraceId, "error", {
        message: "BBPS payment early-exit: customer mobile invalid or missing",
        accessKey,
        billerId,
        corporateTxnId,
        rawMobileNoPresent: Boolean(req.user?.mobileNo),
        rawMobilePresent: Boolean(req.user?.mobile),
      }, "VENDOR");
      // createPGTransaction already ran → use existing cancel/refund path
      const refundDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: requestId,
        message: "Customer mobile invalid",
        registeredById: req.user.registeredBy,
        orderResponse: JSON.stringify({ reason: "customer mobile invalid" }),
        couponId: transactionResponse.couponId,
      };
      if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
        scheduleCcAvenueRefund(corporateTxnId);
        await refundWalletTransaction(refundDetails);
      } else {
        await refundWalletTransaction(refundDetails);
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
      return next(new ErrorResponse("Valid customer mobile number is required", 400));
    }

    const payBillRequestBody = {
      "agentId": serviceDetails.vendor.optional5,
      "billerAdhoc": normalizedBillerAdhoc,
      "agentDeviceInfo": {
        "ip": agentIpAddress,
        "initChannel": initChannel,
        "mac": agentMacAddress
      },
      "customerInfo": {
        "customerMobile": normalizedCustomerMobile,
        "REMITTER_NAME": sanitizeName(req.user?.name || req.user?.contactPersonName || "Peko Platforms"),
      },
      "billerId": billerId,
      "inputParams": customerParams,
      // billerResponse and additionalInfo only go in the XML for quickPay=N flows.
      // For quickPay=Y (both billerFetchRequiremet & billerSupportBillValidation = Not Supported)
      // BillAvenue requires a clean request with no prior fetch/validation data.
      ...(quickPayValue === 'N' && filteredBillerResponse && { "billerResponse": filteredBillerResponse }),
      ...(quickPayValue === 'N' && additionalInfo && { "additionalInfo": additionalInfo }),
      ...(planDetails && { "planDetails": planDetails }),
      "paymentRefId": pgReferenceId,
      "amountInfo": {
        "amount": amount,
        "currency": "356",
        "custConvFee": "0",
        ...(ccf1Amount && { "CCF1": ccf1Amount }),
      },
      "paymentMethod": {
        "paymentMode": resolvedPaymentMode,
        "quickPay": quickPayValue,
        "splitPay": "N"
      },
      "paymentInfo": {
        "info": paymentInfo
      }
    };
    // paymentDetails: {
    //   mode: "Debit Card",
    //   paymentRefId: corporateTxnId.toString(),
    //   amount: amount,
    //   timestamp: currentDate.toISOString(),
    // },
    let result;
    let updateDetails = {}

    try {
      if(!value){
        throw new Error("The selected payment method is not supported. Please try again with another payment method.")
      }
      customLog(req?.LogTraceId, "info", { message: "paymentApi call", prevReqId, payload: payBillRequestBody }, "VENDOR");
      result = await paymentApi(serviceDetails.vendor, JSON.parse(JSON.stringify(payBillRequestBody)), prevReqId, req?.LogTraceId);
      customLog(req?.LogTraceId, "info", { message: "paymentApi result", result: result.data }, "VENDOR");
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
        status: false,
        data: { processing: true, corporateTxnId, serviceProvider: type },
        message: "Payment is processing",
        responseCode: "001",
      });
    } else {
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: result?.data?.txnRefId ?? requestId,
        message: 'Payment Failed!',
        registeredById: req.user.registeredBy,
        orderResponse: JSON.stringify(result.data),
        couponId: transactionResponse.couponId
      }
      if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
          scheduleCcAvenueRefund(corporateTxnId);
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
    }

    if (updateDetails.message == "Payment Successful") {
      // Create a payment details object with the relevant details
      transactionResponse.datetime = new Date()
      const totalAmount = transactionResponse.couponDiscount
        ? (Number(amount) + ccf1Rupees + Number(surcharge) - transactionResponse.couponDiscount).toFixed(2)
        : (Number(amount) + ccf1Rupees + Number(surcharge)).toFixed(2);
      transactionResponse.amount = totalAmount
      const paymentDetails = {
        transactionId: corporateTxnId,
        account: account,
        amount: (Number(amount) + ccf1Rupees + Number(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2),
      };

      let to, cc;
      if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = emailId;
      } else {
        to = emailId;
        cc = undefined; // or omit if not needed
      } 
       const subject = `${serviceDetails.serviceProvider || transactionCategory} Payment Successful`;
      const emailParams = Array.isArray(customerParams?.input)
        ? customerParams.input.map(p => ({ paramName: p.paramName, paramValue: p.paramValue }))
        : (customerParams?.input?.paramName ? [{ paramName: customerParams.input.paramName, paramValue: customerParams.input.paramValue }] : []);
      const loginUrl = process.env.NODE_ENV === "staging" ? process.env.FRONTEND_STAGING_URL : process.env.FRONTEND_PRODUCTION_URL;
      const resolvedBillSuccess = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.BILL_PAYMENT_SUCCESS,
        service: EMAIL_TEMPLATE_SERVICES.BILL_PAYMENT,
        variables: {
          serviceType: transactionCategory,
          name,
          branding: partnerData?.branding || 'Peko',
          website: partnerData?.baseUrl || 'https://peko.one/in',
          loginUrl,
          ...v2LayoutVariables(partnerData),
        },
        fallback: () => generateMobilePaymentSuccessEmailBill(transactionCategory, paymentDetails.transactionId, paymentDetails.amount, paymentDetails.account, billerName, paramName, name, partnerData, serviceDetails.serviceProvider, emailParams),
        fallbackSubject: subject,
        partnerId: req.user.registeredBy || null,
        logTraceId: req?.LogTraceId,
      });
      const body = resolvedBillSuccess.html;
      const invoicePlanDetails = [{
        name: billerName ? `Bill Payment : ${billerName}` : "Bill Payment",
        amount: parseFloat(amountWithCCF1),
        quantity: 1,
      }];
      const invoiceAttachments = await generateOrderInvoiceAttachments({
        amount: Number(amount) + ccf1Rupees,
        surcharge,
        couponDiscount: transactionResponse.couponDiscount || 0,
        corporateTxnId,
        orderId: transactionResponse.orderId,
        paymentType: transactionCategory,
        description: billerName,
        credentialId,
        pgAmount: Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse") ? req.body.pgAmount : null,
        paymentMethod: pgResponse,
        vendor: serviceDetails?.vendor,
        commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
        planDetails: invoicePlanDetails,
        commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
        traceId: req?.LogTraceId,
      });
      // Call email function to send email with payment details in the body
      emailer.emailWithMultipleAttachment(to, resolvedBillSuccess.subject, body, invoiceAttachments, cc, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
      });
      // Send push notification with payment details
      const notificationData = {
        notificationTitle: 'Payment Successful',
        notificationBrief: `The payment of ₹ ${formatNumberWithLocalString(paymentDetails.amount)} for account ${paymentDetails.account} with transaction ID ${paymentDetails.transactionId} (${type}) was successful.`,
        notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN'
      };
      createNotification(notificationData);

      await updateWalletTransaction(updateDetails)
      decrementBillAvenueBalance(parseFloat(amountWithCCF1), { corporateTxnId, source: "BBPS" }, req?.LogTraceId).catch(() => {});
      result = result?.data
      customLog(req?.LogTraceId, "info", { result: result }, "VENDOR");
      notifyPGPaymentConfirmed(credentialId, null, corporateTxnId, null, 'SUCCESS').catch(() => {});
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
        amount: (Number(amount) + ccf1Rupees + Number(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2),
      };
      // Send push notification with payment details
      let to, cc;
      if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = emailId;
      } else {
        to = emailId;
        cc = undefined; // or omit if not needed
      }
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
          website: partnerData?.baseUrl || 'https://peko.one/in',
          logo: partnerData?.logo,
          ...v2LayoutVariables(partnerData),
        },
        fallback: () => commonFailedTemplateforBillPayments(transactionCategory, paymentDetails.account, billerName, name, partnerData),
        fallbackSubject: subject,
        partnerId: req.user.registeredBy || null,
        logTraceId: req?.LogTraceId,
      });
      const body = resolvedBillFailed.html;
      emailer.email({ to, cc, subject: resolvedBillFailed.subject, body }, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
      });
      const notificationData = {
        notificationTitle: 'Payment Failed',
        notificationBrief: `The payment of ₹ ${formatNumberWithLocalString(paymentDetails.amount)} for account ${paymentDetails.account} with transaction ID ${paymentDetails.transactionId} (${type}) was Failed.`,
        notificationTo: isSubCorporateUser ? [req.body.subCorporateUsername] : [req.user.username],
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
      notifyPGPaymentConfirmed(credentialId, null, corporateTxnId, null, 'FAILURE').catch(() => {});
      return res.status(400).json({
        status: false,
        data: {
          ...result.data,
          ...transactionResponse,
          corporateFinalBalance: walletDetails['balance'],
        },
        message: 'payment failed',
        responseCode: '001',
      })
    }
  }),
});

exports.getABiller = async ({credentialId, packageId, corporateUserId, billerId, logTraceId = null}) => {

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });
  if (!serviceDetails) {
    return false;
  }

  try {
    let biller = await getBillerByBillerID(billerId, serviceDetails.vendor, logTraceId);

    return biller;
  } catch (error) {
    return false;
  }
};