const express = require('express');
const { handleNupayWebhook } = require('../../../../controllers/corporate/nupayWebhook');
const router = express.Router({ mergeParams: true });

router.post('/callback', handleNupayWebhook);

module.exports = router;
