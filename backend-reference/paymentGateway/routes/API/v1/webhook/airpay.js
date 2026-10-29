const express = require('express');
const router = express.Router({ mergeParams: true });
const { handleResponse, handleIpn } = require('../../../../controllers/corporate/airpayGateway');

// Browser return from the checkout iframe, and the server-to-server IPN
router.post('/response', handleResponse);
router.post('/ipn', handleIpn);

module.exports = router;
