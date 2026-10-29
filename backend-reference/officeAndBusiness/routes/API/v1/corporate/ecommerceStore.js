const express = require("express");
const {
  findPlan,
  getSubscriptionPlans,
  cancelServiceSubscription,
  setupTenant,
  getTenantStats,
} = require("../../../../controllers/corporate/ecommerceStore");
const router = express.Router({ mergeParams: true });

router.get("/all-plans", getSubscriptionPlans);
router.get("/plan", findPlan);
router.patch("/cancel-subscription/:subscriptionId", cancelServiceSubscription);
router.post("/tenant", setupTenant);
router.get("/tenant/stats", getTenantStats);

module.exports = router;
