const express = require("express");
const { checkActivationCode, activateSubscription } = require("../../../../controllers/corporate/subscription");
const { validateActivationCode } = require("../../../../utils/apiValidation");
const { getAllCouponCodes } = require("../../../../controllers/corporate/couponCode");
const router = express.Router();

// discount coupon
router.get("/all-coupon-codes", getAllCouponCodes);
// voucher code
router.post("/validate-code", validateActivationCode, checkActivationCode);
router.post("/apply-code", validateActivationCode, activateSubscription);


module.exports = router;