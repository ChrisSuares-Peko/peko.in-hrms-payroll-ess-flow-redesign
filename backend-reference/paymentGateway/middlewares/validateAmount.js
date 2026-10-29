const { customLog } = require("../utils/loggerHelper");
// const ErrorResponse = require("../utils/error-response");

const { getValue } = require("../utils/cacheDataMethods");
const { fetchServiceDetails, calculateSurcharge, calculateAmountWithTax } = require("../utils/checkAndFetchServiceDetails");
const validateBusinessEmail = require("../services/validateBusinessEmail");
const validateEsimPayment = require("../services/validateEsimPayment");
const validateWhatsappForBusiness = require("../services/validateWhatsappForBusiness");
const { findOnePlanDetails } = require("../models/use-cases/works_plan");
const validateHikePayment = require("../services/validateHikePayment");
const { findOneCoupon } = require("../models/use-cases/pekoCredits");
const { findRecordByBillerId } = require("../models/use-cases/billerMDM");
const { calculateDiscountResponse } = require("../utils/calculateDiscount");
const operatorsData = require("../utils/operatorsData.json");
const ServiceCartUseCase = require("../models/use-cases/serviceCart");
const { resolveDomainHostingPrice } = require("../utils/resolveDomainHostingPrice");
const { findServiceOperatorByAccessKey } = require("../utils/checkAndFetchServiceDetails");
const { calculateSubscriptionPrice } = require("../utils/subscriptionPricing");
const axiosInstance = require("axios");
const { findOne: findPackage } = require("../models/use-cases/package");
const { getVendorAmount, getVendorQuote, getQuoteScope } = require("../utils/applyCommissionMarkup");
const { calculatePhysicalCardPrice } = require("../utils/physicalCardPricing");

const checkServiceAvailability = async (cartItems) => {
    const domainItems = cartItems.filter(i => i.itemType === 'domain' && i.productName);
    const nonDomainItems = cartItems.filter(i => i.itemType !== 'domain' && i.itemType !== 'backup' && i.domainName && i.productId);

    if (domainItems.length === 0 && nonDomainItems.length === 0) return { available: true };

    const serviceOperator = await findServiceOperatorByAccessKey(operatorsData['domainAndHosting']['accessKey']);
    if (!serviceOperator || serviceOperator.error) return { available: true };

    const baseUrl = serviceOperator.vendor.apiUrl;
    const authParams = `auth-userid=${encodeURIComponent(serviceOperator.vendor.optional1)}&api-key=${encodeURIComponent(serviceOperator.vendor.optional2)}`;

    for (const item of domainItems) {
        const domainName = item.productName;
        try {
            const dotIndex = domainName.indexOf('.');
            if (dotIndex < 1) return { available: false, domainName };
            const sld = domainName.substring(0, dotIndex);
            const tld = domainName.substring(dotIndex + 1);
            const url = `${baseUrl}/api/domains/available.json?${authParams}&domain-name=${encodeURIComponent(sld)}&tlds=${encodeURIComponent(tld)}`;
            const response = await axiosInstance.get(url);
            const result = response.data?.[domainName] ?? response.data?.[domainName.toLowerCase()];
            const isAvailable = result?.status === 'available' || typeof result === 'number';
            if (!isAvailable) return { available: false, domainName };
        } catch (err) {
            // non-fatal: allow if availability check fails
        }
    }

    for (const item of nonDomainItems) {
        try {
            const url = `${baseUrl}/api/products/availability.json?${authParams}&domain-name=${encodeURIComponent(item.domainName)}&product-key=${encodeURIComponent(item.productId)}`;
            const response = await axiosInstance.get(url);
            const isAvailable = response.data === true || response.data === 'true';
            if (!isAvailable) return { available: false, productId: item.productId, domainName: item.domainName };
        } catch (err) {
            // non-fatal: allow if availability check fails
        }
    }
    return { available: true };
};

// Services that use simple amount validation (calculatedAmount = amount sent by user)
const simpleValidationAccessKeys = new Set([
  // Telecom services
  operatorsData["postpaid"]["accessKey"],
  operatorsData["otme"]["accessKey"],
  // Utility services
  operatorsData["broadband"]["accessKey"],
  operatorsData["cable"]["accessKey"],
  operatorsData["education"]["accessKey"],
  operatorsData["electricity"]["accessKey"],
  operatorsData["landline"]["accessKey"],
  operatorsData["lpg"]["accessKey"],
  operatorsData["pipedGas"]["accessKey"],
  operatorsData["water"]["accessKey"],
  operatorsData["fastag"]["accessKey"],
  operatorsData["dth"]["accessKey"],
  // Financial services
  operatorsData["creditCard"]["accessKey"],
  operatorsData["deposite"]["accessKey"],
  operatorsData["donations"]["accessKey"],
  operatorsData["loanRepayment"]["accessKey"],
  operatorsData["municipalServices"]["accessKey"],
  operatorsData["municipalTaxes"]["accessKey"],
  operatorsData["rental"]["accessKey"],
  // Insurance services
  operatorsData["car"]["accessKey"],
  operatorsData["bike"]["accessKey"],
  operatorsData["life"]["accessKey"],
  operatorsData["health"]["accessKey"],
  // Other BBPS services
  operatorsData["clubs"]["accessKey"],
  operatorsData["hospitals"]["accessKey"],
  operatorsData["housingSociety"]["accessKey"],
  operatorsData["bbps_subscriptions"]["accessKey"],
  operatorsData["ncmc"]["accessKey"],
  operatorsData["nps"]["accessKey"],
  operatorsData["prepaidMeter"]["accessKey"],
  // Other payment services
  operatorsData["e-commerce"]["accessKey"],
  operatorsData["subscription"]["accessKey"],
  operatorsData["workspace"]["accessKey"],
  operatorsData["carbonFootprints"]["accessKey"],
  operatorsData["subscriptionPlans"]["accessKey"],
  operatorsData["pekoWallet"]["accessKey"],
  operatorsData["pekoPos"]["accessKey"],
  // Government services — these values must match govtServices.js's own VALID_ACCESS_KEYS
  // exactly (confirmed against the real serviceOperators rows), not operatorsData.json,
  // which uses different accessKey strings for drug license / RERA sub-types.
  "govt_gst_registration", "govt_pt_registration", "govt_shop_establishment",
  "govt_tan_registration", "govt_epf_registration", "govt_esi_registration",
  "govt_pan_registration", "govt_gst_composition", "govt_msme_registration",
  "govt_trademark_registration", "govt_startup_india", "govt_iso_certification",
  "govt_fssai_basic", "govt_fssai_state", "govt_fssai_central",
  "govt_drug_license", "govt_drug_manufacturing",
  "govt_12a_80g", "govt_fcra_registration", "govt_trade_license",
  "govt_fire_safety_noc", "govt_pcb_consent", "govt_factory_license",
  "govt_rera_registration", "govt_iec_registration", "govt_dsc",
  operatorsData["giftCard"]["accessKey"],
  operatorsData["xoxoday"]["accessKey"],
  operatorsData["companyIncorporation"]["accessKey"],
  operatorsData["globalBusinessSetup"]["accessKey"],
  operatorsData["businessRegistration"]["accessKey"],
  operatorsData["governmentServices"]["accessKey"],
]);

const normalizeAmount = (val) =>
  Math.round((Number(val) + Number.EPSILON) * 100) / 100;

const validateAmount = async (req, res, next) => {
  try {

    const { id, packageId, corporateId } = req.user;
    let { amount, pgAmount } = req.body;
    let { accessKey } = req.body;
    // Kept in the order body so the payment callback, which has no headers, finds the same price list.
    const quoteScope = getQuoteScope({ headers: req.headers });

    // --- Multi-vendor eSIM path (orderGroups) ---
    if (Array.isArray(req.body.orderGroups)) {
      const groups = req.body.orderGroups;
      if (!groups.length) {
        return handleError(req, res, "orderGroups cannot be empty");
      }

      let calculatedTotalBase = 0;
      let calculatedTotalPgAmount = 0;

      for (const group of groups) {
        const {
          orders,
          planIds,
          amount: groupAmount,
          accessKey: groupAccessKey,
        } = group;

        if (!Array.isArray(orders) || !Array.isArray(planIds)) {
          return handleError(req, res, "orders and planIds arrays are required for eSIM");
        }
        if (orders.length !== planIds.length) {
          return handleError(req, res, "orders and planIds length mismatch");
        }

        customLog(req?.LogTraceId, 'info', {
          message: 'Multi-vendor eSIM group validation started',
          groupAccessKey,
          clientAmount: groupAmount,
          planIds,
        });

        const isValidAmount = await validateEsimPayment({ orders, planIds, amount: groupAmount, credentialId: id });
        if (!isValidAmount?.isValid) {
          customLog(req?.LogTraceId, 'error', {
            message: 'Multi-vendor eSIM group amount validation failed',
            groupAccessKey,
            clientAmount: groupAmount,
            expectedTotal: isValidAmount?.totalAmount,
          });
          return handleError(req, res, "something went wrong");
        }

        const groupBase = Number(isValidAmount.totalAmount);
        const totalQuantity = orders.reduce((sum, o) => sum + Number(o.quantity || 1), 0);

        const { surcharge } = await calculateSurchargeFn({
          credentialId: id,
          accessKey: groupAccessKey,
          packageId,
          corporateUserId: corporateId,
          orderAmount: groupBase,
          quantity: totalQuantity,
        });

        calculatedTotalBase += groupBase;
        calculatedTotalPgAmount += groupBase + Number(surcharge);
      }

      calculatedTotalBase = Number(calculatedTotalBase.toFixed(2));
      calculatedTotalPgAmount = Number(calculatedTotalPgAmount.toFixed(2));

      const receivedTotalAmount = normalizeAmount(req.body.amount);
      const receivedPgAmount = normalizeAmount(req.body.pgAmount);
      const finalCalculatedBase = normalizeAmount(calculatedTotalBase);
      const finalCalculatedPg = normalizeAmount(calculatedTotalPgAmount);

      customLog(req?.LogTraceId, 'info', {
        message: 'Multi-vendor eSIM final amount validation comparison',
        receivedTotalAmount,
        calculatedTotalBase: finalCalculatedBase,
        receivedPgAmount,
        calculatedTotalPgAmount: finalCalculatedPg,
        baseMatch: receivedTotalAmount === finalCalculatedBase,
        pgMatch: receivedPgAmount === finalCalculatedPg,
      });

      if (receivedTotalAmount !== finalCalculatedBase || receivedPgAmount !== finalCalculatedPg) {
        customLog(req?.LogTraceId, 'error', {
          message: 'Multi-vendor eSIM amount mismatch',
          receivedTotalAmount,
          calculatedTotalBase: finalCalculatedBase,
          receivedPgAmount,
          calculatedTotalPgAmount: finalCalculatedPg,
        });
        return handleError(req, res, "Amount mismatch");
      }

      return next();
    }
    // --- End multi-vendor eSIM path ---

    if (!pgAmount || !accessKey ) {
      return handleError(req, res, "necessary credentials are not passed");
    }
    if (accessKey === operatorsData["flight"]["accessKey"]) {
      const { outbount } = req.body;
      amount = outbount?.amount;
    }
    if (accessKey === operatorsData["globalBusinessSetup"]["accessKey"]) {
      amount = req.body.totalAmount;
    }
    if (Number(pgAmount) <= 0 || Number(amount) <= 0) {
      return handleError(req, res, "Invalid amount passed");
    }

    let calculatedAmount, calculatedPgAmount, esimBulkAmount, surcharge, serviceOperatorId;
    let challanCount = 0;

    switch (accessKey) {
      case operatorsData["flight"]["accessKey"]: {
        const { outbount } = req.body;
        const traceId = outbount?.TraceId;
        if (!traceId) {
          customLog(req.LogTraceId, "error", { 
            message: "TraceId is required for airline booking validation",
            accessKey,
            body: req.body
          });
          return handleError(req, res, "TraceId is required");
        }
        
        customLog(req.LogTraceId, "info", {
          message: "Starting airline amount validation",
          traceId,
          receivedAmount: amount,
          receivedPgAmount: pgAmount
        });
        
        // Get cached base fare amount
        const cachedBaseAmount = await getValue(`${accessKey}-${traceId}-paymentAmount`);
        if (!cachedBaseAmount) {
          customLog(req.LogTraceId, "error", { 
            message: "Cached amount not found for airline booking", 
            traceId, 
            accessKey,
            cacheKey: `${accessKey}-${traceId}-paymentAmount`
          });
          return handleError(req, res, "something went wrong");
        }
        
        // Calculate SSR addons total if passengers data is provided
        let ssrAddonsTotal = 0;
        if (outbount?.passengers && Array.isArray(outbount.passengers)) {
          outbount.passengers.forEach((passenger, index) => {
            const baggage = Number(passenger.baggageAmount || 0);
            const meal = Number(passenger.mealAmount || 0);
            const seat = Number(passenger.seatAmount || 0);
            ssrAddonsTotal += baggage + meal + seat;
            
            customLog(req.LogTraceId, "info", {
              message: `Passenger ${index + 1} SSR addons`,
              baggage,
              meal,
              seat,
              passengerTotal: baggage + meal + seat
            });
          });
        }
        
        // Handle inbount SSR addons if present
        if (req.body.inbount?.passengers && Array.isArray(req.body.inbount.passengers)) {
          req.body.inbount.passengers.forEach((passenger, index) => {
            const baggage = Number(passenger.baggageAmount || 0);
            const meal = Number(passenger.mealAmount || 0);
            const seat = Number(passenger.seatAmount || 0);
            ssrAddonsTotal += baggage + meal + seat;
            
            customLog(req.LogTraceId, "info", {
              message: `Inbound passenger ${index + 1} SSR addons`,
              baggage,
              meal,
              seat,
              passengerTotal: baggage + meal + seat
            });
          });
        }
        
        // Total amount = base fare + SSR addons
        calculatedAmount = Number(cachedBaseAmount) + Number(ssrAddonsTotal);
        
        customLog(req.LogTraceId, "info", {
          message: "Airline base amount calculation completed",
          traceId,
          cachedBaseAmount: Number(cachedBaseAmount),
          ssrAddonsTotal: Number(ssrAddonsTotal),
          calculatedAmount: Number(calculatedAmount),
          receivedAmount: Number(amount),
          amountMatch: Number(calculatedAmount) === Number(amount)
        });
        
        break;
      }
      // case "ecommerce": {
      //   const { cartId } = req.body;
      //   const cartTotal = await calculateCartTotals(cartId);
      //   if (!cartTotal) return next(new ErrorResponse("Cart not found", 404));

      //   calculatedAmount = cartTotal.grandTotal;
      //   break;
      // }

      // case "gift_cards_combined": {
      //   const { giftCardId } = req.body;
      //   const isValidAmount = await giftCardValidateFn({ giftCardId, amount });
      //   if (!isValidAmount?.isValid) {
      //     return handleError(req, res, "something went wrong");
      //   }

      //   accessKey = isValidAmount?.accessKey || accessKey;
      //   calculatedAmount = req.body.amount;
      //   // calculatedPgAmount = Number(calculatedAmount) + Number(surcharge);
      //   break;
      // }
      // case "travelApi_airline": {
      //   const { conversationId } = req.body;
      //   const cachedAmount = await getValue(`${accessKey}-${conversationId}-paymentAmount`);
      //   if (!cachedAmount) return handleError(req, res, "something went wrong");
      //   calculatedAmount = Number(cachedAmount || 0)
      //   break;
      // }
      case operatorsData["hotel"]["accessKey"]: {
        const { BookingCode } = req.body;
        const cachedAmount = await getValue(`${accessKey}-${BookingCode}-paymentAmount`);
        if (!cachedAmount) return handleError(req, res, "something went wrong");
        calculatedAmount = Number(cachedAmount || 0)
        break;
      }
      case operatorsData["bus"]["accessKey"]: {
        const { blockKey } = req.body;
        const cachedAmount = blockKey ? await getValue(`${accessKey}-${blockKey}-paymentAmount`) : null;
        if (!cachedAmount) {
          customLog(req.LogTraceId, "error", { action: "bus:blockRecordMissing", blockKey });
          return handleError(req, res, "Bus seat hold not found");
        }
        calculatedAmount = Number(cachedAmount);
        break;
      }
        case operatorsData["pekoWorks"]["accessKey"]: {
        const planData = await findOnePlanDetails({ id: req.body?.planId, credentialId: id })
        calculatedAmount = Number(planData?.data?.price || 0)
        break;
      }
      case operatorsData["hike"]["accessKey"]: {
        const { status, message, totalAmount } = await validateHikePayment(req.body, id);
        if (!status) return handleError(req, res, message || "Something went wrong");
        calculatedAmount = Number(totalAmount || 0);
        break;
      }

       case operatorsData["email_domain_service"]["accessKey"]:{
        const {planId, formDetails, billingType} = req.body;
        const expectedAmount = await validateBusinessEmail({planId,billingType, count: formDetails.numberOfUsers, credentialId: id})
        if(!expectedAmount || !expectedAmount.status) return handleError(req, res, "Something went wrong");
        calculatedAmount = Number(expectedAmount.amount || 0)
      
        break;
      }
      case operatorsData["challan"]["accessKey"]: {
        // No flat req.body.amount for challan — the base amount is the sum of each
        // selected challan's fine, matching how challan.js itself derives challanTotal.
        const { challans } = req.body;
        if (!Array.isArray(challans) || challans.length === 0) {
          return handleError(req, res, "No challans selected for payment");
        }
        calculatedAmount = challans.reduce((sum, c) => sum + Number(c.challan_price || 0), 0);
        amount = calculatedAmount;
        // The challan surcharge is charged per challan, as in challan.js.
        challanCount = challans.length;
        break;
      }
      case operatorsData["eSIM"]["accessKey"]:
      case operatorsData["eSIMTunz"]["accessKey"]: {
        const { orders, planIds } = req.body;

        if (!Array.isArray(orders) || !Array.isArray(planIds)) {
          return handleError(req, res, "orders and planIds arrays are required for eSIM");
        }

        if (orders.length !== planIds.length) {
          return handleError(req, res, "orders and planIds length mismatch");
        }

        customLog(req?.LogTraceId, 'info', {
          message: 'eSIM payment validation started',
          planIds,
          orders,
          clientAmount: amount,
        });

        const isValidAmount = await validateEsimPayment({ orders, planIds, amount, credentialId: id });

        if (!isValidAmount?.isValid) {
          customLog(req?.LogTraceId, 'error', {
            message: 'eSIM payment amount validation failed',
            planIds,
            clientAmount: amount,
            expectedTotal: isValidAmount?.totalAmount,
          });

          return handleError(req, res, "something went wrong");
        }

        const totalQuantity = orders.reduce((sum, o) => sum + Number(o.quantity || 1), 0);

        customLog(req?.LogTraceId, 'info', {
          message: 'eSIM amount validated successfully',
          totalAmount: isValidAmount.totalAmount,
          totalQuantity,
        });

        calculatedAmount = Number(isValidAmount.totalAmount);

        const esimSurchargeResult = await calculateSurchargeFn({
          credentialId: id,
          accessKey,
          packageId,
          corporateUserId: corporateId,
          orderAmount: calculatedAmount,
          quantity: totalQuantity,
        });

        surcharge = esimSurchargeResult.surcharge;
        serviceOperatorId = esimSurchargeResult.serviceOperatorId;

        calculatedPgAmount = Number(calculatedAmount) + Number(surcharge);
        esimBulkAmount = Number(calculatedPgAmount);

        customLog(req?.LogTraceId, 'info', {
          message: 'eSIM final payable amount calculated',
          baseAmount: isValidAmount.totalAmount,
          surcharge,
          totalQuantity,
          finalPgAmount: calculatedPgAmount,
          serviceOperatorId,
        });

        break;
      }
      case "whatsApp_for_busines": {
        const { status, message, amount, pgAmount: resultPgAmount, botBuilder, shopifyIntegration } = await validateWhatsappForBusiness({ body: req.body, credentialId: id }, next);
        if (!status) {
          return handleError(req, res, message || "something went wrong");
        }
        if (normalizeAmount(req.body.botBuilder || 0) !== normalizeAmount(botBuilder || 0)) {
          return handleError(req, res, "Bot Builder add-on amount mismatch");
        }
        if (normalizeAmount(req.body.shopifyIntegration || 0) !== normalizeAmount(shopifyIntegration || 0)) {
          return handleError(req, res, "Shopify Integration add-on amount mismatch");
        }
        calculatedAmount = amount;
        calculatedPgAmount = resultPgAmount;
        break;
      }

      case operatorsData["prepaid"]["accessKey"]: {
        const { account, serviceProvider } = req.body;

        // Validate required fields as expected by prepaid controller
        if (!account || !serviceProvider) {
          customLog(req.LogTraceId, "error", {
            message: "Missing required fields for mobile recharge",
            accessKey,
            hasAccount: !!account,
            hasServiceProvider: !!serviceProvider
          });
          return handleError(req, res, "Missing required fields for recharge");
        }

        // Validate mobile number format (10-14 digits)
        if (!/^[0-9]{10,14}$/.test(account)) {
          customLog(req.LogTraceId, "error", {
            message: "Invalid mobile number format",
            accessKey,
            account
          });
          return handleError(req, res, "Invalid mobile number");
        }

        customLog(req.LogTraceId, "info", {
          message: "Mobile recharge prepaid amount validation",
          accessKey,
          account,
          serviceProvider,
          receivedAmount: amount,
          receivedPgAmount: pgAmount
        });

        req.body.quoteScope = quoteScope;
        const vendorAmount = await getVendorAmount(amount, accessKey, {
          serviceProvider,
          credentialId: id,
          scope: quoteScope,
        });
        if (vendorAmount === null) {
          customLog(req.LogTraceId, "error", {
            message: "Prepaid amount is not one of the listed plan prices",
            accessKey,
            serviceProvider,
            account,
            amount,
          });
          return res.status(400).json({
            status: false,
            data: {},
            message: "Plan prices have changed. Please reload the plans.",
            statusCode: "001",
          });
        }

        calculatedAmount = Number(amount);
        break;
      }

      case operatorsData["logistics"]["accessKey"]: {
        req.body.quoteScope = quoteScope;
        if ((await getVendorAmount(amount, accessKey, { credentialId: id, scope: quoteScope })) === null) {
          customLog(req.LogTraceId, "error", {
            message: "Logistics amount is not one of the listed delivery prices",
            accessKey,
            amount,
          });
          return res.status(400).json({
            status: false,
            data: {},
            message: "Delivery prices have changed. Please check the delivery fee again.",
            statusCode: "001",
          });
        }

        calculatedAmount = Number(amount);
        break;
      }

      case operatorsData["domainAndHosting"]["accessKey"]: {
        const userData = req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId
          ? { subCorporateUserId: req.user.subCorporateId }
          : { corporateUserId: req.user.corporateId || corporateId };

        const cart = await ServiceCartUseCase.getAllProductsInMyCart(userData);
        if (!cart || cart === -1) {
          return handleError(req, res, 'Your cart is empty');
        }

        const cartItems = cart.productsArray;
        if (!cartItems || cartItems.length === 0) {
          return handleError(req, res, 'Your cart is empty');
        }

        const cached = await getValue('reseller_pricing');
        const pricingData = cached ? JSON.parse(cached) : null;

        let cartTotal = 0;
        for (const item of cartItems) {
          if (!pricingData) {
            cartTotal += parseFloat(item.totalPrice || 0);
            continue;
          }

          let unitPrice = null;
          let billingMultiplier = 1;

          if (item.itemType === 'domain') {
            unitPrice = resolveDomainHostingPrice(pricingData, item.productId, 'domain', null, item.billingCycle || 1);
            billingMultiplier = item.billingCycle || 1;
          } else {
            const cycle = item.billingCycle || null;
            unitPrice = resolveDomainHostingPrice(pricingData, item.productId, item.itemType, item.planId, cycle);
            if (cycle) billingMultiplier = cycle;
          }

          if (unitPrice == null) {
            cartTotal += parseFloat(item.totalPrice || 0);
            continue;
          }

          const qty = item.productQuantity || 1;
          const addonUnitPrice = parseFloat(item.addonUnitPrice || 0);
          const storageMultiplier = item.itemType === 'backup' ? (item.storageInGb || 1) : 1;
          cartTotal += parseFloat(((unitPrice + addonUnitPrice) * qty * billingMultiplier * storageMultiplier).toFixed(2));
        }

        calculatedAmount = parseFloat(cartTotal.toFixed(2));

        const availability = await checkServiceAvailability(cartItems);
        if (!availability.available) {
          return handleError(req, res, `The service for ${availability.domainName} is no longer available. Please update your cart and try again.`);
        }

        break;
      }

      case operatorsData["corporateCards"]["accessKey"]: {
        // Extra physical cards are priced like a plan: the plan's unitPrice is the pre-GST base and GST
        // is added on top. Checked here, before the order, so a wrong total is refused before any money moves.
        const serviceDetails = await fetchServiceDetails({
          credentialId: id,
          accessKey,
          packageId,
          corporateUserId: corporateId,
        });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
          return handleError(req, res, "Apologies, the service you are trying to access is currently unavailable.");
        }
        const pricing = await calculatePhysicalCardPrice({ serviceDetails, quantity: req.body.quantity });
        if (pricing.error) {
          return handleError(req, res, pricing.error);
        }
        const isPriceValid =
          normalizeAmount(amount) === pricing.taxableAmount &&
          normalizeAmount(pgAmount) === pricing.expectedPaymentAmount;
        if (!isPriceValid) {
          customLog(req.LogTraceId, "error", {
            message: "Physical card amount validation failed",
            accessKey,
            receivedAmount: normalizeAmount(amount),
            receivedPgAmount: normalizeAmount(pgAmount),
            taxableAmount: pricing.taxableAmount,
            expectedPaymentAmount: pricing.expectedPaymentAmount,
          });
          return handleError(req, res, "Amount mismatch");
        }
        return next();
      }

      case operatorsData["visa"]["accessKey"]: {
        // The visa price must be one the search quoted; a retry of an existing order has no new price to check.
        if (
          !req.body.orderNumber &&
          !(await getVendorQuote(req.body.visa_amount ?? amount, accessKey, {
            credentialId: id,
            scope: quoteScope,
            match: (item) => String(item.product_id) === String(req.body.product_id),
          }))
        ) {
          customLog(req.LogTraceId, "error", {
            message: "Visa amount is not one of the quoted prices",
            accessKey,
            amount,
            productId: req.body.product_id,
          });
          return res.status(400).json({
            status: false,
            data: {},
            message: "Visa price has changed. Please search again.",
            statusCode: "001",
          });
        }
        // Ensure a valid email exists for the Cashfree order (some visa users may have none).
        if (!req.user.email) {
          req.user.email = `user${req.user.id}@peko.one`;
        }
        calculatedAmount = Number(amount);
        break;
      }

      case operatorsData["subscriptionPlans"]["accessKey"]:
      case operatorsData["ecommerceStore"]["accessKey"]: {
        const packageDetails = await findPackage({ id: req.body.packageId });
        if (
            !packageDetails ||
            (accessKey === operatorsData["ecommerceStore"]["accessKey"] &&
                packageDetails.accessCode !== accessKey)
        ) {
            return handleError(req, res, "Invalid package selected");
        }
        const pricing = await calculateSubscriptionPrice({
          corporateId,
          credentialId: id,
          packageDetails,
          billingType: String(req.body.billingType || req.body.subscriptionDuration || "").trim().toUpperCase(),
          couponCode: req.body.couponCode,
          partnerId: req.user.registeredBy,
        });
        calculatedAmount = pricing.expectedPaymentAmount;
        if (req.body.couponCode) req.body.couponTotalDiscount = pricing.couponDiscount;
        break;
      }

      default:
        if (simpleValidationAccessKeys.has(accessKey)) {
          calculatedAmount = Number(amount);
        } else {
          return next();
        }
    }

       if (calculatedAmount !== undefined && calculatedAmount !== null) {
        calculatedAmount = normalizeAmount(Number(calculatedAmount));
      }

    // For bill payment services, CCF1 is part of the transaction amount
    const isBillPaymentKey = (key) => key.startsWith('bbps_') || key === 'billavenue';
    let ccf1Rupees = 0;
    if (isBillPaymentKey(accessKey) && req.body.ccf1Amount) {
      ccf1Rupees = parseFloat(req.body.ccf1Amount) / 100;
    }

    // Skip surcharge recalculation for eSIM bulk orders (already calculated above)
    const isEsimBulk = accessKey === operatorsData["eSIM"]["accessKey"] || accessKey === operatorsData["eSIMTunz"]["accessKey"];

    const itemQuantity = challanCount || Number(req.body.number_of_items) || 1;

    if (!isEsimBulk || !calculatedPgAmount) {
      customLog(req.LogTraceId, "info", {
        message: "Calculating surcharge for payment gateway amount",
        accessKey,
        calculatedAmount: Number(calculatedAmount),
        ccf1Rupees,
        itemQuantity,
        credentialId: id,
        packageId,
        corporateUserId: corporateId
      });

      const result = await calculateSurchargeFn({
        credentialId: id,
        accessKey,
        packageId,
        corporateUserId: corporateId,
        orderAmount: normalizeAmount(Number(calculatedAmount) + ccf1Rupees) ,
        quantity: itemQuantity,
      });
      surcharge = result.surcharge;
      serviceOperatorId = result.serviceOperatorId;
    }

    customLog(req.LogTraceId, "info", {
      message: "Surcharge calculated",
      accessKey,
      surcharge: Number(surcharge),
      serviceOperatorId,
      calculatedAmount: Number(calculatedAmount)
    });

     if(accessKey === operatorsData["whatsAppForBusiness"]["accessKey"]){
      calculatedPgAmount = Number(Number(calculatedPgAmount) + Number(surcharge)).toFixed(2);
      customLog(req.LogTraceId, "info", {
        message: "WhatsApp for Business PG amount calculated",
        calculatedPgAmount: Number(calculatedPgAmount),
        surcharge: Number(surcharge)
      });
    } else {
      if (accessKey === operatorsData["eSIM"]["accessKey"] || accessKey === operatorsData["eSIMTunz"]["accessKey"]){
        // For eSIM bulk, use the already-calculated pgAmount (includes surcharge and quantity)
        calculatedPgAmount = Number(esimBulkAmount).toFixed(2);
        customLog(req.LogTraceId, "info", {
          message: "eSIM bulk PG amount calculated (already includes surcharge)",
          calculatedPgAmount: Number(calculatedPgAmount),
          esimBulkAmount: Number(esimBulkAmount)
        });
      }
      else {
        calculatedPgAmount = normalizeAmount(
          Number(calculatedAmount) + Number(surcharge) + ccf1Rupees
        );
        customLog(req.LogTraceId, "info", {
          message: "Standard PG amount calculated",
          accessKey,
          calculatedAmount: Number(calculatedAmount),
          surcharge: Number(surcharge || 0),
          ccf1Rupees,
          calculatedPgAmount: Number(calculatedPgAmount)
        });
      }
    }

    
    if (req.body.couponCode && accessKey !== operatorsData["subscriptionPlans"]["accessKey"] && accessKey !== operatorsData["ecommerceStore"]["accessKey"]) {
      const { data } = await findOneCoupon({
        couponCode: req.body.couponCode,
        corporateUserId: corporateId,
        serviceId: serviceOperatorId,
        partnerId: req.user.registeredBy,
        accessKey:req.body.accessKey,
        packageId: req.body.packageId
      })
      if (data) {
          if (data.couponData?.minimumPurchase > 0 && calculatedPgAmount < parseFloat(data.couponData.minimumPurchase)) {
          return handleError(req, res, `This coupon can only be used on purchases of AED ${data.couponData.minimumPurchase} or more.`);
        }
        const result = calculateDiscountResponse(data.couponData, calculatedPgAmount)
        if (!data.id && parseFloat(result?.data?.discountAmount) >= calculatedPgAmount) {
          return handleError(req, res, `This coupon cannot be applied because the discount is more than the order amount.`);
        }
        req.body.couponTotalDiscount = result?.data?.couponTotalDiscount
        calculatedPgAmount = normalizeAmount(Number(calculatedPgAmount) - Number(result?.data?.discountAmount));
      }
    }
    

    if (isBillPaymentKey(accessKey) && req.body.billerResponse) {
      const br = req.body.billerResponse;
      const reqAmount = Number(amount);

      if (br.billAmount !== undefined && br.billAmount !== null) {
        const fetchedBillAmount = normalizeAmount(br.billAmount);
        const enteredAmount = normalizeAmount(reqAmount);
        const billerRecord = await findRecordByBillerId(req.body.billerId);
        if (!billerRecord) {
          customLog(req.LogTraceId, "error", {
            message: "BBPS biller MDM record not found during amount validation",
            accessKey,
            billerId: req.body.billerId,
          });
          return handleError(req, res, "Something went wrong. Please try again later or contact support if the issue persists.");
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
          customLog(req.LogTraceId, "error", {
            message: "BBPS billerResponse.billAmount mismatch",
            accessKey,
            exactness,
            amount: reqAmount,
            billAmount: Number(br.billAmount),
          });
          return handleError(req, res, "Amount mismatch");
        }
      }
    }

    const finalAmount = normalizeAmount(amount);
    const finalCalculatedAmount = normalizeAmount(calculatedAmount);
    const finalPgAmount = normalizeAmount(pgAmount);
    const finalCalculatedPgAmount = normalizeAmount(calculatedPgAmount);

   customLog(req.LogTraceId, 'info', {
      message: "Final amount validation comparison",
      accessKey,
      receivedAmount: finalAmount,
      calculatedAmount: finalCalculatedAmount,
      receivedPgAmount: finalPgAmount,
      calculatedPgAmount: finalCalculatedPgAmount,
      amountMatch: finalAmount === finalCalculatedAmount,
      pgAmountMatch: finalPgAmount === finalCalculatedPgAmount,
      amountDifference: Math.abs(finalAmount - finalCalculatedAmount),
      pgAmountDifference: Math.abs(finalPgAmount - finalCalculatedPgAmount),
      couponTotalDiscount: req.body.couponTotalDiscount
    })

    const isAmountValid =
      finalAmount === finalCalculatedAmount &&
      finalPgAmount === finalCalculatedPgAmount;
    if (!isAmountValid) {
      customLog(req.LogTraceId, "error", {
        message: "Amount validation failed",
        accessKey,
        receivedAmount: finalAmount,
        calculatedAmount: finalCalculatedAmount,
        receivedPgAmount: finalPgAmount,
        calculatedPgAmount: finalCalculatedPgAmount,
        amountMatch: finalAmount === finalCalculatedAmount,
        pgAmountMatch: finalPgAmount === finalCalculatedPgAmount,
        amountDifference: Math.abs(finalAmount - finalCalculatedAmount),
        pgAmountDifference: Math.abs(finalPgAmount - finalCalculatedPgAmount)
      });
      return handleError(req, res, "Amount mismatch");
    }

    customLog(req.LogTraceId, "info", {
      message: "Amount validation successful",
      accessKey,
      finalAmount,
      finalPgAmount
    });

    return next();
  } catch (error) {
    console.log("EROROR",error)
    customLog(req.LogTraceId, "error", {
      error,
      message: "Error while validating the amount",
    });
    return handleError(req, res, "something went wrong");
  }
};

/**
 * Helper to calculate surcharge
 */
const calculateSurchargeFn = async ({
  credentialId,
  accessKey,
  packageId,
  corporateUserId,
  orderAmount,
  quantity = 1,
}) => {
  if (
    accessKey === operatorsData["subscriptionPlans"]["accessKey"] ||
    accessKey === operatorsData["ecommerceStore"]["accessKey"]
  ) {
    return { surcharge: 0, serviceOperatorId: null };
  }
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });

  if (serviceDetails.error) {
    customLog(null, 'error', { message: 'Error while fetching the service details', error: serviceDetails?.error })
    throw new Error("Error while calculating surcharge");
  }

  const { surcharge, surchargeType } = serviceDetails;
  const totalSurcharge = await calculateSurcharge(surcharge, surchargeType, orderAmount, credentialId, quantity);
  return { surcharge: await calculateAmountWithTax(totalSurcharge), serviceOperatorId: serviceDetails.id };
};


/**
 * Centralized error response helper
 */
function handleError(req, res, message) {
    customLog(req.LogTraceId, "error", { message });
    return res.status(400).json({
        status: false,
        data: {},
        message: 'something went wrong',
        statusCode: "001",
    });
}

module.exports = validateAmount;
