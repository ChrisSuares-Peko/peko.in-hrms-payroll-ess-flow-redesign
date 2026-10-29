const express = require("express");
const router = express.Router();

const { validateSubscriptionCoupon } = require("../../../../utils/apiValidation");
const { createSubscriptionCouponCode, getAllSubscriptionCouponCodes, updateStatus, bulkUpdateStatus, updateSubscriptionCoupon, deleteSubscriptionCouponCode, pekoCreditsPDF, pekoCreditsExcelCSV } = require("../../../../controllers/admin/pekoCredits");
const { getAllSubscriptionCouponCodesValidation, validatePekoCreditStatus } = require("../../../../utils/queryValidation");
const { checkPermission } = require("../../../../utils/checkPermission");
const { stagingOnly } = require("../../../../middlewares/stagingOnly");

router.get("/", getAllSubscriptionCouponCodesValidation, getAllSubscriptionCouponCodes)
router.post("/", validateSubscriptionCoupon, checkPermission('Peko Credits', 'write'), createSubscriptionCouponCode);
router.put('/:id', validateSubscriptionCoupon, checkPermission('Peko Credits', 'update'), updateSubscriptionCoupon)
// Keep above `/:id`, otherwise Express matches "bulk-status" as a coupon id.
router.patch('/bulk-status', stagingOnly, bulkUpdateStatus)
router.patch('/:id', validatePekoCreditStatus, checkPermission('Peko Credits', 'update'), updateStatus)
router.delete('/:id', checkPermission('Peko Credits', 'update'), deleteSubscriptionCouponCode)
router.get('/download/pdf', getAllSubscriptionCouponCodesValidation, pekoCreditsPDF)
router.get('/download/:type', getAllSubscriptionCouponCodesValidation, pekoCreditsExcelCSV)

module.exports = router;