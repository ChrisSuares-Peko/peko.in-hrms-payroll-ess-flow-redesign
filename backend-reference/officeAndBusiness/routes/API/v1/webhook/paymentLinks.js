const express = require('express')
const { paymentLinkCallback } = require('../../../../controllers/corporate/paymentLinks')
const { handleKYBWebhook } = require('../../../../controllers/corporate/paymentLinkKYB')

const router = express.Router({ mergeParams: true })

// router.post('/update-status', handleWebhook)
router.post('/kyb', handleKYBWebhook)
router.post('/update', paymentLinkCallback)


module.exports = router