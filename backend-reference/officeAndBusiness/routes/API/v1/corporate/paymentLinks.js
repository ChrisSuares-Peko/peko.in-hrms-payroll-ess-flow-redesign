const express = require('express')
const {  createPaymentLinkUrl, findAllPaymentLinksAndCount, resendPaymentLink, completeKyb } = require('../../../../controllers/corporate/paymentLinks')
const { validateCreatePaymentLink } = require('../../../../utils/apiValidation')
const {sendPaymentLinkAgreement,getAgreementDetails } =require('../../../../controllers/corporate/paymentLinks');

const { validateSendEsignRequest } = require("../../../../utils/apiValidations/invoice");

const router = express.Router()

router.get('/all',findAllPaymentLinksAndCount)
router.post('/create-link',validateCreatePaymentLink,createPaymentLinkUrl)
router.get('/resend-link/:id', resendPaymentLink)
router.get('/get-agreement', getAgreementDetails)
router.post('/send-agreement', validateSendEsignRequest, sendPaymentLinkAgreement)
router.post('/complete-kyb', completeKyb )



module.exports = router