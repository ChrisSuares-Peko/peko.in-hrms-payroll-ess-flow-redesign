const express = require('express')
const { getBulkPaymentStatus ,getBulkPaymentData} = require('../../../../controllers/corporate/bulkPayment');
const router = express.Router();

//for all bulk bill payments
// router.get('/balance/bulk', bulkBalance)
// router.post('/payment', validateBulkPayment, payment)
router.get('/status/:batchId', getBulkPaymentStatus)
router.get('/bulkPaymentData/:esimStoredBatchId',getBulkPaymentData)




module.exports = router