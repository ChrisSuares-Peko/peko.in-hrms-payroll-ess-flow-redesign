const express = require('express')
const router = express.Router()
const { updateTransaction, reversePushJri } = require('../../../../controllers/corporate/telecomPayments/prepaid');

router.get('/prepaid/push-URL', updateTransaction);
router.get('/prepaid/reverse-url', reversePushJri);

module.exports = router