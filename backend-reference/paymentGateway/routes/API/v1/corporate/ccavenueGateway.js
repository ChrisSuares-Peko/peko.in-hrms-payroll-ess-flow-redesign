const express = require('express');
const router = express.Router({ mergeParams: true });
const { initiatePayment, completePayment } = require('../../../../controllers/corporate/ccavenueGateway');

router.post('/initiate', initiatePayment);
router.post('/complete', completePayment);

module.exports = router;
