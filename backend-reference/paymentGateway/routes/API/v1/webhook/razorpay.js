const express = require("express");
const router = express.Router({ mergeParams: true });
const { handleWebhook } = require("../../../../controllers/corporate/razorpayGateway");

// Signature is an HMAC over the raw body — app.js keeps req.rawBody for this path.
router.post("/", handleWebhook);

module.exports = router;
