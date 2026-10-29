const express = require("express");
const router = express.Router({ mergeParams: true });
const { handleXoxodayWebhook } = require("../../../../controllers/corporate/xoxodayWebhook");

router.post("/order-status", handleXoxodayWebhook);

module.exports = router;
