const express = require('express');
const {
  verifyPayment,
  verifyEnachExecutionWebhook,
  verifyEnachMandate,
} = require('../../../../controllers/corporate/paymentLinks');
const router = express.Router({mergeParams:true});

router.post("/payment-links/verify-payment",verifyPayment)
router.post("/enach-mandate/execution/verify-payment", verifyEnachExecutionWebhook)
router.get("/enach-mandate/verify-payment",verifyEnachMandate)
router.use("/payout", require("./payout"));
router.post("/settlement/callback", require("../../../../controllers/webhook/settlementWebhook").settlementWebhookHandler);

module.exports = router;
