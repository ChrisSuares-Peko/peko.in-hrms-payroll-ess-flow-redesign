const express = require('express')
const router = express.Router({ mergeParams: true })
const { findAllDetails, findAllAlerts, findAllTransactions, dashboard, searchServices, storeHistory, fetchSearchHistory /*, updateSettings */ } = require('../../../../controllers/corporate/dashboard');
const { findAllBanners } = require('../../../../controllers/corporate/banner');
const { validateTransactionsChartQuery, validateBannerQuery, validateSearchQuery } = require('../../../../utils/queryValidation');

router.get('/total', findAllDetails);//✅
router.get('/alerts', findAllAlerts);//✅
router.get(
  "/chart",
  validateTransactionsChartQuery,
  findAllTransactions
);
router.get(
  "/banners",
  validateBannerQuery,
  findAllBanners
);
router.get('/details', dashboard)
router.get("/search", validateSearchQuery(false), searchServices);
router.get("/store-history", validateSearchQuery(true), storeHistory);
router.get('/recent-history', fetchSearchHistory);
// F-OTH-21: moved to the system-user tree, admin-only — this updates a platform-wide,
// non-tenant-scoped setting, which no individual corporate should be able to touch.
// See routes/API/v1/systemUser/dashboard.js.
// router.put('/update', updateSettings);

module.exports = router