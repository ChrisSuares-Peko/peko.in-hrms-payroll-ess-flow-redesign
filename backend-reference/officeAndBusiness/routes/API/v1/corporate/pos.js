const express = require("express");
const {
  findPlan,
  getSubscriptionPlans,
  getDashboard,
} = require("../../../../controllers/corporate/pos");
const router = express.Router({ mergeParams: true });

router.get("/all-plans", getSubscriptionPlans);
router.get("/plan", findPlan);
router.get("/dashboard", getDashboard);

module.exports = router;
