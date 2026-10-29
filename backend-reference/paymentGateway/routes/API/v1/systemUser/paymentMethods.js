const express = require("express");
const router = express.Router({ mergeParams: true });

const { fetchAllAvailablePgMethodsAdmin, updatePgMethodsAdmin, createPaymentMethod, editPaymentMethod, updatePaymentMethodStatus, getAllPaymentMethods, getPaymentGateways } = require("../../../../controllers/admin/paymentMethods");
const {
  getAllPaymentMethodsValidation,
  updatePaymentMethodStatusValidation,
  createPaymentMethodValidation,
  editPaymentMethodValidation,
  updatePgMethodsValidation,
} = require("../../../../utils/queryValidation");

// service base add,edit and find //add validations
router.post("/create", createPaymentMethodValidation, createPaymentMethod);
router.put("/edit/:paymentMethodId", editPaymentMethodValidation, editPaymentMethod);
router.put("/status/:paymentMethodId", updatePaymentMethodStatusValidation, updatePaymentMethodStatus);
router.get("/find", getAllPaymentMethods);
router.get("/gateways", getPaymentGateways);

// for all users edit and find
router.get("/", getAllPaymentMethodsValidation, fetchAllAvailablePgMethodsAdmin);
router.put("/update", updatePgMethodsValidation, updatePgMethodsAdmin);

module.exports = router;
