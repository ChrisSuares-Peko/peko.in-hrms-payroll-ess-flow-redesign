const moment = require("moment");
const { fetchServiceDetails } = require("./checkAndFetchServiceDetails");
const operatorsData = require("./operatorsData.json");
const { sumVerificationAddonQuantity } = require("../models/use-cases/verificationAddon");
const { countVerificationRecordsThisMonth } = require("../models/use-cases/nupayVerificationRecord");
const { findActivePaidGroupSubscription, findMostRecentExpiredPaidGroupSubscription } = require("../models/use-cases/subscription");

const VERIFICATION_SUITE_ACCESS_KEY = operatorsData.verificationSuite.accessKey;

exports.VERIFICATION_SUITE_ACCESS_KEY = VERIFICATION_SUITE_ACCESS_KEY;

// baseLimit: the plan-level free allotment (shared by every corporate on that package, from Cashback -
// never mutated by a purchase). addonLimit: this specific credential's own purchased add-on quantity,
// summed live from their past successful "Verification Suite Addon" transactions (excluding any whose
// plan-derived expiry has passed). maxLimit: the two combined.
exports.getVerificationServicePricing = async ({ credentialId, corporateUserId, packageId, accessKey }) => {
  const result = await fetchServiceDetails({
    credentialId,
    accessKey: accessKey || VERIFICATION_SUITE_ACCESS_KEY,
    packageId,
    corporateUserId,
  });
  if (!result || Object.prototype.hasOwnProperty.call(result, 'error')) {
    return { unitPrice: 0, baseLimit: 0, addonLimit: 0, maxLimit: 0, addonExpiresAt: null };
  }

  const baseLimit = Number(result.baseLimit) || 0;
  const { quantity: addonLimit, nextExpiresAt: addonExpiresAt } = await sumVerificationAddonQuantity({ credentialId });

  return {
    unitPrice: Number(result.unitPrice) || 0,
    baseLimit,
    addonLimit,
    maxLimit: baseLimit + addonLimit,
    addonExpiresAt,
  };
};

exports.getVerificationFreeLimit = async ({ credentialId, corporateUserId, packageId }) => {
  const { maxLimit } = await exports.getVerificationServicePricing({ credentialId, corporateUserId, packageId });
  return maxLimit;
};

// Only an actual PAID plan (Peko Go, Peko+, ...) gets the 30-day-from-plan-start rolling reset,
// rolled forward from that plan's own subscription row. Each paid-plan switch (upgrade or downgrade
// between paid tiers) creates a brand-new ACTIVE Subscription row (the old row flips to UPGRADED) -
// see paymentGateway/utils/subscription.js's GROUP branch - so switching paid plans naturally lands
// on day 0 of a new 30-day cycle (a clean slate), and it keeps rolling every 30 days afterward for as
// long as that plan stays active.
// Anchored to max(createdAt, subscriptionStartDate) rather than subscriptionStartDate alone:
// subscriptionStartDate is truncated to midnight on every code path in
// paymentGateway/utils/subscription.js (moment().startOf("day")), and packageId identifies the plan
// TIER, not a specific subscription instance - re-subscribing to the same tier after a gap reuses the
// same packageId. createdAt (Sequelize's own auto-managed, precise insert timestamp) is unique per
// row, so on an immediate purchase/switch it correctly excludes activity from an earlier,
// now-superseded instance of the same tier even on the same calendar day. But scheduler auto-renewals
// create the successor row up to 2 days BEFORE it actually activates (still PENDING, then flipped to
// ACTIVE on its real start date - see scheduler/services/subscriptionAutoRenewal.js) - createdAt alone
// would then anchor too early and leak those pre-activation days' usage into the new cycle. Taking
// whichever of the two is later handles both: same-day switches use the precise createdAt, and
// pre-created renewals defer to the real (if midnight-truncated) subscriptionStartDate instead.
// Peko Free is the free/basic tier (no subscriptionPaymentRefId) and, same as having no active plan
// at all, defaults to a plain calendar month - but if a paid plan expired into it this month, the
// window starts the day after that expiry instead of the 1st, so downgrading also gets an immediate
// reset rather than waiting for month-end. Anchored to the expired paid plan's own subscriptionEndDate
// (via findMostRecentExpiredPaidGroupSubscription) rather than any date on the Peko Free row itself,
// since a downgrade reactivates that same dormant row through a raw SQL UPDATE
// (scheduler/services/subscriptionAutoRenewal.js) that never stamps a timestamp on it - subscriptionEndDate
// is set once at the paid plan's own creation and is the best available proxy for "when did this
// corporate land back on Peko Free". Note this is day-level precision only (subscriptionEndDate is
// itself endOf("day")-truncated) - it excludes activity from earlier calendar days this month, but
// can't distinguish same-day activity the way the paid-plan branch's createdAt anchor above does.
// This is intentionally independent of the add-on expiry rule (which follows the corporate's actual
// plan cycle via computeAddonEndDate in paymentGateway/utils/subscriptionPricing.js) - the two are
// different mechanisms by design.
exports.getVerificationUsagePeriod = async ({ corporateUserId } = {}) => {
  const paidPlan = await findActivePaidGroupSubscription({ corporateId: corporateUserId });
  if (paidPlan && (paidPlan.createdAt || paidPlan.subscriptionStartDate)) {
    const createdAt = moment(paidPlan.createdAt);
    const startDate = moment(paidPlan.subscriptionStartDate);
    const planStart = createdAt.isValid() && (!startDate.isValid() || createdAt.isAfter(startDate))
      ? createdAt
      : startDate;
    if (planStart.isValid()) {
      const daysSincePlanStart = Math.max(moment().diff(planStart, 'days'), 0);
      const cycleStart = moment(planStart).add(Math.floor(daysSincePlanStart / 30) * 30, 'days');
      return { from: cycleStart.toDate(), to: moment(cycleStart).add(30, 'days').toDate() };
    }
  }

  // Peko Free, or no active plan at all.
  let from = moment().startOf('month');
  const lastPaidPlan = await findMostRecentExpiredPaidGroupSubscription({ corporateId: corporateUserId });
  if (lastPaidPlan && lastPaidPlan.subscriptionEndDate) {
    const switchDate = moment(lastPaidPlan.subscriptionEndDate).add(1, 'day').startOf('day');
    if (switchDate.isAfter(from)) from = switchDate;
  }
  return { from: from.toDate(), to: moment().endOf('month').toDate() };
};

// Single source of truth for both the /count read endpoint and the quota gate in each verify function -
// count resets every 30 days from the corporate's current PAID plan start (or every calendar month on
// Peko Free / no plan - see getVerificationUsagePeriod), freeLimit can rise/fall as add-ons are
// bought/expire, exhausted drives whether a verify call is allowed to proceed at all.
exports.getVerificationUsageStatus = async ({ credentialId, corporateUserId, packageId }) => {
  const { from, to } = await exports.getVerificationUsagePeriod({ corporateUserId });
  const [countDetails, pricing] = await Promise.all([
    countVerificationRecordsThisMonth({ corporateUserId, packageId, from, to }),
    exports.getVerificationServicePricing({ credentialId, corporateUserId, packageId }),
  ]);

  const freeLimit = pricing.maxLimit;
  const remaining = Math.max(freeLimit - countDetails.count, 0);
  const exhausted = countDetails.count >= freeLimit;
  const usedLimit = Math.min(countDetails.count, freeLimit);

  return {
    ...countDetails,
    freeLimit,
    usedLimit,
    remaining,
    exhausted,
    resetsAt: to,
    addonExpiresAt: pricing.addonExpiresAt,
  };
};
