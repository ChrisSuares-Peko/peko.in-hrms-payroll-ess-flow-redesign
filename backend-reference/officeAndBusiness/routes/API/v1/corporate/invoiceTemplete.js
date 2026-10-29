const express = require('express')
const router = express.Router()
const { getAllTemplete } = require('../../../../controllers/corporate/invoiceTemplete')

router.get('/', getAllTemplete)
module.exports = router