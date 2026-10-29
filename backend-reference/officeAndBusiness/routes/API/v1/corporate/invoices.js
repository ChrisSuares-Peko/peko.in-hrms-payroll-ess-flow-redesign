/**
 * Created by Ubair Noor.
 */

const express = require('express')
const router = express.Router({mergeParams:true})
const {
  createInvoice,
  findAllInvoicesAndCount,
  sendInvoiceToEmail,
  findOneBankAccount,
  getInvoice,
  downloadInvoice,
  updateStatus,
  getDashboardData,
  findCorporateDetails,
  isInvoiceIdAvailabe
} = require('../../../../controllers/corporate/invoices')
const {
  // createLink,
  send,
  createLink,
} = require('../../../../controllers/corporate/quikLinks')
const upload = require('../../../../middlewares/multer')
const { validateInvoiceCreate, validateInvoiceDownload, validateInvoiceSendEmail, validateInvoiceStatusChange, validateInvoiceGetPaymentLink } = require('../../../../utils/apiValidation')
const { uploadInvoiceAndFetchData } = require('../../../../controllers/corporate/ocr')

router.post('/',validateInvoiceCreate, createInvoice)
router.get('/validate-invoiceId/:invoiceId', isInvoiceIdAvailabe); // for app team;
router.patch('/:id',validateInvoiceStatusChange, updateStatus)
router.get('/invoice/:id', getInvoice)
router.get('/findBankAccount', findOneBankAccount)
router.get("/corporateDetails", findCorporateDetails);
router.get('/all', findAllInvoicesAndCount)
router.get('/dashboard', getDashboardData);
router.post('/getLink',validateInvoiceGetPaymentLink, createLink)
router.post('/sendMail', send)
router.post('/sendEmail', validateInvoiceSendEmail, sendInvoiceToEmail)
router.post('/downloadInvoice',validateInvoiceDownload, downloadInvoice)

router.post('/upload-invoice',upload.single("file"), uploadInvoiceAndFetchData);
 

module.exports = router