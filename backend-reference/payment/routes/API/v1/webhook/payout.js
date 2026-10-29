const express = require("express");
const router = express.Router({ mergeParams: true });
const { payoutWebhookHandler } = require("../../../../controllers/webhook/payoutWebhook");

router.post("/update", payoutWebhookHandler);

module.exports = router;
