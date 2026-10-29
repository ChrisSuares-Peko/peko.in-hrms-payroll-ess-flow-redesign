const express = require('express')
const { applyCoupon } = require('../../../../controllers/corporate/couponCode')
const { validateApplyCoupon } = require('../../../../utils/apiValidation')
const router = express.Router()

router.post('/', validateApplyCoupon, applyCoupon)

module.exports = router