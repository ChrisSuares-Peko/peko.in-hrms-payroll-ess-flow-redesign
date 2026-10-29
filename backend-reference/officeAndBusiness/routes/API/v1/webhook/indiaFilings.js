const express = require('express');

const webhookAuth = require('../../../../middlewares/indiaFilingsWebhookAuth');
const { handleStatusUpdate } = require('../../../../controllers/corporate/indiaFilingsWebhook');

const router = express.Router({ mergeParams: true });

router.post('/callback', webhookAuth('business_registration'), handleStatusUpdate);

module.exports = router;
