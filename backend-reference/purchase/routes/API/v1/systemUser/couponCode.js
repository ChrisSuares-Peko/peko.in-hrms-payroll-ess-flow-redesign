const express = require("express");
const router = express.Router();


const { validateCouponCode, validateBulkCreateCouponCode } = require("../../../../utils/apiValidation");
const { createCouponCode, getAllCouponCodes, updateStatus, updateCoupon, couponCodePDF, couponCodeExcelCSV } = require("../../../../controllers/admin/couponCode");
const { getAllCouponCodesValidation } = require("../../../../utils/queryValidation");

router.get("/",getAllCouponCodesValidation, getAllCouponCodes)
router.post("/", validateBulkCreateCouponCode, createCouponCode);
router.put('/:id', validateCouponCode, updateCoupon)
router.patch('/:id', updateStatus)
router.get('/download/pdf',getAllCouponCodesValidation, couponCodePDF)
router.get('/download/:type',getAllCouponCodesValidation, couponCodeExcelCSV)

module.exports = router;