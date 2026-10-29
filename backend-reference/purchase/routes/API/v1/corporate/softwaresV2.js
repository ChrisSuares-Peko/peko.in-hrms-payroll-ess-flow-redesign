const express = require("express");
const router = express.Router();

const {
  searchProducts,
  fetchAllParentCategories,
  fetchAllProductsBasedOnParentCategory,
  fetchProductDetails,
  fetchCategoryQuestions,
  submitAnswers,
  fetchRecommandations,
  fetchPopularProducts,
  payment,
  fetchGeneralQuestions,
  purchaseAssistance,
  fetchOrderDetails,
  cancelPlan,
  fetchOneOrder,
  fetchAllRfpCategories,
} = require("../../../../controllers/corporate/softwaresV2");
const {
  validateSearchRequest,
  validateCategories,
  validateProduct,
  validateCategoryForQuestion,
  validateSoftwaresPayment,
  validatePurchaseAssistance,
  validateRfpSubmission,
} = require("../../../../utils/apiValidations/softwaresV2");


router.get("/search", validateSearchRequest, searchProducts);
router.get("/categories", fetchAllParentCategories);
router.get("/products/popular", fetchPopularProducts);
router.get("/categories/products/:parentCategory", validateCategories, fetchAllProductsBasedOnParentCategory,);
router.get("/rfp-categories", fetchAllRfpCategories);
router.get("/questions/general", fetchGeneralQuestions);
router.get("/questions/:parentCategory", validateCategoryForQuestion, fetchCategoryQuestions);
router.post("/answers", validateRfpSubmission, submitAnswers);
router.get("/recommandations/:toolkitId", fetchRecommandations);
router.get("/product/details/:productUrl", validateProduct, fetchProductDetails);
router.get("/purchaseAssistance/:productUrl", validatePurchaseAssistance, purchaseAssistance);
router.get("/categories/products/:parentCategory", validateCategories, fetchAllProductsBasedOnParentCategory);
router.get("/product/details/:productUrl", validateProduct, fetchProductDetails);
router.get("/purchaseAssistance/:productUrl", validatePurchaseAssistance, purchaseAssistance);
router.post("/payment", validateSoftwaresPayment, payment);
router.get("/orderDetails", fetchOrderDetails);
router.get("/orderDetails/:orderId", fetchOneOrder);
router.post("/cancelPlan", cancelPlan);

module.exports = router;
