const express = require('express')
const router = express.Router()
const { handlePaytmCallback, createOrder } = require('../../../../controllers/corporate/paytmGateway');

router.post('/create-order', createOrder)
router.post('/complete',handlePaytmCallback)
module.exports = router