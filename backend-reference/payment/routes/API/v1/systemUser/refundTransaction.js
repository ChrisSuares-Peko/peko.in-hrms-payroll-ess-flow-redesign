const express = require('express');
const { findRefundTransactions, refundAndUpdateOrder,getOtp } = require('../../../../controllers/admin/refundTransaction');
const { findRefundTransactionsValidation } = require('../../../../utils/queryValidation');
const router = express.Router()

router.get('/transactions',findRefundTransactionsValidation, findRefundTransactions);
router.put('/', refundAndUpdateOrder);
router.get('/otp', getOtp);

module.exports = router