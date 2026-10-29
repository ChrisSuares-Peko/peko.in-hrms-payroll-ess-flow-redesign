const express = require('express')
const { getIpAddress } = require('../../../../controllers/corporate/ipAddress')
const router = express.Router()


router.get('/', getIpAddress)
module.exports = router