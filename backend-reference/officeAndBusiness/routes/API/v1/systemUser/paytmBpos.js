const express = require('express')
const { findAllRequestAndCount, updateStatus } = require('../../../../controllers/admin/paytmBpos')
const router = express.Router()

router.get('/', findAllRequestAndCount)
router.post('/update-status/:id', updateStatus)

module.exports = router