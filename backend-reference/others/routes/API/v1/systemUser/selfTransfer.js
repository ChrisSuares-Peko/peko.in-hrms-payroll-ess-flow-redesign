const express = require('express')
const router = express.Router()

const { selfTransfer } = require('../../../../controllers/admin/selfTransfer')
const { validateSelfTransfer } = require('../../../../utils/apiValidation')

router.post('/', validateSelfTransfer, selfTransfer)//✅
module.exports = router
