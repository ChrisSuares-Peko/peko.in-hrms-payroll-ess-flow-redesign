const transaction = require('../entities/transaction');
const order = require('../entities/order');
const { findAllGroupSubscriptionsForCorporate } = require('./subscription');

const VERIFICATION_ADDON_CATEGORY = 'Verification Suite Addon';

exports.VERIFICATION_ADDON_CATEGORY = VERIFICATION_ADDON_CATEGORY;

// Expiry is plan-derived (computed once at purchase time in paymentGateway MS and stored as
// Result.expiresAt in orderResponse - see paymentGateway/controllers/corporate/verificationSuiteAddOn.js),
// not a fixed offset from the transaction date - so it can only be checked in JS, not filtered in SQL.
// A corporate can have several simultaneously-valid add-ons (bought under different plans, each with
// its own expiry) - nextExpiresAt is the soonest of them, i.e. the next date addonLimit will actually drop.
exports.sumVerificationAddonQuantity = async ({ credentialId }) => {
  const now = new Date();

  const rows = await transaction.findAll({
    where: {
      credentialId,
      transactionCategory: VERIFICATION_ADDON_CATEGORY,
      status: 'SUCCESS',
    },
    include: [{ model: order, attributes: ['orderResponse'] }],
    raw: true,
    nest: true,
  });

  return rows.reduce((acc, row) => {
    try {
      const parsed = JSON.parse(row.order?.orderResponse || '{}');
      const expiresAt = parsed?.Result?.expiresAt;
      if (!expiresAt || new Date(expiresAt) < now) {
        return acc;
      }
      const expiryDate = new Date(expiresAt);
      return {
        quantity: acc.quantity + (Number(parsed?.Result?.quantity) || 0),
        nextExpiresAt: !acc.nextExpiresAt || expiryDate < acc.nextExpiresAt ? expiryDate : acc.nextExpiresAt,
      };
    } catch (error) {
      return acc;
    }
  }, { quantity: 0, nextExpiresAt: null });
};

// Per-purchase history for the corporate's own "add-on history" card view - one entry per successful
// add-on purchase (not a plan grouping, since add-ons carry no packageId - see computeAddonEndDate in
// paymentGateway/utils/subscriptionPricing.js, which derives expiry from whatever plan cycle is active
// at purchase time, not a stored reference). amountCharged uses order.amountInINR (the full base+surcharge
// total, reliably populated on both the wallet-only and card/UPI purchase paths) rather than
// transaction.debitAmount (only the wallet-covered remainder on the PG path, can be 0) or
// orderResponse.amountCharged (excludes surcharge).
exports.findVerificationAddonHistoryAndCount = async ({ credentialId, corporateUserId, page = 1, itemsPerPage = 10, sort = 'DESC', sortField = 'createdAt' }) => {
  const now = new Date();

  const [{ rows, count }, planHistory] = await Promise.all([
    transaction.findAndCountAll({
      where: {
        credentialId,
        transactionCategory: VERIFICATION_ADDON_CATEGORY,
        status: 'SUCCESS',
      },
      include: [{ model: order, attributes: ['orderResponse', 'amountInINR'] }],
      order: [[sortField, sort]],
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
    }),
    findAllGroupSubscriptionsForCorporate({ corporateId: corporateUserId }),
  ]);

  // Add-ons carry no packageId of their own (see verificationSuiteAddOn.js) and are only ever
  // purchasable while on a paid plan, so the plan active at purchase time is recovered by matching
  // the purchase timestamp against the corporate's paid-subscription date ranges instead.
  const findPlanAt = (purchaseDate) => {
    const t = new Date(purchaseDate).getTime();
    return planHistory.find((p) =>
      p.subscriptionStartDate && p.subscriptionEndDate &&
      t >= new Date(p.subscriptionStartDate).getTime() &&
      t <= new Date(p.subscriptionEndDate).getTime()
    ) || null;
  };

  const records = rows.map((row) => {
    let quantity = 0;
    let unitPrice = 0;
    let expiresAt = null;
    try {
      const parsed = JSON.parse(row.order?.orderResponse || '{}');
      quantity = Number(parsed?.Result?.quantity) || 0;
      unitPrice = Number(parsed?.unitPrice) || 0;
      expiresAt = parsed?.Result?.expiresAt || null;
    } catch (error) {
      // leave defaults
    }

    const plan = findPlanAt(row.createdAt);

    return {
      corporateTxnId: row.corporateTxnId,
      purchaseDate: row.createdAt,
      quantity,
      unitPrice,
      amountCharged: Number(row.order?.amountInINR) || 0,
      expiresAt,
      status: expiresAt && new Date(expiresAt) > now ? 'Active' : 'Expired',
      plan: plan ? {
        packageName: plan.package?.packageName || null,
        amountPaid: Number(plan.subscriptionAmountPaid) || 0,
        status: plan.status,
        startedAt: plan.subscriptionStartDate,
        validUntil: plan.subscriptionEndDate,
      } : null,
    };
  });

  return { records, count };
};
