/**
 * Routes a confirmed gateway payment to the service that fulfils it. Same contract the
 * Cashfree switches in controllers/corporate/cashFreeGateway.js use: req.body carries the
 * persisted create-order body + corporateTxnId + paymentGatewayResponse, and the handler
 * writes the HTTP response. Used by the Razorpay gateway; the Cashfree switches are untouched.
 *
 * Deliberately absent: BBPS (commonBillHandler — those bills pay through CCAvenue) and ONDC
 * Office Supplies (its seller split hangs off the Cashfree order). createOrder refuses both.
 */
const ErrorResponse = require("../utils/error-response");
const { customLog } = require("../utils/loggerHelper");
const operatorsData = require("../utils/operatorsData.json");
const esim = require("../controllers/corporate/eSIMV2");
const eSimTunz = require("../controllers/corporate/eSimTunz");
const giftcards = require("../controllers/corporate/giftCard");
const ecommerce = require("../controllers/corporate/ecommerce");
const carbonFootprint = require("../controllers/corporate/carbonFootprint");
const workspace = require("../controllers/corporate/workspace");
const hotel = require("../controllers/corporate/hotels");
const flight = require("../controllers/corporate/flight");
const prepaid = require("../controllers/corporate/telecomPayments/prepaid");
const logistics = require("../controllers/corporate/logisticsV3");
const softwares = require("../controllers/corporate/softwares");
const works = require("../controllers/corporate/works");
const hike = require("../controllers/corporate/hike");
const whatsAppForBusiness = require("../controllers/corporate/whatsAppForBusiness");
const softwareSubscription = require("../controllers/corporate/software_subscriptions");
const ecommerceStore = require("../controllers/corporate/ecommerceStore");
const wallet = require("../controllers/corporate/wallet");
const corporateCards = require("../controllers/corporate/corporateCards");
const domainAndHosting = require("../controllers/corporate/domainAndHosting");
const companyIncorporation = require("../controllers/corporate/companyIncorporation");
const businessRegistration = require("../controllers/corporate/businessRegistration");
const govtServices = require("../controllers/corporate/govtServices");
const govtServicesV2 = require("../controllers/corporate/govtServicesV2");
const challan = require("../controllers/corporate/challan");
const carReport = require("../controllers/corporate/carReport");
const visa = require("../controllers/corporate/visa");
const verificationSuiteAddOn = require("../controllers/corporate/verificationSuiteAddOn");
const globalBusinessSetup = require("../controllers/corporate/globalBusinessSetup");
const bus = require("../controllers/corporate/bus");

const key = (name) => operatorsData[name]["accessKey"];

const GOVT_SERVICE_KEYS = [
  "gst-registration", "pt-registration", "shop-establishment-license", "tan-registration",
  "epf-registration", "esi-registration", "pan-registration", "gst-composition-scheme",
  "msme-registration", "trademark-registration", "startup-india", "iso-certification",
  "fssai-basic", "fssai-state", "fssai-central", "drug-license-retail", "drug-license-wholesale",
  "drug-manufacturing", "12a-80g-registration", "fcra-registration", "trade-license",
  "fire-safety-noc", "pcb-consent", "factory-license", "rera-promoter", "rera-agent",
  "iec-registration", "dsc",
].map(key);

const SIMPLE_HANDLERS = {
  [key("prepaid")]: prepaid.payment,
  [key("giftCard")]: giftcards.payment,
  [key("xoxoday")]: giftcards.payment,
  [key("carbonFootprints")]: carbonFootprint.payment,
  [key("workspace")]: workspace.payment,
  [key("flight")]: flight.payment,
  [key("hotel")]: hotel.payment,
  [key("logistics")]: logistics.payment,
  [key("subscription")]: softwares.payment,
  [key("hike")]: hike.payment,
  [key("pekoWorks")]: works.payment,
  [key("verificationSuite")]: verificationSuiteAddOn.purchaseVerificationSuiteAddOn,
  [key("email_domain_service")]: softwareSubscription.payment,
  [key("eSIM")]: esim.payment,
  [key("eSIMTunz")]: eSimTunz.payment,
  [key("pekoWallet")]: wallet.payment,
  [key("corporateCards")]: corporateCards.payment,
  [key("domainAndHosting")]: domainAndHosting.payment,
  [key("companyIncorporation")]: companyIncorporation.payment,
  [key("businessRegistration")]: businessRegistration.payment,
  [key("challan")]: challan.payment,
  [key("carReport")]: carReport.payment,
  [key("visa")]: visa.payment,
  [key("governmentServices")]: govtServicesV2.payment,
  [key("ecommerceStore")]: ecommerceStore.payment,
  [key("bus")]: bus.payment,
};
GOVT_SERVICE_KEYS.forEach((k) => { SIMPLE_HANDLERS[k] = govtServices.payment; });

/** The handler for this order, or null when the service cannot be fulfilled from this gateway. */
const resolveServicePaymentHandler = ({ accessKey, body = {} }) => {
  if (body.isOndc) return null;
  // Subscription-plan purchases/add-ons and WhatsApp/Commerce subscriptions are priced and
  // created by their own Cashfree endpoints (validatePrice, quotedAt, mandates); the generic
  // create-order must not be a way around that until those flows are ported.
  if (accessKey === key("subscriptionPlans")) return null;
  if (body.isSubscription || body.isMandate || body.isWhatsAppSubscription || body.isEcommerceSubscription) return null;
  if (accessKey === key("e-commerce")) return ecommerce.payment;
  if (accessKey === key("whatsAppForBusiness")) {
    return body.isAddOns ? whatsAppForBusiness.botBuilderpayment : whatsAppForBusiness.payment;
  }
  if (accessKey === key("globalBusinessSetup")) {
    return body.isRenewalApproval || body.renewalId
      ? globalBusinessSetup.renewalApprove
      : globalBusinessSetup.payment;
  }
  if (SIMPLE_HANDLERS[accessKey]) return SIMPLE_HANDLERS[accessKey];
  // Gov Services V2 catalog items use the vendor's numeric catalog id as accessKey.
  if (/^\d+$/.test(String(accessKey))) return govtServicesV2.payment;
  return null;
};

// Mixed Bondio + Tunz eSIM purchase: one payment funds several vendor groups.
const dispatchMultiVendorEsim = async ({ req, res, paymentRefId }) => {
  const groups = req.body.orderGroups;
  const results = [];
  const parentBatchId = Date.now();

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const processInternal = group.accessKey === key("eSIMTunz")
      ? eSimTunz.processPaymentInternal
      : esim.processPaymentInternal;

    const result = await processInternal({
      credentialId: req.user.id,
      isSubCorporateUser: req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId && req.user.subCorporateUsername,
      subCorporateUserId: req.user.subCorporateId,
      orders: group.orders,
      planIds: group.planIds,
      amount: group.amount,
      account: req.body.account,
      paymentGatewayResponse: req.body.paymentGatewayResponse,
      pgAmount: group.pgAmount,
      req,
      parentBatchId,
      totalVendorGroups: groups.length,
      vendorIndex: i,
    });

    if (!result.success) {
      customLog(req?.LogTraceId, "error", {
        message: `Mixed vendor PG payment error for ${group.accessKey}: ${result.error}`,
        paymentRefId,
      }, "VENDOR");
      return res.status(500).json({ status: false, message: result.error || "Payment processing failed" });
    }
    results.push(result);
  }

  const totalDeducted = groups.reduce((sum, g) => sum + Number(g.amount) + Number(g.surcharge || 0), 0);
  return res.status(200).json({
    status: true,
    message: "Payment started processing",
    responseCode: "000",
    data: {
      bulkPaymentData: results.map((r) => r.redisKey),
      corporateFinalBalance: (results[0].walletBalance - totalDeducted).toFixed(2),
      paymentMode: results[0]?.paymentMode,
    },
  });
};

/** Expects req.body already rebuilt as { ...paymentData, corporateTxnId, paymentGatewayResponse }. */
const dispatchServicePayment = async ({ req, res, next, paymentRefId }) => {
  if (Array.isArray(req.body.orderGroups)) {
    return dispatchMultiVendorEsim({ req, res, paymentRefId });
  }
  const handler = resolveServicePaymentHandler({ accessKey: req.body.accessKey, body: req.body });
  if (!handler) return next(new ErrorResponse("Service not found", 404));
  return handler(req, res, next);
};

module.exports = { resolveServicePaymentHandler, dispatchServicePayment };
