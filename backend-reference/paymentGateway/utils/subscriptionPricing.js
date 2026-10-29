"use strict";

const moment = require("moment");
const { Op } = require("sequelize");

const Subscription = require("../models/entities/subscription");
const Package = require("../models/entities/package");
const {
  findAllActiveIndividualSubscriptions,
  findExistingGroupPackage,
  findAddonPrice,
  findAllSubscription,
  findAllAddonSubscription,
} = require("../models/use-cases/subscription");
const { findOneById: findServiceOperatorById } = require("../models/use-cases/serviceOperator");
const { findOnePackage } = require("../models/use-cases/packages");
const { isRecurringAddon, calculateAddonLineTotal, annualizeAddon } = require("./addonPricing");
const { calculateDiscount } = require("./calculateDiscount");
const { calculateTaxBreakdown } = require("../services/GSTandTAXcalculation");
const { getGstDetails } = require("../models/use-cases/setting");
const { findActiveByAccessCode } = require("../models/use-cases/serviceSubscription");
const operatorsData = require("./operatorsData.json");
const { computeUpgradeCredit } = require("./upgradeCredit");
const { customLog } = require("./loggerHelper");

// A pro-rated upgrade credit (calculateRemainingCost) refunds the unused TIME of the existing subscription.
// That only makes sense for RECURRING / dynamic-per-unit services (payroll seats etc. — persistent capacity).
// Consumable one-time services (eSign, invoicing, turbo — serviceOperator.isDynamicUnitPricing = false) can
// have their quota spent before the upgrade, so their leftover time has no refundable value → no credit.
// `isRecurringAddon` already reads !!serviceOperator.isDynamicUnitPricing (handles the raw 1/0 the DB returns),
// so it's the single source of truth — no separate service list to maintain. Resolves via findAddonPrice
// (base rows can have serviceOperatorId = null, so resolve by packageId). Unresolved cashback ⇒ true
// (default to giving the credit — never wrongly deny a refund).
const isRefundableService = async ({ packageId, serviceOperatorId }) => {
  if (packageId == null) return true;
  try {
    const addonData = await findAddonPrice({ packageId, serviceOperatorId: serviceOperatorId ?? undefined });
    return !addonData || isRecurringAddon(addonData);
  } catch {
    return true;
  }
};

const calculateRemainingCost = (subscription, legacyTaxRateDecimal = 0, asOf = new Date()) => {
  // A subscription in grace / failed-renewal hasn't been paid for its current cycle — it must not
  // yield pro-rated upgrade credit. (Grace still KEEPS the usage limit; that's a separate path.)
  if (subscription.isGracePeriod) return 0;
  const startDate = new Date(subscription.subscriptionStartDate);
  const endDate = new Date(subscription.subscriptionEndDate);
  const currentDate = new Date(asOf);

  endDate.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);
  const totalSubscriptionDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24)) - 1;

  if (remainingDays < 0) {
    return 0;
  }

  const paidAmount =
    subscription.taxableAmount != null
      ? parseFloat(subscription.taxableAmount)
      : parseFloat(subscription.subscriptionAmountPaid) / (1 + legacyTaxRateDecimal);
  const costPerDay = parseFloat(paidAmount / totalSubscriptionDays);
  return remainingDays * costPerDay;
};

const roundDownToNearest = (value, step = 0.01) => {
  const factor = 1 / step;
  return Math.floor(value * factor) / factor;
};

const buildBreakdown = (subscriptions = [], legacyTaxRateDecimal = 0, asOf = new Date()) => {
  const breakdown = [];
  let totalRemainingAmount = 0;

  subscriptions.forEach((subscription) => {
    const remainingCost = calculateRemainingCost(subscription, legacyTaxRateDecimal, asOf);
    totalRemainingAmount += remainingCost;

    if (remainingCost > 0) {
      breakdown.push({
        subscriptionId: subscription.id,
        packageId: subscription.packageId,
        isAddon: !!subscription.isCustom,
        billingType: subscription.billingType,
        subscriptionEndDate: subscription.subscriptionEndDate,
        remainingDiscount: roundDownToNearest(remainingCost),
        reason: subscription.isCustom
          ? `Pro-rated credit from active add-on subscription (ends ${new Date(subscription.subscriptionEndDate).toLocaleDateString()})`
          : `Pro-rated credit from active subscription (ends ${new Date(subscription.subscriptionEndDate).toLocaleDateString()})`,
      });
    }
  });

  const price = roundDownToNearest(totalRemainingAmount);
  return {
    price,
    reason:
      price > 0
        ? "Discount is calculated from unused value of your currently active subscriptions."
        : "No active eligible subscription found for discount calculation.",
    message:
      price > 0
        ? "You have already purchased some subscription plans. Here is your discount!"
        : undefined,
    breakdown,
  };
};

const pickPrice = (prices, billingType) => {
  if (!prices) return 0;
  const parsed = typeof prices === "string" ? JSON.parse(prices) : prices;
  if (billingType === "MONTHLY") return parseFloat(parsed.monthly ?? 0);
  if (billingType === "ANNUALLY") return parseFloat(parsed.annually ?? 0);
  return 0;
};

const getPackagePlanDiscount = (packageDetails, billingType) =>
  Math.min(
    pickPrice(packageDetails?.discount, billingType),
    pickPrice(packageDetails?.packagePrices, billingType)
  );

const safeLog = (...args) => {
  try { customLog(...args); } catch { /* swallow logging errors */ }
};

/**
 * Canonical subscription price calculation — the ONLY place this logic should live.
 *
 * Used by:
 *   - `validatePrice` (cashFreeGateway.js) to verify the amount sent by the client.
 *   - `getSubscriptionPricing` controller (subscription.js) to return the breakdown to the frontend.
 *
 * @param {object} params
 * @param {number} params.corporateId
 * @param {number=} params.credentialId  needed for a Peko Commerce package (its active subscription is looked up by credential)
 * @param {object} params.packageDetails  Package row (must include packagePrices, discount, packageType)
 * @param {'MONTHLY'|'ANNUALLY'} params.billingType
 * @param {string=} params.couponCode
 * @param {string|number=} params.partnerId
 * @param {boolean=} params.authPayment   true for AUTH (initial purchase/mandate setup) — recurring
 *                                        addons billed next cycle so excluded from expectedPaymentAmount.
 *                                        false for CHARGE (renewal) — recurring addons are included.
 */
const calculateSubscriptionPrice = async ({
  corporateId,
  credentialId,
  packageDetails,
  billingType,
  couponCode,
  partnerId,
  authPayment = true,
  asOf,
  creditCurrentGroupPlan = true,
}) => {
  if (!packageDetails) throw new Error("packageDetails is required");
  if (!["MONTHLY", "ANNUALLY"].includes(billingType)) {
    throw new Error(`Invalid billingType: ${billingType}`);
  }
  const pricedAt = asOf != null && !Number.isNaN(new Date(asOf).getTime()) ? new Date(asOf) : new Date();

  const packagePrice = pickPrice(packageDetails.packagePrices, billingType);
  const packageDiscount = pickPrice(packageDetails.discount, billingType);
  const packageId = packageDetails.id;
  const packageType = packageDetails.packageType;

  let legacyTaxRateDecimal = 0;
  try {
    const gstSetting = await getGstDetails();
    const legacyRate = parseFloat(gstSetting?.details?.gst);
    if (!isNaN(legacyRate) && (gstSetting?.details?.type || "PERCENTAGE") === "PERCENTAGE") {
      legacyTaxRateDecimal = legacyRate / 100;
    }
  } catch {
    legacyTaxRateDecimal = 0;
  }

  let additionalDiscount = 0;
  let annualAddonPrice = 0;
  let monthlyAddonPrice = 0;
  let creditSources = [];

  // Peko Commerce keeps its subscriptions in serviceSubscriptions and credits the unused time of (price - discount).
  const isEcommerceStore = packageDetails.accessCode === operatorsData["ecommerceStore"]["accessKey"];

  if (isEcommerceStore) {
    additionalDiscount = computeUpgradeCredit(
      await findActiveByAccessCode(credentialId, packageDetails.accessCode)
    );
  } else if (packageType === "INDIVIDUAL") {
    const activeSubscriptionAndAddons = await findAllSubscription({
      corporateUserId: corporateId,
      packageId,
      status: "ACTIVE",
      isCancelled: false,
    });

    if (Array.isArray(activeSubscriptionAndAddons) && activeSubscriptionAndAddons.length > 0) {
      // Consumable one-time services (eSign / invoicing / turbo — isDynamicUnitPricing = false) get no
      // pro-rated credit: their quota may already be spent, so unused TIME has no refundable value. Recurring
      // capacity services (payroll etc.) still credit. Every row here shares this package's service, so
      // decide once.
      const creditRemaining = await isRefundableService({ packageId });
      for (const subscription of activeSubscriptionAndAddons) {
        // INDIVIDUAL purchase: credit pro-rated value of the user's existing same-package
        // subscription + recurring addons (e.g. monthly→annual swap rebates the unused month).
        if (creditRemaining) {
          additionalDiscount += calculateRemainingCost(subscription, legacyTaxRateDecimal, pricedAt);
        }

        if (subscription.isCustom) {
          const addonData = await findAddonPrice({
            packageId: subscription.packageId,
            serviceOperatorId: subscription.serviceOperatorId,
          });
          if (!addonData || !addonData.serviceOperator) {
            const [pkg, svcOp] = await Promise.all([
              findOnePackage(subscription.packageId),
              findServiceOperatorById(subscription.serviceOperatorId),
            ]);
            safeLog(null, "error", {
              message: "Cashback not configured — add cashback entry in admin panel",
              packageId: subscription.packageId,
              packageName: pkg?.packageName,
              serviceOperatorId: subscription.serviceOperatorId,
              serviceProvider: svcOp?.serviceProvider,
              serviceAccessKey: svcOp?.accessKey,
            });
            throw new Error("Cashback not configured for add-on package");
          }
          if (isRecurringAddon(addonData)) {
            const lineTotal = calculateAddonLineTotal(addonData.unitPrice, subscription.maxLimit);
            monthlyAddonPrice += lineTotal;
            annualAddonPrice += lineTotal;
          }
        }
      }
      creditSources = creditRemaining ? activeSubscriptionAndAddons : [];
    }
  } else if (packageType === "GROUP") {
    const currentSubscription = await findExistingGroupPackage(corporateId);
    const currentPackageId = currentSubscription?.package?.id;

    const subscriptionResult = await findAllActiveIndividualSubscriptions({
      corporateId,
      packageId,
      currentPackageId,
      partnerId,
    });

    if (subscriptionResult) {
      const { allActiveSubscriptions, previousAddons } = subscriptionResult;
      const accountedAddonPackageIds = new Set();
      const creditedBaseSubs = [];

      if (Array.isArray(allActiveSubscriptions)) {
        for (const subscription of allActiveSubscriptions) {
          // GROUP purchase: addons DO NOT credit — their seats carry over to the new base limit.
          // Only base (non-addon) subscriptions contribute pro-rated credit — EXCEPT consumable one-time
          // services (isDynamicUnitPricing = false, e.g. eSign/invoicing/turbo), whose quota may already be
          // spent (no refundable time value).
          if (!subscription.isCancelled && !subscription.isCustom) {
            const isCurrentGroupPlan =
              creditCurrentGroupPlan &&
              currentPackageId != null &&
              Number(subscription.packageId) === Number(currentPackageId);
            if (isCurrentGroupPlan || (await isRefundableService(subscription))) {
              additionalDiscount += calculateRemainingCost(subscription, legacyTaxRateDecimal, pricedAt);
              creditedBaseSubs.push(subscription);
            }
          }
          if (subscription.isCustom && !subscription.isCancelled) {
            // Re-anchor to the active GROUP plan's tier (matches the charge path's calculatePlanAmount),
            // otherwise a re-anchored addon would price at the wrong tier and diverge from what was charged.
            const addonData = await findAddonPrice({
              packageId: subscription.packageId,
              serviceOperatorId: subscription.serviceOperatorId,
              groupPackageId: currentPackageId,
            });
            if (!addonData || !addonData.serviceOperator) {
              const [pkg, svcOp] = await Promise.all([
                findOnePackage(subscription.packageId),
                findServiceOperatorById(subscription.serviceOperatorId),
              ]);
              safeLog(null, "error", {
                message: "Cashback not configured — add cashback entry in admin panel",
                packageId: subscription.packageId,
                packageName: pkg?.packageName,
                serviceOperatorId: subscription.serviceOperatorId,
                serviceProvider: svcOp?.serviceProvider,
                serviceAccessKey: svcOp?.accessKey,
              });
              throw new Error("Cashback not configured for add-on package");
            }
            if (isRecurringAddon(addonData)) {
              const lineTotal = calculateAddonLineTotal(addonData.unitPrice, subscription.maxLimit);
              monthlyAddonPrice += lineTotal;
              annualAddonPrice += lineTotal;
              accountedAddonPackageIds.add(subscription.packageId);
            }
          }
        }
      }

      // Carry addon line totals from previously-active plans so the customer continues paying
      // for the same seats after switching plans.
      if (Array.isArray(previousAddons)) {
        for (const addon of previousAddons) {
          if (accountedAddonPackageIds.has(addon.packageId)) continue;
          const addonData = await findAddonPrice({
            packageId: addon.packageId,
            serviceOperatorId: addon.serviceOperatorId,
            groupPackageId: currentPackageId,
          });
          if (!addonData || !addonData.serviceOperator) continue;
          if (isRecurringAddon(addonData)) {
            const lineTotal = calculateAddonLineTotal(addonData.unitPrice, addon.maxLimit);
            monthlyAddonPrice += lineTotal;
            annualAddonPrice += lineTotal;
            accountedAddonPackageIds.add(addon.packageId);
          }
        }
      }

      // Breakdown shows only the base subscriptions that were actually credited (matches additionalDiscount —
      // consumable-usage services are excluded above, so they don't appear as a phantom credit line).
      creditSources = creditedBaseSubs;
    }
  } else {
    throw new Error(`Unsupported packageType: ${packageType}`);
  }

  // Authoritative recurring-addon total — computed identically to the charge API (scheduler
  // calculatePlanAmount): EVERY active recurring addon for the corporate (findAllAddonSubscription),
  // priced at the active GROUP tier when on a GROUP plan (findAddonPrice groupPackageId re-anchor).
  // The per-path loops above compute credits + validate cashback config, but their addon enumeration
  // can miss re-anchored addons (the GROUP path missed the payroll addon → renewal showed 999 not 1299).
  // Recomputing the addon total here is the single source of truth, so the renewal price the frontend
  // shows (getSubscriptionPricing) and the validator both equal exactly what the scheduler charges.
  // For an INDIVIDUAL package, scope to its OWN service's addons only — the charge path
  // (calculatePlanAmount, triggerSubscriptionCharges.js) skips addons whose packageId != the renewing
  // individual package. Without the same scope, a user with 2+ individual packages (each with a
  // recurring addon) would have the validator sum all of them, disagree with the actual charge, and
  // wrongly raise "Invalid subscription amount" (and false admin Charge-Now / renewal-report flags).
  if (!isEcommerceStore) {
    const activeRecurringAddons = await findAllAddonSubscription(corporateId);
    const groupForAddons = packageType === "GROUP" ? await findExistingGroupPackage(corporateId) : null;
    const groupPackageIdForAddons = groupForAddons?.package?.id ?? null;
    let recurringAddonTotal = 0;
    if (Array.isArray(activeRecurringAddons)) {
      for (const addon of activeRecurringAddons) {
        if (packageType === "INDIVIDUAL" && Number(addon.packageId) !== Number(packageId)) continue;
        const addonData = await findAddonPrice({
          packageId: addon.packageId,
          serviceOperatorId: addon.serviceOperatorId,
          groupPackageId: groupPackageIdForAddons,
        });
        if (!addonData || !isRecurringAddon(addonData)) continue;
        recurringAddonTotal += calculateAddonLineTotal(addonData.unitPrice, addon.maxLimit);
      }
    }
    // A recurring addon follows the base plan's cycle: an ANNUAL plan bills it for the full year (× 12),
    // a MONTHLY plan bills one month. Expose both so the frontend preview toggle shows the right figure.
    monthlyAddonPrice = recurringAddonTotal;
    annualAddonPrice = annualizeAddon(recurringAddonTotal, "ANNUALLY");
  }

  // Addon contribution for THIS purchase/renewal cycle (× 12 for annual, × 1 for monthly).
  const cycleAddonTotal = billingType === "ANNUALLY" ? annualAddonPrice : monthlyAddonPrice;

  // On AUTH we round pro-rated credit (legacy behaviour); on CHARGE there's no credit because
  // we're renewing the same plan, not switching.
  if (authPayment) {
    additionalDiscount = roundDownToNearest(additionalDiscount);
  } else {
    additionalDiscount = 0;
  }

  let totalDiscount = packageDiscount + additionalDiscount;

  // Coupon applied on top of pro-rated credit; backend recomputes so the client can't fake a code.
  let couponDiscount = 0;
  if (couponCode && typeof couponCode === "string" && couponCode.trim() !== "" && couponCode.trim() !== "0") {
    const paidAmountBeforeCoupon = packagePrice + (authPayment ? 0 : cycleAddonTotal) - totalDiscount;
    const result = await calculateDiscount(corporateId, couponCode, paidAmountBeforeCoupon, packageId, null, billingType, false, partnerId);
    if (result.success) {
      couponDiscount = parseFloat(result?.data?.discountAmount ?? 0);
      totalDiscount += couponDiscount;
    }
  }

  // AUTH: expected amount is base price minus discounts (recurring addons bill from next cycle).
  // CHARGE: includes recurring addon line totals (this is the renewal cycle).
  const addonContribution = authPayment ? 0 : cycleAddonTotal;
  let expectedPaymentAmount = packagePrice + addonContribution - totalDiscount;
  if (expectedPaymentAmount < 0) expectedPaymentAmount = 0;

  const tax = await calculateTaxBreakdown(expectedPaymentAmount);

  const discountBreakdown = buildBreakdown(creditSources, legacyTaxRateDecimal, pricedAt);

  return {
    packagePrice,
    packageDiscount,
    additionalDiscount,
    couponDiscount,
    totalDiscount,
    annualAddonPrice,
    monthlyAddonPrice,
    taxableAmount: tax.taxableAmount,
    taxAmount: tax.taxAmount,
    taxRate: tax.taxRate,
    cycleAddonTotal,
    expectedPaymentAmount: tax.grossAmount,
    breakdown: discountBreakdown,
  };
};

/**
 * Compute the `subscriptionEndDate` for a newly-created addon row.
 *
 * Product rule (an addon expires WITH the base it belongs to, so they renew together):
 *   - Paid GROUP plan active (Peko Go / Peko+, anything with `subscriptionPaymentRefId IS NOT NULL`):
 *       addon expires when that GROUP subscription expires.
 *   - Else, if the addon belongs to an ACTIVE INDIVIDUAL package the user holds (addonPackageId):
 *       addon expires when that individual base expires (e.g. an ANNUAL individual base keeps its
 *       addons for the full year — NOT 30 days, which would lapse them ~11 months early).
 *   - Otherwise (genuine Peko Free addon): 30-day validity from `fromDate`; auto-renews via mandate
 *     if dynamic-pricing, else the user re-purchases.
 *
 * Called by every site that stamps a date on an addon Subscription row so the behaviour is
 * consistent: regular addon purchase (PG + wallet), mandate+addon AUTH webhook, GROUP plan
 * upgrade carry-over, addon renewal on CHARGE webhook.
 *
 * @param {number|string} corporateId
 * @param {Date} [fromDate=new Date()] - Anchor for the 30-day fallback (defaults to now).
 * @param {number|string|null} [addonPackageId=null] - The addon's packageId; lets the addon anchor to
 *        a matching ACTIVE INDIVIDUAL base when there is no paid GROUP plan.
 * @returns {Promise<Date>}
 */
const computeAddonEndDate = async (corporateId, fromDate = new Date(), addonPackageId = null) => {
  // A "paid" GROUP subscription has subscriptionPaymentRefId — Peko Free has none.
  const paidGroup = await Subscription.findOne({
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
    attributes: ["subscriptionEndDate"],
    raw: true,
    nest: true,
  });

  if (paidGroup?.subscriptionEndDate) {
    return moment(paidGroup.subscriptionEndDate).endOf("day").toDate();
  }

  // No paid GROUP plan: if this addon belongs to an INDIVIDUAL package the user actively holds, the
  // addon must expire WITH that individual base (they renew together) — critical for ANNUAL individual
  // bases, where a 30-day addon would otherwise lapse mid-cycle and then renew uncharged.
  // Match ACTIVE or PENDING and take the LATEST end date: during the ~2-day pre-renewal window the
  // scheduler charge creates a PENDING successor (full new cycle) while the predecessor is still
  // ACTIVE on its near end date — an addon bought in that window must anchor to the new cycle, not
  // lapse in two days.
  if (addonPackageId != null) {
    const individualBase = await Subscription.findOne({
      include: [
        {
          model: Package,
          where: { packageType: "INDIVIDUAL" },
          attributes: ["id"],
        },
      ],
      where: {
        corporateUserId: corporateId,
        packageId: addonPackageId,
        status: { [Op.in]: ["ACTIVE", "PENDING"] },
        isCustom: false,
        isCancelled: false,
      },
      order: [["subscriptionEndDate", "DESC"]],
      attributes: ["subscriptionEndDate"],
      raw: true,
      nest: true,
    });
    if (individualBase?.subscriptionEndDate) {
      return moment(individualBase.subscriptionEndDate).endOf("day").toDate();
    }
  }

  return moment(fromDate).add(30, "days").endOf("day").toDate();
};

// Standalone, independent of computeAddonEndDate - used by verificationSuiteAddOn.js's
// paid-plan-only gate. Duplicates the same paid-GROUP-plan check rather than being called
// from computeAddonEndDate, so computeAddonEndDate itself stays completely untouched.
const findActivePaidGroupSubscription = async (corporateId) => {
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
    attributes: ["subscriptionEndDate"],
    raw: true,
    nest: true,
  });
};

module.exports = {
  calculateRemainingCost,
  roundDownToNearest,
  buildBreakdown,
  calculateSubscriptionPrice,
  getPackagePlanDiscount,
  computeAddonEndDate,
  findActivePaidGroupSubscription,
};
