const { customLog } = require("../utils/loggerHelper");
const { findExistingSubscriptionWB } = require("../controllers/corporate/whatsAppForBusiness");
const { findOne } = require("../models/use-cases/package");
const { applyCommissionMarkup } = require("../utils/applyCommissionMarkup");
const { computeUpgradeCredit } = require("../utils/upgradeCredit");
const { getBotBuilderValues, getShopifyIntegrationValues } = require("../models/use-cases/setting");
const { findActiveSubscriptionByCredentialId, findActiveBotBuilderByCredentialId, findActiveShopifyIntegrationByCredentialId } = require("../models/use-cases/whatsappforBusiness");

const validateWhatsappForBusiness = async ({body, credentialId}) => {
  try {
    let calculatedAmount = 0;
    let calculatedPgAmount = 0;
    let botBuilderAmount = 0;
    let shopifyIntegrationAmount = 0;

    if (body.isSubscription) {
      const { packageId, botBuilder, shopifyIntegration } = body;
      const subscriptionDuration = body.subscriptionDuration?.toLowerCase();
      const subscriptionPackageDetails = await findOne({
        id: packageId,
      });
      if (!subscriptionPackageDetails) {
        return { status: false, message: "Invalid package selected" };
      }
      await applyCommissionMarkup(subscriptionPackageDetails, `packagePrices.${subscriptionDuration}`, credentialId);
      if (botBuilder) {
        const botBuilderDetails = await getBotBuilderValues(credentialId);
        const botBuilderMonthly = botBuilderDetails?.details?.amount
          ? Number(botBuilderDetails?.details?.amount)
          : 0;
        if (subscriptionDuration === "annually") {
          botBuilderAmount = botBuilderMonthly * 12;
        } else {
          botBuilderAmount = botBuilderMonthly;
        }
      }
      if (shopifyIntegration) {
        const shopifyIntegrationDetails = await getShopifyIntegrationValues(credentialId);
        const shopifyIntegrationMonthly = shopifyIntegrationDetails?.details?.amount
          ? Number(shopifyIntegrationDetails?.details?.amount)
          : 0;
        if (subscriptionDuration === "annually") {
          shopifyIntegrationAmount = shopifyIntegrationMonthly * 12;
        } else {
          shopifyIntegrationAmount = shopifyIntegrationMonthly;
        }
      }
      if (body.isUpgrade) {
        const packagePrices = subscriptionPackageDetails?.packagePrices || {};
        const discountDetails = subscriptionPackageDetails?.discount || {};
        const packagePrice =
          Number(packagePrices[subscriptionDuration] || 0) || 0;
        const discount =
          Number(discountDetails[subscriptionDuration] || 0) || 0;
        const priceAfterDiscount = packagePrice - discount;
        const activeSubscriptions =
          await findActiveSubscriptionByCredentialId(credentialId);
        const activeAddOns = await findActiveBotBuilderByCredentialId(
          credentialId
        );
        const activeShopifyAddOn = await findActiveShopifyIntegrationByCredentialId(
          credentialId
        );
        const subscriptionDiscountPrice = computeUpgradeCredit(activeSubscriptions);
        const addOndiscountPrice = computeUpgradeCredit(activeAddOns);
        const shopifyAddOndiscountPrice = computeUpgradeCredit(activeShopifyAddOn);
        const payableBeforeFee =
          priceAfterDiscount -
          subscriptionDiscountPrice +
          (botBuilderAmount - addOndiscountPrice) +
          (shopifyIntegrationAmount - shopifyAddOndiscountPrice);
        calculatedAmount = Number(payableBeforeFee.toFixed(2));
        calculatedPgAmount = payableBeforeFee.toFixed(2);
      } else {
        const packagePrices = subscriptionPackageDetails?.packagePrices || {};
        const discountDetails = subscriptionPackageDetails?.discount || {};
        const packagePrice =
          Number(packagePrices[subscriptionDuration] || 0) || 0;
        const discount =
          Number(discountDetails[subscriptionDuration] || 0) || 0;
        const priceAfterDiscount = packagePrice - discount;
        const payableBeforeFee = priceAfterDiscount + botBuilderAmount + shopifyIntegrationAmount;
        calculatedAmount = Number(payableBeforeFee.toFixed(2));
        calculatedPgAmount = payableBeforeFee.toFixed(2);
      }
    } else if (body.isAddOns) {
      const { project_id, addOnType: rawAddOnType } = body;
      // Back-compat: existing callers (FE not yet sending addOnType) purchase Bot Builder.
      const addOnType = rawAddOnType === 'SHOPIFY_INTEGRATION' ? 'SHOPIFY_INTEGRATION' : 'BOT_BUILDER';
      const subscriptionDetails = await findExistingSubscriptionWB(
        credentialId,
        project_id
      );
      if (!subscriptionDetails) {
        return { status: false, message: "No active subscription found to add add-ons" };
      }
      const { billingType } = subscriptionDetails;
      // The setting use-cases return the row itself (not { data }) — destructuring `data` left the
      // price at 0, so every add-on purchase on an existing plan failed with "Amount mismatch".
      const addOnDetails = addOnType === 'SHOPIFY_INTEGRATION'
        ? await getShopifyIntegrationValues(credentialId)
        : await getBotBuilderValues(credentialId);
      const addOnMonthly = addOnDetails?.details?.amount
        ? Number(addOnDetails?.details?.amount)
        : 0;
      let addOnAmount;
      if (billingType === "ANNUALLY") {
        addOnAmount = addOnMonthly * 12;
      } else {
        addOnAmount = addOnMonthly;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { subscriptionEndDate } = subscriptionDetails;
      const subscriptionEnd = new Date(subscriptionEndDate);
      subscriptionEnd.setHours(0, 0, 0, 0);
      if (today > subscriptionEnd) {
        return { status: false, message: "No active subscription found to add add-ons" };
      }
      const diffInTime = subscriptionEnd.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));
      const dailyRate = billingType === "ANNUALLY"
        ? Number(addOnAmount || 0) / 365
        : Number(addOnAmount || 0) / 30;
      const addOnCost = daysLeft * dailyRate;
      calculatedAmount = Number(Number(addOnCost || 0).toFixed(2));
      calculatedPgAmount = calculatedAmount;
    } else {
      return { status: true, amount: Number(body.amount), pgAmount: Number(body.amount) };
    }
    calculatedPgAmount = Number(calculatedPgAmount);

    return {
        status: true,
        amount: calculatedAmount,
        pgAmount: Number(calculatedPgAmount.toFixed(2)),
        botBuilder: botBuilderAmount,
        shopifyIntegration: shopifyIntegrationAmount,
    };
  } catch (error) {
    console.log(error);
    customLog(null, "error", {
      error,
      message: "something went wrong wile validating giftcard",
    });
    return { status: false, message: "something went wrong" };
  }
};

module.exports = validateWhatsappForBusiness;
