const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { findServiceOperatorByAccessKey, fetchServiceDetails, calculateSurcharge, calculateAmountWithTax } = require("../../utils/checkAndFetchServiceDetails");
const paymentGatewayOrders = require("../../models/entities/paymentGatewayOrders");
const { sendOndcRefundCreditedEmail } = require("../../services/ondcPaymentNotify");
const { ORDER_KIND } = require("../../constants/orderKind");
const { resolveSubscriptionQuote } = require("../../utils/subscriptionQuote");
const operatorsData = require("../../utils/operatorsData.json");
const accessKey = operatorsData["cashFreePaymentGateway"]["accessKey"];
const WHATSAPP_ACCESS_KEY = operatorsData["whatsAppForBusiness"]["accessKey"];
const ECOMMERCE_STORE_ACCESS_KEY = operatorsData["ecommerceStore"]["accessKey"];
// Cashfree merchant resolution lives in utils/cashfreeMerchant.js so create-order
// and both completion paths provably share one implementation (and so it can be
// unit-tested — this controller can't be required from jest).
const {
  loadOndcCashfreeOperator,
  pickCashfreeCredentials,
} = require("../../utils/cashfreeMerchant");
const {
  getOrderGatewayProvider,
  verifyGatewayOrder,
  reopenPaidGatewayOrder,
} = require("../../utils/gatewayProviders");
// Pure, for the same reason: which status a refund event leaves the payment in.
const { resolveRefundOrderStatus } = require("../../utils/refundOrderStatus");
// Cashfree per-charge safety cap on the subscription mandate (plan_max_amount). An order whose amount
// exceeds this can be authorized but every recurring charge would be rejected, so reject it up front.
const SUBSCRIPTION_PLAN_MAX_AMOUNT = 14999;

const SUBSCRIPTION_PLAN_MAX_AMOUNT_ANNUAL = 100000;
const resolvePlanMaxAmount = billingType =>
  String(billingType || "").toUpperCase() === "ANNUALLY" ? SUBSCRIPTION_PLAN_MAX_AMOUNT_ANNUAL : SUBSCRIPTION_PLAN_MAX_AMOUNT;

const isTerminalMandateFailure = (reason) => {
  const r = String(reason || "").toLowerCase();
  return (
    r.includes("not active") ||
    r.includes("cancel") ||
    r.includes("does not exist") ||
    r.includes("not found")
  );
};

const GENERIC_ERROR_MESSAGE = "We’re experiencing a temporary issue. Please try again later. If the problem continues, contact us at reach@peko.one.";
const getWhatsAppMerchantClientCreds = async () => {
  const waOperator = await findServiceOperatorByAccessKey(WHATSAPP_ACCESS_KEY);
  return {
    clientId: waOperator?.paymentclientid,
    clientSecret: waOperator?.paymentclientsecret,
  };
};
// Mask a credential for logs: keep first + last 2 chars, hide the middle (never log the full secret).
const maskCredential = (value) => {
  if (!value) return null;
  const s = String(value);
  return s.length <= 4 ? "****" : `${s.slice(0, 2)}****${s.slice(-2)}`;
};
const esim = require("./eSIMV2");
const eSimTunz = require("./eSimTunz");
const giftcards = require("./giftCard");
const ecommerce = require("./ecommerce");
const ondcEcommerce = require("./ondcEcommerce");
const carbonFootprint = require("./carbonFootprint");
const workspace = require("./workspace");
const hotel = require("./hotels");
const flight = require("./flight");
// const logistics = require("./logistics");
const prepaid = require("./telecomPayments/prepaid")
const logistics = require("./logisticsV3");
const softwares = require("./softwares");
const softwaresV2 = require("./softwaresV2");
const subscription = require("./subscription");
const works = require("./works");
const hike = require("./hike");
const whatsAppForBusiness = require("./whatsAppForBusiness");
const { fetchUpgradingDiscountPrice } = require("./whatsAppForBusiness");
const softwareSubscription = require("./software_subscriptions");
const ecommerceStore = require("./ecommerceStore");
const pos = require("./pos");
const wallet = require("./wallet")
const corporateCards = require("./corporateCards")
const walletEntity = require("../../models/entities/wallet")
const domainAndHosting = require("./domainAndHosting")
const companyIncorporation = require("./companyIncorporation")
const businessRegistration = require("./businessRegistration")
const govtServices = require("./govtServices")
const govtServicesV2 = require("./govtServicesV2")
const challan = require("./challan")
const carReport = require("./carReport")
const visa = require("./visa")
const globalBusinessSetup = require("./globalBusinessSetup")
const verificationSuiteAddOn = require("./verificationSuiteAddOn")
const bus = require("./bus")


const { customLog } = require("../../utils/loggerHelper");
const { calculateTaxBreakdown } = require("../../services/GSTandTAXcalculation");
const { getValue } = require("../../utils/cacheDataMethods");
const FRONTEND_URL = process.env.NODE_ENV === "staging" ? process.env.FRONTEND_STAGING_URL : process.env.FRONTEND_PRODUCTION_URL;
const BACKEND_URL = process.env.NODE_ENV === "staging" ? process.env.STAGING_URL : process.env.PRODUCTION_URL;
const moment = require("moment");
const emailTemplates = require("../../utils/emailTemplate/subscription");
const emailer = require("../../utils/emailer");

const operatorData = require("../../utils/operatorsData.json");
const { findOneOrder, updateOneOrder } = require("../../models/use-cases/order");
const { notifyPGPaymentConfirmed } = require("../../utils/pusherNotification");
const { updateOneTransaction } = require("../../models/use-cases/transaction");
const { findUserDetails } = require("../../utils/jwtToken");
const { findOnePackage } = require("../../models/use-cases/packages");
const { createSubscription, createSubscriptionForAddOns } = require("../../utils/subscription");
const { generateSubscriptionInvoiceAttachments, generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { calculateSubscriptionPrice, getPackagePlanDiscount } = require("../../utils/subscriptionPricing");
const {
  findSubscriptionIsExist,
  findActiveIndividualBaseSubscription,
  findMainSubscription,
  updateVendorSubscriptionId,
  findExistingGroupPackage,
  findSubscriptionById,
  findAllAddonSubscription,
  findRecurringAddonsToRenew,
  findAddonPrice,
  findExistingSubscription,
  findActivePaidGroupSubscription,
  findAllSubscription,
  cancelUserSubscription,
  findSubscription,
  renewAddonSubscriptions,
  updateSubscription,
  countActiveSubscriptionsByVendorId,
} = require("../../models/use-cases/subscription");
const { findOneServiceCashbacks, findOneByPackageId } = require("../../models/use-cases/cashback");
const { findOneById: findServiceOperatorById } = require("../../models/use-cases/serviceOperator");
const {
  findOrCreateWebhookEvent,
  markWebhookProcessed,
  markWebhookFailed,
  getNextWebhookEventSequence,
} = require("../../models/use-cases/webhookEvent");
const { default: axios } = require("axios");
const { sanitizeString, formatNumberWithLocalString, filterLettersAndSpaces } = require("../../utils/formatter");
const { findOneCorporate } = require("../../models/use-cases/corporateUser");
const { createNotification } = require("../../models/use-cases/notification");
const { commonBillHandler, getABiller, normalizeCustomerMobile } = require("./commonBillHandler");
const { assertBbpsChannelAmount } = require("../../utils/billPayments_utils");
const { checkBillAvenueBalance, notifyBillAvenueLowBalance } = require("../../utils/billAvenueWallet");
const { subscriptionIndividualSuccessEmail, subscriptionPekoPlusSuccessEmail, storagePurchaseSuccess } = require("../../utils/emailTemplates/subscription");
const { payrollAddOnEmployeesSuccess } = require("../../utils/emailTemplate/payroll");
const { eSignAddONSuccessTemplate } = require("../../utils/emailTemplate/esr");
const { turboAddOnFleetSuccess } = require("../../utils/emailTemplate/turbo");
const { eInvoiceAddOnSuccessTemplate } = require("../../utils/emailTemplate/eInvoice");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { resolveAddonTierPricing } = require("../../utils/resolveAddonTierPricing");
const { isRecurringAddon, calculateAddonLineTotal, calculateProRatedAddonPrice, annualizeAddon } = require("../../utils/addonPricing");
const {
  findActiveSubscriptionByCredentialId,
  fetchWhatsAppBusinessByCredentialId,
} = require("../../models/use-cases/whatsappforBusiness");
const {
  findActiveByAccessCode: findActiveEcommerceStoreSubscription,
} = require("../../models/use-cases/serviceSubscription");
const {
  createEcommerceStoreSubscriptionFromWebhook,
  renewEcommerceStoreSubscription,
} = require("../../utils/ecommerceStoreSubscription");
const { ecommerceStoreInvoiceDescription } = require("../../utils/billingCycle");
const { generateEcommerceStorePaymentSuccessEmail, generateEcommerceStoreRenewalSuccessEmail } = require("../../utils/emailTemplates/ecommerceStore");
const {
  createWhatsAppSubscriptionFromWebhook,
  findWhatsAppSubscriptionByVendorId,
  findWhatsAppSubscriptionByPaymentRef,
  renewWhatsAppSubscription,
  // TEMP: Peko+ → WhatsApp Basic bundling disabled — the whole bundle block (AUTH create + CHARGE renew) is commented out below.
  // bundleWhatsAppBasicForPekoPlus,
  // renewBundledWhatsAppBasic,
  markWhatsAppSubscriptionsGrace,
  findActiveWhatsAppSubsWithUserByVendor,
  cancelWhatsAppSubscriptionsByVendor,
} = require("../../utils/whatsappForBusiness");
const { fetchVendorDetailsByServiceDetails, createProjectApi, UpdateProjectPlanApi } = require("../../services/whatsAppForBusiness");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { getBotBuilderValues, getShopifyIntegrationValues } = require("../../models/use-cases/setting");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");

const getWaCommissionFields = (pkg, duration) => {
  const planComm = duration && pkg?.planCommissions?.[duration.toLowerCase()];
  return planComm || {
    commissionMode: pkg?.commissionMode,
    commissionType: pkg?.commissionType,
    commission: pkg?.commission,
    fixedCommissionPerTransaction: pkg?.fixedCommissionPerTransaction,
    isCommissionInclGST: pkg?.isCommissionInclGST,
  };
};

exports.createOrder = asyncHandler(async (req, res, next) => {
  const mobileNo = normalizeCustomerMobile(req.user.mobileNo) || "0000000000";
  const serviceAccessKey = req.body.accessKey;
  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  const individualServiceDetails = serviceAccessKey ? await findServiceOperatorByAccessKey(serviceAccessKey) : null;
  const credentialId = req.user.id
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(new ErrorResponse(serviceDetails["error"], 400));
  }

  // ONDC (Office Supplies) captures and splits on its own Cashfree merchant, held
  // on the `cashfree_ondc` service operator — the seller payout written later by
  // Easy Split must settle against the same merchant the order was captured on.
  // /complete and the webhook resolve this identically; see pickCashfreeCredentials.
  const ondcServiceDetails = await loadOndcCashfreeOperator(req.body.isOndc);
  const { clientId, clientSecret, baseUrl, version, merchant } = pickCashfreeCredentials({
    shared: serviceDetails,
    individual: individualServiceDetails,
    ondc: ondcServiceDetails,
  });
  const paymentRefId = new Date().valueOf();
  const orderIdPrefix = req.user.role === "CORPORATE_SUB_USER" ? "pekoSub" : "peko";
  const gatewayOptionsSet = new Set();

  if (req.body.billerId) {
    const billerData = await getABiller({credentialId,
      packageId,
      corporateUserId,
      billerId:req.body.billerId,
      logTraceId: req?.LogTraceId,}) || null;
    const {billerPaymentModes} = billerData || {};
      const paymentModeInfo = billerPaymentModes?.paymentModeInfo || [];
    if (Array.isArray(paymentModeInfo) && paymentModeInfo.length > 0) {
      const upperCasedModes = paymentModeInfo.map((m) =>
        String(m.paymentMode || "").toUpperCase()
      );


      // Map BBPS paymentMode names to Cashfree's payment_methods codes.
      // Per Cashfree's official Orders API docs, valid codes are lowercase:
      // cc, dc, ccc, ppc, nb, upi, paypal, app, paylater, cardlessemi, dcemi,
      // ccemi, banktransfer. Example: "cc,dc,upi". BBPS modes with no checkout
      // equivalent (AEPS, USSD, Cash) are intentionally dropped.
      upperCasedModes.forEach((mode) => {
        switch (mode) {
          case "UPI":
          case "BHARAT QR":
            gatewayOptionsSet.add("upi");
            break;
          case "DEBIT CARD":
            gatewayOptionsSet.add("dc");
            break;
          case "CREDIT CARD":
            gatewayOptionsSet.add("cc");
            break;
          // case "INTERNET BANKING":
          //   gatewayOptionsSet.add("nb");
          //   break;
          // case "ACCOUNT TRANSFER":
          // case "IMPS":
          // case "NEFT":
          //   gatewayOptionsSet.add("banktransfer");
          //   break;
          default:
            break;
        }
      });

    }
      const preflightMobile = normalizeCustomerMobile(req.user.mobileNo || req.user.mobile);
      if (!preflightMobile) {
        customLog(req?.LogTraceId, "error", {
          message: "Cashfree create-order pre-flight rejection: customer mobile invalid",
          accessKey: serviceAccessKey,
          billerId: req.body.billerId,
          rawMobileNoPresent: Boolean(req.user?.mobileNo),
          rawMobilePresent: Boolean(req.user?.mobile),
        }, "VENDOR");
        return next(new ErrorResponse("Valid customer mobile number is required to pay this biller.", 400));
      }
      if (gatewayOptionsSet.size === 0) {
        customLog(req?.LogTraceId, "error", {
          message: "Cashfree create-order pre-flight rejection: no biller payment mode maps to a Cashfree checkout option",
          accessKey: serviceAccessKey,
          billerId: req.body.billerId,
        }, "VENDOR");
        return next(new ErrorResponse("This biller does not currently support any of the available online payment methods. Please try again later or contact support.", 400));
      }

      const channelLimitMessage = await assertBbpsChannelAmount({
        billerData,
        accessKey: serviceAccessKey,
        amount: req.body.amount,
        ccf1Amount: req.body.ccf1Amount,
        billerId: req.body.billerId,
        logTraceId: req?.LogTraceId,
      });
      if (channelLimitMessage) {
        return next(new ErrorResponse(channelLimitMessage, 400));
      }

      // Hard block at create-order: never let a customer pay for a BBPS bill we can't settle with
      // BillAvenue. Checking here (before the Cashfree order/payment is created) avoids the
      // charge-then-refund that a post-payment block would cause. Vendor settlement = bill + CCF1
      // (excl. surcharge). Skipped when the amount is malformed (other validation handles that).
      const billAvenueAmount = parseFloat(req.body.amount) + parseFloat(req.body.ccf1Amount ?? 0) / 100;
      if (Number.isFinite(billAvenueAmount) && billAvenueAmount > 0) {
        const vendorCheck = await checkBillAvenueBalance(billAvenueAmount, req?.LogTraceId);
        if (!vendorCheck.sufficient) {
          customLog(req?.LogTraceId, "error", {
            message: "BBPS create-order blocked: insufficient BillAvenue vendor wallet balance",
            required: billAvenueAmount,
            available: vendorCheck.balance,
            billerId: req.body.billerId,
          }, "VENDOR");
          await notifyBillAvenueLowBalance(vendorCheck, { required: billAvenueAmount, billerId: req.body.billerId }, req?.LogTraceId);
          return next(new ErrorResponse("This service is temporarily unavailable. Please try again later.", 503));
        }
      }
  }
  const persistedPaymentData = {
    ...req.body,
    paymentRefId,
    userId: req.user.id,
    orderKind: ORDER_KIND.PAYMENT_GATEWAY,
    corporateId: req.user.corporateId,
    role: req.user.role || null,
    ...(req.user.role === "CORPORATE_SUB_USER" && {
      subCorporateId: req.user.subCorporateId,
      subCorporateUsername: req.user.subCorporateUsername || null,
    }),
  };
  await paymentGatewayOrders.create({
    paymentRefId,
    orderKind: ORDER_KIND.PAYMENT_GATEWAY,
    paymentData: JSON.stringify(persistedPaymentData),
  });

  const amount = parseFloat(req.body.pgAmount).toFixed(2);

  const notify_url = process.env.NODE_ENV == "staging" ? process.env.STAGING_URL : process.env.PRODUCTION_URL;

  const partnerDetails = await fetchPartnerDetails(req.user.registeredBy);
  const callbackUrl = `${partnerDetails?.baseUrl || FRONTEND_URL}/payments`;
  const request = {
    order_amount: amount,
    order_currency: "INR",
    order_id: `${orderIdPrefix}_${paymentRefId}`,
    customer_details: {
      customer_id: req.user.id.toString(),
      customer_phone: mobileNo,
      customer_name: req.user.name,
      customer_email: req.user.email,
    },
    order_meta: {
      return_url: callbackUrl,
      notify_url: `${notify_url}/api/v1/webhook/cashfree/payment-gateway/cashfree`,
      // "payment_methods": "cc,dc,upi"
    },
    // "order_expiry_time": "2025-01-08T06:13:48.558Z",
  };

  if (req.body.billerResponse && gatewayOptionsSet.size > 0) {
    // Defensive cleanup per Cashfree support's checklist: trim each code to
    // strip any accidental whitespace, drop empties, then join with a plain
    // comma (no surrounding spaces, no trailing comma).
    const cleanedMethods = [...gatewayOptionsSet]
      .map((code) => String(code).trim())
      .filter(Boolean);
    request.order_meta.payment_methods = cleanedMethods.join(",");
  }
  customLog(req?.LogTraceId, "info", {
    message: "Cashfree create-order payment_methods resolution",
    billerResponseFlag: !!req.body.billerResponse,
    billerId: req.body.billerId,
    resolvedPaymentMethods: request.order_meta.payment_methods || null,
    resolvedPaymentMethodsCharCodes: request.order_meta.payment_methods,
    billerSupportedModes: [...gatewayOptionsSet],
    cashfreeApiVersion: version,
  }, "VENDOR");

  try {
    const config = {
      method: "POST",
      url: `${baseUrl}/pg/orders`,
      headers: {
        "x-api-version": version,
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "Content-Type": "application/json",
      },
      data: request,
    };

    // `merchant` is logged on purpose: /complete must later resolve the SAME one,
    // and a mismatch is otherwise invisible until the payments lookup 404s.
    customLog(req?.LogTraceId, "info", { message: "Creating order with Cashfree updated", config, orderId: request.order_id, amount, merchant, isOndc: Boolean(req.body.isOndc) }, "VENDOR");

    const response = await axios(config);

    await paymentGatewayOrders.update(
      {
        status: "ORDERED",
        referenceNo: response.data.payment_session_id,
      },
      {
        where: { paymentRefId },
      }
    );

    return res.status(201).json({
      status: true,
      data: {
        amount,
        orderId: paymentRefId,
        session_id: response.data.payment_session_id,
      },
      message: "Order created successfully",
      responseCode: "000",
    });
  } catch (error) {
    console.error("Error:", error?.response?.data?.message);
    customLog(req?.LogTraceId, "error", {
      message: "CATCH FROM CREATE ORDER:",
      error: error?.response?.data?.message ?? error?.response?.data ?? error?.response,
    });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 501));
  }
});

const extractPaymentMode = (payments) => {
    const list = Array.isArray(payments) ? payments : [];
    const paid = list.find((p) => p?.payment_status === "SUCCESS") || list[0];
    return paid?.payment_group || paid?.payment_method?.card?.card_type || null;
};

// Routes a confirmed payment to the service that sold it. Shared by the Cashfree completion path and the
// corporate card leg, which hands in the redeem receipt as paymentGatewayResponse.
const dispatchServicePayment = async ({ req, res, next, paymentRefId, paymentBodyData, orderDetails }) => {
  let operator = req.body.accessKey;
  switch (operator) {
    case operatorData["prepaid"]["accessKey"]:
      await prepaid.payment(req, res, next);
      break;
    case operatorData["postpaid"]["accessKey"]: {
      let accessKey = operatorsData["postpaid"]["accessKey"];
      let transactionCategory = operatorsData["postpaid"]["category"];
      const type = operatorsData["postpaid"]["type"];
      const postpaidHandler = commonBillHandler(accessKey, transactionCategory, type);
      await postpaidHandler.payment(req, res, next);
      break;
    }
    case operatorData["otme"]["accessKey"]: {
      let accessKey = operatorsData["otme"]["accessKey"];
      let transactionCategory = operatorsData["otme"]["category"];
      const type = operatorsData["otme"]["type"];
      const postpaidHandler = commonBillHandler(accessKey, transactionCategory, type);
      await postpaidHandler.payment(req, res, next);
      break;
    }
    case operatorData["broadband"]["accessKey"]: {
      let accessKey = operatorsData["broadband"]["accessKey"];
      let transactionCategory = operatorsData["broadband"]["category"];
      const type = operatorsData["broadband"]["type"];
      const broadbandHandler = commonBillHandler(accessKey, transactionCategory, type);
      await broadbandHandler.payment(req, res, next);
      break;
    }
    case operatorData["education"]["accessKey"]: {
      let accessKey = operatorsData["education"]["accessKey"];
      let transactionCategory = operatorsData["education"]["category"];
      const type = operatorsData["education"]["type"];
      const educationHandler = commonBillHandler(accessKey, transactionCategory, type);
      await educationHandler.payment(req, res, next);
      break;
    }
    case operatorData["electricity"]["accessKey"]: {
      let accessKey = operatorsData["electricity"]["accessKey"];
      let transactionCategory = operatorsData["electricity"]["category"];
      const type = operatorsData["electricity"]["type"];
      const electricityHandler = commonBillHandler(accessKey, transactionCategory, type);
      await electricityHandler.payment(req, res, next);
      break;
    }
    case operatorData["landline"]["accessKey"]: {
      let accessKey = operatorsData["landline"]["accessKey"];
      let transactionCategory = operatorsData["landline"]["category"];
      const type = operatorsData["landline"]["type"];
      const landlineHandler = commonBillHandler(accessKey, transactionCategory, type);
      await landlineHandler.payment(req, res, next);
      break;
    }
    case operatorData["lpg"]["accessKey"]: {
      let accessKey = operatorsData["lpg"]["accessKey"];
      let transactionCategory = operatorsData["lpg"]["category"];
      const type = operatorsData["lpg"]["type"];
      const lpgHandler = commonBillHandler(accessKey, transactionCategory, type);
      await lpgHandler.payment(req, res, next);
      break;
    }
    case operatorData["pipedGas"]["accessKey"]: {
      let accessKey = operatorsData["pipedGas"]["accessKey"];
      let transactionCategory = operatorsData["pipedGas"]["category"];
      const type = operatorsData["pipedGas"]["type"];
      const pipedGasHandler = commonBillHandler(accessKey, transactionCategory, type);
      await pipedGasHandler.payment(req, res, next);
      break;
    }
    case operatorData["water"]["accessKey"]: {
      let accessKey = operatorsData["water"]["accessKey"];
      let transactionCategory = operatorsData["water"]["category"];
      const type = operatorsData["water"]["type"];
      const waterHandler = commonBillHandler(accessKey, transactionCategory, type);
      await waterHandler.payment(req, res, next);
      break;
    }
    case operatorData["dth"]["accessKey"]: {
      let accessKey = operatorsData["dth"]["accessKey"];
      let transactionCategory = operatorsData["dth"]["category"];
      const type = operatorsData["dth"]["type"];
      const dthHandler = commonBillHandler(accessKey, transactionCategory, type);
      await dthHandler.payment(req, res, next);
      break;
    }
    case operatorData["bbps_subscriptions"]["accessKey"]: {
      let accessKey = operatorsData["bbps_subscriptions"]["accessKey"];
      let transactionCategory = operatorsData["bbps_subscriptions"]["category"];
      const type = operatorsData["bbps_subscriptions"]["type"];
      const bbps_subscriptionsHandler = commonBillHandler(accessKey, transactionCategory, type);
      await bbps_subscriptionsHandler.payment(req, res, next);
      break;
    }
    case operatorData["health"]["accessKey"]: {
      let accessKey = operatorsData["health"]["accessKey"];
      let transactionCategory = operatorsData["health"]["category"];
      const type = operatorsData["health"]["type"];
      const healthHandler = commonBillHandler(accessKey, transactionCategory, type);
      await healthHandler.payment(req, res, next);
      break;
    }
    case operatorData["creditCard"]["accessKey"]: {
      let accessKey = operatorsData["creditCard"]["accessKey"];
      let transactionCategory = operatorsData["creditCard"]["category"];
      const type = operatorsData["creditCard"]["type"];
      const creditCardHandler = commonBillHandler(accessKey, transactionCategory, type);
      await creditCardHandler.payment(req, res, next);
      break;
    }
    case operatorData["deposite"]["accessKey"]: {
      let accessKey = operatorsData["deposite"]["accessKey"];
      let transactionCategory = operatorsData["deposite"]["category"];
      const type = operatorsData["deposite"]["type"];
      const depositeHandler = commonBillHandler(accessKey, transactionCategory, type);
      await depositeHandler.payment(req, res, next);
      break;
    }
    case operatorData["donations"]["accessKey"]: {
      let accessKey = operatorsData["donations"]["accessKey"];
      let transactionCategory = operatorsData["donations"]["category"];
      const type = operatorsData["donations"]["type"];
      const donationsHandler = commonBillHandler(accessKey, transactionCategory, type);
      await donationsHandler.payment(req, res, next);
      break;
    }
    case operatorData["loanRepayment"]["accessKey"]: {
      let accessKey = operatorsData["loanRepayment"]["accessKey"];
      let transactionCategory = operatorsData["loanRepayment"]["category"];
      const type = operatorsData["loanRepayment"]["type"];
      const loanRepaymentHandler = commonBillHandler(accessKey, transactionCategory, type);
      await loanRepaymentHandler.payment(req, res, next);
      break;
    }
    case operatorData["municipalServices"]["accessKey"]: {
      let accessKey = operatorsData["municipalServices"]["accessKey"];
      let transactionCategory = operatorsData["municipalServices"]["category"];
      const type = operatorsData["municipalServices"]["type"];
      const municipalServicesHandler = commonBillHandler(accessKey, transactionCategory, type);
      await municipalServicesHandler.payment(req, res, next);
      break;
    }
    case operatorData["municipalTaxes"]["accessKey"]: {
      let accessKey = operatorsData["municipalTaxes"]["accessKey"];
      let transactionCategory = operatorsData["municipalTaxes"]["category"];
      const type = operatorsData["municipalTaxes"]["type"];
      const municipalTaxesHandler = commonBillHandler(accessKey, transactionCategory, type);
      await municipalTaxesHandler.payment(req, res, next);
      break;
    }
    case operatorData["rental"]["accessKey"]: {
      let accessKey = operatorsData["rental"]["accessKey"];
      let transactionCategory = operatorsData["rental"]["category"];
      const type = operatorsData["rental"]["type"];
      const rentalHandler = commonBillHandler(accessKey, transactionCategory, type);
      await rentalHandler.payment(req, res, next);
      break;
    }
    case operatorData["bike"]["accessKey"]: {
      let accessKey = operatorsData["bike"]["accessKey"];
      let transactionCategory = operatorsData["bike"]["category"];
      const type = operatorsData["bike"]["type"];
      const bikeHandler = commonBillHandler(accessKey, transactionCategory, type);
      await bikeHandler.payment(req, res, next);
      break;
    }
    case operatorData["car"]["accessKey"]: {
      let accessKey = operatorsData["car"]["accessKey"];
      let transactionCategory = operatorsData["car"]["category"];
      const type = operatorsData["car"]["type"];
      const carHandler = commonBillHandler(accessKey, transactionCategory, type);
      await carHandler.payment(req, res, next);
      break;
    }
    case operatorData["life"]["accessKey"]: {
      let accessKey = operatorsData["life"]["accessKey"];
      let transactionCategory = operatorsData["life"]["category"];
      const type = operatorsData["life"]["type"];
      const lifeHandler = commonBillHandler(accessKey, transactionCategory, type);
      await lifeHandler.payment(req, res, next);
      break;
    }
    case operatorData["clubs"]["accessKey"]: {
      let accessKey = operatorsData["clubs"]["accessKey"];
      let transactionCategory = operatorsData["clubs"]["category"];
      const type = operatorsData["clubs"]["type"];
      const clubsHandler = commonBillHandler(accessKey, transactionCategory, type);
      await clubsHandler.payment(req, res, next);
      break;
    }
    case operatorData["hospitals"]["accessKey"]: {
      let accessKey = operatorsData["hospitals"]["accessKey"];
      let transactionCategory = operatorsData["hospitals"]["category"];
      const type = operatorsData["hospitals"]["type"];
      const hospitalsHandler = commonBillHandler(accessKey, transactionCategory, type);
      await hospitalsHandler.payment(req, res, next);
      break;
    }
    case operatorData["housingSociety"]["accessKey"]: {
      let accessKey = operatorsData["housingSociety"]["accessKey"];
      let transactionCategory = operatorsData["housingSociety"]["category"];
      const type = operatorsData["housingSociety"]["type"];
      const housingSocietyHandler = commonBillHandler(accessKey, transactionCategory, type);
      await housingSocietyHandler.payment(req, res, next);
      break;
    }
    case operatorData["ncmc"]["accessKey"]: {
      let accessKey = operatorsData["ncmc"]["accessKey"];
      let transactionCategory = operatorsData["ncmc"]["category"];
      const type = operatorsData["ncmc"]["type"];
      const ncmcHandler = commonBillHandler(accessKey, transactionCategory, type);
      await ncmcHandler.payment(req, res, next);
      break;
    }
    case operatorData["nps"]["accessKey"]: {
      let accessKey = operatorsData["nps"]["accessKey"];
      let transactionCategory = operatorsData["nps"]["category"];
      const type = operatorsData["nps"]["type"];
      const npsHandler = commonBillHandler(accessKey, transactionCategory, type);
      await npsHandler.payment(req, res, next);
      break;
    }
    case operatorData["prepaidMeter"]["accessKey"]: {
      let accessKey = operatorsData["prepaidMeter"]["accessKey"];
      let transactionCategory = operatorsData["prepaidMeter"]["category"];
      const type = operatorsData["prepaidMeter"]["type"];
      const prepaidMeterHandler = commonBillHandler(accessKey, transactionCategory, type);
      await prepaidMeterHandler.payment(req, res, next);
      break;
    }
    case operatorData["fastag"]["accessKey"]: {
      let accessKey = operatorsData["fastag"]["accessKey"];
      let transactionCategory = operatorsData["fastag"]["category"];
      const type = operatorsData["fastag"]["type"];
      const fastagHandler = commonBillHandler(accessKey, transactionCategory, type);
      await fastagHandler.payment(req, res, next);
      break;
    }
    case operatorData["giftCard"]["accessKey"]:
      await giftcards.payment(req, res, next);
      break;
     case operatorData["xoxoday"]["accessKey"]:
      await giftcards.payment(req, res, next);
      break;
    case operatorData["e-commerce"]["accessKey"]:
      // Office Supplies is ONDC: capture wallet/PG txn, then await purchase
      // ONDC confirmOrder. Easy Split runs on purchase on_confirm.
      if (paymentBodyData.isOndc) {
        customLog(req?.LogTraceId, "info", {
          flow: "ondcEasySplit",
          step: "callback-branch",
          message: "handlePGCallback: ONDC e-commerce — routing to ondcEcommerce.payment (then confirmOrder)",
          paymentRefId,
          isOndc: true,
          ondcGroupCount: Array.isArray(paymentBodyData.ondcGroups)
            ? paymentBodyData.ondcGroups.length
            : 0,
        }, "VENDOR");
        await ondcEcommerce.payment(req, res, next);
      } else {
        customLog(req?.LogTraceId, "info", {
          flow: "ondcEasySplit",
          step: "callback-branch",
          message: "handlePGCallback: legacy e-commerce — no ONDC confirm",
          paymentRefId,
          isOndc: false,
        }, "VENDOR");
        await ecommerce.payment(req, res, next);
      }
      break;
    case operatorData["carbonFootprints"]["accessKey"]:
      await carbonFootprint.payment(req, res, next);
      break;
    case operatorData["workspace"]["accessKey"]:
      await workspace.payment(req, res, next);
      break;
    case operatorData["flight"]["accessKey"]:
      await flight.payment(req, res, next);
      break;
    case operatorData["hotel"]["accessKey"]:
      await hotel.payment(req, res, next);
      break;
    case operatorData["logistics"]["accessKey"]:
      await logistics.payment(req, res, next);
      break;
    case operatorData["subscription"]["accessKey"]:
      await softwares.payment(req, res, next);
      break;
    case operatorData["softwares"]["accessKey"]:
      await softwaresV2.payment(req, res, next);
      break; 
    case operatorData["hike"]["accessKey"]:
      await hike.payment(req, res, next);
      break;
    case operatorData["gst-registration"]["accessKey"]:
    case operatorData["pt-registration"]["accessKey"]:
    case operatorData["shop-establishment-license"]["accessKey"]:
    case operatorData["tan-registration"]["accessKey"]:
    case operatorData["epf-registration"]["accessKey"]:
    case operatorData["esi-registration"]["accessKey"]:
    case operatorData["pan-registration"]["accessKey"]:
    case operatorData["gst-composition-scheme"]["accessKey"]:
    case operatorData["msme-registration"]["accessKey"]:
    case operatorData["trademark-registration"]["accessKey"]:
    case operatorData["startup-india"]["accessKey"]:
    case operatorData["iso-certification"]["accessKey"]:
    case operatorData["fssai-basic"]["accessKey"]:
    case operatorData["fssai-state"]["accessKey"]:
    case operatorData["fssai-central"]["accessKey"]:
    case operatorData["drug-license-retail"]["accessKey"]:
    case operatorData["drug-license-wholesale"]["accessKey"]:
    case operatorData["drug-manufacturing"]["accessKey"]:
    case operatorData["12a-80g-registration"]["accessKey"]:
    case operatorData["fcra-registration"]["accessKey"]:
    case operatorData["trade-license"]["accessKey"]:
    case operatorData["fire-safety-noc"]["accessKey"]:
    case operatorData["pcb-consent"]["accessKey"]:
    case operatorData["factory-license"]["accessKey"]:
    case operatorData["rera-promoter"]["accessKey"]:
    case operatorData["rera-agent"]["accessKey"]:
    case operatorData["iec-registration"]["accessKey"]:
    case operatorData["dsc"]["accessKey"]:
      await govtServices.payment(req, res, next);
      break;
    case operatorData["pekoWorks"]["accessKey"]:
      await works.payment(req, res, next);
      break;
    case operatorData["subscriptionPlans"]["accessKey"]:
      if (req.body.kind === 'ADDON_PURCHASE') {
        await subscription.addonPayment(req, res, next);
      } else if (req.body.isAddOns) {
        await subscription.subscriptionAddOnsPayment(req, res, next);
      } else {
        req.isGatewayConfirmedPurchase = true;
        req.gatewayOrderCreatedAt = orderDetails.createdAt;
        await subscription.payment(req, res, next);
      }
      break;
    case operatorData["verificationSuite"]["accessKey"]:
      await verificationSuiteAddOn.purchaseVerificationSuiteAddOn(req, res, next);
      break;
    case operatorData["whatsAppForBusiness"]["accessKey"]:
      if (req.body.isSubscription) {
        await whatsAppForBusiness.ProjectSubscriptionPayment(req, res, next);
      } else if (req.body.isAddOns) {
        await whatsAppForBusiness.botBuilderpayment(req, res, next);
      } else {
        await whatsAppForBusiness.payment(req, res, next);
      }
      break;
    case operatorData["email_domain_service"]["accessKey"]:
      await softwareSubscription.payment(req, res, next);
      break;
    case operatorData["eSIM"]["accessKey"]:
      await esim.payment(req, res, next);
      break;
    case operatorData["eSIMTunz"]["accessKey"]:
      await eSimTunz.payment(req, res, next);
      break;
    case operatorData["pekoWallet"]["accessKey"]:
      await wallet.payment(req, res, next);
      break;
    case operatorData["corporateCards"]["accessKey"]:
      await corporateCards.payment(req, res, next);
      break;
    case operatorData["domainAndHosting"]["accessKey"]:
      await domainAndHosting.payment(req, res, next);
      break;
    case operatorData["companyIncorporation"]["accessKey"]:
      await companyIncorporation.payment(req, res, next);
      break;
    case operatorData["visa"]["accessKey"]:
      await visa.payment(req, res, next);
      break;
     case operatorData["governmentServices"]["accessKey"]:
      await govtServicesV2.payment(req, res, next);
      break;
    case operatorData["globalBusinessSetup"]["accessKey"]:
      if (req.body.isRenewalApproval || req.body.renewalId) {
        await globalBusinessSetup.renewalApprove(req, res, next);
      } else {
        await globalBusinessSetup.payment(req, res, next);
      }
      break;
    case operatorData["businessRegistration"]["accessKey"]:
      await businessRegistration.payment(req, res, next);
      break;
    case operatorData["challan"]["accessKey"]:
      await challan.payment(req, res, next);
      break;
    case operatorData["bus"]["accessKey"]:
      await bus.payment(req, res, next);
      break;
      case operatorData["carReport"]["accessKey"]:
      await carReport.payment(req, res, next);
      break;
    case operatorData["ecommerceStore"]["accessKey"]:
      await ecommerceStore.payment(req, res, next);
      break;
    case operatorData["pekoPos"]["accessKey"]:
      await pos.payment(req, res, next);
      break;
    default:
      return next(new ErrorResponse("Service not found", 404));
  }
};
exports.dispatchServicePayment = dispatchServicePayment;

exports.handlePGCallback = asyncHandler(async (req, res, next) => {
  let paymentRefId = req.body.ORDERID;

  // we saved payment data while creating order . finding order Data using ref id
  let orderDetails = await paymentGatewayOrders.findOne({
    where: { paymentRefId },
  });
  
     customLog(req?.LogTraceId, "info", {
      message: "Log for getting order details",
      data: orderDetails
    });
  if (!orderDetails) {
    return next(new ErrorResponse("Order details not found", 400));
  }

  let paymentBodyData = JSON.parse(orderDetails.paymentData);
  const serviceAccessKey = paymentBodyData.accessKey;
  const orderGatewayProvider = getOrderGatewayProvider(orderDetails);
  if (orderGatewayProvider) {
    if (String(paymentBodyData.userId) !== String(req.user?.id)) {
      customLog(req?.LogTraceId, "error", {
        action: "gatewayProvider:completeUserMismatch",
        provider: orderDetails.pgProvider,
        paymentRefId,
      }, "VENDOR");
      return next(new ErrorResponse("Unauthorized", 403));
    }
    orderDetails = await reopenPaidGatewayOrder({ orderDetails, paymentBodyData, logTraceId: req?.LogTraceId });
  }

  // Bulk eSIM short-circuit: bulk eSIM PG payments use processPaymentInternal which creates
  // one wallet txn per item (none of which equal paymentRefId), so the lookup below would
  // always miss and we'd return processing:true forever. Instead, build the same Redis key
  // processPaymentInternal stored under and return it as bulkPaymentData.
  const isEsimAccessKey = serviceAccessKey === 'esim' || serviceAccessKey === 'esim_tunz';
  const isMultiVendor = Array.isArray(paymentBodyData.orderGroups);
  const totalQty = isMultiVendor
    ? paymentBodyData.orderGroups.reduce((s, g) => s + (g.orders || []).reduce((a, o) => a + (Number(o.quantity) || 0), 0), 0)
    : (paymentBodyData.orders || []).reduce((s, o) => s + (Number(o.quantity) || 0), 0);
  const isBulkEsim = (isEsimAccessKey || isMultiVendor) && totalQty > 1;

  if (orderDetails.status === "COMPLETE" && isBulkEsim) {
    const redisKeyOrKeys = isMultiVendor
      ? paymentBodyData.orderGroups.map((_, i) => `esim:payment:order:${paymentRefId}:vendor${i}`)
      : `esim:payment:order:${paymentRefId}`;

    // Race-safety: handlePendingTransactions marks order COMPLETE *before* processPaymentInternal
    // finishes setValue(). If the FE call lands in that gap, Redis won't have data yet and the
    // success page would 404. Verify keys exist; if not, fall through to processing:true and let
    // the Pusher event handle the redirect once the worker completes.
    const keysToCheck = Array.isArray(redisKeyOrKeys) ? redisKeyOrKeys : [redisKeyOrKeys];
    const cachedValues = await Promise.all(keysToCheck.map(k => getValue(k)));
    const allKeysPopulated = cachedValues.every(v => v !== null && v !== undefined);

    if (allKeysPopulated) {
      const walletData = await walletEntity.findOne({
        where: { credentialId: req.user.id },
        attributes: ["balance"],
      });
      // paymentMode is computed in processPaymentInternal and stored in Redis, not in paymentBodyData
      let cachedPaymentMode = null;
      try {
        cachedPaymentMode = JSON.parse(cachedValues[0])?.[0]?.paymentMode || null;
      } catch (_) { /* malformed cache */ }
      return res.status(200).json({
        status: true,
        message: "Payment Successful",
        responseCode: "000",
        data: {
          bulkPaymentData: redisKeyOrKeys,
          corporateFinalBalance: walletData?.balance ?? null,
          paymentMode: cachedPaymentMode,
        },
      });
    }
  }

  if (orderDetails.status === "COMPLETE") {
    // If the BBPS handler early-exited and refunded via refundIfPaidViaCashfree, paymentResponse
    // will carry an earlyExitRefund marker. There's no orders row to look up, so without this
    // check the next branch would incorrectly return processing:true forever.
    let earlyExitRefund = null;
    if (orderDetails.paymentResponse) {
      try {
        earlyExitRefund = JSON.parse(orderDetails.paymentResponse)?.earlyExitRefund || null;
      } catch (_) { /* paymentResponse not JSON / not ours */ }
    }
    if (earlyExitRefund) {
      const walletData = await walletEntity.findOne({
        where: { credentialId: req.user.id },
        attributes: ["balance"],
      });
      return res.status(400).json({
        status: false,
        data: {
          failed: true,
          corporateTxnId: paymentRefId,
          corporateFinalBalance: walletData?.balance ?? null,
          refundStatus: earlyExitRefund.refundStatus,
          refundAmount: earlyExitRefund.refundAmount,
          reason: earlyExitRefund.reason,
        },
        message: "Payment failed and refund has been initiated.",
        responseCode: "001",
      });
    }

    const txn = await findOneOrder({ corporateTxnId: String(paymentRefId) });
      
     customLog(req?.LogTraceId, "info", {
      message: "Log for getting transaction details",
      data: txn
    });
    if (!txn || txn.status === "AWAITED" || txn.status === "PENDING" || txn.status === "PROCESSING") {
      const walletData = await walletEntity.findOne({
        where: { credentialId: req.user.id },
        attributes: ["balance"],
      });
      let billDetails = null;
      try {
        billDetails = txn?.orderResponse ? JSON.parse(txn.orderResponse)?.billDetails : null;
      } catch (error) {
        customLog(req?.LogTraceId, "error", {
          message: "Error parsing orderResponse billDetails",
          error: error?.message,
        });
      }
      const serviceType = Object.values(operatorsData).find(
        op => op.accessKey === serviceAccessKey
      )?.type || null;
      return res.status(200).json({
        status: true,
        data: {
          processing: true,
          ...(billDetails || {}),
          corporateTxnId: paymentRefId,
          paymentMode: txn?.paymentMode || paymentBodyData.paymentMode || null,
          corporateFinalBalance: walletData?.balance ?? null,
          ...(serviceType && { serviceProvider: serviceType }),
        },
        message: "Payment is processing",
        responseCode: "001",
      });
    }
    if (txn.status === "SUCCESS") {
      const paymentResponse = orderDetails.paymentResponse ? JSON.parse(orderDetails.paymentResponse) : null;
      return res.status(200).json({
        status: true,
        message: "Payment already processed successfully",
        responseCode: "000",
        data: {
          paymentRefId: orderDetails.paymentRefId,
          corporateTxnId: orderDetails.paymentRefId,
          amount: paymentBodyData.amount,
          accessKey: paymentBodyData.accessKey,
          account: paymentBodyData.account,
          paymentMode: extractPaymentMode(paymentResponse) || paymentBodyData.paymentMode || null,
          paymentGatewayResponse: paymentResponse,
          // Visa: the order was already finalized by the async webhook before
          // this request landed, so the visa success page's orderNumber would
          // otherwise be missing. Scoped to visa only — no other service reads
          // this field from this response, so this can't affect them.
          ...(serviceAccessKey === operatorsData["visa"]["accessKey"] && { orderNumber: txn.providerId }),
        },
      });
    }
    // FAILURE or REFUNDED — payment was captured but order failed and was refunded
    const walletData = await walletEntity.findOne({
      where: { credentialId: req.user.id },
      attributes: ["balance"],
    });
    return res.status(400).json({
      status: false,
      data: { corporateFinalBalance: walletData?.balance ?? null },
      message: "payment failed",
      responseCode: "001",
    });
  }
  if (orderDetails.status !== "ORDERED") {
    customLog(req?.LogTraceId, "error", {
      message: "Unauthorised payment request — order not in ORDERED status",
      orderId: orderDetails.orderId,
      currentStatus: orderDetails.status,
      expectedStatus: "ORDERED",
    });
    return next(new ErrorResponse("Unauthoirsed payment request", 401));
  }
  let serviceDetails = null;
  let individualServiceDetails = null;
  if (!orderGatewayProvider) {
    serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    individualServiceDetails = serviceAccessKey ? await findServiceOperatorByAccessKey(serviceAccessKey) : null;

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400));
    }
  }
  const orderIdPrefix = req.user.role === "CORPORATE_SUB_USER" ? "pekoSub" : "peko";

  try {
    let paymentResponse;
    let orderStatus;
    if (orderGatewayProvider) {
      ({ paymentResponse, orderStatus } = await verifyGatewayOrder({
        orderDetails,
        paymentBodyData,
        logTraceId: req?.LogTraceId,
      }));
    } else {
      // Same merchant createOrder used — an ONDC order lives only on the
      // `cashfree_ondc` merchant, so resolving the shared one here would 404.
      const ondcServiceDetails = await loadOndcCashfreeOperator(paymentBodyData.isOndc);
      const { clientId, clientSecret, baseUrl, version, merchant } = pickCashfreeCredentials({
        shared: serviceDetails,
        individual: individualServiceDetails,
        ondc: ondcServiceDetails,
      });
      const orderId = `${orderIdPrefix}_${paymentRefId}`;

      const config = {
        method: "GET",
        url: `${baseUrl}/pg/orders/${orderId}/payments`,
        headers: {
          "x-api-version": version,
          "x-client-id": clientId,
          "x-client-secret": clientSecret,
          "Content-Type": "application/json",
        },
      };

      customLog(req?.LogTraceId, "info", {
        message: "Fetching Cashfree payments for the order",
        orderId,
        merchant,
        isOndc: Boolean(paymentBodyData.isOndc),
        accessKey: serviceAccessKey,
      }, "VENDOR");

      const response = await axios(config);
      paymentResponse = Array.isArray(response.data)
        ? response.data.map((p) => ({ ...p, paymentGatewayName: "Cashfree" }))
        : response.data;
      if (paymentResponse.filter((transaction) => transaction.payment_status === "SUCCESS").length > 0) {
        orderStatus = "SUCCESS";
      } else if (paymentResponse.filter((transaction) => transaction.payment_status === "PENDING").length > 0) {
        orderStatus = "PENDING";
      } else {
        orderStatus = "FAILURE";
      }
    }
        if (orderStatus === "SUCCESS") {
          const [affectedCount] = await paymentGatewayOrders.update(
            {
              status: "COMPLETE",
              paymentResponse: JSON.stringify(paymentResponse),
            },
            { where: { paymentRefId, status: "ORDERED" } }
          );
          if (affectedCount === 0) {
            customLog(req?.LogTraceId, "info", {
              message: "handlePGCallback: lost CAS race — webhook already claimed this order; returning processing",
              paymentRefId,
            });
            const walletData = await walletEntity.findOne({
              where: { credentialId: req.user.id },
              attributes: ["balance"],
            });
            const txn = await findOneOrder({ corporateTxnId: String(paymentRefId) });
            let billDetails = null;
            try {
              billDetails = txn?.orderResponse ? JSON.parse(txn.orderResponse)?.billDetails : null;
            } catch (_) { /* orderResponse missing/malformed */ }
            const serviceType = Object.values(operatorsData).find(
              op => op.accessKey === serviceAccessKey
            )?.type || null;
            if (txn?.status === "SUCCESS") {
              return res.status(200).json({
                status: true,
                message: "Payment already processed successfully",
                responseCode: "000",
                data: {
                  paymentRefId,
                  corporateTxnId: paymentRefId,
                  amount: paymentBodyData.amount,
                  accessKey: paymentBodyData.accessKey,
                  account: paymentBodyData.account,
                  paymentMode: extractPaymentMode(paymentResponse) || paymentBodyData.paymentMode || null,
                  paymentGatewayResponse: paymentResponse,
                  corporateFinalBalance: walletData?.balance ?? null,
                },
              });
            }
            return res.status(200).json({
              status: true,
              data: {
                processing: true,
                ...(billDetails || {}),
                corporateTxnId: paymentRefId,
                paymentMode: txn?.paymentMode || paymentBodyData.paymentMode || null,
                corporateFinalBalance: walletData?.balance ?? null,
                ...(serviceType && { serviceProvider: serviceType }),
              },
              message: "Payment is processing",
              responseCode: "001",
            });
          }
          req.body = {
            ...paymentBodyData,
            corporateTxnId: paymentRefId,
            paymentGatewayResponse: paymentResponse,
          };

          try {
          // Multi-vendor path: mixed Bondio + Tunz purchase via PG
          if (Array.isArray(req.body.orderGroups)) {
            const groups = req.body.orderGroups;
            const results = [];

            const parentBatchId = Date.now();
            const totalVendorGroups = groups.length;

            for (let i = 0; i < groups.length; i++) {
              const group = groups[i];
              const isEsimTunz = group.accessKey === operatorData["eSIMTunz"]["accessKey"];
              const processInternal = isEsimTunz
                ? eSimTunz.processPaymentInternal
                : esim.processPaymentInternal;

              const result = await processInternal({
                credentialId: req.user.id,
                isSubCorporateUser: req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername,
                subCorporateUserId: req.user.subCorporateId,
                orders: group.orders,
                planIds: group.planIds,
                amount: group.amount,
                account: req.body.account,
                paymentGatewayResponse: req.body.paymentGatewayResponse,
                pgAmount: group.pgAmount,
                req,
                parentBatchId,
                totalVendorGroups,
                vendorIndex: i,
              });

              if (!result.success) {
                customLog(req?.LogTraceId, "error", {
                  message: `Mixed vendor PG payment error for ${group.accessKey}: ${result.error}`,
                  paymentRefId,
                }, "VENDOR");
                return res.status(500).json({
                  status: false,
                  message: result.error || "Payment processing failed",
                });
              }
              results.push(result);
            }

            const walletBalance = results[0].walletBalance;
            const totalDeducted = groups.reduce((sum, g) => sum + Number(g.amount) + Number(g.surcharge || 0), 0);
            const corporateFinalBalance = (walletBalance - totalDeducted).toFixed(2);

            return res.status(200).json({
              status: true,
              message: "Payment started processing",
              responseCode: '000',
              data: {
                bulkPaymentData: results.map(r => r.redisKey),
                corporateFinalBalance,
                paymentMode: results[0]?.paymentMode,
              },
            });
          }

          await dispatchServicePayment({ req, res, next, paymentRefId, paymentBodyData, orderDetails });
          } catch (paymentError) {
            customLog(req?.LogTraceId, "error", {
              message: "Error processing payment in callback",
              error: paymentError?.message ?? paymentError,
              paymentRefId,
              operator: req.body.accessKey
            }, "VENDOR");
            await paymentGatewayOrders.update(
              {
                status: "FAILED",
                paymentResponse: JSON.stringify(paymentResponse),
              },
              { where: { paymentRefId } }
            );
            return next(new ErrorResponse("Payment processing failed", 500));
          }
        } else if (orderStatus === "PENDING") {
          await paymentGatewayOrders.update(
            {
              paymentResponse: JSON.stringify(paymentResponse),
            },
            { where: { paymentRefId } }
          );
          return res.status(200).json({
            status: true,
            data: {
              pending: true,
            },
            message: "payment pending",
            responseCode: "000",
          });
        } else {
          // Compare-and-set rather than a blind write: re-writing paymentResponse
          // on an already-FAILED order is a no-op worth skipping, and the affected
          // count tells us whether THIS call is the one that failed the order.
          //
          // The count used to gate a payment-failed email (spec template 3). That
          // template was deleted by the 2026-08-24 spec revision, so nothing is
          // sent here any more — the guard is kept because it is the correct write.
          //
          // F-PG-07: only fail the order when Cashfree shows real payment attempts. With no attempt yet
          // (/complete called before the customer paid), writing FAILED made the later genuine
          // PAYMENT_SUCCESS_WEBHOOK get rejected (it only processes ORDERED) — customer charged, nothing
          // delivered. The order stays ORDERED; the browser still gets the same "Payment failed" reply.
          if (paymentResponse.length > 0) {
            await paymentGatewayOrders.update(
              {
                status: "FAILED",
                paymentResponse: JSON.stringify(paymentResponse),
              },
              { where: { paymentRefId, status: { [Op.ne]: "FAILED" } } }
            );
          }

          return next(new ErrorResponse("Payment failed", 502));
        }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { 
      error: error?.response?.data ?? error?.response ?? error?.message ?? error,
      message: "Error in handlePGCallback"
    }, "VENDOR");
    await paymentGatewayOrders.update(
      {
        referenceNo: req.body.TXNID,
        status: "FAILED",
        paymentResponse: JSON.stringify(req.body),
      },
      { where: { paymentRefId } }
    );
    return next(new ErrorResponse("Payment failed", 500));
  }
});

exports.handlePGWebhook = asyncHandler(async (req, res) => {
  const traceId = req?.LogTraceId;
  try {
    const { data: body, event_time, type } = req.body;
    customLog(
      traceId,
      "info",
      {
        message: "Webhook body of cashfree",
        time: event_time,
        type: type,
        body: req.body,
      },
      "VENDOR"
    );
    if (body?.data?.test_object?.test_key) {
      return res.status(200).json({ status: true, message: "Webhook received successfully" });
    }
    if (type !== "REFUND_STATUS_WEBHOOK") {
      return res.status(200).json({ status: false, responseCode: "002" });
    }

    const { refund } = body;
    customLog(
      traceId,
      "info",
      {
        message: "Webhook body of cashfree - refund",
        refund,
      },
      "VENDOR"
    );
    if (refund.refund_type !== "MERCHANT_INITIATED") {
      return res.status(400).json({ status: false, responseCode: "002" });
    }
    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return res.status(400).json({ status: false, responseCode: "002" });
    }
    // Cashfree.XClientId = serviceDetails.vendor.optional1;
    // Cashfree.XClientSecret = serviceDetails.vendor.optional2;
    // Cashfree.XEnvironment =
    //   process.env.NODE_ENV == "staging"
    //     ? Cashfree.Environment.SANDBOX
    //     : Cashfree.Environment.PRODUCTION;
    // const response = Cashfree.PGVerifyWebhookSignature(req.headers["x-webhook-signature"], req.rawBody, req.headers["x-webhook-timestamp"])
    // const version = serviceDetails.vendor.optional3;

    const corporateTxnId = body.refund.refund_id.split("_")[1];

    const orderDetails = await findOneOrder({ corporateTxnId });

    if (!orderDetails) {
      return res.status(200).json({ status: false, message: "Order details not found", responseCode: "002" });
    }

    let paymentBodyData = {};
    try {
      paymentBodyData = orderDetails?.paymentModeResponse
        ? JSON.parse(orderDetails.paymentModeResponse)
        : {};
    } catch (_) {
      paymentBodyData = {};
    }

    // Cashfree delivers webhooks at-least-once and can re-send the same event.
    // Once the refund is recorded SUCCESS, acknowledge and stop so we never
    // re-append a duplicate or double-count the refunded amount.
    if (paymentBodyData.refundStatus === "SUCCESS") {
      return res.status(200).json({ status: true, message: "Refund already processed", responseCode: "000" });
    }

    // Upsert this refund keyed by refund_id so repeated deliveries (e.g. several
    // PENDING events for the same refund) don't create duplicate entries.
    const priorResults = Array.isArray(paymentBodyData.refundResults) ? paymentBodyData.refundResults : [];
    const refundsById = new Map(priorResults.filter((r) => r?.refund_id).map((r) => [r.refund_id, r]));
    refundsById.set(refund.refund_id, refund);
    paymentBodyData.refundResults = [...refundsById.values()];
    paymentBodyData.refundStatus = refund.refund_status;

    // A partial refund (an ONDC checkout refunding only the sellers it could not
    // place) must not mark the whole payment REFUNDED while the rest of the order
    // stands — see utils/refundOrderStatus.js. Full refunds are unchanged.
    const nextStatus = resolveRefundOrderStatus({
      refundId: refund.refund_id,
      refundResults: paymentBodyData.refundResults,
      capturedAmount: paymentBodyData.payment_amount,
      currentStatus: orderDetails.status,
    });
    await updateOneOrder(corporateTxnId, {
      paymentModeResponse: JSON.stringify(paymentBodyData),
      ...(nextStatus ? { status: nextStatus } : {}),
    });

    if (refund.refund_status === "SUCCESS") {
      const refundedAmount = paymentBodyData.refundResults
        .filter((r) => r?.refund_status === "SUCCESS")
        .reduce((sum, r) => sum + Number(r?.refund_amount || 0), 0);
      await updateOneTransaction(corporateTxnId, { refundedAmount });
      customLog(traceId, "info", { message: "Refunded amount written to transaction", corporateTxnId, refundedAmount }, "VENDOR");
    }
    // Spec template 13 — the money actually landed, which is a different event from
    // "refund initiated" (template 12, sent by purchase when we ask the gateway).
    // The `refundStatus === "SUCCESS"` short-circuit above is the send-once claim.
    //
    // Deliberately after the DB write and deliberately not awaited into the
    // response: Cashfree retries a non-2xx webhook, so an SMTP problem must never
    // become a retry storm.
    sendOndcRefundCreditedEmail({
      refund,
      corporateTxnId,
      logTraceId: traceId,
    }).catch(() => {});

    return res.status(200).json({ status: true, responseCode: "000" });
  } catch (error) {
    customLog(traceId, "error", {
      message: "Unhandled exception in webhook",
      error: error?.response?.data ?? error?.response ?? error?.message ?? error,
    });
    return res.status(400).json({ status: false, responseCode: "002" });
  }
});

exports.handlePendingTransactions = async (req, res, next) => {
  const { data, type } = req.body;
  if (data?.data?.test_object?.test_key) {
    return res.status(200).json({ status: true, message: "Webhook received successfully" });
  }

  // A buyer who abandons at the Cashfree page never calls /complete, so
  // handlePGCallback's decline branch never runs and the order would sit at
  // ORDERED forever. This is the only server-side signal that the payment
  // definitively failed, so it is what marks the order FAILED.
  //
  // This branch was originally added to carry a payment-failed email (spec
  // template 3). That template was deleted by the 2026-08-24 spec revision and
  // the buyer is no longer emailed — the STATUS WRITE is kept because it is a
  // genuine fix on its own: without it an abandoned ONDC checkout never resolves.
  //
  // Requires PAYMENT_FAILED_WEBHOOK to be subscribed in the Cashfree dashboard;
  // until it is, this branch simply never fires.
  if (type === "PAYMENT_FAILED_WEBHOOK") {
    try {
      const failedRefId = data?.order?.order_id?.split("_")[1];
      if (!failedRefId) {
        return res.status(200).json({ status: false, message: "Event recieved" });
      }
      const failedOrder = await paymentGatewayOrders.findOne({ where: { paymentRefId: failedRefId } });
      const failedBody = failedOrder ? JSON.parse(failedOrder.paymentData) : null;
      if (failedOrder && failedBody?.isOndc) {
        // Compare-and-set from ORDERED, so this webhook and handlePGCallback
        // cannot both claim the same failure.
        await paymentGatewayOrders.update(
          { status: "FAILED", paymentResponse: JSON.stringify(data) },
          { where: { paymentRefId: failedRefId, status: "ORDERED" } }
        );
      }
    } catch (failedErr) {
      // Never let this change the response: Cashfree retries a non-2xx, and a
      // retry storm is worse than one unresolved order status.
      customLog(req?.LogTraceId, "error", {
        message: "PAYMENT_FAILED_WEBHOOK handling failed",
        error: failedErr?.message || String(failedErr),
      }, "VENDOR");
    }
    return res.status(200).json({ status: true, message: "Event recieved" });
  }

  if (type !== "PAYMENT_SUCCESS_WEBHOOK") {
    return res.status(200).json({ status: false, message: "Event recieved" });
  }
  let paymentRefId = data.order.order_id.split("_")[1];

  // we saved payment data while creating order . finding order Data using ref id
  let orderDetails = await paymentGatewayOrders.findOne({
    where: { paymentRefId },
  });

  if (!orderDetails) {
    return res.status(400).json({ message: "Order details not found" });
  }

  let paymentBodyData = JSON.parse(orderDetails.paymentData);
  const serviceAccessKey = paymentBodyData.accessKey;

  if (orderDetails.status === "COMPLETE") {
    const txn = await findOneOrder({ corporateTxnId: String(paymentRefId) });
    const txnStatus = txn?.status;
    if (!txnStatus || txnStatus === "AWAITED") {
      return res.status(200).json({ status: true, message: "Payment is processing", responseCode: "001" });
    }
    if (txnStatus === "SUCCESS") {
      return res.status(200).json({ status: true, message: "Payment already processed successfully", responseCode: "000" });
    }
    return res.status(200).json({ status: true, message: "Payment was processed but order failed", responseCode: "001" });
  }
  if (orderDetails.status !== "ORDERED") {
    return res.status(401).json({ message: "Unauthoirsed payment request" });
  }
  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  const individualServiceDetails = serviceAccessKey ? await findServiceOperatorByAccessKey(serviceAccessKey) : null;

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return res.status(400).json({ message: "Apologies, the service you are trying to access is currently unavailable." });
  }

  try {
    // Same merchant createOrder used — see pickCashfreeCredentials.
    const ondcServiceDetails = await loadOndcCashfreeOperator(paymentBodyData.isOndc);
    const { clientId, clientSecret, baseUrl, version, merchant } = pickCashfreeCredentials({
      shared: serviceDetails,
      individual: individualServiceDetails,
      ondc: ondcServiceDetails,
    });
    // The prefix follows the role the order was CREATED under (persisted with the
    // create-order body); a hardcoded "peko_" 404s for every sub-corporate order.
    const orderIdPrefix = paymentBodyData.role === "CORPORATE_SUB_USER" ? "pekoSub" : "peko";
    const orderId = `${orderIdPrefix}_${paymentRefId}`;

    customLog(null, "info", {
      message: "Fetching Cashfree payments for the order (webhook path)",
      orderId,
      merchant,
      isOndc: Boolean(paymentBodyData.isOndc),
      accessKey: serviceAccessKey,
    }, "VENDOR");

    const config = {
      method: "GET",
      url: `${baseUrl}/pg/orders/${orderId}/payments`,
      headers: {
        "x-api-version": version,
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "Content-Type": "application/json",
      },
    };

    const response = await axios(config);
    const paymentResponse = Array.isArray(response.data)
      ? response.data.map((p) => ({ ...p, paymentGatewayName: "Cashfree" }))
      : response.data;
        let orderStatus;
        if (paymentResponse.filter((transaction) => transaction.payment_status === "SUCCESS").length > 0) {
          orderStatus = "SUCCESS";
        } else if (paymentResponse.filter((transaction) => transaction.payment_status === "PENDING").length > 0) {
          orderStatus = "PENDING";
        } else {
          orderStatus = "FAILURE";
        }
        if (orderStatus === "SUCCESS") {
          const resolvedUserId = paymentBodyData.userId;
          if (!resolvedUserId) {
            customLog(req?.LogTraceId, "error", {
              message: "handlePendingTransactions: userId missing in paymentData — cannot process webhook. Order left in ORDERED state for reconciliation.",
              paymentRefId,
              orderId: data?.order?.order_id,
            }, "VENDOR");
            return res.status(200).json({
              status: false,
              message: "Webhook acknowledged; awaiting reconciliation",
              responseCode: "001",
            });
          }

          const [affectedCount] = await paymentGatewayOrders.update(
            {
              status: "COMPLETE",
              paymentResponse: JSON.stringify(paymentResponse),
            },
            { where: { paymentRefId, status: "ORDERED" } }
          );
          if (affectedCount === 0) {
            customLog(req?.LogTraceId, "info", {
              message: "handlePendingTransactions: lost CAS race — handlePGCallback already claimed this order; acknowledging webhook",
              paymentRefId,
            });
            return res.status(200).json({
              status: true,
              message: "Payment already being processed by callback handler",
              responseCode: "000",
            });
          }
          req.body = {
            ...paymentBodyData,
            corporateTxnId: paymentRefId,
            paymentGatewayResponse: paymentResponse,
          };
          req.user = await findUserDetails(resolvedUserId);

          // Multi-vendor path: mixed Bondio + Tunz purchase via PG
          if (Array.isArray(req.body.orderGroups)) {
            const groups = req.body.orderGroups;
            const results = [];

            const parentBatchId = Date.now();
            const totalVendorGroups = groups.length;

            for (let i = 0; i < groups.length; i++) {
              const group = groups[i];
              const isEsimTunz = group.accessKey === operatorData["eSIMTunz"]["accessKey"];
              const processInternal = isEsimTunz
                ? eSimTunz.processPaymentInternal
                : esim.processPaymentInternal;

              const result = await processInternal({
                credentialId: req.user.id,
                isSubCorporateUser: req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId && req.user.subCorporateUsername,
                subCorporateUserId: req.user.subCorporateId,
                orders: group.orders,
                planIds: group.planIds,
                amount: group.amount,
                account: req.body.account,
                paymentGatewayResponse: req.body.paymentGatewayResponse,
                pgAmount: group.pgAmount,
                req,
                parentBatchId,
                totalVendorGroups,
                vendorIndex: i,
              });

              if (!result.success) {
                customLog(req?.LogTraceId, "error", {
                  message: `Mixed vendor pending PG payment error for ${group.accessKey}: ${result.error}`,
                  paymentRefId,
                }, "VENDOR");
                return res.status(500).json({
                  status: false,
                  message: result.error || "Payment processing failed",
                });
              }
              results.push(result);
            }

            const walletBalance = results[0].walletBalance;
            const totalDeducted = groups.reduce((sum, g) => sum + Number(g.amount) + Number(g.surcharge || 0), 0);
            const corporateFinalBalance = (walletBalance - totalDeducted).toFixed(2);

            return res.status(200).json({
              status: true,
              message: "Payment started processing",
              responseCode: '000',
              data: {
                bulkPaymentData: results.map(r => r.redisKey),
                corporateFinalBalance,
                paymentMode: results[0]?.paymentMode,
              },
            });
          }

          let operator = req.body.accessKey;
          switch (operator) {
            case operatorData["prepaid"]["accessKey"]:
              await prepaid.payment(req, res, next);
              break;
            case operatorData["postpaid"]["accessKey"]: {
              let accessKey = operatorsData["postpaid"]["accessKey"];
              let transactionCategory = operatorsData["postpaid"]["category"];
              const type = operatorsData["postpaid"]["type"];
              const postpaidHandler = commonBillHandler(accessKey, transactionCategory, type);
              await postpaidHandler.payment(req, res, next);
              break;
            }
            case operatorData["otme"]["accessKey"]: {
              let accessKey = operatorsData["otme"]["accessKey"];
              let transactionCategory = operatorsData["otme"]["category"];
              const type = operatorsData["otme"]["type"];
              const postpaidHandler = commonBillHandler(accessKey, transactionCategory, type);
              await postpaidHandler.payment(req, res, next);
              break;
            }
            case operatorData["broadband"]["accessKey"]: {
              let accessKey = operatorsData["broadband"]["accessKey"];
              let transactionCategory = operatorsData["broadband"]["category"];
              const type = operatorsData["broadband"]["type"];
              const broadbandHandler = commonBillHandler(accessKey, transactionCategory, type);
              await broadbandHandler.payment(req, res, next);
              break;
            }
            case operatorData["education"]["accessKey"]: {
              let accessKey = operatorsData["education"]["accessKey"];
              let transactionCategory = operatorsData["education"]["category"];
              const type = operatorsData["education"]["type"];
              const educationHandler = commonBillHandler(accessKey, transactionCategory, type);
              await educationHandler.payment(req, res, next);
              break;
            }
            case operatorData["electricity"]["accessKey"]: {
              let accessKey = operatorsData["electricity"]["accessKey"];
              let transactionCategory = operatorsData["electricity"]["category"];
              const type = operatorsData["electricity"]["type"];
              const electricityHandler = commonBillHandler(accessKey, transactionCategory, type);
              await electricityHandler.payment(req, res, next);
              break;
            }
            case operatorData["landline"]["accessKey"]: {
              let accessKey = operatorsData["landline"]["accessKey"];
              let transactionCategory = operatorsData["landline"]["category"];
              const type = operatorsData["landline"]["type"];
              const landlineHandler = commonBillHandler(accessKey, transactionCategory, type);
              await landlineHandler.payment(req, res, next);
              break;
            }
            case operatorData["lpg"]["accessKey"]: {
              let accessKey = operatorsData["lpg"]["accessKey"];
              let transactionCategory = operatorsData["lpg"]["category"];
              const type = operatorsData["lpg"]["type"];
              const lpgHandler = commonBillHandler(accessKey, transactionCategory, type);
              await lpgHandler.payment(req, res, next);
              break;
            }
            case operatorData["pipedGas"]["accessKey"]: {
              let accessKey = operatorsData["pipedGas"]["accessKey"];
              let transactionCategory = operatorsData["pipedGas"]["category"];
              const type = operatorsData["pipedGas"]["type"];
              const pipedGasHandler = commonBillHandler(accessKey, transactionCategory, type);
              await pipedGasHandler.payment(req, res, next);
              break;
            }
            case operatorData["water"]["accessKey"]: {
              let accessKey = operatorsData["water"]["accessKey"];
              let transactionCategory = operatorsData["water"]["category"];
              const type = operatorsData["water"]["type"];
              const waterHandler = commonBillHandler(accessKey, transactionCategory, type);
              await waterHandler.payment(req, res, next);
              break;
            }
            case operatorData["dth"]["accessKey"]: {
              let accessKey = operatorsData["dth"]["accessKey"];
              let transactionCategory = operatorsData["dth"]["category"];
              const type = operatorsData["dth"]["type"];
              const dthHandler = commonBillHandler(accessKey, transactionCategory, type);
              await dthHandler.payment(req, res, next);
              break;
            }
            case operatorData["bbps_subscriptions"]["accessKey"]: {
              let accessKey = operatorsData["bbps_subscriptions"]["accessKey"];
              let transactionCategory = operatorsData["bbps_subscriptions"]["category"];
              const type = operatorsData["bbps_subscriptions"]["type"];
              const bbps_subscriptionsHandler = commonBillHandler(accessKey, transactionCategory, type);
              await bbps_subscriptionsHandler.payment(req, res, next);
              break;
            }
            case operatorData["health"]["accessKey"]: {
              let accessKey = operatorsData["health"]["accessKey"];
              let transactionCategory = operatorsData["health"]["category"];
              const type = operatorsData["health"]["type"];
              const healthHandler = commonBillHandler(accessKey, transactionCategory, type);
              await healthHandler.payment(req, res, next);
              break;
            }
            case operatorData["creditCard"]["accessKey"]: {
              let accessKey = operatorsData["creditCard"]["accessKey"];
              let transactionCategory = operatorsData["creditCard"]["category"];
              const type = operatorsData["creditCard"]["type"];
              const creditCardHandler = commonBillHandler(accessKey, transactionCategory, type);
              await creditCardHandler.payment(req, res, next);
              break;
            }
            case operatorData["deposite"]["accessKey"]: {
              let accessKey = operatorsData["deposite"]["accessKey"];
              let transactionCategory = operatorsData["deposite"]["category"];
              const type = operatorsData["deposite"]["type"];
              const depositeHandler = commonBillHandler(accessKey, transactionCategory, type);
              await depositeHandler.payment(req, res, next);
              break;
            }
            case operatorData["donations"]["accessKey"]: {
              let accessKey = operatorsData["donations"]["accessKey"];
              let transactionCategory = operatorsData["donations"]["category"];
              const type = operatorsData["donations"]["type"];
              const donationsHandler = commonBillHandler(accessKey, transactionCategory, type);
              await donationsHandler.payment(req, res, next);
              break;
            }
            case operatorData["loanRepayment"]["accessKey"]: {
              let accessKey = operatorsData["loanRepayment"]["accessKey"];
              let transactionCategory = operatorsData["loanRepayment"]["category"];
              const type = operatorsData["loanRepayment"]["type"];
              const loanRepaymentHandler = commonBillHandler(accessKey, transactionCategory, type);
              await loanRepaymentHandler.payment(req, res, next);
              break;
            }
            case operatorData["municipalServices"]["accessKey"]: {
              let accessKey = operatorsData["municipalServices"]["accessKey"];
              let transactionCategory = operatorsData["municipalServices"]["category"];
              const type = operatorsData["municipalServices"]["type"];
              const municipalServicesHandler = commonBillHandler(accessKey, transactionCategory, type);
              await municipalServicesHandler.payment(req, res, next);
              break;
            }
            case operatorData["municipalTaxes"]["accessKey"]: {
              let accessKey = operatorsData["municipalTaxes"]["accessKey"];
              let transactionCategory = operatorsData["municipalTaxes"]["category"];
              const type = operatorsData["municipalTaxes"]["type"];
              const municipalTaxesHandler = commonBillHandler(accessKey, transactionCategory, type);
              await municipalTaxesHandler.payment(req, res, next);
              break;
            }
            case operatorData["rental"]["accessKey"]: {
              let accessKey = operatorsData["rental"]["accessKey"];
              let transactionCategory = operatorsData["rental"]["category"];
              const type = operatorsData["rental"]["type"];
              const rentalHandler = commonBillHandler(accessKey, transactionCategory, type);
              await rentalHandler.payment(req, res, next);
              break;
            }
            case operatorData["bike"]["accessKey"]: {
              let accessKey = operatorsData["bike"]["accessKey"];
              let transactionCategory = operatorsData["bike"]["category"];
              const type = operatorsData["bike"]["type"];
              const bikeHandler = commonBillHandler(accessKey, transactionCategory, type);
              await bikeHandler.payment(req, res, next);
              break;
            }
            case operatorData["car"]["accessKey"]: {
              let accessKey = operatorsData["car"]["accessKey"];
              let transactionCategory = operatorsData["car"]["category"];
              const type = operatorsData["car"]["type"];
              const carHandler = commonBillHandler(accessKey, transactionCategory, type);
              await carHandler.payment(req, res, next);
              break;
            }
            case operatorData["life"]["accessKey"]: {
              let accessKey = operatorsData["life"]["accessKey"];
              let transactionCategory = operatorsData["life"]["category"];
              const type = operatorsData["life"]["type"];
              const lifeHandler = commonBillHandler(accessKey, transactionCategory, type);
              await lifeHandler.payment(req, res, next);
              break;
            }
            case operatorData["clubs"]["accessKey"]: {
              let accessKey = operatorsData["clubs"]["accessKey"];
              let transactionCategory = operatorsData["clubs"]["category"];
              const type = operatorsData["clubs"]["type"];
              const clubsHandler = commonBillHandler(accessKey, transactionCategory, type);
              await clubsHandler.payment(req, res, next);
              break;
            }
            case operatorData["hospitals"]["accessKey"]: {
              let accessKey = operatorsData["hospitals"]["accessKey"];
              let transactionCategory = operatorsData["hospitals"]["category"];
              const type = operatorsData["hospitals"]["type"];
              const hospitalsHandler = commonBillHandler(accessKey, transactionCategory, type);
              await hospitalsHandler.payment(req, res, next);
              break;
            }
            case operatorData["housingSociety"]["accessKey"]: {
              let accessKey = operatorsData["housingSociety"]["accessKey"];
              let transactionCategory = operatorsData["housingSociety"]["category"];
              const type = operatorsData["housingSociety"]["type"];
              const housingSocietyHandler = commonBillHandler(accessKey, transactionCategory, type);
              await housingSocietyHandler.payment(req, res, next);
              break;
            }
            case operatorData["ncmc"]["accessKey"]: {
              let accessKey = operatorsData["ncmc"]["accessKey"];
              let transactionCategory = operatorsData["ncmc"]["category"];
              const type = operatorsData["ncmc"]["type"];
              const ncmcHandler = commonBillHandler(accessKey, transactionCategory, type);
              await ncmcHandler.payment(req, res, next);
              break;
            }
            case operatorData["nps"]["accessKey"]: {
              let accessKey = operatorsData["nps"]["accessKey"];
              let transactionCategory = operatorsData["nps"]["category"];
              const type = operatorsData["nps"]["type"];
              const npsHandler = commonBillHandler(accessKey, transactionCategory, type);
              await npsHandler.payment(req, res, next);
              break;
            }
            case operatorData["prepaidMeter"]["accessKey"]: {
              let accessKey = operatorsData["prepaidMeter"]["accessKey"];
              let transactionCategory = operatorsData["prepaidMeter"]["category"];
              const type = operatorsData["prepaidMeter"]["type"];
              const prepaidMeterHandler = commonBillHandler(accessKey, transactionCategory, type);
              await prepaidMeterHandler.payment(req, res, next);
              break;
            }
            case operatorData["fastag"]["accessKey"]: {
              let accessKey = operatorsData["fastag"]["accessKey"];
              let transactionCategory = operatorsData["fastag"]["category"];
              const type = operatorsData["fastag"]["type"];
              const fastagHandler = commonBillHandler(accessKey, transactionCategory, type);
              await fastagHandler.payment(req, res, next);
              break;
            }
            case operatorData["giftCard"]["accessKey"]:
              await giftcards.payment(req, res, next);
              break;
            case operatorData["xoxoday"]["accessKey"]:
              await giftcards.payment(req, res, next);
              break;
            case operatorData["e-commerce"]["accessKey"]:
              // Office Supplies is ONDC: capture wallet/PG txn, then await purchase
              // ONDC confirmOrder. Easy Split runs on purchase on_confirm.
              if (paymentBodyData.isOndc) {
                customLog(req?.LogTraceId, "info", {
                  flow: "ondcEasySplit",
                  step: "webhook-branch",
                  message: "handlePendingTransactions: ONDC e-commerce — routing to ondcEcommerce.payment (then confirmOrder)",
                  paymentRefId,
                  isOndc: true,
                  ondcGroupCount: Array.isArray(paymentBodyData.ondcGroups)
                    ? paymentBodyData.ondcGroups.length
                    : 0,
                }, "VENDOR");
                await ondcEcommerce.payment(req, res, next);
              } else {
                customLog(req?.LogTraceId, "info", {
                  flow: "ondcEasySplit",
                  step: "webhook-branch",
                  message: "handlePendingTransactions: legacy e-commerce — no ONDC confirm",
                  paymentRefId,
                  isOndc: false,
                }, "VENDOR");
                await ecommerce.payment(req, res, next);
              }
              break;
            case operatorData["carbonFootprints"]["accessKey"]:
              await carbonFootprint.payment(req, res, next);
              break;
            case operatorData["workspace"]["accessKey"]:
              await workspace.payment(req, res, next);
              break;
            case operatorData["flight"]["accessKey"]:
              await flight.payment(req, res, next);
              break;
            case operatorData["hotel"]["accessKey"]:
              await hotel.payment(req, res, next);
              break;
            case operatorData["logistics"]["accessKey"]:
              await logistics.payment(req, res, next);
              break;
            case operatorData["subscription"]["accessKey"]:
              await softwares.payment(req, res, next);
              break;
            case operatorData["softwares"]["accessKey"]:
              await softwaresV2.payment(req, res, next);
              break; 
            case operatorData["hike"]["accessKey"]:
              await hike.payment(req, res, next);
              break;
            case operatorData["gst-registration"]["accessKey"]:
            case operatorData["pt-registration"]["accessKey"]:
            case operatorData["shop-establishment-license"]["accessKey"]:
            case operatorData["tan-registration"]["accessKey"]:
            case operatorData["epf-registration"]["accessKey"]:
            case operatorData["esi-registration"]["accessKey"]:
            case operatorData["pan-registration"]["accessKey"]:
            case operatorData["gst-composition-scheme"]["accessKey"]:
            case operatorData["msme-registration"]["accessKey"]:
            case operatorData["trademark-registration"]["accessKey"]:
            case operatorData["startup-india"]["accessKey"]:
            case operatorData["iso-certification"]["accessKey"]:
            case operatorData["fssai-basic"]["accessKey"]:
            case operatorData["fssai-state"]["accessKey"]:
            case operatorData["fssai-central"]["accessKey"]:
            case operatorData["drug-license-retail"]["accessKey"]:
            case operatorData["drug-license-wholesale"]["accessKey"]:
            case operatorData["drug-manufacturing"]["accessKey"]:
            case operatorData["12a-80g-registration"]["accessKey"]:
            case operatorData["fcra-registration"]["accessKey"]:
            case operatorData["trade-license"]["accessKey"]:
            case operatorData["fire-safety-noc"]["accessKey"]:
            case operatorData["pcb-consent"]["accessKey"]:
            case operatorData["factory-license"]["accessKey"]:
            case operatorData["rera-promoter"]["accessKey"]:
            case operatorData["rera-agent"]["accessKey"]:
            case operatorData["iec-registration"]["accessKey"]:
            case operatorData["dsc"]["accessKey"]:
              await govtServices.payment(req, res, next);
              break;
            case operatorData["pekoWorks"]["accessKey"]:
              await works.payment(req, res, next);
              break;
            case operatorData["subscriptionPlans"]["accessKey"]:
              if (req.body.kind === 'ADDON_PURCHASE') {
                await subscription.addonPayment(req, res, next);
              } else if (req.body.isAddOns) {
                await subscription.subscriptionAddOnsPayment(req, res, next);
              } else {
                req.isGatewayConfirmedPurchase = true;
                req.gatewayOrderCreatedAt = orderDetails.createdAt;
                await subscription.payment(req, res, next);
              }
              break;
            case operatorData["verificationSuite"]["accessKey"]:
              await verificationSuiteAddOn.purchaseVerificationSuiteAddOn(req, res, next);
              break;
            case operatorData["whatsAppForBusiness"]["accessKey"]:
              if (req.body.isSubscription) {
                await whatsAppForBusiness.ProjectSubscriptionPayment(req, res, next);
              } else if (req.body.isAddOns) {
                await whatsAppForBusiness.botBuilderpayment(req, res, next);
              } else {
                await whatsAppForBusiness.payment(req, res, next);
              }
              break;
            case operatorData["email_domain_service"]["accessKey"]:
              await softwareSubscription.payment(req, res, next);
              break;
            case operatorData["eSIM"]["accessKey"]:
              await esim.payment(req, res, next);
              break;
            case operatorData["eSIMTunz"]["accessKey"]:
              await eSimTunz.payment(req, res, next);
              break;
            case operatorData["pekoWallet"]["accessKey"]:
              await wallet.payment(req, res, next);
              break;
            case operatorData["corporateCards"]["accessKey"]:
              await corporateCards.payment(req, res, next);
              break;
            case operatorData["domainAndHosting"]["accessKey"]:
              await domainAndHosting.payment(req, res, next);
              break;
            case operatorData["companyIncorporation"]["accessKey"]:
              await companyIncorporation.payment(req, res, next);
              break;
            case operatorData["visa"]["accessKey"]:
              await visa.payment(req, res, next);
              break;
             case operatorData["governmentServices"]["accessKey"]:
              await govtServicesV2.payment(req, res, next);
              break;
            case operatorData["globalBusinessSetup"]["accessKey"]:
              if (req.body.isRenewalApproval || req.body.renewalId) {
                await globalBusinessSetup.renewalApprove(req, res, next);
              } else {
                await globalBusinessSetup.payment(req, res, next);
              }
              break;  
            case operatorData["businessRegistration"]["accessKey"]:
              await businessRegistration.payment(req, res, next);
              break;
            case operatorData["challan"]["accessKey"]:
              await challan.payment(req, res, next);
              break;
            case operatorData["bus"]["accessKey"]:
              await bus.payment(req, res, next);
              break;
               case operatorData["carReport"]["accessKey"]:
              await carReport.payment(req, res, next);
              break;
            case operatorData["ecommerceStore"]["accessKey"]:
              await ecommerceStore.payment(req, res, next);
              break;
            case operatorData["pekoPos"]["accessKey"]:
              await pos.payment(req, res, next);
              break;
            default:
              return next(new ErrorResponse("Service not found", 404));
          }

          // Notify FE pending screen once the txn settles; non-fatal, FE also polls
          try {
            const settledTxn = await findOneOrder({ corporateTxnId: String(paymentRefId) });
            const settledStatus =
              settledTxn?.status === "SUCCESS"
                ? "SUCCESS"
                : ["FAILURE", "FAILED", "REFUNDED"].includes(settledTxn?.status)
                  ? "FAILURE"
                  : null;
            if (settledStatus) {
              await notifyPGPaymentConfirmed(resolvedUserId, null, paymentRefId, null, settledStatus);
            }
          } catch (notifyError) {
            customLog(req?.LogTraceId, "error", {
              message: "handlePendingTransactions: Pusher payment-confirmed notify failed",
              paymentRefId,
              error: notifyError?.message,
            }, "VENDOR");
          }
        } else if (orderStatus === "PENDING") {
          await paymentGatewayOrders.update(
            {
              paymentResponse: JSON.stringify(paymentResponse),
            },
            { where: { paymentRefId } }
          );
          return res.status(200).json({
            status: true,
            data: {
              pending: true,
            },
            message: "payment pending",
            responseCode: "000",
          });
        } else {
          await paymentGatewayOrders.update(
            {
              status: "FAILED",
              paymentResponse: JSON.stringify(paymentResponse),
            },
            { where: { paymentRefId } }
          );

          return res.status(502).json({ status: false, message: "Payment failed" });
        }
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      error: error?.response?.data ?? error?.response ?? error?.message ?? error,
      message: "Error in handlePendingTransactions"
    }, "VENDOR");
    await paymentGatewayOrders.update(
      {
        referenceNo: req.body.TXNID,
        status: "FAILED",
        paymentResponse: JSON.stringify(req.body),
      },
      { where: { paymentRefId } }
    );
    return res.status(500).json({ status: false, message: "Payment failed" });
  }
};

// STAGING-ONLY: trigger Cashfree CHARGE webhook delivery for a single paymentId.
//   PUT /api/v1/corporate/.../payment-gateway/cashfree-gateway/test/simulate-charge/:paymentId
//   Body (optional): { "status": "SUCCESS" | "FAILED" }   — defaults to "SUCCESS"
//
// Useful when triggerSubscriptionCharges scheduler isn't running (or you want immediate
// feedback). The batch scheduler in `scheduler/services/simulateSubscriptionCharges.js` calls
// the same Cashfree PG simulate endpoint for every IN_PROGRESS SUBSCRIPTION_CHARGE order.
// Hard-gated to NODE_ENV === "staging" — never runs anywhere else.
exports.simulateSubscriptionChargeForTest = asyncHandler(async (req, res, next) => {
  if (process.env.NODE_ENV !== "staging") {
    return next(new ErrorResponse("Simulate endpoint only available in staging", 403));
  }

  const paymentId = req.params.paymentId;
  const status = req.body?.status === "FAILED" ? "FAILED" : "SUCCESS";
  if (!paymentId) {
    return next(new ErrorResponse("paymentId is required", 400));
  }

  const subscriptionAccessKey = operatorsData["cashFreeSubscriptions"]["accessKey"];
  const serviceDetails = await findServiceOperatorByAccessKey(subscriptionAccessKey);
  if (!serviceDetails || !serviceDetails.vendor) {
    return next(new ErrorResponse("Cashfree credentials not configured", 500));
  }

  // Cashfree PG simulate: POST /pg/simulate. apiUrl typically already ends in /pg.
  const rawBase = String(serviceDetails.vendor.apiUrl || "").replace(/\/$/, "");
  const url = rawBase.endsWith("/pg") ? `${rawBase}/simulate` : `${rawBase}/pg/simulate`;

  try {
    const cfResp = await axios({
      method: "POST",
      url,
      headers: {
        "Content-Type": "application/json",
        "x-api-version": serviceDetails.vendor.optional3 || "2023-08-01",
        "x-client-id": serviceDetails.vendor.optional1,
        "x-client-secret": serviceDetails.vendor.optional2,
      },
      data: {
        entity: "SUBS_PAYMENTS",
        entity_id: paymentId,
        entity_simulation: { payment_status: status },
      },
      timeout: 30000,
    });
    return res.status(200).json({
      status: true,
      message: `Charge simulate dispatched with status=${status}`,
      data: cfResp.data,
      responseCode: "000",
    });
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      message: "simulateSubscriptionChargeForTest failed",
      paymentId,
      error: err?.response?.data ?? err?.message,
    });
    const message = err?.response?.data?.message || err?.message || "Cashfree simulate failed";
    return next(new ErrorResponse(message, err?.response?.status || 500));
  }
});

// Canonical pricing endpoint — the frontend calls this for the order-summary numbers.
// Pricing math lives in utils/subscriptionPricing.calculateSubscriptionPrice; this endpoint
// and validatePrice (used by create-subscription-order) share that function so the price
// the user sees on the review screen is exactly what the validator checks against.
exports.getSubscriptionPricing = asyncHandler(async (req, res, next) => {
  try {
    const packageId = req.query.packageId;
    const billingType = req.query.billingType || "MONTHLY";
    const couponCode = req.query.couponCode;
    const authPayment = req.query.authPayment === "false" ? false : true;

    if (!packageId) {
      return next(new ErrorResponse("packageId is required", 400));
    }
    if (!["MONTHLY", "ANNUALLY"].includes(billingType)) {
      return next(new ErrorResponse("billingType must be MONTHLY or ANNUALLY", 400));
    }

    const packageDetails = await findOnePackage(packageId);
    if (!packageDetails) {
      return next(new ErrorResponse("Package not found", 404));
    }

    const pricing = await calculateSubscriptionPrice({
      corporateId: req.user.corporateId,
      credentialId: req.user.id,
      packageDetails,
      billingType,
      couponCode,
      partnerId: req.user.registeredBy,
      authPayment,
    });

    return res.status(200).json({
      status: true,
      message: "Subscription pricing fetched successfully",
      data: pricing,
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "getSubscriptionPricing failed",
      error: error?.message,
      stack: error?.stack,
    });
    return next(new ErrorResponse("Failed to calculate subscription pricing", 500));
  }
});

// ── Step 6b: upgrade limit reconciliation (hard block) ─────────────────────────
// Switching to a GROUP plan must not leave a user below the usage they've already consumed for a
// service. Per service the effective target limit = the target plan's per-service baseLimit + carried
// recurring add-on seats (dynamic add-ons re-anchor + carry over on a plan switch — omitting them would
// falsely block a user whose add-ons already cover them). Per service, by outcome:
//   - count read OK and count > target effective limit → HARD BLOCK (clear, actionable message)
//   - 403 (user has no access to that service) → nothing to reconcile → skip
//   - any other error → LOG + ALLOW (fail-open first cut; per-service action guards remain the
//     backstop). Flip RECONCILE_FAIL_CLOSED to true once each cross-service call is verified live.
const RECONCILE_FAIL_CLOSED = false;

// Services reconciled at GROUP-upgrade time. `fetchUsage` reads the user's CURRENT usage from the
// owning microservice (forwarding the caller's auth). Add a service by appending an entry.
//   TODO — Turbo (peko_garage): reducible (fleets + drivers); usage = sum of
//     GET …/garage/fleets + GET …/garage/drivers counts. Verify mount path + response shapes, then add.
//   TODO — eSign (signDrive_eSign): PRODUCT DECISION FIRST — eSign "usage" is a cumulative signed-doc
//     count (GET …/e-sign/count) and is NOT reducible like employees/fleets, so an upgrade-time hard
//     block may be the wrong UX (the user can't lower a historical count). Decide before wiring.
const RECONCILE_SERVICES = [
  {
    accessKey: "peko_payroll",
    noun: "payroll employee",
    // payroll service; 403 = no payroll access. Path verified by code-read; confirm live before fail-closed.
    fetchUsage: async ({ req, corporateId }) => {
      const resp = await axios.get(`${BACKEND_URL}/api/v1/corporate/${corporateId}/payroll/employee/count`, {
        headers: { sessionid: req.headers.sessionid, Authorization: req.headers.authorization },
        timeout: 15000,
      });
      return Number(resp?.data?.data?.count ?? resp?.data?.count);
    },
  },
];

const RECONCILE_RETRY_MESSAGE = "We couldn’t verify your current usage. Please try again. If the issue persists, contact us at reach@peko.one.";

const checkUpgradeUsageReconciliation = async ({ req, targetPackageId, corporateId }) => {
  for (const svc of RECONCILE_SERVICES) {
    try {
      const cashbacks = await findOneServiceCashbacks({ accessKey: svc.accessKey, partnerId: req.user.registeredBy });
      if (!Array.isArray(cashbacks) || !cashbacks.length) continue;
      const targetCashback = cashbacks.find((c) => Number(c.packageId) === Number(targetPackageId));
      if (!targetCashback) continue; // target plan doesn't grant this service → nothing to reconcile
      const targetBaseLimit = parseInt(targetCashback.baseLimit) || 0;
      const serviceOperatorId = targetCashback.serviceOperator?.id ?? null;

      // Carried recurring add-on seats for this service — they re-anchor + carry over on a plan switch.
      let carriedAddonSeats = 0;
      if (serviceOperatorId != null) {
        const addons = await findAllAddonSubscription(corporateId);
        if (Array.isArray(addons)) {
          carriedAddonSeats = addons
            .filter((a) => Number(a.serviceOperatorId) === Number(serviceOperatorId))
            .reduce((sum, a) => sum + (parseInt(a.maxLimit) || 0), 0);
        }
      }
      const targetEffectiveLimit = targetBaseLimit + carriedAddonSeats;

      let count;
      try {
        count = await svc.fetchUsage({ req, corporateId });
      } catch (err) {
        if (err?.response?.status === 403) continue; // user has no access to this service → skip
        customLog(req?.LogTraceId, "error", { message: `Reconciliation: ${svc.accessKey} usage fetch failed`, corporateId, targetPackageId, error: err?.response?.data ?? err?.message }, "VENDOR");
        if (RECONCILE_FAIL_CLOSED) return { ok: false, message: RECONCILE_RETRY_MESSAGE };
        continue; // fail-open: don't block the upgrade on a usage-read error (first cut)
      }
      if (!Number.isFinite(count)) {
        customLog(req?.LogTraceId, "error", { message: `Reconciliation: ${svc.accessKey} count not numeric`, corporateId, targetPackageId }, "VENDOR");
        if (RECONCILE_FAIL_CLOSED) return { ok: false, message: RECONCILE_RETRY_MESSAGE };
        continue;
      }

      if (count > targetEffectiveLimit) {
        const excess = count - targetEffectiveLimit;
        customLog(req?.LogTraceId, "info", { message: `Reconciliation: ${svc.accessKey} over target limit — blocking upgrade`, corporateId, targetPackageId, count, targetEffectiveLimit });
        return {
          ok: false,
          message: `Your selected plan allows ${targetEffectiveLimit} ${svc.noun}${targetEffectiveLimit === 1 ? "" : "s"}, but you currently have ${count}. Please remove ${excess} or purchase ${excess} more as an add-on before switching plans.`,
        };
      }
    } catch (error) {
      customLog(req?.LogTraceId, "error", { message: "Reconciliation: unexpected error", accessKey: svc.accessKey, error: error?.message ?? error }, "VENDOR");
      if (RECONCILE_FAIL_CLOSED) return { ok: false, message: RECONCILE_RETRY_MESSAGE };
      // fail-open: continue to the next service
    }
  }
  return { ok: true };
};

exports.createSubscriptionOrder = asyncHandler(async (req, res, next) => {
  try {
    if (req.body.isOneTime) {
      return await handleOneTimeSubscriptionOrder(req, res, next);
    }
    const subscriptionAccessKey = operatorsData["cashFreeSubscriptions"]["accessKey"];
    const serviceDetails = await findServiceOperatorByAccessKey(subscriptionAccessKey);
    
    if (!serviceDetails || !serviceDetails.vendor) {
      customLog(req?.LogTraceId, "error", { message: "Service details not found for subscription", subscriptionAccessKey });
      return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
    }

    const pgAmount = Number(req.body.pgAmount);
    if (isNaN(pgAmount) || pgAmount < 0) {
      customLog(req?.LogTraceId, "error", { message: "Invalid pgAmount", pgAmount: req.body.pgAmount });
      return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
    }
    
    const ecomBaseAmount = Number(req.body.amount);

    const isAddOns = req.body.isAddOns;

    // Add-on purchases now go through the regular PG (createAddonPaymentOrder).
    // Subscription mandates are only created for GROUP/INDIVIDUAL packages.
    if (isAddOns) {
      customLog(req?.LogTraceId, "error", { message: "createSubscriptionOrder called with isAddOns=true — use /create-addon-order instead", packageId: req.body.packageId });
      return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
    }

    customLog(req?.LogTraceId, "info", { message: "Creating subscription order", packageId: req.body.packageId, corporateId: req.user.corporateId }, "VENDOR");

    // Accept either `billingType` (Peko plans, uppercase) or `subscriptionDuration`
    // (WhatsApp flow, lowercase like "monthly"). Normalize before validating so neither
    // caller has to special-case the other.
    let billingType =
      (req.body.billingType || req.body.subscriptionDuration || "")
        .toString()
        .trim()
        .toUpperCase();
    if (!billingType || !["MONTHLY", "ANNUALLY"].includes(billingType)) {
      customLog(req?.LogTraceId, "error", {
        message: "Invalid billing type",
        billingType,
        rawBillingType: req.body.billingType,
        rawSubscriptionDuration: req.body.subscriptionDuration,
      });
      return next(new ErrorResponse(`Invalid billing type`, 400));
    }

    // ON_DEMAND: interval type not needed — merchant triggers each charge manually via scheduler

    let package;
    try {
      package = await findOnePackage(req.body.packageId);
      if (!package) {
        customLog(req?.LogTraceId, "error", { message: "Package not found", packageId: req.body.packageId }, "VENDOR");
        return next(new ErrorResponse(`Package not found`, 400));
      }
    } catch (error) {
      customLog(req?.LogTraceId, "error", { message: "Error fetching package", error: error?.message ?? error, packageId: req.body.packageId }, "VENDOR");
      return next(new ErrorResponse(`Package not found`, 400));
    }

    const planMaxAmount = resolvePlanMaxAmount(billingType);
    if (pgAmount > planMaxAmount) {
      customLog(req?.LogTraceId, "error", { message: "pgAmount exceeds plan max amount", pgAmount, planMaxAmount, packageType: package.packageType, packageId: req.body.packageId });
      return next(new ErrorResponse(`This plan's amount exceeds the ₹${planMaxAmount} per-payment limit for auto-pay. Please choose a monthly plan, or contact support at reach@peko.one for annual billing.`, 400));
    }

    const mobileNo = normalizeCustomerMobile(req.user.mobileNo) || "0000000000";
    
    const isWhatsAppSubscription = !!req.body.isWhatsAppSubscription;
    const isEcommerceStoreSubscription = !!req.body.isEcommerceSubscription;

    // pgAmount (FE totalAmount) includes the platform fee. Work the fee out server-side on the plan
    // amount — same basis as the FE (getSurchargeData(amount)) and ProjectSubscriptionPayment — and
    // store it on the SUBSCRIPTION_AUTH order so the AUTH webhook can record it on the order and keep
    // it out of subscriptionAmountPaid.
    // Recording-only: a lookup failure must never block the purchase.
    let waSurcharge = 0;
    if (isWhatsAppSubscription) {
      try {
        const waServiceDetails = await fetchServiceDetails({
          credentialId: req.user.id,
          accessKey: WHATSAPP_ACCESS_KEY,
          packageId: req.user.packageId,
          corporateUserId: req.user.corporateId,
        });
        if (waServiceDetails && !Object.prototype.hasOwnProperty.call(waServiceDetails, "error")) {
          const waSurchargeWithoutTax = await calculateSurcharge(waServiceDetails.surcharge, waServiceDetails.surchargeType, Number(req.body.amount || 0), req.user.id);
          waSurcharge = Number(await calculateAmountWithTax(waSurchargeWithoutTax)) || 0;
        } else {
          customLog(req?.LogTraceId, "error", { message: "WhatsApp surcharge: service details not found, recording surcharge as 0", corporateId: req.user.corporateId }, "VENDOR");
        }
      } catch (waSurchargeErr) {
        customLog(req?.LogTraceId, "error", { message: "WhatsApp surcharge lookup failed, recording surcharge as 0", error: waSurchargeErr?.message, corporateId: req.user.corporateId }, "VENDOR");
      }
    }

    // WhatsApp and Peko Commerce price differently from this validator's Peko+ tax model — trust
    // the frontend-calculated amount for both, and for mandate+addon setup.
    const isAddonMandateSetup = !!req.body.isMandate && !!req.body.addonQuantity;
    const quotedAt = new Date();
    if (!isWhatsAppSubscription && !isEcommerceStoreSubscription && !isAddonMandateSetup) {
      let isPriceValid;
      try {
        isPriceValid = await validatePrice(
          billingType,
          pgAmount,
          package,
          req.body.couponCode,
          req.body.packageId,
          req.user.corporateId,
          true,
          req.user.registeredBy,
          req?.LogTraceId,
          { asOf: quotedAt }
        );
        customLog(req?.LogTraceId, "info", { message: "Price validation result", isPriceValid, pgAmount });
      } catch (error) {
        customLog(req?.LogTraceId, "error", { message: "Error validating price", error: error?.message ?? error, pgAmount });
        return next(new ErrorResponse(`Error validating price`, 400));
      }

      if (!isPriceValid) {
        customLog(req?.LogTraceId, "error", { message: "Price validation failed", pgAmount, packageId: req.body.packageId });
        return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
      }
    }

    // Step 6b: block a GROUP-plan switch that would leave the user below their already-consumed usage
    // (e.g. 50 payroll employees in use, target plan grants 40). Runs pre-payment so no money is taken.
    if (!isWhatsAppSubscription && package.packageType === "GROUP") {
      const reconciliation = await checkUpgradeUsageReconciliation({
        req,
        targetPackageId: package.id,
        corporateId: req.user.corporateId,
      });
      if (!reconciliation.ok) {
        return next(new ErrorResponse(reconciliation.message, 400));
      }
    }

    const subscriptionId = new Date().valueOf();
    const paymentRefId = new Date().valueOf();
    // Merchant accessKey stamped on the order so the webhook + renewal scheduler resolve creds for the
    // SAME merchant later (mandates are merchant-scoped). Defaults to the Peko subscriptions merchant.
    let productAccessKey = operatorsData["cashFreeSubscriptions"]["accessKey"];

    // The Cashfree CONNECTION (apiUrl + x-api-version) always comes from the shared subscriptions vendor;
    // only clientId/clientSecret vary per product. WhatsApp uses its own merchant (strict, no fallback).
    // INDIVIDUAL packages charge on the SERVICE's own Cashfree merchant when its serviceOperator has
    // paymentclientid/secret (so the base subscription + its add-ons share one merchant), else fall back
    // to the Peko subscriptions merchant. The chosen merchant is stamped on the order for renewals.
    let clientId = serviceDetails.vendor.optional1;
    let clientSecret = serviceDetails.vendor.optional2;
    const baseUrl = serviceDetails.vendor.apiUrl;
    const version = serviceDetails.vendor.optional3;
    if (isWhatsAppSubscription) {
      const waCreds = await getWhatsAppMerchantClientCreds();
      if (!waCreds?.clientId || !waCreds?.clientSecret) {
        customLog(req?.LogTraceId, "error", {
          message: "WhatsApp merchant Cashfree credentials not configured (serviceOperator whatsApp_for_busines paymentclientid/secret) — cannot create WhatsApp subscription mandate",
          packageId: package?.id,
        }, "VENDOR");
        return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
      }
      clientId = waCreds.clientId;
      clientSecret = waCreds.clientSecret;
      productAccessKey = WHATSAPP_ACCESS_KEY;
    } else if (package.packageType === "INDIVIDUAL") {
      const individualCashback = await findOneByPackageId(package.id);
      const individualOperator = individualCashback?.serviceOperatorId
        ? await findServiceOperatorById(individualCashback.serviceOperatorId)
        : null;
      if (individualOperator?.paymentclientid && individualOperator?.paymentclientsecret) {
        clientId = individualOperator.paymentclientid;
        clientSecret = individualOperator.paymentclientsecret;
        productAccessKey = individualOperator.accessKey;
        customLog(req?.LogTraceId, "info", {
          message: "createSubscriptionOrder: individual subscription using service's own Cashfree merchant",
          packageId: package.id,
          merchantAccessKey: productAccessKey,
          serviceOperatorId: individualCashback.serviceOperatorId,
          clientId: maskCredential(clientId),
        }, "VENDOR");
      } else {
        customLog(req?.LogTraceId, "info", {
          message: "createSubscriptionOrder: individual service has no Cashfree merchant creds — using Peko subscriptions merchant",
          packageId: package.id,
          merchantAccessKey: productAccessKey,
          serviceOperatorId: individualCashback?.serviceOperatorId ?? null,
          clientId: maskCredential(clientId),
        }, "VENDOR");
      }
    }

    if (!clientId || !clientSecret || !baseUrl) {
      customLog(req?.LogTraceId, "error", { message: "Missing vendor credentials", clientId: !!clientId, clientSecret: !!clientSecret, baseUrl: !!baseUrl }, "VENDOR");
      return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
    }

    const fullUrl = `${baseUrl}/pg/subscriptions`;
    const { periodicPrice, price } = await calculatePlanAmount(
      package,
      billingType,
      false,
      null,
      null,
      req.user.corporateId
    );
    customLog(req?.LogTraceId, "info", { message: "Plan amount calculated", price, periodicPrice, pgAmount });

    // WhatsApp and Peko Commerce use their own tables — skip the Peko plan duplicate check.
    let currentMainSubscription = null;
    if (!isWhatsAppSubscription && !isEcommerceStoreSubscription) {
      if (package.packageType === "INDIVIDUAL") {
        // À-la-carte INDIVIDUAL plans are free-plan-only: a paid GROUP plan (Go/Peko+) already
        // bundles these services, so block the purchase for any paid-group user.
        const activePaidGroup = await findActivePaidGroupSubscription(req.user.corporateId);
        if (activePaidGroup) {
          customLog(req?.LogTraceId, "info", {
            message: "Blocked INDIVIDUAL purchase — user is on a paid GROUP plan",
            packageId: package.id,
            corporateId: req.user.corporateId,
          });
          return next(
            new ErrorResponse("Individual plans are available only on the Free plan.", 400)
          );
        }

        // Block re-purchase of the SAME billing cycle (even via the mandate path, which the generic
        // check below skips). A DIFFERENT billing cycle is intentionally allowed — that's the
        // monthly→annual "Upgrade to Annual" path from Settings.
        const sameCycleActive = await findExistingSubscription({
          packageId: package.id,
          corporateId: req.user.corporateId,
          billingType,
        });
        if (sameCycleActive) {
          customLog(req?.LogTraceId, "info", {
            message: "Blocked duplicate INDIVIDUAL purchase — same billing cycle already active",
            packageId: package.id,
            corporateId: req.user.corporateId,
            billingType,
          });
          return next(new ErrorResponse("Your subscription is already active.", 400));
        }
      }

      let isExistingSubscription;
      try {
        isExistingSubscription = await findExistingSubscription({
          packageId: package.id,
          corporateId: req.user.corporateId,
          billingType,
        });
        if (isExistingSubscription) {
          customLog(req?.LogTraceId, "info", { message: "Existing subscription found", subscriptionId: isExistingSubscription.id, packageName: isExistingSubscription.package?.packageName });
        }
      } catch (error) {
        customLog(req?.LogTraceId, "error", { message: "Error finding existing subscription", error: error?.message ?? error, packageId: package.id });
        return next(new ErrorResponse(`Error checking existing subscription`, 400));
      }

      if (isExistingSubscription && !req.body.isMandate) {
        customLog(req?.LogTraceId, "error", { message: "User already has subscription", packageName: isExistingSubscription.package?.packageName, packageId: package.id});
        return next(new ErrorResponse(`User already has the ${isExistingSubscription.package.packageName} subscription plan.`, 400));
      }

      // For Peko plans: store current subscription ID in tags so the webhook can update vendorSubscriptionId.
      currentMainSubscription = await findSubscription({
        corporateUserId: req.user.corporateId,
        status: "ACTIVE",
        isCustom: false,
      });
    } else if (isWhatsAppSubscription) {
      // For WhatsApp: store the existing WhatsApp subscription ID (for upgrades/renewals).
      currentMainSubscription = await findActiveSubscriptionByCredentialId(req.user.id);
    } else {
      // For Peko Commerce: store the existing active ecommerce_store subscription ID (for renewals).
      currentMainSubscription = await findActiveEcommerceStoreSubscription(
        req.user.id,
        ECOMMERCE_STORE_ACCESS_KEY
      );
    }

    const config = {
      method: "POST",
      url: fullUrl,
      headers: {
        "x-api-version": version,
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "Content-Type": "application/json",
      },
      data: {
        subscription_id: `${subscriptionId}`,
        customer_details: {
          customer_email: req.user.email,
          customer_phone: mobileNo,
          customer_name: filterLettersAndSpaces(req.user.name),
          // "customer_bank_account_number": "59108290701802",
          // "customer_bank_ifsc": "HDFC0002614",
          // "customer_bank_code": "HDFC",
          // "customer_bank_account_type": "SAVINGS"
        },
        plan_details: {
          plan_name: sanitizeString(package.packageName),
          // ON_DEMAND: merchant triggers each charge via scheduler 2 days before billing date.
          // Cashfree does NOT auto-charge. plan_max_amount is the safety cap per charge call.
          plan_type: "ON_DEMAND",
          plan_max_amount: planMaxAmount,
          plan_currency: "INR",
        },
        authorization_details: {
          authorization_amount: pgAmount > 0 ? pgAmount : 1,
          authorization_amount_refund: pgAmount > 0 ? false : true,
          authorization_reference: paymentRefId,
          "payment_methods": [
            "upi",
            "card"
          ]
        },
        subscription_meta: {
          // "return_url": `${req.body.successUrl}?status=success&transactionId=${subscriptionId}`,
          return_url: `${BACKEND_URL}/api/v1/webhook/cashfree/payment-gateway/cashfree/subscription/redirect`,
          // notification_channel: ["EMAIL", "SMS"], asked to disable due to the amount
        },
        // "subscription_expiry_time": "2024-01-14T23:00:08+05:30",
        // "subscription_first_charge_time": "2024-01-10T23:00:08+05:30",
        // Cashfree caps subscription_tags ("notes") at 15 keys. Only include sentinel flags
        // when they carry information — the webhook destructures missing keys as undefined
        // and every downstream check (`=== "true"`, `!= false`, `|| 0`, `parseFloat(x || 0)`)
        // treats undefined identically to the explicit "false"/"0" strings we used to send.
        subscription_tags: {
          credentialId: `${req.user.id}`,
          corporateId: `${req.user.corporateId}`,
          pgAmount: `${pgAmount}`,
          packageId: `${package.id}`,
          partnerId: req.user.registeredBy ? `${req.user.registeredBy}` : undefined,
          billingType: billingType,
          mainSubId: currentMainSubscription ? `${currentMainSubscription.id}` : undefined,
          ...(req?.body?.couponCode && req.body.couponCode !== "0" && req.body.couponCode !== 0 && {
            coupon: JSON.stringify({
              couponCode: req.body.couponCode,
              couponTotalDiscount: req.body.couponTotalDiscount,
            }),
          }),
          ...(req.body.isMandate && { isMandate: "true" }),
          ...(isWhatsAppSubscription && { isWhatsAppSubscription: "true" }),
          ...(isEcommerceStoreSubscription && { isEcommerceStoreSubscription: "true" }),
          ...(isAddonMandateSetup && {
            addonQuantity: `${req.body.addonQuantity}`,
            addonsAccessKey: req.body.addonsAccessKey ?? "",
            ...(req.body.addonPackageId && { addonPackageId: `${req.body.addonPackageId}` }),
            ...(req.body.isDynamicUnitPricing && { isDynamicUnitPricing: "true" }),
          }),
          ...(isWhatsAppSubscription && {
            amount: `${req.body.amount ?? 0}`,
            subscriptionPlan: req.body.subscriptionPlan ?? "",
            subscriptionDuration: req.body.subscriptionDuration ?? "",
            ...(req.body.botBuilder && { botBuilder: `${req.body.botBuilder}` }),
            ...(req.body.shopifyIntegration && { shopifyIntegration: `${req.body.shopifyIntegration}` }),
            ...(req.body.projectId && { waProjectId: `${req.body.projectId}` }),
            ...(req.body.isUpgrade && { isUpgrade: "true" }),
            ...(req.body.isRenewal && { isRenewal: "true" }),
          }),
        },
      },
    };
    customLog(req?.LogTraceId, "info", {
      message: "Creating subscription order with Cashfree",
      subscriptionId,
      paymentRefId,
      fullUrl,
      isAddOns,
      productAccessKey,
      clientId: maskCredential(clientId),
      clientSecret: maskCredential(clientSecret),
      customerName: filterLettersAndSpaces(req.user.name),
      customerEmail: req.user.email,
      customerPhone: mobileNo,
    }, "VENDOR");
    
    let response;
    try {
      response = await axios(config);
      customLog(req?.LogTraceId, "info", { message: "Cashfree subscription order response received", subscriptionId, status: response?.status, hasData: !!response?.data }, "VENDOR");
    } catch (error) {
      customLog(req?.LogTraceId, "error", { 
        message: "Error calling Cashfree API for subscription order", 
        error: error?.response?.data ?? error?.response ?? error?.message ?? error,
        subscriptionId,
        fullUrl
      }, "VENDOR");
      return res.status(400).json({ 
        status: false, 
        message: GENERIC_ERROR_MESSAGE,
        responseCode: "001", 
        data: {} 
      });
    }

    if (!response || !response.data) {
      customLog(req?.LogTraceId, "error", { message: "Invalid response from Cashfree", response: response?.data, subscriptionId }, "VENDOR");
      return res.status(400).json({ 
        status: false, 
        message: GENERIC_ERROR_MESSAGE,
        responseCode: "001", 
        data: {} 
      });
    }

    if (response.data.code) {
      customLog(req?.LogTraceId, "error", { message: "Cashfree API returned error code", code: response.data.code, apiMessage: response.data.message, subscriptionId }, "VENDOR");
      return res.status(400).json({ 
        status: false, 
        message: GENERIC_ERROR_MESSAGE,
        responseCode: "001", 
        data: {} 
      });
    }

    const paymentData = response.data;
    
    if (!paymentData.authorization_details || !paymentData.subscription_session_id) {
      customLog(req?.LogTraceId, "error", { message: "Missing required fields in Cashfree response", paymentData, subscriptionId }, "VENDOR");
      return res.status(400).json({ 
        status: false, 
        message: "Invalid response from payment gateway.", 
        responseCode: "001", 
        data: {} 
      });
    }

    customLog(req?.LogTraceId, "info", { 
      message: "Subscription order created successfully", 
      subscriptionId, 
      paymentRefId, 
      sessionId: paymentData.subscription_session_id 
    }, "VENDOR");

    await paymentGatewayOrders.create({
      paymentRefId: String(paymentRefId),
      referenceNo: paymentData.subscription_session_id,
      vendorSubscriptionId: String(subscriptionId),
      orderKind: ORDER_KIND.SUBSCRIPTION_AUTH,
      status: "ORDERED",
      paymentData: JSON.stringify({
        kind: "SUBSCRIPTION",
        subscriptionId: String(subscriptionId),
        paymentRefId: String(paymentRefId),
        packageId: package.id,
        corporateId: req.user.corporateId,
        registeredBy: req.user.registeredBy ?? null,
        isAddOns: !!isAddOns,
        billingType,
        pgAmount,
        quotedAt: quotedAt.toISOString(),
        accessKey: productAccessKey,
        ...(isEcommerceStoreSubscription && {
          baseAmount: isNaN(ecomBaseAmount) ? undefined : ecomBaseAmount,
        }),
        // Read back by the WhatsApp AUTH webhook (subscription_tags is capped at 15 keys)
        ...(isWhatsAppSubscription && { surcharge: waSurcharge }),
      }),
    });

    return res.status(200).json({
      status: true,
      message: "Subscription plan created successfully.",
      responseCode: "000",
      data: {
        amount: paymentData.authorization_details.authorization_amount,
        orderId: paymentRefId,
        session_id: paymentData.subscription_session_id,
        corporateTxnId: paymentData.corporateTxnId,
        vendorSubscriptionId: String(subscriptionId),
      },
    });
  } catch (error) {
    customLog(
      req?.LogTraceId,
      "error",
      { message: "Unexpected error in createSubscriptionOrder", error: error?.response?.data ?? error?.response ?? error?.message ?? error, stack: error?.stack },
      "VENDOR"
    );
    return res.status(400).json({ 
      status: false, 
      message: GENERIC_ERROR_MESSAGE,
      data: {}, 
      responseCode: "001" 
    });
  }
});

// Add-on purchase via regular PG (one-time order).
// The first month's charge is collected here; subsequent months are bundled into
// the main subscription's periodic charge by the scheduler.
// Shared Cashfree one-time /pg/orders creation. Persists the order row BEFORE calling Cashfree (so a
// crash between the two is recoverable), fires the order, then records the returned session id. Both the
// add-on and the one-time base-plan purchase flows route through here so the /pg/orders plumbing — and
// its crash-safety ordering — lives in exactly one place. Any Cashfree/DB failure rejects to the
// caller's try/catch (no silent success). `paymentData` MUST carry paymentRefId + the routing accessKey.
const createCashfreePgOrder = async ({
  paymentRefId,
  orderId,
  amount,
  creds,
  customer,
  callbackUrl,
  notifyUrl,
  paymentData,
}) => {
  await paymentGatewayOrders.create({
    paymentRefId,
    orderKind: ORDER_KIND.PAYMENT_GATEWAY,
    paymentData: JSON.stringify(paymentData),
  });

  const cfResponse = await axios({
    method: 'POST',
    url: `${creds.baseUrl}/pg/orders`,
    headers: {
      'x-api-version': creds.version,
      'x-client-id': creds.clientId,
      'x-client-secret': creds.clientSecret,
      'Content-Type': 'application/json',
    },
    data: {
      order_amount: amount,
      order_currency: 'INR',
      order_id: orderId,
      customer_details: customer,
      order_meta: {
        return_url: callbackUrl,
        notify_url: notifyUrl,
      },
    },
  });

  await paymentGatewayOrders.update(
    { status: 'ORDERED', referenceNo: cfResponse.data.payment_session_id },
    { where: { paymentRefId } }
  );

  return cfResponse.data.payment_session_id;
};

exports.createAddonPaymentOrder = asyncHandler(async (req, res, next) => {
  try {
    const isAddOns = req.body.isAddOns;
    if (!isAddOns) {
      return next(new ErrorResponse('isAddOns flag required', 400));
    }

    const quantity = parseInt(req.body.quantity);
    const addonsAccessKey = req.body.addonsAccessKey;
    const pgAmount = Number(req.body.pgAmount);
    const serviceAccessKey = req.body.accessKey

    if (!quantity || !addonsAccessKey || !serviceAccessKey || isNaN(pgAmount) || pgAmount <= 0) {
      return next(new ErrorResponse('Missing required fields: quantity, addonsAccessKey, pgAmount', 400));
    }

    // Add-ons require an active main subscription
    const mainSubscription = await findMainSubscription({
      packageId: req.body.packageId,
      corporateId: req.user.corporateId,
    });
    if (!mainSubscription) {
      customLog(req?.LogTraceId, 'error', { message: 'Main subscription not found for addon', packageId: req.body.packageId, corporateId: req.user.corporateId });
      return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
    }

    const billingType = mainSubscription.billingType;

    // Validate that pgAmount matches quantity × (pro-rated) unit price
    const isPriceValid = await validateAddOnPrice(
      quantity,
      pgAmount,
      addonsAccessKey,
      req.user.registeredBy,
      req.user.corporateId,
      req?.LogTraceId
    );
    if (!isPriceValid || isPriceValid.error) {
      customLog(req?.LogTraceId, 'error', { message: 'Add-on price validation failed', quantity, pgAmount, addonsAccessKey, reason: isPriceValid?.message });
      return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
    }

    // Use the main Cashfree PG service for credentials and order creation
    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    const individualServiceDetails = await findServiceOperatorByAccessKey(serviceAccessKey);
    if (!serviceDetails || !individualServiceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
      // Spell out exactly which serviceOperator row is missing so admin can fix it in one step.
      customLog(req?.LogTraceId, 'error', {
        message: 'Cashfree PG service not found for addon order',
        cashfreePgAccessKey: accessKey,                              // expected row in serviceOperators
        serviceAccessKey,                                            // the per-service operator (eSign / payroll / etc.)
        serviceDetailsFound: !!serviceDetails,
        individualServiceDetailsFound: !!individualServiceDetails,
        serviceDetailsHasError: serviceDetails && Object.prototype.hasOwnProperty.call(serviceDetails, 'error'),
        addonsAccessKey,
        action: `Admin → ServiceOperators → ensure rows exist for accessKey='${accessKey}' AND accessKey='${serviceAccessKey}' with vendor + payment credentials populated`,
      });
      return next(new ErrorResponse('Payment gateway not configured for this service. Please contact support.', 400));
    }

    const clientId = individualServiceDetails.paymentclientid;
    const clientSecret = individualServiceDetails.paymentclientsecret;

    if (!clientId || !clientSecret) {
      customLog(req?.LogTraceId, 'error', {
        message: 'Cashfree PG credentials missing for addon order',
        cashfreePgAccessKey: accessKey,
        serviceAccessKey,
        addonsAccessKey,
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        action: `Admin → ServiceOperators → row accessKey='${serviceAccessKey}' is missing paymentclientid and/or paymentclientsecret`,
      });
      return next(new ErrorResponse('Payment gateway not configured for this service. Please contact support.', 400));
    }
    const baseUrl = serviceDetails.vendor.apiUrl;
    const version = serviceDetails.vendor.optional3;

    const mobileNo = /^[0-9]{10,14}$/.test(req.user.mobileNo)
      ? req.user.mobileNo.replace(/^(?:\+91|91|0)(\d{10})$/, '$1')
      : '0000000000';

    const paymentRefId = new Date().valueOf();
    const orderId = `peko_${paymentRefId}`;
    const amount = parseFloat(pgAmount).toFixed(2);

    const notify_url = process.env.NODE_ENV === 'staging' ? process.env.STAGING_URL : process.env.PRODUCTION_URL;
    const partnerDetails = await fetchPartnerDetails(req.user.registeredBy);
    const callbackUrl = `${partnerDetails?.baseUrl || FRONTEND_URL}/plans/review-order`;

    customLog(req?.LogTraceId, 'info', { message: 'Creating add-on payment order with Cashfree', orderId, amount, addonsAccessKey }, 'VENDOR');

    const sessionId = await createCashfreePgOrder({
      paymentRefId,
      orderId,
      amount,
      creds: { baseUrl, version, clientId, clientSecret },
      customer: {
        customer_id: req.user.id.toString(),
        customer_phone: mobileNo,
        customer_name: req.user.name,
        customer_email: req.user.email,
      },
      callbackUrl,
      notifyUrl: `${notify_url}/api/v1/webhook/cashfree/payment-gateway/cashfree`,
      paymentData: {
        kind: 'ADDON_PURCHASE',
        // subscriptionPlans accessKey is used so handlePGCallback/handlePendingTransactions
        // can look up the correct Cashfree credentials and route to the subscriptionPlans case.
        accessKey: operatorsData["subscriptionPlans"]["accessKey"],
        isAddOns: true,
        quantity,
        addonsAccessKey,
        packageId: req.body.packageId,
        corporateId: req.user.corporateId,
        userId: req.user.id,
        credentialId: req.user.id,
        partnerId: req.user.registeredBy,
        billingType,
        pgAmount,
        paymentRefId,
      },
    });
    customLog(req?.LogTraceId, 'info', { message: 'Creating add-on payment order with Cashfree', orderId, amount, addonsAccessKey }, 'VENDOR');


    customLog(req?.LogTraceId, 'info', { message: 'Add-on payment order created', orderId, paymentRefId }, 'VENDOR');

    return res.status(201).json({
      status: true,
      data: {
        amount,
        orderId: paymentRefId,
        session_id: sessionId,
      },
      message: 'Add-on order created successfully',
      responseCode: '000',
    });
  } catch (error) {
    customLog(req?.LogTraceId, 'error', {
      message: 'Error in createAddonPaymentOrder',
      error: error?.response?.data ?? error?.message ?? error,
    });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 501));
  }
});

// One-time (non-mandate) purchase of a base plan. Reached via createSubscriptionOrder's early-return
// when req.body.isOneTime is set — there is no separate route, so /create-subscription-order is the single
// subscription entry point. Unlike the mandate path this creates a plain one-time /pg/orders payment; the
// confirming webhook (handlePGCallback / handlePendingTransactions) routes the subscriptionPlans accessKey
// with no `kind`/`isAddOns` to subscription.payment, which creates a subscription row with NO
// vendorSubscriptionId — so the renewal scheduler never charges it and it simply lapses at its end date.
// Offered for ANNUAL plans only. Not asyncHandler-wrapped: it owns its try/catch and runs inside
// createSubscriptionOrder's asyncHandler.
const handleOneTimeSubscriptionOrder = async (req, res, next) => {
  try {
    const pgAmount = Number(req.body.pgAmount);
    if (isNaN(pgAmount) || pgAmount <= 0) {
      customLog(req?.LogTraceId, "error", { message: "Invalid pgAmount for one-time subscription order", pgAmount: req.body.pgAmount });
      return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
    }

    // One-time is an annual-only option for now.
    const billingType = (req.body.billingType || "").toString().trim().toUpperCase();
    if (billingType !== "ANNUALLY") {
      customLog(req?.LogTraceId, "error", { message: "One-time payment is annual-only", billingType, packageId: req.body.packageId });
      return next(new ErrorResponse("One-time payment is available for annual plans only.", 400));
    }

    // This endpoint is for base plans only — add-ons use /create-addon-order.
    if (req.body.isAddOns) {
      customLog(req?.LogTraceId, "error", { message: "createSubscriptionOneTimeOrder called with isAddOns — use /create-addon-order", packageId: req.body.packageId });
      return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
    }

    let package;
    try {
      package = await findOnePackage(req.body.packageId);
      if (!package) {
        customLog(req?.LogTraceId, "error", { message: "Package not found", packageId: req.body.packageId }, "VENDOR");
        return next(new ErrorResponse(`Package not found`, 400));
      }
    } catch (error) {
      customLog(req?.LogTraceId, "error", { message: "Error fetching package", error: error?.message ?? error, packageId: req.body.packageId }, "VENDOR");
      return next(new ErrorResponse(`Package not found`, 400));
    }

    // Block re-buying a plan the user already holds (same package + cycle) — mirrors createSubscriptionOrder.
    let isExistingSubscription;
    try {
      isExistingSubscription = await findExistingSubscription({
        packageId: package.id,
        corporateId: req.user.corporateId,
        billingType,
      });
    } catch (error) {
      customLog(req?.LogTraceId, "error", { message: "Error finding existing subscription", error: error?.message ?? error, packageId: package.id });
      return next(new ErrorResponse(`Error checking existing subscription`, 400));
    }
    if (isExistingSubscription) {
      customLog(req?.LogTraceId, "error", { message: "User already has subscription", packageName: isExistingSubscription.package?.packageName, packageId: package.id });
      return next(new ErrorResponse(`User already has the ${isExistingSubscription.package.packageName} subscription plan.`, 400));
    }

    // GROUP: block a switch that would leave the user below already-consumed usage (pre-payment).
    if (package.packageType === "GROUP") {
      const reconciliation = await checkUpgradeUsageReconciliation({
        req,
        targetPackageId: package.id,
        corporateId: req.user.corporateId,
      });
      if (!reconciliation.ok) {
        return next(new ErrorResponse(reconciliation.message, 400));
      }
    }

    // Validate the amount server-side BEFORE charging (same authority as the mandate flow).
    // The confirming webhook replays this server-stored amount, so this is the single client-facing gate.
    const quotedAt = new Date();
    let isPriceValid;
    try {
      isPriceValid = await validatePrice(
        billingType,
        pgAmount,
        package,
        req.body.couponCode,
        req.body.packageId,
        req.user.corporateId,
        true,
        req.user.registeredBy,
        req?.LogTraceId,
        { asOf: quotedAt }
      );
    } catch (error) {
      customLog(req?.LogTraceId, "error", { message: "Error validating one-time subscription price", error: error?.message ?? error, pgAmount });
      return next(new ErrorResponse(`Error validating price`, 400));
    }
    if (!isPriceValid) {
      customLog(req?.LogTraceId, "error", { message: "One-time subscription price validation failed", pgAmount, packageId: req.body.packageId });
      return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 400));
    }

    // Resolve one-time /pg/orders credentials the same way createAddonPaymentOrder / createOrder do:
    // base URL from the Cashfree PG merchant, client creds from the subscriptionPlans operator (fallback to PG vendor).
    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, "error") || !serviceDetails.vendor) {
      customLog(req?.LogTraceId, "error", { message: "Cashfree PG service not found for one-time subscription order", cashfreePgAccessKey: accessKey });
      return next(new ErrorResponse("Payment gateway not configured. Please contact support.", 400));
    }
    const subscriptionPlanOperator = await findServiceOperatorByAccessKey(operatorsData["subscriptionPlans"]["accessKey"]);
    const clientId = subscriptionPlanOperator?.paymentclientid ?? serviceDetails.vendor.optional1;
    const clientSecret = subscriptionPlanOperator?.paymentclientsecret ?? serviceDetails.vendor.optional2;
    const baseUrl = serviceDetails.vendor.apiUrl;
    const version = serviceDetails.vendor.optional3;
    if (!clientId || !clientSecret || !baseUrl) {
      customLog(req?.LogTraceId, "error", { message: "Cashfree PG credentials missing for one-time subscription order", hasClientId: !!clientId, hasClientSecret: !!clientSecret, hasBaseUrl: !!baseUrl });
      return next(new ErrorResponse("Payment gateway not configured. Please contact support.", 400));
    }

    const mobileNo = normalizeCustomerMobile(req.user.mobileNo) || "0000000000";
    const paymentRefId = new Date().valueOf();
    const orderId = `peko_${paymentRefId}`;
    const amount = parseFloat(pgAmount).toFixed(2);

    const notify_url = process.env.NODE_ENV === "staging" ? process.env.STAGING_URL : process.env.PRODUCTION_URL;
    const partnerDetails = await fetchPartnerDetails(req.user.registeredBy);
    const callbackUrl = `${partnerDetails?.baseUrl || FRONTEND_URL}/plans/review-order`;

    customLog(req?.LogTraceId, "info", { message: "Creating one-time subscription order with Cashfree", orderId, amount, packageId: req.body.packageId, billingType }, "VENDOR");

    // No `kind` and no `isAddOns` in paymentData → the webhook routes subscriptionPlans to
    // subscription.payment (the one-time base-plan creator). Shares the /pg/orders plumbing with add-ons.
    const sessionId = await createCashfreePgOrder({
      paymentRefId,
      orderId,
      amount,
      creds: { baseUrl, version, clientId, clientSecret },
      customer: {
        customer_id: req.user.id.toString(),
        customer_phone: mobileNo,
        customer_name: req.user.name,
        customer_email: req.user.email,
      },
      callbackUrl,
      notifyUrl: `${notify_url}/api/v1/webhook/cashfree/payment-gateway/cashfree`,
      paymentData: {
        accessKey: operatorsData["subscriptionPlans"]["accessKey"],
        // Marks this as a one-time buy so createSubscription forces vendorSubscriptionId=NULL (no
        // auto-renew) and stamps subscriptionPaymentRefId (so it expires at end date). Flows through
        // the webhook → subscription.payment → createSubscription.
        isOneTime: true,
        packageId: req.body.packageId,
        billingType,
        pgAmount,
        amount: pgAmount,
        quotedAt: quotedAt.toISOString(),
        couponCode: req.body.couponCode,
        couponTotalDiscount: req.body.couponTotalDiscount,
        corporateId: req.user.corporateId,
        userId: req.user.id,
        credentialId: req.user.id,
        partnerId: req.user.registeredBy,
        paymentRefId,
      },
    });

    customLog(req?.LogTraceId, "info", { message: "One-time subscription order created", orderId, paymentRefId }, "VENDOR");

    return res.status(201).json({
      status: true,
      data: {
        amount,
        orderId: paymentRefId,
        session_id: sessionId,
      },
      message: "One-time subscription order created successfully",
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "Error in handleOneTimeSubscriptionOrder",
      error: error?.response?.data ?? error?.message ?? error,
    });
    return next(new ErrorResponse(GENERIC_ERROR_MESSAGE, 501));
  }
};

// Internal helper: extract a stable idempotency key from a Cashfree webhook payload.
// cf_payment_id is the most specific key (present for payment events).
// For auth/status-change events, fall back to subscription_id + event type.
const buildWebhookIdempotencyKey = (data) => {
  const eventType = data?.type ?? "unknown";
  const cfPaymentId = data?.data?.payment?.cf_payment_id ?? data?.data?.cf_payment_id;
  if (cfPaymentId) return `payment_${cfPaymentId}_${eventType}`;
  const subscriptionId = data?.data?.subscription?.subscription_id
    ?? data?.data?.subscription_details?.subscription_id
    ?? data?.data?.subscription_id;
  return `sub_${subscriptionId}_${eventType}`;
};

const extractVendorSubscriptionIdFromWebhook = (data) =>
  data?.data?.subscription_id
  ?? data?.data?.subscription_details?.subscription_id
  ?? data?.data?.subscription?.subscription_id
  ?? null;

const extractMerchantPaymentIdFromWebhook = (data) =>
  data?.data?.payment_id
  ?? data?.data?.payment?.payment_id
  ?? null;

/**
 * For SUBSCRIPTION_PAYMENT_* uses payment_type (AUTH → SUBSCRIPTION_AUTH, CHARGE → SUBSCRIPTION_CHARGE).
 * For every other subscription webhook, context matches Cashfree `type` (e.g. SUBSCRIPTION_STATUS_CHANGE).
 */
function deriveWebhookContextFromSubscriptionPayload(data) {
  const eventName = data?.type;
  const paymentType = data?.data?.payment_type;
  if (eventName === "SUBSCRIPTION_PAYMENT_SUCCESS" || eventName === "SUBSCRIPTION_PAYMENT_FAILED") {
    if (paymentType === "AUTH") return "SUBSCRIPTION_AUTH";
    if (paymentType === "CHARGE") return "SUBSCRIPTION_CHARGE";
    if (paymentType) return `${eventName}_${paymentType}`;
    return eventName;
  }
  if (typeof eventName === "string" && eventName.length > 0) {
    return eventName;
  }
  return "UNKNOWN";
}

// Parsed paymentData of a gateway order (amount breakdown stamped at create/charge time), or null.
async function findGatewayOrderPaymentData(where) {
  try {
    const order = await paymentGatewayOrders.findOne({ where, order: [["id", "DESC"]], raw: true });
    if (!order?.paymentData) return null;
    return typeof order.paymentData === "string" ? JSON.parse(order.paymentData) : order.paymentData;
  } catch (_) {
    return null;
  }
}

async function markGatewayOrderCompleteFromSubscriptionWebhook(data, webhookEventId) {
  const ctx = deriveWebhookContextFromSubscriptionPayload(data);
  const subscriptionId = data?.data?.subscription_id ?? data?.data?.subscription_details?.subscription_id;
  const merchantPaymentId = data?.data?.payment_id ?? data?.data?.cf_payment_id;
  const payload = JSON.stringify({
    webhookEventId,
    completedAt: new Date().toISOString(),
  });

  if (ctx === "SUBSCRIPTION_CHARGE" && merchantPaymentId) {
    await paymentGatewayOrders.update(
      { status: "COMPLETE", paymentResponse: payload },
      { where: { referenceNo: String(merchantPaymentId), orderKind: ORDER_KIND.SUBSCRIPTION_CHARGE } }
    );
    return;
  }
  if (subscriptionId) {
    await paymentGatewayOrders.update(
      { status: "COMPLETE", paymentResponse: payload },
      { where: { vendorSubscriptionId: String(subscriptionId), orderKind: ORDER_KIND.SUBSCRIPTION_AUTH } }
    );
  }
}

async function markGatewayOrderFailedFromSubscriptionWebhook(data, detail) {
  const ctx = deriveWebhookContextFromSubscriptionPayload(data);
  const subscriptionId = data?.data?.subscription_id ?? data?.data?.subscription_details?.subscription_id;
  const merchantPaymentId = data?.data?.payment_id ?? data?.data?.cf_payment_id;
  const pr = typeof detail === "string" ? detail : JSON.stringify(detail);

  if (ctx === "SUBSCRIPTION_CHARGE" && merchantPaymentId) {
    // Match on `referenceNo` — the schedulers store the charge reference there (see note above).
    await paymentGatewayOrders.update(
      { status: "FAILED", paymentResponse: pr },
      { where: { referenceNo: String(merchantPaymentId), orderKind: ORDER_KIND.SUBSCRIPTION_CHARGE } }
    );
    return;
  }
  if (subscriptionId) {
    await paymentGatewayOrders.update(
      { status: "FAILED", paymentResponse: pr },
      { where: { vendorSubscriptionId: String(subscriptionId), orderKind: ORDER_KIND.SUBSCRIPTION_AUTH } }
    );
  }
}

// Best-effort: stop AiSensy project billing for WhatsApp rows whose Cashfree mandate was cancelled/
// paused/expired at the gateway. Without this, AiSensy keeps billing Peko for a project the customer no
// longer pays for (the renewal path reactivates billing via reactivate-project; this is the teardown).
// `waSubs` are the ACTIVE rows fetched BEFORE cancellation, so they still carry the real projectId.
// Mirrors officeAndBusiness stopProjectBilling guards (skip missing/'PENDING' project and staging) and
// never throws — the rows are already cancelled by the caller; a vendor hiccup must not re-queue the webhook.
async function stopWhatsAppProjectBillingForVendorRows(waSubs, traceId) {
  const projectIds = [...new Set((waSubs || []).map((s) => s?.projectId).filter((p) => p && p !== "PENDING"))];
  if (!projectIds.length || process.env.NODE_ENV === "staging") return;

  let waOp;
  try {
    waOp = await findServiceOperatorByAccessKey(WHATSAPP_ACCESS_KEY);
  } catch (e) {
    waOp = null;
  }
  if (!waOp?.vendor?.apiUrl || !waOp?.vendor?.optional1 || !waOp?.vendor?.optional2) {
    customLog(traceId, "error", { message: "stopWhatsAppProjectBilling: WhatsApp vendor creds not found — skipping", projectIds }, "VENDOR");
    return;
  }

  const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = waOp.vendor;
  for (const projectId of projectIds) {
    try {
      await axios.patch(
        `${URL}/partner/${PartnerId}/stop-project-billing/${projectId}`,
        {},
        { headers: { "Content-Type": "application/json", "X-AiSensy-Partner-API-Key": `${API_Key}` }, timeout: 30000 }
      );
      customLog(traceId, "info", { message: "Stopped AiSensy billing for cancelled WhatsApp project", projectId }, "VENDOR");
    } catch (stopErr) {
      customLog(traceId, "error", { message: "Failed to stop AiSensy billing for cancelled WhatsApp project (non-fatal)", projectId, error: stopErr?.response?.data ?? stopErr?.message }, "VENDOR");
    }
  }
}

// The Cashfree merchant for a subscription is stamped on its SUBSCRIPTION_AUTH order at create time
// (createSubscriptionOrder). Resolve it by the subscription id the webhook carries, so we can pick the
// right merchant credentials BEFORE re-fetching the subscription — the tags that name the product only
// come back from that fetch, so we can't read them first. Defaults to the shared subscriptions merchant.
const resolveSubscriptionMerchantAccessKey = async (vendorSubscriptionId) => {
  try {
    const authOrder = await paymentGatewayOrders.findOne({
      where: { vendorSubscriptionId: String(vendorSubscriptionId), orderKind: ORDER_KIND.SUBSCRIPTION_AUTH },
      order: [["id", "DESC"]],
      raw: true,
    });
    const stored = authOrder?.paymentData ? JSON.parse(authOrder.paymentData)?.accessKey : null;
    if (stored) return stored;
  } catch (e) {
    // fall through to the shared subscriptions merchant
  }
  return operatorsData["cashFreeSubscriptions"]["accessKey"];
};

// Internal helper: process a single webhook event by type.
// Extracted so it can be called by both the webhook endpoint and the admin retry API.
// `traceId` is the request-scoped LogTraceId from the caller's Express middleware — pass it
// through so every log inside the webhook processing path correlates back to the originating request.
const processWebhookEventById = exports.processWebhookEventById = async (webhookEventRecord, traceId = null) => {
  const data = webhookEventRecord.payload;
  const subscriptionAccessKey = operatorsData["cashFreeSubscriptions"]["accessKey"];
  const serviceDetails = await findServiceOperatorByAccessKey(subscriptionAccessKey);
  const event = data.type;

  // Single entry log per event so every webhook produces at least one trace line we can grep on.
  customLog(traceId, "info", {
    message: "processWebhookEventById: entered",
    event,
    webhookEventId: webhookEventRecord?.id,
    vendorSubscriptionId: webhookEventRecord?.vendorSubscriptionId,
    merchantPaymentId: webhookEventRecord?.merchantPaymentId,
  });

  if (event === "SUBSCRIPTION_PAYMENT_SUCCESS") {
    if (!serviceDetails || !serviceDetails.vendor && (!data?.data?.subscription_id || !data?.data?.subscription_details?.subscription_id)) {
      customLog(traceId, "error", {
        message: "SUBSCRIPTION_PAYMENT_SUCCESS: serviceDetails missing — aborting",
        hasServiceDetails: !!serviceDetails,
        hasVendor: !!serviceDetails?.vendor,
      }, "VENDOR");
      throw new Error("Service details not found for subscription");
    }
    const subscriptionId = data?.data?.subscription_id ?? data.data.subscription_details.subscription_id;
    const subscriptionPaymentRefId= data?.data?.cf_payment_id ?? data.data.authorization_details?.paymentId;
    // Default to the shared subscriptions merchant (Peko). If this subscription was created on a
    // product-specific Cashfree merchant — WhatsApp, or an INDIVIDUAL service with its own merchant —
    // the merchant accessKey was stamped on its SUBSCRIPTION_AUTH order (createSubscriptionOrder).
    // Mandates are merchant-scoped, so re-fetch with that merchant's clientId/secret; the connection
    // (baseUrl/version) always stays the shared subscriptions vendor. Mirrors createSubscriptionOrder.
    let clientId = serviceDetails.vendor.optional1;
    let clientSecret = serviceDetails.vendor.optional2;
    const baseUrl = serviceDetails.vendor.apiUrl;
    const version = serviceDetails.vendor.optional3;
    const merchantAccessKey = await resolveSubscriptionMerchantAccessKey(subscriptionId);
    if (merchantAccessKey === WHATSAPP_ACCESS_KEY) {
      // WhatsApp merchant clientId/secret only (strict, no fallback). If they're not configured, fail
      // with a clear, greppable reason instead of running the GET below with empty creds — that throws
      // an opaque "Failed to fetch subscription from Cashfree" and leaves the charge order IN_PROGRESS.
      const waCreds = await getWhatsAppMerchantClientCreds();
      if (!waCreds?.clientId || !waCreds?.clientSecret) {
        customLog(traceId, "error", {
          message: "WhatsApp merchant Cashfree credentials not configured (serviceOperator whatsApp_for_busines paymentclientid/secret) — cannot process WhatsApp subscription webhook",
          subscriptionId,
          merchantAccessKey,
        }, "VENDOR");
        throw new Error("WhatsApp merchant Cashfree credentials not configured");
      }
      clientId = waCreds.clientId;
      clientSecret = waCreds.clientSecret;
    } else if (merchantAccessKey && merchantAccessKey !== subscriptionAccessKey) {
      // INDIVIDUAL service's own Cashfree merchant (stamped only when it had paymentclientid/secret).
      const merchantOperator = await findServiceOperatorByAccessKey(merchantAccessKey);
      if (merchantOperator?.paymentclientid && merchantOperator?.paymentclientsecret) {
        clientId = merchantOperator.paymentclientid;
        clientSecret = merchantOperator.paymentclientsecret;
      }
    }
    const fullUrl = `${baseUrl}/pg/subscriptions/${subscriptionId}`;
    const config = {
      method: "GET",
      url: fullUrl,
      headers: {
        "x-api-version": version,
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "Content-Type": "application/json",
      },
    };
    customLog(traceId, "info", { message: "Fetching subscription details from Cashfree", subscriptionId, subscriptionPaymentRefId, merchantAccessKey, clientId: maskCredential(clientId) }, "VENDOR");

    const response = await axios(config);
    customLog(traceId, "info", { message: "Response from Cashfree subscription fetch", subscriptionId, status: response?.status, hasData: !!response?.data, code: response?.data?.code }, "VENDOR");

    if (!response.data || response.data.code) {
      customLog(traceId, "error", {
        message: "SUBSCRIPTION_PAYMENT_SUCCESS: failed to fetch subscription from Cashfree",
        subscriptionId,
        responseCode: response?.data?.code,
        responseMessage: response?.data?.message,
      }, "VENDOR");
      console.error("[processWebhookEventById] failed to fetch from Cashfree", subscriptionId, response?.data);
      throw new Error("Failed to fetch subscription details from Cashfree");
    }

    const paymentData = response.data;
    const denullifyTag = (value) => (value === "null" || value === "undefined" ? null : value);
    const rawSubscriptionTags = paymentData.subscription_tags || {};
    const subscriptionTags = Object.fromEntries(
      Object.entries(rawSubscriptionTags).map(([key, value]) => [key, denullifyTag(value)])
    );
    const {
      corporateId,
      packageId,
      billingType,
      credentialId,
      isAddOns: isAddOnsString,
      coupon: couponTag,
      quantity,
      addonsAccessKey,
      mainSubId,
      partnerId,
      isMandate,
      addonQuantity: mandateAddonQuantity,
    } = subscriptionTags;

    // Parse coupon — new JSON format (coupon tag) with backward compat for old colon-delimited format (couponCode tag).
    let couponCode = "";
    let couponTotalDiscount;
    if (couponTag) {
        const parsed = JSON.parse(couponTag);
        couponCode = parsed?.couponCode || "";
        couponTotalDiscount = parsed?.couponTotalDiscount;
    }
    customLog(traceId, "info", {
      message: "Decoded subscription_tags from Cashfree payload",
      event,
      corporateId,
      credentialId,
      packageId,
      billingType,
      isAddOnsString,
      isMandate,
      mandateAddonQuantity,
      addonsAccessKey,
      mainSubId,
      partnerId,
      subscriptionId,
      subscriptionPaymentRefId,
    });

    const isDuplicateTransaction = await findSubscription({ subscriptionPaymentRefId });
    if (isDuplicateTransaction) {
      customLog(traceId, "info", {
        message: "Duplicate subscription payment, skipping",
        subscriptionPaymentRefId,
        existingSubscriptionId: isDuplicateTransaction?.id,
        corporateId,
        packageId,
      });
      await markGatewayOrderCompleteFromSubscriptionWebhook(data, webhookEventRecord.id);
      return;
    }
    const package = await findOnePackage(packageId);
    if (!package) {
      customLog(traceId, "error", {
        message: "SUBSCRIPTION_PAYMENT_SUCCESS: package not found",
        packageId,
        corporateId,
      }, "VENDOR");
      console.error("[processWebhookEventById] package not found", packageId);
      throw new Error(`Package not found: ${packageId}`);
    }
    const payment_type = data.data.payment_type;
    const corporateTxnId = new Date().valueOf();

    customLog(traceId, "info", {
      message: "Branch resolved",
      payment_type,
      packageType: package?.packageType,
      packageName: package?.packageName,
      isMandateOnly: isMandate === "true" && !isAddOnsString,
      isMandateWithAddon: isMandate === "true" && !!mandateAddonQuantity,
      isAddons: isAddOnsString === "true",
      corporateTxnId,
    });

    if (isMandate === "true" && !isAddOnsString && payment_type === "AUTH") {
      customLog(traceId, "info", {
        message: "Entering MANDATE AUTH branch (sets vendorSubscriptionId on main sub, activates addon if attached)",
        mainSubId,
        mandateAddonQuantity,
        addonsAccessKey,
        corporateId,
      });
      if (mainSubId) {
        await updateVendorSubscriptionId(mainSubId, data.data.subscription_id);
        customLog(traceId, "info", {
          message: "Mandate linked to existing subscription",
          mainSubId,
          vendorSubscriptionId: data.data.subscription_id,
        });
      }

      // If this mandate was set up alongside an addon purchase (e.g. payroll employees),
      // activate the addon now that the mandate is confirmed and notify the customer.
      if (mandateAddonQuantity && addonsAccessKey) {
        const addonPgAmount = data.data.authorization_details?.authorization_amount_refund
          ? 0
          : Number(data.data.authorization_details?.authorization_amount ?? 0);

        // Fetch corporate + partner details once — reused for journal computation and email notification.
        const corporate = await findOneCorporate({ id: corporateId });
        const partnerDetails = await fetchPartnerDetails(corporate?.registeredBy)
        let reportData = {};
        try {
          const addonServiceDetails = await findServiceOperatorByAccessKey(addonsAccessKey, Number(packageId));
          if (addonServiceDetails) {
            reportData = await computeJournalData({
              serviceDetails: addonServiceDetails,
              pgAmount: addonPgAmount,
              amount: addonPgAmount,
              paymentMethod: {},
              partnerDetails: partnerDetails,
              paymentGatewayName: 'Cashfree',
              corporateState: corporate?.state || '',
              isSubscription: true,
              billingType,
            });

            if (reportData) {
              publishJournalEvent(
                {
                  transactionRef: corporateTxnId,
                  type: 'payment',
                  contextSnapshot: {
                    credentialId,
                    vendor: addonServiceDetails?.vendor || null,
                    registeredBy: partnerId || null,
                  },
                  reportData,
                },
                traceId
              );
            }
          }
        } catch (journalErr) {
          customLog(traceId, "error", { message: "Mandate-addon: journal computation failed — continuing", error: journalErr?.message });
        }

        const addonParams = {
          packageId: Number(packageId),
          pgAmount: addonPgAmount,
          corporateId,
          corporateTxnId,
          providerId: subscriptionPaymentRefId,
          billingType,
          paymentGatewayResponse: data,
          subscriptionId,
          partnerId,
          credentialId,
          authPayment: true,
          quantity: mandateAddonQuantity,
          addonsAccessKey,
          traceId,
          reportData,
        };
        const addonResult = await createSubscriptionForAddOns(addonParams);
        if (addonResult?.error) {
          // The Cashfree authorization already COLLECTED money for this addon, but the addon row
          // could not be created. Do NOT mark the order COMPLETE — fail the webhook (mirrors the
          // main AUTH path) so the failure is visible and Cashfree/admin can retry or refund,
          // instead of silently completing with money taken and no addon.
          customLog(traceId, "error", {
            message: "Mandate addon activation failed — marking webhook FAILED",
            reason: addonResult.message,
            mandateAddonQuantity,
            addonsAccessKey,
            corporateId,
          });
          await markGatewayOrderFailedFromSubscriptionWebhook(data, { reason: addonResult.message });
          throw new Error(`Mandate addon activation failed: ${addonResult.message ?? "unknown"}`);
        } else {
          customLog(traceId, "info", {
            message: "Mandate addon activated",
            mandateAddonQuantity,
            addonsAccessKey,
            corporateId,
          });

          // Notify the customer (in-app + email with receipt). Failure to notify
          // must not fail the webhook — wrap in try/catch and log only.
          try {
            // corporate and partnerDetails already fetched above for journal computation.
            const username = corporate?.credential?.username;
            const emailId = corporate?.credential?.email;
            const companyName = corporate?.name;
            if (username && emailId) {

              let subject;
              let body;
              if (addonsAccessKey === operatorsData['payroll']?.['accessKey']) {
                subject = `${mandateAddonQuantity} employees added to your Payroll successfully `;
                body = payrollAddOnEmployeesSuccess(mandateAddonQuantity, companyName, partnerDetails);
              } else if (addonsAccessKey === operatorsData['eSign']?.['accessKey']) {
                subject = `${mandateAddonQuantity} E-signs purchased successfully `;
                body = eSignAddONSuccessTemplate(mandateAddonQuantity, companyName, partnerDetails);
              } else if (addonsAccessKey === operatorsData['hub']?.['accessKey']) {
                subject = 'Additional storage purchased successfully ';
                body = storagePurchaseSuccess(mandateAddonQuantity, companyName, partnerDetails);
              } else if (addonsAccessKey === operatorsData['turbo']?.['accessKey']) {
                subject = `${mandateAddonQuantity} drivers and vehicles purchased successfully `;
                body = turboAddOnFleetSuccess(mandateAddonQuantity, companyName, partnerDetails);
              } else if (addonsAccessKey === operatorsData['eInvoice']?.['accessKey']) {
                subject = `${mandateAddonQuantity} e-Invoice ${Number(mandateAddonQuantity) === 1 ? 'credit' : 'credits'} purchased successfully `;
                body = eInvoiceAddOnSuccessTemplate(mandateAddonQuantity, companyName, partnerDetails);
              } else {
                customLog(traceId, "error", {
                  message: "Mandate-addon: no email template for access key — skipping email",
                  addonsAccessKey,
                  corporateId,
                });
                subject = undefined;
                body = undefined;
              }

              await createNotification({
                notificationTitle: "Add-On Purchase Successful",
                notificationBrief: `Your add-on purchase was successful. ${mandateAddonQuantity} unit${Number(mandateAddonQuantity) > 1 ? 's' : ''} for ₹${formatNumberWithLocalString(addonPgAmount)} has been activated on your account.`,
                notificationTo: [username],
                notificationCategory: "CORPORATE",
                notificationBy: "ADMIN",
                accessKey: null,
                action: "2",
              });

              if (body) {
                // No document for a 0-amount refunded authorization — nothing was paid.
                const attachments = parseFloat(addonPgAmount) > 0
                  ? await generateSubscriptionInvoiceAttachments({
                      amount: addonPgAmount,
                      corporateTxnId,
                      orderId: addonResult?.orderId,
                      paymentType: "Subscription Add-On",
                      description: addonResult?.serviceOperator?.serviceProvider
                        ? `Add On (${addonResult.serviceOperator.serviceProvider}) - ${mandateAddonQuantity} unit${Number(mandateAddonQuantity) > 1 ? 's' : ''}`
                        : `${addonResult?.packageDetails?.packageName || 'Subscription'} Add-On`,
                      credentialId,
                      pgAmount: addonPgAmount,
                      // authorization_details carries both the method string and the instrument
                      // (UPI VPA / masked card), so the receipt can read "UPI - abc@ybl".
                      paymentMethod: data?.data?.authorization_details || data?.data?.payment_method,
                      traceId,
                    })
                  : [];
                emailer.emailWithMultipleAttachment(emailId, subject, body, attachments, undefined, function (err) {
                  if (err) {
                    customLog(traceId, "error", { message: "Failed to send mandate-addon email", emailId, error: err });
                  } else {
                    customLog(traceId, "info", { message: "Mandate-addon email sent", emailId, username });
                  }
                });
              }
            } else {
              customLog(traceId, "info", { message: "Skipping mandate-addon notification — missing username/email", corporateId });
            }
          } catch (notifyErr) {
            customLog(traceId, "error", { message: "Mandate-addon notification failed", error: notifyErr?.message, corporateId });
          }
        }
      }

      await markGatewayOrderCompleteFromSubscriptionWebhook(data, webhookEventRecord.id);
      return;
    }

    const {
      isWhatsAppSubscription,
      isEcommerceStoreSubscription,
      subscriptionPlan: waPlan,
      subscriptionDuration: waDuration,
      waProjectId,
      isUpgrade: isWaUpgrade,
      isRenewal: isWaRenewal,
    } = paymentData.subscription_tags;

    if (isWhatsAppSubscription === "true") {
      customLog(traceId, "info", {
        message: "Entering WHATSAPP branch",
        payment_type,
        waPlan,
        waDuration,
        waProjectId,
        isWaUpgrade,
        isWaRenewal,
        corporateId,
        paymentData
      });

      // CHARGE: resolve existingSub before shared fetches so corporateUserId/packageId are available
      let existingSub = null;
      if (payment_type === "CHARGE") {
        customLog(traceId, "info", { message: "WhatsApp CHARGE: looking up existing subscription by vendorSubscriptionId", vendorSubscriptionId: data.data.subscription_id });
        existingSub = await findWhatsAppSubscriptionByVendorId(data.data.subscription_id);
        if (!existingSub) {
          customLog(traceId, "info", { message: "No active WhatsApp subscription found for CHARGE webhook", vendorSubscriptionId: data.data.subscription_id });
          await markGatewayOrderCompleteFromSubscriptionWebhook(data, webhookEventRecord.id);
          return;
        }
        customLog(traceId, "info", {
          message: "WhatsApp CHARGE: existing subscription found — renewing",
          existingSubscriptionId: existingSub.id,
          corporateUserId: existingSub.corporateUserId,
          billingPlan: existingSub.billingPlan,
          billingType: existingSub.billingType,
          paymentAmount: data.data.payment_amount,
        });
      }

      // Shared: corporate, serviceOperator, partnerDetails
      const resolvedCorporateId = payment_type === "CHARGE" ? existingSub.corporateUserId : corporateId;
      const resolvedPackageId = payment_type === "CHARGE" ? existingSub.packageId : packageId;
      const [corporate, waServiceDetails] = await Promise.all([
        findOneCorporate({ id: resolvedCorporateId }),
        fetchServiceDetails({
          credentialId,
          accessKey: WHATSAPP_ACCESS_KEY,
          packageId: resolvedPackageId,
          corporateUserId: resolvedCorporateId,
        }),
      ]);
      // fetchServiceDetails carries the plan's surcharge and cashback, which the bare operator lacks.
      const waServiceOperator = waServiceDetails?.error
        ? await findServiceOperatorByAccessKey(WHATSAPP_ACCESS_KEY, resolvedPackageId)
        : waServiceDetails;
      const partnerDetails = await fetchPartnerDetails(corporate?.registeredBy)

      // Shared: plan/addon computation
      await applyCommissionMarkup(package, `packagePrices.${waDuration}`, credentialId);
      const commFields = getWaCommissionFields(package, waDuration);
      const botBuilderNum = Number(paymentData.subscription_tags.botBuilder || 0);
      const rawPackagePrice = Number(package?.packagePrices?.[waDuration] || 0);
      const packageDiscount = Number(package?.discount?.[waDuration] || 0);
      const planAmount = (rawPackagePrice ? Math.max(0, rawPackagePrice - packageDiscount) : 0)
        || Number(paymentData.subscription_tags.amount || 0);
      // Peko bears the plan discount: the journal works on the plan price before it (commission, vendor payable).
      const planAmountBeforeDiscount = planAmount + packageDiscount;
      const planDetails = [{
        name: package?.packageName ? `Service Package : ${package.packageName}` : "Service Package",
        commissionMode: commFields.commissionMode,
        commissionType: commFields.commissionType,
        commission: commFields.commission,
        fixedCommissionPerTransaction: commFields.fixedCommissionPerTransaction,
        isCommissionInclGST: commFields.isCommissionInclGST,
        isCommissionConfigured: package?.isCommissionConfigured,
        amount: planAmountBeforeDiscount,
      }];
      const addOnMonths = waDuration?.toLowerCase() !== 'monthly' ? 12 : 1;
      const addOnDetails = [];
      for (const { addOnType, name, tagAmount, getValues } of [
        { addOnType: "BOT_BUILDER", name: "WhatsApp Bot Builder", tagAmount: botBuilderNum, getValues: getBotBuilderValues },
        { addOnType: "SHOPIFY_INTEGRATION", name: "WhatsApp Shopify Integration", tagAmount: Number(paymentData.subscription_tags.shopifyIntegration || 0), getValues: getShopifyIntegrationValues },
      ]) {
        const addOnSetting = tagAmount ? await getValues(credentialId) : null;
        if (!addOnSetting) continue;
        addOnDetails.push({
          addOnType,
          name,
          commissionMode: addOnSetting?.details?.commissionMode,
          commissionType: addOnSetting?.details?.commissionType,
          commission: addOnSetting?.details?.commission,
          fixedCommissionPerTransaction: addOnSetting?.details?.fixedCommissionPerTransaction,
          isCommissionInclGST: addOnSetting?.details?.isCommissionInclGST,
          amount: Number(addOnSetting?.details?.amount || 0),
          quantity: addOnMonths,
        });
      }

      if (payment_type === "AUTH") {
        const waUsername = corporate?.credential?.username ?? "";
        const waVendor = await fetchVendorDetailsByServiceDetails(
          { id: credentialId, packageId, corporateId },
          WHATSAPP_ACCESS_KEY
        );
        let projectId = waProjectId || null;

        if (isWaUpgrade !== "true" && isWaRenewal !== "true") {
          customLog(traceId, "info", { message: "WhatsApp AUTH: first-time purchase, creating AiSensy project", corporateId, credentialId });
          try {
            const waBusinessResult = await fetchWhatsAppBusinessByCredentialId(credentialId);
            if (waBusinessResult?.status && waBusinessResult?.businessId) {
              const mockReq = {
                body: { subscriptionPlan: waPlan, subscriptionDuration: waDuration },
                user: { id: credentialId, username: waUsername },
              };
              const projectResult = await createProjectApi(waVendor, waBusinessResult.businessId, mockReq);
              if (projectResult?.status) {
                projectId = projectResult.data?.id ?? null;
                customLog(traceId, "info", { message: "WhatsApp AUTH: AiSensy project created", projectId, corporateId }, "VENDOR");
              } else {
                customLog(traceId, "error", { message: "WhatsApp AUTH: createProjectApi did not return status=true", corporateId, projectResult }, "VENDOR");
              }
            } else {
              customLog(traceId, "info", { message: "WhatsApp AUTH: no AiSensy business for credential — projectId stays null", credentialId, corporateId, waBusinessResult });
            }
          } catch (createProjErr) {
            customLog(traceId, "error", { message: "Failed to create AiSensy project in WhatsApp AUTH webhook", error: createProjErr?.message, stack: createProjErr?.stack, corporateId }, "VENDOR");
            console.error("[processWebhookEventById] createProjectApi failed", corporateId, createProjErr?.message);
          }
        } else if (isWaUpgrade === "true" && projectId) {
          customLog(traceId, "info", { message: "WhatsApp AUTH: upgrade flow — updating AiSensy plan", projectId, corporateId, waPlan, waDuration });
          try {
            await UpdateProjectPlanApi(waVendor, {
              body: { subscriptionPlan: waPlan, subscriptionDuration: waDuration, projectId },
            });
            customLog(traceId, "info", { message: "WhatsApp AUTH: AiSensy plan updated", projectId, corporateId }, "VENDOR");
          } catch (updateProjErr) {
            customLog(traceId, "error", { message: "Failed to update AiSensy project plan on upgrade", error: updateProjErr?.message, stack: updateProjErr?.stack, projectId, corporateId }, "VENDOR");
            console.error("[processWebhookEventById] UpdateProjectPlanApi failed", corporateId, updateProjErr?.message);
          }
        }

        let subscriptionDiscountPrice = 0;
        let addOndiscountPrice = 0;
        let shopifyAddOndiscountPrice = 0;
        if (isWaUpgrade === "true") {
          ({ subscriptionDiscountPrice = 0, addOndiscountPrice = 0, shopifyAddOndiscountPrice = 0 } =
            await fetchUpgradingDiscountPrice(credentialId));
        }

        // Credit reduces the base BEFORE commission, matching AE — not subtracted afterward.
        const creditedPlanDetails = [{ ...planDetails[0], amount: Math.max(0, planAmountBeforeDiscount - subscriptionDiscountPrice) }];
        const creditedAddOnDetails = addOnDetails.map((addon) => ({
          ...addon,
          amount: Math.max(0, Number(addon.amount || 0) - (addon.addOnType === "SHOPIFY_INTEGRATION" ? shopifyAddOndiscountPrice : addOndiscountPrice) / (Number(addon.quantity) || 1)),
        }));

        const pgAmountNum = Number(paymentData.subscription_tags.pgAmount || 0);
        const amountAfterCredit = Number(paymentData.subscription_tags.amount || 0) || Math.max(
          0,
          planAmount -
            subscriptionDiscountPrice +
            (Number(paymentData.subscription_tags.botBuilder || 0) - addOndiscountPrice) +
            (Number(paymentData.subscription_tags.shopifyIntegration || 0) - shopifyAddOndiscountPrice)
        );
        const reportData = await computeJournalData({
          serviceDetails: waServiceOperator,
          pgAmount: pgAmountNum,
          amount: amountAfterCredit + packageDiscount,
          surchargeBaseAmount: amountAfterCredit,
          paymentMethod: {
            name: data?.data?.authorization_details?.payment_method || "upi",
            code: data?.data?.authorization_details?.payment_method || "upi",
          },
          partnerDetails,
          paymentGatewayName: "Cashfree",
          planDetails: creditedPlanDetails,
          addOnDetails: creditedAddOnDetails,
          couponTotalDiscount: (couponTotalDiscount || 0) + packageDiscount,
          corporateState: corporate?.state || '',
          credentialId,
        });

        const waAuthBreakdown = await findGatewayOrderPaymentData({
          vendorSubscriptionId: String(data.data.subscription_id),
          orderKind: "SUBSCRIPTION_AUTH",
        });
        const result = await createWhatsAppSubscriptionFromWebhook(
          { ...paymentData?.subscription_tags, surcharge: waAuthBreakdown?.surcharge ?? 0, couponTotalDiscount, subscriptionDiscountPrice, addOndiscountPrice, shopifyAddOndiscountPrice },
          projectId,
          data.data.subscription_id,
          waServiceOperator?.id ?? null,
          reportData
        );

        if (result.error) {
          customLog(traceId, "error", {
            message: "WhatsApp AUTH: createWhatsAppSubscriptionFromWebhook returned error",
            reason: result.message,
            corporateId,
            projectId,
            vendorSubscriptionId: data.data.subscription_id,
          }, "VENDOR");
          console.error("[processWebhookEventById] createWhatsAppSubscriptionFromWebhook error", corporateId, result.message);
          await markGatewayOrderFailedFromSubscriptionWebhook(data, { reason: result.message });
          return;
        }

        customLog(traceId, "info", {
          message: "WhatsApp AUTH: subscription created successfully",
          corporateId,
          projectId,
          vendorSubscriptionId: data.data.subscription_id,
        });

        if (reportData) {
          publishJournalEvent(
            {
              transactionRef: result?.corporateTxnId ?? corporateTxnId,
              type: "payment",
              contextSnapshot: {
                credentialId,
                vendor: waServiceOperator?.vendor || null,
                registeredBy: partnerId || null,
              },
              reportData,
            },
            traceId
          );
        }

        // Notification + email are side-effects of WhatsApp purchase / upgrade success.
        // Subscription row already committed by createWhatsAppSubscriptionFromWebhook —
        // a failure here must NOT throw or the webhook gets marked FAILED and Cashfree
        // re-delivers, double-creating downstream artifacts.
        try {
          const username = corporate?.credential?.username;
          const emailId = corporate?.credential?.email;
          const companyName = corporate?.name;
          if (username && emailId) {
            const isUpgradeFlow = isWaUpgrade === "true";
            const planLabel = result?.subscription?.billingPlan
              ? `WhatsApp ${result.subscription.billingPlan === "BASIC" ? "Basic" : "Pro"}`
              : (result?.packageDetails?.packageName ?? "WhatsApp");

            const notificationData = {
              notificationTitle: isUpgradeFlow ? "WhatsApp Plan Upgraded" : "WhatsApp Purchase Successful",
              notificationBrief: isUpgradeFlow
                ? `Your WhatsApp plan has been upgraded to ${planLabel}. Your new plan features are now active.`
                : `Your ${planLabel} subscription is now active. Thank you for your purchase.`,
              notificationTo: [username],
              notificationCategory: "CORPORATE",
              notificationBy: "ADMIN",
              accessKey: null,
              action: "2",
            };
            try {
              await createNotification(notificationData);
              customLog(traceId, "info", { message: "WhatsApp AUTH: notification created", corporateId, planLabel, isUpgradeFlow });
            } catch (notifyErr) {
              customLog(traceId, "error", {
                message: "WhatsApp AUTH: notification failed (non-fatal)",
                corporateId,
                error: notifyErr?.message ?? String(notifyErr),
              }, "VENDOR");
            }

            try {
              const subject = isUpgradeFlow
                ? `${planLabel} Subscription Upgrade Confirmation`
                : `${planLabel} Subscription Purchase Confirmation`;
              const body = subscriptionIndividualSuccessEmail(
                companyName,
                result?.corporateTxnId ?? corporateTxnId,
                result?.subscription,
                result?.packageDetails ?? { packageName: planLabel },
                partnerDetails
              );
              // The util mints its own corporateTxnId/order row — use the ids it returns.
              const paidWaAmount = Number(paymentData?.authorization_details?.authorization_amount ?? data?.data?.payment_amount ?? 0);
              const waAuthSurcharge = Number(waAuthBreakdown?.surcharge || 0);
              const invoiceAttachments = paidWaAmount > 0
                ? await generateOrderInvoiceAttachments({
                    amount: paidWaAmount - waAuthSurcharge + (couponTotalDiscount || 0),
                    surcharge: waAuthSurcharge,
                    couponDiscount: couponTotalDiscount || 0,
                    corporateTxnId: result?.corporateTxnId ?? corporateTxnId,
                    orderId: result?.orderId,
                    paymentType: "WhatsApp Subscription",
                    description: planLabel,
                    credentialId: result?.credentialId ?? credentialId,
                    pgAmount: paidWaAmount,
                    paymentMethod: paymentData?.authorization_details || paymentData?.payment_method,
                    vendor: waServiceOperator?.vendor,
                    commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
                    planDetails,
                    addOnDetails,
                    commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
                    traceId,
                  })
                : [];
              emailer.emailWithMultipleAttachment(emailId, subject, body, invoiceAttachments, undefined, function (err) {
                if (err) {
                  customLog(traceId, "error", { message: "WhatsApp AUTH: email send failed", to: emailId, error: err?.message ?? err }, "VENDOR");
                } else {
                  customLog(traceId, "info", { message: "WhatsApp AUTH: email sent", to: emailId, planLabel });
                }
              });
            } catch (emailErr) {
              customLog(traceId, "error", {
                message: "WhatsApp AUTH: email side-effect failed (non-fatal)",
                corporateId,
                error: emailErr?.message ?? String(emailErr),
                stack: emailErr?.stack,
              }, "VENDOR");
            }
          } else {
            customLog(traceId, "info", {
              message: "WhatsApp AUTH: skipping notification/email — missing username or email",
              corporateId,
              hasUsername: !!username,
              hasEmail: !!emailId,
            });
          }
        } catch (notifyOuterErr) {
          customLog(traceId, "error", {
            message: "WhatsApp AUTH: outer notification block failed (non-fatal)",
            corporateId,
            error: notifyOuterErr?.message ?? String(notifyOuterErr),
            stack: notifyOuterErr?.stack,
          }, "VENDOR");
        }

        await markGatewayOrderCompleteFromSubscriptionWebhook(data, webhookEventRecord.id);
        return;
      }

      if (payment_type === "CHARGE") {
        // Idempotency: if a base WhatsApp row already carries this charge's stable payment ref
        // (cf_payment_id), this SUCCESS was already processed (e.g. a FAILED-event redelivery that
        // reprocesses). Do not renew again — mark the order COMPLETE and return. (whatsAppSubscriptions
        // has no corporateTxnId column and isn't covered by the Peko duplicate guard above.)
        const alreadyRenewed = await findWhatsAppSubscriptionByPaymentRef(subscriptionPaymentRefId);
        if (alreadyRenewed) {
          customLog(traceId, "info", { message: "WhatsApp CHARGE: cycle already exists for this payment ref, skipping renewal", subscriptionPaymentRefId, existingSubscriptionId: alreadyRenewed.id }, "VENDOR");
          await markGatewayOrderCompleteFromSubscriptionWebhook(data, webhookEventRecord.id);
          return;
        }
        const pgAmountNum = Number(data.data.payment_amount || 0);
        const reportData = await computeJournalData({
          serviceDetails: waServiceOperator,
          pgAmount: pgAmountNum,
          amount: planAmountBeforeDiscount,
          surchargeBaseAmount: planAmount,
          paymentMethod: {
            name: data?.data?.authorization_details?.payment_method || "upi",
            code: data?.data?.authorization_details?.payment_method || "upi",
          },
          partnerDetails,
          paymentGatewayName: "Cashfree",
          planDetails,
          addOnDetails,
          couponTotalDiscount: packageDiscount,
          corporateState: corporate?.state || '',
          credentialId,
        });

          // Plan/discount/surcharge/add-on split the scheduler stamped on the charge order
          // (null for charges triggered before the breakdown was added → legacy split).
          const waChargeBreakdown = await findGatewayOrderPaymentData({
            referenceNo: data.data.payment_id,
            orderKind: "SUBSCRIPTION_CHARGE",
          });
        const renewal = await renewWhatsAppSubscription(
          existingSub.id,
          corporateTxnId,
          Number(data.data.payment_amount),
          waServiceOperator?.id ?? null,
          subscriptionPaymentRefId,
          waChargeBreakdown?.planAmount != null ? waChargeBreakdown : null,
          reportData
        );

      if (renewal.error) {
          // The renewal transaction failed and rolled back (no rows created; the old row is still
          // ACTIVE). Do NOT fall through to markComplete — that would report a charged-but-unrenewed
          // order as successful. Throw so the event is recorded FAILED and redelivered;
          // renewWhatsAppSubscription is idempotent on retry (it re-finds the still-ACTIVE old row)
          // and the success path below marks the order COMPLETE once the transient failure clears.
          customLog(traceId, "error", {
            message: "WhatsApp CHARGE: renewal failed — not marking order complete, will retry on redelivery",
            existingSubscriptionId: existingSub.id,
            vendorSubscriptionId: data.data.subscription_id,
            error: renewal.message,
          }, "VENDOR");
          throw new Error(`WhatsApp renewal failed for subscription ${existingSub.id}: ${renewal.message ?? "unknown error"}`);
        }

        if (!renewal.error) {
          if (reportData) {
            publishJournalEvent(
              {
                transactionRef: corporateTxnId,
                type: "payment",
                contextSnapshot: {
                  credentialId,
                  vendor: waServiceOperator?.vendor || null,
                  registeredBy: partnerId || null,
                },
                reportData,
              },
              traceId
            );
          }

          try {
            const waServiceOp = await findServiceOperatorByAccessKey(WHATSAPP_ACCESS_KEY);
            if (waServiceOp?.vendor) {
              const { optional1: API_Key, optional2: PartnerId, apiUrl: URL, optional4: familyId } = waServiceOp.vendor;
              const billingTypeFmt = existingSub.billingType === "ANNUALLY" ? "YEARLY" : existingSub.billingType;
              const defaultPlan = `${existingSub.billingPlan}_${billingTypeFmt}`;
              await axios.patch(
                `${URL}/partner/${PartnerId}/project/${existingSub.projectId}/billing/reactivate-project`,
                { familyId: `${familyId}`, defaultPlan },
                { headers: { "Content-Type": "application/json", "X-AiSensy-Partner-API-Key": `${API_Key}` } }
              );
            }
          } catch (reactivateErr) {
            customLog(traceId, "error", { message: "Failed to reactivate WhatsApp project billing", error: reactivateErr?.message }, "VENDOR");
          }

            // Renewal-success notification + receipt email (non-fatal — the renewed rows are already
            // committed; throwing here would mark the webhook FAILED and trigger a Cashfree re-charge).
            try {
              const corporate = await findOneCorporate({ id: existingSub.corporateUserId });
              const username = corporate?.credential?.username;
              const emailId = corporate?.credential?.email;
              const companyName = corporate?.name;
              if (username && emailId) {
                const partnerDetails = await fetchPartnerDetails(corporate.registeredBy);
                const planLabel = `WhatsApp ${existingSub.billingPlan === "BASIC" ? "Basic" : "Pro"}`;
                const renewedAmount = Number(data.data.payment_amount);
                const renewedSurcharge = Number(waChargeBreakdown?.surcharge || 0);
                try {
                  await createNotification({
                    notificationTitle: "Renewal Successful",
                    notificationBrief: `Your ${planLabel} subscription has been renewed. A payment of ₹ ${formatNumberWithLocalString(renewedAmount)} was processed successfully and your service continues uninterrupted.`,
                    notificationTo: [username],
                    notificationCategory: "CORPORATE",
                    notificationBy: "ADMIN",
                    accessKey: null,
                    action: "2",
                  });
                } catch (notifyErr) {
                  customLog(traceId, "error", { message: "WhatsApp CHARGE: renewal notification failed (non-fatal)", corporateUserId: existingSub.corporateUserId, error: notifyErr?.message ?? String(notifyErr) }, "VENDOR");
                }
                try {
                  const body = subscriptionIndividualSuccessEmail(companyName, corporateTxnId, renewal?.subscription, { packageName: planLabel }, partnerDetails);
                  const invoiceAttachments = renewedAmount > 0
                    ? await generateOrderInvoiceAttachments({
                        amount: renewedAmount - renewedSurcharge,
                        surcharge: renewedSurcharge,
                        corporateTxnId,
                        orderId: renewal?.orderId,
                        paymentType: "WhatsApp Subscription",
                        description: `${planLabel} renewal`,
                        credentialId: renewal?.credentialId ?? existingSub.credentialId,
                        pgAmount: renewedAmount,
                        // authorization_details carries both the method string and the instrument
                      // (UPI VPA / masked card), so the receipt can read "UPI - abc@ybl".
                      paymentMethod: data?.data?.authorization_details || data?.data?.payment_method,
                        vendor: waServiceOperator?.vendor,
                        commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
                        planDetails,
                        addOnDetails,
                        commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
                        traceId,
                      })
                    : [];
                  emailer.emailWithMultipleAttachment(emailId, `${planLabel} Subscription Renewal Confirmation`, body, invoiceAttachments, undefined, function (err) {
                    if (err) {
                      customLog(traceId, "error", { message: "WhatsApp CHARGE: renewal email failed", to: emailId, error: err?.message ?? err }, "VENDOR");
                    } else {
                      customLog(traceId, "info", { message: "WhatsApp CHARGE: renewal email sent", to: emailId, planLabel });
                    }
                  });
                } catch (emailErr) {
                  customLog(traceId, "error", { message: "WhatsApp CHARGE: renewal email side-effect failed (non-fatal)", corporateUserId: existingSub.corporateUserId, error: emailErr?.message ?? String(emailErr) }, "VENDOR");
                }
              } else {
                customLog(traceId, "info", { message: "WhatsApp CHARGE: skipping renewal notification/email — missing username or email", corporateUserId: existingSub.corporateUserId }, "VENDOR");
              }
            } catch (notifyOuterErr) {
              customLog(traceId, "error", { message: "WhatsApp CHARGE: outer renewal notification block failed (non-fatal)", corporateUserId: existingSub.corporateUserId, error: notifyOuterErr?.message ?? String(notifyOuterErr) }, "VENDOR");
            }
        } else {
          // Charge succeeded at the gateway but there is no ACTIVE base row to renew (already
          // expired / cancelled / upgraded, or retired by the lapsed-subscription fallback). Reporting
          // COMPLETE here would hide a paid-but-unrenewed charge, so mark the order FAILED so it surfaces
          // in the renewal / scheduler-charge reports for manual review (refund or manual renew). Not
          // retryable — no webhook redelivery can conjure a subscription to renew, so we don't throw.
          customLog(traceId, "error", { message: "WhatsApp CHARGE: charge succeeded but no ACTIVE subscription to renew — marking order FAILED for review", vendorSubscriptionId: data.data.subscription_id, paymentAmount: data.data.payment_amount }, "VENDOR");
          await markGatewayOrderFailedFromSubscriptionWebhook(data, { reason: "No active WhatsApp subscription to renew on CHARGE success" });
          return;
        }
        await markGatewayOrderCompleteFromSubscriptionWebhook(data, webhookEventRecord.id);
        return;
      }
    }

    if (isEcommerceStoreSubscription === "true") {
      customLog(traceId, "info", {
        message: "Entering PEKO COMMERCE branch",
        payment_type,
        corporateId,
        packageId,
      }, "VENDOR");

      const ecomServiceOperator = await findServiceOperatorByAccessKey(ECOMMERCE_STORE_ACCESS_KEY);
      const ecomPartnerDetails = await fetchPartnerDetails(partnerId);

      if (payment_type === "AUTH") {
        const authAmount = data.data.authorization_details?.authorization_amount_refund
          ? 0
          : Number(data.data.authorization_details?.authorization_amount ?? 0);

        const result = await createEcommerceStoreSubscriptionFromWebhook({
          subscriptionTags: { credentialId, corporateId, packageId, billingType, couponCode, couponTotalDiscount, partnerId, pgAmount: authAmount },
          packageDetails: package,
          vendorSubscriptionId: data.data.subscription_id,
          serviceOperatorId: ecomServiceOperator?.id ?? null,
          paymentGatewayResponse: data,
          partnerDetails: ecomPartnerDetails,
        });

        if (result?.error) {
          customLog(traceId, "error", {
            message: "Peko Commerce AUTH: subscription creation failed",
            reason: result.message,
            corporateId,
          }, "VENDOR");
          await markGatewayOrderFailedFromSubscriptionWebhook(data, { reason: result.message });
          return;
        }

        try {
          const corporate = await findOneCorporate({ id: corporateId });
          const username = corporate?.credential?.username;
          const emailId = corporate?.credential?.email;
          const companyName = corporate?.name;
          if (username && emailId) {
            await createNotification({
              notificationTitle: "Purchase Successful",
              notificationBrief: `We are pleased to inform you that your Peko Commerce ${result.packageDetails.packageName} plan purchase has been successful. Your service is now active.`,
              notificationTo: [username],
              notificationCategory: "CORPORATE",
              notificationBy: "ADMIN",
              accessKey: null,
              action: "2",
            });
            const body = generateEcommerceStorePaymentSuccessEmail(
              companyName,
              corporateTxnId,
              authAmount,
              result.packageDetails.packageName,
              ecomPartnerDetails
            );
            const ecomCouponDiscount = Number(couponTotalDiscount) || 0;
            const attachments = authAmount > 0
              ? await generateSubscriptionInvoiceAttachments({
                  amount: authAmount + ecomCouponDiscount,
                  couponDiscount: ecomCouponDiscount,
                  corporateTxnId,
                  orderId: result.orderId,
                  paymentType: "Peko Commerce",
                  description: ecommerceStoreInvoiceDescription(result.packageDetails?.packageName, billingType),
                  credentialId,
                  pgAmount: authAmount,
                  paymentMethod: data?.data?.authorization_details || data?.data?.payment_method,
                  traceId,
                })
              : [];
            emailer.emailWithMultipleAttachment(emailId, `${result.packageDetails.packageName} Plan Purchase Confirmation`, body, attachments, undefined, (emailErr) => {
              if (emailErr) {
                customLog(traceId, "error", { message: "Peko Commerce AUTH: failed to send confirmation email", emailErr }, "VENDOR");
              } else {
                customLog(traceId, "info", { message: "Peko Commerce AUTH: confirmation email sent", emailId });
              }
            });
          }
        } catch (notifyErr) {
          customLog(traceId, "error", { message: "Peko Commerce AUTH: notification/email failed (non-fatal)", error: notifyErr?.message }, "VENDOR");
        }

        await markGatewayOrderCompleteFromSubscriptionWebhook(data, webhookEventRecord.id);
        return;
      }

      // CHARGE — renewal. Looked up by the Cashfree mandate id (subscriptionId), not mainSubId,
      // since mainSubId is stale after the first renewal (see renewEcommerceStoreSubscription).
      const chargedAmount = Number(data.data.payment_amount);
      const ecomChargeOrder = await paymentGatewayOrders.findOne({
        where: { referenceNo: data.data.payment_id, orderKind: "SUBSCRIPTION_CHARGE" },
        raw: true,
      });
      let ecomChargeBreakdown = null;
      try {
        ecomChargeBreakdown = ecomChargeOrder?.paymentData
          ? (typeof ecomChargeOrder.paymentData === "string" ? JSON.parse(ecomChargeOrder.paymentData) : ecomChargeOrder.paymentData)
          : null;
      } catch (_) {
        ecomChargeBreakdown = null;
      }
      const result = await renewEcommerceStoreSubscription({
        vendorSubscriptionId: subscriptionId,
        chargedAmount,
        listPrice: ecomChargeBreakdown?.listPrice,
        discountAmount: ecomChargeBreakdown?.discountAmount,
        paymentGatewayResponse: data,
        partnerDetails: ecomPartnerDetails,
        partnerId,
      });

      if (result?.error) {
        customLog(traceId, "error", {
          message: "Peko Commerce CHARGE: renewal failed — no active subscription to renew",
          vendorSubscriptionId: subscriptionId,
          reason: result.message,
        }, "VENDOR");
        await markGatewayOrderFailedFromSubscriptionWebhook(data, { reason: result.message });
        return;
      }

      try {
        const corporate = await findOneCorporate({ id: result.corporateId });
        const username = corporate?.credential?.username;
        const emailId = corporate?.credential?.email;
        const companyName = corporate?.name;
        if (username && emailId) {
          await createNotification({
            notificationTitle: "Peko Commerce Plan Renewed",
            notificationBrief: `Your Peko Commerce ${result.packageDetails.packageName} plan has been renewed successfully.`,
            notificationTo: [username],
            notificationCategory: "CORPORATE",
            notificationBy: "ADMIN",
            accessKey: null,
            action: "2",
          });
          const body = generateEcommerceStoreRenewalSuccessEmail(
            companyName,
            corporateTxnId,
            chargedAmount,
            result.packageDetails.packageName,
            ecomPartnerDetails
          );
          const attachments = chargedAmount > 0
            ? await generateSubscriptionInvoiceAttachments({
                amount: chargedAmount,
                corporateTxnId,
                orderId: result.orderId,
                paymentType: "Peko Commerce",
                description: ecommerceStoreInvoiceDescription(result.packageDetails?.packageName, result.billingType),
                credentialId: result.credentialId,
                pgAmount: chargedAmount,
                paymentMethod: data?.data?.authorization_details || data?.data?.payment_method,
                traceId,
              })
            : [];
          emailer.emailWithMultipleAttachment(emailId, `${result.packageDetails.packageName} Plan Renewal Confirmation`, body, attachments, undefined, (emailErr) => {
            if (emailErr) {
              customLog(traceId, "error", { message: "Peko Commerce CHARGE: failed to send renewal email", emailErr }, "VENDOR");
            } else {
              customLog(traceId, "info", { message: "Peko Commerce CHARGE: renewal email sent", emailId });
            }
          });
        }
      } catch (notifyErr) {
        customLog(traceId, "error", { message: "Peko Commerce CHARGE: notification/email failed (non-fatal)", error: notifyErr?.message }, "VENDOR");
      }

      await markGatewayOrderCompleteFromSubscriptionWebhook(data, webhookEventRecord.id);
      return;
    }

    let params = {};
    if (payment_type == "AUTH") {
      params = {
        packageId: package.id,
        pgAmount: data.data.authorization_details.authorization_amount_refund
          ? 0
          : Number(data.data.authorization_details.authorization_amount),
        corporateId: corporateId,
        corporateTxnId,
        providerId: subscriptionPaymentRefId,
        billingType: billingType,
        paymentGatewayResponse: data,
        subscriptionId,
        partnerId: partnerId,
        credentialId: credentialId,
        authPayment: true,
        couponCode: couponCode != false ? couponCode : false
      };
      customLog(traceId, "info", {
        message: "AUTH params built",
        packageId: params.packageId,
        pgAmount: params.pgAmount,
        billingType,
        corporateId,
        partnerId,
        couponCode: params.couponCode,
        authorizationAmount: data.data.authorization_details?.authorization_amount,
        authorizationAmountRefund: data.data.authorization_details?.authorization_amount_refund,
      });
    } else {
      // CHARGE payment — order status is tracked in paymentGatewayOrders via merchant paymentId
      params = {
        packageId: package.id,
        pgAmount: Number(data.data.payment_amount),
        corporateId: corporateId,
        providerId: subscriptionPaymentRefId,
        corporateTxnId,
        billingType: billingType,
        paymentGatewayResponse: data,
        subscriptionId,
        partnerId: partnerId,
        credentialId: credentialId,
        authPayment: false,
      };
      customLog(traceId, "info", {
        message: "CHARGE params built (renewal)",
        packageId: params.packageId,
        packageName: package?.packageName,
        pgAmount: params.pgAmount,
        billingType,
        corporateId,
        partnerId,
        vendorSubscriptionId: subscriptionId,
      });
    }
    customLog(traceId, "info", { message: "Loading mainSubscription", mainSubId, corporateId });
    const mainSubscription = mainSubId ? await findSubscriptionById(mainSubId) : null;
    customLog(traceId, "info", {
      message: "Loaded mainSubscription",
      mainSubId,
      mainSubscriptionFound: !!mainSubscription,
    });
    const isAddons = isAddOnsString && isAddOnsString === "true" ? true : false;
    if (payment_type === "CHARGE") {
      // Renewal validation: the expected amount IS exactly what the scheduler REQUESTED in the charge API,
      // persisted on the SUBSCRIPTION_CHARGE order (paymentData.amount, keyed by referenceNo — which Cashfree
      // echoes back as payment_id). That requested figure already includes recurring addons (e.g. the ₹300
      // payroll addon), because the charge API computed it via calculatePlanAmount (plan + active recurring
      // addons, GROUP-tier re-anchored). So we validate what Cashfree charged against what we requested.
      const chargedAmount = Number(params.pgAmount); // = Number(data.data.payment_amount)
      const chargeRef = extractMerchantPaymentIdFromWebhook(data);

      const chargeOrder = chargeRef
        ? await paymentGatewayOrders.findOne({
            where: { referenceNo: String(chargeRef), orderKind: ORDER_KIND.SUBSCRIPTION_CHARGE },
            order: [["id", "DESC"]],
            raw: true,
          })
        : null;
      const requestedAmount = chargeOrder?.paymentData ? Number(JSON.parse(chargeOrder.paymentData)?.amount) : null;

      // Independent cross-check with the SAME calculation the charge API used — it MUST include the recurring
      // addon (findAllAddonSubscription + isDynamicUnitPricing) and should equal the requested amount. Logged
      // only: pricing drift here is a signal, not grounds to reject what we actually requested and charged.
      let recomputedAmount = null;
      try {
        const planPricing = await calculatePlanAmount(package, billingType, false, null, null, corporateId);
        recomputedAmount = Number(planPricing.periodicPrice);
      } catch (priceErr) {
        customLog(traceId, "error", { message: "CHARGE recompute (calculatePlanAmount) failed", error: priceErr?.message, packageId, corporateId }, "VENDOR");
      }
      if (recomputedAmount != null && requestedAmount != null && recomputedAmount.toFixed(2) !== requestedAmount.toFixed(2)) {
        customLog(traceId, "info", { message: "CHARGE recompute differs from requested amount (pricing drift — not blocking)", chargeRef, recomputedAmount, requestedAmount, chargedAmount, packageId, corporateId }, "VENDOR");
      }

      // Expected = the amount we requested in the charge API. Fall back to the recompute only if no order is
      // on record (anomalous — a charge we never persisted).
      const expectedAmount = requestedAmount != null ? requestedAmount : recomputedAmount;
      customLog(traceId, "info", { message: "Validating CHARGE amount", chargeRef, expectedAmount, requestedAmount, recomputedAmount, chargedAmount, packageId, corporateId });
      if (!(expectedAmount > 0) || Number(expectedAmount).toFixed(2) !== chargedAmount.toFixed(2)) {
        customLog(traceId, "error", {
          message: "CHARGE amount validation failed",
          chargeRef,
          expectedAmount,
          requestedAmount,
          recomputedAmount,
          chargedAmount,
          packageId,
          corporateId,
        }, "VENDOR");
        console.error("[processWebhookEventById] CHARGE amount mismatch", corporateId, packageId, expectedAmount, chargedAmount);
        await markGatewayOrderFailedFromSubscriptionWebhook(data, { reason: "Invalid subscription amount" });
        throw new Error("Invalid subscription amount");
      }
      customLog(traceId, "info", { message: "CHARGE amount validated", chargeRef, expectedAmount, chargedAmount });
    } else if (!isAddons) {
      // Coupons are one-time discounts applied only on initial purchase (AUTH).
      // Never pass the original coupon on CHARGE (renewal) webhooks — the renewal
      // amount is the full recurring price and the coupon was already claimed.
      const couponForValidation = params.authPayment && couponCode && couponCode !== "0" ? couponCode : "";
      const quote = params.authPayment
        ? await resolveSubscriptionQuote(subscriptionId, traceId)
        : { quotedAt: null, creditCurrentGroupPlan: true };
      params.quotedAt = quote.quotedAt;
      params.creditCurrentGroupPlan = quote.creditCurrentGroupPlan;
      customLog(traceId, "info", {
        message: "Validating subscription amount against canonical pricing util",
        packageId,
        pgAmount: params.pgAmount,
        billingType,
        authPayment: params.authPayment,
        couponForValidation: couponForValidation || "(none)",
        quotedAt: quote.quotedAt,
        creditCurrentGroupPlan: quote.creditCurrentGroupPlan,
      });
      const isPriceValid = await validatePrice(
        billingType,
        params.pgAmount,
        package,
        couponForValidation,
        packageId,
        corporateId,
        params.authPayment,
        partnerId,
        traceId,
        { asOf: quote.quotedAt, creditCurrentGroupPlan: quote.creditCurrentGroupPlan }
      );
      if (!isPriceValid) {
        customLog(traceId, "error", {
          message: "Webhook subscription amount validation failed",
          packageId,
          corporateId,
          billingType,
          pgAmount: params.pgAmount,
          authPayment: params.authPayment,
          partnerId,
        }, "VENDOR");
        console.error("[processWebhookEventById] validatePrice rejected", corporateId, packageId, params.pgAmount);
        await markGatewayOrderFailedFromSubscriptionWebhook(data, { reason: "Invalid subscription amount" });
        throw new Error("Invalid subscription amount");
      }
      customLog(traceId, "info", { message: "Subscription amount validated", packageId, pgAmount: params.pgAmount });
    } else {
      customLog(traceId, "info", {
        message: "Validating addon amount",
        quantity,
        pgAmount: params.pgAmount,
        addonsAccessKey,
        partnerId,
      });
      const isAddonPriceValid = await validateAddOnPrice(
        Number(quantity),
        params.pgAmount,
        addonsAccessKey,
        partnerId,
        corporateId,
        traceId
      );
      if (!isAddonPriceValid) {
        customLog(traceId, "error", {
          message: "Webhook addon amount validation failed",
          packageId,
          corporateId,
          billingType,
          pgAmount: params.pgAmount,
          quantity,
          addonsAccessKey,
          partnerId,
        }, "VENDOR");
        console.error("[processWebhookEventById] validateAddOnPrice rejected", corporateId, addonsAccessKey, quantity, params.pgAmount);
        await markGatewayOrderFailedFromSubscriptionWebhook(data, { reason: "Invalid addon subscription amount" });
        throw new Error("Invalid addon subscription amount");
      }
      customLog(traceId, "info", { message: "Addon amount validated", quantity, pgAmount: params.pgAmount, addonsAccessKey });
    }
    let transactionResponse;
    let reportData = null;
    if (isAddons) {
      try {
        const addonServiceDetails = await findServiceOperatorByAccessKey(addonsAccessKey, Number(packageId));
        if (addonServiceDetails) {
          const addonCorporate = await findOneCorporate({ id: corporateId });
          const addonPartnerDetails = await fetchPartnerDetails(addonCorporate?.registeredBy)
          reportData = await computeJournalData({
            serviceDetails: addonServiceDetails,
            pgAmount: params.pgAmount,
            amount: params.pgAmount,
            paymentMethod: {},
            partnerDetails: addonPartnerDetails,
            paymentGatewayName: 'Cashfree',
            corporateState: addonCorporate?.state || '',
            isSubscription: true,
            billingType,
          });

          if (reportData) {
            publishJournalEvent(
              {
                transactionRef: corporateTxnId,
                type: 'payment',
                contextSnapshot: {
                  credentialId,
                  vendor: addonServiceDetails?.vendor || null,
                  registeredBy: partnerId || null,
                },
                reportData,
              },
              traceId
            );
          }
        }
      } catch (journalErr) {
        customLog(traceId, "error", { message: "Addon subscription: journal computation failed — continuing", error: journalErr?.message });
      }

      params = {
        ...params,
        quantity: quantity,
        addonsAccessKey: addonsAccessKey,
        traceId,
        reportData,
      };
      customLog(traceId, "info", { message: "Calling createSubscriptionForAddOns", quantity, addonsAccessKey, corporateId, packageId });
      transactionResponse = await createSubscriptionForAddOns(params);
      customLog(traceId, "info", {
        message: "createSubscriptionForAddOns returned",
        success: !transactionResponse?.error,
        errorMessage: transactionResponse?.error ? transactionResponse?.message : undefined,
        newSubscriptionId: transactionResponse?.subscription?.id,
        corporateId,
      });
    } else {
      try {
        const subServiceDetails = await findServiceOperatorByAccessKey(operatorsData["subscriptionPlans"]["accessKey"]);
        if (subServiceDetails) {
          const subCorporate = await findOneCorporate({ id: corporateId });
          const subPartnerDetails = await fetchPartnerDetails(subCorporate?.registeredBy)
          const planDiscount = getPackagePlanDiscount(package, billingType);
          reportData = await computeJournalData({
            serviceDetails: subServiceDetails,
            pgAmount: params.pgAmount,
            amount: params.pgAmount + planDiscount,
            paymentMethod: {},
            partnerDetails: subPartnerDetails,
            paymentGatewayName: 'Cashfree',
            couponTotalDiscount: (payment_type === "AUTH" ? couponTotalDiscount || 0 : 0) + planDiscount,
            corporateState: subCorporate?.state || '',
            isSubscription: true,
            billingType,
          });
          params = { ...params, reportData };

          if (reportData) {
            publishJournalEvent(
              {
                transactionRef: corporateTxnId,
                type: 'payment',
                contextSnapshot: {
                  credentialId,
                  vendor: subServiceDetails?.vendor || null,
                  registeredBy: partnerId || null,
                },
                reportData,
              },
              traceId
            );
          }
        }
      } catch (journalErr) {
        customLog(traceId, "error", { message: "Peko+ subscription: journal computation failed — continuing", error: journalErr?.message });
      }
      customLog(traceId, "info", { message: "Calling createSubscription", corporateId, packageId, packageName: package?.packageName, billingType, pgAmount: params.pgAmount, authPayment: params.authPayment });
      transactionResponse = await createSubscription(params, traceId);
      customLog(traceId, "info", {
        message: "createSubscription returned",
        success: !transactionResponse?.error,
        errorMessage: transactionResponse?.error ? transactionResponse?.message : undefined,
        errorData: transactionResponse?.error ? transactionResponse?.data : undefined,
        newSubscriptionId: transactionResponse?.subscription?.id,
        previousPackageName: transactionResponse?.currentSubscription?.package?.packageName,
        corporateId,
      });
    }

    // Hard-fail explicit log: if createSubscription returned an error object, surface it
    // here BEFORE any of the downstream side-effects so the actual cause is the top log,
    // not whatever throws three steps later.
    if (transactionResponse?.error) {
      customLog(traceId, "error", {
        message: "createSubscription returned error — webhook will be marked FAILED",
        isAddons,
        corporateId,
        packageId,
        packageName: package?.packageName,
        billingType,
        pgAmount: params?.pgAmount,
        transactionResponseError: transactionResponse?.message,
        transactionResponseData: transactionResponse?.data,
      }, "VENDOR");
      console.error("[processWebhookEventById] createSubscription error", JSON.stringify({
        corporateId, packageId, packageName: package?.packageName,
        pgAmount: params?.pgAmount, error: transactionResponse?.message,
        data: transactionResponse?.data,
      }));
    }

    if (!isAddons && mainSubId) {
      customLog(traceId, "info", {
        message: "Updating vendorSubscriptionId on main subscription",
        mainSubId,
        newVendorSubscriptionId: data.data.subscription_id,
      });
      await updateVendorSubscriptionId(mainSubId, data.data.subscription_id);
    }

    // Cancel the previous main mandate ONLY after the new one is confirmed in the webhook
    // payload and createSubscription succeeded. Guarded against cancelling the just-created
    // mandate (vendorSubscriptionId mismatch check) and against firing on CHARGE renewals.
    // Also skipped when any other ACTIVE subscription still references the same
    // vendorSubscriptionId — cancelling the mandate would kill those other plans' future charges.
    if (
      !isAddons &&
      payment_type === "AUTH" &&
      package.packageType === "GROUP" &&
      !transactionResponse?.error &&
      data?.data?.subscription_id &&
      mainSubscription?.vendorSubscriptionId &&
      mainSubscription.vendorSubscriptionId !== data.data.subscription_id
    ) {
      const otherActiveCount = await countActiveSubscriptionsByVendorId(
        mainSubscription.vendorSubscriptionId,
      );
      if (otherActiveCount > 0) {
        customLog(traceId, "info", {
          message: "Skipping Cashfree mandate cancel — vendorSubscriptionId still in use by other ACTIVE subscriptions",
          oldVendorSubscriptionId: mainSubscription.vendorSubscriptionId,
          otherActiveCount,
          corporateId,
        });
      } else {
        customLog(traceId, "info", {
          message: "Cancelling previous main Cashfree mandate (new mandate confirmed)",
          oldVendorSubscriptionId: mainSubscription.vendorSubscriptionId,
          newVendorSubscriptionId: data.data.subscription_id,
          corporateId,
        });
        await cancelCashfreeSubscription(serviceDetails, mainSubscription.vendorSubscriptionId, traceId);
      }
    }

    // On a CHARGE renewal, renew all active addon subscriptions for this corporate.
    // The charge amount already includes addon costs (see calculatePlanAmount).
    if (!isAddons && payment_type === "CHARGE" && !transactionResponse?.error) {
      customLog(traceId, "info", { message: "CHARGE renewal: fetching recurring addons to renew", corporateId });
      // Use the renewal-specific enumeration: includes recurring addons that EXPIRED before this webhook
      // ran (retried/delayed charges), keyed by serviceOperator.isDynamicUnitPricing — findAllAddonSubscription
      // returns ACTIVE only and would silently skip them.
      const activeAddons = await findRecurringAddonsToRenew(corporateId);
      customLog(traceId, "info", {
        message: "CHARGE renewal: active addons fetched",
        corporateId,
        addonCount: activeAddons?.length ?? 0,
        addonPackageIds: activeAddons?.map((a) => a.packageId),
      });
      if (activeAddons && activeAddons.length > 0) {
        try {
          await renewAddonSubscriptions(
            activeAddons,
            params.providerId,
            params.corporateTxnId,
            transactionResponse?.subscription?.subscriptionEndDate ?? null,
            transactionResponse?.subscription?.billingType ?? null,
          );
          customLog(traceId, "info", {
            message: "CHARGE renewal: addon subscriptions renewed",
            corporateId,
            addonCount: activeAddons.length,
          });
        } catch (renewErr) {
          customLog(traceId, "error", {
            message: "CHARGE renewal: renewAddonSubscriptions threw — main plan already renewed",
            corporateId,
            addonCount: activeAddons.length,
            errorMessage: renewErr?.message ?? String(renewErr),
            errorStack: renewErr?.stack,
          }, "VENDOR");
          console.error("[processWebhookEventById] renewAddonSubscriptions failed", corporateId, renewErr?.message);
          // Re-throw — addon renewal failure on CHARGE is a real problem (user expects their
          // addons to keep working). Webhook gets marked FAILED so admin can retry.
          throw renewErr;
        }
      }
    }

    // Peko+ bundle: free WhatsApp BASIC follows the Peko+ lifecycle.
    // AUTH  → create a fresh bundled WA row (skipped if user already has any active WA sub).
    // CHARGE → roll the existing bundled WA row forward to match the new Peko+ cycle.
    // Failures here are non-fatal: the Peko+ subscription is already committed; a missing
    // bundle can be backfilled. Wrapped in try/catch so it never breaks the webhook.
    // if (!isAddons && transactionResponse?.packageDetails?.packageName === "Peko+" && !transactionResponse?.error) {
    //   try {
    //     if (payment_type === "AUTH") {
    //       // TEMP: Peko+ → WhatsApp Basic bundling disabled. New Peko+ purchases no longer get a free
    //       // bundled WhatsApp BASIC row. Existing bundles are untouched and still renew via the CHARGE
    //       // branch below (renewBundledWhatsAppBasic no-ops when there's no existing bundle). To re-enable,
    //       // uncomment the bundleWhatsAppBasicForPekoPlus call.
    //       await bundleWhatsAppBasicForPekoPlus({
    //         corporateUserId: corporateId,
    //         credentialId,
    //         partnerId,
    //         subscriptionStartDate: transactionResponse.subscription?.subscriptionStartDate,
    //         subscriptionEndDate: transactionResponse.subscription?.subscriptionEndDate,
    //         billingType,
    //         corporateTxnId,
    //         vendorSubscriptionId: data.data.subscription_id,
    //       });
    //     } else if (payment_type === "CHARGE") {
    //       await renewBundledWhatsAppBasic({
    //         corporateUserId: corporateId,
    //         oldEndDate: mainSubscription?.subscriptionEndDate,
    //         billingType,
    //         corporateTxnId,
    //         vendorSubscriptionId: data.data.subscription_id,
    //       });
    //     }
    //   } catch (bundleErr) {
    //     customLog(traceId, "error", {
    //       message: "Peko+ WhatsApp bundle step failed (non-fatal — Peko+ already committed)",
    //       corporateId,
    //       payment_type,
    //       error: bundleErr?.message ?? bundleErr,
    //     });
    //   }
    // }
    let partnerDetails;

    customLog(traceId, "info", { message: "Fetching corporate user for notification", corporateId });
    const result = await findOneCorporate({id: corporateId});
    if (!result) {
      const msg = `findOneCorporate returned null/undefined for corporateId=${corporateId}`;
      customLog(traceId, "error", { message: msg, corporateId }, "VENDOR");
      console.error("[processWebhookEventById]", msg);
      await markGatewayOrderFailedFromSubscriptionWebhook(data, { reason: msg });
      throw new Error(msg);
    }
    const {credential, registeredBy, name:companyName} = result;
    const username = credential?.username;
    const emailId = credential?.email;

    if (!username || !emailId) {
      const errPayload = {
        message: "Missing username or emailId for subscription notification",
        corporateId,
        username,
        emailId,
        hasCredential: !!credential,
        credentialKeys: credential ? Object.keys(credential) : null,
      };
      customLog(traceId, "error", errPayload, "VENDOR");
      console.error("[processWebhookEventById] missing user details", JSON.stringify(errPayload));
      await markGatewayOrderFailedFromSubscriptionWebhook(data, { reason: "Missing user details for notification" });
      throw new Error("Missing user details for notification");
    }

    partnerDetails = await fetchPartnerDetails(registeredBy);

    if (!transactionResponse || transactionResponse.error) {
      await markGatewayOrderFailedFromSubscriptionWebhook(data, {
        message: transactionResponse?.message ?? "Subscription creation failed",
      });
      const notificationData = {
        notificationTitle: "Upgrade Failed",
        notificationBrief: package?.packageName
          ? `We regret to inform you that the ${package.packageName} plan upgrade failed. Please try again.`
          : "We regret to inform you that the plan upgrade failed. Please try again.",
        notificationTo: [username],
        notificationCategory: "CORPORATE",
        notificationBy: "ADMIN",
        accessKey: null,
        action: "2",
      };
      await createNotification(notificationData);
      throw new Error(transactionResponse?.message ?? "Subscription creation failed");
    } else {
      const { subscription, packageDetails } = transactionResponse;
      const to = emailId;

      // Distinguish initial purchase (AUTH) from monthly/annual renewal (CHARGE)
      const isRenewal = payment_type === "CHARGE";

      const subject = isRenewal
        ? `${packageDetails.packageName} Subscription Renewal Confirmation`
        : `${packageDetails.packageName} Subscription Purchase Confirmation`;

      let notificationData;
      let body;
      if (packageDetails.packageType === "INDIVIDUAL") {
        notificationData = {
          notificationTitle: isRenewal ? "Renewal Successful" : "Purchase Successful",
          notificationBrief: isRenewal
            ? `Your ${packageDetails.packageName} subscription has been renewed. Payment of ₹ ${formatNumberWithLocalString(params?.pgAmount)} processed successfully. Your service continues uninterrupted.`
            : `We are pleased to inform you that your ${packageDetails.packageName} subscription purchase has been successful with the payment of ₹ ${formatNumberWithLocalString(params?.pgAmount)}. Your service is now active.`,
          notificationTo: [username],
          notificationCategory: "CORPORATE",
          notificationBy: "ADMIN",
          accessKey: null,
          action: "2",
        };
        body = subscriptionIndividualSuccessEmail(companyName, corporateTxnId, subscription, packageDetails, partnerDetails);
      } else {
        body = subscriptionPekoPlusSuccessEmail(companyName, corporateTxnId, subscription, partnerDetails, packageDetails.packageName);

        let notificationBrief;
        const isMandateSetup = params?.authPayment === true && params?.pgAmount === 0;
        if (isRenewal) {
          notificationBrief = `Your ${packageDetails.packageName} subscription has been renewed. Payment of ₹ ${formatNumberWithLocalString(params?.pgAmount)} processed successfully. Your service continues uninterrupted.`;
        } else if (isMandateSetup) {
          notificationBrief = `Your on-demand subscription for ${packageDetails.packageName} has been set up successfully. Future charges will be processed automatically based on your usage.`;
        } else {
          const { currentSubscription } = transactionResponse;

          if (currentSubscription?.package?.packageName === packageDetails.packageName && currentSubscription?.id) {
            const fullCurrentSubscription = await findSubscriptionById(currentSubscription.id);
            const oldBillingType = fullCurrentSubscription?.billingType;
            const oldPeriod = oldBillingType === "MONTHLY" ? "Monthly" : oldBillingType === "ANNUALLY" ? "Yearly" : "";
            const newPeriod = params?.billingType === "MONTHLY" ? "Monthly" : params?.billingType === "ANNUALLY" ? "Yearly" : "";

            if (oldPeriod && newPeriod && oldBillingType !== params?.billingType) {
              notificationBrief = `Thank you for upgrading your ${packageDetails.packageName} plan from ${oldPeriod} to ${newPeriod}. Your payment of ₹ ${formatNumberWithLocalString(
                params?.pgAmount
              )} has been successfully processed, and your new plan features are now active.`;
            } else {
              notificationBrief = `Thank you for upgrading your ${packageDetails.packageName} plan. Your payment of ₹ ${formatNumberWithLocalString(
                params?.pgAmount
              )} has been successfully processed, and your new plan features are now active.`;
            }
          } else {
            notificationBrief = `Thank you for upgrading your plan from ${currentSubscription?.package?.packageName} to ${
              packageDetails.packageName
            }. Your payment of ₹ ${formatNumberWithLocalString(
              params?.pgAmount
            )} has been successfully processed, and your new plan features are now active.`;
          }
        }

        notificationData = {
          notificationTitle: isMandateSetup ? "On-Demand Subscription Activated" : isRenewal ? "Renewal Successful" : "Purchase Successful",
          notificationBrief: notificationBrief,
          notificationTo: [username],
          notificationCategory: "CORPORATE",
          notificationBy: "ADMIN",
          accessKey: null,
          action: "2",
        };
      }
      // Receipt + email + notification are side-effects of the AUTH success. The subscription
      // row is already committed by createSubscription; if any of these blow up, log loudly
      // but DO NOT throw — that would mark the webhook FAILED and trigger Cashfree retries,
      // which would then double-create downstream artifacts. Mark the order complete either way.
      //
      // The Pusher push fired by createNotification is what tells the frontend's
      // SubscriptionPendingPage that the subscription is active. Run it in its own try/catch
      // BEFORE the receipt/email so a PDF generation or SMTP failure can never suppress it.
      try {
        await createNotification(notificationData);
        customLog(traceId, "info", { message: "Notification created", corporateId, notificationTitle: notificationData?.notificationTitle });
      } catch (notifyErr) {
        customLog(traceId, "error", {
          message: "Failed to create subscription notification — subscription row already committed",
          corporateId,
          packageName: packageDetails?.packageName,
          errorMessage: notifyErr?.message ?? String(notifyErr),
          errorStack: notifyErr?.stack,
        }, "VENDOR");
        console.error("[processWebhookEventById] notification failed", notifyErr?.message, notifyErr?.stack);
      }
      try {
        customLog(traceId, "info", { message: "Before creating subscription reciept", corporateTxnId, companyName, paidAmount: params.pgAmount });
        // No document for a 0-amount mandate setup (AUTH with no charge) — nothing was paid.
        const subscriptionCouponDiscount = Number(transactionResponse?.couponDiscount) || 0;
        const attachments = parseFloat(params?.pgAmount) > 0
          ? await generateSubscriptionInvoiceAttachments({
              amount: Number(params?.pgAmount || 0) + subscriptionCouponDiscount,
              couponDiscount: subscriptionCouponDiscount,
              corporateTxnId,
              orderId: transactionResponse?.orderId,
              paymentType: "Subscription",
              description: `${packageDetails?.packageName || "Subscription"}${params?.billingType === 'MONTHLY' ? ' (Monthly)' : params?.billingType === 'ANNUALLY' ? ' (Annually)' : ''}`,
              credentialId: params?.credentialId ?? credential?.id,
              pgAmount: params?.pgAmount,
              // authorization_details carries both the method string and the instrument
              // (UPI VPA / masked card), so the receipt can read "UPI - abc@ybl".
              paymentMethod: params?.paymentGatewayResponse?.data?.authorization_details || params?.paymentGatewayResponse?.data?.payment_method,
              traceId,
            })
          : [];
        customLog(traceId, "info", { message: "Before sending subscription Email", to, username, attachments: attachments.map((a) => a?.filename) });
        emailer.emailWithMultipleAttachment(to, subject, body, attachments, undefined, function (err) {
          if (err) {
            customLog(traceId, "error", { message: "Failed to send subscription Email", to, username, error: err?.message ?? err }, "VENDOR");
            console.error("[processWebhookEventById] email send failed", to, err?.message);
          } else {
            customLog(traceId, "info", { message: "Subscription Email sent to ", to, username });
          }
        });
      } catch (sideEffectErr) {
        customLog(traceId, "error", {
          message: "Subscription receipt/email side-effect failed — subscription row already committed, notification already fired",
          corporateId,
          packageName: packageDetails?.packageName,
          errorMessage: sideEffectErr?.message ?? String(sideEffectErr),
          errorStack: sideEffectErr?.stack,
        }, "VENDOR");
        console.error("[processWebhookEventById] side-effect failed", sideEffectErr?.message, sideEffectErr?.stack);
      }
      await markGatewayOrderCompleteFromSubscriptionWebhook(data, webhookEventRecord.id);
      customLog(traceId, "info", { message: "AUTH success: gatewayOrder marked complete", corporateId, packageName: packageDetails?.packageName });
    }
  } else if (event === "SUBSCRIPTION_PAYMENT_FAILED") {
    const subscriptionId = data?.data?.subscription_id ?? data?.data?.subscription_details?.subscription_id;
    // Extract structured failure details from the Cashfree payload
    const failureCode = data?.data?.error_details?.error_code
      ?? data?.data?.payment?.payment_gateway_details?.bank_reference
      ?? null;
    const failureMessage = data?.data?.error_details?.error_description
      ?? data?.data?.payment?.payment_message
      ?? data?.data?.failure_details?.failure_reason
      ?? null;
    const terminalMandateFailure = isTerminalMandateFailure(failureMessage);
    let failureReason = failureMessage ?? data.data?.failureDetails?.failureReason ?? "a payment issue";
    if (!failureReason || failureReason === "Error") failureReason = "a payment issue";

    customLog(traceId, "error", {
      message: "SUBSCRIPTION_PAYMENT_FAILED received from Cashfree",
      subscriptionId,
      payment_type: data.data?.payment_type,
      failureCode,
      failureReason,
    }, "VENDOR");

    await markGatewayOrderFailedFromSubscriptionWebhook(data, {
      failureCode,
      failureMessage: failureReason,
      event: "SUBSCRIPTION_PAYMENT_FAILED",
    });

    const failedPaymentType = data.data.payment_type;
    const activeSubscriptions = await findAllSubscription({ vendorSubscriptionId: subscriptionId, status: 'ACTIVE' });
    if (!Array.isArray(activeSubscriptions)) {
      customLog(traceId, "info", {
        message: "SUBSCRIPTION_PAYMENT_FAILED: no active subscriptions matched vendorSubscriptionId — nothing to do",
        vendorSubscriptionId: subscriptionId,
      });
      return;
    }
    customLog(traceId, "info", {
      message: "SUBSCRIPTION_PAYMENT_FAILED: applying failure side-effects",
      vendorSubscriptionId: subscriptionId,
      activeSubscriptionCount: activeSubscriptions.length,
      failedPaymentType,
    });
    for (const subscription of activeSubscriptions) {
      const { id, corporateUserId, packageId, package: pkg, isCustom, subscriptionEndDate } = subscription;
      const { packageType, packageName } = pkg;
      const corporateDetails = await findOneCorporate({ id: corporateUserId }, ["email", "name"], ["username"]);
      const endDateFormated = moment(subscriptionEndDate).format("MMMM D, YYYY");
      const to = corporateDetails.email;
      if (failedPaymentType === "CHARGE") {
        customLog(traceId, "error", {
          message: "Subscription renewal charge failed",
          subscriptionId: id,
          corporateUserId,
          packageName,
          failureCode,
          failureReason,
          terminalMandateFailure,
        });
        if (terminalMandateFailure) {
          await updateSubscription({ isCancelled: true, isGracePeriod: false }, id);
          const subject = `Your ${packageName} subscription could not be renewed`;
          const body = emailTemplates.generateRenewalFailedMail({
            serviceName: packageName,
            corporateName: corporateDetails.name,
            endDate: endDateFormated,
          });
          emailer.email({ to, subject, body });
          const notificationData = {
            notificationTitle: subject,
            notificationBrief: `We couldn't renew your ${packageName} subscription because the payment mandate is no longer active. You can keep using it until ${endDateFormated}, after which it will end. Please re-subscribe to continue.`,
            notificationTo: [corporateDetails.credential.username],
            notificationCategory: "CORPORATE",
            notificationBy: "ADMIN",
          };
          await createNotification(notificationData);
        } else {
          await updateSubscription({ isGracePeriod: true }, id);
          const subject = `Your ${packageName} subscription renewal could not be processed`;
          const body = emailTemplates.generateRenewalFailedMail({
            serviceName: packageName,
            corporateName: corporateDetails.name,
            endDate: endDateFormated,
          });
          emailer.email({ to, subject, body });
          const notificationData = {
            notificationTitle: subject,
            notificationBrief: `We were unable to renew your ${packageName} subscription. Please ensure your account has sufficient balance. You can continue to use the service until ${endDateFormated}.`,
            notificationTo: [corporateDetails.credential.username],
            notificationCategory: "CORPORATE",
            notificationBy: "ADMIN",
          };
          await createNotification(notificationData);
        }
      } else {
        // AUTH failure on initial purchase — cancel the subscription
        await cancelUserSubscription({
          subscriptionId: id,
          corporateId: corporateUserId,
          packageType,
          packageId,
          isCustom,
        });
        const subject = `Your ${packageName} subscription could not be activated`;
        const body = emailTemplates.generateCancellationMail({
          serviceName: packageName,
          corporateName: corporateDetails.name,
          cancelledDate: moment().format("DD-MM-YYYY"),
          endDate: endDateFormated,
          failureReason: undefined,
        });
        emailer.email({ to, subject, body });
        const notificationData = {
          notificationTitle: subject,
          notificationBrief: `Your ${packageName} subscription could not be activated. Please ensure your account has sufficient balance and try again.`,
          notificationTo: [corporateDetails.credential.username],
          notificationCategory: "CORPORATE",
          notificationBy: "ADMIN",
        };
        await createNotification(notificationData);
      }
    }

    // WhatsApp subscription rows live in a separate table; the lookup above only covers `subscriptions`.
    // On a CHARGE failure, mark the matching WhatsApp rows in grace so subscriptionGracePeriodRetry
    // picks them up the next day. On AUTH failure no WhatsApp row exists yet (only created on AUTH success).
    if (failedPaymentType === "CHARGE") {
      try {
        const waSubs = await findActiveWhatsAppSubsWithUserByVendor(subscriptionId);
        if (waSubs.length) {
          const touched = await markWhatsAppSubscriptionsGrace(subscriptionId);
          customLog(traceId, "info", {
            message: "SUBSCRIPTION_PAYMENT_FAILED: marked WhatsApp subscription(s) in grace",
            vendorSubscriptionId: subscriptionId,
            matchedSubscriptions: waSubs.length,
            rowsTouched: touched,
          }, "VENDOR");
          for (const waSub of waSubs) {
            const packageName = waSub?.package?.packageName || "WhatsApp";
            const corpName = waSub?.corporateUser?.name || "Customer";
            const username = waSub?.credential?.username;
            const to = waSub?.corporateUser?.email || waSub?.credential?.email;
            const endDateFormated = moment(waSub?.subscriptionEndDate).format("MMMM D, YYYY");

            if (to) {
              const subject = `Your ${packageName} subscription renewal could not be processed`;
              const body = emailTemplates.generateRenewalFailedMail({
                serviceName: packageName,
                corporateName: corpName,
                endDate: endDateFormated,
              });
              emailer.email({ to, subject, body });
            }
            if (username) {
              await createNotification({
                notificationTitle: `Your ${packageName} subscription renewal could not be processed`,
                notificationBrief: `We were unable to renew your ${packageName} subscription. Please ensure your account has sufficient balance. You can continue to use the service until ${endDateFormated}.`,
                notificationTo: [username],
                notificationCategory: "CORPORATE",
                notificationBy: "ADMIN",
              });
            }
          }
        }
      } catch (waErr) {
        customLog(traceId, "error", {
          message: "Failed to mark WhatsApp subscription(s) in grace on SUBSCRIPTION_PAYMENT_FAILED",
          vendorSubscriptionId: subscriptionId,
          error: waErr?.message ?? waErr,
        }, "VENDOR");
      }
    }
  } else if (event === "SUBSCRIPTION_STATUS_CHANGE") {
    const newStatus = data?.data?.subscription_details?.subscription_status;
    const subscriptionId = data.data.subscription_details.subscription_id;
    customLog(traceId, "info", {
      message: "SUBSCRIPTION_STATUS_CHANGE received",
      vendorSubscriptionId: subscriptionId,
      newStatus,
    }, "VENDOR");
    if (
      newStatus !== "CUSTOMER CANCELLED" &&
      newStatus !== "CUSTOMER PAUSED" &&
      newStatus !== "EXPIRED" &&
      newStatus !== "LINK EXPIRED"
    ) {
      customLog(traceId, "info", { message: "SUBSCRIPTION_STATUS_CHANGE: still active, ignoring", status: newStatus, vendorSubscriptionId: subscriptionId });
      return;
    }
    const activeSubscriptions = await findAllSubscription({ vendorSubscriptionId: subscriptionId, status: 'ACTIVE' });
    if (!Array.isArray(activeSubscriptions)) {
      customLog(traceId, "info", {
        message: "SUBSCRIPTION_STATUS_CHANGE: no active subscriptions matched vendorSubscriptionId — nothing to cancel",
        vendorSubscriptionId: subscriptionId,
        newStatus,
      });
      return;
    }
    customLog(traceId, "info", {
      message: "SUBSCRIPTION_STATUS_CHANGE: cancelling subscriptions matching vendorSubscriptionId",
      vendorSubscriptionId: subscriptionId,
      activeSubscriptionCount: activeSubscriptions.length,
      newStatus,
    });
    for (const subscription of activeSubscriptions) {
      const { id, corporateUserId, packageId, package: pkg, isCustom, subscriptionEndDate, isCancelled } = subscription;
      if (isCancelled) {
        customLog(traceId, "info", { message: "subscription already cancelled — skipping", subscriptionId: id, vendorSubscriptionId: subscriptionId });
        continue;
      }
      const { packageType, packageName } = pkg;
      const corporateDetails = await findOneCorporate({ id: corporateUserId }, ["email", "name"], ["username"]);
      const result = await cancelUserSubscription({
        subscriptionId: id,
        corporateId: corporateUserId,
        packageType: packageType,
        packageId,
        isCustom,
      });
      if (result.success) {
        const to = corporateDetails.email;
        const subject = `Your ${packageName} Subscription Has Been Cancelled`;
        const endDateFormated = moment(subscriptionEndDate).format("MMMM D, YYYY");
        const body = emailTemplates.generateCancellationMail({
          serviceName: packageName,
          corporateName: corporateDetails.name,
          cancelledDate: moment().format("DD-MM-YYYY"),
          endDate: endDateFormated,
        });
        emailer.email({to, subject, body});
        const notificationData = {
          notificationTitle: subject,
          notificationBrief: `Your ${packageName} subscription has been successfully cancelled. You can continue to use it until ${endDateFormated}. You can re-subscribe anytime via Peko.`,
          notificationTo: [corporateDetails.credential.username],
          notificationCategory: "CORPORATE",
          notificationBy: "ADMIN",
        };
        await createNotification(notificationData);
      }
    }
    // WhatsApp mandates live in a separate table; the Peko loop above only covers `subscriptions`.
    // Mark matching WhatsApp rows cancelled, then stop AiSensy project billing for them (best-effort) so
    // Peko isn't billed for a project the customer no longer pays for. Non-throwing so a side-effect
    // failure never re-queues the webhook.
    try {
      const waSubs = await findActiveWhatsAppSubsWithUserByVendor(subscriptionId);
      if (waSubs.length) {
        await cancelWhatsAppSubscriptionsByVendor(subscriptionId);
        await stopWhatsAppProjectBillingForVendorRows(waSubs, traceId);
        customLog(traceId, "info", {
          message: "SUBSCRIPTION_STATUS_CHANGE: cancelled WhatsApp subscription(s)",
          vendorSubscriptionId: subscriptionId,
          matchedSubscriptions: waSubs.length,
          newStatus,
        }, "VENDOR");
        for (const waSub of waSubs) {
          const packageName = waSub?.package?.packageName || "WhatsApp";
          const corpName = waSub?.corporateUser?.name || "Customer";
          const username = waSub?.credential?.username;
          const to = waSub?.corporateUser?.email || waSub?.credential?.email;
          if (to) {
            const subject = `Your ${packageName} Subscription Has Been Cancelled`;
            const body = emailTemplates.generateCancellationMail({
              serviceName: packageName,
              corporateName: corpName,
              cancelledDate: moment().format("DD-MM-YYYY"),
              endDate: moment(waSub?.subscriptionEndDate).format("MMMM D, YYYY"),
            });
            emailer.email({ to, subject, body });
          }
          if (username) {
            await createNotification({
              notificationTitle: `Your ${packageName} Subscription Has Been Cancelled`,
              notificationBrief: `Your ${packageName} subscription has been cancelled. You can re-subscribe anytime via Peko.`,
              notificationTo: [username],
              notificationCategory: "CORPORATE",
              notificationBy: "ADMIN",
            });
          }
        }
      }
    } catch (waErr) {
      customLog(traceId, "error", {
        message: "Failed to cancel WhatsApp subscription(s) on SUBSCRIPTION_STATUS_CHANGE",
        vendorSubscriptionId: subscriptionId,
        error: waErr?.message ?? waErr,
      }, "VENDOR");
    }
  } else if (event === "SUBSCRIPTION_PAYMENT_CANCELLED") {
    const subscriptionId = data.data.subscription_details.subscription_id;
    customLog(traceId, "info", {
      message: "SUBSCRIPTION_PAYMENT_CANCELLED received",
      vendorSubscriptionId: subscriptionId,
    }, "VENDOR");
    const activeSubscriptions = await findAllSubscription({ vendorSubscriptionId: subscriptionId, status: 'ACTIVE' });
    if (!Array.isArray(activeSubscriptions)) {
      customLog(traceId, "info", {
        message: "SUBSCRIPTION_PAYMENT_CANCELLED: no active subscriptions matched vendorSubscriptionId",
        vendorSubscriptionId: subscriptionId,
      });
      return;
    }
    customLog(traceId, "info", {
      message: "SUBSCRIPTION_PAYMENT_CANCELLED: cancelling subscriptions matching vendorSubscriptionId",
      vendorSubscriptionId: subscriptionId,
      activeSubscriptionCount: activeSubscriptions.length,
    });
    for (const subscription of activeSubscriptions) {
      const { id, corporateUserId, packageId, package: pkg, isCustom, subscriptionEndDate, isCancelled } = subscription;
      if (isCancelled) {
        customLog(traceId, "info", { message: "subscription already cancelled — skipping", subscriptionId: id, vendorSubscriptionId: subscriptionId });
        continue;
      }
      const { packageType, packageName } = pkg;
      const corporateDetails = await findOneCorporate({ id: corporateUserId }, ["email", "name"], ["username"]);
      const result = await cancelUserSubscription({
        subscriptionId: id,
        corporateId: corporateUserId,
        packageType: packageType,
        packageId,
        isCustom,
      });
      if (result.success) {
        const to = corporateDetails.email;
        const subject = `Your ${packageName} Subscription Has Been Cancelled`;
        const endDateFormated = moment(subscriptionEndDate).format("MMMM D, YYYY");
        const body = emailTemplates.generateCancellationMail({
          serviceName: packageName,
          corporateName: corporateDetails.name,
          cancelledDate: moment().format("DD-MM-YYYY"),
          endDate: endDateFormated,
        });
        emailer.email({to, subject, body});
        const notificationData = {
          notificationTitle: subject,
          notificationBrief: `Your ${packageName} subscription has been successfully cancelled. You can continue to use it until ${endDateFormated}. You can re-subscribe anytime via Peko.`,
          notificationTo: [corporateDetails.credential.username],
          notificationCategory: "CORPORATE",
          notificationBy: "ADMIN",
        };
        await createNotification(notificationData);
      }
    }
    // WhatsApp mandates live in a separate table; mark matching WhatsApp rows cancelled (the Peko loop
    // above only covers `subscriptions`), then stop AiSensy project billing for them (best-effort) so Peko
    // isn't billed for a project the customer no longer pays for. Non-throwing so a side-effect failure
    // never re-queues the webhook.
    try {
      const waSubs = await findActiveWhatsAppSubsWithUserByVendor(subscriptionId);
      if (waSubs.length) {
        await cancelWhatsAppSubscriptionsByVendor(subscriptionId);
        await stopWhatsAppProjectBillingForVendorRows(waSubs, traceId);
        customLog(traceId, "info", {
          message: "SUBSCRIPTION_PAYMENT_CANCELLED: cancelled WhatsApp subscription(s)",
          vendorSubscriptionId: subscriptionId,
          matchedSubscriptions: waSubs.length,
        }, "VENDOR");
        for (const waSub of waSubs) {
          const packageName = waSub?.package?.packageName || "WhatsApp";
          const corpName = waSub?.corporateUser?.name || "Customer";
          const username = waSub?.credential?.username;
          const to = waSub?.corporateUser?.email || waSub?.credential?.email;
          if (to) {
            const subject = `Your ${packageName} Subscription Has Been Cancelled`;
            const body = emailTemplates.generateCancellationMail({
              serviceName: packageName,
              corporateName: corpName,
              cancelledDate: moment().format("DD-MM-YYYY"),
              endDate: moment(waSub?.subscriptionEndDate).format("MMMM D, YYYY"),
            });
            emailer.email({ to, subject, body });
          }
          if (username) {
            await createNotification({
              notificationTitle: `Your ${packageName} Subscription Has Been Cancelled`,
              notificationBrief: `Your ${packageName} subscription has been cancelled. You can re-subscribe anytime via Peko.`,
              notificationTo: [username],
              notificationCategory: "CORPORATE",
              notificationBy: "ADMIN",
            });
          }
        }
      }
    } catch (waErr) {
      customLog(traceId, "error", {
        message: "Failed to cancel WhatsApp subscription(s) on SUBSCRIPTION_PAYMENT_CANCELLED",
        vendorSubscriptionId: subscriptionId,
        error: waErr?.message ?? waErr,
      }, "VENDOR");
    }
  } else {
    customLog(traceId, "info", {
      message: "Unhandled webhook event type — no handler matched, ignoring",
      eventType: event,
      webhookEventId: webhookEventRecord?.id,
      payloadType: typeof data?.data,
    });
  }
};

// Exported webhook endpoint for Cashfree to call.
// IMPORTANT: the response is sent only AFTER processing
// Every event is persisted to webhookEvents BEFORE processing so no event is ever lost.
// If processing fails, the record stays in FAILED status and admin can retry via admin API.
exports.handlePGWebhookCashfree = asyncHandler(async (req, res) => {
  const data = req.body;
  const traceId = req?.LogTraceId;
  customLog(traceId, "info", { message: "Webhooknew received from Cashfree for subscription", eventType: data?.type }, "VENDOR");

  if (data?.data?.test_object?.test_key) {
    // test ping, nothing to process
    return res.status(200).json({ status: true, message: "Webhook received successfully" });
  }

  // Step 2: build a stable idempotency key and store the raw event (with ordering + correlation)
  const idempotencyKey = buildWebhookIdempotencyKey(data);
  const vendorSubscriptionId = extractVendorSubscriptionIdFromWebhook(data);
  const merchantPaymentId = extractMerchantPaymentIdFromWebhook(data);
  const WEBHOOK_SOURCE_PEKO_SUBSCRIPTIONS = "peko_subscriptions";
  const eventSequence = await getNextWebhookEventSequence(vendorSubscriptionId, WEBHOOK_SOURCE_PEKO_SUBSCRIPTIONS);
  const webhookContext = deriveWebhookContextFromSubscriptionPayload(data);
  customLog(traceId, "info", { message: `[CASHFREE_WEBHOOK] ${webhookContext} received — eventType: ${data?.type}`, eventType: data?.type, webhookContext, webhookPayload: data }, "VENDOR");

  const [webhookEvent, created] = await findOrCreateWebhookEvent({
    idempotencyKey,
    eventType: data.type,
    payload: data,
    vendorSubscriptionId,
    merchantPaymentId,
    eventSequence,
    webhookContext,
    webhookSource: WEBHOOK_SOURCE_PEKO_SUBSCRIPTIONS,
  });


  if (!created) {
    if (webhookEvent.status === "PROCESSED" || webhookEvent.status === "PENDING") {
      customLog(traceId, "info", {
        message: "Duplicate webhook received, skipping",
        idempotencyKey,
        eventType: data.type,
        existingStatus: webhookEvent.status,
      });
      // 200 so Cashfree stops retrying an event that is already done or in flight.
      return res.status(200).json({ status: true, message: "Duplicate webhook — already handled or in progress" });
    }
    // status === 'FAILED' — fall through and reprocess below.
    customLog(traceId, "info", {
      message: "Retrying previously-failed webhook on redelivery",
      idempotencyKey,
      eventType: data.type,
      previousRetryCount: webhookEvent.retryCount,
    });
  }

  // Step 3: process the event; on failure store the error for admin visibility and retry.
  // Belt-and-suspenders logging: customLog goes to Logtail/BetterStack, console.error is the
  // last-resort fallback that survives Logtail token issues or transport failures. We want
  // BOTH so a "silent failure" is impossible — anything thrown inside processWebhookEventById
  // shows up here with full payload, error message, AND stack.
  customLog(traceId, "info", {
    message: "Webhook processing starting",
    idempotencyKey,
    eventType: data.type,
    webhookContext,
    webhookEventId: webhookEvent.id,
  });
  try {
    await processWebhookEventById(webhookEvent, traceId);
    await markWebhookProcessed(webhookEvent.id);
    customLog(traceId, "info", {
      message: "Webhook processed successfully",
      idempotencyKey,
      eventType: data.type,
      webhookEventId: webhookEvent.id,
    });
    if (!res.headersSent) {
      return res.status(200).json({ status: true, message: "Webhook processed successfully" });
    }
  } catch (error) {
    const errorPayload = {
      message: "Webhook processing failed — stored as FAILED for admin retry",
      idempotencyKey,
      eventType: data.type,
      webhookContext,
      webhookEventId: webhookEvent.id,
      errorMessage: error?.message ?? String(error),
      errorStack: error?.stack,
      errorResponse: error?.response?.data,
      vendorSubscriptionId,
      merchantPaymentId,
    };
    customLog(traceId, "error", errorPayload, "VENDOR");
    // Logtail can swallow events on transport failures. Mirror to console so the failure is
    // always visible in raw container logs even if structured logging is down.
    console.error("[handlePGWebhookCashfree] processing failed", JSON.stringify(errorPayload));
    try {
      await markWebhookFailed(
        webhookEvent.id,
        error?.message ?? String(error),
        webhookEvent.retryCount + 1
      );
    } catch (markErr) {
      customLog(traceId, "error", {
        message: "Failed to mark webhook FAILED after processing error",
        idempotencyKey,
        webhookEventId: webhookEvent.id,
        markError: markErr?.message ?? markErr,
        originalError: error?.message ?? error,
      }, "VENDOR");
      console.error("[handlePGWebhookCashfree] markWebhookFailed also threw", markErr?.message, markErr?.stack);
    }
    // Non-200 so Cashfree redelivers; redelivery of a FAILED event reprocesses it.
    if (!res.headersSent) {
      return res.status(500).json({ status: false, message: "Webhook processing failed" });
    }
  }
});

// Internal endpoint called by the scheduler 2 days before each subscription billing date.
// Creates a SUBSCRIPTION_CHARGE order in paymentGatewayOrders and calls Cashfree on-demand charge API.
// Protected by x-internal-secret header — not exposed to end users.
// triggerSubscriptionCharge has been removed.
// Charge triggering is now handled entirely within the scheduler MS,
// which calls Cashfree directly using the same calculatePlanAmount logic (inlined in scheduler).

const cancelCashfreeSubscription = async (serviceDetails, subscriptionId, traceId = null) => {
  try {
    // Default to the passed (shared subscriptions) merchant. If the mandate being cancelled was created
    // on a product-specific merchant — WhatsApp, or an INDIVIDUAL service with its own merchant — the
    // merchant accessKey was stamped on its SUBSCRIPTION_AUTH order; cancel on that merchant (mandates
    // are merchant-scoped). baseUrl/version stay the shared connection. Mirrors createSubscriptionOrder.
    const subscriptionAccessKey = operatorsData["cashFreeSubscriptions"]["accessKey"];
    const baseUrl = serviceDetails.vendor.apiUrl;
    const version = serviceDetails.vendor.optional3;
    let clientId = serviceDetails.vendor.optional1;
    let clientSecret = serviceDetails.vendor.optional2;
    const merchantAccessKey = await resolveSubscriptionMerchantAccessKey(subscriptionId);
    if (merchantAccessKey === WHATSAPP_ACCESS_KEY) {
      // WhatsApp merchant clientId/secret only (strict, no fallback). If unset, don't fire the cancel
      // with empty creds (a bare 401) — log the real reason and bail.
      const waCreds = await getWhatsAppMerchantClientCreds();
      if (!waCreds?.clientId || !waCreds?.clientSecret) {
        customLog(traceId, "error", {
          message: "WhatsApp merchant Cashfree credentials not configured (serviceOperator whatsApp_for_busines paymentclientid/secret) — cannot cancel WhatsApp subscription mandate",
          subscriptionId,
          merchantAccessKey,
        }, "VENDOR");
        return false;
      }
      clientId = waCreds.clientId;
      clientSecret = waCreds.clientSecret;
    } else if (merchantAccessKey && merchantAccessKey !== subscriptionAccessKey) {
      // INDIVIDUAL service's own Cashfree merchant (stamped only when it had paymentclientid/secret).
      const merchantOperator = await findServiceOperatorByAccessKey(merchantAccessKey);
      if (merchantOperator?.paymentclientid && merchantOperator?.paymentclientsecret) {
        clientId = merchantOperator.paymentclientid;
        clientSecret = merchantOperator.paymentclientsecret;
      }
    }
    const fullUrl = `${baseUrl}/pg/subscriptions/${subscriptionId}/manage`;

    const config = {
      method: "POST",
      url: fullUrl,
      headers: {
        "x-api-version": version,
        "x-client-id": clientId,
        "x-client-secret": clientSecret,
        "Content-Type": "application/json",
      },
      data: {
        action: "CANCEL",
        subscription_id: subscriptionId,
      },
    };
    customLog(traceId, "info", { message: "🚀 ~ cancelCashfreeSubscription ~ config", url: config.url, method: config.method, merchantAccessKey, clientId: maskCredential(clientId) }, "VENDOR");

    const result = await axios(config);
    customLog(traceId, "info", { message: "🚀 ~ cancelCashfreeSubscription ~ result", result: result.data }, "VENDOR");
    return result;
  } catch (error) {
    customLog(
      traceId,
      "error",
      { message: "🚀 ~ cancelCashfreeSubscription ~ catch", result: error?.response?.data ?? error?.message },
      "VENDOR"
    );
    return false;
  }
};
// Exported so the one-time purchase flow (subscription.payment) can best-effort cancel a mandate that a
// one-time buy superseded. Lazy-required there to avoid the cashFreeGateway ↔ subscription circular load.
exports.cancelCashfreeSubscription = cancelCashfreeSubscription;

async function calculatePlanAmountWithDbOps(
  pkg,
  billingType,
  isAddOns,
  quantity,
  accessKey,
  corporateId,
  dbOps
) {
  const billingTypePropertyName = billingType.toLowerCase();
  let total = parseFloat(pkg.packagePrices[billingTypePropertyName]) - parseFloat(pkg.discount[billingTypePropertyName]);
  let addOnPrice = 0;

  if (!isAddOns) {
    // For any plan renewal (INDIVIDUAL or GROUP), include all active addon subscriptions.
    const addOnSubscriptions = await dbOps.findAllAddonSubscription(corporateId);
    const groupSub = pkg.packageType === "GROUP" ? await dbOps.findExistingGroupPackage(corporateId) : null;
    // For an INDIVIDUAL package, scope the addon recompute to its OWN service. Add-ons are stamped with
    // the individual packageId at purchase; pkg.packageId (scheduler spread) or pkg.id (Package entity)
    // resolves to the package id in every caller.
    const renewingPackageId = Number(pkg.packageId ?? pkg.id);

    for (const subscription of addOnSubscriptions) {
      // INDIVIDUAL renewal folds in ONLY its own add-ons — otherwise another individual package's
      // dynamic add-ons would be double-charged across separate renewals. GROUP folds all (one plan).
      if (pkg.packageType === "INDIVIDUAL" && Number(subscription.packageId) !== renewingPackageId) continue;
      // Re-anchor to the active GROUP tier via findAddonPrice's groupPackageId preference — byte-identical to
      // the scheduler's calculatePlanAmount, which keys solely on serviceOperatorId + groupPackageId. We do NOT
      // run a second findGroupCashbackForService override: it re-derived the operator from packageId with no
      // serviceOperatorId filter / tie-break, so on a re-anchored addon it could resolve a DIFFERENT operator's
      // unit price and drift the recompute off the charged amount. findAddonPrice already returns the correct
      // group-tier row.
      const addonData = await dbOps.findAddonPrice({ packageId: subscription.packageId, serviceOperatorId: subscription.serviceOperatorId, groupPackageId: groupSub?.package?.id ?? null });
      if (!addonData || !isRecurringAddon(addonData)) continue;

      // Recurring addon follows the base cycle: × 12 on an ANNUAL renewal, × 1 on MONTHLY (matches the
      // scheduler charge + calculateSubscriptionPrice, so the recompute doesn't drift from what's charged).
      addOnPrice += annualizeAddon(calculateAddonLineTotal(addonData.unitPrice, subscription.maxLimit), billingType);
    }
  }

  if (isAddOns) {
    const allCashbacks = await dbOps.findOneServiceCashbacks({ accessKey });
    if (!allCashbacks || !allCashbacks.length) {
      throw new Error("Couldn't find cashback data");
    }

    const individualCashback = allCashbacks.find((row) => row.package?.packageType === "INDIVIDUAL");
    const groupSub = await dbOps.findExistingGroupPackage(corporateId);
    const tier = resolveAddonTierPricing(allCashbacks, groupSub, individualCashback);
    if (!tier) {
      throw new Error("Couldn't find cashback data");
    }

    addOnPrice = tier.unitPrice * quantity;
  }

  const tax = await calculateTaxBreakdown(addOnPrice + total);

  return {
    price: isAddOns ? addOnPrice : total,
    periodicPrice: tax.grossAmount,
    taxableAmount: tax.taxableAmount,
    taxAmount: tax.taxAmount,
    taxRate: tax.taxRate,
  };
}

const calculatePlanAmount = (pkg, billingType, isAddOns, quantity, accessKey, corporateId) =>
  calculatePlanAmountWithDbOps(pkg, billingType, isAddOns, quantity, accessKey, corporateId, {
    findAllAddonSubscription,
    findExistingGroupPackage,
    findAddonPrice,
    findOneServiceCashbacks,
  });

// Exported so the admin Renewal Charges report forecasts/validates renewals with the EXACT same
// charge-amount + price-validation the order-creation and webhook flow use (no divergent reimplementation).
exports.calculatePlanAmount = calculatePlanAmount;

// Thin wrapper: all pricing math now lives in utils/subscriptionPricing.calculateSubscriptionPrice.
// Update prices in one place; validator and pricing endpoint both pick it up.
const validatePrice = async (billingType, pgAmount, packageDetails, couponCode, packageId, corporateId, authPayment = true, partnerId = null, traceId = null, pricingOptions = {}) => {
  try {
    const pricing = await calculateSubscriptionPrice({
      corporateId,
      packageDetails,
      billingType,
      couponCode,
      partnerId,
      authPayment,
      asOf: pricingOptions.asOf,
      creditCurrentGroupPlan: pricingOptions.creditCurrentGroupPlan,
    });
    const normalizedExpected = Number(pricing.expectedPaymentAmount).toFixed(2);
    const normalizedAmount = Number(pgAmount).toFixed(2);
    customLog(traceId, "info", {
      message: "Validate subscription price fn",
      packageType: packageDetails.packageType,
      packageId,
      ...pricing,
      pgAmount,
      normalizedExpected,
      normalizedAmount,
    });
    if (pricing.expectedPaymentAmount > 0) {
      if (normalizedExpected === normalizedAmount) return true;
      // TEMPORARY: accept the pre-tax (net) amount during the GST rollout window — remove after release.
      if (Number(pricing.taxableAmount).toFixed(2) === normalizedAmount) {
        customLog(traceId, "error", {
          message: "validatePrice: accepted PRE-TAX (legacy net) amount during GST rollout window",
          packageId,
          corporateId,
          pgAmount,
          taxableAmount: pricing.taxableAmount,
          expectedGross: pricing.expectedPaymentAmount,
        });
        return true;
      }
      return false;
    }
    return Number(pgAmount) === 0;
  } catch (err) {
    customLog(traceId, "error", { message: "validatePrice failed", error: err?.message, packageId, corporateId });
    return false;
  }
};

exports.validatePrice = validatePrice;

// Single source of truth for the per-charge mandate cap (used by the renewal report + manual-charge guard
// so they predict/allow GROUP renewals up to ₹1L, matching the mandate created here).
exports.SUBSCRIPTION_PLAN_MAX_AMOUNT = SUBSCRIPTION_PLAN_MAX_AMOUNT;
exports.SUBSCRIPTION_PLAN_MAX_AMOUNT_ANNUAL = SUBSCRIPTION_PLAN_MAX_AMOUNT_ANNUAL;
exports.resolvePlanMaxAmount = resolvePlanMaxAmount;

const computeAddonQuote = async (quantity, addonsAccessKey, partnerId, corporateId) => {
  let allCashbacks = await findOneServiceCashbacks({ accessKey: addonsAccessKey, partnerId });

  if (!allCashbacks.length) {
    return {
      error: true,
      message: "Invalid package details",
    };
  }

  const packageIds = allCashbacks.map((row) => row.packageId);

  // Confirm the user has an active subscription for this service
  const isUserSubscribed = await findSubscriptionIsExist({ corporateId, packageIds });
  if (!isUserSubscribed) {
    return { error: true, message: "Subscription not purchased." };
  }

  // Use the cashback row that matches the user's actual subscribed package for pricing.
  // e.g. Peko Go → Peko Go price, Peko+ → Peko+ price, Basic → Basic price.
  const individualCashback = allCashbacks.find((row) => Number(row.packageId) === Number(isUserSubscribed.packageId)) ?? allCashbacks[0];

  // ── Remaining days in the current billing cycle ────────────────────────────
  // Used to pro-rate the addon charge when < 30 days remain.
  // Example: unitPrice = ₹50/employee, 10 days left → charge = (50/30) × 10 = ₹16.67
  const currentSubscriptionEndDate = new Date(isUserSubscribed.subscriptionEndDate);
  const today = new Date();
  const daysRemaining = Math.ceil((currentSubscriptionEndDate - today) / (1000 * 60 * 60 * 24));

  // Guard: expired subscription — daysRemaining would be negative, price calculation invalid
  if (daysRemaining <= 0) {
    return { error: true, message: "Subscription not purchased." };
  }

  // INDIVIDUAL-wins, mirroring createSubscriptionForAddOns: an owned individual package prices the
  // addon from its own tier, never the group/basic row findSubscriptionIsExist may have returned.
  const individualPackageCashback = allCashbacks.find((row) => row.package?.packageType === "INDIVIDUAL");
  const ownsIndividual = individualPackageCashback
    ? !!(await findActiveIndividualBaseSubscription({ corporateId, packageId: individualPackageCashback.packageId }))
    : false;
  const pricingCashbackRow = ownsIndividual ? individualPackageCashback : individualCashback;
  const groupSub = ownsIndividual ? null : await findExistingGroupPackage(corporateId);
  const tier = resolveAddonTierPricing(allCashbacks, groupSub, pricingCashbackRow);
  if (!tier) {
    return {
      error: true,
      message: "Invalid package details",
    };
  }

  const baseUnitPrice = tier.unitPrice;
  if (!(baseUnitPrice > 0)) {
    return { error: true, message: "Add-on purchase is not available for your current plan." };
  }

  // ── Pro-rated charge for the current cycle ─────────────────────────────────
  // isDynamicUnitPricing from the tier row used for pricing (GROUP when on Peko+, etc.). A recurring addon
  // is pro-rated over the days left in the base cycle so it aligns to (and expires with) the base — on an
  // ANNUAL base this charges ~a full year (365/30 × unitPrice), on MONTHLY one month. (Was gated to
  // `daysRemaining > 30 → full month`, which under-charged addons purchased onto annual bases.)
  let originalUnitPrice;
  if (!tier.isDynamicUnitPricing) {
    originalUnitPrice = baseUnitPrice;
  } else {
    originalUnitPrice = calculateProRatedAddonPrice(baseUnitPrice, daysRemaining);
  }

  const lineNet = quantity * originalUnitPrice;
  const addonTax = await calculateTaxBreakdown(lineNet);
  return {
    lineNet,
    taxableAmount: addonTax.taxableAmount,
    taxAmount: addonTax.taxAmount,
    taxRate: addonTax.taxRate,
    expectedPaymentAmount: addonTax.grossAmount,
    baseUnitPrice,
    originalUnitPrice,
    daysRemaining,
    isDynamicUnitPricing: tier.isDynamicUnitPricing,
  };
};

exports.computeAddonQuote = computeAddonQuote;

const validateAddOnPrice = async (quantity, pgAmount, addonsAccessKey, partnerId, corporateId, traceId = null) => {
  const quote = await computeAddonQuote(quantity, addonsAccessKey, partnerId, corporateId);
  if (quote?.error) return quote;

  customLog(traceId, "info", {
    message: "Validating add on price",
    expectedPaymentAmount: quote.expectedPaymentAmount,
    taxableAmount: quote.taxableAmount,
    taxAmount: quote.taxAmount,
    actualPaymentAmount: pgAmount,
    daysRemaining: quote.daysRemaining,
    baseUnitPrice: quote.baseUnitPrice,
    originalUnitPrice: quote.originalUnitPrice,
    isDynamicUnitPricing: quote.isDynamicUnitPricing,
  });
  if (Number(quote.expectedPaymentAmount).toFixed(2) !== Number(pgAmount).toFixed(2)) {
    // TEMPORARY: accept the pre-tax (net) amount during the GST rollout window — remove after release.
    if (Number(quote.lineNet).toFixed(2) === Number(pgAmount).toFixed(2)) {
      customLog(traceId, "error", {
        message: "validateAddOnPrice: accepted PRE-TAX (legacy net) amount during GST rollout window",
        corporateId,
        pgAmount,
        expectedGross: quote.expectedPaymentAmount,
      });
      return true;
    }
    return false;
  }
  return true;
};

exports.getAddonPricing = asyncHandler(async (req, res, next) => {
  const corporateId = req.user.corporateId;
  const partnerId = req.user.registeredBy;
  const { addonsAccessKey } = req.query;
  const quantity = parseInt(req.query.quantity) || 0;

  if (!addonsAccessKey || quantity <= 0) {
    return next(new ErrorResponse("addonsAccessKey and a positive quantity are required", 400));
  }

  const quote = await computeAddonQuote(quantity, addonsAccessKey, partnerId, corporateId);
  if (quote?.error) {
    return next(new ErrorResponse(quote.message || "Invalid package details", 400));
  }

  return res.status(200).json({
    status: true,
    data: {
      taxableAmount: quote.taxableAmount,
      taxAmount: quote.taxAmount,
      taxRate: quote.taxRate,
      expectedPaymentAmount: quote.expectedPaymentAmount,
      unitPrice: quote.originalUnitPrice,
      quantity,
    },
    message: "Add-on pricing fetched successfully",
    responseCode: "000",
  });
});

exports.handleCashfreeReturn = (req, res) => { // not used
  customLog(req?.LogTraceId, "info", { message: "cashfree return webhook", body: req?.body, query: req?.query });
  try {
    return res.redirect(`${FRONTEND_URL}/dashboard?status="success"&transactionId=${34343434343}`);
  } catch (error) {
    return res.redirect(`${FRONTEND_URL}/dashboard?status="failure"&transactionId=${434343434343}`);
  }
};

exports.handleCashfreeRedirect = async(req, res) => {
  // [Object: null prototype] {
  //     cf_referenceId: 'N/A',
  //     cf_checkoutStatus: 'SUCCESS',
  //     cf_authAmount: '189.00',
  //     cf_mode: 'SBC_UPI',
  //     signature: 'b1ZbCKC49OIWAX/R7Pu9yivKIUvdp7g7VUMpYo9GG+8=',
  //     cf_subscriptionPaymentId: '803277',
  //     cf_message: 'Subscription Authorised Successfully',
  //     cf_subReferenceId: '783087',
  //     cf_umn: 'REOL2rpF182GzltAr3gHD5HYi9yETy@upi',
  //     cf_status: 'ACTIVE',
  //     cf_subscriptionId: '1740990720208'
  //   }
  let redirectBaseUrl = FRONTEND_URL;
  try {
    customLog(req?.LogTraceId, "info",{messge: "handleCashfreeRedirect webhook", body: req?.body});
    const { cf_checkoutStatus, cf_subscriptionId, cf_subscriptionPaymentId } = req.body;
    if (cf_subscriptionId) {
      const authOrder = await paymentGatewayOrders.findOne({
        where: {
          vendorSubscriptionId: String(cf_subscriptionId),
          orderKind: ORDER_KIND.SUBSCRIPTION_AUTH,
        },
        attributes: ["paymentData"],
        raw: true,
      });
      let registeredBy = null;
      try {
        registeredBy = authOrder?.paymentData ? JSON.parse(authOrder.paymentData)?.registeredBy : null;
      } catch (parseError) {
        customLog(req?.LogTraceId, "error", { messge: "handleCashfreeRedirect paymentData parse failed", error: parseError });
      }
      if (registeredBy) {
        const partnerDetails = await fetchPartnerDetails(registeredBy);
        redirectBaseUrl = partnerDetails?.baseUrl || FRONTEND_URL;
      }
    }
    if (cf_subscriptionId) {
      if (cf_checkoutStatus === "SUCCESS" || cf_checkoutStatus === "BANK_APPROVAL_PENDING") {
        await paymentGatewayOrders.update(
          { status: "IN_PROGRESS" },
          {
            where: {
              vendorSubscriptionId: String(cf_subscriptionId),
              status: "ORDERED",
              orderKind: ORDER_KIND.SUBSCRIPTION_AUTH,
            },
          }
        );
      } else {
        // F-PG-12: same guard as the success branch — only an order still ORDERED can be failed here,
        // so an unsigned redirect can't overwrite an IN_PROGRESS / COMPLETE auth order.
        await paymentGatewayOrders.update(
          { status: "FAILED" },
          {
            where: {
              vendorSubscriptionId: String(cf_subscriptionId),
              status: "ORDERED",
              orderKind: ORDER_KIND.SUBSCRIPTION_AUTH,
            },
          }
        );
      }
    }
    if (cf_checkoutStatus === "SUCCESS" || cf_checkoutStatus === "BANK_APPROVAL_PENDING") {
      // F-PG-12: encode request values so they can't add extra parameters to the frontend URL.
      res.redirect(`${redirectBaseUrl}/plans/payment-pending?transactionId=${encodeURIComponent(cf_subscriptionId)}&paymentRefId=${encodeURIComponent(cf_subscriptionPaymentId ?? '')}`);
    } else
    {
      res.redirect(`${redirectBaseUrl}/plans/payment-failure?status=fail`);
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", {messge: "handleCashfreeRedirect error", error: error?.response?.data ?? error?.response ?? error});
    res.redirect(`${redirectBaseUrl}/plans/payment-failure?status=fail`);
  }
}