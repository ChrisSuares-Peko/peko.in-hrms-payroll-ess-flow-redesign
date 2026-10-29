const express = require('express');
const router = express.Router();
const { listCancellationRequests, processRefund, getOrderDetails } = require('../../../../controllers/admin/domainAndHosting');

router.get('/cancellation-requests', listCancellationRequests);
router.get('/order/:corporateTxnId', getOrderDetails);
router.post('/refund', processRefund);

module.exports = router;
