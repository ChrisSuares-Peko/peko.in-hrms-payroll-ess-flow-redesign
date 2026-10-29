const { Op } = require("sequelize");
const Sequelize = require("sequelize");
const moment = require('moment');
const sequelize = require('../../configs/database/index');

const Cashback = require("../entities/cashback");
const Order = require("../entities/order");
const Package = require("../entities/package");
const Subscription = require("../entities/subscription");
const sequelizeConfig = require("../../configs/database/index");
const asyncHandler = require("../../middlewares/async");
const serviceOperators = require("../entities/serviceOperator");
const { customLog } = require("../../utils/loggerHelper");
const { findOneByPackageId } = require("./cashback");

exports.findExistingGroupPackage = asyncHandler(async (corporateUserId) => {
  const activeGroupSubscription = await Subscription.findOne({
    include: [
      {
        model: Package,
        attributes: ["id", "packageName"],
        where: {
          packageType: "GROUP",
        },
      },
    ],
    where: {
      status: "ACTIVE",
      corporateUserId: corporateUserId,
      isCustom: false,
    },
    attributes: ["id"],
    raw: true,
    nest: true,
  });

  return activeGroupSubscription;
});

exports.findActiveIndividualBaseForService = asyncHandler(async (params) => {
  const { corporateUserId, serviceOperatorId } = params;
  return Subscription.findOne({
    include: [
      {
        model: Package,
        attributes: [],
        where: {
          packageType: "INDIVIDUAL",
        },
        required: true,
      },
    ],
    where: {
      corporateUserId: corporateUserId,
      serviceOperatorId: serviceOperatorId,
      status: "ACTIVE",
      isCustom: false,
    },
    attributes: ["packageId"],
    order: [
      ["subscriptionEndDate", "DESC"],
      ["id", "DESC"],
    ],
    raw: true,
    nest: true,
  });
});

// Active PAID group subscription (excludes the free/basic plan, whose row has a NULL
// subscriptionPaymentRefId — same signal as users' findCurrentGroupSubscription({excludeBasic})).
// Used to keep à-la-carte INDIVIDUAL purchases free-plan-only: a paid GROUP plan already bundles
// these services.
exports.findActivePaidGroupSubscription = asyncHandler(async (corporateUserId) => {
  const paidGroupSubscription = await Subscription.findOne({
    include: [
      {
        model: Package,
        attributes: ["id", "packageName"],
        where: { packageType: "GROUP" },
      },
    ],
    where: {
      status: "ACTIVE",
      corporateUserId: corporateUserId,
      isCustom: false,
      subscriptionPaymentRefId: { [Op.ne]: null },
    },
    attributes: ["id"],
    raw: true,
    nest: true,
  });

  return paidGroupSubscription;
});

exports.findAllActiveIndividualSubscriptions = asyncHandler(async (params) => {
  const { corporateId, packageId, currentPackageId, partnerId } = params;
  try {
    const servicesUnderAPackage = await Cashback.findAll({
      attributes: ["serviceOperatorId", "packageId"],
      where: {
        serviceStatus: true,
        packageId: packageId,
      },
      raw: true,
      nest: true,
    });
    const servicesId = servicesUnderAPackage.map(
      (cashback) => cashback.serviceOperatorId
    );

    const packageWhere = {
      status: true,
      packageType: "INDIVIDUAL",
    };
    if (partnerId !== undefined && partnerId !== null && partnerId !== "") {
      packageWhere.partnerId = partnerId;
    }

    const IndividualPackages = await Cashback.findAll({
      include: [
        {
          model: Package,
          where: packageWhere,
          attributes: ["id", "packageName"],
        },
      ],
      attributes: ["serviceOperatorId", "packageId"],
      where: {
        serviceStatus: true,
        serviceOperatorId: {
          [Op.in]: servicesId,
        },
      },
      raw: true,
      nest: true,
    });
    const IndividualPackageIds = IndividualPackages.map(
      (cashback) => cashback.packageId
    );

    if (currentPackageId) {
      IndividualPackageIds.push(Number(currentPackageId));
    }

    const allActiveSubscriptions = await Subscription.findAll({
      where: {
        corporateUserId: corporateId,
        packageId: {
          [Op.in]: IndividualPackageIds,
        },
        status: "ACTIVE",
        subscriptionPaymentRefId: {
          [Op.ne]: null,
        },
      },
      raw: true,
      nest: true,
    });

    const previousAddons = await Subscription.findAll({
      where: {
          corporateUserId: corporateId,
          isCustom: 1,
          status: {
              [Op.in]: ['CANCELLED', 'EXPIRED']
          },
          packageId: {
              [Op.in]: IndividualPackageIds
          },
           updatedAt: {
                  [Op.in]: Sequelize.literal(`
              (
                  SELECT MAX(s2.updatedAt)
                  FROM subscriptions s2
                  WHERE
                      s2.packageId = subscription.packageId
                      AND s2.corporateUserId = ${sequelizeConfig.escape(corporateId)}
                      AND s2.isCustom = 1
                      AND s2.status IN ('CANCELLED', 'EXPIRED')
              )
          `)
          },
          subscriptionPaymentRefId: {
              [Op.ne]: null
          }
      },
      order: [['updatedAt', 'DESC']],
      raw: true
  });
  return {
    allActiveSubscriptions,
    previousAddons
  }
  } catch (error) {
    console.error("Error finding package details:", error);
    return false;
  }
});

exports.getIndividualSubscriptionsByCorporateId = asyncHandler(async (corporateId) => {
    try {
      const servicesUnderAPackage = await Subscription.findAll({
        where: {
            corporateUserId: corporateId,
            status: "ACTIVE",
            isCustom: false, 
            subscriptionPaymentRefId: {
              [Op.not]: null
            }
        },
        raw: true,
        nest: true,
      });
      
  
      return servicesUnderAPackage;
    } catch (error) {
      console.error("Error finding all individual actie subscription:", error);
      return false;
    }
  });

exports.findAllActiveSubscriptions = asyncHandler(async (params) => {
  const { corporateUserId } = params;
  try {
    const allActiveSubscriptions = await Subscription.findAll({
      where: {
        corporateUserId: corporateUserId,
        status: "ACTIVE",
      },
      include: [
        {
          model: Package,
          as: "package"
        },
      ],
      raw: true,
      nest: true,
    });
    return allActiveSubscriptions;
  } catch (error) {
    console.error("Error finding package details:", error);
    return false;
  }
});

exports.findSubscriptionIsExist = asyncHandler(async (params) => {
  try {
    const { corporateId, packageIds } = params;

    const subscription = await Subscription.findOne({
      where: {
        corporateUserId: corporateId,
        packageId: packageIds,
        isCustom: false,
        status: "ACTIVE",
      },
      raw: true,
      nest: true,
    });

    return subscription;
  } catch (error) {
    console.error("Error finding package details:", error);
    return false;
  }
});

// Same INDIVIDUAL-wins ownership check createSubscriptionForAddOns uses.
exports.findActiveIndividualBaseSubscription = asyncHandler(async ({ corporateId, packageId }) => {
  try {
    return await Subscription.findOne({
      where: {
        corporateUserId: corporateId,
        packageId,
        isCustom: false,
        isCancelled: false,
        status: "ACTIVE",
      },
      attributes: ["id"],
      raw: true,
    });
  } catch (error) {
    console.error("findActiveIndividualBaseSubscription error:", error);
    return null;
  }
});

exports.findSubscriptionById = asyncHandler( async (id) => {
  return await Subscription.findOne({
    where: {
      id
    }
  })
})

exports.findMainSubscription = asyncHandler(async (params) => {
    try {
      const { corporateId, packageId } = params;
  
      let subscription = await Subscription.findOne({
        where: {
            status: "ACTIVE",
            corporateUserId: corporateId,
            packageId: packageId,
            isCustom: false,
        },
        include: [{
            model: Package,
            as: "package", 
        }],
        raw: true,
        nest: true,
      });

      if(!subscription) {
        // Fallback: caller passed an unrelated packageId (e.g. the addon's host package).
        // Find the user's actual active GROUP plan instead. Peko Free has
        // subscriptionPaymentRefId = null because no payment was made, so we do NOT
        // filter on that field — free users still have an active GROUP subscription.
        subscription = await Subscription.findOne({
          where: {
              status: "ACTIVE",
              corporateUserId: corporateId,
              isCustom: false,
          },
          include: [{
              model: Package,
              as: "package",
              where: {
                packageType: "GROUP"
              }
          }],
          raw: true,
          nest: true,
        });
      }
  
      return subscription;
    } catch (error) {
      console.error("Error finding package details:", error);
      return false;
    }
});

exports.findAddonSubscription = asyncHandler( async (params) => {
    try {
        const { corporateId, packageId } = params;
    
        const subscription = await Subscription.findOne({
            where: {
                status: "ACTIVE",
                corporateUserId: corporateId,
                packageId: packageId,
                isCustom: true,
            },
            include: [{
                model: Package,
                as: "package"
            }],
            raw: true,
            nest: true,
        });
    
        return subscription;
      } catch (error) {
        console.error("Error finding package details:", error);
        return false;
      }
})

exports.findAllAddonSubscription = asyncHandler( async (corporateId) => {
  try {
      const subscription = await Subscription.findAll({
          where: {
              status: "ACTIVE",
              corporateUserId: corporateId,
              isCustom: true,
              isCancelled: false,
              // Mirror the scheduler's charge enumeration (triggerSubscriptionCharges.js findAllAddonSubscription:
              // `subscriptionEndDate IS NOT NULL AND DATE(subscriptionEndDate) >= CURDATE()`). Without this, an
              // ACTIVE-but-expired (or null-end-date) addon would be counted by every recompute/forecast that
              // calls this (calculateSubscriptionPrice, calculatePlanAmount, admin renewal/charge reports) while
              // the scheduler does NOT charge it — making the recompute drift ABOVE the actual charge.
              subscriptionEndDate: {
                  [Op.ne]: null,
                  [Op.gte]: Sequelize.literal("CURDATE()"),
              },
          },
          include: [{
              model: Package,
              as: "package"
          }],
          raw: true,
          nest: true,
      });
  
      return subscription;
    } catch (error) {
      console.error("Error finding package details:", error);
      return false;
    }
})

exports.findSubscriptionWithVendorSubId = async (vendorSubscriptionId, attributes) => {
try {
  let whereClause = {
    vendorSubscriptionId,
  }
	return await Subscription.findOne({
        where: whereClause,
        attributes,
        include: [{
          model: Package,
          attributes: ["packageName", "accessCode"]
        }],
        raw: true,
        nest: true
    })
} catch (error) {
  console.log("🚀 ~ exports.findSubscriptionWithVendorSubId= ~ error:", error)
  return false;
}
}

exports.findCustomSubscriptionIsExist = asyncHandler(async (params) => {
  try {
    const { corporateId, packageId } = params;

    const subscription = await Subscription.findOne({
      where: {
        corporateUserId: corporateId,
        packageId: packageId,
        isCustom: true,
        status: "ACTIVE",
      },
      nest: true,
    });

    return subscription;
  } catch (error) {
    console.error("Error finding package details:", error);
    return false;
  }
});

exports.deleteSubscription = asyncHandler( async(params) => {
  const { id } = params; 
  try {
    const subscription = await Subscription.destroy({
      where: {
        id
      }
    });
    return subscription;
  } catch (error) {
    console.error("Subscription status update failed:", error);
    return false;
  }
})

exports.updateSubscription = asyncHandler(async (data, id) => {
  try {
    const result = await Subscription.update(data, {
      where: {
        id
      }
    });

    return result;
  } catch (error) {
    console.error("Error finding package details:", error);
    return false;
  }
});

exports.updateSubscriptionStatus = async (id, status) => {
    try {
        const result = await Subscription.update({status}, {
          where: {
            id
          }
        });
    
        return result;
    } catch (error) {
        console.error("Error finding package details:", error);
        return false;
    }
};

exports.createNewSubsription = async (subscription, response) => {
    let { corporateUserId, packageId, billingType, isCustom, maxLimit, package: { discount, packagePrices }, corporateTxnId } = subscription
    const subscriptionStartDate = moment().startOf('day').toDate();
    let subscriptionEndDate
    let discountPrice = 0
    let pgAmount = 0

    if (isCustom) {
        const addonDetails = await findOneByPackageId(packageId)
        pgAmount = parseFloat(addonDetails.unitPrice) * parseInt(maxLimit)
        subscriptionEndDate = moment().add(29, 'days').endOf('day').toDate();
    } else {
        // normal subscription
        if (billingType === "MONTHLY") {
            subscriptionEndDate = moment().add(29, 'days').endOf('day').toDate();
            discountPrice = parseFloat(discount.monthly)
            pgAmount = parseFloat(packagePrices.monthly)
        } else if (billingType === "ANNUALLY") {
            subscriptionEndDate = moment().add(364, 'days').endOf('day').toDate();
            discountPrice = parseFloat(discount.annually)
            pgAmount = parseFloat(packagePrices.annually)
        }
    }

    const newSubscription = {
        subscriptionStartDate,
        subscriptionEndDate,
        subscriptionPaymentRefId: corporateTxnId,
        subscriptionPrice: pgAmount,
        subscriptionAmountPaid: pgAmount - discountPrice,
        corporateUserId,
        packageId,
        discount: discountPrice,
        billingType,
        paymentModeResponse: JSON.stringify(response),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "ACTIVE",
        isCustom,
        maxLimit
    }

    const query = `
        INSERT INTO subscriptions (
            subscriptionStartDate,
            subscriptionEndDate,
            subscriptionPaymentRefId,
            subscriptionPrice,
            subscriptionAmountPaid,
            corporateUserId,
            packageId,
            discount,
            billingType,
            paymentModeResponse,
            status,
            isCustom,
            maxLimit,
            createdAt,
            updatedAt
        ) VALUES (
            :subscriptionStartDate,
            :subscriptionEndDate,
            :subscriptionPaymentRefId,
            :subscriptionPrice,
            :subscriptionAmountPaid,
            :corporateUserId,
            :packageId,
            :discount,
            :billingType,
            :paymentModeResponse,
            :status,
            :isCustom,
            :maxLimit,
            :createdAt,
            :updatedAt
        )
    `;
    await sequelizeConfig.query(query, {
        replacements: newSubscription,
        type: Sequelize.QueryTypes.INSERT
    });
};

/**
 * Creates a fresh 30-day addon subscription row for each active recurring addon (Payroll),
 * tied to the current renewal charge payment reference.
 *
 * Static addons (eSign / Invoicing / Turbo — isDynamicUnitPricing=false) are NOT auto-renewed:
 * they expire on their end date and the user has to re-purchase to extend. Only dynamic-pricing
 * addons (Payroll) ride the mandate's renewal cycle.
 *
 * Re-pricing on renewal: dynamic-pricing addons follow the user's CURRENT GROUP plan tier.
 * If a user bought Payroll on Peko Free at ₹30/seat then upgraded to Peko Go (₹50/seat), the
 * carry-over row charged at the old tier for the upgrade cycle; from the next renewal we pull
 * the new tier's unit price so they pay Peko Go's rate going forward.
 */
// Recurring addons to renew alongside a base-plan CHARGE. Unlike findAllAddonSubscription (status ACTIVE
// only), this ALSO picks up addons that already EXPIRED before the renewal webhook ran — e.g. a retried or
// delayed charge processed after the cycle ended — so the renewal never silently drops them. The "recurring"
// signal is serviceOperator.isDynamicUnitPricing = 1 (never packageId, which is re-anchored to the GROUP
// package). Returns the most-recent non-cancelled recurring addon per serviceOperator.
exports.findRecurringAddonsToRenew = async (corporateId) =>
  sequelizeConfig.query(
    `SELECT s.id, s.packageId, s.serviceOperatorId, s.maxLimit, s.subscriptionEndDate,
            s.corporateUserId, s.isCancelled
     FROM subscriptions s
     JOIN serviceOperators so ON s.serviceOperatorId = so.id
     WHERE s.corporateUserId = :corporateId
       AND s.isCustom = 1
       AND s.isCancelled = 0
       AND so.isDynamicUnitPricing = 1
       AND s.status IN ('ACTIVE', 'EXPIRED')
       AND s.id = (
         SELECT s2.id FROM subscriptions s2
         WHERE s2.corporateUserId = s.corporateUserId
           AND s2.isCustom = 1
           AND s2.isCancelled = 0
           AND s2.serviceOperatorId = s.serviceOperatorId
           AND s2.status IN ('ACTIVE', 'EXPIRED')
         ORDER BY s2.subscriptionEndDate DESC, s2.id DESC
         LIMIT 1
       )`,
    { replacements: { corporateId }, type: Sequelize.QueryTypes.SELECT }
  );

// Locate the most-recent PAID base predecessor of a renewal when no ACTIVE row remains — the
// scheduler may have expired it (at endDate+1) before a lost/late SUCCESS webhook arrived. Mirrors
// findRecurringAddonsToRenew by including EXPIRED so a late webhook can still back-date a fresh
// cycle from the last one. Prefers the Cashfree mandate (vendorSubscriptionId); falls back to
// corporateUserId + packageId + billingType. Excludes free/basic rows (subscriptionPaymentRefId IS NULL).
exports.findExpiredBasePredecessor = async ({ corporateUserId, packageId, billingType, vendorSubscriptionId }) => {
  const runQuery = (whereSql, replacements) =>
    sequelizeConfig.query(
      `SELECT id, packageId, corporateUserId, billingType, vendorSubscriptionId,
              subscriptionEndDate, status, isCancelled
       FROM subscriptions
       WHERE isCustom = 0
         AND subscriptionPaymentRefId IS NOT NULL
         AND status IN ('ACTIVE', 'EXPIRED')
         AND ${whereSql}
       ORDER BY subscriptionEndDate DESC, id DESC
       LIMIT 1`,
      { replacements, type: Sequelize.QueryTypes.SELECT }
    );

  if (vendorSubscriptionId) {
    const [byMandate] = await runQuery('vendorSubscriptionId = :vendorSubscriptionId', { vendorSubscriptionId });
    if (byMandate) return byMandate;
  }
  if (corporateUserId && packageId && billingType) {
    const [byPlan] = await runQuery(
      'corporateUserId = :corporateUserId AND packageId = :packageId AND billingType = :billingType',
      { corporateUserId, packageId, billingType }
    );
    if (byPlan) return byPlan;
  }
  return null;
};

exports.renewAddonSubscriptions = async (activeAddons, providerId, corporateTxnId, baseEndDate = null, baseBillingType = null) => {
  if (!activeAddons || !activeAddons.length) return;
  const now = new Date();
  // findAddonPrice / findExistingGroupPackage are exported in this same module; require lazily
  // via module.exports to avoid circular-dependency issues at load time.
  const { findAddonPrice, findExistingGroupPackage } = module.exports;
  const { isRecurringAddon, calculateAddonLineTotal, annualizeAddon } = require("../../utils/addonPricing");
  // The addon renews on the same cycle as its base plan (they renew together): an ANNUAL base bills the
  // addon for the full year (× 12), MONTHLY for one month. Falls back to MONTHLY when unspecified.
  const addonBillingType = String(baseBillingType || "").toUpperCase() === "ANNUALLY" ? "ANNUALLY" : "MONTHLY";
  const { resolveAddonTierPricing } = require("../../utils/resolveAddonTierPricing");

  for (const addon of activeAddons) {
    if (!addon.subscriptionEndDate) continue; // defensive — no addon should have null end date now
    if (addon.isCancelled) continue;           // skip addons the user has already cancelled
    const addonData = await findAddonPrice({ packageId: addon.packageId, serviceOperatorId: addon.serviceOperatorId });
    if (!isRecurringAddon(addonData)) continue; // static addons don't auto-renew

    // Idempotency: skip if this addon has already been renewed to a later cycle for the same
    // serviceOperator — e.g. createSubscription's plan-change carry-over already created the next-cycle
    // row, or a prior retry did. Prevents duplicate addon rows when both paths run for one charge.
    const [alreadyRenewed] = await sequelizeConfig.query(
      `SELECT id FROM subscriptions
       WHERE corporateUserId = :corporateUserId AND isCustom = 1 AND serviceOperatorId = :serviceOperatorId
         AND status IN ('ACTIVE', 'PENDING') AND subscriptionEndDate > :endDate
       LIMIT 1`,
      {
        replacements: {
          corporateUserId: addon.corporateUserId,
          serviceOperatorId: addon.serviceOperatorId,
          endDate: addon.subscriptionEndDate,
        },
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    if (alreadyRenewed) continue;

    // Resolve tier price against the user's CURRENT active GROUP plan, not the package this
    // addon was originally bought under. Picks up tier changes from upgrades/downgrades.
    let unitPrice = parseFloat(addonData.unitPrice) || 0;
    let renewalPackageId = addon.packageId;
    try {
      const groupSub = await findExistingGroupPackage(addon.corporateUserId);
      if (groupSub && addon.serviceOperatorId) {
        const allCashbacks = await Cashback.findAll({
          include: [
            { model: Package, attributes: ['id', 'packageType'] },
            { model: serviceOperators, attributes: ['isDynamicUnitPricing'] },
          ],
          where: { serviceOperatorId: addon.serviceOperatorId, serviceStatus: true },
          raw: true,
          nest: true,
        });
        const tier = resolveAddonTierPricing(allCashbacks, groupSub, addonData);
        if (tier && Number.isFinite(tier.unitPrice) && tier.unitPrice > 0) {
          unitPrice = tier.unitPrice;
          // Re-anchor the addon row to the current GROUP package so the next findAddonPrice
          // lookup pulls the same tier without redoing this resolution.
          if (tier.tierRow?.packageId) renewalPackageId = tier.tierRow.packageId;
        }
      }
    } catch (err) {
      customLog(null, "info", { message: "renewAddonSubscriptions: tier resolution failed; falling back to old unit price", error: err?.message, addonId: addon.id });
    }
    const renewalPrice = annualizeAddon(calculateAddonLineTotal(unitPrice, addon.maxLimit), addonBillingType);
    if (!(renewalPrice > 0)) {
      // A recurring addon must never renew at ₹0 — signals a missing/zero cashback unit price.
      customLog(null, "error", {
        message: "renewAddonSubscriptions: recurring addon resolved to ₹0 — skipping renewal row",
        addonId: addon.id,
        serviceOperatorId: addon.serviceOperatorId,
        packageId: renewalPackageId,
        unitPrice,
        maxLimit: addon.maxLimit,
      });
      continue;
    }

    const renewalStart = moment(addon.subscriptionEndDate).add(1, "day").startOf("day").toDate();
    // The renewed addon expires WITH the renewed base (they renew together). When the caller passes
    // the base's new end date, align to it — so an ANNUAL base keeps its addons for the full year
    // instead of a hardcoded 30-day window (which would lapse mid-cycle and renew uncharged). Falls
    // back to the legacy +31-day window when no base end date is supplied.
    const renewalEnd = baseEndDate
      ? moment(baseEndDate).endOf("day").toDate()
      : moment(addon.subscriptionEndDate).add(31, "days").endOf("day").toDate();
    const { calculateTaxBreakdown } = require("../../services/GSTandTAXcalculation");
    const renewalTax = await calculateTaxBreakdown(renewalPrice);
    await sequelizeConfig.query(
      `INSERT INTO subscriptions (
         subscriptionStartDate, subscriptionEndDate, subscriptionPaymentRefId,
         subscriptionPrice, subscriptionAmountPaid, corporateUserId, packageId,
         serviceOperatorId, discount, billingType, isCustom, maxLimit,
         paymentMode, corporateTxnId, status, taxableAmount, taxAmount, taxRate,
         createdAt, updatedAt
       ) VALUES (
         :start, :end, :providerId,
         :price, :amountPaid, :corporateUserId, :packageId,
         :serviceOperatorId, 0, :billingType, 1, :maxLimit,
         'PAYMENT GATEWAY', :corporateTxnId, 'ACTIVE', :taxableAmount, :taxAmount, :taxRate,
         :now, :now
       )`,
      {
        replacements: {
          start: renewalStart,
          end: renewalEnd,
          providerId,
          price: renewalPrice,
          amountPaid: renewalTax.grossAmount,
          corporateUserId: addon.corporateUserId,
          packageId: renewalPackageId,
          serviceOperatorId: addon.serviceOperatorId ?? null,
          billingType: addonBillingType,
          maxLimit: addon.maxLimit,
          corporateTxnId,
          taxableAmount: renewalTax.taxableAmount,
          taxAmount: renewalTax.taxAmount,
          taxRate: renewalTax.taxRate,
          now,
        },
        type: Sequelize.QueryTypes.INSERT,
      }
    );
  }
};

exports.updateVendorSubscriptionId = async (id, vendorSubscriptionId) => {
    try {
        const result = await Subscription.update({vendorSubscriptionId}, {
          where: {
            id
          }
        });

        return result;
    } catch (error) {
        console.error("Error updating vendor subscription id:", error);
        return false;
    }
};

exports.countActiveSubscriptionsByVendorId = asyncHandler(async (vendorSubscriptionId) => {
    if (!vendorSubscriptionId) return 0;
    return Subscription.count({
        where: {
            vendorSubscriptionId,
            status: "ACTIVE",
        },
    });
});

exports.findAddonPrice = asyncHandler(async (params) => {
  const include = [
      { model: Package, attributes: ['packageType'] },
      { model: serviceOperators, attributes: ['id', 'isDynamicUnitPricing'] },
  ];
  const attributes = ['unitPrice', 'baseLimit', 'packageId'];

  // For a re-anchored addon, prefer the active GROUP plan's tier row (its real per-unit price)
  // before falling back to the addon's own package row — mirrors the charge API's resolution.
  if (params.serviceOperatorId && params.groupPackageId != null) {
    const groupCashback = await Cashback.findOne({
      include,
      where: { serviceOperatorId: params.serviceOperatorId, packageId: params.groupPackageId },
      attributes,
      raw: true,
      nest: true,
    });
    if (groupCashback) return groupCashback;
  }

  const whereClause = { packageId: params.packageId };
  if (params.serviceOperatorId) {
    whereClause.serviceOperatorId = params.serviceOperatorId;
  }
  const cashback = await Cashback.findOne({
      include,
      where: whereClause,
      attributes,
      raw: true,
      nest: true
  });

  return cashback
})

exports.findAllSubscription = asyncHandler(async (params) => {
  try {
      const allActiveSubscriptions = await Subscription.findAll({
        include: [
          {
              model: Package,
              attributes: ['id', 'packageName', 'packageType'],
          }
        ],
          where: params,
          raw: true,
          nest: true
      })

      return allActiveSubscriptions

  } catch (error) {
      console.error('Error finding subscription details:', error);
      return false
  }
})

exports.findExistingSubscription = async({packageId, corporateId, billingType})=>{
  try {
    return await Subscription.findOne({
      include: [{ model: Package }],
      where: {
        packageId: packageId,
        corporateUserId: corporateId,
        status: "ACTIVE",
        isCustom: false,
        billingType: {
          [Op.eq]: billingType,
        },
      },
      raw: true,
      nest: true,
    })
  } catch (error) {
    return false;
  }
}

async function cancelAllAddOns(packageId, corporateId, transaction) {

  // Fetch serviceOperatorId values for the group and find individual packages in a single query
  const servicesUnderAPackage = await Cashback.findAll({
      attributes: ['serviceOperatorId', 'packageId'],
      where: {
          serviceStatus: true,
          packageId: packageId,
      },
      raw: true,
      nest: true
  });

  if (!servicesUnderAPackage.length) return

  const servicesId = servicesUnderAPackage.map((cashback) => cashback.serviceOperatorId)

  const IndividualPackages = await Cashback.findAll({
      include: [
          {
              model: Package,
              where: {
                  status: true,
                  packageType: 'INDIVIDUAL'
              },
              attributes: ['id', 'packageName']
          }
      ],
      attributes: ['serviceOperatorId', 'packageId'],
      where: {
          serviceStatus: true,
          serviceOperatorId: {
              [Op.in]: servicesId
          },
      },
      raw: true,
      nest: true
  });

  if (!IndividualPackages.length) return

  const IndividualPackageIds = IndividualPackages.map((cashback) => cashback.packageId)

  await Subscription.update(
      { isCancelled: true },
      {
          where: {
              packageId: { [Op.in]: IndividualPackageIds },
              corporateUserId: corporateId,
              isCustom: true
          },
          transaction
      }
  );

}

exports.cancelUserSubscription = asyncHandler(async (params) => {
  const transaction = await sequelize.transaction();
  try {
      const { subscriptionId, corporateId, packageType, packageId, isCustom } = params;

      // step 1 : Update the isCancelled = true
      await Subscription.update(
          { isCancelled: true },
          {
              where: {
                  id: subscriptionId,
                  corporateUserId: corporateId
              },
              transaction
          }
      );
      if (isCustom) {
          return { success: true, message: "Your add-on subscription has been cancelled. You will still be able to use the service until the end of your current billing cycle." }
      }

      // step 2 : check cancelled subscription is individual package or not
      // if cancelled subscription is individual cancel all add ons of this subscription
      if (packageType === 'INDIVIDUAL') {
          await Subscription.update(
              { isCancelled: true },
              {
                  where: {
                      packageId,
                      corporateUserId: corporateId,
                      isCustom: true
                  },
                  transaction
              }
          );
      }

      // If the package type is 'GROUP',
      if (packageType === 'GROUP') {
          // cancel all add ons that coming under the group subscription.
          await cancelAllAddOns(packageId, corporateId, transaction)
      }
      await transaction.commit();
      return { success: true, message: "Your subscription has been cancelled. You will still be able to use the service until the end of your current billing cycle." }
  } catch (error) {
      customLog(null, "error", { message: "An error occurred", error: error });
      await transaction.rollback();
      return { success: false, message: "Subscription cancellation failed." };
  }
});

exports.findSubscription = asyncHandler( async (params) => {
  return await Subscription.findOne({
    where: params
  })
})

exports.hasPurchasedGlobalBusinessSetup = async ({ credentialId, serviceOperatorId }) => {
  return Order.findOne({
    where: {
      credentialId,
      status: "SUCCESS",
      serviceOperatorId,
    },
    order: [["createdAt", "DESC"]],
  });
};

exports.hasActivePekoPlus = async ({ corporateUserId, planId }) => {
  return Subscription.findOne({
    where: {
      corporateUserId,
      packageId: planId,
      status: "ACTIVE",
      subscriptionPaymentRefId: { [Op.ne]: null },
    },
  });
};

exports.findTopTierGroupPackage = async ({ partnerId }) => {
  const where = {
    status: true,
    packageType: "GROUP",
  };
  if (partnerId !== undefined && partnerId !== null) {
    where.partnerId = partnerId;
  }
  return Package.findOne({
    where,
    order: [["priorityLevel", "DESC"]],
    raw: true,
  });
};

exports.isTopTierGroupPackage = async (packageId, options = {}) => {
  if (!packageId) return false;
  const pkg = await Package.findByPk(packageId, {
    attributes: ["id", "packageType", "partnerId"],
    raw: true,
    ...options,
  });
  if (!pkg || pkg.packageType !== "GROUP") return false;
  const topTier = await Package.findOne({
    where: {
      status: true,
      packageType: "GROUP",
      partnerId: pkg.partnerId ?? null,
    },
    order: [["priorityLevel", "DESC"]],
    attributes: ["id"],
    raw: true,
    ...options,
  });
  return Boolean(topTier) && String(topTier.id) === String(pkg.id);
};