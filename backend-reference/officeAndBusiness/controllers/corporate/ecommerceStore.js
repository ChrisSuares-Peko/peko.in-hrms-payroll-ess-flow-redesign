const asyncHandler = require("../../middlewares/async");
const { timingSafeEqual } = require("crypto");
const ErrorResponse = require("../../utils/error-response");
const {
  findActiveByAccessCode,
  findLastTerminatedByAccessCode,
  cancelUserServiceSubscription,
} = require("../../models/use-cases/serviceSubscription");
const {
  findPackageByAccessCode,
} = require("../../models/use-cases/subscription");
const { findOne: findOneServiceOperator } = require("../../models/use-cases/serviceOperator");
const ServiceSubscription = require("../../models/entities/serviceSubscription");
const { postTenantApi } = require("../../utils/pekoEcomClient");
const { fireSubscriptionCanceled } = require("../../utils/pekoEcomEvents");
const { customLog } = require("../../utils/loggerHelper");
const { computeUpgradeCredit } = require("../../utils/upgradeCredit");

const accessCode = "ecommerce_store";
const PUBLIC_API_KEY_HEADERS = ["x-api-key", "api_key"];

const getPublicApiKey = (headers = {}) => {
  for (const headerName of PUBLIC_API_KEY_HEADERS) {
    const headerValue = headers[headerName];
    if (Array.isArray(headerValue)) {
      if (headerValue[0]) return headerValue[0].trim();
      continue;
    }
    if (typeof headerValue === "string" && headerValue.trim()) {
      return headerValue.trim();
    }
  }
  return null;
};

const isMatchingSecret = (receivedSecret, expectedSecret) => {
  if (
    typeof receivedSecret !== "string" ||
    typeof expectedSecret !== "string" ||
    !receivedSecret ||
    !expectedSecret
  ) {
    return false;
  }

  const receivedBuffer = Buffer.from(receivedSecret);
  const expectedBuffer = Buffer.from(expectedSecret);

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(receivedBuffer, expectedBuffer);
};

const normalizePartnerId = (partnerId) => {
  if (Array.isArray(partnerId)) {
    partnerId = partnerId[0];
  }

  if (partnerId == null) {
    return null;
  }

  if (typeof partnerId !== "string") {
    return partnerId;
  }

  const normalizedPartnerId = partnerId.trim();
  if (!normalizedPartnerId) {
    return null;
  }

  if (normalizedPartnerId === "null" || normalizedPartnerId === "default") {
    return null;
  }

  return normalizedPartnerId;
};

const fetchSubscriptionPlansByPartner = async (partnerId, requestedAccessCode = accessCode) => {
  if (!requestedAccessCode) {
    return {
      httpStatus: 500,
      body: {
        status: false,
        message: "Failed to fetch Package details",
        data: {},
        responseCode: "001",
      },
    };
  }

  const normalizedPartnerId = normalizePartnerId(partnerId);
  const servicePurchaseDetails = await findPackageByAccessCode(
    requestedAccessCode,
    normalizedPartnerId
  );

  if (!servicePurchaseDetails || !servicePurchaseDetails.length) {
    return {
      httpStatus: 400,
      body: {
        status: false,
        message: "Failed to fetch Package details",
        data: {},
        responseCode: "001",
      },
    };
  }

  return {
    httpStatus: 200,
    body: {
      status: true,
      message: "Package details fetched successfully",
      data: {
        packageDetails: servicePurchaseDetails,
      },
      responseCode: "000",
    },
  };
};

exports.findPlan = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.user;
    let planDetails = await findActiveByAccessCode(id, accessCode, [
      "id",
      "subscriptionStartDate",
      "subscriptionEndDate",
      "subscriptionAmountPaid",
      "subscriptionPrice",
      "discount",
      "status",
      "billingType",
      "vendorResponse",
      "isCancelled",
    ]);
    let previousSubscription = await findLastTerminatedByAccessCode(id, accessCode);
    if (previousSubscription) {
      previousSubscription = {
        packageId: previousSubscription.packageId,
        packageName: previousSubscription.package.packageName,
        subscriptionEndDate: previousSubscription.subscriptionEndDate,
        billingType: previousSubscription.billingType,
        status: previousSubscription.status,
      };
    } else {
      previousSubscription = null;
    }
    if (!planDetails) {
      return res.status(200).json({
        status: true,
        message: "Data retrieved successfully",
        responseCode: "000",
        data: { isPurchased: false, previousSubscription },
      });
    }
    planDetails.isPurchased = planDetails.status === "ACTIVE" ? true : false;
    planDetails.upgradeCredit = computeUpgradeCredit(planDetails);

    const { billingType, package: selectedPackage } = planDetails;
    const currentSubscriptionAmount =
      billingType === "MONTHLY"
        ? parseFloat(selectedPackage.packagePrices.monthly)
        : parseFloat(selectedPackage.packagePrices.annually);
    planDetails.subscriptionAmountPaid = currentSubscriptionAmount;

    return res.status(200).json({
      status: true,
      message: "Data retrieved successfully",
      responseCode: "000",
      data: { ...planDetails, previousSubscription },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "Error fetching plan details:",
      data: error?.response?.data || error?.response || error,
    });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.cancelServiceSubscription = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;
  const { id: credentialId, corporateId } = req.user;
  if (!subscriptionId) {
    return res.status(400).json({
      status: false,
      message: "Subscription ID not provided",
      data: {},
      responseCode: "001",
    });
  }
  try {
    const subscription = await findActiveByAccessCode(credentialId, accessCode);
    if (!subscription) {
      return res.status(404).json({
        status: false,
        message: "Invalid subscription details.",
        data: {},
        responseCode: "001",
      });
    }

    if (subscription.isCancelled) {
      return res.status(200).json({
        status: true,
        message: "Subscription already cancelled",
        data: {},
        responseCode: "000",
      });
    }

    const response = await cancelUserServiceSubscription({
      subscriptionId: subscription.id,
      corporateId: subscription.corporateUserId ?? corporateId,
    });

    if (!response.success) {
      return res.status(400).json({
        status: false,
        message: "Something went wrong while cancelling the subscription.",
        data: {},
        responseCode: "001",
      });
    }

    void fireSubscriptionCanceled({
      sub: subscription,
      packageId: subscription.packageId,
    });

    return res.status(200).json({
      status: true,
      message: response.message,
      data: {},
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: error?.message,
      data: error?.response?.data,
    });
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
    const accessCodeParam = req.query.accessKey;
    const partnerId = req.user.registeredBy;
    const result = await fetchSubscriptionPlansByPartner(
      partnerId,
      accessCodeParam
    );

    return res.status(result.httpStatus).json(result.body);
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: error?.message,
      data: error?.response?.data,
    });
    return res.status(500).json({
      status: false,
      message: "Failed to fetch Package details",
      data: {},
      responseCode: "001",
    });
  }
});

exports.getPublicSubscriptionPlans = asyncHandler(async (req, res) => {
  try {
    const partnerId = normalizePartnerId(req.query.partnerId);
    const receivedApiKey = getPublicApiKey(req.headers);

    if (!receivedApiKey) {
      return res.status(401).json({
        status: false,
        message: "API key not provided",
        data: {},
        responseCode: "002",
      });
    }

    const serviceOperator = await findOneServiceOperator({ accessKey: accessCode });
    const configuredApiKey = serviceOperator?.vendor?.optional3;

    if (!configuredApiKey) {
      customLog(req?.LogTraceId, "error", {
        message: "Public ecommerce plans API key is not configured",
      });
      return res.status(503).json({
        status: false,
        message: "Public plans API is not configured",
        data: {},
        responseCode: "001",
      });
    }

    if (!isMatchingSecret(receivedApiKey, configuredApiKey)) {
      return res.status(401).json({
        status: false,
        message: "Invalid API key",
        data: {},
        responseCode: "002",
      });
    }

    const result = await fetchSubscriptionPlansByPartner(partnerId, accessCode);
    return res.status(result.httpStatus).json(result.body);
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: error?.message,
      data: error?.response?.data,
    });
    return res.status(500).json({
      status: false,
      message: "Failed to fetch Package details",
      data: {},
      responseCode: "001",
    });
  }
});

const loadVendorEndpoint = async () => {
  const operator = await findOneServiceOperator({ accessKey: accessCode });
  if (!operator || !operator.vendor) return null;
  const apiUrl = operator.vendor.apiUrl;
  const secret = operator.vendor.optional2;
  if (!apiUrl || !secret) return null;
  return { apiUrl, secret };
};

const mapVendorError = (err) => {
  const code = err?.response?.status;
  const vendorMessage = err?.response?.data?.message;
  if (code === 400) {
    return { httpStatus: 400, message: vendorMessage || "Active subscription required" };
  }
  if (code === 404) {
    return { httpStatus: 404, message: vendorMessage || "Peko user record missing" };
  }
  if (code === 409) {
    return { httpStatus: 409, message: vendorMessage || "Store name already taken" };
  }
  if (code === 401) {
    return { httpStatus: 502, message: "Vendor authentication failed" };
  }
  return { httpStatus: 500, message: vendorMessage || "Tenant provisioning failed" };
};

exports.setupTenant = asyncHandler(async (req, res) => {
  try {
    const pekoUserId = String(req.user.id);
    const {
      storeName,
      email,
      phone,
      businessAddresses,
      primaryColor,
      seoMetadata,
      taxRate,
      taxInclusive,
      taxEnabled,
    } = req.body;

    if (!storeName) {
      return res.status(400).json({
        status: false,
        message: "Store name is required",
        data: {},
        responseCode: "001",
      });
    }

    const endpoint = await loadVendorEndpoint();
    if (!endpoint) {
      return res.status(503).json({
        status: false,
        message: "Peko Commerce vendor is not configured",
        data: {},
        responseCode: "001",
      });
    }

    const payload = {
      pekoUserId,
      storeName,
      country: "india",
      ...(email && { email }),
      ...(phone && { phone }),
      ...(businessAddresses && { businessAddresses }),
      ...(primaryColor && { primaryColor }),
      ...(seoMetadata && { seoMetadata }),
      ...(taxRate != null && { taxRate }),
      ...(taxInclusive != null && { taxInclusive }),
      ...(taxEnabled != null && { taxEnabled }),
    };

    const resp = await postTenantApi({
      apiUrl: endpoint.apiUrl,
      secret: endpoint.secret,
      path: "/peko-api/tenant",
      payload,
    });

    try {
      const activeSubscription = await findActiveByAccessCode(req.user.id, accessCode, ["id"]);
      if (activeSubscription?.id) {
        await ServiceSubscription.update(
          { vendorResponse: resp.data },
          { where: { id: activeSubscription.id } }
        );
      }
    } catch (updateErr) {
      customLog(req?.LogTraceId, "error", {
        message: "Failed to persist tenant DTO onto serviceSubscription",
        data: updateErr?.message,
      });
    }

    return res.status(200).json({
      status: true,
      message: "Store configured successfully",
      data: resp.data,
      responseCode: "000",
    });
  } catch (err) {
    customLog(req?.LogTraceId, "error", {
      message: "setupTenant error",
      data: err?.response?.data || err?.message || err,
    });
    const mapped = mapVendorError(err);
    return res.status(mapped.httpStatus).json({
      status: false,
      message: mapped.message,
      data: {},
      responseCode: "001",
    });
  }
});

exports.getTenantStats = asyncHandler(async (req, res) => {
  try {
    const pekoUserId = String(req.user.id);
    const endpoint = await loadVendorEndpoint();
    if (!endpoint) {
      return res.status(503).json({
        status: false,
        message: "Peko Commerce vendor is not configured",
        data: {},
        responseCode: "001",
      });
    }

    const resp = await postTenantApi({
      apiUrl: endpoint.apiUrl,
      secret: endpoint.secret,
      path: "/peko-api/tenant/stats",
      payload: { pekoUserId },
    });

    const data = resp?.data;
    const toMajorUnits = (money) => {
      if (!money || money.amount == null) return money;
      const major = Number(money.amount) / 100;
      return {
        ...money,
        amount: Number.isFinite(major) ? major.toFixed(2) : money.amount,
      };
    };
    if (data?.orders) {
      data.orders.totalRevenue = toMajorUnits(data.orders.totalRevenue);
      if (data.orders.last30Days) {
        data.orders.last30Days.revenue = toMajorUnits(data.orders.last30Days.revenue);
      }
      if (data.orders.thisMonth) {
        data.orders.thisMonth.revenue = toMajorUnits(data.orders.thisMonth.revenue);
      }
      if (data.orders.previousMonth) {
        data.orders.previousMonth.revenue = toMajorUnits(data.orders.previousMonth.revenue);
      }
    }

    return res.status(200).json({
      status: true,
      message: "Tenant stats fetched successfully",
      data,
      responseCode: "000",
    });
  } catch (err) {
    if (err?.response?.status === 404) {
      return res.status(200).json({
        status: true,
        message: "No tenant yet",
        data: null,
        responseCode: "000",
      });
    }
    customLog(req?.LogTraceId, "error", {
      message: "getTenantStats error",
      data: err?.response?.data || err?.message || err,
    });
    return res.status(500).json({
      status: false,
      message: "Failed to fetch tenant stats",
      data: {},
      responseCode: "001",
    });
  }
});
