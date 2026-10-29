const express = require('express')
const { alterproductTour } = require('../../../../controllers/corporate/productTour')
const router = express.Router()

router.put('/',alterproductTour)//✅

module.exports = router