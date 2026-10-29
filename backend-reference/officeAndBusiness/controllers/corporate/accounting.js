const axios = require("axios");
const asyncHandler = require("../../middlewares/async");
const {
  fetchServiceDetails,
} = require("../../utils/checkAndFetchServiceDetails");
const ErrorResponse = require("../../utils/error-response");
const {
  findOne,
  findAndCountUserPlans,
  cancelUserServiceSubscription,
} = require("../../models/use-cases/serviceSubscription");
const {
  findOne: findOneCorporateUser,
} = require("../../models/use-cases/corporateUser");
const {
  findPackageByAccessCode,
} = require("../../models/use-cases/subscription");
const { customLog } = require("../../utils/loggerHelper");

const accessKey = "accounting";

exports.findPlan = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.user;
    let planDetails = await findOne({ credentialId: id, status: "ACTIVE" }, [
      "id",
      "subscriptionStartDate",
      "subscriptionEndDate",
      "subscriptionAmountPaid",
      "status",
      "billingType",
      "vendorResponse",
      "isCancelled"
    ]);
    if (!planDetails) {
      return res.status(200).json({
        status: true,
        message: "Data retrieved successfully",
        responseCode: "000",
        data: { isPurchased: false },
      });
    }
    planDetails.isPurchased = planDetails.status === "ACTIVE" ? true : false;
    return res.status(200).json({
      status: true,
      message: "Data retrieved successfully",
      responseCode: "000",
      data: { ...planDetails },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Error fetching plan details:", data: error?.response?.data || error?.response || error })
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.dashboard = asyncHandler(async (req, res, next) => {
  try {
    let {
      id: credentialId,
      packageId,
      corporateId: corporateUserId,
      accounts_id,
    } = req.user;
    if (isValueEmpty(accounts_id)) {
      const corporateUser = await findOneCorporateUser(
        { corporateId: credentialId },
        ["accounts_id"]
      );
      accounts_id = corporateUser.accounts_id;
    }
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
          400
        )
      );
    }
    const { apiUrl: URL, optional1: API_KEY } = serviceDetails.vendor;

    const config = {
      method: "get",
      url: `${URL}/user/partner/external/stats/${accounts_id}`,
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    };

    customLog(req?.LogTraceId, "info", { message: "dashboardDetails=asyncHandler ~ config", data: config }, "VENDOR", ["Authorization"])
    const result = await axios(config);
    customLog(req?.LogTraceId, "info", { message: "dashboardDetails=asyncHandler ~ result:", data: result?.data?.response || result?.data || result }, "VENDOR")
    if (result?.data?.status) {
      return res.status(200).json({
        status: true,
        message: "Data retrieved successfully",
        responseCode: "000",
        data: result.data.data,
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Failed to retrieve data",
        responseCode: "001",
        data: {},
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Error fetching dashboard details", data: error?.response?.data || error?.response || error })
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.chartInfo = asyncHandler(async (req, res, next) => {
  try {
    let {
      id: credentialId,
      packageId,
      corporateId: corporateUserId,
      accounts_id,
    } = req.user;
    if (isValueEmpty(accounts_id)) {
      const corporateUser = await findOneCorporateUser(
        { corporateId: credentialId },
        ["accounts_id"]
      );
      accounts_id = corporateUser.accounts_id;
    }
    const { from, to, type="expense" } = req.query;
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
          400
        )
      );
    }
    const { apiUrl: URL, optional1: API_KEY } = serviceDetails.vendor;
    const config = {
      method: "get",
      url: `${URL}/user/partner/external/charts/${accounts_id}?from=${from}&to=${to}&type=${type}`,
      maxBodyLength: Infinity,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    };

    customLog(req?.LogTraceId, "info", { message: "dashboardDetails=asyncHandler ~ config:", data: config }, "VENDOR", ["Authorization"])
    const result = await axios(config);
    customLog(req?.LogTraceId, "info", { message: "expenses=asyncHandler ~ result:", data: result?.data }, "VENDOR")
    if (result?.data?.status) {
      return res.status(200).json({
        status: true,
        message: "Data retrieved successfully",
        responseCode: "000",
        data: result.data.data,
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Failed to retrieve data",
        responseCode: "001",
        data: {},
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Error fetching expense details", data: error?.response?.data || error?.response || error })
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.tasks = asyncHandler(async (req, res, next) => {
  try {
    let {
      id: credentialId,
      packageId,
      corporateId: corporateUserId,
      accounts_id,
    } = req.user;
    if (isValueEmpty(accounts_id)) {
      const corporateUser = await findOneCorporateUser(
        { corporateId: credentialId },
        ["accounts_id"]
      );
      accounts_id = corporateUser.accounts_id;
    }
    const { page, itemsPerPage } = req.query;
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
          400
        )
      );
    }
    const { apiUrl: URL, optional1: API_KEY } = serviceDetails.vendor;
    const config = {
      method: "get",
      url: `${URL}/user/partner/external/tasks/${accounts_id}?page=${page}&limit=${itemsPerPage}`,
      maxBodyLength: Infinity,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    };

    customLog(req?.LogTraceId, "info", { message: "dashboardDetails=asyncHandler ~ config:", data: config }, "VENDOR", ["Authorization"])
    const result = await axios(config);
    customLog(req?.LogTraceId, "info", { message: "expenses=asyncHandler ~ result:", data: result?.data }, "VENDOR")
    if (result?.data?.status) {
      return res.status(200).json({
        status: true,
        message: "Data retrieved successfully",
        responseCode: "000",
        data: result.data.data,
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Failed to retrieve data",
        responseCode: "001",
        data: {},
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Error fetching tasks details", data: error?.response?.data || error?.response || error })
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.loginLink = asyncHandler(async (req, res, next) => {
  try {
    let {
      id: credentialId,
      packageId,
      corporateId: corporateUserId,
      accounts_id,
    } = req.user;
    const { destination } = req.query;
    if (isValueEmpty(accounts_id)) {
      const corporateUser = await findOneCorporateUser(
        { corporateId: credentialId },
        ["accounts_id"]
      );
      accounts_id = corporateUser.accounts_id;
    }
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
          400
        )
      );
    }
    let {
      apiUrl: URL,
      optional1: API_KEY,
      optional2: REDIRECT_URL,
    } = serviceDetails.vendor;
    if(req.query.url){
      REDIRECT_URL = decodeURIComponent(req.query.url);
    }
    const config = {
      method: "get",
      url: `${URL}/user/partner/external/users/${accounts_id}/generate-login-url?redirect_url=${REDIRECT_URL}&destination=${destination}`,
      maxBodyLength: Infinity,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
    };

    customLog(req?.LogTraceId, "info", { message: "dashboardDetails=asyncHandler ~ config:", data: config }, "VENDOR", ["Authorization"])
    const result = await axios(config);
    customLog(req?.LogTraceId, "info", { message: "expenses=asyncHandler ~ result:", data: result?.data }, "VENDOR")
    if (result?.data?.status) {
      return res.status(200).json({
        status: true,
        message: "Data retrieved successfully",
        responseCode: "000",
        data: result.data.data,
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Failed to retrieve data",
        responseCode: "001",
        data: {},
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: "Error fetching task details", data: error?.response?.data || error?.response || error })
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.getPurchaseHistory = asyncHandler(async (req, res) => {
  const corporateId = req.user.corporateId;
  let { page, itemsPerPage } = req.query;

  // Parse page and itemsPerPage to integers (you can also use parseInt)
  page = page ? parseInt(page) : 1;
  itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
  let limit = itemsPerPage;

  // Calculate offset based on page and itemsPerPage
  let offset;
  if (page && itemsPerPage) {
    offset = (page - 1) * itemsPerPage;
  }

  let params = {
    limit,
    offset,
    corporateId,
  };
  try {
    const activePlans = await findAndCountUserPlans(params);
    if (!activePlans) {
      return res.status(500).json({
        status: false,
        message: "Failed to fetch plan purchase history",
        data: {},
        responseCode: "001",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Plans history fetched successfully",
      data: {
        activePlans,
      },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return res.status(500).json({
      status: false,
      message: "Something went wrong while fetching plan purchase history",
      data: {},
      responseCode: "001",
    });
  }
});

exports.findTransactionDetails = asyncHandler(async (req, res) => {
  try {
    let subscriptionId = req.params.subscriptionId;
    const { id } = req.user;

    if (subscriptionId) {
      const result = await findOne({ credentialId: id, id: subscriptionId });

      if (!result) {
        return res.status(500).json({
          status: false,
          message: "Plan details not found.",
          data: {},
          responseCode: "001",
        });
      }

      if (result?.invoiceId) {
        // invoice with zoho

        return res.status(200).json({
          status: true,
          message: "Invoice generated successfully.",
          data: {
            pdfBuffer: null,
          },
          responseCode: "000",
        });
      } else {
        // Only need to keep if needed to get invoice for all the old subscription histories (with peko's template)
     
        const receiptPdf = null;
        return res.status(200).json({
          status: true,
          message: "Invoice generated successfully.",
          data: {
            pdfBuffer: receiptPdf.content,
          },
          responseCode: "000",
        });
      }
    } else {
      return res.status(400).json({
        status: false,
        message: "Plan ID not provided",
        data: {},
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return res.status(500).json({
      status: false,
      message: "Something went wrong, please try again later.",
      data: {},
      responseCode: "001",
    });
  }
});

exports.cancelServiceSubscription = asyncHandler(async (req, res, next) => {
  const { subscriptionId } = req.params;
  let { id: credentialId, packageId, corporateId, accounts_id } = req.user;
  if (!subscriptionId) {
    return res.status(400).json({
      status: false,
      message: "Subscription ID not provided",
      data: {},
      responseCode: "001",
    });
  }
  try {
    if (isValueEmpty(accounts_id)) {
      const corporateUser = await findOneCorporateUser(
        { corporateId: credentialId },
        ["accounts_id"]
      );
      accounts_id = corporateUser.accounts_id;
    }

    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId: corporateId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      return next(
        new ErrorResponse(
          "Apologies, the service you are trying to access is currently unavailable.",
          400
        )
      );
    }
    const subscription = await findOne({
      credentialId: credentialId,
      id: subscriptionId,
    });
    if (!subscription) {
      return res.status(404).json({
        status: false,
        message: "Invalid subscription details.",
        data: {},
        responseCode: "001",
      });
    }

    if (subscription.status === "CANCELLED") {
      return res.status(200).json({
        status: true,
        message: "Subscription already cancelled",
        data: {},
        responseCode: "001",
      });
    }
    const result = await cancelSubscriptionViaApi(
      serviceDetails.vendor,
      accounts_id
    );

    if (result?.status) {
      const response = await cancelUserServiceSubscription({
        subscriptionId,
        corporateId,
      });

      if (!response.success) {
        return res.status(400).json({
          status: false,
          message: "Something went wrong while cancelling the subscription.",
          data: {},
          responseCode: "001",
        });
      }
      return res.status(200).json({
        status: true,
        message: response.message,
        data: {},
        responseCode: "000",
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Something went wrong while cancelling the subscription.",
        data: {},
        responseCode: "001",
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return res.status(500).json({
      status: false,
      message: "Something went wrong while cancelling the subscription.",
      data: {},
      responseCode: "001",
    });
  }
});

exports.getSubscriptionPlans = asyncHandler(async (req, res) => {
  try {
    const accessCode = req.query.accessKey;
    const partnerId = req.user.registeredBy;
    let servicePurchaseDetails;
    if (accessCode) {
      servicePurchaseDetails = await findPackageByAccessCode(
        accessCode,
        partnerId
      );
    } else {
      return res.status(500).json({
        status: false,
        message: "Failed to fetch Package details",
        data: {},
        responseCode: "001",
      });
    }

    if (!servicePurchaseDetails.length) {
      return res.status(400).json({
        status: false,
        message: "Failed to fetch Package details",
        data: {},
        responseCode: "001",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Package details fetched successfully",
      data: {
        packageDetails: servicePurchaseDetails,
      },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return res.status(500).json({
      status: false,
      message: "Failed to fetch Package details",
      data: {},
      responseCode: "001",
    });
  }
});

async function cancelSubscriptionViaApi(vendor, accounts_id) {
  const { apiUrl, optional1: apiKey } = vendor;
  const config = {
    method: "put",
    url: `${apiUrl}/user/partner/external/subscriptions/${accounts_id}/cancel`,
    maxBodyLength: Infinity,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
  };

  try {
    console.log("🚀 ~ exports.dashboardDetails=asyncHandler ~ config:", config);
    const response = await axios(config);
    console.log("🚀 ~ exports.expenses=asyncHandler ~ result:", response?.data);
    return response?.data || {};
  } catch (error) {
    console.error(
      "Error during external API call for subscription cancellation:",
      error
    );
    throw new Error("Failed to communicate with the external service.");
  }
}

exports.createExpense = async (
  serviceDetailsData,
  { accounts_id, amount, payment_method="other", currency = "AED", credentialId, category= "other", merchant= "Peko" }
) => {
  if (isValueEmpty(accounts_id)) {
    const corporateUser = await findOneCorporateUser(
      { corporateId: credentialId },
      ["accounts_id"]
    );
    accounts_id = corporateUser.accounts_id;
  }
  if(isValueEmpty(accounts_id)) {
    console.log("INFO: TRANSACTION IS NOT RECORDED IN ACCOUNTING", typeof accounts_id);
    return
  }
  payment_method = payment_method === "PAYMENT GATEWAY" ? "card" : "other"
  serviceDetailsData.accessKey = accessKey;
  const serviceDetails = await fetchServiceDetails(serviceDetailsData);
  const { apiUrl, optional1: apiKey, type } = serviceDetails.vendor;
  const config = {
    method: "post",
    url: `${apiUrl}/user/partner/external/expenses/${accounts_id}`,
    maxBodyLength: Infinity,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    data: {
      type: type,
      date: new Date(),
      category,
      merchant,
      amount,
      payment_method,
      currency,
    },
  };
  try {
    console.log("🚀 ~Timber api config:", config)
    const response = await axios(config);
    console.log("🚀 ~ exports.expenses=asyncHandler ~ result:", response?.data || response);
    return response?.data || {};
  } catch (error) {
    console.error(
      "Error during external API call for expense creation:",
      error?.response || error
    );
  }
};

const isValueEmpty = (value) => {
  return value === "" || value === null || value === undefined;
};
