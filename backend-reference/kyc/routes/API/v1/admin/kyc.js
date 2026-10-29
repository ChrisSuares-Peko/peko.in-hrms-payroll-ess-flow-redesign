const express = require('express')
const router = express.Router()
const { verifyTaxId, savePanGst} = require('../../../../controllers/corporate/kyc')

router.post('/gstPanVerification', verifyTaxId)
router.post('/saveDocs', savePanGst)

module.exports = router