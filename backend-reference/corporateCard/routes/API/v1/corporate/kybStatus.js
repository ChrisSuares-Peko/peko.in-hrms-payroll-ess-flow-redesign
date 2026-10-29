const router = require('express').Router({ mergeParams: true })
const { verifyCorporateAdmin } = require('../../../../middlewares/verifyCorporateAdmin')
const { getKybStatus, getDocumentChecklist, saveBusinessType, submitKyb, reopenKyb, completeKyb } = require('../../../../controllers/corporate/kybStatus')

const {
    getAgreement,
    downloadAgreementTemplate,
    saveAgreement,
    setSignMethod,
    sendAgreementForEsign,
} = require('../../../../controllers/corporate/corporateAgreement')

router.get('/document-checklist', getDocumentChecklist)
router.get('/agreement/template', verifyCorporateAdmin, downloadAgreementTemplate)
router.get('/agreement', verifyCorporateAdmin, getAgreement)
router.put('/agreement', verifyCorporateAdmin, saveAgreement)
router.post('/agreement/sign-method', verifyCorporateAdmin, setSignMethod)
router.post('/agreement/send-for-esign', verifyCorporateAdmin, sendAgreementForEsign)
router.get('/', getKybStatus)
router.put('/business-type', verifyCorporateAdmin, saveBusinessType)
router.post('/initiate', verifyCorporateAdmin, submitKyb)
router.post('/reopen', verifyCorporateAdmin, reopenKyb)
router.post('/complete', verifyCorporateAdmin, completeKyb)

module.exports = router
