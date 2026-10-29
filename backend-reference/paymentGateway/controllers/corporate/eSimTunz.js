const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { gatewayModeLabel } = require('../../utils/paymentModeKind');
const { customLog } = require('../../utils/loggerHelper');
const axios = require("axios");
const QRCode = require("qrcode");
const { uploadFile } = require('../../utils/commonUploadFile');
const { generateEsimBuySingleSuccessEmail, generateEsimRecipientEmail, generateEsimRecipientSubject, capitalizeEsimName, buildEsimRecipientQrCodeHtml } = require('../../utils/emailTemplates/eSim');
const { setValue, pushToList } = require("../../utils/cacheDataMethods");
const { getPlanByPlanId } = require('../../models/use-cases/esimPlans');
const ErrorResponse = require('../../utils/error-response');
const asyncHandler = require('../../middlewares/async');
const { fetchServiceDetails, calculateAmountWithTax, calculateSurcharge } = require('../../utils/checkAndFetchServiceDetails');
const { paymentGateWayRefundFailureEmail } = require('../../utils/emailSender');
const { cancelCardTransaction } = require('./payment_gateway');
const wallet = require('../../models/entities/wallet');
const { createPGTransaction } = require('../../utils/paymentGatewayTransaction');
const { createWalletTransaction, refundWalletTransaction, updateWalletTransaction } = require('../../utils/walletTransaction');
const { cancelPGTransaction } = require('../../utils/pgRefund');
const { esimPaymentFailedTemplate, commonFailedTemplate, esimTopUpTemplate } = require('../../utils/emailTemplates/common');
const { createNotification } = require('../../models/use-cases/notification');
const operatorsData = require("../../utils/operatorsData.json");
const accessKey = operatorsData.eSIMTunz.accessKey
const emailer = require('../../utils/emailer');
const { tunzQueue } = require('../../utils/bullQueue');
const { getToken } = require('../../utils/tunzAuth');
const { createEsimProfile, findCustomerUidByIccid, findPurchasedForByIccid } = require('../../models/use-cases/esimProfiles');
const esimProfiles = require('../../models/entities/esimProfilesTunz');
const { notifyPGPaymentConfirmed } = require('../../utils/pusherNotification');
const { computeJournalData } = require('../../utils/computeJournalData');
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys');
const { v2LayoutVariables } = require('../../utils/emailTemplate/sharedLayout');

// Shared by 2 call sites in this file (mirrored in eSIMV2.js) — reuses travel MS's
// own ESIM_PAYMENT_FAILED key/design verbatim (see emailTemplateKeys.js).
async function resolveEsimCommonFailedEmail(name, serviceName, url, templateDetails, subject, logTraceId) {
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.ESIM_PAYMENT_FAILED,
    service: EMAIL_TEMPLATE_SERVICES.ESIM,
    variables: {
      name,
      serviceName,
      paymentDate: new Date().toLocaleString(),
      baseUrl: templateDetails?.baseUrl,
      branding: templateDetails?.branding || 'Peko',
      website: templateDetails?.baseUrl || 'https://peko.one/in',
      logo: templateDetails?.logo,
      ...v2LayoutVariables(templateDetails),
    },
    fallback: () => commonFailedTemplate(name, serviceName, url, templateDetails),
    fallbackSubject: subject,
    logTraceId,
  });
}

// Shared by 2 call sites in this file (mirrored in eSIMV2.js).
async function resolveEsimBuyPaymentFailedEmail(name, serviceName, country, dataPack, validity, amount, url, templateDetails, subject, logTraceId) {
  const dataPlan = Number(dataPack) === 0 ? 'Unlimited' : `${(dataPack / 1024) % 1 === 0 ? dataPack / 1024 : (dataPack / 1024).toFixed(1)} GB`;
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.ESIM_BUY_PAYMENT_FAILED,
    service: EMAIL_TEMPLATE_SERVICES.ESIM,
    variables: {
      name,
      serviceName,
      country,
      dataPlan,
      validity,
      amount,
      branding: templateDetails?.branding || 'Peko',
      website: templateDetails?.baseUrl || 'https://peko.one/in',
      logo: templateDetails?.logo,
      ...v2LayoutVariables(templateDetails),
    },
    fallback: () => esimPaymentFailedTemplate(name, serviceName, country, dataPack, validity, amount, url, templateDetails),
    fallbackSubject: subject,
    logTraceId,
  });
}

// Shared by 3 call sites in this file (mirrored in eSIMV2.js). `type` ('success'|'fail')
// picks the key since the two variants carry different copy the admin template can't branch on.
async function resolveEsimTopUpEmail(name, serviceName, country, dataPack, validity, amount, iccid, type, templateDetails, subject, logTraceId) {
  const dataPlan = Number(dataPack) === 0 ? 'Unlimited' : `${(dataPack / 1024) % 1 === 0 ? dataPack / 1024 : (dataPack / 1024).toFixed(1)} GB`;
  const key = type === 'success' ? EMAIL_TEMPLATE_KEYS.ESIM_TOPUP_SUCCESS : EMAIL_TEMPLATE_KEYS.ESIM_TOPUP_FAILED;
  return resolveEmailTemplate({
    key,
    service: EMAIL_TEMPLATE_SERVICES.ESIM,
    variables: {
      name,
      serviceName,
      country,
      dataPlan,
      validity,
      amount,
      iccid,
      branding: templateDetails?.branding || 'Peko',
      website: templateDetails?.baseUrl || 'https://peko.one/in',
      logo: templateDetails?.logo,
      ...v2LayoutVariables(templateDetails),
    },
    fallback: () => esimTopUpTemplate(name, serviceName, country, dataPack, validity, amount, iccid, type, templateDetails),
    fallbackSubject: subject,
    logTraceId,
  });
}

// Purchase-success email, self-purchase branch (1 call site below). Mirrors AE's
// own gateway/utils/emailTemplates/eSimTunz.js resolveEsimTunzBuySuccessEmail
// verbatim (same key name, same derived variables) — AE has a real v2 design for
// this one.
function esimBuySuccessPackageName(esimDetails) {
  const dataMBs = esimDetails?.dataMBs;
  const periodDays = esimDetails?.periodDays;
  let dataDisplay;
  if (Number(dataMBs) === 0) {
    dataDisplay = 'Unlimited';
  } else if (dataMBs >= 1024) {
    dataDisplay = (dataMBs / 1024).toFixed(1).replace(/\.0$/, '') + ' GB';
  } else {
    dataDisplay = dataMBs + ' MB';
  }
  return `${dataDisplay} - ${periodDays} Days`;
}

async function resolveEsimBuySuccessEmail(transactionId, amount, esimDetails, type, quantity, esimIds, qrCodes, templateDetails, subject, logTraceId) {
  const packageName = esimBuySuccessPackageName(esimDetails);
  const heading = type === "SIM" ? "eSIM Order Confirmation" : "eSIM-Topup Order Confirmation";
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.ESIM_TUNZ_BUY_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.ESIM,
    variables: {
      transactionId,
      amount,
      quantity,
      esimIds,
      packageName,
      heading,
      nameOfOperator: esimDetails?.name,
      branding: templateDetails?.branding || 'Peko',
      website: templateDetails?.baseUrl || 'https://peko.one/in',
      logo: templateDetails?.logo,
      ...v2LayoutVariables(templateDetails),
    },
    fallback: () => generateEsimBuySingleSuccessEmail(transactionId, amount, esimDetails, type, quantity, esimIds, qrCodes, templateDetails),
    fallbackSubject: subject,
    logTraceId,
  });
}

// Purchase-success email, gift/recipient-purchase branch (1 call site below, sent to
// the recipient instead of the purchaser). No AE reference design exists for this
// branch — newly invented key/variables here, following the self-purchase email above
// as the visual template.
async function resolveEsimRecipientSuccessEmail(recipientName, purchaserName, transactionId, esimDetails, qrCodes, templateDetails, subject, logTraceId) {
  const packageName = esimBuySuccessPackageName(esimDetails);
  return resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.ESIM_TUNZ_RECIPIENT_SUCCESS,
    service: EMAIL_TEMPLATE_SERVICES.ESIM,
    variables: {
      recipientName,
      purchaserName,
      transactionId,
      packageName,
      nameOfOperator: esimDetails?.name,
      // Below: same derivations the local fallback (generateEsimRecipientEmail) makes
      // internally, exposed here so an admin-managed template can use them too.
      greetingName: capitalizeEsimName(recipientName) || 'there',
      buyerName: capitalizeEsimName(purchaserName) || 'Your organisation',
      placedOn: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      periodDays: esimDetails?.periodDays,
      qrCodeHtml: buildEsimRecipientQrCodeHtml(qrCodes),
      branding: templateDetails?.branding || 'Peko',
      website: templateDetails?.baseUrl || 'https://peko.one/in',
      logo: templateDetails?.logo,
      ...v2LayoutVariables(templateDetails),
    },
    fallback: () => generateEsimRecipientEmail(recipientName, purchaserName, transactionId, esimDetails, qrCodes, templateDetails),
    fallbackSubject: subject,
    logTraceId,
  });
}

// Recipient of the eSIM details email when purchasing for an employee / someone else.
// Returns the normalized recipient or null (null → emails fall back to the purchaser).
const normalizePurchasingFor = (purchasingFor) => {
  if (!purchasingFor) return null;
  const recipientEmail = String(purchasingFor.email || "").trim();
  const isValidType = purchasingFor.type === "employee" || purchasingFor.type === "other";
  if (!isValidType || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) return null;
  return {
    type: purchasingFor.type,
    name: String(purchasingFor.name || "").trim(),
    email: recipientEmail,
    ...(purchasingFor.employeeId && { employeeId: purchasingFor.employeeId })
  };
};

exports.processPaymentInternal = async ({ credentialId, isSubCorporateUser, subCorporateUserId, orders, planIds, amount, account, paymentGatewayResponse, pgAmount, req, parentBatchId = null, totalVendorGroups = 1, vendorIndex = 0 }) => {
  const executionUnits = [];

  orders.forEach((order, index) => {
    const planId = planIds[index];
    for (let i = 0; i < order.quantity; i++) {
      executionUnits.push({ planId, country: order.country, countryCode: order.countryCode });
    }
  });

  const totalUnits = executionUnits.length;
  const batchId = parentBatchId !== null ? parentBatchId : Date.now();
  let txnCounter = 0;
  const bulkPaymentData = [];
  const planCache = new Map();

  for (const unit of executionUnits) {
    let plan = planCache.get(unit.planId);
    if (!plan) {
      plan = await getPlanByPlanId(unit.planId, credentialId);
      if (!plan) return { success: false, error: `Plan not found: ${unit.planId}` };
      planCache.set(unit.planId, plan);
    }

    const userIp =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      req.ip;

    bulkPaymentData.push({
      corporateTxnId: batchId + (vendorIndex * 100000) + txnCounter++,
      batchId,
      accessKey,
      amount: Number(plan.amount),
      account,
      planId: unit.planId,
      plan,
      country: unit.country,
      countryCode: unit.countryCode,
      userIp,
      paymentStatus: "PROCESSING",
      ...(isSubCorporateUser && { subCorporateId: subCorporateUserId }),
    });
  }

  try {
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId: req.user.packageId,
      corporateUserId: req.user.corporateId,
    });

    if (serviceDetails?.error) return { success: false, error: "Service unavailable" };

    const subtotal = bulkPaymentData.reduce((sum, item) => sum + Number(item.amount), 0);
    const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, subtotal, credentialId);
    const surcharge = await calculateAmountWithTax(surchargeWithoutTax);

    const userInfo = {
      id: req.user.id,
      packageId: req.user.packageId,
      registeredBy: req.user.registeredBy,
      email: req.user.email,
      username: req.user.username,
      name: req.user.name,
      corporateId: req.user.corporateId,
      zoho_id: req.user.zoho_id,
    };

    // For PG flow, derive key from Cashfree paymentRefId so handlePGCallback can find it
    // (handlePGCallback only knows paymentRefId, not the internal batchId). Wallet flow
    // keeps the original batchId-based key since the FE gets bulkPaymentData synchronously.
    // Cashfree order_id and Razorpay receipt are both `peko(Sub)_<paymentRefId>`.
    const gatewayOrderRef = paymentGatewayResponse?.[0]?.receipt || paymentGatewayResponse?.[0]?.order_id;
    const cashfreePaymentRefId = gatewayOrderRef?.replace(/^peko(Sub)?_/, '');
    const redisKey = cashfreePaymentRefId
      ? (parentBatchId !== null
          ? `esim:payment:order:${cashfreePaymentRefId}:vendor${vendorIndex}`
          : `esim:payment:order:${cashfreePaymentRefId}`)
      : (parentBatchId !== null
          ? `esim:payment:${batchId}:vendor${vendorIndex}`
          : `esim:payment:${batchId}`);

    try {
      const messagesToPublish = bulkPaymentData.map(item => {
        if (paymentGatewayResponse) {
          const surchargePaid = Number(pgAmount) - Number(amount);
          const perItemSurcharge = surchargePaid / totalUnits;
          item.pgAmount = item.amount + perItemSurcharge;
          item.paymentGatewayResponse = paymentGatewayResponse;
        }
        const jobRecipient = normalizePurchasingFor(req.body?.purchasingFor);
        return {
            ...item,
            quantity: 1,
            batchTotal: totalUnits,
            batchSurcharge: surcharge,
            paymentStatus: "PROCESSING",
            user: userInfo,
            redisKey,
            ...(jobRecipient && { purchasingFor: jobRecipient }),
            ...(parentBatchId !== null && { parentBatchId, totalVendorGroups }),
          };
      });

      // Enqueue jobs to Bull Queue for async processing
      customLog(req?.LogTraceId, 'info', { message: '[ESIM TUNZ] before tunzQueue.add loop', totalMessages: messagesToPublish.length });
      for (const message of messagesToPublish) {
        customLog(req?.LogTraceId, 'info', { message: '[ESIM TUNZ] adding job to tunzQueue', jobId: message.corporateTxnId });
        await tunzQueue.add(message, {
          jobId: String(message.corporateTxnId),
        });
        customLog(req?.LogTraceId, 'info', { message: '[ESIM TUNZ] job added to tunzQueue', jobId: message.corporateTxnId });
      }
    } catch (error) {
      return { success: false, error: `Bull Queue error: ${error.message}` };
    }

    let paymentMode;
    if (paymentGatewayResponse) {
      paymentMode = gatewayModeLabel(paymentGatewayResponse, (parseFloat(amount) + parseFloat(surcharge)).toFixed(2) - parseFloat(pgAmount).toFixed(2) != 0);
    } else {
      paymentMode = "WALLET";
    }

    const extractedData = bulkPaymentData.map(item => ({
      serviceName: operatorsData.eSIMTunz.type,
      account: item.account,
      surcharge,
      amount: item.amount,
      corporateTxnId: item.corporateTxnId,
      batchId: item.batchId,
      paymentStatus: item.paymentStatus,
      paymentMode,
    }));

    customLog(req?.LogTraceId, 'info', { message: '[ESIM TUNZ] before wallet.findOne', credentialId });
    const walletDetails = await wallet.findOne({ where: { credentialId }, attributes: ['balance'] });
    customLog(req?.LogTraceId, 'info', { message: '[ESIM TUNZ] after wallet.findOne', balance: walletDetails?.balance });

    customLog(req?.LogTraceId, 'info', { message: '[ESIM TUNZ] before setValue', redisKey });
    await setValue(redisKey, 60 * 5, JSON.stringify(extractedData));
    customLog(req?.LogTraceId, 'info', { message: '[ESIM TUNZ] after setValue', redisKey });

    // For mixed-vendor orders: register this child batch under the shared parentBatchId.
    // Stores batchId + vendor total so bulkPayment.js can collect iccids and compute
    // the correct grand total for a single combined email.
    if (parentBatchId !== null) {
      const vendorTotal = (Number(amount) + Number(surcharge)).toFixed(2);
      customLog(req?.LogTraceId, 'info', { message: '[ESIM TUNZ] before pushToList', parentBatchId });
      await pushToList(
        `mixed:batches:${parentBatchId}`,
        JSON.stringify({ batchId: String(batchId), totalAmount: vendorTotal }),
        60 * 10
      );
      customLog(req?.LogTraceId, 'info', { message: '[ESIM TUNZ] after pushToList', parentBatchId });
    }

    customLog(req?.LogTraceId, 'info', { message: '[ESIM TUNZ] processPaymentInternal returning success', redisKey });
    return { success: true, redisKey, walletBalance: Number(walletDetails['balance']), paymentMode, surcharge };
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return { success: false, error: error?.message || "Payment processing failed", shouldRefundPG: !!paymentGatewayResponse, batchId };
  }
};

exports.payment = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;

  customLog(req.LogTraceId, 'info', {
    message: '[ESIM TUNZ] payment controller entered',
    accessKey: req.body.accessKey,
    amount: req.body.amount,
    ordersCount: req.body.orders?.length,
  });

  const isSubCorporateUser =
    req.user.role === "CORPORATE_SUB_USER" &&
    req.user.subCorporateId &&
    req.user.subCorporateUsername;

  const subCorporateUserId = req.user.subCorporateId;
  const {
    orders,
    planIds,
    paymentGatewayResponse,
    pgAmount,
    amount,
    account,
    iccid
  } = req.body;

  // Extract planId from planIds if not provided (for backward compatibility and simplification)
  if (!req.body.planId && Array.isArray(planIds) && planIds.length > 0) {
    req.body.planId = planIds[0];
  }

  if (iccid !== undefined) {
    return exports.esimTopUpPayment(req, res, next);
  }

  if (!Array.isArray(orders) || !Array.isArray(planIds)) {
    return next(new ErrorResponse("orders and planIds must be arrays", 400));
  }

  if (orders.length !== planIds.length) {
    return next(
      new ErrorResponse("orders and planIds length mismatch", 400)
    );
  }

  orders.forEach((order, index) => {
    if (!order.quantity || order.quantity <= 0) {
      throw new ErrorResponse(`Invalid quantity at index ${index}`, 400);
    }
    if (!planIds[index]) {
      throw new ErrorResponse(`Missing planId at index ${index}`, 400);
    }
  });

  const executionUnits = [];

  orders.forEach((order, index) => {
    const planId = planIds[index];

    for (let i = 0; i < order.quantity; i++) {
      executionUnits.push({
        planId,
        country: order.country,
        countryCode: order.countryCode
      });
    }
  });

  const totalUnits = executionUnits.length;

  // Never fail the payment over purchasingFor — the Cashfree path re-enters here after
  // money is already collected; on anything invalid the email falls back to the purchaser.
  const normalizedRecipient = normalizePurchasingFor(req.body.purchasingFor);
  if (req.body.purchasingFor && !normalizedRecipient) {
    customLog(req?.LogTraceId, "error", {
      message: "[ESIM TUNZ] purchasingFor ignored (unsupported type or invalid email)",
      purchasingForType: req.body.purchasingFor?.type,
      totalUnits
    });
  }
  if (normalizedRecipient) {
    req.body.purchasingFor = normalizedRecipient;
  } else {
    delete req.body.purchasingFor;
  }

  if (totalUnits === 1) {
    req.body.planId = executionUnits[0].planId;
    req.body.country = executionUnits[0].country;
    req.body.quantity = 1;
    req.body.countryCode = executionUnits[0].countryCode
    return exports.singleBillPayment(req, res, next);
  }

  const result = await exports.processPaymentInternal({
    credentialId,
    isSubCorporateUser,
    subCorporateUserId,
    orders,
    planIds,
    amount,
    account,
    paymentGatewayResponse,
    pgAmount,
    req,
  });

  if (!result.success) {
    if (result.shouldRefundPG) {
      req.body.corporateTxnId = result.batchId;
      let refundPGResponse = await cancelCardTransaction(req, paymentGatewayResponse, accessKey);
      if (refundPGResponse?.state !== 'REVERSED') {
        await paymentGateWayRefundFailureEmail(req, operatorsData.eSIMTunz.type, operatorsData.eSIMTunz.type);
      }
      const walletDetails = await wallet.findOne({ where: { credentialId }, attributes: ["balance"] });
      return res.status(500).json({
        status: false,
        message: "Something went wrong",
        data: { corporateFinalBalance: walletDetails["balance"] },
        responseCode: "001",
      });
    }
    return next(new ErrorResponse("Service not available at this moment", 400));
  }

  return res.status(200).json({
    status: true,
    message: "Payment started processing",
    responseCode: '000',
    data: { bulkPaymentData: result.redisKey, corporateFinalBalance: result.corporateFinalBalance, paymentMode: result.paymentMode },
  });
});

exports.singleBillPayment = asyncHandler(async (req, res, next) => {
  const type = req.body.type || "SIM";
  const credentialId = req.user.id
  const packageId = req.user.packageId
  const corporateUserId = req.user.corporateId
  const name = req.user.name
  const emailId = req.user.email
  const subCorporateEmail = req.user.subCorporateEmail;
  const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;
  let plan;
  let reportData;
  let serviceDetails;

  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  const {
    planId,
    quantity = 1,
    amount,
    account,
    transactionId
  } = req.body;
  let accessKey = req.body.accessKey
  try {
    customLog(req?.LogTraceId, "info", { message: 'message received in singleBillPayment', body: req.body, user: req.user })
    // trust payment() to pass correct single-unit payload
    console.log({ planId, accessKey, amount, account })
    if (!planId || !accessKey || !amount) {
      return next(
        new ErrorResponse("Invalid single payment payload", 400)
      );
    }

    if (quantity !== 1) {
      return next(
        new ErrorResponse("singleBillPayment supports only single quantity", 400)
      );
    }

    // Only generate when not already provided. PG webhook (handlePendingTransactions)
    // sets corporateTxnId = paymentRefId so handlePGCallback's txn lookup matches.
    // Matches prepaid.js pattern which just trusts req.body.corporateTxnId.
    if (!req.body.corporateTxnId) {
        req.body.batchId = parseInt(new Date().valueOf())
        req.body.corporateTxnId = req.body.batchId + 1
    } else if (!req.body.batchId) {
        req.body.batchId = Number(req.body.corporateTxnId) - 1
    }


    // req.user = req.body.user
    let transactionCategory = 'Travel'

    plan = await getPlanByPlanId(planId, credentialId)
    if (!plan) {
      return next(new ErrorResponse("Planid not found", 500));
    }

    let providerId = transactionId
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId
    })
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
    }
    accessKey = accessKey === 'etisalat_bill' ? 'etisalat_direct' : accessKey // payoll 
    let URL = serviceDetails.vendor.apiUrl
    let vendorUrl = `${URL}/gigastore/activations/register`;

    let commissionType = serviceDetails.commissionType
    let cashbackType = serviceDetails.cashbackType
    let serviceOperatorId = serviceDetails.id

    //----set 0 when bulk upload enabled for this service ------
    const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
    const surcharge = await calculateAmountWithTax(surchargeWithoutTax)
    // const surcharge = serviceDetails.surcharge
    let providerCommission = serviceDetails.providerCommission
    let corporateCashback = serviceDetails.cashback

    const planDetails = [{
      name: plan.name ? `eSIM : ${plan.name}` : "eSIM Plan",
      commissionMode: plan.commissionMode,
      commissionType: plan.commissionType,
      commission: plan.commission,
      fixedCommissionPerTransaction: plan.fixedCommissionPerTransaction,
      isCommissionInclGST: plan.isCommissionInclGST,
      isCommissionConfigured: plan.isCommissionConfigured,
      amount: Number(plan.amount),
      quantity: 1,
    }];

    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse)
      ? req.body.paymentGatewayResponse[0]
      : req.body?.paymentGatewayResponse;

    serviceDetails.transactionReportRule = "SERVICE_WITH_ONLY_RECEIPT_AND_SURCHARGE" //ONLY TEMP
    reportData = await computeJournalData({
      serviceDetails,
      pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
      amount: Number(amount),
      paymentMethod: pgResponse?.payment_method || {},
      partnerDetails,
      paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
      couponTotalDiscount: req.body.couponTotalDiscount,
      planDetails,
      corporateState: req.user.state,
      credentialId,
    });
    // first we will  do transaction
    let corporateTxnId = req.body.corporateTxnId
    let subCorporateUserId;
    if (req.user.role === 'CORPORATE_SUB_USER') {
      subCorporateUserId = req.user.subCorporateId;
    }
    let transactionResponse = {}
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
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
        pgResponse: req.body.paymentGatewayResponse,
        surcharge,
        batchId: req.body.batchId,
        reportData,
        partnerId: req.user.registeredBy,
        subCorporateUserId,
        couponCode: req.body.couponCode,
        corporateUserId,
      })
    } else {
      transactionResponse = await createWalletTransaction({
        providerId,
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        accountNo: account,
        transactionCategory,
        surcharge,
        amount,
        commissionType,
        cashbackType,
        providerCommission,
        batchId: req.body.batchId,
        reportData,
      })
      transactionResponse.couponDiscount = 0
    }
    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
      customLog(req?.LogTraceId, "info", { message: 'error in transactionResponse' })
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
    }

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

    let token = await getToken(serviceDetails.vendor, accessKey);


    if (!token) {
      customLog(req?.LogTraceId, "error", {
        message: "Failed to fetch vendor token"
      });

      return next(
        new ErrorResponse("Unable to authenticate with vendor service", 500)
      );
    }
    /* ---------------- VENDOR WALLET CHECK ---------------- */


    let vendorBalance = await getVendorWalletBalance(URL, token);

    if (vendorBalance === null) {
      customLog(req?.LogTraceId, "error", {
        message: "Unable to fetch vendor wallet balance"
      });

      return next(
        new ErrorResponse("Unable to verify vendor wallet balance", 400)
      );
    }

    const requiredVendorAmount = Number(plan.vendorWholesalePriceUSD || 0);
    const SAFETY_BUFFER = 1; // USD

    if (vendorBalance < requiredVendorAmount + SAFETY_BUFFER) {

      customLog(req?.LogTraceId, "error", {
        message: "Vendor wallet balance insufficient",
        vendorBalance,
        requiredVendorAmount: requiredVendorAmount + SAFETY_BUFFER
      });

      let updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: "Not Available",
        message: "Vendor wallet balance insufficient",
        registeredById: req?.user?.registeredBy,
        orderResponse: JSON.stringify({
          error: "Vendor wallet balance insufficient"
        })
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

      return next(
        new ErrorResponse("Service temporarily unavailable. Please try again later.", 400)
      );
    }

    // const invoice_id = await createZohoInvoice(customer_id,undefined , corporateTxnId, surcharge, parseFloat(amount).toFixed(2))

    let eSIMBody = {
      inventoryItemId: req.body.planId,
      metatag: String(corporateTxnId),
      userIp: req.headers['x-forwarded-for']?.split(',')[0] ||
        req.socket?.remoteAddress ||
        req.ip,
      // Regional orders carry a 3-letter region code (EUR/ASA/...) which is not a valid userCountry
      userCountry: req.body.countryCode?.length === 2 ? req.body.countryCode : "NP",
      activationMode: "FIRST_USE"
    };

    const config = {
      method: "post",
      url: vendorUrl,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      },
      data: eSIMBody,
    };

    let result;
    try {
      customLog(req?.LogTraceId, "info", { config: config }, "VENDOR")
      if (process.env.NODE_ENV === 'production') {
        result = await axios(config)
        customLog(req?.LogTraceId, "info", { response: result?.data }, "VENDOR")
        if (
          !result ||
          (
            result?.data &&
            (
              result.data.errorcode ||
              result.data.errorCode
            )
          )
        ) {
          throw new Error("Payment provider returned an error");
        }
      }
      else {
        result = { data: buildMockActivationResponse(plan) };
      }
      const esimProfile = result.data.esimProfile;
      const vendorCustomerUid =
        result?.data?.customer?.uid;
      const existing = await esimProfiles.findOne({
        where: { iccid: esimProfile.iccid }
      })
      if (!existing) {
        await createEsimProfile({
          credentialId,
          corporateUserId,
          customerUid: vendorCustomerUid,
          esimUid: esimProfile.uid,
          iccid: esimProfile.iccid,
          activationCode: esimProfile.activationCode,
          planId: req.body.planId,
          country: req.body.country,
          corporateTxnId,
          state: esimProfile.state,
          installationUrl: esimProfile.installationUrl,
        });
      }
    } catch (error) {
      // Log vendor API error for debugging - with specific error type for easy searching
      let errorType = 'UNKNOWN_ERROR';
      let searchMessage = '[ESIMTUNZ] Vendor API Error';

      if (error?.message?.includes('timeout')) {
        errorType = 'TIMEOUT_ERROR';
        searchMessage = '[ESIMTUNZ-TUNZ.IO] VENDOR_API_TIMEOUT - Request exceeded 30 seconds';
      } else if (error?.code === 'ECONNREFUSED') {
        errorType = 'CONNECTION_REFUSED';
        searchMessage = '[ESIMTUNZ-TUNZ.IO] VENDOR_CONNECTION_REFUSED - Cannot reach vendor server';
      } else if (error?.code === 'ENOTFOUND') {
        errorType = 'DNS_RESOLUTION_ERROR';
        searchMessage = '[ESIMTUNZ-TUNZ.IO] VENDOR_DNS_ERROR - Cannot resolve vendor hostname';
      } else if (error?.response?.status) {
        errorType = `HTTP_${error?.response?.status}`;
        searchMessage = `[ESIMTUNZ-TUNZ.IO] VENDOR_HTTP_ERROR_${error?.response?.status} - ${error?.response?.statusText}`;
      } else {
        searchMessage = '[ESIMTUNZ-TUNZ.IO] VENDOR_REQUEST_FAILED - Network or parsing error';
      }

      customLog(req?.LogTraceId, 'error', {
        message: searchMessage,
        errorType,
        corporateTxnId: req.body.corporateTxnId,
        accessKey,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorStatus: error?.response?.status,
        errorStatusText: error?.response?.statusText,
        vendorUrl: config?.url,
        vendorResponse: result?.data,
        vendorResponseError: error?.response?.data,
        isTimeout: error?.message?.includes('timeout'),
        isNetworkError: error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND'
      });
      if (error.response) {
        let updateDetails = {}

        // handle all vendor API errors
        if (error.response.status) {

          if (process.env.NODE_ENV === 'production') {
            // cleverTap.uploadEvent({
            //   eventName: "Transactions",
            //   eventData: {
            //     Status: "Payment Failure",
            //   },
            //   email: emailId,
            // });
          }

          let corporateTxnId = req.body.corporateTxnId

          updateDetails = {
            corporateTxnId,
            status: "FAILURE",
            providerId: "Not Available",
            message: "Payment Failed",
            registeredById: req?.user?.registeredBy,
            orderResponse: JSON.stringify(error.response.data || {}),
            couponId: transactionResponse.couponId
          }
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
          let subject = 'Your eSIM purchase unsuccessful. Transaction failed'// Set email subject
          let to, cc;

          if (subCorporateEmail) {
            to = subCorporateEmail;
            cc = emailId;
          } else {
            to = emailId;
            cc = undefined;
          }

          let name = req.user.name

          const resolvedBuyFail1 = await resolveEsimBuyPaymentFailedEmail(
            name,
            "eSIM",
            plan.country,
            plan.dataMBs,
            plan.periodDays,
            amount,
            undefined,
            partnerDetails,
            subject,
            req?.LogTraceId
          );
          subject = resolvedBuyFail1.subject;
          const body = resolvedBuyFail1.html;

          emailer.email({ to, cc, subject, body }, function () {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
          });
        }
      }
    }
    let updateDetails = {}
    if (
      !result ||
      (
        result?.data &&
        (
          result.data.errorcode ||
          result.data.errorCode ||
          result.status >= 400
        )
      )
    ) {
      customLog(req?.LogTraceId, "error", { data: result?.data })

      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: "Not Available",
        message: "Payment Failed",
        registeredById: req?.user?.registeredBy,
        orderResponse: JSON.stringify(result?.data || {}),
        couponId: transactionResponse.couponId
      }
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

      // esimDetails = result.data
      const paymentDetails = {
        transactionId: corporateTxnId,
        account: account,
        amount: (parseFloat(amount) + parseFloat(surcharge) - transactionResponse.couponDiscount).toFixed(2),
      };
      const notificationData = {
        notificationTitle: `${type == "SIM" ? "e-SIM Payment" : "e-SIM top-up "} unsuccessful`,
        notificationBrief: `${type == "SIM" ? "e-SIM Payment" : "e-SIM top-up "} of ₹ ${paymentDetails.amount} was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
        notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN'
      };

      createNotification(notificationData);
      const serviceUrl = partnerDetails?.baseUrl;
      let to, cc;
      if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = emailId;
      } else {
        to = emailId;
        cc = undefined; // or omit if not needed
      }
      let subject = 'Payment failed'// Set email subject
      const resolvedEsimFailed1 = await resolveEsimCommonFailedEmail(name, `${type == "SIM" ? "eSIM" : "eSIM-Topup"}`, serviceUrl, partnerDetails, subject, req?.LogTraceId);
      subject = resolvedEsimFailed1.subject;
      const body = resolvedEsimFailed1.html;
      emailer.email({ to, cc, subject, body }, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      });
      const walletDetails = await wallet.findOne({
        where: { credentialId }, attributes: ['balance']
      })
      return res.status(400).json({
        status: false,
        message: 'Payment Failed',
        responseCode: '001',
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails['balance']
        }
      })

    } else {
      updateDetails = {
        corporateTxnId,
        providerId:
          result?.data?.activatedItem?.uid ||
          result?.data?.orderId ||
          "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        // orderResponse: JSON.stringify(result?.data || {})
        orderResponse: JSON.stringify({
          ...result?.data, // Spread existing data
          planId: req.body.planId, // Add the planid field
          customerUid: result?.data?.customer?.uid,
          country: req.body.country,
          ...(req.body.purchasingFor && { purchasedFor: req.body.purchasingFor })
        })
      }
      await updateWalletTransaction(updateDetails)


      const paymentDetails = {
        transactionId: corporateTxnId,
        account: account,
        amount: (parseFloat(amount) + parseFloat(surcharge) - transactionResponse.couponDiscount).toFixed(2),
      };

      let to, cc;
      const recipient = req.body.purchasingFor;
      if (recipient?.email) {
        // Purchased for someone else: eSIM details go to them, purchaser in CC
        to = recipient.email;
        cc = subCorporateEmail || emailId;
      } else if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = emailId;
      } else {
        to = emailId;
        cc = undefined; // or omit if not needed
      }
      let subject = recipient?.email ? generateEsimRecipientSubject(plan) : "Payment Successful"; // Set email subject

      const esimProfile = result.data.esimProfile;

      let qrCode = null;
      try {
        qrCode = await generateTunzQRCode([esimProfile]);
      } catch (qrError) {
        customLog(req?.LogTraceId, "error", { message: "QR code generation failed after successful payment", error: qrError?.message, iccid: esimProfile?.iccid });
        qrCode = { iccid: esimProfile?.iccid, qrCodeUrl: null };
      }
      const qrCodes = [qrCode];
      const esimIds = esimProfile.iccid;
      const resolvedBuySuccess = recipient?.email
        ? await resolveEsimRecipientSuccessEmail(recipient.name, req.user.name, paymentDetails.transactionId, plan, qrCodes, partnerDetails, subject, req?.LogTraceId)
        : await resolveEsimBuySuccessEmail(paymentDetails.transactionId, paymentDetails.amount, plan, type, quantity, esimIds, qrCodes, partnerDetails, subject, req?.LogTraceId); // instead of activation key entered message
      subject = resolvedBuySuccess.subject;
      const body = resolvedBuySuccess.html;
      const path = require('path');
      const filePath = path.resolve(__dirname, "../../public/assets/pdf/eSIM Installation guideline.pdf");
      const isPgFunded = Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse");
      let invoiceAttachments = [];
      try {
        invoiceAttachments = await generateOrderInvoiceAttachments({
          amount,
          surcharge,
          couponDiscount: transactionResponse.couponDiscount || 0,
          corporateTxnId,
          orderId: transactionResponse.orderId,
          paymentType: "eSIM",
          description: plan?.name || "eSIM",
          credentialId,
          pgAmount: isPgFunded ? req.body.pgAmount : null,
          paymentMethod: pgResponse?.payment_method,
          vendor: serviceDetails?.vendor,
          commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
          planDetails,
          commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
          traceId: req?.LogTraceId,
        });
      } catch (invoiceError) {
        customLog(req?.LogTraceId, "error", { message: "Invoice attachment generation failed after successful payment", error: invoiceError?.message });
      }
      emailer.emailWithMultipleAttachment(to, subject, body, [{ filename: "eSIM Installation guideline.pdf", path: filePath }, ...invoiceAttachments], cc, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      });
      const notificationData = {
        notificationTitle: `${type == "SIM" ? "e-SIM Payment" : "e-SIM top-up "} successful`,
        notificationBrief: `${type == "SIM" ? "e-SIM Payment" : "e-SIM top-up "} of ₹ ${paymentDetails.amount} was successful. Transaction ID: ${paymentDetails.transactionId}.`,
        notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
        notificationCategory: 'CORPORATE', // Replace with the relevant category
        notificationBy: 'ADMIN' // Replace with the user or system that triggered the notification
      };

      createNotification(notificationData);
      if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        notifyPGPaymentConfirmed(credentialId, req.body.batchId, corporateTxnId).catch(() => {});
      }
      return res.status(200).json({
        status: true,
        message: 'Payment Successful',
        responseCode: '000',
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        }
      })
    }

  } catch (error) {
    console.log("ERROR", error)
    if (error.response) {
      let updateDetails = {}
      if (error.response.status >= 400) {
        if (process.env.NODE_ENV === 'production') {
          // cleverTap.uploadEvent({
          //   eventName: "Transactions",
          //   eventData: {
          //     Status: "Payment Failure",
          //   },
          //   email: emailId,
          // });
        }
        let corporateTxnId = req.body.corporateTxnId
        updateDetails = {
          corporateTxnId,
          status: "FAILURE",
          providerId: "Not Available",
          message: "Payment Failed",
          registeredById: req?.user?.registeredBy,
          orderResponse: JSON.stringify(error.response.data || {})
        }
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
        let subject = 'Transaction failed: Unable to complete your eSIM purchase'// Set email subject
        let to, cc;

        if (subCorporateEmail) {
          to = subCorporateEmail;
          cc = emailId;
        } else {
          to = emailId;
          cc = undefined; // or omit if not needed
        }
        let name = req.user.name
        const resolvedBuyFail2 = await resolveEsimBuyPaymentFailedEmail(name, "eSIM", plan.country, plan.dataMBs, plan.periodDays, amount, undefined, partnerDetails, subject, req?.LogTraceId);
        subject = resolvedBuyFail2.subject;
        const body = resolvedBuyFail2.html;
        emailer.email({ to, cc, subject, body }, function () {
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
      }
    }
    else {
      const failureUpdateDetails = {
        corporateTxnId: req.body.corporateTxnId,
        status: "FAILURE",
        providerId: "Not Available",
        message: "Payment Failed",
        registeredById: req?.user?.registeredBy,
        orderResponse: JSON.stringify({ error: error.message })
      };
      if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        //needed to refund the pg amount and handle pg payment failure
        let refundPGResponse = await cancelCardTransaction(req, req.body.paymentGatewayResponse, accessKey)
        if (refundPGResponse?.state !== 'REVERSED') {
          await paymentGateWayRefundFailureEmail(req, 'Esim', 'Esim')
        }
        await refundWalletTransaction(failureUpdateDetails);
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
        await refundWalletTransaction(failureUpdateDetails);
        const walletDetails = await wallet.findOne({
          where: { credentialId },
          attributes: ['balance'],
        });
        return res.status(400).json({
          status: false,
          message: 'Service not available at this moment',
          responseCode: '001',
          data: { corporateFinalBalance: walletDetails['balance'] },
        });
      }
    }
  }
})

async function generateTunzQRCode(esimProfile) {
  try {
    if (!Array.isArray(esimProfile) || esimProfile.length === 0) {
      throw new Error("Invalid esim profile");
    }

    const { iccid, activationCode } = esimProfile[0];

    const qrBase64 = await QRCode.toDataURL(activationCode);

    const base64Image = qrBase64.replace(/^data:image\/png;base64,/, "");

    const qrCodeUrl = await uploadFile(base64Image, "esims", "png");

    return {
      iccid,
      activationCode,
      qrCodeUrl
    };
  } catch (error) {
    console.error("Error generating Tunz QR Code:", error?.response?.data || error?.message);

    throw new Error("Failed to generate Tunz QR Code");
  }
}

// Staging mock mirrors the actually purchased plan so order history stays consistent
const buildMockActivationResponse = (plan) => {
  const sizeMBs = Number(plan?.dataMBs) || 10;
  const size = sizeMBs >= 1024
    ? { sizeValue: sizeMBs / 1024, sizeUnit: "GB" }
    : { sizeValue: sizeMBs, sizeUnit: "MB" };
  const validityDays = Number(plan?.periodDays) || 30;

  return {
  status: "success",
  activatedItem: {
    balance: {
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString(),
      activationMode: "FIRST_USE",
      name: plan?.name || "Worldwide 10MB Test",
      size,
      availableBalance: size,
      validitySize: validityDays,
      validityUnit: "days"
    },
    uid: `test-item-${Date.now()}`,
    metatag: "Mock activation",
    salesChannel: "API",
    salesChannelTypeCode: "API",
    activationType: "DATA_PLAN",
    purchasePrice: {
      sortIndex: 1,
      priceValue: 0.01,
      currencyCode: "USD"
    },
    retailPrice: {
      sortIndex: 1,
      priceValue: 0.01,
      currencyCode: "USD"
    }
  },
  customer: {
    email: "test@test.com",
    uid: `customer-${Date.now()}`,
    profileUrl: "mock-profile"
  },
  esimProfile: {
    iccid: `890000000000${Math.floor(Math.random() * 100000)}`,
    uid: `esim-${Date.now()}`,
    imsi: `00101${Math.floor(Math.random() * 100000000)}`,
    activationCode: `LPA:1$mock.server$${Math.random().toString(36).substring(2, 10)}`,
    appleUniversalLink: "https://mock-install-link.apple",
    installationUrl: "https://mock-install-link",
    lastSeen: new Date().toISOString(),
    activatedAt: new Date().toISOString(),
    state: "RELEASED"
  }
  };
};

exports.esimTopUpPayment = asyncHandler(async (req, res, next) => {
  const type = req.body.type || "topup";
  const credentialId = req.user.id
  const packageId = req.user.packageId
  const corporateUserId = req.user.corporateId
  const name = req.user.name
  const emailId = req.user.email
  const planId = req.body.planId
  const iccid = req.body.iccid
  const subCorporateEmail = req.user.subCorporateEmail;
  const isSubCorporateUser = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername;
  let plan;
  let reportData;
  let serviceDetails;
  const { amount } = req.body;
  let partnerDetails;
  if (req?.user?.registeredBy) {
    partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
    customLog(req?.LogTraceId, "info", { message: "esimTopUpPayment=asyncHandler ~ partnerDetails", partnerDetails })
  } else {
    partnerDetails = await fetchPartnerDetails();
  }
  try {
    // Only generate when not already provided. PG webhook (handlePendingTransactions)
    // sets corporateTxnId = paymentRefId so handlePGCallback's txn lookup matches.
    // Overwriting it was the cause of the "always pending" bug for eSIM PG payments.
    if (!req.body.corporateTxnId) {
        req.body.corporateTxnId = parseInt(new Date().valueOf())
    }
    let accessKey = req.body.accessKey
    let transactionCategory = 'Travel'
    const { transactionId, account, amount, } = req.body;

    plan = await getPlanByPlanId(planId, credentialId)
    if (!plan) {
      return next(new ErrorResponse("Planid not found", 500));
    }

    let providerId = transactionId
    serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId
    })
    if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
    }
    accessKey = accessKey === 'etisalat_bill' ? 'etisalat_direct' : accessKey // payoll 
    let URL = serviceDetails.vendor.apiUrl
    let commissionType = serviceDetails.commissionType
    let cashbackType = serviceDetails.cashbackType
    let serviceOperatorId = serviceDetails.id

    //----set 0 when bulk upload enabled for this service ------
    const surchargeWithoutTax = await calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount, credentialId)
    const surcharge = await calculateAmountWithTax(surchargeWithoutTax)
    // const surcharge = serviceDetails.surcharge
    let providerCommission = serviceDetails.providerCommission
    let corporateCashback = serviceDetails.cashback
    const planDetails = [{
      name: plan.name ? `eSIM : ${plan.name}` : "eSIM Plan",
      commissionMode: plan.commissionMode,
      commissionType: plan.commissionType,
      commission: plan.commission,
      fixedCommissionPerTransaction: plan.fixedCommissionPerTransaction,
      isCommissionInclGST: plan.isCommissionInclGST,
      isCommissionConfigured: plan.isCommissionConfigured,
      amount: Number(plan.amount),
      quantity: 1,
    }];

    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse)
      ? req.body.paymentGatewayResponse[0]
      : req.body?.paymentGatewayResponse;

    serviceDetails.transactionReportRule = "SERVICE_WITH_ONLY_RECEIPT_AND_SURCHARGE" //ONLY TEMP
    reportData = await computeJournalData({
      serviceDetails,
      pgAmount: req.body.paymentGatewayResponse ? Number(req.body.pgAmount || 0) : 0,
      amount: Number(amount),
      paymentMethod: pgResponse?.payment_method || {},
      partnerDetails,
      paymentGatewayName: pgResponse?.paymentGatewayName || 'Cashfree',
      couponTotalDiscount: req.body.couponTotalDiscount,
      planDetails,
      corporateState: req.user.state,
      credentialId,
    });
    // first we will  do transaction
    let corporateTxnId = req.body.corporateTxnId
    let transactionResponse = {}
    if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
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
        pgResponse: req.body.paymentGatewayResponse,
        surcharge,
        batchId: req.body.batchId,
        reportData,
        couponCode: req.body.couponCode,
        corporateUserId,
        partnerId: req.user.registeredBy
      })
    } else {
      transactionResponse = await createWalletTransaction({
        providerId,
        corporateTxnId,
        credentialId,
        serviceOperatorId,
        corporateCashback,
        accountNo: account,
        transactionCategory,
        surcharge,
        amount,
        commissionType,
        cashbackType,
        providerCommission,
        batchId: req.body.batchId,
        reportData,
      })
    }
    if (transactionResponse && Object.prototype.hasOwnProperty.call(transactionResponse, 'error')) {
      customLog(req?.LogTraceId, "info", { message: "error in transactionResponse" })
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
    }

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

    const token = await getToken(serviceDetails.vendor, accessKey);
    const vendorBalance = await getVendorWalletBalance(URL, token);

    if (vendorBalance === null) {
      return next(new ErrorResponse("Unable to verify vendor wallet balance", 400));
    }

    const requiredVendorAmount = Number(plan.vendorWholesalePriceUSD || 0);

    if (Number(vendorBalance) < requiredVendorAmount) {
      customLog(req?.LogTraceId, "error", {
        message: "Vendor wallet balance is insufficient. Please contact support."
      });
      return next(
        new ErrorResponse(
          "Vendor wallet balance is insufficient. Please contact support.",
          400
        )
      );
    }
    if (!token) {
      customLog(req?.LogTraceId, "error", {
        message: "Failed to fetch Tunz token"
      });
      return next(new ErrorResponse('Something went wrong. Please try again later.', 400));
    }
    // const invoice_id = await createZohoInvoice(customer_id,serviceDetails.zoho_item_id , corporateTxnId, surcharge, parseFloat(amount).toFixed(2))
    const customerUid = await findCustomerUidByIccid(iccid);

    if (!customerUid) {
      return next(new ErrorResponse("Customer UID not found for top-up", 400));
    }
    
    const eSIMBody = {
      inventoryItemId: req.body.planId,
      metatag: String(corporateTxnId),
      customerUid,
      activationMode: "FIRST_USE"
    }
    let vendorUrl = `${URL}/gigastore/activations/top-up`
    let config = {
      method: "post",
      url: vendorUrl,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      data: eSIMBody,
    };
    let result;
    try {
      if (process.env.NODE_ENV === 'production') {
        result = await axios(config)
        if (
          !result ||
          (
            result?.data &&
            (
              result.data.errorcode ||
              result.data.errorCode
            )
          )
         ) {
          throw new Error("Payment provider returned an error");
        }
      }
      else {
        result = buildMockedRespTopUp(plan)
      }
    } catch (error) {
      // Log vendor API error for topup - with specific error type for easy searching
      let errorType = 'UNKNOWN_ERROR';
      let searchMessage = '[ESIMTUNZ-TOPUP] Vendor API Error';

      if (error?.message?.includes('timeout')) {
        errorType = 'TIMEOUT_ERROR';
        searchMessage = '[ESIMTUNZ-TUNZ.IO-TOPUP] VENDOR_API_TIMEOUT - Request exceeded timeout';
      } else if (error?.code === 'ECONNREFUSED') {
        errorType = 'CONNECTION_REFUSED';
        searchMessage = '[ESIMTUNZ-TUNZ.IO-TOPUP] VENDOR_CONNECTION_REFUSED - Cannot reach vendor server';
      } else if (error?.code === 'ENOTFOUND') {
        errorType = 'DNS_RESOLUTION_ERROR';
        searchMessage = '[ESIMTUNZ-TUNZ.IO-TOPUP] VENDOR_DNS_ERROR - Cannot resolve vendor hostname';
      } else if (error?.response?.status) {
        errorType = `HTTP_${error?.response?.status}`;
        searchMessage = `[ESIMTUNZ-TUNZ.IO-TOPUP] VENDOR_HTTP_ERROR_${error?.response?.status} - ${error?.response?.statusText}`;
      } else {
        searchMessage = '[ESIMTUNZ-TUNZ.IO-TOPUP] VENDOR_REQUEST_FAILED - Network or parsing error';
      }

      customLog(req?.LogTraceId, 'error', {
        message: searchMessage,
        errorType,
        transactionType: 'TOPUP',
        corporateTxnId: req.body.corporateTxnId,
        iccid,
        accessKey,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorStatus: error?.response?.status,
        errorStatusText: error?.response?.statusText,
        vendorUrl,
        vendorResponse: result?.data,
        vendorResponseError: error?.response?.data,
        isTimeout: error?.message?.includes('timeout'),
        isNetworkError: error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND'
      });

      if (error.response) {
        let updateDetails = {}
        if (error.response.status >= 400) {
          if (process.env.NODE_ENV === 'production') {
            // cleverTap.uploadEvent({
            //   eventName: "Transactions",
            //   eventData: {
            //     Status: "Payment Failure",
            //   },
            //   email: emailId,
            // });
          }
          let corporateTxnId = req.body.corporateTxnId
          updateDetails = {
            corporateTxnId,
            status: "FAILURE",
            providerId: "Not Available",
            message: "Payment Failed",
            registeredById: req?.user?.registeredBy,
            orderResponse: JSON.stringify(error.response.data || {}),
            couponId: transactionResponse.couponId

          }
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
          let subject = 'Your eSIM top-up unsuccessful. Transaction failed'// Set email subject
          let to, cc;
          if (subCorporateEmail) {
            to = subCorporateEmail;
            cc = emailId;
          } else {
            to = emailId;
            cc = undefined; // or omit if not needed
          }
          let name = req.user.name

          const resolvedTopupFail2 = await resolveEsimTopUpEmail(name, "eSIM", plan.country, plan.dataMBs, plan.periodDays, amount, iccid, 'fail', partnerDetails, subject, req?.LogTraceId);
          subject = resolvedTopupFail2.subject;
          const body = resolvedTopupFail2.html;
          emailer.email({ to, cc, subject, body }, function () {
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
        }
      }
    }
    let updateDetails = {}
    if (
      !result ||
      (
        result?.data &&
        (
          result.data.errorcode ||
          result.data.errorCode
        )
      )
    ) {
      customLog(req?.LogTraceId, "info", { data: result?.data })
      // must use this in transaction events
      // cleverTap.uploadEvent({
      //   eventName: "Transactions",
      //   eventData: {
      //     Status: "Payment Failure",
      //   },
      //   email: emailId,
      // },partnerDetails);
      updateDetails = {
        corporateTxnId,
        status: "FAILURE",
        providerId: "Not Available",
        message: "Payment Failed",
        registeredById: req?.user?.registeredBy,
        orderResponse: JSON.stringify(result?.data || {}),
        couponId: transactionResponse.couponId
      }
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

      // esimDetails = result.data
      const paymentDetails = {
        transactionId: corporateTxnId,
        account: account,
        amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
      };
      const notificationData = {
        notificationTitle: `${type == "SIM" ? "e-SIM Payment" : "e-SIM top-up "} unsuccessful`,
        notificationBrief: `${type == "SIM" ? "e-SIM Payment" : "e-SIM top-up "} of ₹ ${paymentDetails.amount} was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
        notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
        notificationCategory: 'CORPORATE',
        notificationBy: 'ADMIN'
      };

      createNotification(notificationData);
      const serviceUrl = partnerDetails?.baseUrl;
      let to, cc;
      if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = emailId;
      } else {
        to = emailId;
        cc = undefined; // or omit if not needed
      }
      let subject = 'Payment failed'// Set email subject
      const resolvedEsimFailed2 = await resolveEsimCommonFailedEmail(name, `${type == "SIM" ? "eSIM" : "eSIM-Topup"}`, serviceUrl, partnerDetails, subject, req?.LogTraceId);
      subject = resolvedEsimFailed2.subject;
      const body = resolvedEsimFailed2.html;
      emailer.email({ to, cc, subject, body }, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      });
      const walletDetails = await wallet.findOne({
        where: { credentialId }, attributes: ['balance']
      })
      return res.status(400).json({
        status: false,
        message: 'Payment Failed',
        responseCode: '001',
        data: {
          ...result?.data,
          corporateFinalBalance: walletDetails['balance']
        }
      })
    } else {
      // must use this in transaction events
      // cleverTap.uploadEvent({
      //   eventName: "Transactions",
      //   eventData: {
      //     Status: "Payment Success",
      //   },
      //   email: emailId,
      // },partnerDetails);
      // Extract country from orders array (sent from frontend)
      const countryFromOrder = req.body.orders?.[0]?.country || plan.country;

      customLog(req?.LogTraceId, "info", {
        message: "Tunz top-up payment success",
        hasEsimProfile: !!result?.data?.esimProfile,
        esimProfileValue: result?.data?.esimProfile,
        hasActivatedItem: !!result?.data?.activatedItem,
        iccid: iccid
      });

      updateDetails = {
        corporateTxnId,
        providerId: result.data?.activatedItem?.uid || "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        // orderResponse: JSON.stringify(result?.data || {})
        orderResponse: JSON.stringify({
          ...result?.data, // Spread Tunz API response (esimProfile will be null for top-ups - this is expected)
          planId: req.body.planId,
          customerUid: result?.data?.customer?.uid,
          country: countryFromOrder,
          iccid: iccid,
          data: plan.dataMBs,
          validity: plan.periodDays,
          type: type,
        })
      }
      await updateWalletTransaction(updateDetails)


      const paymentDetails = {
        transactionId: corporateTxnId,
        account: account,
        amount: (parseFloat(amount) + parseFloat(surcharge)).toFixed(2),
      };
      let to, cc;
      // Top-ups follow the eSIM's original recipient (employee / someone else), purchaser in CC
      const originalRecipient = await findPurchasedForByIccid(iccid);
      if (originalRecipient?.email) {
        to = originalRecipient.email;
        cc = subCorporateEmail || emailId;
      } else if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = emailId;
      } else {
        to = emailId;
        cc = undefined; // or omit if not needed
      }
      let subject = "Your eSIM top-up successful"; // Set email subject

      const topUpGreetingName = originalRecipient?.email ? (originalRecipient.name || name) : name;
      const resolvedTopupSuccess2 = await resolveEsimTopUpEmail(topUpGreetingName, "eSIM", plan.country, plan.dataMBs, plan.periodDays, paymentDetails.amount, iccid, 'success', partnerDetails, subject, req?.LogTraceId);
      subject = resolvedTopupSuccess2.subject;
      const body = resolvedTopupSuccess2.html;
      const isPgFunded = Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse");
      const invoiceAttachments = await generateOrderInvoiceAttachments({
        amount,
        surcharge,
        corporateTxnId,
        orderId: transactionResponse.orderId,
        paymentType: "eSIM Top-up",
        description: plan?.name || "eSIM Top-up",
        credentialId,
        pgAmount: isPgFunded ? req.body.pgAmount : null,
        paymentMethod: pgResponse?.payment_method,
        vendor: serviceDetails?.vendor,
        commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
        planDetails,
        commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
        traceId: req?.LogTraceId,
      });
      emailer.emailWithMultipleAttachment(to, subject, body, invoiceAttachments, cc, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
      });
      const notificationData = {
        notificationTitle: `${type == "SIM" ? "e-SIM Payment" : "e-SIM top-up "} successful`,
        notificationBrief: `${type == "SIM" ? "e-SIM Payment" : "e-SIM top-up "} of ₹ ${paymentDetails.amount} was successful. Transaction ID: ${paymentDetails.transactionId}.`,
        notificationTo: isSubCorporateUser ? [req.user.subCorporateUsername] : [req.user.username],
        notificationCategory: 'CORPORATE', // Replace with the relevant category
        notificationBy: 'ADMIN' // Replace with the user or system that triggered the notification
      };
      createNotification(notificationData);
      if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        notifyPGPaymentConfirmed(credentialId, req.body.batchId, corporateTxnId).catch(() => {});
      }
      return res.status(200).json({
        status: true,
        message: 'Payment Successful',
        responseCode: '000',
        data: {
          ...result?.data,
          ...transactionResponse,
          corporateTxnId,
        }
      })
    }

  } catch (error) {
    if (error.response) {
      let updateDetails = {}
      if (error.response.status >= 400) {
        if (process.env.NODE_ENV === 'production') {
          // cleverTap.uploadEvent({
          //   eventName: "Transactions",
          //   eventData: {
          //     Status: "Payment Failure",
          //   },
          //   email: emailId,
          // });
        }
        let corporateTxnId = req.body.corporateTxnId
        updateDetails = {
          corporateTxnId,
          status: "FAILURE",
          providerId: "Not Available",
          message: "Payment Failed",
          registeredById: req?.user?.registeredBy,
          orderResponse: JSON.stringify(error.response.data || {}),

        }
        if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
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
        let subject = 'Your eSIM top-up unsuccessful. Transaction failed'//
        let name = req.user.name
        let to, cc;
        if (subCorporateEmail) {
          to = subCorporateEmail;
          cc = req.user.email;
        } else {
          to = req.user.email;
          cc = undefined; // or omit if not needed
        }
        const resolvedTopupFail3 = await resolveEsimTopUpEmail(name, "eSIM", plan.country, plan.dataMBs, plan.periodDays, amount, iccid, 'fail', partnerDetails, subject, req?.LogTraceId);
        subject = resolvedTopupFail3.subject;
        const body = resolvedTopupFail3.html;
        emailer.email({ to, cc, subject, body }, function () {
          customLog(req?.LogTraceId, "info", { message: "Email sent to " + emailId + "," + subCorporateEmail })
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
      }
    }
    else {
      const failureUpdateDetails = {
        corporateTxnId: req.body.corporateTxnId,
        status: "FAILURE",
        providerId: "Not Available",
        message: "Payment Failed",
        registeredById: req?.user?.registeredBy,
        orderResponse: JSON.stringify({ error: error.message })
      };
      if (Object.prototype.hasOwnProperty.call(req.body, 'paymentGatewayResponse')) {
        //needed to refund the pg amount and handle pg payment failure
        let refundPGResponse = await cancelCardTransaction(req, req.body.paymentGatewayResponse, accessKey)
        if (refundPGResponse?.state !== 'REVERSED') {
          await paymentGateWayRefundFailureEmail(req, 'Esim', 'Esim')
        }
        await refundWalletTransaction(failureUpdateDetails);
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
        await refundWalletTransaction(failureUpdateDetails);
        const walletDetails = await wallet.findOne({
          where: { credentialId },
          attributes: ['balance'],
        });
        return res.status(400).json({
          status: false,
          message: 'Service not available at this moment',
          responseCode: '001',
          data: { corporateFinalBalance: walletDetails['balance'] },
        });
      }
    }
  }
})

// Staging mock mirrors the actually purchased top-up plan
const buildMockedRespTopUp = (plan) => {
  const sizeMBs = Number(plan?.dataMBs) || 50;
  const size = sizeMBs >= 1024
    ? { sizeValue: sizeMBs / 1024, sizeUnit: "GB" }
    : { sizeValue: sizeMBs, sizeUnit: "MB" };
  const validityDays = Number(plan?.periodDays) || 365;

  return {
    status: 200,
    statusText: "OK",
    data: {
      status: "success",
      activatedItem: {
        balance: {
          activatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toISOString(),
          activationMode: "NOW",
          name: plan?.name || "eSIM Worldwide 50 MB",
          size,
          availableBalance: size,
          validitySize: validityDays,
          validityUnit: "days"
        },
        uid: `topup-${Date.now()}`,
        metatag: "Mock topup",
        activationType: "DATA_PLAN"
      },
      customer: {
        email: "test@test.com",
        uid: "123234345-234-cbd2-9321-1234567890",
        profileUrl: "mock-profile"
      },
      esimProfile: null
    }
  };
};


async function getVendorWalletBalance(URL, token) {
  try {
    const response = await axios.get(
      `${URL}/gigastore/users/current/credit`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      }
    );

    return Number(response?.data?.balance?.value || 0);

  } catch (err) {
    return null;
  }
}