const express = require("express");
const router = express.Router({ mergeParams: true });
const { createOrder, completePayment } = require("../../../../controllers/corporate/razorpayGateway");
const validateAmount = require("../../../../middlewares/validateAmount");
const { checkServiceEnabled } = require("../../../../middlewares/disableServiceCheck");
const { RAZORPAY_ACCESS_KEY } = require("../../../../utils/razorpayGateway");

router.post("/create-order", checkServiceEnabled(RAZORPAY_ACCESS_KEY), validateAmount, createOrder);
router.post("/complete", completePayment);

module.exports = router;
