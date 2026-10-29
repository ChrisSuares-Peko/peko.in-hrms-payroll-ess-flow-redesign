const express = require('express')
const router = express.Router()
const { getOtp } = require('../../../../controllers/admin/order.js')

const { findBulkTransactions, bulkRefundAndUpdateOrder } = require('../../../../controllers/admin/bulkRefund.js')

router.get('/transactions', findBulkTransactions)
router.get('/get-otp', getOtp)
router.put('/', bulkRefundAndUpdateOrder)

module.exports = router
