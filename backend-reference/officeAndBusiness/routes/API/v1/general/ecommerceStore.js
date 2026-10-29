const express = require("express");
const {
  getPublicSubscriptionPlans,
} = require("../../../../controllers/corporate/ecommerceStore");

const router = express.Router({ mergeParams: true });

router.get("/all-plans", getPublicSubscriptionPlans);

module.exports = router;
