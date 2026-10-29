const axios = require("axios");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const { fetchPartnerDetails } = require("../../models/use-cases/systemUser");
const { partnerLogos } = require("../../utils/partnerLogos");
const { createPGTransaction } = require("../../utils/pamentGatewayTransaction");
const asyncHandler = require("../../middlewares/async");
const { paymentGateWayRefundFailureEmail } = require("../../utils/emailSender");
// const { createExpense } = require("./expense");
const { createNotification } = require("../../models/use-cases/notification");
const { commonFailedTemplate } = require("../../utils/emailTemplate/common");
// const cleverTap = require("../../services/CleverTap"); // we are not using clevertap here in this service
const emailer = require("../../utils/emailer");
const wallet = require("../../models/entities/wallet");
const {
  calculateSurcharge,
  calculateAmountWithTax,
  findServiceOperatorByAccessKey,
} = require("../../utils/checkAndFetchServiceDetails");
const {
  createWalletTransaction,
  refundWalletTransaction,
  updateWalletTransaction,
} = require("../../utils/walletTransaction");
const {
  generateSubscriptionSuccessEmailV2,
  generateGetAssistanceEmail,
} = require("../../utils/emailTemplate/softwares");
const {
  accessKey,
  checkPermission,
  productCardFactory,
  getCachedCategories,
  getFormattedCategories,
  setCachedCategories,
  getToolkitId,
  submitAnswers,
  getRecommandations,
  productDataMapping,
  defaultPopularProducts,
  getCachedPopularProducts,
  setCachedPopularProducts
} = require("../../utils/softwareV2Helpers");
const { getCurrencyExchangeRate } = require("../../models/use-cases/setting");
// const { recordToZohoJournal, recordRefundToZohoJournal } = require("../../utils/zohoAccountMethods");
// const { generateInvoiceAndReceipt } = require("../../services/invoiceAndReceipt");
const {
  createSubscription,
  findPopularProducts,
  findAllSubscriptionsWithOrders,
  findOneSubscription,
  updateSubscriptionByCorporateTxnId,
} = require("../../models/use-cases/corporateSoftwareSubscription");
const { cancelPGTransaction } = require("../../utils/cashFreeGateway");
exports.searchProducts = async (req, res, next) => {
  try {
    const {
      query,
      productLimit,
      parentCategoryLimit,
      subCategoryLimit,
      parentCategorySlug,
    } = req.query;

    const { API_URL, api_key, sessionId } = await checkPermission(req);
    const params = {
      productLimit,
      parentCategoryLimit,
      subCategoryLimit,
      parentCategorySlug,
    };

    if (!parentCategorySlug) delete params.parentCategorySlug;

    const config = {
      method: "GET",
      url: `${API_URL}/search/${encodeURIComponent(query)}`,
      params,
      headers: {
        Accept: "application/json",
        "X-API-Key": api_key,
        "X-Session-Id": sessionId,
      },
      timeout: 10000,
    };

    customLog(
      req?.LogTraceId,
      "info",
      {
        message: "software service - product search api request",
        request: config,
      },
      "VENDOR",
    );

    const response = await axios(config);
    customLog(req?.LogTraceId, "info", {
      message: "software service - product search api Response",
      response: response.data,
    });

    if (!response?.data?.success || !response?.data?.data) {
      return res.status(400).json({
        status: true,
        message: "Something went wrong. Please try again later.",
        responseCode: "003",
        data: {},
      });
    }

    let products = [];

    if (parentCategorySlug) {
      products = response.data.data?.products.filter((p) => p.isExactMatch);
    } else {
      products = response.data.data?.products?.map((p) =>
        productCardFactory(p),
      );
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        status: true,
        message: "Apologies, currently no softwares available for this search.",
        responseCode: "003",
        data: {},
      });
    }

    return res.status(200).json({
      status: true,
      message: "Softwares fetched successfully",
      data: { products },
      responseCode: "000",
    });
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      customLog(req?.LogTraceId, "error", {
        message: "Vendor service timeout. Please try again.",
        data: error?.response?.data || error.message,
      });

      return next(
        new ErrorResponse("Something went wrong. Please try again later.", 500),
      );
    } else {
      if (error?.response?.data) {
        customLog(req?.LogTraceId, "error", {
          message: "error: software service - product search api",
          data: error.response.data,
        });
      } else {
        customLog(req?.LogTraceId, "error", {
          message: "error: software service - product search api",
          data: error,
        });
      }
      return next(
        new ErrorResponse("Something went wrong. Please try again later.", 500),
      );
    }
  }
};

exports.fetchAllParentCategories = async (req, res, next) => {
  try {
    const { API_URL, api_key, sessionId } = await checkPermission(req);
    const cachedCategories = await getCachedCategories();

    if (cachedCategories.length === 0) {
      const config = {
        method: "GET",
        url: `${API_URL}/categories/parent`,
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
        {
          message: "software service - parent category fetching api request",
          request: config,
        },
        "VENDOR",
      );

      const response = await axios(config);

      customLog(req?.LogTraceId, "info", {
        message: "software service - parent category fetching api response",
        response: response.data,
      });

      if (!response?.data?.success || !response?.data?.data) {
        return res.status(400).json({
          status: true,
          message: "Something went wrong. Please try again later.",
          responseCode: "003",
          data: {},
        });
      }

      const categories = response.data.data;

      if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({
          status: true,
          message: "Apologies, no categories available now.",
          responseCode: "003",
          data: {},
        });
      }
      const formattedCategories = getFormattedCategories(categories);

      await setCachedCategories(formattedCategories);

      return res.status(200).json({
        status: true,
        message: "Categories fetched successfully",
        data: { categoryList: formattedCategories },
        responseCode: "000",
      });
    } else {
      return res.status(200).json({
        status: true,
        message: "Categories fetched successfully",
        data: { categoryList: cachedCategories },
        responseCode: "000",
      });
    }
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - parent category fetching api",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - parent category fetching api",
        data: error,
      });
    }
    return next(
      new ErrorResponse("Something went wrong. Please try again later.", 400),
    );
  }
};

exports.fetchPopularProducts = async (req, res, next) => {
  try {
    const { API_URL, api_key, sessionId } = await checkPermission(req);

    let products = await getCachedPopularProducts();

    let response;

    if (!products.length) {
      let popularProducts = await findPopularProducts();

      if (
        !popularProducts ||
        (Array.isArray(popularProducts) && popularProducts.length === 0)
      ) {
        popularProducts = defaultPopularProducts;
      }

      const config = {
        method: "POST",
        url: `${API_URL}/products/batch`,
        headers: {
          Accept: "application/json",
          "X-API-Key": api_key,
          "X-Session-Id": sessionId,
        },
        data: { weburls: popularProducts },
        timeout: 5000,
      };

      customLog(
        req?.LogTraceId,
        "info",
        {
          message: "software service - popular products fetching api request",
          request: config,
        },
        "VENDOR",
      );

      response = await axios(config);

      customLog(req?.LogTraceId, "info", {
        message: "software service - popular products fetching api response",
        response: response.data,
      });

      if (!response?.data?.success || !response?.data?.data) {
        return res.status(400).json({
          status: true,
          message: "Something went wrong. Please try again later.",
          responseCode: "001",
          data: {},
        });
      }

      const data = response.data.data;
      products = data.map((p) => productCardFactory(p));
      await setCachedPopularProducts(products);
    }

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        status: true,
        message: "Apologies, currently no popular softwares are available.",
        responseCode: "003",
        data: {},
      });
    }
    return res.status(200).json({
      status: true,
      message: "Popular softwares fetched successfully",
      data: { products },
      responseCode: "000",
    });
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - popular products fetching api",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - popular products fetching api",
        data: error,
      });
    }
    return next(
      new ErrorResponse("Something went wrong. Please try again later.", 400),
    );
  }
};

exports.fetchAllProductsBasedOnParentCategory = async (req, res, next) => {
  try {
    const { parentCategory } = req.params;
    const { page = 1, limit = 12, sortBy = "" } = req.query;

    const { API_URL, api_key, sessionId } = await checkPermission(req);

    const config = {
      method: "GET",
      url: `${API_URL}/products/parent-category/${encodeURIComponent(parentCategory)}`,
      params: {
        page,
        limit,
        sortBy,
      },
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
      {
        message:
          "software service - fetching all products based on parent category api request",
        request: config,
      },
      "VENDOR",
    );

    const response = await axios(config);

    customLog(req?.LogTraceId, "info", {
      message:
        "software service - fetching all products based on parent category api response",
      response: response.data,
    });

    if (!response?.data?.success || !response?.data?.data) {
      return res.status(400).json({
        status: true,
        message: "Something went wrong. Please try again later.",
        responseCode: "003",
        data: {},
      });
    }

    const products = response.data.data?.products;
    const pagination = response.data.data?.pagination;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(200).json({
        status: true,
        message:
          "Apologies, currently no softwares available under this category.",
        responseCode: "000",
        data: {
          products: [],
        },
      });
    }

    const mappedProducts = products.map((product) =>
      productCardFactory(product),
    );

    return res.status(200).json({
      status: true,
      message: "Softwares fetched successfully",
      responseCode: "000",
      data: {
        products: mappedProducts,
        pagination,
      },
    });
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      customLog(req?.LogTraceId, "error", {
        message: "Vendor service timeout. Please try again.",
        data: error?.response?.data || error.message,
      });
      return next(
        new ErrorResponse("Something went wrong. Please try again later.", 500),
      );
    } else {
      if (error?.response?.data) {
        customLog(req?.LogTraceId, "error", {
          message:
            "error : software service - fetching all products based on parent category api",
          data: error.response.data,
        });
      } else {
        customLog(req?.LogTraceId, "error", {
          message:
            "error : software service - fetching all products based on parent category api",
          data: error,
        });
      }
      return next(
        new ErrorResponse("Something went wrong. Please try again later.", 500),
      );
    }
  }
};

exports.fetchAllRfpCategories = async (req, res, next) => {
  try {
    const { API_URL, api_key, sessionId } = await checkPermission(req);

      const config = {
        method: "GET",
        url: `${API_URL}/rfp/categories`,
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
        {
          message: "software service - rfp category fetching api request",
          request: config,
        },
        "VENDOR",
      );

      const response = await axios(config);

      customLog(req?.LogTraceId, "info", {
        message: "software service - rfp category fetching api response",
        response: response.data,
      });

      if (!response?.data?.success || !response?.data?.data) {
        return res.status(400).json({
          status: true,
          message: "Something went wrong. Please try again later.",
          responseCode: "001",
          data: {},
        });
      }

      return res.status(200).json({
        status: true,
        message: "Rfp Categories fetched successfully",
        data: response.data.data,
        responseCode: "000",
      });
      
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - rfp category fetching api",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - rfp category fetching api",
        data: error,
      });
    }
    return next(
      new ErrorResponse("Something went wrong. Please try again later.", 400),
    );
  }
};

exports.fetchGeneralQuestions = async (req, res, next) => {
  try {
    const { API_URL, api_key, sessionId } = await checkPermission(req);

    const config = {
      method: "GET",
      url: `${API_URL}/rfp/questions/general`,
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
      {
        message: "software service - fetching general questions api request",
        request: config,
      },
      "VENDOR",
    );

    const response = await axios(config);

    customLog(req?.LogTraceId, "info", {
      message: "software service - fetching general questions api response",
      response: response.data,
    });

    if (!response?.data?.success || !response?.data?.data) {
      return res.status(400).json({
        status: true,
        message: "Something went wrong. Please try again later.",
        responseCode: "003",
        data: {},
      });
    }

    const generalQuestions = response.data.data?.questions;

    if (!Array.isArray(generalQuestions) || generalQuestions.length === 0) {
      return res.status(400).json({
        status: true,
        message: "Apologies, currently no general questions are available.",
        responseCode: "003",
        data: {},
      });
    }
    return res.status(200).json({
      status: true,
      message: "General Questions fetched successfully",
      data: { generalQuestions },
      responseCode: "000",
    });
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - fetching general questions api",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - fetching general questions api",
        data: error,
      });
    }
    return next(
      new ErrorResponse("Something went wrong. Please try again later.", 400),
    );
  }
};

exports.fetchCategoryQuestions = async (req, res, next) => {
  try {
    const { parentCategory } = req.params;

    const { API_URL, api_key, sessionId } = await checkPermission(req);

    const config = {
      method: "GET",
      url: `${API_URL}/rfp/questions/${encodeURIComponent(parentCategory)}`,
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
      {
        message: "software service - fetching category questions api request",
        request: config,
      },
      "VENDOR",
    );

    const response = await axios(config);

    customLog(req?.LogTraceId, "info", {
      message: "software service - fetching category questions api response",
      response: response.data,
    });

    if (!response?.data?.success || !response?.data?.data) {
      return res.status(400).json({
        status: true,
        message: "Something went wrong. Please try again later.",
        responseCode: "003",
        data: {},
      });
    }

    const categoryQuestions = response.data.data?.questions;

    if (!Array.isArray(categoryQuestions) || categoryQuestions.length === 0) {
      return res.status(400).json({
        status: true,
        message: "Apologies, currently no softwares available for this search.",
        responseCode: "003",
        data: {},
      });
    }
    return res.status(200).json({
      status: true,
      message: "Questions fetched successfully",
      data: { categoryQuestions },
      responseCode: "000",
    });
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - fetching category questions api",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - fetching category questions api",
        data: error,
      });
    }
    return next(
      new ErrorResponse("Something went wrong. Please try again later.", 400),
    );
  }
};

exports.submitAnswers = async (req, res, next) => {
  try {
    const { email, companyName: company, name } = req.user;
    const { softwareCategory, generalQuestions, specializedQuestions } =
      req.body;
    const { API_URL, api_key, sessionId } = await checkPermission(req);

    const toolkitId = await getToolkitId({
      API_URL,
      api_key,
      sessionId,
      company,
      email,
      name,
      softwareCategory,
      req,
    });
    const jobId = await submitAnswers({
      API_URL,
      api_key,
      sessionId,
      toolkitId,
      softwareCategory,
      generalQuestions,
      specializedQuestions,
      req,
    });

    if (!jobId) {
      return res.status(200).json({
        status: false,
        message: "Failed to submit answers.",
        data: {},
      });
    }

    return res.status(200).json({
      status: true,
      message: "Answers submitted successfully",
      data: { toolkitId },
      responseCode: "000",
    });
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - rfp answer submission api",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - rfp answer submission api",
        data: error,
      });
    }
    return next(
      new ErrorResponse("Something went wrong. Please try again later.", 400),
    );
  }
};

exports.fetchRecommandations = async (req, res, next) => {
  try {
    const { toolkitId } = req.params;

    const { API_URL, api_key, sessionId } = await checkPermission(req);

    const data = await getRecommandations({
      API_URL,
      api_key,
      sessionId,
      toolkitId,
      req,
    });
    return res.status(200).json({
      status: true,
      message: "Recommendations fetched successfully",
      data: { ...data },
      responseCode: "000",
    });
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - recommandations fetching api",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "error : software service - recommandations fetching api",
        data: error,
      });
    }
    return next(
      new ErrorResponse("Something went wrong. Please try again later.", 400),
    );
  }
};

exports.fetchProductDetails = async (req, res, next) => {
  try {
    const { productUrl } = req.params;
    const { API_URL, api_key, sessionId } = await checkPermission(req);
    const exchangeRates = await getCurrencyExchangeRate();

    if (!exchangeRates) {
      return res.status(500).json({
        status: true,
        message: "Something went wrong. Please try again later.",
        responseCode: "003",
        data: {},
      });
    }

    const config = {
      method: "GET",
      url: `${API_URL}/products/details/${encodeURIComponent(productUrl)}`,
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
      {
        message: "software service - product details fetching api request",
        request: config,
      },
      "VENDOR",
    );

    const response = await axios(config);

    customLog(req?.LogTraceId, "info", {
      message: "software service - product details fetching api response",
      response: response.data,
    });

    if (!response?.data?.success || !response?.data?.data) {
      return res.status(400).json({
        status: true,
        message: "Something went wrong. Please try again later.",
        responseCode: "003",
        data: {},
      });
    }
    const product = response.data.data;

    const mappedProduct = productDataMapping({ product, exchangeRates });
    return res.status(200).json({
      status: true,
      message: "Product fetched successfully",
      data: { product: mappedProduct },
      responseCode: "000",
    });
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message:
          "error : software service - product details fetching apifetching software",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message:
          "error : software service - product details fetching apifetching software",
        data: error,
      });
    }
    return next(
      new ErrorResponse("Something went wrong. Please try again later.", 400),
    );
  }
};

exports.purchaseAssistance = async (req, res, next) => {
  try {
    const { serviceDetails } = await checkPermission(req);
    const { email, contactPersonName } = req.user;
    const { productUrl } = req.params;
    const to = serviceDetails.vendor.optional3;
    let subject = "Customer Assistance Request";
    const body = generateGetAssistanceEmail({
      customerEmail: email,
      customerName: contactPersonName,
      productName: productUrl,
    });
    emailer.email(to, subject, body, function () {
      customLog(req?.LogTraceId, "info", { message: "Email sent to " + to });
    });

    return res.status(200).json({
      status: true,
      message: "Product fetched successfully",
      data: { message: "Mail sent to the provider successfully" },
      responseCode: "000",
    });
  } catch (error) {
    return next(
      new ErrorResponse("Something went wrong. Please try again later.", 400),
    );
  }
};

exports.payment = asyncHandler(async (req, res, next) => {
  const transactionCategory = "Softwares";
  const {
    amount,
    plan,
    couponCode,
    // pgAmount
  } = req.body;
  const {
    id: credentialId,
    corporateId: corporateUserId,
    name,
    email: emailId,
    contactPersonName,
    country,
    mobileNo,
    registeredBy,
    // packageId,
    // accounts_id,
  } = req.user;

  const contactName = contactPersonName || name;

  // const paymentGatewayName = req.body.paymentGatewayResponse ? req.body.paymentGatewayResponse.pgVendorName : null;

  const isPGPayment = Object.prototype.hasOwnProperty.call(
    req.body,
    "paymentGatewayResponse",
  );

  const partnerDetails = req?.user?.registeredBy
    ? await fetchPartnerDetails(req.user.registeredBy)
    : await partnerLogos();

  const { API_URL, api_key, sessionId, serviceOperatorId, serviceDetails } =
    await checkPermission(req);

  const {
    commissionType,
    cashbackType,
    providerCommission,
    cashback: corporateCashback,
  } = serviceDetails;

  const surchargeWithoutTax = calculateSurcharge(
    serviceDetails.surcharge,
    serviceDetails.surchargeType,
    amount,
  );
  const surcharge = await calculateAmountWithTax(surchargeWithoutTax);
  serviceDetails.transactionReportRule = "SERVICE_WITH_DATA_IN_ITEMS_LIST"; // ONLY TEMP
  const reportData = {};

  let corporateTxnId =  req.body.corporateTxnId ? req.body.corporateTxnId.toString() : new Date().valueOf().toString();
  let transactionResponse = {};
  
  if (isPGPayment) {
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
      couponCode,
      corporateUserId,
      partnerId: registeredBy,
    });
  } else {
    transactionResponse = await createWalletTransaction({
      corporateTxnId,
      credentialId,
      serviceOperatorId,
      corporateCashback,
      transactionCategory,
      surcharge,
      amount,
      commissionType,
      cashbackType,
      providerCommission,
      reportData,
    });
  }
  const totalAmount = (parseFloat(amount) + parseFloat(surcharge) - (transactionResponse.couponDiscount || 0)).toFixed(2);
  customLog(req.LogTraceId, "info", {
    message: "Software transactionResponse",
    data: transactionResponse,
  });
  if (
    transactionResponse &&
    Object.prototype.hasOwnProperty.call(transactionResponse, "error")
  ) {
    return next(new ErrorResponse(transactionResponse["error"], 400));
  }

  const {
    planName,
    productName,
    skuCode: planSkuId,
    webUrl,
    pricingDetails: { billingCycle },
  } = plan;

  const params = {
    planSkuId,
    productName,
    webUrl,
    planName,
    billingCycle,
    orderId: transactionResponse?.orderId,
    corporateUserId,
  };

  await createSubscription({ params });

  // await recordToZohoJournal(reportData, corporateTxnId, Number(amount) + Number(surcharge), serviceDetails.vendor, paymentGatewayName, corporateUserId, req.user.registeredBy);

  const orderResponse = {
    subscriptionDetails: plan,
  };

  const salesPayload = {
    skuCode: plan.skuCode,
    quantity: 1,
    partner: {
      name: "Peko",
      saleReference: String(corporateTxnId),
    },
    customer: {
      name: contactName,
      email: emailId,
      phone: mobileNo,
      additionalInfo: {
        company: name,
        country: country || "INDIA",
      },
    },
    payment: {
      provider: isPGPayment ? "CASHFREE" : "PEKO_WALLET",
      transactionId: String(corporateTxnId),
      amount,
      currency: "INR",
      status: "captured",
      // metadata: {
      //   source: "peko-checkout",
      //   channel: "partner-portal",
      // },
    },
  };

  const config = {
    method: "POST",
    url: `${API_URL}/sales`,
    headers: {
      Accept: "application/json",
      "X-API-Key": api_key,
      "X-Session-Id": sessionId,
    },
    data: salesPayload,
    timeout: 5000,
  };

  customLog(
    req?.LogTraceId,
    "info",
    {
      message:
        "software service - sales api from payment api controller request",
      request: config,
    },
    "VENDOR",
  );

  const handleVendorFailure = async (failureMessage) => {
    const updateDetails = {
      corporateTxnId,
      status: "FAILURE",
      providerId: "Not Available",
      message: failureMessage || "No Activation Keys Available",
      registeredById: req.user.registeredBy,
    };

    if (isPGPayment) {
      const { status } = await cancelPGTransaction(corporateTxnId);
      if (status) {
        await refundWalletTransaction(updateDetails);
        // await recordRefundToZohoJournal(
        //   reportData,
        //   corporateTxnId,
        //   Number(amount) + Number(surcharge),
        //   serviceDetails.vendor,
        //   paymentGatewayName,
        //   corporateUserId,
        //   req.user.registeredBy,
        // );
      } else {
        await paymentGateWayRefundFailureEmail(req);
      }
    } else {
      await refundWalletTransaction(updateDetails);
      // await recordRefundToZohoJournal(
      //   reportData,
      //   corporateTxnId,
      //   Number(amount) + Number(surcharge),
      //   serviceDetails.vendor,
      //   paymentGatewayName,
      //   corporateUserId,
      //   req.user.registeredBy,
      // );
    }

    await updateWalletTransaction({ ...updateDetails, corporateTxnId });
    await updateSubscriptionByCorporateTxnId(corporateTxnId, {
      status: "FAILED",
    });
    // cleverTap.uploadEvent(
    //   {
    //     eventName: "transactions_payment",
    //     eventData: {
    //       status: "Payment Failure",
    //       amount: Number(amount) + Number(surcharge),
    //     },
    //     email: emailId,
    //   },
    //   partnerDetails,
    // );

    const paymentDetails = {
      transactionId: corporateTxnId,
      amount: totalAmount,
    };

    const notificationData = {
      notificationTitle: "Software Purchase - Payment unsuccessful",
      notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Software Purchase was unsuccessful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: [req.user.username],
      notificationCategory: "CORPORATE",
      notificationBy: "ADMIN",
      accessKey,
      action: "2",
    };
    createNotification(notificationData, credentialId);

    const subject = "Payment Failed";
    const to = emailId;
    const serviceUrl = partnerDetails.baseUrl;
    const body = commonFailedTemplate(
      name,
      "Software",
      serviceUrl,
      partnerDetails,
    );

    emailer.email(to, subject, body, function () {
      customLog(req?.LogTraceId, "info", {
        message: "software service - payment api : Email sent to " + to,
      });
    });

    if (isPGPayment) {
      return res.redirect(
        `${req.body.failureUrl}?status="failure"&transactionId=${corporateTxnId}`,
      );
    }

    const walletDetails = await wallet.findOne({
      where: { credentialId },
      attributes: ["balance"],
    });

    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {
        corporateFinalBalance: walletDetails["balance"],
      },
      responseCode: "001",
    });
  };

  let response;
  try {
    response = await axios(config);
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message:
        "Error: software service - sales api from payment api controller failed",
      error,
    });
    return handleVendorFailure("Vendor service unavailable");
  }

  customLog(req?.LogTraceId, "info", {
    message:
      "software service - sales api from payment api controller Response",
    response: response.data,
  });

  if (!response?.data?.success) {
    return handleVendorFailure("No Activation Keys Available");
  } else {
    const updateDetails = {
      corporateTxnId,
      providerId: response.data.data?.sale?._id || "NA",
      status: "SUCCESS",
      message: "Payment Successful",
      orderResponse: JSON.stringify(orderResponse),
    };

    await updateWalletTransaction(updateDetails);
    // must use this in transaction events
    // cleverTap.uploadEvent(
    //   {
    //     eventName: "transactions_payment",
    //     eventData: {
    //       status: "Payment Success",
    //       amount: Number(amount) + Number(surcharge),
    //     },
    //     email: emailId,
    //   },
    //   partnerDetails,
    // );

    // Create a payment details object with the relevant details
    transactionResponse.datetime = new Date();
    transactionResponse.amount = amount;
    const paymentDetails = {
      products: JSON.stringify(orderResponse.subscriptionDetails),
      transactionId: corporateTxnId,
      amount: totalAmount
    };

    // Send push notification with payment details
    const notificationData = {
      notificationTitle: "Software Purchase - Payment successful",
      notificationBrief: `Payment of ₹ ${paymentDetails.amount} for Software Purchase was successful. Transaction ID: ${paymentDetails.transactionId}.`,
      notificationTo: [req.user.username], // Replace with the user ID or username to send the notification to
      notificationCategory: "CORPORATE", // Replace with the relevant category
      notificationBy: "ADMIN", // Replace with the user or system that triggered the notification
      accessKey,
      action: "1",
    };
    createNotification(notificationData, credentialId);

    // mail to user and notification to user --------------------
    const to = emailId;
    const subject = "Software purchase success";
    const body = generateSubscriptionSuccessEmailV2();

    // const { receiptPdf, invoicePdf } = await generateInvoiceAndReceipt({
    //   amount,
    //   surcharge,
    //   corporateTxnId,
    //   orderId: transactionResponse?.orderId,
    //   paymentType: "Software",
    //   couponCode,
    //   corporateUserId,
    //   credentialId,
    //   serviceOperatorId,
    //   registeredBy,
    //   accessKey,
    //   pgAmount,
    //   sendInvoiceToVendor: true,
    //   commissionIncludingVAT:
    //     reportData?.journalData?.commissionIncldingVAT || 0,
    //   vendor: serviceDetails?.vendor,
    // });
    emailer.emailWithMultipleAttachment(
      to,
      subject,
      body,
      [].filter(Boolean),
      async (emailErr) => {
        if (emailErr) {
          customLog(req?.LogTraceId, "error", {
            message: "software service - payment api : Error sending email",
            emailErr,
          });
        } else {
          customLog(req?.LogTraceId, "info", {
            message: "software service - payment api : Email sent to " + to,
          });
        }
      },
    );

    if (isPGPayment) {
      return res.redirect(
        `${req.body.successUrl}?status="success"&transactionId=${corporateTxnId}`,
      );
    } else {
      return res.status(200).json({
        status: true,
        data: {
          ...transactionResponse,
          corporateTxnId,
        },
        message: "payment successfull",
        responseCode: "000",
      });
    }
  }
});

exports.fetchOrderDetails = async (req, res, next) => {
  try {
    let { from, to, searchText = "", page = 1, limit = 10 } = req.query;

    let { id: corporateId } = req.user;

    await checkPermission(req);

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    let params = {
      from,
      to,
      searchText,
      limit,
      offset,
      corporateId,
    };

    customLog(req.LogTraceId, "info", {
      message:
        "software service - fetching order details api - corporate_software_subscriptions db request",
      data: params,
    });

    const transactionsData = await findAllSubscriptionsWithOrders(params);

    customLog(req.LogTraceId, "info", {
      message:
        "software service - fetching order details api - corporate_software_subscriptions db response",
      data: transactionsData,
    });

    if (!transactionsData) {
      return next(new ErrorResponse(`Something went wrong`, 400));
    } else {
      let finalPayload = transactionsData.rows.map((subscription) => {
        const sub = subscription.toJSON();
        return {
          id: sub.order.id,
          paymentMode: sub.order.paymentMode,
          status: sub.order.status,
          orderId: sub.order.corporateTxnId,
          purchasedOn: new Date(sub.order.transactionDate).toLocaleString(),
          totalAmount: sub.order.amountInINR,
          planName: sub.planName || "NA",
          productName: sub.productName || "NA",
        };
      });
      return res.status(200).json({
        status: true,
        data: {
          orderDetails: finalPayload,
          totalData: transactionsData.count,
        },
        message: "order details fetched successfully!!",
        responseCode: "000",
      });
    }
  } catch (error) {
    if (error?.response?.data) {
      customLog(req?.LogTraceId, "error", {
        message: "Error : software service - fetching order details api",
        data: error.response.data,
      });
    } else {
      customLog(req?.LogTraceId, "error", {
        message: "Error : software service - fetching order details api",
        data: error,
      });
    }
    return next(
      new ErrorResponse("Something went wrong. Please try again later.", 400),
    );
  }
};

exports.fetchOneOrder = async (req, res, next) => {
  try {
    let { orderId } = req.params;

    let { id: credentialId } = req.user;

    await checkPermission(req);

    const subscriptionAttributes = [
      "status",
      "subscriptionStartDate",
      "subscriptionEndDate",
      "billingCycle",
      "purchaseType",
      "productName",
      "isCancelled",
    ];
    const orderAttribute = ["amountInINR", "paymentMode"];

    let params = {
      orderId,
    };

    customLog(req.LogTraceId, "info", {
      message:
        "software service - fetching single subscription details api - corporate_software_subscriptions table db request",
      data: params,
    });

    const subscriptionData = await findOneSubscription({
      credentialId,
      corporateTxnId: orderId,
      params,
      subscriptionAttributes,
      orderAttribute,
    });

    customLog(req.LogTraceId, "info", {
      message:
        "software service - fetching single subscription details api - corporate_software_subscriptions table db response",
      data: subscriptionData,
    });

    if (!subscriptionData) {
      return next(new ErrorResponse(`Something went wrong`, 400));
    } else {
      return res.status(200).json({
        status: true,
        data: {
          orderDetails: subscriptionData,
        },
        message: "subscription details fetched successfully!!",
        responseCode: "000",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message:
        "Error : software service - fetching single subscription details api",
      data: error,
    });

    return next(
      new ErrorResponse("Something went wrong. Please try again later.", 400),
    );
  }
};

exports.handleSubscriptionStatus = asyncHandler(async (req, res, next) => {
  customLog(req?.LogTraceId, "info", {
    message: "Softwares webhook data",
    webhookData: req.body,
  });

  const {
    saleReference: corporateTxnId,
    fulfillmentSummary: {
      purchaseType,
      billingCycle,
      accessStartDate: subscriptionStartDate,
      accessEndDate: subscriptionEndDate,
      nextRenewalDate: subscriptionRenewalDate,
    },
  } = req.body;
  const serviceDetails = await findServiceOperatorByAccessKey(accessKey);

  // IP Whitelisting
  const clientIP = req.headers["x-forwarded-for"]?.split(",")[0].trim();

  const whitelistedIPs = serviceDetails.vendor.optional2;

  if (process.env.NODE_ENV === "production") {
    if (!clientIP || !whitelistedIPs.includes(clientIP)) {
      customLog(req?.LogTraceId, "error", {
        message: "SOFTWARES IP VALIDATION FAILED",
        recivedIP: clientIP,
        whitelistedIPs: whitelistedIPs,
      });
      return next(
        new ErrorResponse("Access denied: IP address not whitelisted", 400),
      );
    }
  }

  if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
    return res.status(400).send();
  }

  const params = {
    purchaseType,
    subscriptionStartDate,
    subscriptionEndDate,
    billingCycle,
    subscriptionRenewalDate,
    vendorResponse: JSON.stringify(req.body),
    status:
      new Date(subscriptionStartDate) <= new Date() ? "ACTIVE" : "PENDING",
  };
  const subscriptionPlan = await updateSubscriptionByCorporateTxnId(
    corporateTxnId,
    params,
  );
  if (subscriptionPlan) return res.status(200).json({ message: "success" });
  else return res.status(400).json({ message: "failure" });
});

exports.cancelPlan = async (req, res) => {
  try {
    const { orderId: corporateTxnId } = req.body;

    const { API_URL, api_key, sessionId } = await checkPermission(req);

    const {
      id: credentialId,
      name,
      email: emailId,
      contactPersonName,
      country,
      mobileNo,
    } = req.user;

    const contactName = contactPersonName || name;

    const params = {
      credentialId,
      corporateTxnId,
    };
    const subscriptionData = await findOneSubscription(params);

    if (!subscriptionData) {
      return res.status(400).json({
        status: true,
        message: "Something went wrong. Please try again later.",
        responseCode: "001",
        data: {},
      });
    }
    const { planSkuId, order: subscriptionOrder } = subscriptionData;
    const isPGPayment =
      subscriptionOrder?.paymentMode?.includes("PAYMENT GATEWAY");
    const paymentProvider = isPGPayment
      ? "NETWORK_INTERNATIONAL"
      : "PEKO_WALLET";

    const salesPayload = {
      skuCode: planSkuId,
      saleType: "cancel_sale",
      relatedSaleReference: String(corporateTxnId),
      quantity: 1,
      partner: {
        name: "Peko",
        saleReference: String(new Date().valueOf()),
      },
      customer: {
        name: contactName,
        email: emailId,
        phone: mobileNo,
        additionalInfo: {
          company: name,
          country: country || "UAE",
        },
      },
      payment: {
        provider: paymentProvider,
        transactionId: String(corporateTxnId),
        amount: "0",
        currency: "AED",
        status: "captured",
      },
    };

    const config = {
      method: "POST",
      url: `${API_URL}/sales`,
      headers: {
        Accept: "application/json",
        "X-API-Key": api_key,
        "X-Session-Id": sessionId,
      },
      data: salesPayload,
      timeout: 5000,
    };

    customLog(
      req?.LogTraceId,
      "info",
      {
        message:
          "software service - sales api from cancel plan api controller request",
        request: config,
      },
      "VENDOR",
    );

    const response = await axios(config);

    customLog(req?.LogTraceId, "info", {
      message:
        "software service - sales api from cancel plan api controller Response",
      response: response.data,
    });

    const updateData = {
      isCancelled: true,
    };
    const subscriptionPlan = await updateSubscriptionByCorporateTxnId(
      corporateTxnId,
      updateData,
    );

    if (!subscriptionPlan) {
      return res.status(400).json({
        status: true,
        message: "Something went wrong. Please try again later.",
        responseCode: "001",
        data: {},
      });
    }

    return res.status(200).json({
      status: true,
      message: "Subscription cancelled successfully",
      responseCode: "000",
      data: {},
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "Softwares Cancel Plan Error",
      error,
    });
    return res.status(400).json({
      status: true,
      message: "Something went wrong. Please try again later.",
      responseCode: "001",
      data: {},
    });
  }
};
