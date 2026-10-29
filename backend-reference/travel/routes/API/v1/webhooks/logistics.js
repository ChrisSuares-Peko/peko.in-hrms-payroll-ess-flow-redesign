const express = require('express');
const { handleVendorWebhookOrderStatus } = require('../../../../controllers/corporate/logistics_V3');
const router = express.Router()

router.post('/shipment-status', handleVendorWebhookOrderStatus);

module.exports = router;