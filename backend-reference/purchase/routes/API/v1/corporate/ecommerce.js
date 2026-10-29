const express = require('express')
const router = express.Router({mergeParams:true});

const { payment, fetchAllPhotos,
 fetchProductsById, cancelOrder,
  downloadOrderInvoice, returnOrder, fetchOrderDetails, findAllTransactionsAndCount,
  getOtpCancel
} = require('../../../../controllers/corporate/ecommerce')
const {
  fetchAllCategories
} = require('../../../../controllers/corporate/categories')
const {
  findAllOndcOfficeSupplies,
  fetchOndcProductDetail,
  triggerOndcCitySearch,
  deleteOndcSearchCatalog,
  getOfficeSupplySections,
  getEcommerceCityList,
  getEcommerceSellers,
  lookupPostcode,
  addOndcProductToCart,
  getOndcCartDetails,
  updateOndcCartProduct,
  deleteOndcCartProduct,
  refreshOndcProductDetail,
  validateOndcCart,
  getOndcDeliveryEstimate,
  initOndcOrder,
  confirmOndcOrder,
  getOndcCheckoutResult,
  getOndcOrderHistory,
  getOndcOrderById,
  refreshOndcOrderStatus,
  refreshOndcOrderTracking,
  cancelOndcOrder,
  returnOndcOrder,
  getOndcDomains,
  getOndcOfficeSupplyCategories,
  getOndcOrderIssues,
  raiseOndcIssue,
  respondToOndcIssue,
  rejectOndcIssue,
  escalateOndcIssue,
  acceptOndcIssue,
  closeOndcIssue,
  getEcommerceAddresses,
  saveEcommerceAddress,
} = require('../../../../controllers/corporate/ondcEcommerce')
const {
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  getAllProductsInCart,
} = require('../../../../controllers/corporate/cart')
const {
     validateAddToCart,
     validateEcommercePayment,
     validateReturnOrder,
     validateCancelOrder,
     validateFetchProductImage,
     validateRaiseOndcIssue,
     validateRespondToOndcIssue,
     validateSaveEcommerceAddress,
} = require('../../../../utils/apiValidation')
const {
     validateOndcProductListQuery,
     validateOndcSectionsQuery,
} = require('../../../../utils/queryValidation')

router.get('/categories', fetchAllCategories)
router.get('/products', validateOndcProductListQuery, findAllOndcOfficeSupplies)
router.get('/products/sections', validateOndcSectionsQuery, getOfficeSupplySections)
router.get('/cities', getEcommerceCityList)
router.get('/sellers', getEcommerceSellers)
router.get('/lookup-postcode', lookupPostcode)
router.post('/ondc/search', triggerOndcCitySearch)
router.delete('/ondc/search/catalog', deleteOndcSearchCatalog)
router.post('/addToCart',validateAddToCart, addProductToCart)
router.post('/addOndcToCart', validateAddToCart, addOndcProductToCart)
router.get('/ondc/cartDetails', getOndcCartDetails)
router.get('/ondc/addressDetails', getEcommerceAddresses)
router.post('/ondc/address', validateSaveEcommerceAddress, saveEcommerceAddress)
router.post('/ondc/validateCart', validateOndcCart)
router.post('/ondc/deliveryEstimate', getOndcDeliveryEstimate)
router.post('/ondc/initOrder', initOndcOrder)
router.post('/ondc/confirmOrder', confirmOndcOrder)
router.get('/ondc/checkout-result', getOndcCheckoutResult)
router.get('/ondc/orders', getOndcOrderHistory)
router.get('/ondc/orders/:id', getOndcOrderById)
router.post('/ondc/orders/:id/status', refreshOndcOrderStatus)
router.post('/ondc/orders/:id/track', refreshOndcOrderTracking)
router.post('/ondc/orders/:id/cancel', cancelOndcOrder)
router.post('/ondc/orders/:id/return', returnOndcOrder)
router.get('/ondc/orders/:id/issues', getOndcOrderIssues)
router.post('/ondc/orders/:id/issues', validateRaiseOndcIssue, raiseOndcIssue)
router.post('/ondc/orders/:id/issues/:issueId/respond', validateRespondToOndcIssue, respondToOndcIssue)
router.post('/ondc/orders/:id/issues/:issueId/reject', rejectOndcIssue)
router.post('/ondc/orders/:id/issues/:issueId/escalate', escalateOndcIssue)
router.post('/ondc/orders/:id/issues/:issueId/accept', acceptOndcIssue)
router.post('/ondc/orders/:id/issues/:issueId/close', closeOndcIssue)
router.get('/ondc/domains', getOndcDomains)
router.get('/ondc/categories', getOndcOfficeSupplyCategories)
router.put('/ondc/cart', updateOndcCartProduct)
router.delete('/ondc/cart', deleteOndcCartProduct)
router.get('/cartDetails', getAllProductsInCart)
router.delete('/', deleteProductFromCart)
router.put('/',validateAddToCart, updateProductInCart)
router.post('/payment',validateEcommercePayment, payment)

router.get('/fetchAllPhotos/', fetchAllPhotos)
router.get('/latestTransactions', findAllTransactionsAndCount)
router.post('/fetchProductImage',validateFetchProductImage, fetchProductsById)
router.post('/cancelOrder?',validateCancelOrder, cancelOrder)
router.get('/cancelOrder/get-otp', getOtpCancel);
router.get('/download-invoice/:id', downloadOrderInvoice)
router.post('/returnOrder?', validateReturnOrder,returnOrder)
router.get('/product/details', fetchOndcProductDetail)
router.get('/product/details/live', refreshOndcProductDetail)
router.get('/orderDetails/:id', fetchOrderDetails)



module.exports = router