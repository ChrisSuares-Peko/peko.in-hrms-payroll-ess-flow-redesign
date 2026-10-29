/* eslint-disable no-unused-vars */
const Cashback = require("../entities/cashback");
const Package = require("../entities/package");
const Subscription = require("../entities/subscription");
const ServiceOperator = require("../entities/serviceOperator");
const CorporateUser = require("../entities/corporateUser");
const whatsappSubscription = require("../entities/whatsappSubscription");
const serviceSubscription = require("../entities/serviceSubscription");
const asyncHandler = require("../../middlewares/async");
const { Op, Sequelize } = require("sequelize");
const moment = require('moment');
const sequelize = require("../../configs/database/index");
const sequelizeConfig = require("../../configs/database/index");
const DisableServices = require("../entities/disabledService");
const serviceOperators = require("../entities/serviceOperator");
const { customLog } = require("../../utils/loggerHelper");
const { applyCommissionMarkup } = require("../../utils/applyCommissionMarkup");
const { PLAN_COMMISSION, removeCommissionFields } = require("../../utils/configuredFlag");

exports.findAllIndividualPackages = asyncHandler(async (partnerId) => {
  try {
    const packages = await Package.findAll({
      where: {
        status: true,
        packageType: "INDIVIDUAL",
        partnerId: partnerId || null,
        type: "1",
      },
      // id + accessCode added so callers can offer a direct purchase (Subscribe → ReviewOrder needs the
      // packageId); packageLogo/serviceList/priorityLevel for display + ordering. Additive — existing
      // callers are unaffected.
      attributes: ["id", "packageName", "packagePrices", "description", "discount", "accessCode", "packageLogo", "serviceList", "priorityLevel"],
      order: [["priorityLevel", "ASC"]],
      raw: true,
      nest: true,
    });
    if (packages) {
      return packages;
    }
    return false;
  } catch (error) {
    console.error("Error finding cashback row:", error);
    return false;
  }
});

exports.findAllGroupPackages = asyncHandler(async (partnerId) => {
  try {

      // Step 1: Find the basic package. 
      const basicPackage = await Package.min('priorityLevel', {
          where: { status: true, packageType: 'GROUP', partnerId: partnerId }
      });

      // Step 2: Find all packages excluding the highest priority level
      const packages = await Package.findAll({
          where: {
              status: true,
              packageType: 'GROUP',
              partnerId: partnerId,
              priorityLevel: { [Op.gt]: basicPackage } // Exclude the basic package
          },
          attributes: ['id', 'packageName', 'packagePrices', 'description', 'discount', 'serviceList', 'priorityLevel', 'packageLogo'],
          order: [['priorityLevel', 'ASC']],
          raw: true,
          nest: true
      });

      return packages;
  } catch (error) {
      console.error('Error finding cashback row:', error);
      return false
  }
})

exports.findBasicGroupPackage = asyncHandler(async (partnerId) => {
  try {
    const basicPriority = await Package.min("priorityLevel", {
      where: { status: true, packageType: "GROUP", partnerId },
    });

    if (basicPriority == null) return null;

    return await Package.findOne({
      where: {
        status: true,
        packageType: "GROUP",
        partnerId,
        priorityLevel: basicPriority,
      },
      attributes: ["id", "packageName", "packagePrices", "description", "discount", "serviceList", "priorityLevel", "packageLogo"],
      raw: true,
      nest: true,
    });
  } catch (error) {
    console.error("Error finding basic group package:", error);
    return false;
  }
});

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

exports.findAllGroupPackagesDiscountValue = asyncHandler(
  async (groupPackgesIds) => {
    try {
      const allGroupCashbacks = await Cashback.findAll({
        include: [
          {
            model: ServiceOperator,
            attributes: ["serviceProvider"],
          },
          {
            model: Package,
            where: { packageType: "GROUP", status: true },
            attributes: ["id", "packageName"],
          },
        ],
        attributes: ["serviceOperatorId", "packageId"],
        where: {
          serviceStatus: true,
          packageId: {
            [Op.in]: groupPackgesIds,
          },
        },
        raw: true,
        nest: true,
      });

      const groupedServices = allGroupCashbacks.reduce((acc, item) => {
        const packageName = item.package.packageName;
        if (!acc[packageName]) {
          acc[packageName] = [];
        }
        acc[packageName].push(item.serviceOperatorId);
        return acc;
      }, {});

      const results = {};

      for (const packageName in groupedServices) {
        const serviceOperatorIds = groupedServices[packageName];

        const individualPackagesUnderAGroup = await Cashback.findAll({
          include: [
            {
              model: Package,
              where: { packageType: "INDIVIDUAL", status: true },
              attributes: ["id", "packageName", "packagePrices", "discount"],
            },
          ],
          attributes: ["serviceOperatorId", "packageId"],
          where: {
            serviceStatus: true,
            serviceOperatorId: {
              [Op.in]: serviceOperatorIds,
            },
          },
          raw: true,
          nest: true,
        });
        const totalSumOfAllServices = individualPackagesUnderAGroup.reduce(
          (sum, item) => {
            return (
              sum +
              item.package.packagePrices.monthly -
              item.package.discount.monthly
            );
          },
          0
        );
        results[packageName] = totalSumOfAllServices;
      }
      return results;
    } catch (error) {
      console.error("Error finding cashback row:", error);
      return false;
    }
  }
);

exports.findOnePackage = asyncHandler(async (packageId) => {
  try {

      const package = await Package.findOne({
          where: { status: true, id: packageId },
          attributes: ['id', 'packageName', 'packagePrices', 'description', 'packageType', 'discount', 'serviceList', 'priorityLevel', 'packageLogo'],
          raw: true,
          nest: true
      })

      return package
  } catch (error) {
      console.error('Error finding package details:', error);
      return false
  }
})

exports.findAllActiveIndividualSubscriptions = asyncHandler(async (params) => {
  const { corporateId, packageId, currentPackageId, partnerId } = params
  try {
      const servicesUnderAPackage = await Cashback.findAll({
          attributes: ['serviceOperatorId', 'packageId'],
          where: {
              serviceStatus: true,
              packageId: packageId,
          },
          raw: true,
          nest: true
      });
      const servicesId = servicesUnderAPackage.map((cashback) => cashback.serviceOperatorId)

      const packageWhere = {
          status: true,
          packageType: 'INDIVIDUAL'
      };
      if (partnerId !== undefined && partnerId !== null && partnerId !== '') {
          packageWhere.partnerId = partnerId;
      }

      const IndividualPackages = await Cashback.findAll({
          include: [
              {
                  model: Package,
                  where: {
                      status: true,
                      packageType: 'INDIVIDUAL',
                      partnerId
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
      const IndividualPackageIds = IndividualPackages.map((cashback) => cashback.packageId)

      if (currentPackageId) {
          IndividualPackageIds.push(Number(currentPackageId));
      }

      const allActiveSubscriptions = await Subscription.findAll({
          where: {
              corporateUserId: corporateId,
              packageId: {
                  [Op.in]: IndividualPackageIds
              },
              status: 'ACTIVE',
              subscriptionPaymentRefId: {
                  [Op.ne]: null
              }
          },
          raw: true,
          nest: true
      })

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
                              AND s2.corporateUserId = ${corporateId}
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

      return { allActiveSubscriptions, previousAddons }

  } catch (error) {
      console.error('Error finding package details:', error);
      throw error
  }
})

exports.findAndCountAllUserSubscriptions = asyncHandler(async (params) => {
  try {
    const { corporateId, limit, offset, status, packageType } = params;

    let whereConditions = {
      corporateUserId: corporateId,
      subscriptionPaymentRefId: {
        [Op.ne]: null,
      },
    };

    if (status) {
      whereConditions.status = status;
    }

    let packageWhereConditions = {};
    if (packageType) {
      packageWhereConditions.packageType = packageType;
    }

    const allActiveSubscriptions = await Subscription.findAndCountAll({
      include: [
        {
          model: Package,
          attributes: ["id", "packageName", "packageType", "description"],
          where: packageWhereConditions,
        },
      ],
      where: whereConditions,
      attributes: [
        "id",
        "subscriptionStartDate",
        "subscriptionEndDate",
        "subscriptionAmountPaid",
        "status",
        "billingType",
        "isCustom",
        "maxLimit",
        "isCancelled",
      ],
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
      raw: true,
      nest: true,
    });

    return allActiveSubscriptions;
  } catch (error) {
    console.error("Error finding package details:", error);
    return false;
  }
});

const cleanupStaleBasicSubscription = async (corporateUserId) => {
    if (!corporateUserId) return;
    try {
        const activePaid = await sequelizeConfig.query(
            `SELECT s.id FROM subscriptions s
               INNER JOIN packages p ON p.id = s.packageId
              WHERE s.corporateUserId = :corporateUserId
                AND s.status = 'ACTIVE'
                AND s.subscriptionPaymentRefId IS NOT NULL
                AND s.isCustom = false
                AND p.packageType = 'GROUP'
              LIMIT 1`,
            { replacements: { corporateUserId }, type: Sequelize.QueryTypes.SELECT },
        );
        if (activePaid.length === 0) return;

        await sequelizeConfig.query(
            `UPDATE subscriptions s
               INNER JOIN packages p ON p.id = s.packageId
                  SET s.status = 'UPGRADED'
                WHERE s.corporateUserId = :corporateUserId
                  AND s.status = 'ACTIVE'
                  AND s.subscriptionPaymentRefId IS NULL
                  AND s.isCustom = false
                  AND p.packageType = 'GROUP'`,
            { replacements: { corporateUserId }, type: Sequelize.QueryTypes.UPDATE },
        );
    } catch (error) {
        console.error('cleanupStaleBasicSubscription failed (non-fatal):', error?.message);
    }
};

// Self-healing renewal activation (read-time safety net).
// A renewal charge fires ~1-2 days before expiry and creates the next-cycle row as PENDING with a
// FUTURE start date; the daily auto-renewal job is meant to flip it to ACTIVE once that start date
// arrives. If that job is delayed/missed — or its UTC date arithmetic lags the IST-stored start
// date (the cron fires in server-local IST while the job derives `today` from moment.utc()) — the
// PENDING row can be stranded and the user is left with NO ACTIVE plan. This reconciles on read so
// the renewed plan is restored immediately on login instead of waiting a cron cycle.
//
// Timezone: subscription dates are stored as IST wall-clock (Sequelize timezone '+05:30'), so we
// compare against "now" rendered in the same +05:30 offset — correct regardless of the Node server
// or MySQL session timezone. Activation + predecessor-expiry run in ONE transaction, so there is
// never a window with two ACTIVE paid GROUP base rows. All UPDATEs are idempotent (status-guarded),
// so concurrent logins converge safely.
const activateDueGroupRenewal = async (corporateUserId) => {
    if (!corporateUserId) return;
    try {
        const now = moment().utcOffset('+05:30').format('YYYY-MM-DD HH:mm:ss');

        const due = await sequelizeConfig.query(
            `SELECT s.id, s.packageId
               FROM subscriptions s
               INNER JOIN packages p ON p.id = s.packageId
              WHERE s.corporateUserId = :corporateUserId
                AND s.isCustom = false
                AND s.status = 'PENDING'
                AND s.isCancelled = false
                AND s.subscriptionPaymentRefId IS NOT NULL
                AND p.packageType = 'GROUP'
                AND s.subscriptionStartDate <= :now
              ORDER BY s.subscriptionStartDate DESC, s.id DESC`,
            { replacements: { corporateUserId, now }, type: Sequelize.QueryTypes.SELECT },
        );
        if (due.length === 0) return;
        const winner = due[0];

        const transaction = await sequelizeConfig.transaction();
        try {
            // Retire any predecessor paid GROUP base row whose period has ended, so the renewed plan
            // never coexists with a still-ACTIVE (or wrongly-UPGRADED) predecessor. A renewal's start
            // is always predecessorEnd + 1 day, so a due successor implies the predecessor has ended.
            await sequelizeConfig.query(
                `UPDATE subscriptions s
                   INNER JOIN packages p ON p.id = s.packageId
                      SET s.status = 'EXPIRED'
                    WHERE s.corporateUserId = :corporateUserId
                      AND s.isCustom = false
                      AND s.isCancelled = false
                      AND s.subscriptionPaymentRefId IS NOT NULL
                      AND p.packageType = 'GROUP'
                      AND s.id <> :winnerId
                      AND s.status IN ('ACTIVE', 'UPGRADED')
                      AND s.subscriptionEndDate < :now`,
                { replacements: { corporateUserId, winnerId: winner.id, now }, type: Sequelize.QueryTypes.UPDATE, transaction },
            );
            // Activate the due renewal (idempotent — only flips a row that is still PENDING).
            await sequelizeConfig.query(
                `UPDATE subscriptions SET status = 'ACTIVE' WHERE id = :id AND status = 'PENDING'`,
                { replacements: { id: winner.id }, type: Sequelize.QueryTypes.UPDATE, transaction },
            );
            // Keep the denormalized pointer in sync (mirrors subscriptionAutoRenewal.js:199-204).
            await sequelizeConfig.query(
                `UPDATE corporateUsers SET packageId = :packageId WHERE id = :corporateUserId`,
                { replacements: { packageId: winner.packageId, corporateUserId }, type: Sequelize.QueryTypes.UPDATE, transaction },
            );
            await transaction.commit();
        } catch (txErr) {
            await transaction.rollback();
            throw txErr;
        }
    } catch (error) {
        console.error('activateDueGroupRenewal failed (non-fatal):', error?.message);
    }
};

exports.findExistingGroupPackage = asyncHandler(async (corporateUserId) => {
  try {
      await activateDueGroupRenewal(corporateUserId);
      await cleanupStaleBasicSubscription(corporateUserId);
      const activeGroupSubscription = await Subscription.findOne({
          include: [
              {
                  model: Package,
                  attributes: ['id', 'packageName', 'priorityLevel'],
                  where: {
                      packageType: 'GROUP'
                  },
              }
          ],
          where: {
              status: 'ACTIVE',
              corporateUserId: corporateUserId,
              isCustom: false,
          },
          attributes: ['id', 'billingType', 'isCancelled'],
          order: [[Package, 'priorityLevel', 'DESC']],
          raw: true,
          nest: true
      })

      return activeGroupSubscription
  } catch (error) {
      console.error('Error finding package details:', error);
      return false
  }
})

exports.findPackageByAccessCode = asyncHandler(async (accessKey, partnerId) => {
  try {

      const package = await Package.findAll({
          where: { status: true, accessCode: accessKey, partnerId: partnerId, packageType: 'INDIVIDUAL' },
          attributes: ['id', 'packageName', "packagePrices", "description", "discount", "priorityLevel"],
          order: [['priorityLevel', 'ASC']],
          raw: true,
          nest: true
      })

      return package
  } catch (error) {
      console.error('Error finding package details:', error);
      return false
  }
})

exports.findWhatsAppPackages = asyncHandler(async (partnerId, credentialId) => {
  try {
    const packages = await Package.findAll({
      where: {
        status: true,
        accessCode: 'whatsapp',
        [Op.or]: [{ partnerId: null }, { partnerId }],
      },
      attributes: ['id', 'packageName', 'packagePrices', 'description', 'discount', 'priorityLevel', ...PLAN_COMMISSION.fields, 'planCommissions'],
      order: [['priorityLevel', 'ASC']],
      raw: true,
      nest: true,
    });
    await applyCommissionMarkup(packages, 'packagePrices.monthly', credentialId);
    await applyCommissionMarkup(packages, 'packagePrices.annually', credentialId);
    removeCommissionFields(packages, [...PLAN_COMMISSION.fields, 'planCommissions']);
    return packages || [];
  } catch (error) {
    console.error('Error finding WhatsApp packages:', error);
    return [];
  }
});

exports.findPackagesByServiceAccessKey = asyncHandler(async (serviceAccessKey, partnerId) => {
  try {
      if (!serviceAccessKey) {
          return [];
      }

      const rows = await Cashback.findAll({
          include: [
              {
                  model: ServiceOperator,
                  where: {
                      accessKey: serviceAccessKey,
                      serviceStatus: true,
                  },
                  attributes: [],
              },
              {
                  model: Package,
                  // INDIVIDUAL only: bundled GROUP plans (Peko Free/Go/+) include this service via their
                  // own Cashback rows on the same operator, so without this filter they pollute the result
                  // and packageDetails[0] becomes a GROUP plan the user already owns — making the caller
                  // compute ownsIndividualPackage/packageId against the wrong package.
                  where: {
                      status: true,
                      partnerId: partnerId,
                      packageType: 'INDIVIDUAL',
                  },
                  attributes: ['id', 'packageName', 'packagePrices', 'description', 'discount', 'priorityLevel'],
              },
          ],
          where: {
              serviceStatus: true,
          },
          attributes: [],
          raw: true,
          nest: true,
      });

      const uniquePackages = [];
      const seenPackageIds = new Set();
      for (const row of rows) {
          const pkg = row.package;
          if (!pkg || seenPackageIds.has(pkg.id)) {
              continue;
          }
          seenPackageIds.add(pkg.id);
          uniquePackages.push(pkg);
      }

      uniquePackages.sort((a, b) => Number(a.priorityLevel) - Number(b.priorityLevel));
      return uniquePackages;
  } catch (error) {
      console.error('Error finding package details by service access key:', error);
      return false;
  }
})

exports.findCashbackIsExist = asyncHandler(async (packageIds) => {
  try {

      const package = await Cashback.findAll({
          where: { serviceStatus: true, packageId: packageIds },
          attributes: ['id'],
          raw: true,
          nest: true
      })

      if (package && package.length > 0) {
          return true
      }

      return false
  } catch (error) {
      console.error('Error finding package details:', error);
      return false
  }
})

exports.findOneSubscription = asyncHandler(async (params) => {
  try {
    const { subscriptionId, corporateId } = params;

    const subscription = await Subscription.findOne({
      include: [
        {
          model: Package,
          attributes: ["id", "packageName", "packageType"],
        },
        {
          model: ServiceOperator,
          attributes: ["id", "serviceProvider"],
          required: false,
        },
      ],
      where: {
        id: subscriptionId,
        corporateUserId: corporateId,
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

const mapPaymentModeLabel = (code) => {
  if (!code) return null;
  switch (String(code).toLowerCase()) {
    case 'upi':
    case 'upi_credit_card':
    case 'upi_debit_card':
      return 'UPI';
    case 'debit_card':
    case 'debit_card_emi':
    case 'emi_debit_card':
      return 'Debit Card';
    case 'credit_card':
    case 'credit_card_emi':
    case 'emi_credit_card':
    case 'card_emi':
      return 'Credit Card';
    case 'card':
      return 'Card';
    case 'wallet':
      return 'Wallet';
    case 'net_banking':
    case 'netbanking':
      return 'Internet Banking';
    case 'enach':
    case 'emandate':
    case 'nach':
      return 'Net Banking / NACH';
    default:
      return code;
  }
};

const extractPaymentMode = (paymentModeResponse) => {
  if (!paymentModeResponse) return null;
  try {
    let parsed =
      typeof paymentModeResponse === 'string' ? JSON.parse(paymentModeResponse) : paymentModeResponse;

    // Unwrap nesting — handles both [[{...}]] and [{...}].
    while (Array.isArray(parsed)) parsed = parsed[0];
    if (!parsed || typeof parsed !== 'object') return null;

    // Subscription webhook shape: { data: { authorization_details: { payment_method } }, type }
    if (parsed.data && typeof parsed.data === 'object') {
      const code = parsed.data.authorization_details?.payment_method ?? parsed.data.payment_method ?? null;
      return mapPaymentModeLabel(code);
    }

    // One-time order shape: { payment_group, payment_method: { <mode>: {...} } }
    if (parsed.payment_group) return mapPaymentModeLabel(parsed.payment_group);
    if (parsed.payment_method && typeof parsed.payment_method === 'object') {
      return mapPaymentModeLabel(Object.keys(parsed.payment_method)[0]);
    }
    if (typeof parsed.payment_method === 'string') return mapPaymentModeLabel(parsed.payment_method);

    return null;
  } catch (error) {
    console.error('Error extracting payment mode from paymentModeResponse:', error);
    return null;
  }
};

exports.findCurrentGroupSubscription = asyncHandler(async (params) => {
  try {
      const { corporateId, excludeBasic = false, partnerId = null } = params

      await activateDueGroupRenewal(corporateId);
      await cleanupStaleBasicSubscription(corporateId);

      let whereConditions = {
          corporateUserId: corporateId,
          status: 'ACTIVE',
          isCustom: false,
      };

      if (excludeBasic) {
          whereConditions.subscriptionPaymentRefId = {
              [Op.ne]: null
          }
      }

      const subscription = await Subscription.findOne({
          include: [
              {
                  model: Package,
                  attributes: ['id', 'packageName', 'packageType', 'description', 'serviceList', 'packageLogo', 'priorityLevel'],
                  where: { packageType: 'GROUP' }
              }
          ],
          where: whereConditions,
          attributes: ['id', 'subscriptionStartDate', 'subscriptionEndDate', 'isCustom', 'isCancelled', 'billingType', 'status', 'subscriptionAmountPaid', 'paymentModeResponse'],
          order: [[Package, 'priorityLevel', 'DESC']],
          raw: true,
          nest: true
      })

      if (!subscription) {
          return false;
      }

      // Fetch the highest priority plan among all GROUP packages.
      const topPlanPriority = await Package.max('priorityLevel', {
          where: { status: true, packageType: 'GROUP', partnerId: partnerId }
      });

      // Determine if the current subscription is the highest priority
      const isTopMostPriority = subscription.package.priorityLevel == topPlanPriority;

      // Surface only the payment mode label to the frontend; never the raw blob.
      const { paymentModeResponse, ...subscriptionRest } = subscription;

      // Return subscription with a flag for top priority
      return {
          ...subscriptionRest,
          paymentMode: extractPaymentMode(paymentModeResponse),
          isTopMostPlan: isTopMostPriority
      };

  } catch (error) {
      console.error('Error finding package details:', error);
      return false
  }
})

async function cancelAllAddOns(packageId, corporateId, transaction) {
  const cascadedAddons = [];

  // Fetch serviceOperatorId values for the group and find individual packages in a single query
  const servicesUnderAPackage = await Cashback.findAll({
    attributes: ["serviceOperatorId", "packageId"],
    where: {
      serviceStatus: true,
      packageId: packageId,
    },
    raw: true,
    nest: true,
  });

  if (!servicesUnderAPackage.length) return cascadedAddons;

  const servicesId = servicesUnderAPackage.map(
    (cashback) => cashback.serviceOperatorId
  );

  const IndividualPackages = await Cashback.findAll({
    include: [
      {
        model: Package,
        where: {
          status: true,
          packageType: "INDIVIDUAL",
        },
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

  if (!IndividualPackages.length) return cascadedAddons;

  const IndividualPackageIds = IndividualPackages.map(
    (cashback) => cashback.packageId
  );

  const addonRows = await Subscription.findAll({
    include: [{ model: ServiceOperator, attributes: ["serviceProvider"], required: false }],
    where: {
      packageId: { [Op.in]: IndividualPackageIds },
      corporateUserId: corporateId,
      isCustom: true,
      status: "ACTIVE",
    },
    attributes: ["id", "packageId", "serviceOperatorId", "subscriptionEndDate", "maxLimit"],
    raw: true,
    nest: true,
    transaction,
  });

  if (!addonRows.length) return cascadedAddons;

  const recurringAddonIds = [];
  for (const row of addonRows) {
    if (row.subscriptionEndDate == null) continue;          // lifetime — keep
    const cashback = await Cashback.findOne({
      where: { packageId: row.packageId, serviceOperatorId: row.serviceOperatorId },
      include: [{ model: ServiceOperator, attributes: ["isDynamicUnitPricing"] }],
      raw: true,
      nest: true,
      transaction,
    });
    if (cashback?.serviceOperator?.isDynamicUnitPricing) {
      recurringAddonIds.push(row.id);
      cascadedAddons.push({
        name: row.serviceOperator?.serviceProvider || "Add-on",
        maxLimit: parseFloat(row.maxLimit || 0),
      });
    }
  }

  if (recurringAddonIds.length > 0) {
    await Subscription.update(
      { isCancelled: true },
      {
        where: { id: { [Op.in]: recurringAddonIds } },
        transaction,
      }
    );
  }

  return cascadedAddons;
}

exports.cancelUserSubscription = asyncHandler(async (params) => {
  const transaction = await sequelize.transaction();
  try {
      const { subscriptionId, corporateId, packageType, packageId, isCustom } = params;

      // step 1 : Update the isCancelled = true (inside the transaction so the base + its cascaded
      // add-ons commit/rollback atomically — otherwise a cascade failure would strand a cancelled
      // base with still-active add-ons).
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
          await transaction.commit();
          return {
              success: true,
              message: "Your add-on subscription has been cancelled. You will still be able to use the service until the end of your current billing cycle.",
              cascadedAddons: [],
              bundledWhatsAppCancelled: false,
          };
      }

      let cascadedAddons = [];
      let bundledWhatsAppCancelled = false;
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
          cascadedAddons = (await cancelAllAddOns(packageId, corporateId, transaction)) || [];

          // Peko+ bundle: when the user cancels Peko+, mark the bundled WhatsApp basic
          // row isCancelled=true too. Keep status ACTIVE so the user retains access until
          // Peko+ naturally expires; the scheduler's handleCancelledSubscription will then
          // EXPIRE both rows on the same day.
          if (await exports.isTopTierGroupPackage(packageId, { transaction })) {
              const [affectedCount] = await whatsappSubscription.update(
                  { isCancelled: true },
                  {
                      where: {
                          corporateUserId: corporateId,
                          status: 'ACTIVE',
                          subscriptionPaymentRefId: null,
                          billingPlan: 'BASIC',
                          isCustom: false,
                      },
                      transaction,
                  },
              );
              bundledWhatsAppCancelled = affectedCount > 0;
          }
      }
      await transaction.commit();
      return {
          success: true,
          message: "Your subscription has been cancelled. You will still be able to use the service until the end of your current billing cycle.",
          cascadedAddons,
          bundledWhatsAppCancelled,
      };
  } catch (error) {
      console.error('Error while canceling the subscription:', error);
      await transaction.rollback();
      // Don't claim success on a rolled-back cancel — the controller surfaces this as a 500 and the
      // user can retry. Returning success here would send a "cancelled" email while nothing changed.
      return {
          success: false,
          message: "Subscription cancellation failed. Please try again.",
          cascadedAddons: [],
          bundledWhatsAppCancelled: false,
      };
  }
});

exports.cancelUserSubscriptionPlan = asyncHandler(async (params) => {
  try {
      const { subscriptionId, corporateId } = params;

      await Subscription.update(
          { isCancelled: true },
          {
              where: {
                  id: subscriptionId,
                  corporateUserId: corporateId,
              },
          },
      );

      return { success: true, message: "Your subscription has been cancelled. You will still be able to use the service until the end of your current billing cycle." };
  } catch (error) {
      console.error('Error while canceling the subscription:', error);
      return { success: false, message: "Subscription cancellation failed." };
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
    console.log(subscription)
    if (!subscription) {
      const lastExpiredSubscription = await Subscription.findOne({
          where: {
              corporateUserId: corporateId,
              packageId: packageIds,
              isCustom: false,
              status: 'EXPIRED'
          },
          order: [['subscriptionEndDate', 'DESC']],
          raw: true,
          nest: true
      })
      return lastExpiredSubscription
  }
    return subscription;
  } catch (error) {
    console.error("Error finding package details:", error);
    return false;
  }
});

// Returns the user's ACTIVE individual-package base subscription for a packageId (or null).
// Used by limit STACKING: the individual package's included limit is snapshotted onto this row's
// maxLimit at purchase, so callers read it from the row (locked) rather than the live cashback.
// Grace keeps the limit (status stays ACTIVE during retry); EXPIRED/CANCELLED are excluded.
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
      attributes: ["id", "maxLimit"],
      raw: true,
      nest: true,
    });
  } catch (error) {
    console.error("findActiveIndividualBaseSubscription error:", error);
    return null;
  }
});

/**
 * Returns the package ids of every INDIVIDUAL package the corporate user currently owns
 * (ACTIVE, base, non-cancelled subscription). Used to block re-purchase of an already-held
 * à-la-carte plan on the plans page. Mirrors findActiveIndividualBaseSubscription's filters.
 */
exports.findActiveIndividualPackageIds = asyncHandler(async (corporateUserId) => {
  try {
    const subs = await Subscription.findAll({
      include: [
        {
          model: Package,
          attributes: [],
          where: { packageType: "INDIVIDUAL" },
        },
      ],
      where: {
        corporateUserId,
        status: "ACTIVE",
        isCustom: false,
      },
      attributes: ["packageId"],
      raw: true,
      nest: true,
    });
    return subs.map((sub) => sub.packageId);
  } catch (error) {
    console.error("findActiveIndividualPackageIds error:", error);
    return [];
  }
});

exports.findCustomSubscription = asyncHandler(async (params) => {
  try {
    const { corporateId, packageId, serviceOperatorId, accessKey } = params;

    const baseWhere = {
      corporateUserId: corporateId,
      isCustom: true,
      status: "ACTIVE",
    };

    // Attempt 1: direct serviceOperatorId match. Fastest path; works when the cashback's
    // serviceOperator.id and the addon row's serviceOperatorId agree.
    if (serviceOperatorId) {
      const rows = await Subscription.findAll({
        where: { ...baseWhere, serviceOperatorId },
        attributes: ["maxLimit"],
        raw: true,
      });
      if (rows.length) {
        return { maxLimit: rows.reduce((s, r) => s + parseFloat(r.maxLimit || 0), 0) };
      }
    }

    // Attempt 2: accessKey JOIN — handles the case where the serviceOperators table holds
    // multiple rows for the same accessKey (per-partner or legacy duplicates) and the
    // cashback's JOIN picked a different one than the addon row was tagged with.
    if (accessKey) {
      const rows = await Subscription.findAll({
        include: [{
          model: ServiceOperator,
          attributes: [],
          where: { accessKey },
          required: true,
        }],
        where: baseWhere,
        attributes: ["maxLimit"],
        raw: true,
        nest: true,
      });
      if (rows.length) {
        return { maxLimit: rows.reduce((s, r) => s + parseFloat(r.maxLimit || 0), 0) };
      }
    }

    // Attempt 3 (legacy): packageId match — for rows that predate serviceOperatorId tracking.
    // CRITICAL: a single packageId can be shared across many addon services. When a service has
    // no INDIVIDUAL package (e.g. Turbo/garage), the caller falls back to the active GROUP plan's
    // packageId — and EVERY addon under that plan carries the same packageId. A packageId-only
    // match would then sum every service's addons (e.g. counting Payroll + eInvoice toward Turbo,
    // inflating maxLimit). So scope to this service's serviceOperatorId, still allowing genuinely
    // legacy untagged (NULL) rows for the package.
    if (packageId) {
      const where = { ...baseWhere, packageId };
      if (serviceOperatorId) {
        where.serviceOperatorId = { [Op.or]: [serviceOperatorId, null] };
      }
      const rows = await Subscription.findAll({
        where,
        attributes: ["maxLimit"],
        raw: true,
      });
      if (rows.length) {
        return { maxLimit: rows.reduce((s, r) => s + parseFloat(r.maxLimit || 0), 0) };
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding package details:", error);
    return false;
  }
});

exports.findUserSubscriptionsByService = asyncHandler(async (params) => {
  try {
    const { corporateId, accessCode } = params;

    const allCashbacks = await Cashback.findAll({
      include: [
        {
          model: ServiceOperator,
          attributes: ["id", "accessKey", "serviceProvider"],
          where: { accessKey: accessCode },
        },
        {
          model: Package,
          attributes: ["id", "packageType"],
          where: { status: true },
        },
      ],
      where: { serviceStatus: true },
      attributes: ["baseLimit", "unitPrice"],
      raw: true,
      nest: true,
    });

    if (!allCashbacks.length) return false;

    const packageIds = allCashbacks.map((row) => row.package?.id).filter(Boolean);
    const individualCashback = allCashbacks.find((row) => row.package?.packageType === "INDIVIDUAL");

    let currentSubscription;

    // Check whether the user owns this service's INDIVIDUAL base subscription. packageIds (derived from
    // every cashback row for this accessKey) includes BOTH the bundled GROUP package (e.g. Peko Free, which
    // grants this service a baseLimit) AND the INDIVIDUAL package id. We MUST restrict to packageType
    // 'INDIVIDUAL' here — otherwise this query also matches the user's active Peko Free GROUP base row and,
    // with no ORDER BY, findOne returns the older GROUP row, so the settings page shows "Peko Free" instead
    // of the purchased individual package. The GROUP fallback below handles users with no individual package.
    currentSubscription = await Subscription.findOne({
      include: [
        {
          model: Package,
          attributes: ["id", "packageName", "packageType", "packagePrices", "discount"],
          where: { id: { [Op.in]: packageIds }, packageType: "INDIVIDUAL" },
        },
      ],
      where: {
        corporateUserId: corporateId,
        status: "ACTIVE",
        isCustom: false,
      },
      attributes: [
        "id",
        "subscriptionStartDate",
        "subscriptionEndDate",
        "subscriptionAmountPaid",
        "status",
        "billingType",
        "maxLimit",
        "isCancelled",
        "vendorSubscriptionId",
      ],
      order: [["subscriptionEndDate", "DESC"], ["id", "DESC"]],
      raw: true,
      nest: true,
    });

    // if it not present find the group package
    if (!currentSubscription) {
      currentSubscription = await Subscription.findOne({
        include: [
          {
            model: Package,
            attributes: ["id", "packageName", "packageType", "packagePrices", "discount"],
            where: { packageType: "GROUP" },
          },
        ],
        where: {
          corporateUserId: corporateId,
          status: "ACTIVE",
        },
        attributes: [
          "subscriptionStartDate",
          "subscriptionEndDate",
          "subscriptionAmountPaid",
          "status",
          "billingType",
          "vendorSubscriptionId",
        ],
        raw: true,
        nest: true,
      });
    }

    if (!currentSubscription) return false;

    const operatorRows = await ServiceOperator.findAll({
      where: { accessKey: accessCode },
      attributes: ['id', 'serviceProvider'],
      raw: true,
    });
    const operatorIds = operatorRows.map((row) => row.id);
    const serviceProviderName =
      operatorRows[0]?.serviceProvider ?? allCashbacks[0]?.serviceOperator?.serviceProvider;

    const baseAddonWhere = {
      corporateUserId: corporateId,
      status: "ACTIVE",
      isCustom: true,
    };
    const addonAttributes = [
      "id",
      "subscriptionStartDate",
      "subscriptionEndDate",
      "subscriptionAmountPaid",
      "status",
      "billingType",
      "maxLimit",
      "isCustom",
      "isGracePeriod",
      "isCancelled",
      "serviceOperatorId",
      "packageId",
      "subscriptionPaymentRefId",
    ];
    const addonInclude = [
      { model: Package, attributes: ["packageName", "packagePrices", "discount"] },
    ];

    let addonRows = [];

    // Attempt 1: serviceOperatorId IN (...) — covers rows with serviceOperatorId tracking.
    if (operatorIds.length > 0) {
      addonRows = await Subscription.findAll({
        include: addonInclude,
        where: { ...baseAddonWhere, serviceOperatorId: { [Op.in]: operatorIds } },
        attributes: addonAttributes,
        order: [["createdAt", "DESC"]],
        raw: true,
        nest: true,
      });
    }

    // Attempt 2 (legacy): match by packageId, but ONLY for rows without serviceOperatorId —
    // i.e. addons that predate serviceOperatorId tracking. Modern addons are re-anchored to
    // the active GROUP package, so their packageId is the shared GROUP id (e.g. 92). Since
    // packageIds includes that GROUP package whenever the plan bundles this service, an
    // unguarded packageId match would surface a DIFFERENT service's addon here (e.g. a
    // Payroll addon showing up under E-Invoice). The serviceOperatorId match above is the
    // only correct path for those rows.
    if (!addonRows.length && packageIds.length > 0) {
      addonRows = await Subscription.findAll({
        include: addonInclude,
        where: { ...baseAddonWhere, packageId: { [Op.in]: packageIds }, serviceOperatorId: null },
        attributes: addonAttributes,
        order: [["createdAt", "DESC"]],
        raw: true,
        nest: true,
      });
    }

    customLog(null, "info", {
      message: "findUserSubscriptionsByService: addon lookup result",
      corporateId,
      accessCode,
      operatorIdsSearched: operatorIds,
      packageIdsSearched: packageIds,
      addonRowsFound: addonRows.length,
      addonRowsDetail: addonRows.map((r) => ({
        id: r.id,
        serviceOperatorId: r.serviceOperatorId,
        packageId: r.packageId,
        maxLimit: r.maxLimit,
        isCancelled: r.isCancelled,
        subscriptionPaymentRefId: r.subscriptionPaymentRefId,
      })),
    });

    // Split active addon rows into two buckets so the frontend can render them as separate
    // cards: live (not cancelled) and pending-cancellation (isCancelled=true but still ACTIVE
    // until natural expiry). Aggregation rules per bucket:
    //   - maxLimit/amountPaid summed
    //   - isGracePeriod true if any row in the bucket is in grace
    //   - subscriptionIds carries every row's id so the frontend can issue cancel/etc per row
    const aggregateAddons = (rows) => {
      if (!rows.length) return null;
      const latest = rows[0];
      return {
        ...latest,
        maxLimit: rows.reduce((sum, r) => sum + parseFloat(r.maxLimit || 0), 0),
        subscriptionAmountPaid: rows.reduce(
          (sum, r) => sum + parseFloat(r.subscriptionAmountPaid || 0),
          0,
        ),
        isGracePeriod: rows.some((r) => !!r.isGracePeriod),
        isCancelled: rows.every((r) => !!r.isCancelled),
        subscriptionIds: rows.map((r) => r.id),
        package: {
          ...latest.package,
          packageName: serviceProviderName || latest.package?.packageName,
        },
      };
    };

    const liveAddonRows = addonRows.filter((r) => !r.isCancelled);
    const cancelledAddonRows = addonRows.filter((r) => !!r.isCancelled);
    const addOns = aggregateAddons(liveAddonRows);
    const cancelledAddOns = aggregateAddons(cancelledAddonRows);

    const groupCashback = currentSubscription?.package?.packageType === "GROUP"
      ? allCashbacks.find((row) => Number(row.package?.id) === Number(currentSubscription.package.id))
      : null;
    const cashbacks = groupCashback || individualCashback || allCashbacks[0];

    return { currentSubscription, addOns, cancelledAddOns, cashbacks };
  } catch (error) {
    console.error("Error finding package details:", error);
    return false;
  }
});

exports.findIndiVidualPackageUnderGroup = asyncHandler(async (packageId, partnerId) => {
  try {
      const servicesUnderAPackage = await Cashback.findAll({
          attributes: ['serviceOperatorId', 'packageId'],
          where: {
              serviceStatus: true,
              packageId: packageId,
          },
          raw: true,
          nest: true
      });
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
      const IndividualPackageIds = IndividualPackages.map((cashback) => cashback.packageId)

      const individualPackages = await Package.findAll({
          where: {
              id: {
                  [Op.in]: IndividualPackageIds
              },
              status: true,
              packageType: 'INDIVIDUAL',
              partnerId: partnerId,
          },
          attributes: ['packageName', "packagePrices", "description", 'discount'],
          raw: true,
          nest: true
      })

      const packageObj = individualPackages.reduce((acc, pkg) => {
          acc[pkg.packageName] = pkg.packagePrices.monthly - pkg.discount.monthly;
          return acc;
      }, {});

      return packageObj
  } catch (error) {
      console.error('Error finding cashback row:', error);
      return false
  }
})

exports.findGroupServicesPricingUnderPackage = asyncHandler(async (packageId, partnerId) => {
  try {
    const groupCashbacks = await Cashback.findAll({
      include: [
        {
          model: ServiceOperator,
          attributes: ["id", "serviceProvider", "accessKey", "isDynamicUnitPricing"],
        },
      ],
      attributes: ["serviceOperatorId", "packageId", "unitPrice", "baseLimit", "surcharge", "surchargeType"],
      where: {
        serviceStatus: true,
        packageId,
      },
      raw: true,
      nest: true,
    });

    if (!groupCashbacks.length) return [];

    // Individual-package pricing per service is now surfaced via the top-level individualPlans
    // array (see findAllIndividualPackages), so this builder stays pure group-service pricing.
    return groupCashbacks.map((groupRow) => ({
      serviceOperatorId: groupRow.serviceOperatorId,
      serviceName: groupRow.serviceOperator?.serviceProvider ?? null,
      accessKey: groupRow.serviceOperator?.accessKey ?? null,
      unitPrice: groupRow.unitPrice != null ? Number(groupRow.unitPrice) : null,
      baseLimit: groupRow.baseLimit != null ? Number(groupRow.baseLimit) : null,
      isDynamicUnitPricing: !!groupRow.serviceOperator?.isDynamicUnitPricing,
      surcharge: groupRow.surcharge != null ? Number(groupRow.surcharge) : null,
      surchargeType: groupRow.surchargeType ?? null,
    }));
  } catch (error) {
    console.error("Error finding group service pricing:", error);
    return false;
  }
});


const SERVICE_LABEL_BY_ACCESS_CODE = {
  accounting: 'Accounting',
  ecommerce_store: 'Peko Commerce',
  peko_pos: 'Peko POS',
};

exports.findAndCountAllUserSubscriptionsAll = asyncHandler(async (params) => {
  try {
      let {
          limit,
          offset,
          status,
          corporateId // partner ID to filter
      } = params;
      const query = `
              SELECT
                  cps.*,
                  p.accessCode AS packageAccessCode
              FROM
                  corporatePurchaseSubscriptionView cps
              LEFT JOIN packages p ON p.id = cps.packageId
              WHERE(cps.subscriptionPaymentRefId IS NOT NULL)
              ${status ? `
AND (
    cps.status = 'ACTIVE'
    OR (cps.status = 'EXPIRED' AND cps.subscriptionEndDate >= DATE_SUB(NOW(), INTERVAL 10 DAY))
)
` : ''}
              ${corporateId ? `AND cps.corporateUserId = :corporateId` : ''}
               ORDER BY
               cps.createdAt DESC
              LIMIT
                  :limit
              OFFSET
                  :offset;
          `;

      // Preparing replacements for query
      const replacements = {
          limit: limit,
          offset: offset
      };
      if (corporateId) {
          replacements.corporateId = corporateId;
      }
      if (status) {
          replacements.status = status;
      }

      const data = await sequelizeConfig.query(query, {
          replacements: replacements,
          type: sequelize.QueryTypes.SELECT,
      });

      const countQuery = `
                 SELECT 
                     COUNT(*) AS totalCount
                 FROM 
                     corporatePurchaseSubscriptionView
                      WHERE(subscriptionPaymentRefId IS NOT NULL)
             ${status ? `
AND (
    status = 'ACTIVE'
    OR (status = 'EXPIRED' AND subscriptionEndDate >= DATE_SUB(NOW(), INTERVAL 10 DAY))
)
` : ''}
              ${corporateId ? `AND corporateUserId = :corporateId` : ''} `
      const totalCountResult = await sequelizeConfig.query(countQuery, {
          replacements: replacements,
          type: sequelize.QueryTypes.SELECT,
      });

      // For isCustom addon rows from the main subscription table, look up the real
      // addon service name. The corporatePurchaseSubscriptionView was created before
      // serviceOperatorId was added, so the column is not in the view output.
      // Instead, query the subscriptions table directly by id to get serviceOperatorId,
      // then resolve the display name from serviceOperators.
      const specialTables = new Set(['whatsAppSubscription', 'serviceSubscription', 'business_email_subscriptions']);
      const addonSubscriptionIds = data
        .filter(item => item.isCustom && !specialTables.has(item.tableName))
        .map(item => item.id);

      let addonServiceNameMap = {}; // subscriptionId → serviceProvider
      if (addonSubscriptionIds.length > 0) {
        const soRows = await sequelizeConfig.query(
          `SELECT s.id AS subscriptionId, so.serviceProvider
           FROM subscriptions s
           JOIN serviceOperators so ON so.id = s.serviceOperatorId
           WHERE s.id IN (:ids) AND s.serviceOperatorId IS NOT NULL`,
          { replacements: { ids: addonSubscriptionIds }, type: sequelize.QueryTypes.SELECT }
        );
        addonServiceNameMap = soRows.reduce((acc, row) => {
          acc[row.subscriptionId] = row.serviceProvider;
          return acc;
        }, {});
      }

      const transformedData = data.map(item => {
        let packageName = item.packageName;
        if(item.tableName === 'whatsAppSubscription' && item.isCustom) {
            packageName = "WhatsApp Add on"
        }
        if(item.tableName === 'serviceSubscription') {
            const serviceLabel = SERVICE_LABEL_BY_ACCESS_CODE[item.packageAccessCode];
            packageName = serviceLabel ? `${serviceLabel} - ${item.packageName}` : item.packageName
        }
        if(item.tableName === 'business_email_subscriptions') {
            packageName = "Google Workspace - " + item.packageName
        }
        if (item.isCustom && !specialTables.has(item.tableName)) {
            const serviceName = addonServiceNameMap[item.id];
            packageName = serviceName ? `Add On (${serviceName})` : `Add On (${item.packageName})`;
        }
        return {
            id: item.id,
            subscriptionPaymentRefId: item.subscriptionPaymentRefId,
            subscriptionStartDate: item.subscriptionStartDate,
            subscriptionEndDate: item.subscriptionEndDate,
            subscriptionAmountPaid: item.subscriptionAmountPaid,
            status: item.tableName === 'whatsAppSubscription' && item.status === 'PENDING' ? 'PURCHASED' : item.status,
            billingType: item.billingType,
            isCustom: item.isCustom,
            maxLimit: item.maxLimit,
            isCancelled: item.isCancelled,
            tableName: item.tableName,
            createdAt: item.createdAt,
            package: {
                id: item.packageId,
                packageName: packageName,
                packageType: item.packageType,
                description: item.packageDescription,
                serviceList: item.packageServiceList,
                packageLogo: item.packageLogo,
                priorityLevel: item.packagePriorityLevel
            }
        }
    });

      return { rows: transformedData, count: totalCountResult[0].totalCount };

  } catch (error) {
      console.error('Error finding package details:', error);
      return false
  }
})

exports.findOneSubscriptionWhatsApp = asyncHandler(async (params) => {
  try {
      const { subscriptionId, corporateId } = params

      const subscription = await whatsappSubscription.findOne({
          include: [
              {
                  model: Package,
                  attributes: ['id', 'packageName', 'packageType'],
              }
          ],
          attributes: {
            include: ['isCustom'], // Include 'isCustom' along with all other attributes
        },
          where: {
              id: subscriptionId,
              corporateUserId: corporateId
          },
          raw: true,
          nest: true
      })
 // Check if subscription exists and isCustom is true
      if (subscription && subscription.isCustom) {
        subscription.package.packageName = "WhatsApp Add on";
        subscription.subscriptionPrice = subscription.subscriptionAmountPaid
      }
      return subscription
  } catch (error) {
      console.error('Error finding package details:', error);
      return false
  }
})
exports.findOneServiceSubscription = asyncHandler(async (params) => {
  try {
      const { subscriptionId, corporateId } = params

      const subscription = await serviceSubscription.findOne({
          include: [
              {
                  model: Package,
                  attributes: ['id', 'packageName', 'packageType'],
              }
          ],
          where: {
              id: subscriptionId,
              corporateUserId: corporateId
          },
          raw: true,
          nest: true
      })

      return subscription
  } catch (error) {
      console.error('Error finding package details:', error);
      return false
  }
})

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
          include: [{ model: ServiceOperator, attributes: ['accessKey'], }],
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
      const disabledServices = await DisableServices.findAll({
          include: [{
              model: ServiceOperator,
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

exports.findLastExpiredSubscription = asyncHandler(async (params) => {
  try {
      const { corporateId, packageId } = params

      // Calculate the date 30 days ago from today
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (packageId) {
          const checkLatestExpiredSubscription = await Subscription.findOne({
              include: [
                  {
                      model: Package,
                      attributes: ['packageName','packageType']
                  }
              ],
              where: {
                  status: 'EXPIRED',
                  packageId: packageId,
                  corporateUserId: corporateId,
                  isCustom: false,
                  subscriptionEndDate: { [Op.gte]: thirtyDaysAgo }, // Only last 30 days

              },
              order: [['subscriptionEndDate', 'DESC']], // Adjust to the correct timestamp column
              attributes: ['billingType', 'status', 'packageId', 'id', 'paymentMode'],
              raw: true,
              nest: true
          });
          if (checkLatestExpiredSubscription) return checkLatestExpiredSubscription
      }

      const checkLatestExpiredGroupSubscription = await Subscription.findOne({
          include: [
              {
                  model: Package,
                  where: {
                      packageType: "GROUP"
                  },
                  attributes: ['packageName','packageType']
              }
          ],
          where: {
              status: 'EXPIRED',
              corporateUserId: corporateId,
              isCustom: false,
              subscriptionEndDate: { [Op.gte]: thirtyDaysAgo }, // Only last 30 days
          },
          order: [['subscriptionEndDate', 'DESC']], // Adjust to the correct timestamp column
          attributes: ['billingType', 'status', 'packageId', 'id', 'paymentMode'],
          raw: true,
          nest: true
      });

      return checkLatestExpiredGroupSubscription
  } catch (error) {
      console.log(error);
      return false
  }
})

exports.findAddonPrice = asyncHandler(async (params) => {
  const whereClause = { packageId: params.packageId };
  if (params.serviceOperatorId) {
    whereClause.serviceOperatorId = params.serviceOperatorId;
  }
  const cashback = await Cashback.findOne({
      include: [
          {
              model: Package,
              attributes: ['packageType']
          },
          {
              model: serviceOperators,
              attributes: ['id', 'isDynamicUnitPricing']
          }
      ],
      where: whereClause,
      attributes: ['unitPrice', 'baseLimit', 'packageId'],
      raw: true,
      nest: true
  });

  return cashback;
})

/**
 * Calculates what will be charged at the next billing date for a corporate user.
 * Mirrors the scheduler's calculatePlanAmount (and paymentGateway's
 * cashFreeGateway.calculatePlanAmount), which is the calculation that actually
 * charges the customer at renewal:
 *   total = plan price – discount
 *           + sum(addon unitPrice × maxLimit) for active, recurring addons only
 * Group-tier cashback pricing overrides the individual addon price, and one-time
 * wallet addons (isDynamicUnitPricing = false) are excluded.
 *
 * Returns: { nextBillingDate, amount, description }
 */
exports.calculateNextBillingInfo = async (corporateId, currentSubscription) => {
  try {
    const { billingType, subscriptionEndDate, package: pkg } = currentSubscription;
    const billingKey = billingType?.toLowerCase() ?? 'monthly';

    // findCurrentGroupSubscription doesn't include packagePrices/discount — fetch them separately
    let packagePrices = pkg?.packagePrices;
    let packageDiscount = pkg?.discount;
    if ((!packagePrices || !packageDiscount) && pkg?.id) {
      const pkgFull = await Package.findOne({
        where: { id: pkg.id },
        attributes: ['packagePrices', 'discount'],
        raw: true,
      });
      packagePrices = pkgFull?.packagePrices;
      packageDiscount = pkgFull?.discount;
    }

    // packagePrices/discount may be stored as JSON strings
    if (typeof packagePrices === 'string') packagePrices = JSON.parse(packagePrices);
    if (typeof packageDiscount === 'string') packageDiscount = JSON.parse(packageDiscount);

    const planPrice = parseFloat(packagePrices?.[billingKey] ?? 0);
    const planDiscount = parseFloat(packageDiscount?.[billingKey] ?? 0);
    const planTotal = planPrice - planDiscount;

    // ── Addon total — mirrors scheduler calculatePlanAmount (and paymentGateway
    // cashFreeGateway.calculatePlanAmount), so the amount shown here matches what
    // is actually charged at renewal. Rules from that logic apply:
    //   1. Only active, non-cancelled addon subscriptions still within their period.
    //   2. Skip static / one-time addons (isDynamicUnitPricing = false, e.g. eSign,
    //      Turbo, Invoicing) — they do not auto-renew, so they never recur in the charge.
    //   3. Resolve price by the addon's serviceOperatorId, preferring the current plan's
    //      tier row. On renewal an addon is re-anchored to the active GROUP package
    //      (paymentGateway renewAddonSubscriptions), so its packageId is the GROUP id and
    //      keying on packageId + 'INDIVIDUAL' would miss it entirely.
    const addonSubscriptions = await sequelizeConfig.query(
      `SELECT s.packageId, s.serviceOperatorId, s.maxLimit
       FROM subscriptions s
       WHERE s.corporateUserId = :corporateId
         AND s.status = 'ACTIVE'
         AND s.isCustom = 1
         AND s.isCancelled = 0
         AND s.subscriptionEndDate IS NOT NULL
         AND DATE(s.subscriptionEndDate) >= CURDATE()`,
      { replacements: { corporateId }, type: sequelize.QueryTypes.SELECT }
    );

    const currentPlanPackageId = pkg?.id ?? null;

    let addonTotal = 0;
    const addonDescriptions = [];

    for (const addon of addonSubscriptions) {
      // Find the cashback row for this addon's service. When serviceOperatorId is set
      // (the norm), prefer the current plan's tier row and fall back to the addon's own
      // package row; otherwise fall back to a packageId lookup for legacy rows.
      const [addonData] = await sequelizeConfig.query(
        `SELECT cb.unitPrice, so.serviceProvider, so.isDynamicUnitPricing
         FROM cashbacks cb
         JOIN serviceOperators so ON cb.serviceOperatorId = so.id
         WHERE cb.serviceStatus = 1
           AND ${addon.serviceOperatorId != null
            ? 'cb.serviceOperatorId = :serviceOperatorId AND cb.packageId IN (:currentPlanPackageId, :addonPackageId)'
            : 'cb.packageId = :addonPackageId'}
         ORDER BY (cb.packageId = :currentPlanPackageId) DESC
         LIMIT 1`,
        {
          replacements: {
            serviceOperatorId: addon.serviceOperatorId ?? null,
            currentPlanPackageId,
            addonPackageId: addon.packageId,
          },
          type: sequelize.QueryTypes.SELECT,
        }
      );
      if (!addonData) continue;
      // Skip static / one-time addons — they must not recur in the renewal charge.
      if (!addonData.isDynamicUnitPricing) continue;

      const unitPrice = parseFloat(addonData.unitPrice);
      const maxLimit = parseFloat(addon.maxLimit);
      const cost = unitPrice * maxLimit;
      addonTotal += cost;
      addonDescriptions.push(`${addonData.serviceProvider} (${maxLimit} units × ₹${unitPrice}) ₹${cost}`);
    }

    const totalAmount = planTotal + addonTotal;

    const descriptionParts = [`${pkg?.packageName} ₹${planTotal}`, ...addonDescriptions];
    const description = descriptionParts.join(' + ');

    return {
      nextBillingDate: subscriptionEndDate,
      amount: totalAmount,
      description,
    };
  } catch (error) {
    console.error('Error calculating next billing info:', error);
    return null;
  }
};

exports.findSubscriptionAndAddonExist = asyncHandler(async (params) => {
  try {
      const { corporateId, packageId } = params

      const activeSubscriptionAndAddons = await Subscription.findAll({
          where: {
              corporateUserId: corporateId,
              packageId: packageId,
              status: 'ACTIVE'
          },
          raw: true,
          nest: true
      })
      const previousSubscriptionAndAddons = await Subscription.findOne({
          where: {
              corporateUserId: corporateId,
              packageId,
              isCustom: 1,
              status: {
                  [Op.in]: ['CANCELLED', 'EXPIRED']
              }
          },
          order: [['updatedAt', 'DESC']],
          raw: true
      });

      return { activeSubscriptionAndAddons, previousSubscriptionAndAddons }
  } catch (error) {
      console.error('Error finding package details:', error);
      return false
  }
})

// ── TEST-ONLY helpers (UAT date manipulation) ────────────────────────────────

exports.findAllActiveSubscriptionsForTest = asyncHandler(async (corporateId) => {
  try {
    // Every time-bound subscription lifecycle on the corporate, across BOTH tables:
    //   - main `subscriptions`: GROUP + INDIVIDUAL base plans AND their add-ons (isCustom = 1)
    //   - `whatsAppSubscriptions`: base plan AND the Bot Builder add-on
    // Return every time-bound row EXCEPT the free/basic base plan. A row is shiftable when it is a paid
    // base (subscriptionPaymentRefId set) OR an add-on (isCustom) — the add-on carries no paymentRefId
    // but must stay in lockstep with its base. That excludes ONLY the free/basic base (non-custom + no
    // paymentRefId): Peko Free and the Peko+-bundled WhatsApp Basic. This mirrors the shift-dates filter
    // exactly, so the list shows precisely what a shift will move.
    const where = {
      corporateUserId: corporateId,
      status: { [Op.in]: ['ACTIVE', 'DUE'] },
      subscriptionEndDate: { [Op.ne]: null },
      [Op.or]: [
        { subscriptionPaymentRefId: { [Op.ne]: null } },
        { isCustom: true },
      ],
    };

    const [subs, waSubs] = await Promise.all([
      Subscription.findAll({
        include: [{ model: Package, attributes: ['id', 'packageName', 'packageType'] }],
        where,
        attributes: [
          'id', 'subscriptionStartDate', 'subscriptionEndDate', 'status', 'billingType',
          'isCustom', 'isCancelled', 'vendorSubscriptionId', 'subscriptionPaymentRefId', 'packageId',
        ],
        raw: true,
        nest: true,
      }),
      whatsappSubscription.findAll({
        include: [{ model: Package, attributes: ['id', 'packageName', 'packageType'] }],
        where,
        attributes: [
          'id', 'subscriptionStartDate', 'subscriptionEndDate', 'status', 'billingType', 'billingPlan',
          'isCustom', 'isCancelled', 'vendorSubscriptionId', 'subscriptionPaymentRefId', 'packageId',
        ],
        raw: true,
        nest: true,
      }),
    ]);

    const normalize = (row, tableName) => ({
      id: row.id,
      tableName,
      subscriptionStartDate: row.subscriptionStartDate,
      subscriptionEndDate: row.subscriptionEndDate,
      status: row.status,
      billingType: row.billingType,
      isCustom: !!row.isCustom,
      isCancelled: !!row.isCancelled,
      vendorSubscriptionId: row.vendorSubscriptionId ?? null,
      subscriptionPaymentRefId: row.subscriptionPaymentRefId ?? null,
      packageId: row.packageId ?? null,
      // WhatsApp base rows may have no packages row — fall back to a Basic/Pro label off billingPlan.
      package: row.package && row.package.id
        ? row.package
        : tableName === 'whatsAppSubscription'
          ? { id: null, packageName: `WhatsApp ${row.billingPlan === 'PRO' ? 'Pro' : 'Basic'}`, packageType: 'INDIVIDUAL' }
          : null,
    });

    const all = [
      ...subs.map((r) => normalize(r, 'subscription')),
      ...waSubs.map((r) => normalize(r, 'whatsAppSubscription')),
    ];
    all.sort((a, b) => new Date(a.subscriptionEndDate) - new Date(b.subscriptionEndDate));
    return all;
  } catch (error) {
    console.error('Error fetching active subscriptions for test:', error);
    return false;
  }
});

exports.shiftSubscriptionDatesForTest = asyncHandler(async (corporateId, days, targets = null) => {
  // days is interpolated into a SQL literal below — the controller validates it, but guard here too
  // since this use-case builds raw SQL.
  if (!Number.isInteger(days) || days <= 0) return false;

  const t = await sequelize.transaction();
  try {
    // Shift BOTH start and end date back by `days` on every time-bound row (subscriptionEndDate IS NOT
    // NULL), across the main subscriptions table AND the WhatsApp table. Gating on endDate — not
    // paymentRefId — keeps a base plan and its add-ons in lockstep (an add-on with no paymentRefId used
    // to be left behind, desyncing the cycle) while leaving perpetual rows (Peko Free, permanent one-time
    // add-ons) untouched. Shifting start+end together preserves the cycle length, so the scheduler's
    // charge/expiry windows fire exactly as they would in production — no flow drift.
    const dateShift = {
      subscriptionStartDate: sequelize.literal(`DATE_SUB(subscriptionStartDate, INTERVAL ${days} DAY)`),
      subscriptionEndDate: sequelize.literal(`DATE_SUB(subscriptionEndDate, INTERVAL ${days} DAY)`),
    };
    // Base filter: shift a paid base (subscriptionPaymentRefId set) or an add-on (isCustom), but NEVER the
    // free/basic base (non-custom + no paymentRefId) — Peko Free and the Peko+-bundled WhatsApp Basic stay put.
    const baseWhere = {
      corporateUserId: corporateId,
      status: { [Op.in]: ['ACTIVE', 'DUE'] },
      subscriptionEndDate: { [Op.ne]: null },
      [Op.or]: [
        { subscriptionPaymentRefId: { [Op.ne]: null } },
        { isCustom: true },
      ],
    };

    // Optional per-package targeting: shift only the selected rows. Ids are not unique across tables, so
    // they arrive split by table. With no targets, shift ALL shiftable rows ("all packages" mode). A
    // targeted request only touches a table when it named ids for it. The basic exclusion in baseWhere
    // applies in BOTH modes, so a free/basic row can never be shifted even if its id were passed.
    const hasTargets =
      !!targets && (Array.isArray(targets.subscriptionIds) || Array.isArray(targets.whatsappSubscriptionIds));
    const subIds = targets?.subscriptionIds;
    const waIds = targets?.whatsappSubscriptionIds;

    let subRows = 0;
    let waRows = 0;

    if (!hasTargets || (Array.isArray(subIds) && subIds.length > 0)) {
      const subWhere = hasTargets ? { ...baseWhere, id: { [Op.in]: subIds } } : baseWhere;
      [subRows] = await Subscription.update(dateShift, { where: subWhere, transaction: t });
    }
    if (!hasTargets || (Array.isArray(waIds) && waIds.length > 0)) {
      const waWhere = hasTargets ? { ...baseWhere, id: { [Op.in]: waIds } } : baseWhere;
      [waRows] = await whatsappSubscription.update(dateShift, { where: waWhere, transaction: t });
    }

    await t.commit();
    return { subscriptions: subRows, whatsappSubscriptions: waRows };
  } catch (error) {
    await t.rollback();
    console.error('Error shifting subscription dates for test:', error);
    return false;
  }
});

// Same UAT date-shift trick as shiftSubscriptionDatesForTest, for serviceSubscriptions-backed
// services (Peko Commerce/ecommerce_store) instead of the main subscriptions table.
exports.shiftServiceSubscriptionDatesForTest = asyncHandler(async (corporateId, days, accessCode = 'ecommerce_store') => {
  if (!Number.isInteger(days) || days <= 0) return false;

  try {
    const [, affectedRows] = await sequelizeConfig.query(
      `UPDATE serviceSubscriptions ss
       JOIN packages p ON p.id = ss.packageId AND p.accessCode = :accessCode
       SET ss.subscriptionStartDate = DATE_SUB(ss.subscriptionStartDate, INTERVAL :days DAY),
           ss.subscriptionEndDate = DATE_SUB(ss.subscriptionEndDate, INTERVAL :days DAY)
       WHERE ss.corporateUserId = :corporateId
         AND ss.status = 'ACTIVE'
         AND ss.subscriptionEndDate IS NOT NULL`,
      { replacements: { corporateId, days, accessCode }, type: Sequelize.QueryTypes.UPDATE }
    );
    return { rows: affectedRows ?? 0 };
  } catch (error) {
    console.error('Error shifting service subscription dates for test:', error);
    return false;
  }
});