const express = require("express");
const router = express.Router({ mergeParams: true });

router.use('/cashfree', require("./cashfree"))
router.use('/razorpay', require("./razorpay"))
router.use('/jri', require("./jri"))
router.use('/xoxoday', require("./xoxoday"))
router.use('/ccavenue', require("./ccavenue"))
router.use('/airpay', require("./airpay"))
router.use('/mswipe', require("./mswipe"))

module.exports = router
