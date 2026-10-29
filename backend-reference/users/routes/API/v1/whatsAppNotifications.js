const express = require('express')
const router = express.Router()

const { addOrUpdateWhatsAppNumber, getWhatsAppNumbers, updateWhatsAppNumber, updateWhatsAppStatus, removeWhatsAppNumber, whatsAppNumberPDF, whatsAppNumberExcelCSV } = require('../../../controllers/admin/whatsappNotification');
const { validateWhatsAppNotificationPost, validateWhatsAppNotificationPut } = require('../../../utils/apiValidation');
const { validateGetWhatsAppNumbers } = require('../../../utils/queryValidation');
const { requireSystemUser } = require('../../../middlewares/requireSystemUser');

// Every route here reads or edits the platform's admin-alert numbers.
router.use(requireSystemUser)


router.post('/', validateWhatsAppNotificationPost, addOrUpdateWhatsAppNumber)
router.get('/',validateGetWhatsAppNumbers, getWhatsAppNumbers);
router.put('/', validateWhatsAppNotificationPut, updateWhatsAppNumber);
router.put('/whatsapp-status', updateWhatsAppStatus);
router.delete('/:whatsappNumber', removeWhatsAppNumber);
router.get('/download/pdf', whatsAppNumberPDF)
router.get('/download/:type',whatsAppNumberExcelCSV)

module.exports = router