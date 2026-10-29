const express = require('express');
const { handleStatusUpdate } = require('../../../../controllers/corporate/companyIncorporationWebhook');
const router = express.Router({ mergeParams: true });

router.post('/status', handleStatusUpdate);

module.exports = router;
