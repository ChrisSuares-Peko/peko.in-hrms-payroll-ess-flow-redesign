const express = require('express')
const { updateESignStatus, updateESignAuditTrail } = require('../../../../controllers/corporate/eSignWebhook')
const router = express.Router({ mergeParams: true })


router.post('/update-status', updateESignStatus)
router.post('/update-audit-trail', updateESignAuditTrail) // to update E-sign certificate of authenticity


module.exports = router