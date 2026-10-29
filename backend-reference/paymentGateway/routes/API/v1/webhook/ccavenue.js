const express = require('express');
const router = express.Router({ mergeParams: true });
const { handleResponse } = require('../../../../controllers/corporate/ccavenueGateway');

// CCAvenue POSTs encrypted result here after payment (redirect_url / cancel_url)
router.post('/response', handleResponse);

module.exports = router;
