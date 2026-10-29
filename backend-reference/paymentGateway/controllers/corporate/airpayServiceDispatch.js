const ErrorResponse = require("../../utils/error-response");
const operatorData = require("../../utils/operatorsData.json");
const esim = require("./eSIMV2");
const eSimTunz = require("./eSimTunz");
const giftcards = require("./giftCard");
const ecommerce = require("./ecommerce");
const carbonFootprint = require("./carbonFootprint");
const workspace = require("./workspace");
const hotel = require("./hotels");
const flight = require("./flight");
const prepaid = require("./telecomPayments/prepaid");
const logistics = require("./logisticsV3");
const softwares = require("./softwares");
const subscription = require("./subscription");
const works = require("./works");
const hike = require("./hike");
const whatsAppForBusiness = require("./whatsAppForBusiness");
const softwareSubscription = require("./software_subscriptions");
const ecommerceStore = require("./ecommerceStore");
const wallet = require("./wallet");
const corporateCards = require("./corporateCards");
const domainAndHosting = require("./domainAndHosting");
const companyIncorporation = require("./companyIncorporation");
const businessRegistration = require("./businessRegistration");
const govtServices = require("./govtServices");
const govtServicesV2 = require("./govtServicesV2");
const challan = require("./challan");
const carReport = require("./carReport");
const visa = require("./visa");
const verificationSuiteAddOn = require("./verificationSuiteAddOn");
const globalBusinessSetup = require("./globalBusinessSetup");
const bus = require("./bus");

const GOVT_SERVICE_KEYS = new Set([
  "gst-registration", "pt-registration", "shop-establishment-license", "tan-registration", "epf-registration",
  "esi-registration", "pan-registration", "gst-composition-scheme", "msme-registration", "trademark-registration",
  "startup-india", "iso-certification", "fssai-basic", "fssai-state", "fssai-central", "drug-license-retail",
  "drug-license-wholesale", "drug-manufacturing", "12a-80g-registration", "fcra-registration", "trade-license",
  "fire-safety-noc", "pcb-consent", "factory-license", "rera-promoter", "rera-agent", "iec-registration", "dsc",
].map((key) => operatorData[key]["accessKey"]));

// Mixed Bondio + Tunz eSIM purchase paid in one Airpay payment
const dispatchEsimGroups = async (req, res) => {
  const groups = req.body.orderGroups;
  const results = [];
  const parentBatchId = Date.now();
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const processInternal = group.accessKey === operatorData["eSIMTunz"]["accessKey"]
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

// Hands a paid Airpay order to its service handler. Bills (BBPS) are never paid through Airpay.
exports.dispatchAirpayPayment = async (req, res, next, { gatewayOrderCreatedAt } = {}) => {
  if (Array.isArray(req.body.orderGroups)) {
    return dispatchEsimGroups(req, res);
  }

  const operator = req.body.accessKey;
  if (GOVT_SERVICE_KEYS.has(operator)) {
    return govtServices.payment(req, res, next);
  }

  switch (operator) {
    case operatorData["prepaid"]["accessKey"]:
      return prepaid.payment(req, res, next);
    case operatorData["giftCard"]["accessKey"]:
    case operatorData["xoxoday"]["accessKey"]:
      return giftcards.payment(req, res, next);
    case operatorData["e-commerce"]["accessKey"]:
      return ecommerce.payment(req, res, next);
    case operatorData["carbonFootprints"]["accessKey"]:
      return carbonFootprint.payment(req, res, next);
    case operatorData["workspace"]["accessKey"]:
      return workspace.payment(req, res, next);
    case operatorData["flight"]["accessKey"]:
      return flight.payment(req, res, next);
    case operatorData["hotel"]["accessKey"]:
      return hotel.payment(req, res, next);
    case operatorData["logistics"]["accessKey"]:
      return logistics.payment(req, res, next);
    case operatorData["subscription"]["accessKey"]:
      return softwares.payment(req, res, next);
    case operatorData["hike"]["accessKey"]:
      return hike.payment(req, res, next);
    case operatorData["pekoWorks"]["accessKey"]:
      return works.payment(req, res, next);
    case operatorData["subscriptionPlans"]["accessKey"]:
      if (req.body.kind === "ADDON_PURCHASE") return subscription.addonPayment(req, res, next);
      if (req.body.isAddOns) return subscription.subscriptionAddOnsPayment(req, res, next);
      req.isGatewayConfirmedPurchase = true;
      req.gatewayOrderCreatedAt = gatewayOrderCreatedAt;
      return subscription.payment(req, res, next);
    case operatorData["verificationSuite"]["accessKey"]:
      return verificationSuiteAddOn.purchaseVerificationSuiteAddOn(req, res, next);
    case operatorData["whatsAppForBusiness"]["accessKey"]:
      if (req.body.isSubscription) return whatsAppForBusiness.ProjectSubscriptionPayment(req, res, next);
      if (req.body.isAddOns) return whatsAppForBusiness.botBuilderpayment(req, res, next);
      return whatsAppForBusiness.payment(req, res, next);
    case operatorData["email_domain_service"]["accessKey"]:
      return softwareSubscription.payment(req, res, next);
    case operatorData["eSIM"]["accessKey"]:
      return esim.payment(req, res, next);
    case operatorData["eSIMTunz"]["accessKey"]:
      return eSimTunz.payment(req, res, next);
    case operatorData["pekoWallet"]["accessKey"]:
      return wallet.payment(req, res, next);
    case operatorData["corporateCards"]["accessKey"]:
      return corporateCards.payment(req, res, next);
    case operatorData["domainAndHosting"]["accessKey"]:
      return domainAndHosting.payment(req, res, next);
    case operatorData["companyIncorporation"]["accessKey"]:
      return companyIncorporation.payment(req, res, next);
    case operatorData["businessRegistration"]["accessKey"]:
      return businessRegistration.payment(req, res, next);
    case operatorData["challan"]["accessKey"]:
      return challan.payment(req, res, next);
    case operatorData["carReport"]["accessKey"]:
      return carReport.payment(req, res, next);
    case operatorData["visa"]["accessKey"]:
      return visa.payment(req, res, next);
    case operatorData["governmentServices"]["accessKey"]:
      return govtServicesV2.payment(req, res, next);
    case operatorData["globalBusinessSetup"]["accessKey"]:
      if (req.body.isRenewalApproval || req.body.renewalId) return globalBusinessSetup.renewalApprove(req, res, next);
      return globalBusinessSetup.payment(req, res, next);
    case operatorData["ecommerceStore"]["accessKey"]:
      return ecommerceStore.payment(req, res, next);
    case operatorData["bus"]["accessKey"]:
      return bus.payment(req, res, next);
    default:
      // Gov Services V2 vendor catalog ids are numeric
      if (/^\d+$/.test(String(operator))) return govtServicesV2.payment(req, res, next);
      return next(new ErrorResponse("Service not found", 404));
  }
};
