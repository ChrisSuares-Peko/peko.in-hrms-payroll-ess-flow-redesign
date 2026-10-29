const express = require('express');
const router = express.Router({ mergeParams: true });
const { createOrder, completePayment } = require('../../../../controllers/corporate/airpayGateway');

router.post('/create-order', createOrder);
router.post('/complete', completePayment);

module.exports = router;
