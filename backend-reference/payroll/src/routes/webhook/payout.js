const express = require('express');
const router = express.Router({ mergeParams: true });
const { payoutWebhookHandler } = require('../../controller/webhook/payoutWebhook');

router.post('/update', payoutWebhookHandler);

module.exports = router;
