const express = require('express')
const router = express.Router()
const {
  createGuideline,
  updateGuideline,
  getAllGuidelines,
  bulkUpdateGuideline,
  updateGuidelines,
  sendReminder,
  cancelReminder,
  getReminderDashboard,
} = require('../../../../controllers/corporate/invoiceGuideline')
const { validateInvoiceGuidelineBulkCreate, validateInvoiceGuidelineBulkUpdate } = require('../../../../utils/apiValidation')
router.get('/dashboard', getReminderDashboard)
router.post('/', validateInvoiceGuidelineBulkCreate, createGuideline)
router.patch('/:id', updateGuideline)
router.patch('/:id/cancel', cancelReminder)
router.post('/:id/send', sendReminder)
router.put('/', validateInvoiceGuidelineBulkCreate, bulkUpdateGuideline)
router.get('/:invoiceId', getAllGuidelines)
router.put('/update-guideline', validateInvoiceGuidelineBulkUpdate, updateGuidelines)

module.exports = router
