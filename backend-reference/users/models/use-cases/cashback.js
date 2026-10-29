const Cashback = require("./../entities/cashback");
const Subscription = require("./../entities/subscription");
const ServiceOperator = require("./../entities/serviceOperator");
const asyncHandler = require("../../middlewares/async");
const moment = require("moment");
const { Op } = require("sequelize");
const DisableServices = require("./../entities/disabledService");
const serviceOperators = require("./../entities/serviceOperator");
const Package = require("../entities/package");

// Cashback row (unitPrice + baseLimit) for a single package, with its serviceOperator accessKey.
// Used to surface the included limit + per-unit price for an individual subscription in settings.
exports.findCashbackByPackageId = asyncHandler(async (packageId) => {
  try {
    const cashback = await Cashback.findOne({
      where: { packageId, serviceStatus: true },
      attributes: ["unitPrice", "baseLimit", "packageId"],
      include: [{ model: ServiceOperator, attributes: ["accessKey", "isDynamicUnitPricing"] }],
      raw: true,
      nest: true,
    });
    return cashback || null;
  } catch (error) {
    console.error("findCashbackByPackageId error:", error);
    return null;
  }
});

// Base limit getServiceAdditionalDetails will enforce once a cancelled GROUP plan lapses: an owned
// individual package wins, else the no-payment-ref GROUP row the expiry cron re-activates.
// null only when a lookup fails.
exports.findBaseLimitAfterGroupDowngrade = asyncHandler(async ({ accessKey, corporateId, partnerId }) => {
  try {
    const cashbacks = await exports.findOneServiceCashbacks(accessKey, partnerId);
    if (cashbacks === false) return null;
    if (!cashbacks.length) return 0;

    const individualCashback = cashbacks.find((row) => row.package.packageType === "INDIVIDUAL");
    if (individualCashback) {
      const individualBaseSub = await Subscription.findOne({
        where: {
          corporateUserId: corporateId,
          packageId: individualCashback.packageId,
          isCustom: false,
          isCancelled: false,
          status: "ACTIVE",
        },
        attributes: ["maxLimit"],
        raw: true,
      });
      if (individualBaseSub) {
        return individualBaseSub.maxLimit != null
          ? parseInt(individualBaseSub.maxLimit, 10) || 0
          : parseInt(individualCashback.baseLimit, 10) || 0;
      }
    }

    // The cron re-activates every no-payment-ref row regardless of status; enforcement then takes the
    // highest-priority ACTIVE GROUP row (findCurrentGroupSubscription).
    const freeGroupRow = await Subscription.findOne({
      where: { corporateUserId: corporateId, isCustom: false, subscriptionPaymentRefId: null },
      include: [{ model: Package, attributes: ["id"], where: { packageType: "GROUP" } }],
      attributes: ["id"],
      order: [[Package, "priorityLevel", "DESC"]],
      raw: true,
      nest: true,
    });
    if (!freeGroupRow) return 0;

    const groupCashback = cashbacks.find(
      (row) => row.package.packageType === "GROUP" && Number(row.packageId) === Number(freeGroupRow.package.id)
    );
    return groupCashback ? parseInt(groupCashback.baseLimit, 10) || 0 : 0;
  } catch (error) {
    console.error("findBaseLimitAfterGroupDowngrade error:", error);
    return null;
  }
});

exports.findAllUserAccessibleAccessKeys = asyncHandler(async (params) => {
  try {
      const { userId, currentPackageId, corporateId } = params

      // find all user active subscriptions
      const subscriptions = await Subscription.findAll({
        where: {
            corporateUserId: corporateId,
            status: {
                [Op.in]: ['ACTIVE', 'DUE']
            },
            [Op.or]: [
                { subscriptionEndDate: { [Op.gt]: moment().format('YYYY-MM-DD') } },
                { subscriptionEndDate: null }
            ]
        },
        raw: true,
        nest: true
    });

      if (subscriptions) {

          let packageIds = [currentPackageId]

          packageIds = [...new Set([...packageIds, ...subscriptions.map(obj => obj.packageId)])];

          const cashbacks = await Cashback.findAll({
              include: [{ model: ServiceOperator, attributes: ['accessKey'], }],
              where: {
                  packageId: packageIds,
                  serviceStatus: true
              },
              raw: true,
              nest: true
          });

          if (cashbacks) {

              const disabledServices = await DisableServices.findAll({
                  include: [{
                      model: ServiceOperator,
                      attributes: ['accessKey']
                  }],
                  where: {
                      credentialId: userId,
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

              return userAccessibleServices
          }
      }
      return false
  } catch (error) {
      console.error('Error finding cashback row:', error);
      return false
  }
})

exports.findOneServiceCashbacks = asyncHandler(async (accessKey, partnerId) => {
  try {
    let packageWhere = {};
    if (partnerId !== undefined) {
      const normalizedPartnerId = partnerId === 'null' ? null : partnerId;
      packageWhere = { partnerId: normalizedPartnerId };
    }
    
    const cashbacks = await Cashback.findAll({
      include: [
        {
          model: Package,
          attributes: ["packageType"],
          where: packageWhere,
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

    return cashbacks;
  } catch (error) {
    console.error("Error finding cashback row:", error);
    return false;
  }
});
