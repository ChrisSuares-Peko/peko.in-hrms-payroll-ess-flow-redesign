const { findOnePackage } = require("../models/use-cases/packages");
const { findAllActiveSubscriptions } = require("../models/use-cases/subscription");
const { findOne: findOneCashback } = require("../models/use-cases/cashback");
const { findServiceOperatorByAccessKey, calculateSurcharge, calculateAmountWithTax } = require("./checkAndFetchServiceDetails");
const operatorsData = require("./operatorsData.json");

const WHATSAPP_ACCESS_KEY = operatorsData["whatsAppForBusiness"]["accessKey"];

const parseJson = value => (typeof value === "string" ? JSON.parse(value) : value);

// Plan part of a WhatsApp renewal, same as scheduler/services/whatsAppTriggerSubscriptionCharges.js:
// plan price - discount, plus the platform fee on that. Add-ons are added by the caller. Null when the plan has no price.
const computeWhatsAppRenewalBase = async sub => {
    const pkg = await findOnePackage(sub.packageId);
    const packagePrices = parseJson(pkg?.packagePrices);
    const packageDiscount = parseJson(pkg?.discount);
    const isAnnual = sub.billingType === "ANNUALLY";
    const listPrice = parseFloat((isAnnual ? packagePrices?.annually : packagePrices?.monthly) || 0) || 0;
    if (!listPrice) return null;
    const discountAmount = parseFloat((isAnnual ? packageDiscount?.annually : packageDiscount?.monthly) || 0) || 0;
    const basePrice = Math.max(0, listPrice - discountAmount);

    const waOperator = await findServiceOperatorByAccessKey(WHATSAPP_ACCESS_KEY);
    const activeSubscriptions = (await findAllActiveSubscriptions({ corporateUserId: sub.corporateUserId })) || [];
    const cashback = waOperator
        ? await findOneCashback({ packageIds: activeSubscriptions.map(s => s.packageId), serviceOperatorId: waOperator.id })
        : null;
    const surchargeWithoutTax = await calculateSurcharge(cashback?.surcharge || 0, cashback?.surchargeType, basePrice, sub.credentialId);
    const surcharge = parseFloat(await calculateAmountWithTax(surchargeWithoutTax));
    return parseFloat((basePrice + surcharge).toFixed(2));
};

module.exports = { computeWhatsAppRenewalBase };
