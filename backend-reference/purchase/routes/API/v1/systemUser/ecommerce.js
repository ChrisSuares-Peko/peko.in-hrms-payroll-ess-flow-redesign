const express = require('express')
const router = express.Router()

const { fetchEcommerceOrdersByStatus, findLatestOrder } = require('../../../../controllers/admin/ecomDashboard')
const { findAllOrders, fetchProductVendors, updateOrder, ordersPDF, ordersExcelCSV, findAllOndcOrders, findAllOndcOrdersVendors, ondcOrdersPDF, ondcOrdersExcelCSV, getOndcOrderByIdAdmin } = require('../../../../controllers/admin/ecomOrders')
const { findCancelAndRefunds, getOtp, getBank, cancelUpdateOrder, cancelAndRefundsPDF, cancelAndRefundsExcelCSV, refundOndcOrderById } = require('../../../../controllers/admin/ecomCancelAndRefunds')
const { validateUpdateOrder, validateFetchVendors, validateReturnAndRefund, validateCancelAndRefund, validateOndcRefund } = require('../../../../utils/apiValidation')
const { findReturnAndRefunds, returnUpdateOrder, getBankOnReturn, getOtpOnReturn, returnAndRefundsPDF, returnAndRefundsExcelCSV } = require('../../../../controllers/admin/ecomReturnAndRefund')
const { findAllOrdersValidation, findCancelAndRefundsValidation, findReturnAndRefundsValidation } = require('../../../../utils/queryValidation')
const {
  findAllIssues,
  getOpenIssuesCount,
  issuesPDF,
  issuesExcelCSV,
  getIssueByIdAdmin,
  respondToIssueAdmin,
} = require('../../../../controllers/admin/ecomIssues')
const {
  findAllOndcProducts,
  getOndcProductFilters,
  getOndcProductByIdAdmin,
  updateOndcProductVisibility,
  ondcProductsExcelCSV,
  ondcProductsPDF,
  findAllOndcEasySplitSellersAdmin,
  findAllOndcSellerNpsAdmin,
  updateOndcSellerNpEnabled,
} = require('../../../../controllers/admin/ecomProducts')
const {
  getOndcCategoriesTree,
  getOndcCategoryOptions,
  createOndcCategory,
  updateOndcCategory,
  deleteOndcCategory,
  updateOndcCategoryEnabled,
} = require('../../../../controllers/admin/ecomCategories')
const {
  getCatalogRulesSummary,
  getCatalogRuleHistory,
  getRuleDomains,
  previewRuleDomains,
  updateRuleDomains,
  getBlockedSellers,
  getBlockSellerOptions,
  previewBlockSeller,
  blockSeller,
  unblockSeller,
  getBannedKeywords,
  previewBannedKeywords,
  addBannedKeywords,
  removeBannedKeyword,
  getTopDealsRules,
  updateTopDealsRules,
} = require('../../../../controllers/admin/ecomCatalogRules')
const {
  getSellerCategories,
  getSellerCategory,
  getSellerCategoryProducts,
  getSellerCategoryHistory,
  decideSellerCategory,
  markSellerCategoriesReviewed,
  setSellerCategoryProductsVisibility,
  setProductPekoCategory,
  setProductListingPosition,
} = require('../../../../controllers/admin/ecomSellerCategories')


//DASHBOARD
router.get('/dashboard/counters', fetchEcommerceOrdersByStatus)
router.get('/dashboard/orders', findLatestOrder)

//ORDERS
router.get('/orders', findAllOrdersValidation, findAllOrders)
router.get('/orders/pdf', findAllOrdersValidation, ordersPDF)
router.get('/orders/:type', findAllOrdersValidation, ordersExcelCSV)
router.post('/orders/vendors',validateFetchVendors, fetchProductVendors)
router.put('/orders',validateUpdateOrder, updateOrder);

//CANCELL
router.get('/cancelAndRefund/orders',findCancelAndRefundsValidation, findCancelAndRefunds);
router.get('/cancelAndRefund/orders/pdf',findCancelAndRefundsValidation, cancelAndRefundsPDF);
router.get('/cancelAndRefund/orders/:type',findCancelAndRefundsValidation, cancelAndRefundsExcelCSV);
router.get('/cancelAndRefund/vendors', fetchProductVendors);
router.put('/cancelAndRefund',validateCancelAndRefund, cancelUpdateOrder);
router.get('/cancelAndRefund/get-otp', getOtp);
router.get('/cancelAndRefund/get-bank', getBank);

//RETURN
router.get('/returnAndRefund/orders',findReturnAndRefundsValidation, findReturnAndRefunds);
router.get('/returnAndRefund/orders/pdf',findReturnAndRefundsValidation, returnAndRefundsPDF);
router.get('/returnAndRefund/orders/:type',findReturnAndRefundsValidation, returnAndRefundsExcelCSV);
router.get('/returnAndRefund/get-otp', getOtpOnReturn)
router.get('/returnAndRefund/get-bank', getBankOnReturn)
router.put('/returnAndRefund',validateReturnAndRefund, returnUpdateOrder);

//ONDC ORDERS (All-orders tab)
router.get('/ondc/orders/vendors', findAllOndcOrdersVendors)
router.get('/ondc/orders/pdf', ondcOrdersPDF)
router.get('/ondc/orders/:type(csv|excel)', ondcOrdersExcelCSV)
router.get('/ondc/orders/:id(\\d+)', getOndcOrderByIdAdmin)
// Buyer refund on a delivered order, while its return window is open. Unlike
// /cancelAndRefund and /returnAndRefund (seller notification only), this moves money.
// OTP comes from the existing /cancelAndRefund/get-otp endpoint.
router.put('/ondc/orders/:id(\\d+)/refund', validateOndcRefund, refundOndcOrderById)
router.get('/ondc/orders', findAllOndcOrders)

//ISSUES
router.get('/issues', findAllIssues)
router.get('/issues/open-count', getOpenIssuesCount)
router.get('/issues/pdf', issuesPDF)
router.get('/issues/:type(csv|excel)', issuesExcelCSV)
router.get('/issues/:id', getIssueByIdAdmin)
router.post('/issues/:id/respond', respondToIssueAdmin)

//ONDC PRODUCTS (Manage > Products catalog)
router.get('/ondc/products/filters', getOndcProductFilters)
router.get('/ondc/products/pdf', ondcProductsPDF)
router.get('/ondc/products/:type(csv|excel)', ondcProductsExcelCSV)
router.get('/ondc/products/:id(\\d+)', getOndcProductByIdAdmin)
router.get('/ondc/products', findAllOndcProducts)
router.patch('/ondc/products/:id/visibility', updateOndcProductVisibility)

//ONDC EASY SPLIT VENDORS (Manage > Products > Vendors tab)
router.get('/ondc/sellers', findAllOndcEasySplitSellersAdmin)

//ONDC SELLER NPS (Manage > Products > Seller NPs tab)
router.get('/ondc/seller-nps', findAllOndcSellerNpsAdmin)
router.patch('/ondc/seller-nps/:id(\\d+)/enabled', updateOndcSellerNpEnabled)

//ONDC CATEGORIES (Manage > Products > Categories tab)
router.get('/ondc/categories', getOndcCategoriesTree)
router.get('/ondc/categories/ondc-options', getOndcCategoryOptions)
router.post('/ondc/categories', createOndcCategory)
router.put('/ondc/categories/:id(\\d+)', updateOndcCategory)
router.delete('/ondc/categories/:id(\\d+)', deleteOndcCategory)
router.patch('/ondc/categories/:id(\\d+)/enabled', updateOndcCategoryEnabled)

//ONDC CATALOG RULES (Manage > Products > Rules tab)
router.get('/ondc/rules/summary', getCatalogRulesSummary)
router.get('/ondc/rules/history', getCatalogRuleHistory)
router.get('/ondc/rules/domains', getRuleDomains)
router.post('/ondc/rules/domains/preview', previewRuleDomains)
router.put('/ondc/rules/domains', updateRuleDomains)
router.get('/ondc/rules/blocked-sellers', getBlockedSellers)
router.get('/ondc/rules/seller-options', getBlockSellerOptions)
router.post('/ondc/rules/blocked-sellers/preview', previewBlockSeller)
router.post('/ondc/rules/blocked-sellers', blockSeller)
router.delete('/ondc/rules/blocked-sellers/:id', unblockSeller)
router.get('/ondc/rules/keywords', getBannedKeywords)
router.post('/ondc/rules/keywords/preview', previewBannedKeywords)
router.post('/ondc/rules/keywords', addBannedKeywords)
router.delete('/ondc/rules/keywords/:id', removeBannedKeyword)
router.get('/ondc/rules/top-deals', getTopDealsRules)
router.put('/ondc/rules/top-deals', updateTopDealsRules)

//ONDC SELLER CATEGORIES (Manage > Products > Review tab)
router.get('/ondc/seller-categories', getSellerCategories)
router.post('/ondc/seller-categories/mark-reviewed', markSellerCategoriesReviewed)
router.get('/ondc/seller-categories/:id', getSellerCategory)
router.get('/ondc/seller-categories/:id/products', getSellerCategoryProducts)
router.get('/ondc/seller-categories/:id/history', getSellerCategoryHistory)
router.put('/ondc/seller-categories/:id/decision', decideSellerCategory)
router.post('/ondc/seller-categories/:id/products/visibility', setSellerCategoryProductsVisibility)
router.patch('/ondc/products/:id/category', setProductPekoCategory)
router.patch('/ondc/products/:id/position', setProductListingPosition)

module.exports = router