const axios = require('axios')
const { gatewayModeLabel } = require('../../utils/paymentModeKind')
const asyncHandler = require("../../middlewares/async");
const emailer = require('../../utils/emailer')
const {
  fetchServiceDetails,
  calculateSurcharge,
  calculateAmountWithTax,
  calculateSurchargeWithTax,
} = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
// const { sendMessages } = require('../../utils/serviceBus')
const {
  createWalletTransaction,
  refundWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const operatorsData = require("../../utils/operatorsData.json");
const accessKey = operatorsData.eSIM.accessKey

const { getPlanByPlanId } = require('../../models/use-cases/esimPlans')
const { cancelCardTransaction } = require('./payment_gateway')
const { paymentGateWayRefundFailureEmail } = require('../../utils/emailSender')
const { createPGTransaction } = require('../../utils/paymentGatewayTransaction');
const { createNotification } = require('../../models/use-cases/notification');
const wallet = require('../../models/entities/wallet');
// const { create } = require('../../models/use-cases/eSIM');
const { generateEsimBuySingleSuccessEmail } = require('../../utils/emailTemplates/eSim');
const { commonFailedTemplate, esimPaymentFailedTemplate, esimTopUpTemplate } = require('../../utils/emailTemplates/common');
// const cleverTap = require("../../services/CleverTap");
const { findOne } = require('../../models/use-cases/serviceOperator');
// const { getBulkPaymentRequestData } = require('../../services/bulkPayment');
// const { createZohoInvoice, createZohoPaymentRecord, getInvoicePDF, calculateAmountWithTax } = require('../../utils/zohoMethods');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const { customLog } = require('../../utils/loggerHelper');
const { bondioQueue } = require('../../utils/bullQueue');
const { notifyPGPaymentConfirmed } = require('../../utils/pusherNotification');
const { cancelPGTransaction } = require('../../utils/pgRefund');
const { setValue, pushToList } = require("../../utils/cacheDataMethods");
const { uploadFile } = require('../../utils/commonUploadFile');
const { updateOneOrder } = require('../../models/use-cases/order');
const { computeJournalData } = require('../../utils/computeJournalData');
const { publishJournalEvent } = require('../../utils/bull/queue/accountingEventsQueue');
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys');
const { v2LayoutVariables } = require('../../utils/emailTemplate/sharedLayout');

// Shared by 2 call sites in this file (and mirrored in eSimTunz.js) — reuses travel MS's
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

// Shared by 2 call sites in this file (and mirrored in eSimTunz.js).
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

// Shared by 3 call sites in this file (and mirrored in eSimTunz.js). `type` ('success'|'fail')
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

exports.processPaymentInternal = async ({ credentialId, isSubCorporateUser, subCorporateUserId, orders, planIds, amount, account, paymentGatewayResponse, pgAmount, req, parentBatchId = null, totalVendorGroups = 1, vendorIndex = 0 }) => {
  const executionUnits = [];

  orders.forEach((order, index) => {
    const planId = planIds[index];
    for (let i = 0; i < order.quantity; i++) {
      executionUnits.push({ planId, country: order.country });
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
    bulkPaymentData.push({
      corporateTxnId: batchId + (vendorIndex * 100000) + txnCounter++,
      batchId,
      accessKey,
      amount: Number(plan.amount),
      account,
      planId: unit.planId,
      plan,
      country: unit.country,
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
      state: req.user.state,
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
        return {
            ...item,
            quantity: 1,
            batchTotal: totalUnits,
            batchSurcharge: surcharge,
            paymentStatus: "PROCESSING",
            user: userInfo,
            redisKey,
            ...(parentBatchId !== null && { parentBatchId, totalVendorGroups }),
          };
      });

      // Enqueue jobs to Bull Queue for async processing
      customLog(req?.LogTraceId, 'info', { message: '[ESIM BONDIO] before bondioQueue.add loop', totalMessages: messagesToPublish.length });
      for (const message of messagesToPublish) {
        customLog(req?.LogTraceId, 'info', { message: '[ESIM BONDIO] adding job to bondioQueue', jobId: message.corporateTxnId });
        await bondioQueue.add(message, {
          jobId: String(message.corporateTxnId),
        });
        customLog(req?.LogTraceId, 'info', { message: '[ESIM BONDIO] job added to bondioQueue', jobId: message.corporateTxnId });
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
      serviceName: "esim",
      account: item.account,
      surcharge,
      amount: item.amount,
      corporateTxnId: item.corporateTxnId,
      batchId: item.batchId,
      paymentStatus: item.paymentStatus,
      paymentMode,
    }));

    const walletDetails = await wallet.findOne({ where: { credentialId }, attributes: ['balance'] });

    await setValue(redisKey, 60 * 5, JSON.stringify(extractedData));

    // For mixed-vendor orders: register this child batch under the shared parentBatchId.
    // Stores batchId + vendor total so bulkPayment.js can collect iccids and compute
    // the correct grand total for a single combined email.
    if (parentBatchId !== null) {
      const vendorTotal = (Number(amount) + Number(surcharge)).toFixed(2);
      await pushToList(
        `mixed:batches:${parentBatchId}`,
        JSON.stringify({ batchId: String(batchId), totalAmount: vendorTotal }),
        60 * 10
      );
    }

    return { success: true, redisKey, walletBalance: Number(walletDetails['balance']), paymentMode, surcharge };
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return { success: false, error: error?.message || "Payment processing failed", shouldRefundPG: !!paymentGatewayResponse, batchId };
  }
};

exports.payment = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;

  customLog(req.LogTraceId, 'info', {
    message: '[ESIM BONDIO] payment controller entered',
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
      });
    }
  });

  const totalUnits = executionUnits.length;

  if (totalUnits === 1) {
    req.body.planId = executionUnits[0].planId;
    req.body.quantity = 1;
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
        await paymentGateWayRefundFailureEmail(req, 'Esim', 'Esim');
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
    data: { bulkPaymentData: result.redisKey, corporateFinalBalance: result.walletBalance, paymentMode: result.paymentMode },
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
  let reportData, serviceDetails;

  let partnerDetails;
  partnerDetails = await fetchPartnerDetails(req?.user?.registeredBy);
  try {
    customLog(req?.LogTraceId, "info", { message: 'message received in singleBillPayment', body: req.body, user: req.user })
    // trust payment() to pass correct single-unit payload
    const {
      planId,
      quantity = 1,
      amount,
      account,
      transactionId
    } = req.body;
    let accessKey = req.body.accessKey
    console.log({planId,accessKey,amount,account})
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
    let token = serviceDetails.vendor.optional1
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

    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
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

    // const invoice_id = await createZohoInvoice(customer_id,undefined , corporateTxnId, surcharge, parseFloat(amount).toFixed(2))
    const eSIMBody = {
      "planParams": {
        "planId": req.body.planId,
        "activationType": "NOW",
        "activationAt": 0
      },
      // "esim": "string",
      // "metadata": "string"
    }
    let vendorUrl = `${URL}/v2/subscriptions`
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
      customLog(req?.LogTraceId, "info", { config: config }, "VENDOR")
      if (process.env.NODE_ENV === 'production') {
        result = await axios(config)
        customLog(req?.LogTraceId, "info", { response: result?.data }, "VENDOR")
        if (!result || (result.data && (result.data.errorcode || result.data.errorCode))) {
          throw new Error("Payment provider returned an error");
        }
      }
      else {
        result = mockRespSingleeSIMBuy
      }

    } catch (error) {
      // Log vendor API error for debugging - with specific error type for easy searching
      let errorType = 'UNKNOWN_ERROR';
      let searchMessage = '[ESIMV2] Vendor API Error';

      if (error?.message?.includes('timeout')) {
        errorType = 'TIMEOUT_ERROR';
        searchMessage = '[ESIMV2-BONDIO] VENDOR_API_TIMEOUT - Request exceeded 30 seconds';
      } else if (error?.code === 'ECONNREFUSED') {
        errorType = 'CONNECTION_REFUSED';
        searchMessage = '[ESIMV2-BONDIO] VENDOR_CONNECTION_REFUSED - Cannot reach vendor server';
      } else if (error?.code === 'ENOTFOUND') {
        errorType = 'DNS_RESOLUTION_ERROR';
        searchMessage = '[ESIMV2-BONDIO] VENDOR_DNS_ERROR - Cannot resolve vendor hostname';
      } else if (error?.response?.status) {
        errorType = `HTTP_${error?.response?.status}`;
        searchMessage = `[ESIMV2-BONDIO] VENDOR_HTTP_ERROR_${error?.response?.status} - ${error?.response?.statusText}`;
      } else {
        searchMessage = '[ESIMV2-BONDIO] VENDOR_REQUEST_FAILED - Network or parsing error';
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
          let subject = 'Your eSIM purchase unsuccessful. Transaction failed'// Set email subject
          let to, cc;

          if (subCorporateEmail) {
            to = subCorporateEmail;
            cc = emailId;
          } else {
            to = emailId;
            cc = undefined; // or omit if not needed
          }
          let name = req.user.name
          const resolvedBuyFail1 = await resolveEsimBuyPaymentFailedEmail(name, "eSIM", plan.country, plan.dataMBs, plan.periodDays, amount, undefined, partnerDetails, subject, req?.LogTraceId);
          subject = resolvedBuyFail1.subject;
          const body = resolvedBuyFail1.html;
          emailer.email({ to, cc, subject, body }, function () {
            customLog(req?.LogTraceId, "info", { message: "Email sent to " + to })
          });

          const walletDetails = await wallet.findOne({
            where: { credentialId }, attributes: ['balance']
          });
          return res.status(400).json({
            status: false,
            message: 'Payment Failed',
            responseCode: '001',
            data: {
              ...(error.response.data || {}),
              corporateFinalBalance: walletDetails['balance']
            }
          });
        }
      }
    }
    let updateDetails = {}
    if (!result || (result.data && (result.data.errorcode || result.data.errorCode || result.status >= 400))) {
      customLog(req?.LogTraceId, "error", { data: result?.data })
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
      // must use this in transaction events
      // cleverTap.uploadEvent({
      //   eventName: "Transactions",
      //   eventData: {
      //     Status: "Payment Success",
      //   },
      //   email: emailId,
      // },partnerDetails);
      updateDetails = {
        corporateTxnId,
        providerId: result.data.orderId ? result.data.orderId : "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        // orderResponse: JSON.stringify(result?.data || {})
        orderResponse: JSON.stringify({
          ...result?.data, // Spread existing data
          planId: req.body.planId // Add the planid field
        })
      }
      await updateWalletTransaction(updateDetails)


      const paymentDetails = {
        transactionId: corporateTxnId,
        account: account,
        amount: (parseFloat(amount) + parseFloat(surcharge) - transactionResponse.couponDiscount).toFixed(2),
      };

      let to, cc;
      if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = emailId;
      } else {
        to = emailId;
        cc = undefined; // or omit if not needed
      }
      const subject = "Payment Successful"; // Set email subject
      const esimDetails = [];
      esimDetails.push(result.data)
      let qrCodes;
      try {
        qrCodes = await handleQRCode(esimDetails, URL, next);
        // Save qrCodeUrl in orderResponse so View requests can skip Bondio API
        if (qrCodes?.[0]?.qrCodeUrl) {
          try {
            const existingResponse = JSON.parse(updateDetails.orderResponse || '{}');
            await updateOneOrder(corporateTxnId, {
              orderResponse: JSON.stringify({ ...existingResponse, qrCodeUrl: qrCodes[0].qrCodeUrl })
            });
          } catch (updateErr) {
            customLog(req?.LogTraceId, "error", { message: "Failed to save qrCodeUrl in orderResponse", error: updateErr?.message });
          }
        }
      } catch (qrError) {
        customLog(req?.LogTraceId, "error", { message: "QR code generation failed after successful payment", error: qrError?.message, iccid: esimDetails[0]?.esim });
        qrCodes = [{ iccid: esimDetails[0]?.esim, qrCodeUrl: null }];
      }
      const esimIds = esimDetails[0].esim;
      const body = generateEsimBuySingleSuccessEmail(paymentDetails.transactionId, paymentDetails.amount, plan, type, quantity, esimIds, qrCodes, partnerDetails); // instead of activation key entered message
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

      // createExpense({
      //   credentialId,
      //   packageId,
      //   corporateUserId
      // }, {
      //   accounts_id, amount: paymentDetails.amount, payment_method: "PAYMENT GATEWAY", credentialId, category: serviceDetails?.serviceCategory,
      //   merchant: serviceDetails?.vendor?.vendorName
      // })

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
    console.log("ERROR",error)
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
        const resolvedBuyFail2 = await resolveEsimBuyPaymentFailedEmail(name, "eSIM", plan.country, plan.dataMBs, plan.periodDays, req.body.amount, undefined, partnerDetails, subject, req?.LogTraceId);
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
      const failureCorporateTxnId = req.body.corporateTxnId;
      const failureUpdateDetails = {
        corporateTxnId: failureCorporateTxnId,
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
        if (reportData) {
          publishJournalEvent(
            {
              transactionRef: failureCorporateTxnId,
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
        if (reportData) {
          publishJournalEvent(
            {
              transactionRef: failureCorporateTxnId,
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

async function handleQRCode(data, apiUrl, next) {
  const qrCodeUrls = [];
  for (const esimData of data) {
    const iccid = esimData.esim;
    const logoUrl = await getQRCode(iccid, apiUrl, next);
    qrCodeUrls.push({
      id: esimData.id,
      iccid,
      qrCodeUrl: logoUrl
    })
  }
  return qrCodeUrls
}

async function getQRCode(iccid, apiUrl, next) {
  const vendorUrl = `${apiUrl}/v1/esims/${iccid}/qrcode`;

  let serviceDetails = await findOne({ accessKey })
  const token = serviceDetails.vendor.optional1

  // Make the API call to fetch the QR code
  const config = {
    method: 'GET',
    url: vendorUrl,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${token}`,
    },
    responseType: 'arraybuffer'
  }

  let response = await axios(config);

  const imageBuffer = Buffer.from(response.data, 'binary');
  const base64Image = imageBuffer.toString('base64');
  const filePath = `esims`;
  const logoUrl = await uploadFile(base64Image, filePath, 'png');
  if (!logoUrl) {
    return next(new ErrorResponse(`Something went wrong while uploading logo`, 500));
  }
  return logoUrl;
}

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
  const { amount } = req.body;
  let partnerDetails;
  let reportData, serviceDetails;
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
    let token = serviceDetails.vendor.optional1
    let URL = serviceDetails.vendor.apiUrl
    let commissionType = serviceDetails.commissionType
    let cashbackType = serviceDetails.cashbackType
    let serviceOperatorId = serviceDetails.id

    //----set 0 when bulk upload enabled for this service ------
    const { surcharge } = await calculateSurchargeWithTax(
        serviceDetails.surcharge,
        serviceDetails.surchargeType,
        amount,
        credentialId
    );
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
    const pgResponse = Array.isArray(req.body?.paymentGatewayResponse) ? req.body.paymentGatewayResponse[0] : req.body?.paymentGatewayResponse;
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

    // const invoice_id = await createZohoInvoice(customer_id,serviceDetails.zoho_item_id , corporateTxnId, surcharge, parseFloat(amount).toFixed(2))
    const eSIMBody = {
      "planId": planId,
      "activationType": "FIRST_USAGE",
      "activationAt": 0
    }
    let vendorUrl = `${URL}/v2/subscriptions/${iccid}/plan-attachments`
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
        if (!result || (result.data && (result.data.errorcode || result.data.errorCode))) {
          throw new Error("Payment provider returned an error");
        }
      }
      else {
        result = mockedRespTopUp
      }
    } catch (error) {
      // Log vendor API error for topup - with specific error type for easy searching
      let errorType = 'UNKNOWN_ERROR';
      let searchMessage = '[ESIMV2-TOPUP] Vendor API Error';

      if (error?.message?.includes('timeout')) {
        errorType = 'TIMEOUT_ERROR';
        searchMessage = '[ESIMV2-BONDIO-TOPUP] VENDOR_API_TIMEOUT - Request exceeded timeout';
      } else if (error?.code === 'ECONNREFUSED') {
        errorType = 'CONNECTION_REFUSED';
        searchMessage = '[ESIMV2-BONDIO-TOPUP] VENDOR_CONNECTION_REFUSED - Cannot reach vendor server';
      } else if (error?.code === 'ENOTFOUND') {
        errorType = 'DNS_RESOLUTION_ERROR';
        searchMessage = '[ESIMV2-BONDIO-TOPUP] VENDOR_DNS_ERROR - Cannot resolve vendor hostname';
      } else if (error?.response?.status) {
        errorType = `HTTP_${error?.response?.status}`;
        searchMessage = `[ESIMV2-BONDIO-TOPUP] VENDOR_HTTP_ERROR_${error?.response?.status} - ${error?.response?.statusText}`;
      } else {
        searchMessage = '[ESIMV2-BONDIO-TOPUP] VENDOR_REQUEST_FAILED - Network or parsing error';
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
          emailer.email({to,cc, subject, body}, function () {
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
    if (!result || (result.data && (result.data.errorcode || result.data.errorCode || result.data.status >= 400))) {
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
      emailer.email({to,cc, subject, body}, function () {
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
      updateDetails = {
        corporateTxnId,
        providerId: result.data.orderId ? result.data.orderId : "Not Available",
        status: "SUCCESS",
        message: "Payment Successful",
        // orderResponse: JSON.stringify(result?.data || {})
        orderResponse: JSON.stringify({
          ...result?.data, // Spread existing data
          iccid: iccid,
          planId: req.body.planId,
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
      if (subCorporateEmail) {
        to = subCorporateEmail;
        cc = emailId;
      } else {
        to = emailId;
        cc = undefined; // or omit if not needed
      }
      let subject = "Your eSIM top-up successful"; // Set email subject
     const esimDetails = [];
      esimDetails.push(result.data)
      const resolvedTopupSuccess = await resolveEsimTopUpEmail(name, "eSIM", plan.country, plan.dataMBs, plan.periodDays, paymentDetails.amount, iccid, 'success', partnerDetails, subject, req?.LogTraceId);
      subject = resolvedTopupSuccess.subject;
      const body = resolvedTopupSuccess.html;
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
        const resolvedTopup = await resolveEsimTopUpEmail(name, "eSIM", plan.country, plan.dataMBs, plan.periodDays, amount, iccid, 'fail', partnerDetails, subject, req?.LogTraceId);
        subject = resolvedTopup.subject;
        const body = resolvedTopup.html;
        emailer.email({to,cc, subject, body}, function () {
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
      const failureCorporateTxnId = req.body.corporateTxnId;
      const failureUpdateDetails = {
        corporateTxnId: failureCorporateTxnId,
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
        if (reportData) {
          publishJournalEvent(
            {
              transactionRef: failureCorporateTxnId,
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
        if (reportData) {
          publishJournalEvent(
            {
              transactionRef: failureCorporateTxnId,
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

// const MockedResp = [
//   {
//     status: "fulfilled",
//     value: {
//       status: 201,
//       statusText: 'Created',
//       data: {
//         id: 'sub2_aemorih9',
//         createdAt: 1728302326,
//         esim: '8937204017177720078',
//         metadata: null
//       }
//     }
//   },
//   {
//     status: "rejected",
//     reason: {
//       response: {
//         data: {
//           docUrl: 'https://bondio.stoplight.io/docs/bondio-api/',
//           code: 'out_of_inventory',
//           description: 'Your account is out of eSIMs inventory, so the operation cannot be performed.'
//         }
//       }
//     }
//   },
//   {
//     status: "rejected",
//     reason: {
//       response: {
//         data: {
//           docUrl: 'https://bondio.stoplight.io/docs/bondio-api/',
//           code: 'out_of_inventory',
//           description: 'Your account is out of eSIMs inventory, so the operation cannot be performed.'
//         }
//       }
//     }
//   },
//   {
//     status: "fulfilled",
//     value: {
//       status: 201,
//       statusText: 'Created',
//       data: {
//         id: 'sub2_aemorih9',
//         createdAt: 1728302326,
//         esim: '8937204017177720078',
//         metadata: null
//       }
//     }
//   },
// ]

const mockRespSingleeSIMBuy = {
  status: 201,
  statusText: 'Created',
  data: {
    id: 'sub2_aemorih9',
    createdAt: 1728302326,
    esim: '8937204017177720078',
    metadata: null
  }
}

const mockedRespTopUp = {
  status: 201,
  statusText: 'Created',
  data: {
    id: 'platt_gqlanq8n',
    createdAt: 1729780235,
    activationAt: null,
    expirationAt: null,
    usedAllowance: { dataBytes: 0, smsMessages: null, voiceSeconds: null },
    plan: 'plan_yom3ta2a',
    state: 'PENDING_FOR_FIRST_USE'
  }
}