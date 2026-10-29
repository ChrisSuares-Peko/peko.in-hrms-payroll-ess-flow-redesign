'use strict';

const Sequelize = require('sequelize');
const sequelizeConfig = require('../configs/database/index');
const { calculateSurcharge } = require('./checkAndFetchServiceDetails');
const { applyCommissionMarkup } = require('./applyCommissionMarkup');
const operatorsData = require('./operatorsData.json');

const WHATSAPP_ACCESS_KEY = operatorsData['whatsAppForBusiness']['accessKey'];
const ADD_ON_SETTING_NAMES = Object.freeze({
  BOT_BUILDER: 'flowBuilder',
  SHOPIFY_INTEGRATION: 'shopifyIntegration',
});

const parseJson = (value) => (typeof value === 'string' ? JSON.parse(value) : value);

// Keep in sync with scheduler/utils/whatsappRenewalCharge.js (the actual renewal charge) — services
// can't cross-import.
// Renewal charge for a WhatsApp base subscription, priced fresh every cycle like a new purchase
// (no coupon carried forward):
//   plan     = current package price (with the commission markup, as shown to the customer) - current package discount
//   surcharge = platform fee on plan + add-ons (same cashback row and basis as at purchase)
//   add-ons  = current setting price of each active, non-cancelled add-on (x12 for annual)
// Returns null when the package has no price, so the caller can skip instead of under-charging.
exports.computeWhatsAppRenewalCharge = async ({ packageId, billingType, corporateUserId, credentialId }) => {
  const [pkg] = await sequelizeConfig.query(
    `SELECT packagePrices, discount, commissionMode, commissionType, commission, fixedCommissionPerTransaction,
            isCommissionInclGST, planCommissions FROM packages WHERE id = :packageId LIMIT 1`,
    { replacements: { packageId }, type: Sequelize.QueryTypes.SELECT }
  );
  const packagePrices = parseJson(pkg?.packagePrices);
  const markedUpPackage = { ...pkg, packagePrices: { ...packagePrices }, planCommissions: parseJson(pkg?.planCommissions) };
  const packageDiscount = parseJson(pkg?.discount);
  const isAnnual = billingType === 'ANNUALLY';
  const duration = isAnnual ? 'annually' : 'monthly';
  await applyCommissionMarkup(markedUpPackage, `packagePrices.${duration}`, credentialId);
  const listPrice = parseFloat(markedUpPackage.packagePrices[duration] || 0) || 0;
  if (!listPrice) return null;
  const discountAmount = parseFloat((isAnnual ? packageDiscount?.annually : packageDiscount?.monthly) || 0) || 0;
  const planAmount = Number(Math.max(0, listPrice - discountAmount).toFixed(2));

  // Platform fee: same lookup as fetchServiceDetails at purchase time — the WhatsApp operator's
  // cashback row for any of the corporate's active Peko plans.
  const [waOperator] = await sequelizeConfig.query(
    `SELECT id FROM serviceOperators WHERE accessKey = :accessKey LIMIT 1`,
    { replacements: { accessKey: WHATSAPP_ACCESS_KEY }, type: Sequelize.QueryTypes.SELECT }
  );
  let cashbackRow = null;
  if (waOperator?.id) {
    const activePlans = await sequelizeConfig.query(
      `SELECT packageId FROM subscriptions WHERE corporateUserId = :corporateUserId AND status = 'ACTIVE'`,
      { replacements: { corporateUserId }, type: Sequelize.QueryTypes.SELECT }
    );
    const packageIds = activePlans.map((row) => row.packageId);
    if (packageIds.length) {
      [cashbackRow] = await sequelizeConfig.query(
        `SELECT surcharge, surchargeType FROM cashbacks
         WHERE packageId IN (:packageIds) AND serviceOperatorId = :serviceOperatorId AND serviceStatus = 1
         LIMIT 1`,
        { replacements: { packageIds, serviceOperatorId: waOperator.id }, type: Sequelize.QueryTypes.SELECT }
      );
    }
  }
  // Add-ons the customer keeps: ACTIVE and not cancelled (stopBotBuilder / stopShopifyIntegration
  // only set isCancelled, the row stays ACTIVE until the cycle ends). Legacy NULL addOnType = Bot Builder.
  const activeAddOnRows = await sequelizeConfig.query(
    `SELECT COALESCE(addOnType, 'BOT_BUILDER') AS addOnType, subscriptionPrice
     FROM whatsAppSubscriptions
     WHERE credentialId = :credentialId AND status = 'ACTIVE' AND isCustom = 1 AND isCancelled = 0
     ORDER BY id DESC`,
    { replacements: { credentialId }, type: Sequelize.QueryTypes.SELECT }
  );
  const addOns = [];
  if (activeAddOnRows.length) {
    const settingRows = await sequelizeConfig.query(
      `SELECT name, details FROM settings WHERE name IN (:names)`,
      { replacements: { names: Object.values(ADD_ON_SETTING_NAMES) }, type: Sequelize.QueryTypes.SELECT }
    );
    // The add-on price carries the commission markup, like the price the customer is shown.
    const monthlyPriceBySetting = Object.fromEntries(
      await Promise.all(settingRows.map(async (row) => {
        const details = parseJson(row.details);
        await applyCommissionMarkup(details, 'amount', credentialId);
        return [row.name, parseFloat(details?.amount || 0) || 0];
      }))
    );
    const seen = new Set();
    for (const { addOnType, subscriptionPrice } of activeAddOnRows) {
      if (seen.has(addOnType)) continue;
      seen.add(addOnType);
      const monthly = monthlyPriceBySetting[ADD_ON_SETTING_NAMES[addOnType]] || 0;
      // Setting price missing → fall back to the stored add-on price rather than silently dropping it
      const price = monthly ? (isAnnual ? Number((monthly * 12).toFixed(2)) : monthly) : (parseFloat(subscriptionPrice) || 0);
      if (price > 0) addOns.push({ addOnType, price, fromSetting: !!monthly });
    }
  }

  const addOnTotal = addOns.reduce((sum, addOn) => sum + addOn.price, 0);
  // No GST added on top: at purchase the fee goes through paymentGateway's calculateAmountWithTax,
  // which applies 0% (the configured fee is GST-inclusive — "Platform fee (inclusive of GST)" in the
  // FE). Using scheduler/services/GSTandTAXcalculation here would add 18% and over-charge renewals.
  const surcharge = await calculateSurcharge(cashbackRow?.surcharge || 0, cashbackRow?.surchargeType, planAmount + addOnTotal, credentialId) || 0;
  const amount = parseFloat((planAmount + surcharge + addOnTotal).toFixed(2));

  return { amount, listPrice, discountAmount, planAmount, surcharge, addOns };
};
