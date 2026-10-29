const express = require('express')
const { createRequest, fetchHistory } = require('../../../../controllers/corporate/paytmBpos')
const router = express.Router()

router.post('/',createRequest)
router.get('/history',fetchHistory)

module.exports = router