const express = require('express')
const { eSignRequest, findAllESignDocsAndCount ,findOneESignDetails, resendIndividualInvitationWithUpdateEmail,getCountESignDocs, downloadESignDocument} = require('../../../../controllers/corporate/eSign')
// const { validateDocketCreation,validateResendInvitation, validateEmailEsign } = require('../../../../utils/apiValidation')
const { validateResendInvitation } = require('../../../../utils/apiValidation')
const router = express.Router({ mergeParams: true })
const operatorsData = require("../../../../utils/operatorsData.json");
const { verifyUser } = require('../../../../middlewares/verifySubCorporate');
const { requireSubscriptionAccess } = require('../../../../middlewares/requireSubscriptionAccess');
const accesskey = operatorsData['eSign']['accessKey']

router.use(verifyUser('eSign')); 
router.use(requireSubscriptionAccess(accesskey));

// router.post('/sign-request', validateDocketCreation,validateEmailEsign, eSignRequest)
router.post('/sign-request', eSignRequest)
router.get('/find-all', findAllESignDocsAndCount)//for individual corporate only
router.get('/find', findOneESignDetails)//for individual corporate only
router.get('/count', getCountESignDocs);


router.post('/resend-invitation', validateResendInvitation, resendIndividualInvitationWithUpdateEmail)
router.get('/download-document', downloadESignDocument)



module.exports = router