const { customLog } = require("./loggerHelper");
const { default: axios } = require("axios");
const { getValue, setValue } = require("./cacheDataMethods");
const { fetchServiceDetails } = require("./checkAndFetchServiceDetails");
const ErrorResponse = require("./error-response");

const accessKey = "software_service";
const vendorCategories = "zoftware-categories";
const popularProducts = "zoftware-popular-products"

async function getSessionId({ API_URL, api_key, req }) {
  const {
    email,
    mobileNo: phone,
    contactPersonName,
    name,
    id: userId,
  } = req.user;

  let contactName = contactPersonName || name;

  const ua = req.useragent || {};

  const deviceType = ua.isMobile
    ? "mobile"
    : ua.isTablet
      ? "tablet"
      : ua.browser
        ? "web"
        : "api";

  const platform =
    req.headers["sec-ch-ua-platform"]?.replace(/"/g, "") ||
    ua.platform ||
    ua.os ||
    "unknown";

  let redisKey = `${accessKey}-sessionId-${userId}`;
  let isTokenExist = await getValue(redisKey);

  if (isTokenExist) {
    return isTokenExist;
  } else {
    try {
      let payload = { email, phone, name: contactName, deviceType, platform };
      const config = {
        method: "POST",
        url: `${API_URL}/sessions`,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": api_key,
        },
        data: payload,
      };

      customLog(
        null,
        "info",
        {
          message: "software service - checking sessions api Request",
          request: config,
        },
        "VENDOR",
        [JSON.stringify(payload)],
      );

      const response = await axios(config);

      customLog(null, "info", {
        message: "software service - checking sessions api Response",
        response: response.data,
      });

      if (
        !response?.data?.data?.sessionId ||
        !response?.data?.data?.expiresAt
      ) {
        return null;
      }

      const { sessionId, expiresAt } = response.data.data;

      const ttlInSeconds = Math.max(
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
        1,
      );

      await setValue(redisKey, ttlInSeconds, sessionId);
      return sessionId;
    } catch (error) {
      customLog(null, "error", {
        message: "Error : software service - checking sessions api ",
        data: error?.response?.data || error,
      });
      return null;
    }
  }
}

async function checkPermission(req) {
  const {
    id: credentialId,
    packageId,
    corporateId: corporateUserId,
  } = req.user;

  const serviceDetails = await fetchServiceDetails({
    credentialId,
    accessKey,
    packageId,
    corporateUserId,
  });

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    throw new ErrorResponse(
      "Apologies, the service you are trying to access is currently unavailable.",
      400,
    );
  }

  const API_URL = serviceDetails.vendor.apiUrl;
  const api_key = serviceDetails.vendor.optional1;
  const serviceOperatorId = serviceDetails.id;

  const sessionId = await getSessionId({
    API_URL,
    api_key,
    req,
  });

  if (!sessionId) {
    throw new ErrorResponse(
      "Apologies, the service you are trying to access is currently unavailable.",
      400,
    );
  }

  return { API_URL, api_key, sessionId, serviceOperatorId, serviceDetails };
}

function productCardFactory(product) {
  function priceListBuilder(pricing) {
    if (!pricing) return null;
    if (Array.isArray(pricing)) return pricing;
    else if (typeof pricing === "string") return [];
    else return null;
  }

  function ratingsBuilder(ratings) {
    if (!ratings) return null;
    if (typeof ratings === "string")
      return { overall_rating: ratings || 0, total_reviews: null };
    else if (typeof ratings === "object") return ratings;
    else return null;
  }
  return {
    weburl: product.weburl || product.productUrl || product.webUrl || "",
    logo_url: product.logo_url || product.productLogoUrl || "",
    product_name: product.product_name || product.productName || "",
    company: product.company || product.companyName || "",
    website: product.website || product.productInfoUrl || "",
    overview: product.overview || "",
    ratings: ratingsBuilder(product.ratings || product.rating),
    matchPercentage: product.matchPercentage || null,
    pricing: priceListBuilder(product.pricing),
    hasPurchaseOptions: product.hasPurchaseOptions,
  };
}

async function getCachedCategories() {
  const categories = await getValue(vendorCategories);
  let parsedCategories = [];
  if (categories) {
    parsedCategories =
      typeof categories === "string" ? JSON.parse(categories) : categories;
  }
  return parsedCategories;
}

const categoryUrls = new Map([
  [
    "crm-and-sales",
    "https://d2fduk7g9mvyjq.cloudfront.net/staging/common/softwares/categories/crm-and-sales.svg",
  ],
  [
    "cloud-and-infrastructure",
    "https://d2fduk7g9mvyjq.cloudfront.net/staging/common/softwares/categories/cloud-and-infrastructure.svg",
  ],
  [
    "creativity-and-design",
    "https://d2fduk7g9mvyjq.cloudfront.net/staging/common/softwares/categories/creativity-and-design.svg",
  ],
  [
    "customer-service-communication",
    "https://d2fduk7g9mvyjq.cloudfront.net/staging/common/softwares/categories/customer-service-communication.svg",
  ],
  [
    "digital-workspace-productivity",
    "https://d2fduk7g9mvyjq.cloudfront.net/staging/common/softwares/categories/digital-workspace-productivity.svg",
  ],
  [
    "finance-accounting",
    "https://d2fduk7g9mvyjq.cloudfront.net/staging/common/softwares/categories/finance-accounting.svg",
  ],
  [
    "marketing",
    "https://d2fduk7g9mvyjq.cloudfront.net/staging/common/softwares/categories/marketing.svg",
  ],
  [
    "security",
    "https://d2fduk7g9mvyjq.cloudfront.net/staging/common/softwares/categories/security.svg",
  ],
  [
    "ai-software",
    "https://d2fduk7g9mvyjq.cloudfront.net/staging/common/softwares/categories/ai-software.svg",
  ],
  [
    "it-administration",
    "https://d2fduk7g9mvyjq.cloudfront.net/staging/common/softwares/categories/it-administration.svg",
  ],
]);

function getFormattedCategories(categories) {
  return categories.map((c) => {
    const { weburl, name, title } = c;

    return {
      weburl,
      name,
      title,
      icon: categoryUrls.get(weburl) || "",
    };
  });
}

async function setCachedCategories(categories) {
  const stringifiedCategories = JSON.stringify(categories);
  const ttlInSeconds = 24 * 60 * 60;
  await setValue(vendorCategories, ttlInSeconds, stringifiedCategories);
  return;
}

function isValidPriceFormat(value) {
  if (typeof value === "number") return !isNaN(value);
  if (typeof value === "string") {
    return /^[0-9]+(\.[0-9]+)?$/.test(value.trim());
  }
  return false;
}

function currencyConverter({ currency, value, exchangeRates }) {
  const rate = exchangeRates?.[currency];

  const amount = parseFloat(value);
  const rateValue = parseFloat(rate?.value);

  if (!rate || isNaN(amount) || isNaN(rateValue) || rateValue === 0) {
    return "0";
  }

  return String(Math.ceil((amount / rateValue) * 100) / 100);
}

function productDataMapping({ product, exchangeRates }) {
  let pricing = product.pricing || [];
  let purchaseOptions = product.purchaseOptions || [];

  if (product.hasPurchaseOptions) {
    purchaseOptions = purchaseOptions.map((option) => {
      const pricingOption = option.sku?.pricingOption;
      const isValidPrice = isValidPriceFormat(pricingOption.amount);
      const isValidDiscount = isValidPriceFormat(
        pricingOption.discountedAmount,
      );

      const pricingOptionUpdated = {
        ...pricingOption,
        amountInConvertedCurrency: !isValidPrice
          ? "0"
          : currencyConverter({
              currency: pricingOption.currency,
              value: pricingOption.amount,
              exchangeRates,
            }),
        discountedAmountInConvertedCurrency:
          pricingOption.discountedAmount && isValidDiscount
            ? currencyConverter({
                currency: pricingOption.currency,
                value: pricingOption.discountedAmount,
                exchangeRates,
              })
            : "0",
      };
      return {
        ...option,
        sku: { ...option.sku, pricingOption: pricingOptionUpdated },
      };
    });
  } else {
    pricing = (product.pricing || []).map((pricingItem) => {
      const isValidPrice = isValidPriceFormat(pricingItem.amount);
      return {
        ...pricingItem,
        amountInConvertedCurrency: !isValidPrice
          ? "0"
          : currencyConverter({
              currency: pricingItem.currency,
              value: pricingItem.amount,
              exchangeRates,
            }),
      };
    });
  }

  return {
    weburl: product.weburl,
    product_name: product.product_name,
    company: product.company,
    logo_url: product.logo_url,
    website: product.website,
    overview: product.overview,
    ratings: product.ratings,
    pricing,
    videos: product.videos,
    usp: product.usp,
    social_links: product.social_links,
    parent_categories: product.parent_categories,
    languages: product.languages,
    feature_overview: product.feature_overview,
    features: product.features,
    other_features: product.other_features,
    integrations: product.integrations,
    reviews_strengths: product.reviews_strengths,
    reviews_weakness: product.reviews_weakness,
    snapshots: product.snapshots,
    pricing_overview: product.pricing_overview,
    hasPurchaseOptions: product.hasPurchaseOptions,
    purchaseOptions,
  };
}

async function getToolkitId({
  API_URL,
  api_key,
  sessionId,
  name,
  email,
  company,
  softwareCategory,
  req,
}) {
  const config = {
    method: "POST",
    url: `${API_URL}/rfp/toolkit`,
    headers: {
      Accept: "application/json",
      "X-API-Key": api_key,
      "X-Session-Id": sessionId,
    },
    data: {
      userDetails: { name, email, company },
      softwareCategory,
      progress: 100,
    },
    timeout: 5000,
  };

  customLog(
    req?.LogTraceId,
    "info",
    {
      message: "software service - toolKit fetching api  request",
      request: config,
    },
    "VENDOR",
  );

  const response = await axios(config);

  customLog(req?.LogTraceId, "info", {
    message: "software service - toolKit fetching api response",
    response: response.data,
  });

  if (!response?.data?.success || !response?.data?.data?.id) {
    throw new Error("Invalid toolkit response from vendor");
  }

  return response.data.data.id;
}

async function submitAnswers({
  API_URL,
  api_key,
  sessionId,
  toolkitId,
  softwareCategory,
  specializedQuestions,
  generalQuestions,
  req,
}) {
  const config = {
    method: "POST",
    url: `${API_URL}/rfp/generate`,
    headers: {
      Accept: "application/json",
      "X-API-Key": api_key,
      "X-Session-Id": sessionId,
    },
    data: {
      toolkitId,
      softwareCategory,
      generalQuestions,
      specializedQuestions,
    },
    timeout: 5000,
  };

  customLog(
    req?.LogTraceId,
    "info",
    { message: "software service - generate rfp request", request: config },
    "VENDOR",
  );

  const response = await axios(config);

  customLog(req?.LogTraceId, "info", {
    message: "software service - generate rfp response",
    response: response.data,
  });

  if (!response?.data?.success || !response?.data?.jobId) {
    throw new Error("Invalid generate response from vendor");
  }

  return response.data.jobId;
}

async function getRecommandations({
  API_URL,
  api_key,
  sessionId,
  toolkitId,
  req,
}) {
  const config = {
    method: "GET",
    url: `${API_URL}/rfp/toolkit/${encodeURIComponent(toolkitId)}`,
    headers: {
      Accept: "application/json",
      "X-API-Key": api_key,
      "X-Session-Id": sessionId,
    },
    timeout: 5000,
  };

  customLog(
    req?.LogTraceId,
    "info",
    { message: "software service - get toolkit request", request: config },
    "VENDOR",
  );

  const response = await axios(config);

  customLog(req?.LogTraceId, "info", {
    message: "software service - get toolkit response",
    response: response.data,
  });

  if (!response?.data?.success || !response?.data?.data?.result?.status) {
    throw new Error("Invalid recommendations response from vendor");
  }
  const products = response?.data?.data?.result?.items || [];
  const mappedItems = products.map((item) => productCardFactory(item));
  const result = {
    status: response?.data?.data?.result.status === "completed",
    items: mappedItems,
  };
  return result;
}

const defaultPopularProducts = [
  "gamma",
  "zenlocator",
  "hostman",
  "linx-7-0",
  "dialerspro-predictive-dialer",
  "spoom",
  "communities-to-success",
  "vmm-business-manager",
  "intelligencebank-dam",
  "trustmapp",
  "igainspark-saas",
  "auphonic",
];

async function getCachedPopularProducts() {
  const cachedPopularProducts = await getValue(popularProducts);
  let parsedPopularProducts = [];
  if (cachedPopularProducts) {
    parsedPopularProducts =
      typeof cachedPopularProducts === "string" ? JSON.parse(cachedPopularProducts) : cachedPopularProducts;
  }
  return parsedPopularProducts;
}

async function setCachedPopularProducts(products) {
  const stringifiedPopularProducts = JSON.stringify(products);
  const ttlInSeconds = 12 * 60 * 60;
  await setValue(popularProducts, ttlInSeconds, stringifiedPopularProducts);
  return;
}

module.exports = {
  accessKey,
  vendorCategories,
  checkPermission,
  getSessionId,
  productCardFactory,
  getCachedCategories,
  getFormattedCategories,
  setCachedCategories,
  productDataMapping,
  getToolkitId,
  submitAnswers,
  getRecommandations,
  defaultPopularProducts,
  getCachedPopularProducts,
  setCachedPopularProducts
};
