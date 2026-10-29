const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const {
  findActiveByAccessCode,
  findLastTerminatedByAccessCode,
} = require("../../models/use-cases/serviceSubscription");
const {
  findPackageByAccessCode,
} = require("../../models/use-cases/subscription");
const ServiceSubscription = require("../../models/entities/serviceSubscription");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const { customLog } = require("../../utils/loggerHelper");
const {
  getConfig,
  getRestaurant,
  findRestaurantByExternalId,
  buildAdminSsoUrl,
  mapVendorError,
} = require("../../utils/restonikGateway");

const accessCode = "peko_pos";

// Restonik rate-limits to 120 requests/minute per key, shared by every Peko
// tenant. Caching the restaurant read bounds dashboard traffic at roughly one
// vendor call per tenant per minute.
const RESTAURANT_CACHE_TTL_SECONDS = 60;

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

exports.getSubscriptionPlans = asyncHandler(async (req, res) => {
  try {
    const requestedAccessCode = req.query.accessKey || accessCode;
    const normalizedPartnerId = normalizePartnerId(req.user.registeredBy);
    const servicePurchaseDetails = await findPackageByAccessCode(
      requestedAccessCode,
      normalizedPartnerId
    );

    if (!servicePurchaseDetails || !servicePurchaseDetails.length) {
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
      data: { packageDetails: servicePurchaseDetails },
      responseCode: "000",
    });
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

exports.findPlan = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.user;
    const planDetails = await findActiveByAccessCode(id, accessCode, [
      "id",
      "subscriptionStartDate",
      "subscriptionEndDate",
      "subscriptionAmountPaid",
      "status",
      "billingType",
      "vendorResponse",
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

    planDetails.isPurchased = planDetails.status === "ACTIVE";

    const { billingType, package: selectedPackage } = planDetails;
    planDetails.subscriptionAmountPaid =
      billingType === "MONTHLY"
        ? parseFloat(selectedPackage.packagePrices.monthly)
        : parseFloat(selectedPackage.packagePrices.annually);

    return res.status(200).json({
      status: true,
      message: "Data retrieved successfully",
      responseCode: "000",
      data: { ...planDetails, previousSubscription },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "Error fetching Peko POS plan details:",
      data: error?.response?.data || error?.response || error,
    });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});

exports.getDashboard = asyncHandler(async (req, res, next) => {
  try {
    const credentialId = req.user.id;

    const subscription = await findActiveByAccessCode(credentialId, accessCode, [
      "id",
      "subscriptionStartDate",
      "subscriptionEndDate",
      "subscriptionAmountPaid",
      "status",
      "billingType",
      "vendorResponse",
    ]);

    if (!subscription) {
      return res.status(200).json({
        status: true,
        message: "Data retrieved successfully",
        responseCode: "000",
        data: { isPurchased: false, restaurant: null, subscription: null, ssoUrl: null },
      });
    }

    const stored =
      subscription.vendorResponse && typeof subscription.vendorResponse === "object"
        ? subscription.vendorResponse
        : {};
    // Must match what the payment controller sends as externalId, or a row whose
    // vendorResponse was lost would look the restaurant up under the wrong key.
    const externalId = stored.externalId || String(credentialId);

    const cfg = await getConfig();

    // A Restonik outage must never blank the billing panel, so the vendor read
    // is best-effort and its failure is reported alongside the subscription.
    let restaurant = null;
    let vendorError = null;
    if (!cfg.error) {
      const cacheKey = `pos_restaurant_${externalId}`;
      try {
        const cached = await getValue(cacheKey);
        if (cached) {
          restaurant = JSON.parse(cached);
        } else {
          restaurant = stored.restaurantId
            ? await getRestaurant(cfg, stored.restaurantId, req?.LogTraceId)
            : await findRestaurantByExternalId(cfg, externalId, req?.LogTraceId);
          if (restaurant) {
            await setValue(cacheKey, RESTAURANT_CACHE_TTL_SECONDS, JSON.stringify(restaurant));
          }
        }
      } catch (error) {
        vendorError = mapVendorError(error).message;
        customLog(req?.LogTraceId, "error", {
          message: "Peko POS restaurant fetch failed",
          data: error?.response?.data || error?.message,
        });
      }
    } else {
      vendorError = cfg.error;
    }

    if (restaurant?.id && restaurant.id !== stored.restaurantId) {
      await ServiceSubscription.update(
        {
          vendorResponse: {
            ...stored,
            restaurantId: restaurant.id,
            restaurantStatus: restaurant.status,
            externalId,
          },
        },
        { where: { id: subscription.id } }
      );
    }

    // The SSO URL is composed here and nowhere else: the frontend must never
    // build or mutate an OIDC initiate URL. Null while the restaurant is not
    // active, so the UI can show "awaiting approval" instead of a dead link.
    const ssoUrl =
      !cfg.error && restaurant?.status === "active"
        ? buildAdminSsoUrl(cfg, {
            loginHint: req.user.email,
            targetLinkUri: req.query.target || undefined,
          })
        : null;

    const { billingType, package: selectedPackage } = subscription;
    const subscriptionAmountPaid =
      billingType === "MONTHLY"
        ? parseFloat(selectedPackage.packagePrices.monthly)
        : parseFloat(selectedPackage.packagePrices.annually);

    return res.status(200).json({
      status: true,
      message: "Data retrieved successfully",
      responseCode: "000",
      data: {
        isPurchased: subscription.status === "ACTIVE",
        restaurant: restaurant
          ? {
              id: restaurant.id,
              name: restaurant.name,
              slug: restaurant.slug,
              status: restaurant.status,
              isActive: restaurant.isActive,
              email: restaurant.email,
              phone: restaurant.phone,
              // The vendor returns address and logo as plain strings, empty when unset.
              address: restaurant.address,
              logo: restaurant.logo,
              brandColor: restaurant.brandColor,
              plan: restaurant.plan || null,
              subscriptionExpiresAt: restaurant.subscriptionExpiresAt || null,
              createdAt: restaurant.createdAt || null,
              isAwaitingApproval: restaurant.status === "pending",
            }
          : null,
        subscription: {
          id: subscription.id,
          packageName: selectedPackage.packageName,
          subscriptionStartDate: subscription.subscriptionStartDate,
          subscriptionEndDate: subscription.subscriptionEndDate,
          subscriptionAmountPaid,
          billingType,
          status: subscription.status,
        },
        ssoUrl,
        vendorError,
      },
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "Error fetching Peko POS dashboard:",
      data: error?.response?.data || error?.response || error,
    });
    return next(new ErrorResponse("Something went wrong", 500));
  }
});
