const express = require("express");
const router = express.Router();

const {
  listGroupPackages,
  listIndividualPackages,
  getPackageDetails,
  getIndividualDetails,
  getTableDetails,
  findTransactionDetails,
  cancelSubscription,
  getCurrentSubscription,
  getServiceAdditionalDetails,
  getServiceBasePurchaseHistory,
  getPurchaseHistoryAll,
  getLastUserGroupSubscription,
  cancelSubscriptionPlan,
  getActiveSubscriptionsForTest,
  shiftSubscriptionDatesForTest,
  shiftServiceSubscriptionDatesForTest,
  revertToBasicForTest,
  getLifecycleSettings,
} = require("../../../controllers/subscription");
const {
  updateDefaultCard,
} = require("../../../controllers/savedCards");
const { validatePackageDetailsQuery, validateIndividualDetailsQuery, validatePurchaseHistoryQuery, validateDownloadInvoice } = require("../../../utils/queryValidation");

router.get("/list-packages", listGroupPackages);

router.get("/list-individual-packages", listIndividualPackages);

router.get("/package-details", validatePackageDetailsQuery, getPackageDetails);

router.get("/individual-details", validateIndividualDetailsQuery, getIndividualDetails);

router.get('/check-expired-subscription', getLastUserGroupSubscription);

router.get("/list-table", getTableDetails);

router.get("/current-details", getCurrentSubscription);

router.get("/lifecycle-settings", getLifecycleSettings);

router.get("/purchse-history", validatePurchaseHistoryQuery, getPurchaseHistoryAll);

router.get("/downlaod-invoice/:subscriptionId",validateDownloadInvoice, findTransactionDetails);

router.patch("/cancel-subscription/:subscriptionId", cancelSubscription);
router.patch('/cancel-subscription-plan/:subscriptionId/:type', cancelSubscriptionPlan);

router.get("/add-ons", getServiceAdditionalDetails);

router.get("/history", getServiceBasePurchaseHistory);

router.patch("/change-default-card/:id", updateDefaultCard);

// TEST-ONLY routes — UAT date manipulation for scheduler testing
router.get("/test/active-subscriptions", getActiveSubscriptionsForTest);
router.patch("/test/shift-dates", shiftSubscriptionDatesForTest);
router.patch("/test/shift-service-subscription-dates", shiftServiceSubscriptionDatesForTest);
// Revert today's purchases and drop the user back to Peko Free (UAT re-test helper).
router.post("/test/revert-to-basic", revertToBasicForTest);

module.exports = router;
