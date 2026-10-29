const express = require('express')
const router = express.Router()
const { digioReqest, digioCallback, verifyBothGstAndPan, verifyTaxId, savePanGst} = require('../../../../controllers/corporate/kyc')


router.post('/gstPanVerification', verifyTaxId)
router.post('/saveDocs', savePanGst)
// router.post('/panVerification', validatePAN)
router.post('/verify-both',verifyBothGstAndPan);
router.post('/digiLocker', digioReqest)
router.post('/digio/callback', digioCallback)

module.exports = router