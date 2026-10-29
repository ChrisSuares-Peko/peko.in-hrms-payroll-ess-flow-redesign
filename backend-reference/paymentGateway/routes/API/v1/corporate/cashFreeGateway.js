const express = require("express");
const router = express.Router();
const {
  handlePGCallback,
  createOrder,
  createSubscriptionOrder,
  createAddonPaymentOrder,
  getSubscriptionPricing,
  getAddonPricing,
  simulateSubscriptionChargeForTest,
} = require("../../../../controllers/corporate/cashFreeGateway");
const { getPhysicalCardPricing } = require("../../../../controllers/corporate/corporateCards");
const validateAmount = require("../../../../middlewares/validateAmount");
const { checkServiceEnabled } = require("../../../../middlewares/disableServiceCheck");
const operatorsData = require("../../../../utils/operatorsData.json");
const accessKey = operatorsData["cashFreePaymentGateway"]["accessKey"];
const subscriptionAccessKey = operatorsData["cashFreeSubscriptions"]["accessKey"];

router.post("/create-order", checkServiceEnabled(accessKey), validateAmount, createOrder);
router.post("/complete", handlePGCallback);
router.post("/create-subscription-order", checkServiceEnabled(subscriptionAccessKey), validateAmount, createSubscriptionOrder);
router.post("/create-addon-order", checkServiceEnabled(accessKey), createAddonPaymentOrder);
router.get("/subscription-pricing", getSubscriptionPricing);
router.get("/addon-pricing", getAddonPricing);
router.get("/physical-card-pricing", getPhysicalCardPricing);
// SANDBOX/TEST-ONLY: simulate Cashfree CHARGE webhook delivery for a single paymentId.
router.put("/test/simulate-charge/:paymentId", simulateSubscriptionChargeForTest);
module.exports = router;
