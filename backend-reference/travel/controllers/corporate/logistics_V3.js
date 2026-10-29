const { getValue, setValue } = require("../../utils/cacheDataMethods");
const {
  fetchServiceDetails,
  findServiceOperatorByAccessKey,
  calculateSurcharge,
} = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
const axios = require("axios");
const moment = require("moment");
const { customLog } = require("../../utils/loggerHelper");
const { uploadFile } = require("../../utils/commonUploadFile");
const {
  createWalletTransaction,
  refundWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
// calculateAmountWithTax removed — no VAT/GST applied for India logistics
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { createNotification } = require("../../models/use-cases/notification");
const { commonFailedTemplate } = require("../../utils/emailTemplates/common");
const { BalanceEmailTemplate } = require("../../utils/emailTemplates/AgencyBalanceEmail");
const { findByEmail } = require("../../models/use-cases/settings");
const emailer = require("../../utils/emailer");
const { createExpense } = require("./expense");
const {
  generatePaymentSuccessEmailLogisticsV3,
  generatePaymentSuccessEmailReturnLogisticsV3,
  generateReturnCompletionSuccessEmailLogisticsV3,
  generateShipmentCancelAdminInformEmailLogisticsV3,
} = require("../../utils/emailTemplates/logistics");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables } = require("../../utils/emailTemplate/sharedLayout");
const { generateOrderInvoiceAttachments } = require("../../services/invoiceAndReceipt");
const { computeJournalData } = require("../../utils/computeJournalData");
const { publishJournalEvent } = require("../../utils/bull/queue/accountingEventsQueue");
const { findOneOrderByTxnId } = require("../../models/use-cases/order");
const { applyServiceCommission, getVendorAmount, getQuoteScope } = require("../../utils/applyCommissionMarkup");
const asyncHandler = require("../../middlewares/async");
const {
  createShipmentOrder,
  updateOrderByCorporateTxnId,
  updateStatusAndTracking,
  findShipmentById,
  fetchOrderHistory,
  updateShipmentEntry,
  findPanByCredentialId,
} = require("../../models/use-cases/logistics");
const { createPGTransaction } = require("../../utils/pamentGatewayTransaction");
const { statusMapping } = require("./../../utils/logisticsStatusMapping");
// const cityData = require("../../public/CityData.json");
const shipmentOrders = require("../../models/entities/shipmentOrders");
const {
  getShipmentCancelInformMails,
} = require("../../models/use-cases/setting");
// const {
//   recordToZohoJournal,
//   recordRefundToZohoJournal,
// } = require("../../utils/zohoAccountMethods");

const accessKey = "shipment_services";
const googleAccessKey = "google_service";

// ─── Shiprocket Auth ─────────────────────────────────────────────────────────
// vendor.optional1  = Shiprocket account password
// vendor.optional2  = Shiprocket account email
// vendor.optional3  = whitelisted IPs for webhook
// vendor.optional4  = Shiprocket pickup location name (defaults to "Primary")
// Token is valid for 10 days; we cache for 24 hours to be safe.

async function getShiprocketToken(API_URL, email, password) {
  let redisKey = `${accessKey}-refresh-token`;
  const cached = await getValue(redisKey);
  if (cached) return cached;

  try {
    const config = {
      method: "POST",
      url: `${API_URL}/v1/external/auth/login`,
      headers: { "Content-Type": "application/json" },
      data: { email, password },
    };
    customLog(
      null,
      "info",
      { message: "Shiprocket /auth/login Request" },
      "VENDOR",
      ["password"],
    );

    const response = await axios(config);
    customLog(null, "info", {
      message: "Shiprocket /auth/login Response",
      status: response.status,
    });

    const token = response?.data?.token;
    if (!token) return false;

    // cache for 24 hours (non-fatal if Redis is unavailable)
    try {
      await setValue(redisKey, 24 * 60 * 60, token);
    } catch (cacheErr) {
      customLog(null, "error", { message: "Failed to cache Shiprocket token", err: cacheErr?.message });
    }
    return token;
  } catch (error) {
    customLog(null, "error", {
      message: "Error fetching Shiprocket token",
      data: error?.response?.data || error,
    });
    return false;
  }
}

// ─── Shipment ID Resolution ──────────────────────────────────────────────────
// Older orders only ever captured Shiprocket's order_id (stored as vendorOrderId),
// never the distinct shipment_id the Generate Label API requires. Resolve it live
// via the order-details endpoint so those orders don't need a one-off backfill script.
async function getShiprocketShipmentIdFromOrder(API_URL, token, orderId, traceId) {
  const url = `${API_URL}/v1/external/orders/show/${orderId}`;
  try {
    customLog(traceId, "info", {
      message: "Shiprocket /orders/show Request",
      orderId,
      url,
    });
    const response = await axios({
      method: "GET",
      url,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const shipments = response?.data?.data?.shipments;
    const shipment = Array.isArray(shipments) ? shipments[0] : shipments;
    customLog(traceId, "info", {
      message: "Shiprocket /orders/show Response",
      orderId,
      status: response?.status,
      resolvedShipmentId: shipment?.id || null,
      responseData: response?.data,
    });
    return shipment?.id || null;
  } catch (error) {
    customLog(traceId, "error", {
      message: "Shiprocket /orders/show Error — could not resolve shipment id from order",
      orderId,
      url,
      status: error?.response?.status,
      data: error?.response?.data || error?.message || error,
    });
    return null;
  }
}

// ─── Postcode Lookup ─────────────────────────────────────────────────────────
// Resolves city + state from postcode. Tries Shiprocket first, then India Postal API.
async function getCityStateFromPostcode(API_URL, token, postcode) {
  // 1️⃣ Try Shiprocket open postcode endpoint
  try {
    const resp = await axios({
      method: "GET",
      url: `${API_URL}/v1/external/open/postcode/details?postcode=${postcode}`,
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    });
    customLog(null, "info", { message: "Shiprocket postcode raw response", postcode, response: resp?.data });
    const d = resp?.data?.postcode_details || resp?.data?.data || resp?.data;
    const city = d?.city || d?.district || "";
    const state = d?.state || "";
    if (city && state) {
      return { city, state };
    }
  } catch (e) {
    customLog(null, "error", {
      message: "Shiprocket postcode lookup failed",
      postcode,
      err: e?.response?.data || e?.message,
    });
  }

  // 2️⃣ Fallback: India Postal Pincode API (free, no auth)
  try {
    const resp = await axios({
      method: "GET",
      url: `https://api.postalpincode.in/pincode/${postcode}`,
      timeout: 8000,
    });
    customLog(null, "info", {
      message: "India postal raw response",
      postcode,
      response: resp?.data?.[0]?.Status,
    });
    const postOffices = resp?.data?.[0]?.PostOffice;
    if (Array.isArray(postOffices) && postOffices.length > 0) {
      const city =
        postOffices[0].District ||
        postOffices[0].Block ||
        postOffices[0].Name ||
        "";
      const state = postOffices[0].State || "";
      return { city, state };
    }
  } catch (e) {
    customLog(null, "error", {
      message: "India postal pincode lookup failed",
      postcode,
      err: e?.message,
    });
  }

  customLog(null, "error", {
    message: "Could not resolve city/state for postcode",
    postcode,
  });
  return { city: "", state: "" };
}

// ─── POST /lookup-postcode  (domestic — India only) ──────────────────────────
exports.lookupPostcode = asyncHandler(async (req, res, next) => {
  const { postcode } = req.query;
  if (!postcode) return next(new ErrorResponse("postcode is required", 400));
  if (!/^[1-9][0-9]{5}$/.test(postcode)) {
    return res
      .status(400)
      .json({
        status: false,
        message: "Invalid PIN code",
        responseCode: "003",
        data: {},
      });
  }

  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  if (serviceDetails?.error)
    return next(new ErrorResponse("Service unavailable", 502));

  const API_URL = serviceDetails.vendor.apiUrl;
  const token = await getShiprocketToken(
    API_URL,
    serviceDetails.vendor.optional2,
    serviceDetails.vendor.optional1,
  );
  if (!token)
    return next(new ErrorResponse("Unable to reach logistics provider", 502));

  const { city, state } = await getCityStateFromPostcode(
    API_URL,
    token,
    postcode,
  );

  if (!city && !state) {
    return res
      .status(400)
      .json({
        status: false,
        message: "Invalid PIN code",
        responseCode: "003",
        data: {},
      });
  }

  return res
    .status(200)
    .json({
      status: true,
      message: "Postcode resolved",
      responseCode: "000",
      data: { city, state },
    });
});

// ─── POST /lookup-international-postcode  (international — any country) ───────
// Uses Shiprocket's country location API.
exports.lookupInternationalPostcode = asyncHandler(async (req, res, next) => {
  const { postcode, countryCode } = req.query;
  if (!postcode) return next(new ErrorResponse("postcode is required", 400));
  if (!countryCode)
    return next(new ErrorResponse("countryCode is required", 400));

  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  if (serviceDetails?.error)
    return next(new ErrorResponse("Service unavailable", 502));

  const API_URL = serviceDetails.vendor.apiUrl;
  const token = await getShiprocketToken(
    API_URL,
    serviceDetails.vendor.optional2,
    serviceDetails.vendor.optional1,
  );
  if (!token)
    return next(new ErrorResponse("Unable to reach logistics provider", 502));

  try {
    const resp = await axios({
      method: "GET",
      url: `${API_URL}/v1/countries/location/${countryCode}/${postcode}`,
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
    });

    const locations = resp?.data?.data;
    if (!locations || locations.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Could not resolve location for this postcode",
        responseCode: "002",
        data: {},
      });
    }

    const city = locations.find((l) => l.type === 2)?.name || "";
    const state = locations.find((l) => l.type === 1)?.name || "";

    return res.status(200).json({
      status: true,
      message: "Postcode resolved",
      responseCode: "000",
      data: { city, state },
    });
  } catch (e) {
    customLog(req?.LogTraceId, "error", {
      message: "Shiprocket international postcode lookup failed",
      postcode,
      countryCode,
      err: e?.message,
    });
    return next(
      new ErrorResponse(
        "Could not resolve postcode. Please enter city manually.",
        400,
      ),
    );
  }
});

// ─── Shared country list fetcher (cache-first, Shiprocket fallback) ──────────
async function getCountriesList() {
  const cacheKey = `${accessKey}-countries-list`;
  let countries = await getValue(cacheKey);
  if (countries && countries.length) return countries;

  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);
  if (serviceDetails?.error) return [];

  const token = await getShiprocketToken(
    serviceDetails.vendor.apiUrl,
    serviceDetails.vendor.optional2,
    serviceDetails.vendor.optional1,
  );
  if (!token) return [];

  const response = await axios({
    method: "GET",
    url: `${serviceDetails.vendor.apiUrl}/v1/external/countries`,
    headers: { Authorization: `Bearer ${token}` },
  });

  const rawList = response?.data?.data || response?.data?.countries || [];
  countries = rawList.map((c) => ({
    name: c.name,
    alpha2Code: c.iso_code_2 || c.iso_code_3 || "",
    country_id: c.id,
  }));

  if (countries.length > 0) {
    try {
      await setValue(cacheKey, 24 * 60 * 60, countries);
    } catch (cacheErr) {
      customLog(null, "error", { message: "Failed to cache countries", err: cacheErr?.message });
    }
  }
  return countries;
}

exports.fetchCountries = asyncHandler(async (req, res) => {
  const query = req.query.searchText;
  const countries = await getCountriesList();

  if (query) {
    const filtered = countries.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase()),
    );
    return res
      .status(200)
      .json({
        status: true,
        message: "Countries fetched successfully",
        responseCode: "000",
        data: { countries: filtered },
      });
  }

  return res
    .status(200)
    .json({
      status: true,
      message: "Countries fetched successfully",
      responseCode: "000",
      data: { countries },
    });
});

// exports.getCitiesByCountry = asyncHandler(async (req, res) => {
//     const { countryName, searchText } = req.query;

//     // Return empty array if countryName is missing or empty
//     if (!countryName || countryName.trim() === '') {
//         return res.status(200).json({
//             status: true,
//             message: `No cities found`,
//             data: [],
//             responseCode: '000',
//         });
//     }

//     // Find the country (case-insensitive)
//     const country = cityData.countries.find(
//         (c) => c.name.toLowerCase() === countryName.toLowerCase()
//     );

//     if (!country) {
//         return res.status(200).json({
//             status: true,
//             message: `No cities found`,
//             data: [],
//             responseCode: '000',
//         });
//     }

//     let cities = country.cities;

//     // Apply search filter
//     if (searchText) {
//         const searchLower = searchText.toLowerCase();
//         cities = cities.filter((city) =>
//             city.toLowerCase().includes(searchLower)
//         );
//     }

//     if (!cities.length) {
//         return res.status(200).json({
//             status: true,
//             message: `No cities found`,
//             data: [],
//             responseCode: '000',
//         });
//     }

//     const cityList = cities.map((city) => ({
//         cityName: city,
//         countryName: country.name.toUpperCase(),
//     }));

//     return res.status(200).json({
//         status: true,
//         message: `Successfully retrieved cities for ${country.name}`,
//         data: cityList,
//         responseCode: '000',
//     });
// });

exports.getCityList = async (req, res, next) => {
  const { searchText = "" } = req.query;
  if (
    !searchText ||
    typeof searchText !== "string" ||
    searchText.trim() === ""
  ) {
    return next(new ErrorResponse("Search text is required.", 400));
  }
  try {
    const serviceDetails =
      await findServiceOperatorByAccessKey(googleAccessKey);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(
        new ErrorResponse(
          "The logistics service is temporarily unavailable. Please try again later.",
          503,
        ),
      );
    }

    const API_URL = serviceDetails.vendor.apiUrl;
    const googleApiKey = serviceDetails.vendor.optional1; // api key

    const payload = {
      input: searchText,
      includedPrimaryTypes: [
        "administrative_area_level_2",
        "locality",
        "administrative_area_level_3",
      ],
      languageCode: "en-US",
    };

    const config = {
      method: "POST",
      url: `${API_URL}/v1/places:autocomplete`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Goog-Api-Key": googleApiKey,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text.text",
      },
      data: payload,
      timeout: 10_000, // optional: fail fast if external API is slow
    };

    customLog(
      req?.LogTraceId,
      "info",
      { message: "google city list api Request", request: config },
      "VENDOR",
      ["X-Goog-Api-Key"],
    );

    const response = await axios(config);

    customLog(
      req?.LogTraceId,
      "info",
      { message: "google city list api Response", response: response?.data },
      "VENDOR",
    );

    // Basic validation of response shape
    const suggestions = response?.data?.suggestions;
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return next(
        new ErrorResponse(
          "No matching cities found for the provided search text. Please try different words.",
          404,
        ),
      );
    }

    // Map suggestions -> { value: placeId, label: text }
    const cities = suggestions
      .map((s) => {
        const placePrediction = s?.placePrediction;
        const placeId = placePrediction?.placeId ?? null;
        const textObj = placePrediction?.text;
        const labelText = textObj?.text ?? null;

        // filter out invalid entries
        if (!placeId || !labelText) return null;

        return { value: placeId, label: labelText };
      })
      .filter(Boolean); // remove nulls

    if (cities.length === 0) {
      return next(
        new ErrorResponse(
          "No matching cities found for the provided search text. Please try different words.",
          404,
        ),
      );
    }

    return res.status(200).json({
      status: true,
      message: "Cities fetched successfully",
      responseCode: "000",
      data: {
        cities,
      },
    });
  } catch (error) {
    // Log detailed error for debugging
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "Error fetching city list from places API",
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "Error fetching city list",
        data: error,
      });
    }
    return next(
      new ErrorResponse(
        "Something went wrong while fetching city suggestions. Please try again.",
        500,
      ),
    );
  }
};

exports.getCityDetails = async (req, res, next) => {
  const { placeId } = req.query;
  if (!placeId || typeof placeId !== "string" || placeId.trim() === "") {
    return next(new ErrorResponse("Place Id is required.", 400));
  }
  try {
    const serviceDetails =
      await findServiceOperatorByAccessKey(googleAccessKey);
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(
        new ErrorResponse(
          "The logistics service is temporarily unavailable. Please try again later.",
          503,
        ),
      );
    }
    const API_URL = serviceDetails.vendor.apiUrl;
    const googleApiKey = serviceDetails.vendor.optional1; // api key

    const config = {
      method: "GET",
      url: `${API_URL}/v1/places/${encodeURIComponent(placeId)}?key=${encodeURIComponent(googleApiKey)}&fields=addressComponents,displayName,formattedAddress`,
      headers: {
        Accept: "application/json",
      },
      timeout: 10_000,
    };

    customLog(
      req?.LogTraceId,
      "info",
      { message: "place details request", request: config },
      "VENDOR",
    );

    const response = await axios(config);
    customLog(req?.LogTraceId, "info", {
      message: "place details response",
      response: response?.data,
    });

    const place = response?.data;
    if (!place || typeof place !== "object") {
      return next(
        new ErrorResponse(
          "Delivery is currently unavailable for the chosen route.",
          404,
        ),
      );
    }

    // addressComponents is expected to be an array
    const addressComponents = Array.isArray(place.addressComponents)
      ? place.addressComponents
      : [];

    // Helper to find component by type
    const findComponent = (types) =>
      addressComponents.find(
        (c) => Array.isArray(c.types) && types.some((t) => c.types.includes(t)),
      );

    // Prefer locality, then administrative_area_level_3, then administrative_area_level_2
    const cityComponent =
      findComponent(["locality"]) ||
      findComponent(["administrative_area_level_3"]) ||
      findComponent(["administrative_area_level_2"]);

    let cityName = cityComponent?.longText || cityComponent?.shortText || null;

    // Fallbacks if city not found from addressComponents
    if (!cityName) {
      // use displayName.text (e.g., "Mumbai")
      cityName = place.displayName?.text || null;
    }
    if (!cityName) {
      // as a last resort, use the first segment of formattedAddress
      if (
        typeof place.formattedAddress === "string" &&
        place.formattedAddress.trim().length > 0
      ) {
        cityName = place.formattedAddress.split(",")[0].trim();
      }
    }

    // State: administrative_area_level_1
    const stateComponent = findComponent(["administrative_area_level_1"]);
    const state = stateComponent?.longText || stateComponent?.shortText || null;

    // Country code: look for address component with type 'country' and use shortText (alpha-2) if present
    const countryComponent = findComponent(["country"]);
    const countryCode = countryComponent?.shortText || null;
    const countryName = countryComponent?.longText || null;

    // Validate results
    if (!cityName || !countryCode) {
      // Log what we received for debugging
      customLog(req?.LogTraceId, "error", {
        message: "Incomplete place details received",
        placeId,
        cityName,
        countryCode,
        rawPlace: place,
      });

      return next(
        new ErrorResponse(
          "Could not determine city name and country code from the provided place. Please try a different place or contact support.",
          422,
        ),
      );
    }

    // Success
    return res.status(200).json({
      status: true,
      message: "Location details fetched successfully",
      responseCode: "000",
      data: {
        city: cityName,
        state: state || "",
        countryCode,
        countryName,
      },
    });
  } catch (error) {
    // Log details for debugging
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "Error fetching place details",
        status: error.response.status,
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "Error fetching place details",
        data: error,
      });
    }
    return next(
      new ErrorResponse(
        "Something went wrong while fetching location details. Please try again.",
        500,
      ),
    );
  }
};

exports.checkInternationalDeliveryFee = async (req, res, next) => {
  const {
    weight,
    originPostCode,
    destinationCountryCode,
    height,
    width,
    length,
  } = req.body;

  try {
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
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400,
        ),
      );
    }


    const API_URL = serviceDetails.vendor.apiUrl;
    const password = serviceDetails.vendor.optional1;
    const email = serviceDetails.vendor.optional2;

    const token = await getShiprocketToken(API_URL, email, password);
    if (!token) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400,
        ),
      );
    }

    const countryList = await getCountriesList();
    // Resolve alpha2Code from whatever the FE sends (alpha2, country_id, or country name)
    let resolvedCountry;
    if (destinationCountryCode) {
      resolvedCountry = countryList.find(
        (c) => c.name?.toLowerCase() === destinationCountryCode.toLowerCase(),
      );
    }
    const isoCode = resolvedCountry?.alpha2Code
    if (!isoCode) {
      return res.status(400).json({
        status: false,
        message: "Could not resolve destination country. Please try again.",
        responseCode: "003",
        data: {},
      });
    }

    const params = new URLSearchParams({
      pickup_postcode: originPostCode,
      delivery_country: isoCode,
      weight,
      cod: 0,
      ...(length && { length }),
      ...(width && { breadth: width }),
      ...(height && { height }),
    });

    const config = {
      method: "GET",
      url: `${API_URL}/v1/external/international/courier/serviceability?${params.toString()}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    customLog(
      req?.LogTraceId,
      "info",
      {
        message: "Shiprocket /courier/serviceability/international Request",
        request: config,
      },
      "VENDOR",
    );
    const response = await axios(config);
    customLog(req?.LogTraceId, "info", {
      message: "Shiprocket /courier/serviceability/international Response",
      response: response.data,
    });

    const availableCouriers = response?.data?.data?.available_courier_companies;
    if (!Array.isArray(availableCouriers) || availableCouriers.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Delivery is currently unavailable for the chosen route.",
        responseCode: "003",
        data: {},
      });
    }

    const deliveryCompanies = availableCouriers.map((company) => {
      const finalPrice = (Math.round(Number(company.rate?.rate ?? company.rate) * 100) / 100).toFixed(2);

      return {
        deliveryCompanyId: company.courier_company_id,
        courierName: company.courier_name,
        price: finalPrice,
        serviceType: company.courier_name,
        deliveryType: company.cod ? "COD" : "Prepaid",
        avgDeliveryTime: company.etd || "Standard",
        minWeight: company.min_weight,
        maxWeight: company.air_max_weight,
      };
    });

    await applyServiceCommission(deliveryCompanies, "price", accessKey, { credentialId, scope: getQuoteScope(req) });

    return res.status(200).json({
      status: true,
      message: "International delivery rates fetched successfully",
      responseCode: "000",
      data: { deliveryCompanies },
    });
  } catch (error) {
    const shiprocketMsg = error?.response?.data?.message || "";
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "error fetching international delivery fee",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "error fetching international delivery fee",
        data: error,
      });
    }
    // Shiprocket returns 4xx when no couriers are serviceable — treat as empty result, not a crash
    if (
      shiprocketMsg.toLowerCase().includes("no serviceable") ||
      shiprocketMsg.toLowerCase().includes("no courier") ||
      shiprocketMsg.toLowerCase().includes("not serviceable")
    ) {
      return res.status(200).json({
        status: true,
        message: "No couriers available for this route.",
        responseCode: "003",
        data: { deliveryCompanies: [] },
      });
    }
    return next(
      new ErrorResponse("Something went wrong. Please try again later.", 400),
    );
  }
};

exports.checkDeliveryFee = async (req, res, next) => {
  const { weight, originPostCode, destinationPostCode, height, width, length } =
    req.body;

  try {
    let serviceDetails;
    if (!req.user) {
      serviceDetails = await findServiceOperatorByAccessKey(accessKey);
    } else {
      const credentialId = req.user.id;
      const packageId = req.user.packageId;
      const corporateUserId = req.user.corporateId;
      serviceDetails = await fetchServiceDetails({
        credentialId,
        accessKey,
        packageId,
        corporateUserId,
      });
    }
    // return false
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400,
        ),
      );
    }

    const API_URL = serviceDetails.vendor.apiUrl;
    const password = serviceDetails.vendor.optional1;
    const email = serviceDetails.vendor.optional2;

    const token = await getShiprocketToken(API_URL, email, password);
    if (!token) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400,
        ),
      );
    }

    const params = new URLSearchParams({
      pickup_postcode: originPostCode,
      delivery_postcode: destinationPostCode,
      cod: 0,
      weight: weight,
      ...(length && { length }),
      ...(width && { breadth: width }),
      ...(height && { height }),
    });

    const config = {
      method: "GET",
      url: `${API_URL}/v1/external/courier/serviceability/?${params.toString()}`,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    customLog(
      req?.LogTraceId,
      "info",
      {
        message: "Shiprocket /courier/serviceability Request",
        request: config,
      },
      "VENDOR",
    );

    const response = await axios(config);

    customLog(req?.LogTraceId, "info", {
      message: "Shiprocket /courier/serviceability Response",
      response: response.data,
    });

    const availableCouriers = response?.data?.data?.available_courier_companies;
    if (!Array.isArray(availableCouriers) || availableCouriers.length === 0) {
      return res.status(400).json({
        status: true,
        message: "Delivery is currently unavailable for the chosen route.",
        responseCode: "003",
        data: {},
      });
      // return next(new ErrorResponse("Delivery is currently unavailable for the chosen route.", 400));
    }

    const deliveryCompanies = availableCouriers.map((company) => {
      const finalPrice = (Math.round(Number(company.rate?.rate ?? company.rate) * 100) / 100).toFixed(2);

      return {
        deliveryCompanyId: company.courier_company_id,
        courierName: company.courier_name,
        price: finalPrice,
        serviceType: company.courier_name,
        deliveryType: company.cod ? "COD" : "Prepaid",
        avgDeliveryTime: company.etd || "Standard",
        minWeight: company.min_weight,
        maxWeight: company.air_max_weight,
      };
    });

    await applyServiceCommission(deliveryCompanies, "price", accessKey, { credentialId: req.user?.id, scope: getQuoteScope(req) });

    return res.status(200).json({
      status: true,
      message: "delivery fetched successfully",
      responseCode: "000",
      data: {
        deliveryCompanies,
      },
    });
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "error fetching delivery fee",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "error fetching delivery fee",
        data: error,
      });
    }
    return next(
      new ErrorResponse("Something went wrong. Please try again later.", 400),
    );
  }
};

// ─── Internal: check vendor wallet balance ────────────────────────────────────
const checkVendorBalance = async (
  serviceDetails,
  token,
  orderAmount,
  LogTraceId,
) => {
  const API_URL = serviceDetails.vendor.apiUrl;

  const config = {
    method: "GET",
    url: `${API_URL}/v1/external/account/details/wallet-balance`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
  try {
    customLog(
      LogTraceId,
      "info",
      { message: "Shiprocket /wallet-balance Request", request: config },
      "VENDOR",
    );

    const response = await axios(config);

    customLog(LogTraceId, "info", {
      message: "Shiprocket /wallet-balance Response",
      response: response.data,
    });

    const vendorOrderAmount = Math.round(Number(orderAmount) * 100) / 100;
    if (vendorOrderAmount <= 0) return false;

    const walletBalance = Number(response?.data?.data?.balance_amount ?? 0);

    // Send internal alert if Shiprocket wallet drops below ₹1,000
    const LOW_BALANCE_THRESHOLD = 1000;
    if (walletBalance < LOW_BALANCE_THRESHOLD) {
      try {
        const result = await findByEmail({ name: "pekoWebsite" });
        const to = result?.details?.emails;
        if (to) {
          const templateDetails = await fetchPartnerDetails();
          const body = BalanceEmailTemplate({ CashBalance: walletBalance, vendorName: "Shiprocket" }, templateDetails);
          emailer.email(to, "Peko India | Shiprocket Low Balance Alert", body, () => {
            customLog(LogTraceId, "info", { message: "Shiprocket low balance alert sent", balance: walletBalance });
          });
        }
      } catch (alertErr) {
        customLog(LogTraceId, "error", { message: "Failed to send Shiprocket low balance alert", err: alertErr?.message });
      }
    }

    return walletBalance >= vendorOrderAmount;
  } catch (error) {
    customLog(LogTraceId, "error", {
      message: "Shiprocket /wallet-balance Error",
      data: error?.response?.data || error,
    });
    return false;
  }
};

exports.checkAgencyBalance = async (req, res, next) => {
  try {
    const credentialId = req.user.id;
    const packageId = req.user.packageId;
    const corporateUserId = req.user.corporateId;
    const amount = parseFloat(req.body.amount);

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      throw new Error("Service details fetch failed");
    }

    const API_URL = serviceDetails.vendor.apiUrl;
    const password = serviceDetails.vendor.optional1;
    const email = serviceDetails.vendor.optional2;

    const token = await getShiprocketToken(API_URL, email, password);
    if (!token) throw new Error("Failed to fetch Shiprocket token");

    // Shiprocket is paid the listed delivery price, not the marked-up amount the customer pays.
    const isBalanceExist = await checkVendorBalance(
      serviceDetails,
      token,
      (await getVendorAmount(amount, accessKey, { credentialId, scope: getQuoteScope(req) })) ?? amount,
      req?.LogTraceId,
    );

    if (!isBalanceExist) {
      throw new Error("Insufficient balance");
    }

    return res.status(200).json({
      status: true,
      responseCode: "000",
      message: "Agency balance check successful",
      data: {},
    });
  } catch (error) {
    customLog(req.LogTraceId, "error", {
      message: "Logistics check agency balance api failed",
      error: error?.response?.data || error,
    });
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
      ),
    );
  }
};

// ─── Payment / Create Shipment ────────────────────────────────────────────────
exports.payment = asyncHandler(async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;
  const emailId = req.user.email;
  const name = req.user.name;
  const accounts_id = req.user.accounts_id;
  // const customer_id = req.user.zoho_id;
  const subCorporateEmail = req.body.subCorporateEmail;

  // F-TRV-02: card payments are verified and settled by the payment-gateway service
  // (Cashfree callback → paymentGateway logisticsV3). This route must not accept a
  // client-sent PG response/pgAmount, which was never verified with the gateway.
  if (Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")) {
    return next(new ErrorResponse("Card payments are processed through the payment gateway.", 400));
  }

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    customLog(req.LogTraceId, "error", {
      message: "Service detiails fetch failed",
      serviceDetails,
    });
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        400,
      ),
    );
  }

  let transactionCategory = "Shipment Services";

  const corporateTxnId = new Date().valueOf();
  const commissionType = serviceDetails.commissionType;
  const cashbackType = serviceDetails.cashbackType;
  const providerCommission = serviceDetails.providerCommission;
  const corporateCashback = serviceDetails.cashback;
  const serviceOperatorId = serviceDetails.id;
  const amount = parseFloat(req.body.amount);

  // The vendor is sent the listed delivery price, not the marked-up amount the customer pays.
  const vendorAmount = await getVendorAmount(amount, accessKey, { credentialId, scope: getQuoteScope(req) });
  if (vendorAmount === null) {
    return next(
      new ErrorResponse(
        "Delivery prices have changed. Please check the delivery fee again.",
        400,
      ),
    );
  }

  const surcharge = await calculateSurcharge(
    serviceDetails.surcharge,
    serviceDetails.surchargeType,
    amount,
    credentialId,
  );

  let templateDetails = await fetchPartnerDetails(req.user.registeredBy);

  const API_URL = serviceDetails.vendor.apiUrl;
  const password = serviceDetails.vendor.optional1;
  const email = serviceDetails.vendor.optional2;
  const token = await getShiprocketToken(API_URL, email, password);

  const pickupLocationName = String(corporateTxnId);
  const reportData = await computeJournalData({
    serviceDetails,
    amount,
    paymentMethod: "WALLET",
    partnerDetails: templateDetails,
    paymentGatewayName: "WALLET",
    couponTotalDiscount: req.body.couponTotalDiscount,
    corporateState: req.user.state || "",
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
      req?.LogTraceId,
    );
  let subCorporateUserId;
  if (req.body.role === "CORPORATE_SUB_USER") {
    subCorporateUserId = req.body.subCorporateId;
  }
  let transactionResponse = {};
  if (
    Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")
  ) {
    transactionResponse = await createPGTransaction({
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      pgAmount: req.body.pgAmount,
      transactionCategory,
      orderAmount: amount,
      commissionType,
      cashbackType,
      providerCommission,
      pgResponse: req.body.paymentGatewayResponse,
      surcharge,
      subCorporateUserId,
      reportData,
      couponCode: req.body.couponCode,
      corporateUserId,
      partnerId: req.user.registeredBy,
    });
  } else {
    transactionResponse = await createWalletTransaction({
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      amount,
      surcharge,
      commissionType,
      cashbackType,
      providerCommission,
      reportData,
      subCorporateUserId,
    });
  }
  customLog(req.LogTraceId, "info", {
    message: "Logistics transactionResponse",
    data: transactionResponse,
  });
  if (
    transactionResponse &&
    Object.prototype.hasOwnProperty.call(transactionResponse, "error")
  ) {
    return next(new ErrorResponse(transactionResponse["error"], 400));
  }

  publishJournal("payment");

  const deliveryPartnerData = req.body.deliveryPartnerData;
  const courierCompanyId =
    process.env.NODE_ENV === "production"
      ? deliveryPartnerData.deliveryCompanyId
      : deliveryPartnerData.deliveryCompanyId; // no hardcoded ID for Shiprocket UAT

  // Customer/corporate-facing total (notifications, email, expense record) must match
  // what was actually quoted and charged at checkout — `surcharge` is a separate,
  // admin-configured fee tracked only for internal wallet/PG accounting (passed to
  // createWalletTransaction/createPGTransaction above), never shown to the customer.
  const totalAmount = parseFloat(amount).toFixed(2);

  let response;
  let shiprocketOrderId = null;
  let awbCode = null;
  let shipmentId = null;

  try {
    if (!token) throw new Error("Shiprocket token fetch failed");

    if (req.body.isReturn) {
      // ── Return shipment ──
      // Fetch original shipment to get receiver address (pickup point for return)
      const originalShipment = await shipmentOrders.findOne({
        where: { corporateTxnId: req.body.deliveredTxnId },
      });

      const returnPickup = originalShipment?.receiverAddress || {};

      const returnPayload = {
        order_id: String(req.body.deliveredTxnId),
        name: returnPickup.name || "",
        email: returnPickup.email || "",
        phone: String(returnPickup.mobile || returnPickup.phoneNumber || ""),
        address: returnPickup.addressLine || returnPickup.addressLine1 || "",
        city: returnPickup.city || "",
        state: returnPickup.state || "",
        country: returnPickup.countryCode || "IN",
        pincode: String(returnPickup.postCode || returnPickup.zipCode || ""),
        channel_id: "",
        sub_total: vendorAmount,
        courier_id: courierCompanyId,
        comment: `Return for order ${req.body.deliveredTxnId}`,
      };

      const returnConfig = {
        method: "POST",
        url: `${API_URL}/v1/external/orders/create/return`,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: returnPayload,
      };

      customLog(
        req?.LogTraceId,
        "info",
        {
          message: "Shiprocket /orders/create/return Request",
          request: returnConfig,
        },
        "VENDOR",
      );
      response = await axios(returnConfig);
      customLog(req?.LogTraceId, "info", {
        message: "Shiprocket /orders/create/return Response",
        response: response.data,
      });

      shiprocketOrderId = response?.data?.order_id || null;
    } else {
      // ── New shipment ──
      const { originAddress, destinationAddress, items } = req.body;
      const weight = req.body.shipmentDetails.weight;
      const boxDimensions = req.body.shipmentDetails;

      const {
        name: senderName,
        mobile: senderMobile,
        addressLine: senderAddressLine,
        addressLine2: senderAddressLine2,
        postCode: senderPostCode,
        city: senderCity,
        countryName: senderCountry,
        state: senderState,
        email: senderEmail,
      } = req.body.originAddress;

      const {
        name: receiverName,
        mobile: receiverMobile,
        addressLine: receiverAddressLine,
        addressLine2: receiverAddressLine2,
        postCode: receiverPostCode,
        city: receiverCity,
        countryName: receiverCountry,
        countryCode: receiverCountryCode,
        state: receiverState,
        email: receiverEmail,
      } = req.body.destinationAddress;

      const isInternationalShipment = req.body.isInternational === true;

      // Fallback: resolve city/state from postcode when FE doesn't supply them
      let resolvedSenderCity = senderCity || "";
      let resolvedSenderState = senderState || "";
      if ((!resolvedSenderCity || !resolvedSenderState) && senderPostCode) {
        const fallback = await getCityStateFromPostcode(
          API_URL,
          token,
          senderPostCode,
        );
        if (!resolvedSenderCity) resolvedSenderCity = fallback.city;
        if (!resolvedSenderState) resolvedSenderState = fallback.state;
      }

      let resolvedReceiverCity = receiverCity || "";
      let resolvedReceiverState = receiverState || "";
      if (
        (!resolvedReceiverCity || !resolvedReceiverState) &&
        receiverPostCode
      ) {
        if (isInternationalShipment && receiverCountryCode) {
          try {
            const intlResp = await axios({
              method: "GET",
              url: `${API_URL}/v1/countries/location/${receiverCountryCode}/${receiverPostCode}`,
              headers: { Authorization: `Bearer ${token}` },
              timeout: 8000,
            });
            const locations = intlResp?.data?.data || [];
            if (!resolvedReceiverCity)
              resolvedReceiverCity = locations.find((l) => l.type === 2)?.name || "";
            if (!resolvedReceiverState)
              resolvedReceiverState = locations.find((l) => l.type === 1)?.name || "";
          } catch (e) {
            customLog(req?.LogTraceId, "info", {
              message: "International postcode lookup failed during shipment creation",
              postcode: receiverPostCode,
              countryCode: receiverCountryCode,
              err: e?.message,
            });
          }
        } else {
          const fallback = await getCityStateFromPostcode(
            API_URL,
            token,
            receiverPostCode,
          );
          if (!resolvedReceiverCity) resolvedReceiverCity = fallback.city;
          if (!resolvedReceiverState) resolvedReceiverState = fallback.state;
        }
      }

      // Build order items for Shiprocket
      const orderItems = (items || []).map((item, idx) => {
        const orderItem = {
          name: item.name || item.description || `Item ${idx + 1}`,
          sku: item.sku || `SKU-${corporateTxnId}-${idx}`,
          units: item.quantity || item.units || 1,
          selling_price: item.price || vendorAmount / (items.length || 1),
        };
        const hsn = item.hsn || item.hsn_code;
        if (hsn) orderItem.hsn = hsn;
        return orderItem;
      });

      if (orderItems.length === 0) {
        orderItems.push({
          name: "Shipment",
          sku: `SKU-${corporateTxnId}`,
          units: 1,
          selling_price: vendorAmount,
        });
      }

      const createOrderPayload = {
        order_id: String(corporateTxnId),
        order_date: moment().format("YYYY-MM-DD HH:mm"),
        pickup_location: pickupLocationName,
        billing_customer_name: senderName || "",
        billing_last_name: "",
        billing_address: senderAddressLine || "",
        billing_address_2: senderAddressLine2 || "",
        billing_city: resolvedSenderCity,
        billing_pincode: String(senderPostCode || ""),
        billing_state: resolvedSenderState,
        billing_country: senderCountry || "",
        billing_email: senderEmail || req.user.email || "",
        billing_phone: String(senderMobile || "").replace(/\D/g, ""),
        shipping_is_billing: 0,
        shipping_customer_name: receiverName || "",
        shipping_email: receiverEmail || "",
        shipping_last_name: "",
        shipping_address: receiverAddressLine || "",
        shipping_address_2: receiverAddressLine2 || "",
        shipping_city: resolvedReceiverCity,
        shipping_pincode: String(receiverPostCode || ""),
        shipping_state: resolvedReceiverState,
        shipping_country: receiverCountry || "",
        shipping_phone: String(receiverMobile || "").replace(/\D/g, ""),
        order_items: orderItems,
        payment_method: "Prepaid",
        sub_total: vendorAmount,
        length: boxDimensions.length || 0,
        breadth: boxDimensions.width || 0,
        height: boxDimensions.height || 0,
        weight: parseFloat(weight) || 0,
        vendor_details: {
          email: senderEmail || req.user.email || "",
          phone: String(senderMobile || "").replace(/\D/g, ""),
          name: senderName || "",
          address: senderAddressLine || "",
          ...(senderAddressLine2 && senderAddressLine2.length >= 10 && { address_2: senderAddressLine2 }),
          city: resolvedSenderCity,
          state: resolvedSenderState,
          country: senderCountry || "India",
          pin_code: String(senderPostCode || ""),
          pickup_location: pickupLocationName,
        },
      };

      // Save order in DB before calling vendor
      await createShipmentOrder({
        amount,
        weight: parseFloat(weight),
        senderAddress: originAddress,
        receiverAddress: destinationAddress,
        items,
        shipmentDetails: {
          deliveryPartnerData,
          boxDimensions,
        },
        status: "PENDING",
        corporateTxnId,
        credentialId,
        consentAgreed: req.body.consentAgreed === true,
        consentAt: req.body.consentAgreed === true ? new Date() : null,
        businessPanUrl: req.body.businessPanUrl || null,
      });

      customLog(req.LogTraceId, "info", {
        message: "Logistics new order created in DB",
      });

      if (isInternationalShipment) {
        const internationalPayload = {
          ...createOrderPayload,
          courier_id: courierCompanyId,
          purpose: "commercial",
          currency: "INR",
          invoice_currency: "INR",
          invoice_value: vendorAmount,
          order_items: orderItems,
        };
        customLog(
          req?.LogTraceId,
          "info",
          {
            message:
              "Shiprocket /international/shipments/create/forward-shipment Request",
            request: internationalPayload,
          },
          "VENDOR",
        );
        response = await axios({
          method: "POST",
          url: `${API_URL}/v1/external/international/shipments/create/forward-shipment`,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: internationalPayload,
        });
        customLog(req?.LogTraceId, "info", {
          message:
            "Shiprocket /international/shipments/create/forward-shipment Response",
          response: response.data,
        });
        shiprocketOrderId =
          response?.data?.payload?.order_id ||
          response?.data?.order_id ||
          response?.data?.response?.data?.order_id ||
          null;
        awbCode =
          response?.data?.payload?.awb_code ||
          response?.data?.awb_code ||
          response?.data?.response?.data?.awb_code ||
          null;
        shipmentId =
          response?.data?.payload?.shipment_id ||
          response?.data?.shipment_id ||
          response?.data?.response?.data?.shipment_id ||
          null;
      } else {
        const forwardPayload = {
          ...createOrderPayload,
          courier_id: courierCompanyId,
        };
        customLog(
          req?.LogTraceId,
          "info",
          {
            message: "Shiprocket /shipments/create/forward-shipment Request",
            request: forwardPayload,
          },
          "VENDOR",
        );
        response = await axios({
          method: "POST",
          url: `${API_URL}/v1/external/shipments/create/forward-shipment`,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          data: forwardPayload,
        });
        customLog(req?.LogTraceId, "info", {
          message: "Shiprocket /shipments/create/forward-shipment Response",
          response: response.data,
        });
        shiprocketOrderId =
          response?.data?.payload?.order_id ||
          response?.data?.order_id ||
          response?.data?.response?.data?.order_id ||
          null;
        awbCode =
          response?.data?.payload?.awb_code ||
          response?.data?.awb_code ||
          response?.data?.response?.data?.awb_code ||
          null;
        shipmentId =
          response?.data?.payload?.shipment_id ||
          response?.data?.shipment_id ||
          response?.data?.response?.data?.shipment_id ||
          null;
      }
    }
  } catch (error) {
    customLog(req.LogTraceId, "error", {
      message: "Logistics payment vendor api failed",
      error: error?.response?.data || error,
    });
  }

  // ── Failure path (vendor returned no order_id) ──
  const vendorSuccess =
    response?.data?.payload?.order_id ||
    response?.data?.payload?.shipment_id ||
    response?.data?.order_id ||
    response?.data?.shipment_id ||
    response?.data?.response?.data?.order_id ||
    response?.data?.response?.data?.shipment_id;
  if (!vendorSuccess) {
    await updateOrderByCorporateTxnId(corporateTxnId, { status: "failed" });

    // cleverTap.uploadEvent({
    //     eventName: "Transactions",
    //     eventData: {
    //         Status: "Payment Failure",
    //     },
    //     email: emailId,
    // }, templateDetails);

    const updateDetails = {
      corporateTxnId: String(corporateTxnId),
      status: "FAILURE",
      providerId: "Not Available",
      message: "shipment not created",
      registeredById: req.user.registeredBy ?? null,
    };
    await updateWalletTransaction({ ...updateDetails });

    if (
      Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")
    ) {
      // const refundPGResponse = await cancelCardTransaction(req, req.body.paymentGatewayResponse);
      // if (refundPGResponse?.state == "REVERSED") {
      //     await refundWalletTransaction(updateDetails);
      //     await recordRefundToZohoJournal(
      //       reportData,
      //       corporateTxnId,
      //       Number(amount) + Number(surcharge),
      //       serviceDetails.vendor,
      //       undefined,
      //       corporateUserId,
      //       req.user.registeredBy
      //     );
      // } else {
      //     await paymentGateWayRefundFailureEmail(req);
      // }
    } else {
      await refundWalletTransaction(updateDetails);
      publishJournal("refund");
    }

    const notificationData = {
      notificationTitle: "Shipment - Payment unsuccessful",
      notificationBrief: `Payment of ₹${totalAmount} for Shipment was unsuccessful. Transaction ID: ${corporateTxnId}.`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
      accessKey,
      action: "1",
    };

    if (req.body.role === "CORPORATE_SUB_USER" && req.body.subCorporateId) {
      const subcorporateUsername = req.body.subCorporateUsername;
      if (subcorporateUsername) {
        notificationData.notificationTo.push(subcorporateUsername);
      }
    }
    createNotification(notificationData, credentialId);

    const to = [emailId, subCorporateEmail].filter(Boolean);
    const subject = "Payment failed";
    const resolvedFailed = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.LOGISTICS_PAYMENT_FAILED,
      service: EMAIL_TEMPLATE_SERVICES.LOGISTICS,
      variables: {
        name,
        serviceName: "Shipment",
        paymentDate: new Date().toLocaleString(),
        baseUrl: templateDetails?.baseUrl,
        branding: templateDetails?.branding || 'Peko',
        ...v2LayoutVariables(templateDetails),
      },
      fallback: () => commonFailedTemplate(name, "Shipment", null, templateDetails),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedFailed.html;
    if (to.length > 0) {
      emailer.email(to, resolvedFailed.subject, body, function () {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
      });
    }

    if (
      Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")
    ) {
      return res.redirect(
        `${req.body.failureUrl}?status="failure"&transactionId=${corporateTxnId}`,
      );
    } else {
      return res.status(400).json({
        status: false,
        message: "Payment Failed",
        responseCode: "003",
        data: {},
      });
    }
  }

  if (req.body.isReturn) {
    const returnData = {
      corporateTxnId: corporateTxnId,
      deliveryPartnerData,
      amount,
      requestedOn: new Date(),
    };

    const updateShipmentEntryResult = await updateShipmentEntry(
      req.body.deliveredTxnId,
      returnData,
      "Returned Requested",
    );
    customLog(req?.LogTraceId, "info", {
      message: "updateShipmentEntryResult result",
      data: updateShipmentEntryResult,
    });
  }

  // ── Update local DB with initial tracking state ──
  const orderId = req.body.isReturn ? String(req.body.deliveredTxnId) : String(corporateTxnId);

  if (!req.body.isReturn) {
    const trackingDetails = [
      {
        note: "",
        status: "Order confirmed",
        dcStatus: "",
        timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
        description:
          "Your order has been confirmed and is now being processed.",
        printAWBURL: "",
        isMainStatus: true,
        vendorStatus: "Pending",
        reverseShipment: false,
        deliveryOptionName: deliveryPartnerData?.courierName || "",
      },
    ];
    await updateOrderByCorporateTxnId(orderId, {
      trackingDetails,
      vendorOrderId: shiprocketOrderId ? String(shiprocketOrderId) : null,
      shipmentId: shipmentId ? String(shipmentId) : null,
      trackingNo: awbCode || null,
      trackingUrl: awbCode ? `https://shiprocket.co/tracking/${awbCode}` : null,
    });
  }

  // // must use this in transaction events
  // cleverTap.uploadEvent({
  //     eventName: "Transactions",
  //     eventData: {
  //         Status: "Payment Success",
  //     },
  //     email: emailId,
  // }, templateDetails);
  const updateDetails = {
    corporateTxnId: String(corporateTxnId),
    providerId: shiprocketOrderId ? String(shiprocketOrderId) : "N/A",
    status: "SUCCESS",
    orderResponse: JSON.stringify({
      ...response.data,
      isReturn: req.body.isReturn,
      deliveredTxnId: req.body.deliveredTxnId || null,
    }),
    message: "Payment Successful",
  };
  await updateWalletTransaction(updateDetails);

  const invoiceOrderId =
    transactionResponse?.orderId ??
    (await findOneOrderByTxnId(String(corporateTxnId)))?.id;
  const invoicePlanDetails = [
    {
      name: deliveryPartnerData?.courierName
        ? `Shipment : ${deliveryPartnerData.courierName}`
        : "Shipment",
      amount,
      quantity: 1,
    },
  ];
  const invoiceAttachments = await generateOrderInvoiceAttachments({
    amount,
    surcharge: surcharge || 0,
    couponDiscount: 0,
    corporateTxnId,
    orderId: invoiceOrderId,
    paymentType: "Shipment",
    credentialId,
    vendor: serviceDetails?.vendor,
    commissionIncludingGST: reportData?.journalData?.commissionIncludingGST || 0,
    planDetails: invoicePlanDetails,
    commissionMode: reportData?.journalData?.commissionMode || "MARGIN",
    traceId: req?.LogTraceId,
  });

  if (!req.body.isReturn) {
    const notificationData = {
      notificationTitle: "Shipment - Payment successful",
      notificationBrief: `Payment of ₹${totalAmount} for Shipment was successful. Transaction ID: ${corporateTxnId}.`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
      accessKey,
      action: "1",
    };

    if (req.body.role === "CORPORATE_SUB_USER" && req.body.subCorporateId) {
      const subcorporateUsername = req.body.subCorporateUsername;
      if (subcorporateUsername) {
        notificationData.notificationTo.push(subcorporateUsername);
      }
    }
    createNotification(notificationData, credentialId);
    const emailRecipients = [emailId, subCorporateEmail].filter(Boolean);
    const subject = "Shipment booked successfully";
    const sender = req.body.originAddress;
    const receiver = req.body.destinationAddress;
    const resolvedSuccess = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.LOGISTICS_PAYMENT_SUCCESS_V3,
      service: EMAIL_TEMPLATE_SERVICES.LOGISTICS,
      variables: {
        name,
        corporateTxnId,
        from: req.body.originAddress.city,
        to: req.body.destinationAddress.city,
        senderName: sender?.name,
        senderAddressLine: sender?.addressLine,
        senderCity: sender?.city,
        senderCountryName: sender?.countryName,
        senderPostCode: sender?.postCode,
        senderMobile: sender?.mobile,
        receiverName: receiver?.name,
        receiverAddressLine: receiver?.addressLine,
        receiverCity: receiver?.city,
        receiverCountryName: receiver?.countryName,
        receiverPostCode: receiver?.postCode,
        receiverMobile: receiver?.mobile,
        totalAmount,
        branding: templateDetails?.branding || 'Peko',
        baseUrl: templateDetails?.baseUrl,
        ...v2LayoutVariables(templateDetails),
      },
      fallback: () => generatePaymentSuccessEmailLogisticsV3({
        name,
        corporateTxnId,
        from: req.body.originAddress.city,
        to: req.body.destinationAddress.city,
        sender,
        receiver,
        totalAmount,
        templateDetails,
      }),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const body = resolvedSuccess.html;
    emailer.emailWithMultipleAttachment(emailRecipients, resolvedSuccess.subject, body, invoiceAttachments, (emailErr) => {
      if (emailErr) {
        customLog(req?.LogTraceId, "error", { message: "Error sending email", emailErr });
      } else {
        customLog(req?.LogTraceId, "info", { message: "Email sent to " + emailRecipients });
      }
    });
  } else {
    const record = await shipmentOrders.findOne({
      where: { corporateTxnId: req.body.deliveredTxnId },
    });
    if (record) {
      const to = emailId;
      const subject = "Return Request Initiated for Your Shipment";
      const returnName = record.senderAddress.name;
      const returnRequestedOn = moment(record.returnDetails.requestedOn).format("DD/MM/YYYY, hh:mm:ss A");
      const resolvedReturn = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.LOGISTICS_RETURN_PAYMENT_SUCCESS_V3,
        service: EMAIL_TEMPLATE_SERVICES.LOGISTICS,
        variables: {
          name: returnName,
          corporateTxnId,
          deliveredTxnId: req.body.deliveredTxnId,
          requestedOn: returnRequestedOn,
          branding: templateDetails?.branding || 'Peko',
          ...v2LayoutVariables(templateDetails),
        },
        fallback: () => generatePaymentSuccessEmailReturnLogisticsV3({
          name: returnName,
          corporateTxnId,
          deliveredTxnId: req.body.deliveredTxnId,
          requestedOn: returnRequestedOn,
          templateDetails,
        }),
        fallbackSubject: subject,
        logTraceId: req?.LogTraceId,
      });
      const body = resolvedReturn.html;
      if (to) {
        emailer.emailWithMultipleAttachment(to, resolvedReturn.subject, body, invoiceAttachments, async (emailErr) => {
          if (emailErr) {
            customLog(req?.LogTraceId, "error", {
              message: "Error sending email",
              emailErr,
            });
          } else {
            customLog(req?.LogTraceId, "info", {
              message: "Email sent to " + to,
            });
          }
        });
      }
    }
  }
  createExpense(
    { credentialId, packageId, corporateUserId },
    {
      accounts_id,
      amount: totalAmount,
      credentialId: req.user.id,
      category: serviceDetails?.serviceCategory,
      merchant: serviceDetails?.vendor?.vendorName,
    },
  );

  if (
    Object.prototype.hasOwnProperty.call(req.body, "paymentGatewayResponse")
  ) {
    return res.redirect(
      `${req.body.successUrl}?status="success"&transactionId=${corporateTxnId}`,
    );
  } else {
    return res.status(200).json({
      status: true,
      message: "shipment created successfully",
      responseCode: "000",
      data: {
        corporateTxnId,
        AWBNumber: awbCode || "N/A",
        orderId: shiprocketOrderId,
        ...transactionResponse,
      },
    });
  }
});

// list all orders
exports.orderHistory = asyncHandler(async (req, res, next) => {
  try {
    const { sort, page, itemsPerPage, searchText, from, to } = req.query;

    const result = await fetchOrderHistory({
      sort,
      page,
      itemsPerPage,
      searchText,
      from,
      to,
      credentialId: req.user.id,
    });

    return res.status(200).json({
      status: true,
      responseCode: "000",
      data: {
        result: result.rows,
        totalData: result.count,
      },
      message: "Logistics order history fetch successful",
    });
  } catch (error) {
    customLog(req.LogTraceId, "error", {
      message: "Fetching order history api failed",
      error,
    });
    next(
      new ErrorResponse(
        "Something went wrong while fetching order history",
        400,
      ),
    );
  }
});

// Cancellation is allowed before the courier has picked up the parcel
function showCancelButton(status) {
  const statusList = [
    // Transaction-level statuses (payment done, webhook not yet received)
    "PENDING",
    "SUCCESS",
    // Logistics-level statuses from Shiprocket webhooks (before pickup)
    "pending",
    "confirmed",
    "processing",
    "pickupPending",
    "pickupQueued",
    "pickupError",
    "pickupRescheduled",
    "outForPickup",
    "manifested",
  ];
  return statusList.includes(status);
}

// list one order
exports.trackShipments = async (req, res, next) => {
  const credentialId = req.user.id;
  const { trackingNumber } = req.body;

  try {
    const shipment = await findShipmentById(trackingNumber, credentialId);
    if (!shipment) {
      customLog(req?.LogTraceId, "error", {
        message: "Logistics no shipment found",
        data: shipment,
      });
      return next(
        new ErrorResponse(
          "No tracking number found. Please try another one.",
          400,
        ),
      );
    }

    return res.status(200).json({
      status: true,
      message: "Shipment status fetched successfully",
      responseCode: "000",
      data: {
        shipment: {
          ...shipment,
          isCancelAllowed: showCancelButton(shipment.status),
          isReturnAllowed: shipment.status === "delivered",
        },
      },
    });
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "error fetching shipment status",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "error fetching shipment status",
        data: error,
      });
    }
    return next(new ErrorResponse("Something went wrong", 400));
  }
};

exports.cancelShipment = async (req, res, next) => {
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;

  const corporateTxnId = req.body.orderId;

  if (!corporateTxnId) {
    return next(new ErrorResponse("Required parameters missing.", 400));
  }
  const shipment = await findShipmentById(corporateTxnId, credentialId);

  if (!shipment) {
    return next(
      new ErrorResponse(
        "Something went wrong while cancelling the shipment. Please try again.",
        400,
      ),
    );
  }
  if (shipment.status == "cancellationRequested") {
    return next(
      new ErrorResponse(
        "Shipment cannot be cancelled as it has already been picked up, delivered, or previously cancelled.",
        400,
      ),
    );
  }
  if (!showCancelButton(shipment.status)) {
    return next(
      new ErrorResponse(
        "Shipment cannot be cancelled as it has already been picked up, delivered, or previously cancelled.",
        400,
      ),
    );
  }

  // will get orderId from FE
  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        400,
      ),
    );
  }

  const API_URL = serviceDetails.vendor.apiUrl;
  const password = serviceDetails.vendor.optional1;
  const email = serviceDetails.vendor.optional2;

  const token = await getShiprocketToken(API_URL, email, password);
  if (!token) {
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        400,
      ),
    );
  }

  // Shiprocket cancel needs their internal order_id (stored in vendorOrderId)
  const shiprocketOrderId = shipment.vendorOrderId;
  if (!shiprocketOrderId) {
    return next(
      new ErrorResponse(
        "Something went wrong while cancelling the shipment. Please try again.",
        400,
      ),
    );
  }

  const config = {
    method: "POST",
    url: `${API_URL}/v1/external/orders/cancel`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { ids: [Number(shiprocketOrderId)] },
  };

  try {
    customLog(
      req?.LogTraceId,
      "info",
      { message: "Shiprocket /orders/cancel Request", request: config },
      "VENDOR",
    );

    const response = await axios(config);

    customLog(req?.LogTraceId, "info", {
      message: "Shiprocket /orders/cancel Response",
      response: response.data,
    });

    // Shiprocket cancel returns { status: 200, message: "..." } — no `success` field
    const cancelOk =
      response?.data?.status === 200 ||
      response?.data?.success === true ||
      (typeof response?.data?.message === "string" &&
        response.data.message.toLowerCase().includes("cancel"));
    if (!cancelOk) {
      return next(
        new ErrorResponse(
          "Something went wrong while cancelling the shipment. Please try again.",
          400,
        ),
      );
    }

    const updateObj = {
      status: "cancellationRequested",
      trackingDetails: [
        ...(shipment.trackingDetails || []),
        {
          note: "",
          status: "Shipment cancellation requested",
          dcStatus: "",
          timestamp: moment().format("YYYY-MM-DD HH:mm:ss"), // current timestamp from moment
          description:
            "Your request for shipment cancellation is under progress.",
          printAWBURL: "",
          isMainStatus: true,
          vendorStatus: "cancellationRequested",
          reverseShipment: false,
          deliveryOptionName: "",
        },
      ],
    };
    const result = updateOrderByCorporateTxnId(corporateTxnId, updateObj);
    if (!result) {
      return next(
        new ErrorResponse(
          "Something went wrong while cancelling the shipment. Please try again.",
          400,
        ),
      );
    }
    return res.status(200).json({
      status: true,
      message: "Shipment cancelled successfully",
      responseCode: "000",
      data: {},
    });
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "error cancel shipment",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "error cancel shipment",
        data: error,
      });
    }
    return next(
      new ErrorResponse(
        "Something went wrong while cancelling the shipment. Please try again.",
        400,
      ),
    );
  }
};

exports.downloadLabel = async (req, res, next) => {
  const traceId = req?.LogTraceId;
  const credentialId = req.user.id;
  const packageId = req.user.packageId;
  const corporateUserId = req.user.corporateId;

  const corporateTxnId = req.query.trackingNumber;

  customLog(traceId, "info", {
    message: "downloadLabel: request received",
    corporateTxnId,
    credentialId,
  });

  if (!corporateTxnId) {
    customLog(traceId, "error", {
      message: "downloadLabel: missing trackingNumber query param",
    });
    return next(new ErrorResponse("Required parameters missing.", 400));
  }
  const shipment = await findShipmentById(corporateTxnId, credentialId);

  if (!shipment) {
    customLog(traceId, "error", {
      message: "downloadLabel: no shipment record found for this trackingNumber/credential",
      corporateTxnId,
      credentialId,
    });
    return next(
      new ErrorResponse(
        `No shipment found for order ${corporateTxnId}. Please check the order and try again.`,
        400,
      ),
    );
  }

  customLog(traceId, "info", {
    message: "downloadLabel: shipment record found",
    corporateTxnId,
    status: shipment.status,
    vendorOrderId: shipment.vendorOrderId,
    shipmentId: shipment.shipmentId,
    trackingNo: shipment.trackingNo,
  });

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    customLog(traceId, "error", {
      message: "downloadLabel: fetchServiceDetails returned an error",
      corporateTxnId,
      error: serviceDetails.error,
    });
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        400,
      ),
    );
  }

  const API_URL = serviceDetails.vendor.apiUrl;
  const password = serviceDetails.vendor.optional1;
  const email = serviceDetails.vendor.optional2;

  const token = await getShiprocketToken(API_URL, email, password);
  if (!token) {
    customLog(traceId, "error", {
      message: "downloadLabel: getShiprocketToken failed — could not authenticate with Shiprocket",
      corporateTxnId,
    });
    return next(
      new ErrorResponse(
        "Apologies, the service you are trying to access is currently unavailable.",
        400,
      ),
    );
  }

  // vendorOrderId is Shiprocket's order_id — the Generate Label API needs the
  // distinct shipment_id. Newer orders already have it captured at creation time;
  // older orders only have vendorOrderId, so resolve + backfill it here.
  let shiprocketShipmentId = shipment.shipmentId;
  if (!shiprocketShipmentId && shipment.vendorOrderId) {
    customLog(traceId, "info", {
      message: "downloadLabel: no shipmentId stored, resolving it from vendorOrderId",
      corporateTxnId,
      vendorOrderId: shipment.vendorOrderId,
    });
    shiprocketShipmentId = await getShiprocketShipmentIdFromOrder(
      API_URL,
      token,
      shipment.vendorOrderId,
      traceId,
    );
    if (shiprocketShipmentId) {
      await updateOrderByCorporateTxnId(shipment.corporateTxnId, {
        shipmentId: String(shiprocketShipmentId),
      });
      customLog(traceId, "info", {
        message: "downloadLabel: resolved and backfilled shipmentId",
        corporateTxnId,
        shiprocketShipmentId,
      });
    }
  }

  if (!shiprocketShipmentId) {
    customLog(traceId, "error", {
      message: "downloadLabel: could not determine a Shiprocket shipment id for this order",
      corporateTxnId,
      vendorOrderId: shipment.vendorOrderId,
    });
    return next(
      new ErrorResponse(
        "Shipment ID not available yet for this order. It may not have been assigned a courier/AWB yet — please try again once the shipment has been processed.",
        400,
      ),
    );
  }

  const config = {
    method: "POST",
    url: `${API_URL}/v1/external/courier/generate/label`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: { shipment_id: [Number(shiprocketShipmentId)] },
  };

  try {
    customLog(
      traceId,
      "info",
      {
        message: "downloadLabel: Shiprocket /courier/generate/label Request",
        corporateTxnId,
        request: config,
      },
      "VENDOR",
    );

    const response = await axios(config);

    customLog(traceId, "info", {
      message: "downloadLabel: Shiprocket /courier/generate/label Response",
      corporateTxnId,
      status: response?.status,
      response: response.data,
    });

    const labelUrl = response?.data?.label_url;
    if (!response?.data?.label_created || !labelUrl) {
      const vendorReason =
        response?.data?.response ||
        (Array.isArray(response?.data?.not_created)
          ? JSON.stringify(response.data.not_created)
          : null);
      customLog(traceId, "error", {
        message: "downloadLabel: Shiprocket did not create the label",
        corporateTxnId,
        shiprocketShipmentId,
        response: response?.data,
      });
      return next(
        new ErrorResponse(
          vendorReason
            ? `Shiprocket could not generate the label: ${vendorReason}`
            : "Shiprocket could not generate the label for this shipment. Please try again.",
          400,
        ),
      );
    }

    return res.status(200).json({
      status: true,
      message: "Label generated successfully",
      responseCode: "000",
      data: { labelUrl },
    });
  } catch (error) {
    customLog(traceId, "error", {
      message: "downloadLabel: Shiprocket /courier/generate/label Error",
      corporateTxnId,
      shiprocketShipmentId,
      status: error?.response?.status,
      data: error?.response?.data || error?.message || error,
    });
    const vendorMessage =
      error?.response?.data?.message || error?.response?.data?.response;
    return next(
      new ErrorResponse(
        vendorMessage
          ? `Shiprocket error: ${vendorMessage}`
          : "Something went wrong while downloading the label. Please try again.",
        400,
      ),
    );
  }
};

exports.downloadInvoice = async (req, res, next) => {
  // const credentialId = req.user.id
  // const packageId = req.user.packageId
  // const corporateUserId = req.user.corporateId
  // const contactPersonName = req.user.contactPersonName;
  // const { trackingNumber } = req.query;
  // const corporateTxnId = trackingNumber;
  // const amount = req.query.amount || 0

  try {
    // const serviceDetails = await fetchServiceDetails({
    //     credentialId,
    //     accessKey,
    //     packageId,
    //     corporateUserId,
    // })
    // const line_item = [
    //     {
    //         item_id: zoho_configs.common_item_id,
    //         name: serviceDetails.serviceProvider,
    //         rate: amount,
    //         quantity: 1,
    //         tax_id: zoho_configs.zero_tax_id,
    //     },
    // ]
    // const surchargeWithoutTax = calculateSurcharge(serviceDetails.surcharge, serviceDetails.surchargeType, amount)

    return res.status(400).json({
      status: false,
      message: "Something went wrong while generating the invoice.",
      data: {},
      responseCode: "001",
    });
  } catch (error) {
    if (error) {
      customLog(req?.LogTraceId, "error", {
        message: "error cancel shipment",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "error cancel shipment",
        data: error,
      });
    }
    return next(
      new ErrorResponse(
        "something went wrong while cancelling the shipment",
        400,
      ),
    );
  }
};

exports.handleVendorWebhookOrderStatus = asyncHandler(
  async (req, res) => {
    customLog(req?.LogTraceId, "info", {
      message: "Shiprocket webhook data",
      webhookData: req.body,
    });

    const serviceDetails = await findServiceOperatorByAccessKey(accessKey);

    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return res.status(400).send();
    }

    // ── Extract Shiprocket payload fields ──
    // order_id = the channel_order_id we set during order creation (= corporateTxnId)
    // sr_order_id = Shiprocket's own numeric ID
    const {
      awb: trackingNumber = "",
      courier_name: deliveryOptionName = "",
      current_status: rawVendorStatus = "",
      sr_order_id: shipmentId = null,
      order_id: corporateTxnIdFromWebhook,
      current_timestamp: timestamp,
      scans = [],
    } = req.body;
    const latestScan = Array.isArray(scans) && scans.length ? scans[scans.length - 1] : null;

    // Normalise status to Title Case to match statusMapping keys
    // e.g. "IN TRANSIT" → "In Transit", "Delivered" → "Delivered"
    const vendorStatus = rawVendorStatus
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());

    // Shiprocket sends current_timestamp as "DD MM YYYY HH:mm:ss" (e.g. "13 07 2026 15:02:45"),
    // which moment/Date can't auto-parse and produces "Invalid date" downstream (FE + emails).
    const parsedTimestamp = timestamp
      ? moment(timestamp, "DD MM YYYY HH:mm:ss")
      : moment();

    // order_id in the webhook is our corporateTxnId (set as order_id during creation)
    const orderId = String(corporateTxnIdFromWebhook || "");

    if (!orderId) {
      customLog(req?.LogTraceId, "error", {
        message: "Shiprocket webhook: could not resolve orderId",
        body: req.body,
      });
      return res.status(400).send("missing order identifier");
    }

    const mapping = statusMapping[vendorStatus] || {};
    const internalStatus = mapping.internalStatus || vendorStatus;

    const enrichedEntry = {
      vendorStatus,
      note: "",
      dcStatus: "",
      timestamp: parsedTimestamp.format("YYYY-MM-DD HH:mm:ss"),
      printAWBURL: "",
      deliveryOptionName,
      reverseShipment: false,
      status: mapping.userMessage || vendorStatus,
      description: latestScan?.activity || mapping.description || "",
      location: latestScan?.location || "",
      isMainStatus: !!mapping.isMainStatus,
    };

    const result = await updateStatusAndTracking(orderId, enrichedEntry, {
      status: internalStatus,
      trackingUrl: trackingNumber ? `https://shiprocket.co/tracking/${trackingNumber}` : "",
      trackingNumber,
      vendorId: shipmentId ? String(shipmentId) : null,
    });

    if (result.reason === 'NOT_FOUND') {
      customLog(req?.LogTraceId, 'info', {
        message: 'Shiprocket webhook: order not found',
        orderId,
      });
      return res.status(200).json({ status: false, message: 'order id is incorrect' });
    }

    if (result.status) {
      if (vendorStatus === "reverseReturned") {
        const { data } = result;

        let templateDetails = await fetchPartnerDetails(data?.credential?.registeredBy);
        const to = [
          data?.credential?.email,
          data?.returnDetails?.subCorporateEmail,
        ];
        const subject = " Return Request completed for Your Shipment";
        const returnCompletionName = data.senderAddress?.name;
        const returnCompletionRequestedOn = moment(data.returnDetails.requestedOn).format("DD/MM/YYYY, hh:mm:ss A");
        const returnCompletionDate = parsedTimestamp.format("DD/MM/YYYY, hh:mm:ss A");
        const resolvedCompletion = await resolveEmailTemplate({
          key: EMAIL_TEMPLATE_KEYS.LOGISTICS_RETURN_COMPLETION_SUCCESS_V3,
          service: EMAIL_TEMPLATE_SERVICES.LOGISTICS,
          variables: {
            name: returnCompletionName,
            corporateTxnId: orderId,
            requestedOn: returnCompletionRequestedOn,
            completionDate: returnCompletionDate,
            returnTransactionId: data.returnDetails.corporateTxnId,
            branding: templateDetails?.branding || 'Peko',
            ...v2LayoutVariables(templateDetails),
          },
          fallback: () => generateReturnCompletionSuccessEmailLogisticsV3({
            name: returnCompletionName,
            corporateTxnId: orderId,
            returnTransactionId: data.returnDetails.corporateTxnId,
            templateDetails,
            requestedOn: returnCompletionRequestedOn,
            completionDate: returnCompletionDate,
          }),
          fallbackSubject: subject,
          logTraceId: req?.LogTraceId,
        });
        const body = resolvedCompletion.html;
        emailer.email(to, resolvedCompletion.subject, body, async (emailErr) => {
          if (emailErr) {
            customLog(req?.LogTraceId, "error", {
              message: "Error sending email",
              emailErr,
            });
          } else {
            customLog(req?.LogTraceId, "info", {
              message: "Email sent to " + to,
            });
          }
        });
      } else if (vendorStatus === "shipmentCanceled") {
        const cancelRequest = result.data.trackingDetails.find(
          (td) => td.vendorStatus === "cancellationRequested",
        );
        const cancelRequestedOn = cancelRequest?.timestamp;

        const shipmentCancelInformMails = await getShipmentCancelInformMails();

        if (!shipmentCancelInformMails) {
          customLog(req?.LogTraceId, "info", {
            message: "shipmentCancelInformMails not found in settings table",
          });
          return res.status(200).send("success"); // even though there is no email configured, the webhook is successful, so responding with status code 200
        }

        const { to, cc = [] } = shipmentCancelInformMails.details || {};

        if (to) {
          let subject = ` Logistics Order ID: ${orderId} cancelled, initiate refund `;
          const cancelRequestedOnText = cancelRequestedOn
            ? moment(cancelRequestedOn).format("DD/MM/YYYY, hh:mm:ss A")
            : "N/A";
          const resolvedCancelInform = await resolveEmailTemplate({
            key: EMAIL_TEMPLATE_KEYS.LOGISTICS_SHIPMENT_CANCEL_ADMIN_INFORM_V3,
            service: EMAIL_TEMPLATE_SERVICES.LOGISTICS,
            variables: {
              orderId,
              requestedOn: cancelRequestedOnText,
              branding: 'Peko',
              ...v2LayoutVariables({ branding: 'Peko', website: 'https://www.peko.one' }),
            },
            fallback: () => generateShipmentCancelAdminInformEmailLogisticsV3({
              orderId,
              requestedOn: cancelRequestedOnText,
            }),
            fallbackSubject: subject,
            logTraceId: req?.LogTraceId,
          });
          let body = resolvedCancelInform.html;

          emailer.emailWithCc(to, resolvedCancelInform.subject, body, cc, async (emailErr) => {
            if (emailErr) {
              customLog(req?.LogTraceId, "error", {
                message: "Error sending email",
                emailErr,
              });
            } else {
              customLog(req?.LogTraceId, "info", {
                message: "Email sent to " + to,
              });
            }
          });
        }
      }
      return res.status(200).send("success");
    }

    return res.status(500).send("failed to update the record");
  },
);

// un used
// exports.trackFullShipmentHistory = async (req, res, next) => {

//     const credentialId = req.user.id
//     const packageId = req.user.packageId
//     const corporateUserId = req.user.corporateId

//     const serviceDetails = await fetchServiceDetails({
//         credentialId,
//         accessKey,
//         packageId,
//         corporateUserId,
//     })

//     if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
//         return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400))
//     }

//     let API_URL = serviceDetails.vendor.apiUrl
//     let refresh_token = serviceDetails.vendor.optional1  // api secert
//     const authorizationToken = await getAccessToken(API_URL, refresh_token)

//     if (!authorizationToken) {
//         return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400))
//     }

//     const payload = {
//         "orderIds": req.body.orderIds
//     }

//     const config = {
//         method: 'POST',
//         url: `${API_URL}/rest/v2/orderHistory`,
//         headers: {
//             "Content-Type": 'application/json',
//             "Accept": 'application/json',
//             "Authorization": `Bearer ${authorizationToken}`
//         },
//         data: payload
//     }

//     try {
//         customLog(req?.LogTraceId, "info", { message: "/rest/v2/orderHistory Request", request: config }, 'VENDOR')

//         const response = await axios(config)

//         customLog(req?.LogTraceId, "info", { message: "/rest/v2/orderHistory Response", response: response.data })

//         if (!response || !response.data || !response.data.success) {
//             return next(new ErrorResponse("something went wrong while fetching tracking history", 400))
//         }

//         // {
//         //     "warehouseId": "24633",
//         //     "success": true,
//         //     "pickupLocationCode": "code-04",
//         //     "message": "warehouse has been created"
//         // }
//         return res.status(200).json({
//             status: true,
//             message: 'tracking history fetched successfully',
//             responseCode: '000',
//             data: {
//                 trackingData: response.data.items
//             },
//         })
//     } catch (error) {
//         if (error?.response?.data) {
//             customLog(req?.LogTraceId, "error", { message: "error fetching tracking history", data: error.response.data })
//         } else {
//             customLog(req?.LogTraceId, "error", { message: "error fetching tracking history", data: error })
//         }
//         return next(new ErrorResponse("something went wrong while fetching tracking history", 400))
//     }
// }

// no need to use
// exports.createNewPickupLocation = async (req, res, next) => {

//     const credentialId = req.user.id
//     const packageId = req.user.packageId
//     const corporateUserId = req.user.corporateId

//     const serviceDetails = await fetchServiceDetails({
//         credentialId,
//         accessKey,
//         packageId,
//         corporateUserId,
//     })

//     if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
//         return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400))
//     }

//     let API_URL = serviceDetails.vendor.apiUrl
//     let refresh_token = serviceDetails.vendor.optional1  // api secert
//     const authorizationToken = await getAccessToken(API_URL, refresh_token)

//     if (!authorizationToken) {
//         return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400))
//     }

//     const payload = {
//         "type": "warehouse",
//         "code": "code-02",
//         "name": "Location-02 Name",
//         "mobile": "555888777",
//         "address": "Test warehouse 3539, Al Khalidiyyah Al Janubiyyah, Dammam 32225",
//         "contactName": "Test Contact",
//         "contactEmail": "Test Email",
//         "lat": "26.001",
//         "lon": "50.001",
//         "city": "Dammam",
//         "country": "SA",
//         "postcode": "12345",
//         "servingRadius": "10",
//         "brandName": "Example Seller"
//     }

//     const config = {
//         method: 'POST',
//         url: `${API_URL}/rest/v2/createPickupLocation`,
//         headers: {
//             "Content-Type": 'application/json',
//             "Accept": 'application/json',
//             "Authorization": `Bearer ${authorizationToken}`
//         },
//         data: payload
//     }

//     try {
//         customLog(req?.LogTraceId, "info", { message: "/rest/v2/createPickupLocation Request", request: config })

//         const response = await axios(config)

//         customLog(req?.LogTraceId, "info", { message: "/rest/v2/createPickupLocation Response", response: response.data })

//         if (!response || !response.data || !response.data.success) {
//             return next(new ErrorResponse("something went wrong while creating pickup location", 400))
//         }

//         // {
//         //     "warehouseId": "24633",
//         //     "success": true,
//         //     "pickupLocationCode": "code-04",
//         //     "message": "warehouse has been created"
//         // }
//         return res.status(200).json({
//             status: true,
//             message: 'delivery fetched successfully',
//             responseCode: '000',
//             data: {
//                 hey: ""
//             },
//         })
//     } catch (error) {
//         if (error?.response?.data) {
//             customLog(req?.LogTraceId, "error", { message: "error creating pickup location", data: error.response.data })
//         } else {
//             customLog(req?.LogTraceId, "error", { message: "error creating pickup location", data: error })
//         }
//         return next(new ErrorResponse("something went wrong while creating pickup location", 400))
//     }
// }

// exports.trackShipment = async (req, res, next) => {

//     const credentialId = req.user.id
//     const packageId = req.user.packageId
//     const corporateUserId = req.user.corporateId

//     const serviceDetails = await fetchServiceDetails({
//         credentialId,
//         accessKey,
//         packageId,
//         corporateUserId,
//     })

//     if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
//         return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400))
//     }

//     let API_URL = serviceDetails.vendor.apiUrl
//     let refresh_token = serviceDetails.vendor.optional1  // api secert
//     const authorizationToken = await getAccessToken(API_URL, refresh_token)

//     if (!authorizationToken) {
//         return next(new ErrorResponse("Apologies, the service you are trying to access is currently unavailable.", 400))
//     }

//     try {
//         const response = await checkOrderStatus(API_URL, authorizationToken, req.body.orderId, req?.LogTraceId)

//         if (!response) {
//             return next(new ErrorResponse("Something went wrong", 400))
//         }

//         return res.status(200).json({
//             status: true,
//             message: 'Shipment status fetched successfully',
//             responseCode: '000',
//             data: { ...response },
//         })
//     } catch (error) {
//         if (error?.response?.data) {
//             customLog(req?.LogTraceId, "error", { message: "error fetching shipment status", data: error.response.data })
//         } else {
//             customLog(req?.LogTraceId, "error", { message: "error fetching shipment status", data: error })
//         }
//         return next(new ErrorResponse("Something went wrong", 400))
//     }
// }

exports.uploadBusinessPan = asyncHandler(async (req, res, next) => {
  try {
    const username = req.user.username;
    const { base64String, imageFormat } = req.body;

    const filePath = `corporate/${username}/Logistics-Documents`;
    const url = await uploadFile(base64String, filePath, imageFormat, 5);

    return res.status(200).json({
      status: true,
      message: "Business PAN uploaded successfully",
      responseCode: "000",
      data: { url },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message });
    return next(new ErrorResponse("Something went wrong while uploading PAN", 500));
  }
});

exports.checkBusinessPan = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;

    const record = await findPanByCredentialId(credentialId);

    return res.status(200).json({
      status: true,
      message: "PAN status fetched",
      responseCode: "000",
      data: { uploaded: !!record },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message });
    return next(new ErrorResponse("Something went wrong while checking PAN status", 500));
  }
});
