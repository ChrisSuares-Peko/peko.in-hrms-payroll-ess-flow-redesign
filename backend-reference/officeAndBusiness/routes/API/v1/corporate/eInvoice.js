const express = require('express')
const { authEInvoice, generateIRN, cancelIRN, listEInvoices, getGstinDetails, logoutEInvoice, getEInvoiceDetails, getSessionStatus, downloadEInvoicePDF, getNextEInvoiceNo, getEInvoiceDashboard, getEInvoiceUsage } = require('../../../../controllers/corporate/eInvoice')
const { generateEwaybill, cancelEwaybill } = require('../../../../controllers/corporate/eWaybill')
const { verifyEInvoiceToken } = require('../../../../middlewares/verifyEInvoiceToken')
const { validateGenerateIRN, validateListEInvoices, validateGenerateEwaybill, validateCancelIRN, validateCancelEwaybill } = require('../../../../utils/apiValidation')
const router = express.Router({ mergeParams: true })

router.post('/auth', authEInvoice)
router.get('/session-status', getSessionStatus)
router.get('/usage', getEInvoiceUsage)

router.use(verifyEInvoiceToken)

// all routes below this require a valid eInvoice session (pass AuthToken header)
router.post('/logout', logoutEInvoice)
router.get('/dashboard', getEInvoiceDashboard)
router.get('/all', validateListEInvoices, listEInvoices)
router.get('/next-number', getNextEInvoiceNo)
router.get('/gstin/:gstin', getGstinDetails)
router.post('/generate-irn', validateGenerateIRN, generateIRN)
router.post('/cancel-irn/:id', validateCancelIRN,  cancelIRN)
router.get('/:id', getEInvoiceDetails)
router.get('/download-pdf/:id', downloadEInvoicePDF)
router.post('/generate-ewaybill/:id', validateGenerateEwaybill, generateEwaybill)
router.post('/cancel-ewaybill/:id', validateCancelEwaybill, cancelEwaybill)

module.exports = router
