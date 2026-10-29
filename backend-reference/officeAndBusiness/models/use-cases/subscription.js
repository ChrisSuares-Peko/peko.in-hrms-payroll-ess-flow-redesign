const Subscription = require("../entities/subscription");
const Package = require("../entities/package");
const Cashback = require("../entities/cashback");
const moment = require('moment');
const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const cashback = require("../entities/cashback");
const serviceOperators = require("../entities/serviceOperator");
const { customLog } = require("../../utils/loggerHelper");
const disableServices = require("../entities/disabledService");

exports.findAllActiveSubscriptions = asyncHandler(async (params) => {
  const { corporateUserId } = params;
  try {
    const allActiveSubscriptions = await Subscription.findAll({
      where: {
        corporateUserId: corporateUserId,
        status: "ACTIVE",
      },
      raw: true,
      nest: true,
    });

    return allActiveSubscriptions;
  } catch (error) {
    console.error("Error finding package details:", error);
    return false;
  }
});

async function checkCashback(packageId, accessKey) {
  return await cashback.findOne({
    where: {
      packageId: packageId,
      serviceStatus: true,
    },
    include: [
      {
        model: serviceOperators,
        where: {
          serviceStatus: true,
          accessKey: accessKey,
        },
      },
    ],
    raw: true,
    nest: true,
  });
}

exports.findWhatsappSubscriptions = asyncHandler(async (corporateUserId, accessKey = "") => {
  try {
    // #1 check for any direct WhatsApp subscription
    let whatsappSubscriptions = await Subscription.findOne({
      include: [
        {
          model: Package,
          where: {
            status: true,
            accessCode: "whatsapp",
          },
          attributes: ["id", "packageName", "accessCode"],
        },
      ],
      where: {
        corporateUserId: corporateUserId,
        status: "ACTIVE",
      },
      raw: true,
      nest: true,
    });
    // #3 check for any group subscription
    if (!whatsappSubscriptions) {
      // in case of group
      whatsappSubscriptions = await Subscription.findOne({
        include: [
          {
            model: Package,
            where: {
              status: true,
              packageType: "GROUP",
            },
            attributes: ["id", "packageName", "accessCode"],
          },
        ],
        where: {
          corporateUserId: corporateUserId,
          status: "ACTIVE",
        },
        raw: true,
        nest: true,
      });
      // # 3 check WhatsApp is included or not in this subscription
      if (whatsappSubscriptions) {
        let cashbackResult = await checkCashback(whatsappSubscriptions?.packageId, accessKey);
        if (!cashbackResult) return false;
      }
    }
    return whatsappSubscriptions;
  } catch (error) {
    console.error("Error finding package details:", error);
    return false;
  }
});

exports.updateWhatsappSubscriptionStatus = async (subscriptionId, corporateUserId) => {
  try {
    const isUpdated = await Subscription.update(
      { status: "CANCELLED" },
      {
        where: {
          id: subscriptionId,
          corporateUserId: corporateUserId,
        },
      }
    );
    if (isUpdated) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error finding package details:", error);
    return false;
  }
};

exports.findMaximumUsageLimit = async (params) => {
  const { corporateId, accessKey } = params;
  try {
    const cashbacks = await Cashback.findOne({
      include: [
        {
          model: Package,
          attributes: ["packageType"],
          where: { packageType: "INDIVIDUAL" },
        },
        {
          model: serviceOperators,
          where: { accessKey: accessKey },
          attributes: ["id", "isDynamicUnitPricing"],
        },
      ],
      attributes: ["unitPrice", "baseLimit", "packageId"],
      raw: true,
      nest: true,
    });
    if (!cashbacks) return false;

    const subscription = await Subscription.findOne({
      where: {
        corporateUserId: corporateId,
        packageId: cashbacks.packageId,
        isCustom: true,
        status: "ACTIVE",
      },
      attributes: ["maxLimit"],
      raw: true,
      nest: true,
    });

    const maxLimit = parseInt(cashbacks.baseLimit) + (subscription ? parseInt(subscription.maxLimit) : 0);
    return maxLimit;
  } catch (error) {
    console.error("Error finding package details:", error);
    return false;
  }
};

// Like findMaximumUsageLimit but works for addon-only services (Turbo / eSign / Payroll / Invoicing).
// Those services have NO INDIVIDUAL package — their baseLimit lives on the user's currently-active
// GROUP plan's Cashback row. Returns total seats (baseLimit + active addon's maxLimit), or 0
// if the user has no active GROUP plan / no Cashback configured.
exports.findMaximumUsageLimitForAccessKey = async ({ corporateId, accessKey }) => {
  try {
    const groupSub = await Subscription.findOne({
      include: [
        {
          model: Package,
          where: { packageType: "GROUP" },
          attributes: ["id"],
        },
      ],
      where: {
        corporateUserId: corporateId,
        status: "ACTIVE",
        isCustom: false,
      },
      attributes: ["id"],
      raw: true,
      nest: true,
    });
    // Group/basic plan's included baseLimit for this service (0 if the user has no active group plan).
    let baseLimit = 0;
    if (groupSub) {
      const cashbackRow = await Cashback.findOne({
        include: [
          {
            model: serviceOperators,
            where: { accessKey },
            attributes: ["id"],
          },
        ],
        where: {
          packageId: groupSub.package.id,
          serviceStatus: true,
        },
        attributes: ["baseLimit"],
        raw: true,
        nest: true,
      });
      baseLimit = cashbackRow ? (parseInt(cashbackRow.baseLimit) || 0) : 0;
    }

    // Every ACTIVE, non-cancelled row for this service (the GROUP base row has no serviceOperatorId,
    // so the required JOIN excludes it — no double count). Grace keeps the limit (status stays ACTIVE
    // during retry); EXPIRED/CANCELLED drop out. accessKey via JOIN tolerates "multiple serviceOperators
    // per accessKey". Split into:
    //   - INDIVIDUAL package base row(s) (isCustom=false) — included limit snapshotted into maxLimit;
    //   - add-on rows (isCustom=true) — extra seats.
    const rows = await Subscription.findAll({
      include: [{
        model: serviceOperators,
        attributes: [],
        where: { accessKey },
        required: true,
      }],
      where: {
        corporateUserId: corporateId,
        status: "ACTIVE",
        isCancelled: false,
      },
      attributes: ["maxLimit", "isCustom", "packageId"],
      raw: true,
      nest: true,
    });
    const individualRows = rows.filter((row) => !row.isCustom);
    // Legacy individual rows (purchased before snapshotting) have maxLimit NULL —
    // fall back to the package's live cashback baseLimit instead of counting 0.
    let individualBaseLimit = 0;
    for (const row of individualRows) {
      if (row.maxLimit != null) {
        individualBaseLimit += parseInt(row.maxLimit) || 0;
      } else {
        const legacyCashback = await Cashback.findOne({
          where: { packageId: row.packageId, serviceStatus: true },
          attributes: ["baseLimit"],
          raw: true,
        });
        individualBaseLimit += legacyCashback ? (parseInt(legacyCashback.baseLimit) || 0) : 0;
      }
    }
    const addonLimit = rows
      .filter((row) => row.isCustom)
      .reduce((sum, row) => sum + (parseInt(row.maxLimit) || 0), 0);

    // When an INDIVIDUAL subscription exists for this service, ONLY its limit applies — the group/basic
    // plan's included baseLimit is NOT added (an individual 25 means 25, not 25 + free 3). Otherwise the
    // group/basic baseLimit applies. Add-ons always stack on top.
    const ownsIndividual = individualRows.length > 0;
    return (ownsIndividual ? individualBaseLimit : baseLimit) + addonLimit;
  } catch (error) {
    console.error("findMaximumUsageLimitForAccessKey error:", error);
    return 0;
  }
};

// A "paid" GROUP subscription has subscriptionPaymentRefId set - Peko Free has none. Used by
// verificationQuota.js to decide "is this corporate on an actual paid plan (Peko Go/Peko+) or on the
// free tier / no plan at all" - only the former gets the 30-day-from-plan-start rolling reset;
// Peko Free and no-plan-at-all both fall back to a plain calendar-month reset. Mirrors the identical
// paid-GROUP-plan query in paymentGateway/utils/subscriptionPricing.js's computeAddonEndDate.
exports.findActivePaidGroupSubscription = asyncHandler(async (params) => {
 
  try {
    const { corporateId } = params;
    return await Subscription.findOne({
      include: [
        {
          model: Package,
          where: { packageType: "GROUP" },
          attributes: ["id"],
        },
      ],
      where: {
        corporateUserId: corporateId,
        status: "ACTIVE",
        isCustom: false,
        subscriptionPaymentRefId: { [Op.ne]: null },
      },
      attributes: ["subscriptionStartDate", "subscriptionEndDate", "createdAt"],
      raw: true,
      nest: true,
    });
  } catch (error) {
    customLog(null, "error", { message: "failed to fetch active paid group subscription", data: error });
    return null;
  }
});

// Most recent NON-active paid GROUP subscription for a corporate - used by verificationQuota.js's
// Peko Free / no-plan branch as a proxy for "when did this corporate's paid plan expire", since a
// downgrade to Peko Free reactivates the same dormant Subscription row via a raw SQL UPDATE
// (scheduler/services/subscriptionAutoRenewal.js) that never stamps any timestamp on that row itself.
// subscriptionEndDate is set once at the paid plan's own creation time in
// paymentGateway/utils/subscription.js and never touched by that later raw-SQL expiry flip, so it
// reliably marks the day paid coverage ended, one day before Peko Free naturally takes back over.
exports.findMostRecentExpiredPaidGroupSubscription = asyncHandler(async (params) => {
  try {
    const { corporateId } = params;
    return await Subscription.findOne({
      include: [
        {
          model: Package,
          where: { packageType: "GROUP" },
          attributes: ["id"],
        },
      ],
      where: {
        corporateUserId: corporateId,
        status: { [Op.ne]: "ACTIVE" },
        isCustom: false,
        subscriptionPaymentRefId: { [Op.ne]: null },
      },
      attributes: ["subscriptionEndDate"],
      order: [["subscriptionEndDate", "DESC"]],
      raw: true,
      nest: true,
    });
  } catch (error) {
    customLog(null, "error", { message: "failed to fetch most recent expired paid group subscription", data: error });
    return null;
  }
});

// Full paid-GROUP-subscription history for a corporate (every instance, any status except PENDING -
// a never-yet-active scheduled row can't have contained any past activity). Used by
// verificationAddon.js's add-on history to recover which plan was active when a given add-on was
// purchased, by matching the purchase timestamp against each row's subscriptionStartDate/EndDate
// range - add-on purchases don't store a packageId of their own (see
// paymentGateway/controllers/corporate/verificationSuiteAddOn.js), so this is reconstructed after the
// fact rather than read directly.
exports.findAllGroupSubscriptionsForCorporate = async ({ corporateId }) => {
  try {
    return await Subscription.findAll({
      include: [
        {
          model: Package,
          where: { packageType: "GROUP" },
          attributes: ["packageName"],
        },
      ],
      where: {
        corporateUserId: corporateId,
        isCustom: false,
        subscriptionPaymentRefId: { [Op.ne]: null },
        status: { [Op.ne]: "PENDING" },
      },
      attributes: ["subscriptionStartDate", "subscriptionEndDate", "subscriptionAmountPaid", "status"],
      order: [["subscriptionStartDate", "ASC"]],
      raw: true,
      nest: true,
    });
  } catch (error) {
    customLog(null, "error", { message: "failed to fetch group subscription history for corporate", data: error });
    return [];
  }
};

exports.findUserSubscriptionsByService = asyncHandler(async (params) => {
  try {
    const { corporateId, checkIsExpired } = params;

    let currentSubscription;

    // Services like eSign / payroll / invoicing / turbo are addon-only —
    // there are no INDIVIDUAL packages keyed by accessCode for them.
    // Access is gated by the user's active GROUP subscription (Peko Free, Peko Go, Peko+, etc.).
    // Peko Free has no subscriptionPaymentRefId (no payment made) — must still count as active access.
    currentSubscription = await Subscription.findOne({
      include: [
        {
          model: Package,
          attributes: ["id", "packageName"],
          where: { packageType: "GROUP" },
        },
      ],
      where: {
        corporateUserId: corporateId,
        status: "ACTIVE",
      },
      attributes: ["subscriptionStartDate", "subscriptionEndDate", "subscriptionAmountPaid", "billingType"],
      raw: true,
      nest: true,
    });

    if (currentSubscription) return currentSubscription;

    if (!checkIsExpired) return false;

    // Grace period: surface a recently-expired GROUP plan (within 30 days)
    // so callers can render an "expired plan" message instead of a hard error.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    currentSubscription = await Subscription.findOne({
      include: [
        {
          model: Package,
          where: {
            packageType: "GROUP",
          },
          attributes: ["packageName", "packageType"],
        },
      ],
      where: {
        status: "EXPIRED",
        corporateUserId: corporateId,
        isCustom: false,
        subscriptionEndDate: { [Op.gte]: thirtyDaysAgo }, // Only last 30 days
      },
      order: [["subscriptionEndDate", "DESC"]], // Adjust to the correct timestamp column
      attributes: ["subscriptionStartDate", "subscriptionEndDate", "billingType"],
      raw: true,
      nest: true,
    });

    if (currentSubscription) return currentSubscription;

    return false;
  } catch (error) {
    customLog(null, "error", { message: "failed to fetch user subsription", data: error });
    return false;
  }
});


exports.checkUserSubscriptionAccess = asyncHandler(async (params) => {
  try {

      const { credentialId, corporateId, serviceAccessKey } = params

      // find all user active subscriptions
      const subscriptions = await Subscription.findAll({
          where: {
              corporateUserId: corporateId,
              status: 'ACTIVE',
              [Op.or]: [
                  {
                      isGracePeriod: true, // If isGracePeriod is true, ignore subscriptionEndDate
                  },
                  {
                      isGracePeriod: false, // Otherwise, ensure subscriptionEndDate condition
                      subscriptionEndDate: {
                          [Op.gt]: moment().format('YYYY-MM-DD'),
                      },
                  },
              ],
              isCustom: false
          },
          raw: true,
          nest: true
      });

      if (!subscriptions || !subscriptions.length) {
          return false
      }

      const packageIds = [...new Set([...subscriptions.map(obj => obj.packageId)])];

      // Check all cashbacks
      const cashbacks = await Cashback.findAll({
          include: [{ model: serviceOperators, attributes: ['accessKey'], }],
          where: {
              packageId: packageIds,
              serviceStatus: true
          },
          raw: true,
          nest: true
      });

      if (!cashbacks || !cashbacks.length > 0) {
          return false
      }

      // check service is disabled or not
      const disabledServices = await disableServices.findAll({
          include: [{
              model: serviceOperators,
              attributes: ['accessKey']
          }],
          where: {
              credentialId: credentialId,
              serviceStatus: false
          },
          order: [
              ['createdAt', 'DESC']
          ],
          attributes: ['serviceOperatorId'],
          raw: true,
          nest: true
      })

      // Step 1: Extract serviceOperatorId values from the disabledServices array into a Set
      const disabledServiceIds = new Set(disabledServices.map(service => service.serviceOperatorId));


      // Step 2: Filter the cashbacks array to exclude objects with matching serviceOperatorId
      const filteredCashbacks = cashbacks.filter(cashback => !disabledServiceIds.has(cashback.serviceOperatorId));

      // Creating an array containing all service access keys that the user can access
      const userAccessibleServices = [...new Set(filteredCashbacks.map(obj => obj.serviceOperator.accessKey))];

      return userAccessibleServices.includes(serviceAccessKey)
  } catch (error) {
      console.log(error);
      return false
  }
})

exports.findPackageByAccessCode = asyncHandler(async (accessKey, partnerId) => {
    try {
        const packageData = await Package.findAll({
            where: { status: true, accessCode: accessKey, partnerId: partnerId },
            attributes: ['id', 'packageName', "packagePrices", "description", "discount", "priorityLevel", "externalId"],
            order: [
                ['priorityLevel', "ASC"]],
            raw: true,
            nest: true
        })

        return packageData
    } catch (error) {
        customLog(null, 'error', { error: error.message });

        return false
    }
})
